import { useCallback } from 'react';
import { useRecentVisits } from '../../hooks/useRecentVisits';
import { FaviconImage } from '../FaviconImage';
import { useTranslation } from '../../i18n';
import { useSettingsStore, useRecentVisitsStore } from '../../stores';
import styles from './RecentVisits.module.css';

export function RecentVisits() {
  const settings = useSettingsStore((state) => state.settings);
  const addVisit = useRecentVisitsStore((state) => state.addVisit);

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
          <a
            key={visit.id}
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
        ))}
      </div>
    </div>
  );
}
