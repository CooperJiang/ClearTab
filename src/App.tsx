import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Background,
  Clock,
  Quote,
  SearchBar,
  RecentVisits,
  QuickLinks,
  BookmarkGrid,
  ThemeToggle,
  SettingsButton,
  SettingsDrawer,
  WallpaperButton,
  GlobalSearch,
  EditModal,
  type EditModalField,
  ToastContainer,
  Sidebar,
  PomodoroTimer,
  HelpButton,
  HelpDrawer,
} from './components';
import { useSettingsStore, useBookmarkStore, useQuickLinkStore } from './stores';
import type { Settings } from './types';
import { fetchRandomWallpaper } from './utils/wallpaperApi';
import { I18nProvider, useTranslation } from './i18n';
import './styles/globals.css';
import styles from './App.module.css';

const clampColorValue = (value: number) => Math.min(255, Math.max(0, value));

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  if (!hex) return null;
  let clean = hex.trim().replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((char) => char + char).join('');
  }
  if (clean.length !== 6) {
    return null;
  }
  const num = Number.parseInt(clean, 16);
  if (Number.isNaN(num)) {
    return null;
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
};

const rgbToHex = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const toHex = (value: number) => clampColorValue(value).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const adjustAccentColor = (hex: string, ratio: number) => {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return hex;
  }
  return rgbToHex({
    r: rgb.r + Math.round(255 * ratio),
    g: rgb.g + Math.round(255 * ratio),
    b: rgb.b + Math.round(255 * ratio),
  });
};

interface LayoutProps {
  settings: Settings;
  animClass: string;
  showAnimation: boolean;
}

function ClassicLayout({ settings, animClass, showAnimation }: LayoutProps) {
  // 检查是否有内容显示
  const hasContent = settings.showRecentVisits || settings.showQuickLinks || settings.showBookmarks;

  // 主视图宽度样式
  const contentStyle = settings.contentMaxWidth > 0 ? {
    maxWidth: settings.contentMaxWidth,
    margin: '0 auto',
    width: '100%',
  } : undefined;

  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <div className={`${styles.topLeft} ${animClass}`} style={showAnimation ? { animationDelay: '0.1s' } : undefined}>
          {settings.showClock && <Clock />}
        </div>
        <div className={`${styles.topRight} ${animClass}`} style={showAnimation ? { animationDelay: '0.2s' } : undefined}>
          {settings.showQuote && <Quote />}
          {settings.showThemeToggle && <ThemeToggle />}
        </div>
      </div>
      <div
        className={`${styles.heroSection} ${!hasContent ? styles.heroSectionOnly : ''} ${animClass}`}
        style={showAnimation ? { animationDelay: '0.3s' } : undefined}
      >
        <h1 className={styles.logo}>Cleartab</h1>
        {settings.showSearchBar && (
          <div className={styles.searchWrapper}>
            <SearchBar />
          </div>
        )}
      </div>
      <div
        className={`${styles.content} ${animClass}`}
        style={{ ...(showAnimation ? { animationDelay: '0.4s' } : {}), ...contentStyle }}
      >
        {settings.showRecentVisits && <RecentVisits />}
        {settings.showQuickLinks && <QuickLinks />}
        {settings.showBookmarks && <BookmarkGrid showCategories={true} />}
      </div>
    </main>
  );
}

function App() {
  const { settings, updateSettings } = useSettingsStore();

  const handleLocaleChange = (locale: typeof settings.locale) => {
    updateSettings({ locale });
  };

  return (
    <I18nProvider locale={settings.locale} onLocaleChange={handleLocaleChange}>
      <AppContent />
    </I18nProvider>
  );
}

export default App;

