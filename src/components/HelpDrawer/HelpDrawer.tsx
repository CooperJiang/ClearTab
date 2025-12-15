import { useState } from 'react';
import styles from './HelpDrawer.module.css';

interface HelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type MenuKey = 'shortcuts';

// 菜单图标组件
const ShortcutsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
    <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
  </svg>
);

export function HelpDrawer({ isOpen, onClose }: HelpDrawerProps) {
  const [activeMenu, setActiveMenu] = useState<MenuKey>('shortcuts');

  const menuItems: { key: MenuKey; label: string; icon: React.ReactNode }[] = [
    { key: 'shortcuts', label: '快捷键', icon: <ShortcutsIcon /> },
  ];

  const shortcuts = [
    {
      keys: ['⌘', 'K'],
      description: '全局搜索',
    },
    {
      keys: ['⌘', ','],
      description: '打开设置',
    },
    {
      keys: ['⌘', 'D'],
      description: '切换主题',
    },
    {
      keys: ['⌘', 'B'],
      description: '添加书签',
    },
    {
      keys: ['⌥', '1-9'],
      description: '打开快捷链接',
    },
    {
      keys: ['Esc'],
      description: '关闭弹窗',
    },
  ];

  return (
    <>
      {/* 遮罩层 */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.open : ''}`}
        onClick={onClose}
      />

      {/* 抽屉 */}
      <div className={`${styles.drawer} ${isOpen ? styles.open : ''}`}>
        {/* 侧边菜单 */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarTitle}>帮助</span>
          </div>
          <nav className={styles.menu}>
            {menuItems.map((item) => (
              <button
                key={item.key}
                className={`${styles.menuItem} ${activeMenu === item.key ? styles.active : ''}`}
                onClick={() => setActiveMenu(item.key)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* 内容区 */}
        <div className={styles.content}>
          <div className={styles.contentHeader}>
            <h2 className={styles.contentTitle}>
              {menuItems.find((item) => item.key === activeMenu)?.label}
            </h2>
            <button className={styles.closeButton} onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className={styles.contentBody}>
            {activeMenu === 'shortcuts' && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>通用快捷键</h3>
                <div className={styles.shortcutsList}>
                  {shortcuts.map((shortcut, index) => (
                    <div key={index} className={styles.shortcutItem}>
                      <div className={styles.keysGroup}>
                        {shortcut.keys.map((key, keyIndex) => (
                          <kbd key={keyIndex} className={styles.key}>{key}</kbd>
                        ))}
                      </div>
                      <span className={styles.description}>{shortcut.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
