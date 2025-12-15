import { useCallback } from 'react';
import { useRecentVisits } from '../../hooks/useRecentVisits';
import { FaviconImage } from '../FaviconImage';
import { useTranslation } from '../../i18n';
import { useSettingsStore, useRecentVisitsStore } from '../../stores';
import { ContextMenu, type ContextMenuItem } from '../ui';
import styles from './RecentVisits.module.css';

export function RecentVisits() {
  const settings = useSettingsStore((state) => state.settings);
  const addVisit = useRecentVisitsStore((state) => state.addVisit);
  const removeVisit = useRecentVisitsStore((state) => state.removeVisit);

  const { recentVisits, isLoading, error } = useRecentVisits({
    limit: settings.recentVisitsCount,
  });
  const { t } = useTranslation();

  // 处理拖拽开始
  const handleDragStart = useCallback((e: React.DragEvent, title: string, url: string) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', `external:${JSON.stringify({ title, url })}`);
  }, []);

  // 点击链接时记录访问（用于自定义模式）
  const handleClick = useCallback((title: string, url: string) => {
    if (settings.recentVisitsMode === 'custom') {
      addVisit(url, title);
    }
  }, [settings.recentVisitsMode, addVisit]);

  // 右键菜单项
  const getContextMenuItems = useCallback((visitId: string, url: string): ContextMenuItem[] => [
    {
      id: 'open-new-tab',
      label: '新标签页打开',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      ),
      onClick: () => window.open(url, '_blank'),
    },
    { id: 'divider', label: '', divider: true },
    {
      id: 'delete',
      label: t.common.delete,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      ),
      danger: true,
      onClick: () => removeVisit(visitId),
    },
  ], [t.common.delete, removeVisit]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>{t.recentVisits.title}</h3>
        <div className={styles.list}>
          {Array.from({ length: Math.min(settings.recentVisitsCount, 8) }).map((_, i) => (
            <div key={i} className={`${styles.item} ${styles.skeleton}`}>
              <div className={styles.icon} />
              <span className={styles.name} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 如果有错误或无数据，不显示该模块
  if (error || recentVisits.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{t.recentVisits.title}</h3>
      <div className={styles.list}>
        {recentVisits.map((visit) => (
          <ContextMenu key={visit.id} items={getContextMenuItems(visit.id, visit.url)}>
            <a
              href={visit.url}
              className={styles.item}
              title={visit.title}
              draggable
              onDragStart={(e) => handleDragStart(e, visit.title, visit.url)}
              onClick={() => handleClick(visit.title, visit.url)}
            >
              <div className={styles.icon}>
                <FaviconImage url={visit.url} title={visit.title} color="#6366f1" size={16} />
              </div>
              <span className={styles.name}>{visit.title}</span>
            </a>
          </ContextMenu>
        ))}
      </div>
    </div>
  );
}
