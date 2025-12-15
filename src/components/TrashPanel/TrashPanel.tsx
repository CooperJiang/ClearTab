import { useMemo } from 'react';
import { useTrashStore, useBookmarkStore, useBookmarkMetadataStore, useSettingsStore } from '../../stores';
import { Button, Switch, Select } from '../ui';
import { useTranslation } from '../../i18n';
import type { Bookmark, Category } from '../../types';
import type { TrashItem } from '../../stores/useTrashStore';
import { useToast } from '../ui/Toast';
import ChromeBookmarkService from '../../services/chromeBookmarkService';
import type { BookmarkMode } from '../../hooks/useBookmarkAdapter';
import styles from './TrashPanel.module.css';

// 按天分组的类型
interface DayGroup {
  date: string;
  label: string;
  items: TrashItem[];
}

export function TrashPanel() {
  const { items, settings, updateSettings, addToTrash, removeFromTrash, restoreItem, clearTrash, cleanExpiredItems } = useTrashStore();
  const { addBookmark, addCategory } = useBookmarkStore();
  const setBookmarkMetadata = useBookmarkMetadataStore((state) => state.setMetadata);
  const activeBookmarkMode = useSettingsStore(
    (state) => (state.settings.bookmarkMode as BookmarkMode) || 'chrome'
  );
  const { t } = useTranslation();
  const { showToast } = useToast();
  const browserApiAvailable = ChromeBookmarkService.isAvailable();

  // 清理过期项目
  useMemo(() => {
    cleanExpiredItems();
  }, [cleanExpiredItems]);

  // 计算剩余天数
  const getRemainingDays = (deletedAt: number) => {
    const now = Date.now();
    const expireAt = deletedAt + settings.retentionDays * 24 * 60 * 60 * 1000;
    const remaining = Math.ceil((expireAt - now) / (24 * 60 * 60 * 1000));
    return Math.max(0, remaining);
  };

  // 格式化日期标签
  const formatDateLabel = (date: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (itemDate.getTime() === today.getTime()) {
      return t.settings.trash.today;
    } else if (itemDate.getTime() === yesterday.getTime()) {
      return t.settings.trash.yesterday;
    } else {
      // 格式化为 MM/DD
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  };

  const filteredItems = useMemo(
    () => items.filter((item) => item.mode === activeBookmarkMode),
    [items, activeBookmarkMode]
  );

  // 按天分组
  const groupedItems = useMemo((): DayGroup[] => {
    const groups: Map<string, TrashItem[]> = new Map();

    // 按删除日期分组
    filteredItems.forEach((item) => {
      const date = new Date(item.deletedAt);
      const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(item);
    });

    // 转换为数组并排序（最新的在前）
    const result: DayGroup[] = [];
    groups.forEach((groupItems, dateKey) => {
      const [year, month, day] = dateKey.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      result.push({
        date: dateKey,
        label: formatDateLabel(date),
        items: groupItems.sort((a, b) => b.deletedAt - a.deletedAt),
      });
    });

    // 按日期降序排序
    return result.sort((a, b) => {
      const dateA = new Date(a.date.replace(/-/g, '/')).getTime();
      const dateB = new Date(b.date.replace(/-/g, '/')).getTime();
      return dateB - dateA;
    });
  }, [filteredItems, t]);

  const restoreBrowserBookmark = async (item: TrashItem): Promise<boolean> => {
    const bookmark = item.data as Bookmark;
    if (!browserApiAvailable) {
      showToast(t.settings.trash.browserUnavailable, 'error');
      return false;
    }

    if (!bookmark.url) {
      showToast(t.settings.trash.browserMissingUrl, 'error');
      return false;
    }

    const parentId =
      item.browserParentId && item.browserParentId !== 'all' ? item.browserParentId : undefined;

    try {
      const created = await ChromeBookmarkService.addBookmark(
        bookmark.title,
        bookmark.url,
        parentId || '1'
      );

      if (item.browserMetadata) {
        const { chromeId: _oldId, ...metadata } = item.browserMetadata;
        setBookmarkMetadata(created.id, {
          ...metadata,
          chromeId: created.id,
        });
      }

      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error || t.settings.trash.browserRestoreFailed);
      showToast(`${t.settings.trash.browserRestoreFailed}: ${message}`, 'error');
      return false;
    }
  };

  const restoreTrashItem = async (item: TrashItem): Promise<boolean> => {
    if (item.type === 'bookmark') {
      if (item.mode === 'chrome') {
        return restoreBrowserBookmark(item);
      }
      addBookmark(item.data as Bookmark);
      return true;
    }

    if (item.type === 'category') {
      if (item.mode === 'chrome') {
        showToast(t.settings.trash.browserCategoryUnsupported, 'warning');
        return false;
      }

      const category = item.data as Category;
      addCategory(category);
      if (item.relatedBookmarks?.length) {
        item.relatedBookmarks.forEach((bookmark) => {
          addBookmark(bookmark);
        });
      }
      return true;
    }

    return false;
  };

  // 恢复单个项目
  const handleRestore = async (id: string) => {
    const item = restoreItem(id);
    if (!item) return;

    const success = await restoreTrashItem(item);
    if (!success) {
      addToTrash(item);
    }
  };

  // 恢复一组项目（按天）
  const handleRestoreGroup = async (groupItems: TrashItem[]) => {
    for (const item of groupItems) {
      await handleRestore(item.id);
    }
  };

  // 恢复全部
  const handleRestoreAll = async () => {
    // 复制一份，因为恢复会修改原数组
    const allItems = [...filteredItems];
    for (const item of allItems) {
      await handleRestore(item.id);
    }
  };

  // 永久删除
  const handlePermanentDelete = (id: string) => {
    removeFromTrash(id);
  };

  // 保留天数选项
  const retentionOptions = [
    { value: '7', label: '7 days' },
    { value: '15', label: '15 days' },
    { value: '30', label: '30 days' },
    { value: '60', label: '60 days' },
    { value: '90', label: '90 days' },
  ];

  return (
    <div className={styles.container}>
      {/* 设置区域 */}
      <div className={styles.settingsSection}>
        <h4 className={styles.sectionTitle}>{t.settings.trash.settings}</h4>

        <div className={styles.settingItem}>
          <div className={styles.settingLabel}>
            <span>{t.settings.trash.enabled}</span>
            <span className={styles.settingDesc}>{t.settings.trash.enabledDesc}</span>
          </div>
          <Switch
            checked={settings.enabled}
            onChange={(checked) => updateSettings({ enabled: checked })}
          />
        </div>

        <div className={styles.settingItem}>
          <div className={styles.settingLabel}>
            <span>{t.settings.trash.recycleBookmarks}</span>
          </div>
          <Switch
            checked={settings.recycleBookmarks}
            onChange={(checked) => updateSettings({ recycleBookmarks: checked })}
            disabled={!settings.enabled}
          />
        </div>

        <div className={styles.settingItem}>
          <div className={styles.settingLabel}>
            <span>{t.settings.trash.recycleCategories}</span>
          </div>
          <Switch
            checked={settings.recycleCategories}
            onChange={(checked) => updateSettings({ recycleCategories: checked })}
            disabled={!settings.enabled}
          />
        </div>

        <div className={styles.settingItem}>
          <div className={styles.settingLabel}>
            <span>{t.settings.trash.retentionDays}</span>
          </div>
          <div className={styles.selectWrapper}>
            <Select
              value={String(settings.retentionDays)}
              options={retentionOptions}
              onChange={(value) => updateSettings({ retentionDays: Number(value) })}
            />
          </div>
        </div>
      </div>

      {/* 回收站内容 */}
      <div className={styles.trashSection}>
        <div className={styles.trashHeader}>
          <h4 className={styles.sectionTitle}>{t.settings.trash.content} ({filteredItems.length})</h4>
          {filteredItems.length > 0 && (
            <div className={styles.headerActions}>
              <Button
                variant="secondary"
                size="small"
                onClick={() => void handleRestoreAll()}
              >
                {t.settings.trash.restoreAll}
              </Button>
              <Button
                variant="ghost"
                size="small"
                onClick={() => clearTrash()}
              >
                {t.settings.trash.clear}
              </Button>
            </div>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div className={styles.emptyState}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <p>{t.settings.trash.empty}</p>
          </div>
        ) : (
          <div className={styles.trashList}>
            {groupedItems.map((group) => (
              <div key={group.date} className={styles.dayGroup}>
                <div className={styles.dayHeader}>
                  <span className={styles.dayLabel}>{group.label}</span>
                  <span className={styles.dayCount}>{group.items.length} {t.settings.trash.itemsCount}</span>
                  <button
                    className={styles.restoreGroupButton}
                    onClick={() => void handleRestoreGroup(group.items)}
                    title={t.settings.trash.restoreDay}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                    {t.settings.trash.restoreDay}
                  </button>
                </div>
                <div className={styles.dayItems}>
                  {group.items.map((item) => (
                    <div key={item.id} className={styles.trashItem}>
                      <div className={styles.itemInfo}>
                        <div className={styles.itemIcon}>
                          {item.type === 'bookmark' ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            </svg>
                          )}
                        </div>
                        <div className={styles.itemDetails}>
                          <span className={styles.itemName}>
                            {item.type === 'bookmark'
                              ? (item.data as Bookmark).title
                              : (item.data as Category).name}
                          </span>
                          <span className={styles.itemMeta}>
                            {item.type === 'category' && item.relatedBookmarks
                              ? `${t.settings.trash.category} · ${item.relatedBookmarks.length} ${t.settings.trash.bookmarksCount}`
                              : t.settings.trash.bookmark}
                            {' · '}
                            {getRemainingDays(item.deletedAt)} {t.settings.trash.daysRemaining}
                          </span>
                        </div>
                      </div>
                      <div className={styles.itemActions}>
                        <button
                          className={styles.restoreButton}
                          onClick={() => void handleRestore(item.id)}
                          title={
                            item.mode === 'chrome' && !browserApiAvailable
                              ? t.settings.trash.browserUnavailable
                              : t.settings.trash.restore
                          }
                          disabled={item.mode === 'chrome' && !browserApiAvailable}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="1 4 1 10 7 10" />
                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                          </svg>
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => handlePermanentDelete(item.id)}
                          title={t.settings.trash.permanentDelete}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