function SidebarLayout({ settings, animClass, showAnimation }: LayoutProps) {
  // 检查是否有内容显示
  const hasContent = settings.showBookmarks;

  // 主视图宽度样式
  const contentStyle = settings.contentMaxWidth > 0 ? {
    maxWidth: settings.contentMaxWidth,
    margin: '0 auto',
    width: '100%',
  } : undefined;

  return (
    <>
      <Sidebar />
      <main className={`${styles.main} ${styles.sidebarLayoutMain}`}>
         <div className={styles.topBar}>
          <div className={`${styles.topLeft} ${animClass}`} style={showAnimation ? { animationDelay: '0.1s' } : undefined}>
            {settings.showClock && <Clock />}
          </div>
           <div className={`${styles.topRight} ${animClass}`} style={showAnimation ? { animationDelay: '0.2s' } : undefined}>
            {settings.showQuote && <Quote />}
            {settings.showThemeToggle && <ThemeToggle />}
          </div>
        </div>
        {settings.showSearchBar && (
          <div
            className={`${styles.heroSection} ${!hasContent ? styles.heroSectionOnly : ''} ${animClass}`}
            style={showAnimation ? { animationDelay: '0.3s' } : undefined}
          >
            <div className={styles.searchWrapperFull}>
              <SearchBar />
            </div>
          </div>
        )}
        <div
          className={`${styles.content} ${animClass}`}
          style={{ ...(showAnimation ? { animationDelay: '0.4s' } : {}), ...contentStyle }}
        >
          {settings.showBookmarks && <BookmarkGrid showCategories={false} />}
        </div>
      </main>
    </>
  );
}

