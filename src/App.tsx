import { useEffect, useState } from 'react';
import {
  Background,
  Clock,
  Quote,
  SearchBar,
  RecentVisits,
  QuickLinks,
  BookmarkGrid,
  KeyboardHints,
  ThemeToggle,
  SettingsButton,
  SettingsDrawer,
  WallpaperButton,
  GlobalSearch,
} from './components';
import { useSettingsStore, useBookmarkStore, useQuickLinkStore } from './stores';
import { fetchRandomWallpaper } from './utils/wallpaperApi';
import { I18nProvider, type Locale } from './i18n';
import './styles/globals.css';
import styles from './App.module.css';

function App() {
  const { settings, updateSettings } = useSettingsStore();
  const initializeBookmarks = useBookmarkStore((state) => state.initializeWithMockData);
  const initializeQuickLinks = useQuickLinkStore((state) => state.initializeWithMockData);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 全局快捷键 Command+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 首次加载时初始化示例数据
  useEffect(() => {
    initializeBookmarks();
    initializeQuickLinks();
  }, [initializeBookmarks, initializeQuickLinks]);

  // 应用主题模式
  useEffect(() => {
    const themeMode = settings.themeMode || 'dark';
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [settings.themeMode]);

  // 应用主题色
  useEffect(() => {
    const accentColor = settings.accentColor || '#f59e0b';
    document.documentElement.style.setProperty('--accent-primary', accentColor);
    // 生成次要色（稍微深一点）
    const darkerColor = adjustColor(accentColor, -20);
    document.documentElement.style.setProperty('--accent-secondary', darkerColor);
  }, [settings.accentColor]);

  // 应用圆角设置
  useEffect(() => {
    const radiusMap = {
      none: { sm: '0px', md: '0px', lg: '0px', xl: '0px' },
      small: { sm: '4px', md: '6px', lg: '8px', xl: '12px' },
      medium: { sm: '6px', md: '8px', lg: '12px', xl: '16px' },
      large: { sm: '8px', md: '12px', lg: '16px', xl: '24px' },
      xlarge: { sm: '12px', md: '16px', lg: '20px', xl: '28px' },
    };
    const radius = radiusMap[settings.borderRadius || 'medium'];
    document.documentElement.style.setProperty('--radius-sm', radius.sm);
    document.documentElement.style.setProperty('--radius-md', radius.md);
    document.documentElement.style.setProperty('--radius-lg', radius.lg);
    document.documentElement.style.setProperty('--radius-xl', radius.xl);
  }, [settings.borderRadius]);

  // 获取随机壁纸 URL
  const getRandomWallpaperUrl = async () => {
    const wallpaper = await fetchRandomWallpaper();
    return wallpaper.url;
  };

  // 应用随机壁纸
  const applyRandomWallpaper = (url: string) => {
    const isDark = settings.themeMode === 'dark';
    if (isDark) {
      updateSettings({ randomWallpaperImage: url });
    } else {
      updateSettings({ randomWallpaperImageLight: url });
    }
  };

  // 切换语言
  const handleLocaleChange = (locale: Locale) => {
    updateSettings({ locale });
  };

  return (
    <I18nProvider locale={settings.locale} onLocaleChange={handleLocaleChange}>
    <div className={styles.app}>
      <Background />

      <main className={styles.main}>
        {/* 顶部栏：左侧时钟，右侧主题切换 + 每日一言 */}
        <div className={styles.topBar}>
          <div className={styles.topLeft}>
            {settings.showClock && <Clock />}
          </div>
          <div className={styles.topRight}>
            {settings.showQuote && <Quote />}
            {settings.showThemeToggle && <ThemeToggle />}
          </div>
        </div>

        {/* 核心区域：Logo + 搜索框 */}
        <div className={styles.heroSection}>
          <h1 className={styles.logo}>Cleartab</h1>
          <div className={styles.searchWrapper}>
            <SearchBar />
          </div>
        </div>

        {/* 内容区域 */}
        <div className={styles.content}>
          {settings.showRecentVisits && <RecentVisits />}
          {settings.showQuickLinks && <QuickLinks />}
          {settings.showBookmarks && <BookmarkGrid />}
        </div>
      </main>

      <KeyboardHints />
      {settings.showWallpaperButton && (
        <WallpaperButton
          onGetWallpaperUrl={getRandomWallpaperUrl}
          onApplyWallpaper={applyRandomWallpaper}
        />
      )}
      <SettingsButton onClick={() => setIsSettingsOpen(true)} />
      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
    </I18nProvider>
  );
}

// 调整颜色明暗
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default App;
