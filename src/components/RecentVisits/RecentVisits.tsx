import { useCallback } from 'react';
import { useBookmarkStore } from '../../stores';
import { getFaviconUrl } from '../../utils';
import { useTranslation } from '../../i18n';
import styles from './RecentVisits.module.css';

// 示例最近访问数据（实际可从 chrome.topSites 获取）
const MOCK_RECENT_VISITS = [
  { id: '1', title: 'GitHub', url: 'https://github.com' },
  { id: '2', title: 'Stack Overflow', url: 'https://stackoverflow.com' },
  { id: '3', title: 'ChatGPT', url: 'https://chat.openai.com' },
  { id: '4', title: '掘金', url: 'https://juejin.cn' },
  { id: '5', title: 'Bilibili', url: 'https://www.bilibili.com' },
  { id: '6', title: 'LeetCode', url: 'https://leetcode.cn' },
  { id: '7', title: '知乎', url: 'https://www.zhihu.com' },
  { id: '8', title: 'YouTube', url: 'https://www.youtube.com' },
];

export function RecentVisits() {
  const { bookmarks } = useBookmarkStore();
  const { t } = useTranslation();

  // 获取最近访问的书签，按访问时间排序
  const recentFromBookmarks = bookmarks
    .filter((b) => b.lastVisitedAt)
    .sort((a, b) => (b.lastVisitedAt || 0) - (a.lastVisitedAt || 0))
    .slice(0, 8);

  // 如果没有真实的访问记录，使用示例数据
  const recentVisits = recentFromBookmarks.length > 0
    ? recentFromBookmarks
    : MOCK_RECENT_VISITS;

  // 处理拖拽开始
  const handleDragStart = useCallback((e: React.DragEvent, title: string, url: string) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', `external:${JSON.stringify({ title, url })}`);
  }, []);

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
          >
            <div className={styles.icon}>
              <img src={getFaviconUrl(visit.url)} alt="" />
            </div>
            <span className={styles.name}>{visit.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