function AppContent() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettingsStore();
  const addBookmark = useBookmarkStore((state) => state.addBookmark);
  const categories = useBookmarkStore((state) => state.categories);
  const initializeBookmarks = useBookmarkStore((state) => state.initializeWithMockData);
  const initializeQuickLinks = useQuickLinkStore((state) => state.initializeWithMockData);
  const quickLinks = useQuickLinkStore((state) => state.quickLinks);

  // 首次加载时初始化 mock 数据
  useEffect(() => {
    initializeBookmarks();
    initializeQuickLinks();
  }, [initializeBookmarks, initializeQuickLinks]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddBookmarkOpen, setIsAddBookmarkOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // 番茄钟位置使用本地 ref，避免频繁更新 settings 导致重渲染
  const pomodoroPositionRef = useRef(settings.pomodoroPosition);

  // 使用 ref 追踪动画是否已播放，确保只在首次挂载时播放
  // 使用函数初始化 useState，确保只执行一次
  const hasAnimatedRef = useRef(false);
  const [showAnimation] = useState(() => {
    if (hasAnimatedRef.current) {
      return false; // 已经播放过，不再显示动画
    }
    hasAnimatedRef.current = true;
    return true;
  });

  // 动画类名
  const animClass = showAnimation ? 'stagger-fade-in' : '';

  // 全局快捷键
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 检查是否在输入框中
    const isInputFocused =
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement ||
      document.activeElement?.getAttribute('contenteditable') === 'true';

    // ⌘/Ctrl + K: 打开全局搜索
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setIsSearchOpen(true);
      return;
    }

    // ⌘/Ctrl + ,: 打开设置
    if ((e.metaKey || e.ctrlKey) && e.key === ',') {
      e.preventDefault();
      setIsSettingsOpen(true);
      return;
    }

    // ⌘/Ctrl + D: 切换主题
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      updateSettings({
        themeMode: settings.themeMode === 'dark' ? 'light' : 'dark'
      });
      return;
    }

    // ⌘/Ctrl + B: 添加书签
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      setIsAddBookmarkOpen(true);
      return;
    }

    // Esc: 关闭弹窗
    if (e.key === 'Escape') {
      if (isSearchOpen) {
        setIsSearchOpen(false);
      } else if (isSettingsOpen) {
        setIsSettingsOpen(false);
      } else if (isAddBookmarkOpen) {
        setIsAddBookmarkOpen(false);
      } else if (isHelpOpen) {
        setIsHelpOpen(false);
      }
      return;
    }

    // 以下快捷键在输入框中不生效
    if (isInputFocused) return;

    // /: 打开全局搜索
    if (e.key === '/') {
      e.preventDefault();
      setIsSearchOpen(true);
      return;
    }

    // Alt + 1-9: 打开快捷链接
    if (e.altKey && e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      const index = Number.parseInt(e.key) - 1;
      if (quickLinks[index]) {
        window.location.href = quickLinks[index].url;
      }
      return;
    }
  }, [settings.themeMode, updateSettings, quickLinks, isSearchOpen, isSettingsOpen, isAddBookmarkOpen, isHelpOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 设置主题 - 根据 themeMode 设置 data-theme 属性
  useEffect(() => {
    const htmlElement = document.documentElement;
    const theme = settings.themeMode === 'light' ? 'light' : 'dark';
    htmlElement.setAttribute('data-theme', theme);
  }, [settings.themeMode]);

  useEffect(() => {
    const htmlElement = document.documentElement;
    const primary = settings.accentColor || '#f59e0b';
    const secondary = adjustAccentColor(primary, -0.2);
    const rgb = hexToRgb(primary);

    htmlElement.style.setProperty('--accent-primary', primary);
    htmlElement.style.setProperty('--accent-secondary', secondary);
    if (rgb) {
      htmlElement.style.setProperty('--accent-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }
  }, [settings.accentColor]);

  // 番茄钟位置更新（只更新 ref，关闭时才保存到 settings）
  const handlePomodoroPositionChange = (position: { x: number; y: number }) => {
    pomodoroPositionRef.current = position;
  };

  // 关闭番茄钟时保存位置
  const handlePomodoroClose = () => {
    updateSettings({
      showPomodoroTimer: false,
      pomodoroPosition: pomodoroPositionRef.current
    });
  };

  // 处理随机壁纸
  const getRandomWallpaperUrl = async (): Promise<string> => {
    try {
      const wallpaperInfo = await fetchRandomWallpaper(settings.pixelPunkApiUrl);
      return wallpaperInfo.url;
    } catch {
      return '';
    }
  };

  const applyRandomWallpaper = (url: string) => {
    if (settings.themeMode === 'dark') {
      updateSettings({ randomWallpaperImage: url });
    } else {
      updateSettings({ randomWallpaperImageLight: url });
    }
  };

  // 书签字段定义
  const bookmarkFields: EditModalField[] = [
    { key: 'title', label: t.bookmarks.form.title, type: 'text', required: true },
    { key: 'url', label: t.bookmarks.form.url, type: 'text', required: true },
    { key: 'categoryId', label: t.bookmarks.form.category, type: 'select', required: true, options: categories.map(c => ({ value: c.id, label: c.name })) },
  ];

  // 添加书签处理
  const handleAddBookmark = async (values: Record<string, unknown>) => {
    addBookmark({
      id: `bookmark-${Date.now()}`,
      title: values.title as string,
      url: values.url as string,
      color: '#6366f1',
      categoryId: values.categoryId as string,
      createdAt: Date.now(),
      visitCount: 0,
    });
    setIsAddBookmarkOpen(false);
  };

  return (
    <div className={`${styles.app} ${settings.layoutMode === 'sidebar' ? styles.sidebarLayout : ''}`}>
      <Background />

      {settings.layoutMode === 'sidebar' ? (
        <SidebarLayout settings={settings} animClass={animClass} showAnimation={showAnimation} />
      ) : (
        <ClassicLayout settings={settings} animClass={animClass} showAnimation={showAnimation} />
      )}

      {/* 右下角按钮组 */}
      <div className={styles.bottomButtons}>
        <SettingsButton onClick={() => setIsSettingsOpen(true)} />
        {settings.showWallpaperButton && (
          <WallpaperButton
            onGetWallpaperUrl={getRandomWallpaperUrl}
            onApplyWallpaper={applyRandomWallpaper}
          />
        )}
        <HelpButton onClick={() => setIsHelpOpen(true)} />
      </div>
      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <HelpDrawer isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <EditModal
        isOpen={isAddBookmarkOpen}
        onClose={() => setIsAddBookmarkOpen(false)}
        title={t.bookmarks.addBookmark}
        fields={bookmarkFields}
        initialValues={{ categoryId: 'dev' }}
        onSave={handleAddBookmark}
      />
      <ToastContainer />

      {/* 番茄钟小组件 */}
      {settings.showPomodoroTimer && (
        <PomodoroTimer
          position={settings.pomodoroPosition}
          onPositionChange={handlePomodoroPositionChange}
          onClose={handlePomodoroClose}
        />
      )}
    </div>
  );
}
