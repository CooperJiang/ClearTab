import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useBookmarkStore, useQuickLinkStore } from '../../stores';
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

  const { bookmarks } = useBookmarkStore();
  const { quickLinks } = useQuickLinkStore();

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

    const lowerQuery = query.toLowerCase();
    return allItems
      .filter(item =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.url.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 10);
  }, [query, allItems]);

  // 打开时聚焦输入框
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, filteredItems.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            window.location.href = filteredItems[selectedIndex].url;
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  // 滚动选中项到可视区域
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const selectedEl = list.children[selectedIndex] as HTMLElement;
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={e => e.stopPropagation()}>
        <div className={styles.inputWrapper}>
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            placeholder={t.search.placeholder}
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <kbd className={styles.escHint}>ESC</kbd>
        </div>

        <div className={styles.results} ref={listRef}>
          {filteredItems.length === 0 ? (
            <div className={styles.empty}>{t.common.noData}</div>
          ) : (
            filteredItems.map((item, index) => (
              <a
                key={item.id}
                href={item.url}
                className={`${styles.item} ${index === selectedIndex ? styles.selected : ''}`}
                onMouseEnter={() => setSelectedIndex(index)}
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
