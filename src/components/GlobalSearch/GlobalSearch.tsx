import { useState, useEffect, useRef, useMemo, useId } from 'react';
import { createPortal } from 'react-dom';
import { useBookmarkStore, useQuickLinkStore, useRecentVisitsStore, useSettingsStore } from '../../stores';
import { useBookmarkAdapter } from '../../hooks/useBookmarkAdapter';
import { FaviconImage } from '../FaviconImage';
import { useTranslation } from '../../i18n';
import styles from './GlobalSearch.module.css';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  url: string;
  type: 'bookmark' | 'quicklink';
  icon?: string;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const { bookmarks, mode, isLoading, error } = useBookmarkAdapter();
  const { quickLinks } = useQuickLinkStore();
  const addVisit = useRecentVisitsStore(state => state.addVisit);
  const incrementVisitCount = useBookmarkStore(state => state.incrementVisitCount);
  const recentVisitsMode = useSettingsStore(state => state.settings.recentVisitsMode);
  const resultsId = useId();

  // 合并所有可搜索项
  const allItems: SearchItem[] = useMemo(() => {
    const items: SearchItem[] = [];

    bookmarks.forEach(b => {
      items.push({
        id: b.id,
        title: b.title,
        url: b.url,
        type: 'bookmark',
        icon: b.icon,
      });
    });

    quickLinks.forEach(l => {
      items.push({
        id: l.id,
        title: l.title,
        url: l.url,
        type: 'quicklink',
        icon: l.icon,
      });
    });

    return items;
  }, [bookmarks, quickLinks]);

  // 过滤结果
  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 10);

    const lowerQuery = query.trim().toLowerCase();
    return allItems
      .filter(item =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.url.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 10);
  }, [query, allItems]);
  const activeIndex = Math.max(0, Math.min(selectedIndex, filteredItems.length - 1));

  const trackVisit = (item: SearchItem) => {
    if (recentVisitsMode === 'custom') addVisit(item.url, item.title);
    if (mode === 'local' && item.type === 'bookmark') incrementVisitCount(item.id);
  };

  // 打开时聚焦输入框
  useEffect(() => {
    if (isOpen) {
      const previousFocus = document.activeElement as HTMLElement | null;
      setQuery('');
      setSelectedIndex(0);
      inputRef.current?.focus();
      return () => { if (previousFocus?.isConnected) previousFocus.focus(); };
    }
  }, [isOpen]);

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(Math.min(activeIndex + 1, Math.max(0, filteredItems.length - 1)));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(Math.max(activeIndex - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredItems[activeIndex]) {
          trackVisit(filteredItems[activeIndex]);
          window.location.href = filteredItems[activeIndex].url;
        }
        break;
    }
  };

  // 滚动选中项到可视区域
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const selectedEl = list.children[activeIndex] as HTMLElement;
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.container}
        role="dialog"
        aria-modal="true"
        aria-label={t.search.globalPlaceholder}
        onClick={e => e.stopPropagation()}
        onKeyDown={e => {
          if (e.key === 'Escape' && !e.nativeEvent.isComposing) {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }
        }}
      >
        <div className={styles.inputWrapper}>
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            placeholder={t.search.globalPlaceholder}
            aria-label={t.search.globalPlaceholder}
            role="combobox"
            aria-expanded="true"
            aria-controls={resultsId}
            aria-autocomplete="list"
            aria-activedescendant={filteredItems.length ? `${resultsId}-${activeIndex}` : undefined}
            onKeyDown={handleKeyDown}
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <kbd className={styles.escHint}>ESC</kbd>
        </div>

        <div className={styles.results} ref={listRef} id={resultsId} role="listbox" aria-label={t.search.globalPlaceholder}>
          {filteredItems.length === 0 ? (
            <div className={styles.empty} role="status">{isLoading ? t.common.loading : error || t.common.noData}</div>
          ) : (
            filteredItems.map((item, index) => (
              <a
                key={`${item.type}-${item.id}`}
                id={`${resultsId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                href={item.url}
                className={`${styles.item} ${index === activeIndex ? styles.selected : ''}`}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => trackVisit(item)}
              >
                <div className={styles.itemIcon}>
                  <FaviconImage url={item.url} title={item.title} size={24} />
                </div>
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>{item.title}</span>
                  <span className={styles.itemUrl}>{item.url}</span>
                </div>
                <span className={styles.itemType}>
                  {item.type === 'bookmark' ? t.bookmarks.title : t.quickLinks.title}
                </span>
              </a>
            ))
          )}
        </div>

        <div className={styles.footer}>
          <span className={styles.hint}>
            <kbd>↑</kbd><kbd>↓</kbd> {t.common.search}
          </span>
          <span className={styles.hint}>
            <kbd>↵</kbd> {t.common.confirm}
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
