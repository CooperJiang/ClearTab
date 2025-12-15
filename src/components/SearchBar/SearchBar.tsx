import { useState, useRef, useEffect, useMemo, type CSSProperties } from 'react';
import { getEnabledEngines, getAllEngines } from '../../types';
import { useSettingsStore, useSearchHistoryStore } from '../../stores';
import { SearchEngineModal } from '../SearchEngineModal';
import { useTranslation } from '../../i18n';
import styles from './SearchBar.module.css';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHistoryClosing, setIsHistoryClosing] = useState(false);
  const { settings, updateSettings } = useSettingsStore();
  const { history, addHistory, removeHistory, clearHistory } = useSearchHistoryStore();
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 搜索栏自定义样式
  const containerStyle: CSSProperties = {
    maxWidth: settings.searchBarWidth ?? 560,
  };

  const searchBarStyle: CSSProperties = {
    height: settings.searchBarHeight ?? 44,
    borderRadius: settings.searchBarBorderRadius ?? 10,
    opacity: settings.searchBarOpacity ?? 1,
  };

  // 获取所有引擎（包含自定义）
  const allEngines = getAllEngines(settings.customSearchEngines);

  // 获取启用的搜索引擎
  const enabledEngines = getEnabledEngines(settings.enabledSearchEngines, settings.customSearchEngines);

  const currentEngine = allEngines.find(
    (e) => e.id === settings.defaultSearchEngine
  ) || enabledEngines[0] || allEngines[0];

  // 页面加载时自动聚焦
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 全局快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        const activeElement = document.activeElement;
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 过滤历史记录（根据输入）
  const filteredHistory = useMemo(() => {
    if (!query.trim()) {
      return history.slice(0, 8);
    }
    return history
      .filter((item) => item.query.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 8);
  }, [history, query]);

  // 关闭面板（带动画）
  const closePanel = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsPanelOpen(false);
      setIsClosing(false);
    }, 150);
  };

  // 关闭历史面板（带动画）
  const closeHistory = () => {
    setIsHistoryClosing(true);
    setTimeout(() => {
      setIsHistoryOpen(false);
      setIsHistoryClosing(false);
    }, 150);
  };

  // 点击外部关闭面板
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (isPanelOpen && !isClosing) {
          closePanel();
        }
        if (isHistoryOpen && !isHistoryClosing) {
          closeHistory();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPanelOpen, isClosing, isHistoryOpen, isHistoryClosing]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // 添加到搜索历史
      addHistory(query.trim(), currentEngine.id);
      window.location.href = currentEngine.url + encodeURIComponent(query.trim());
    }
  };

  // 点击历史记录项
  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    closeHistory();
    // 直接搜索
    addHistory(historyQuery, currentEngine.id);
    window.location.href = currentEngine.url + encodeURIComponent(historyQuery);
  };

  // 删除单条历史记录
  const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeHistory(id);
  };

  // 输入框获得焦点时显示历史
  const handleInputFocus = () => {
    if (settings.showSearchHistory && history.length > 0 && !isPanelOpen) {
      setIsHistoryOpen(true);
    }
  };

  // 输入框内容变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (settings.showSearchHistory && !isHistoryOpen && history.length > 0 && !isPanelOpen) {
      setIsHistoryOpen(true);
    }
  };

  const handleEngineSelect = (engineId: string) => {
    updateSettings({ defaultSearchEngine: engineId });
    closePanel();
    inputRef.current?.focus();
  };

  const togglePanel = () => {
    if (isPanelOpen) {
      closePanel();
    } else {
      setIsPanelOpen(true);
      // 打开引擎面板时关闭历史面板
      if (isHistoryOpen) {
        closeHistory();
      }
    }
  };

  const handleAddClick = () => {
    closePanel();
    setIsModalOpen(true);
  };

  const handleDeleteEngine = (e: React.MouseEvent, engineId: string) => {
    e.stopPropagation();
    if (enabledEngines.length <= 1) return;

    const newIds = settings.enabledSearchEngines.filter(id => id !== engineId);
    updateSettings({ enabledSearchEngines: newIds });

    // 如果删除的是当前选中的引擎，切换到第一个
    if (settings.defaultSearchEngine === engineId) {
      updateSettings({ defaultSearchEngine: newIds[0] });
    }
  };

  return (
    <div className={styles.searchContainer} ref={containerRef} style={containerStyle}>
      <form className={styles.searchBar} onSubmit={handleSearch} style={searchBarStyle}>
        <button
          type="button"
          className={styles.engineButton}
          onClick={togglePanel}
        >
          {currentEngine.icon && (
            <img src={currentEngine.icon} alt={currentEngine.name} className={styles.currentEngineIcon} />
          )}
        </button>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder={t.search.placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
        />
        <button type="submit" className={styles.submitButton}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </form>

      {isPanelOpen && (
        <div className={`${styles.enginePanel} ${isClosing ? styles.closing : ''}`}>
          {enabledEngines.map((engine) => (
            <div
              key={engine.id}
              className={`${styles.engineItem} ${engine.id === currentEngine.id ? styles.active : ''}`}
              onClick={() => handleEngineSelect(engine.id)}
            >
              <div className={styles.engineIconWrapper}>
                {engine.icon && (
                  <img src={engine.icon} alt={engine.name} className={styles.engineIcon} />
                )}
              </div>
              <span className={styles.engineName}>{engine.name}</span>
              {enabledEngines.length > 1 && (
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={(e) => handleDeleteEngine(e, engine.id)}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button type="button" className={styles.addButton} onClick={handleAddClick}>
            <div className={styles.addIconWrapper}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <span className={styles.addLabel}>{t.common.add}</span>
          </button>
        </div>
      )}

      {/* 搜索历史面板 */}
      {settings.showSearchHistory && isHistoryOpen && filteredHistory.length > 0 && (
        <div className={`${styles.historyPanel} ${isHistoryClosing ? styles.closing : ''}`}>
          <div className={styles.historyHeader}>
            <span className={styles.historyTitle}>{t.search.historyTitle}</span>
            <button
              type="button"
              className={styles.clearHistoryButton}
              onClick={() => {
                clearHistory();
                closeHistory();
              }}
            >
              {t.search.clearHistory}
            </button>
          </div>
          <div className={styles.historyList}>
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className={styles.historyItem}
                onClick={() => handleHistoryClick(item.query)}
              >
                <svg
                  className={styles.historyIcon}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span className={styles.historyQuery}>{item.query}</span>
                <button
                  type="button"
                  className={styles.deleteHistoryButton}
                  onClick={(e) => handleDeleteHistory(e, item.id)}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <SearchEngineModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
