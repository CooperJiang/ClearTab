import { useState } from 'react';
import styles from './KeyboardHints.module.css';

export function KeyboardHints() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`${styles.container} ${isExpanded ? styles.expanded : ''}`}>
      <button
        className={styles.toggleButton}
        onClick={() => setIsExpanded(!isExpanded)}
        title="快捷键帮助"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
          <path d="M12 8v4m0 4v.01" />
        </svg>
      </button>

      <div className={styles.hints}>
        <div className={styles.hint}>
          <kbd className={styles.key}>⌘K</kbd>
          <span>全局搜索</span>
        </div>
        <div className={styles.hint}>
          <kbd className={styles.key}>⌘,</kbd>
          <span>打开设置</span>
        </div>
        <div className={styles.hint}>
          <kbd className={styles.key}>⌘D</kbd>
          <span>切换主题</span>
        </div>
        <div className={styles.hint}>
          <kbd className={styles.key}>⌘B</kbd>
          <span>添加书签</span>
        </div>
        <div className={styles.hint}>
          <kbd className={styles.key}>⌥1-9</kbd>
          <span>打开快捷链接</span>
        </div>
        <div className={styles.hint}>
          <kbd className={styles.key}>Esc</kbd>
          <span>关闭弹窗</span>
        </div>
      </div>
    </div>
  );
}
