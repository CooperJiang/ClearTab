import { useEffect, useState, useMemo, useCallback } from 'react';
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
  EditModal,
  type EditModalField,
  ToastContainer,
} from './components';
import { useSettingsStore, useBookmarkStore, useQuickLinkStore } from './stores';
import { useKeyboardShortcuts, type KeyboardShortcut } from './hooks';
import { fetchRandomWallpaper } from './utils/wallpaperApi';
import { COLORS } from './types';
import { I18nProvider, type Locale } from './i18n';
import './styles/globals.css';
import styles from './App.module.css';

function App() {
  const { settings, updateSettings } = useSettingsStore();
  const initializeBookmarks = useBookmarkStore((state) => state.initializeWithMockData);
  const addBookmark = useBookmarkStore((state) => state.addBookmark);
  const categories = useBookmarkStore((state) => state.categories);
  const initializeQuickLinks = useQuickLinkStore((state) => state.initializeWithMockData);
  const quickLinks = useQuickLinkStore((state) => state.quickLinks);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddBookmarkOpen, setIsAddBookmarkOpen] = useState(false);

  // 切换主题
  const toggleTheme = useCallback(() => {
    const newTheme = settings.themeMode === 'dark' ? 'light' : 'dark';
    updateSettings({ themeMode: newTheme });
  }, [settings.themeMode, updateSettings]);

  // 打开快捷链接
  const openQuickLink = useCallback((index: number) => {
    if (index >= 0 && index < quickLinks.length) {
      window.open(quickLinks[index].url, '_blank');
    }
  }, [quickLinks]);

  // 键盘快捷键配置
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    // ⌘/Ctrl + K : 打开全局搜索
    {
      key: 'k',
      ctrl: true,
      action: () => setIsSearchOpen(true),
      description: '全局搜索',
    },
    // ⌘/Ctrl + , : 打开设置
    {
      key: ',',
      ctrl: true,
      action: () => setIsSettingsOpen(true),
      description: '打开设置',
    },
    // ⌘/Ctrl + D : 切换主题
    {
      key: 'd',
      ctrl: true,
      action: toggleTheme,
      description: '切换主题',
    },
    // ⌘/Ctrl + B : 添加书签
    {
      key: 'b',
      ctrl: true,
      action: () => setIsAddBookmarkOpen(true),
      description: '添加书签',
    },
    // Escape : 关闭弹窗
    {
      key: 'Escape',
      action: () => {
        setIsSearchOpen(false);
        setIsSettingsOpen(false);
        setIsAddBookmarkOpen(false);
      },
      description: '关闭弹窗',
    },
    // 数字键 1-9 : 快速打开快捷链接
    ...Array.from({ length: 9 }, (_, i) => ({
      key: String(i + 1),
      alt: true,
      action: () => openQuickLink(i),
      description: `打开快捷链接 ${i + 1}`,
    })),
  ], [toggleTheme, openQuickLink]);

  // 使用键盘快捷键 Hook
  useKeyboardShortcuts({ shortcuts });

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
    if (!settings.pixelPunkApiUrl) {
      throw new Error('PixelPunk API URL not configured');
    }
    const wallpaper = await fetchRandomWallpaper(settings.pixelPunkApiUrl);
    return wallpaper.url;
  };

  // 应用随机壁纸
  const applyRandomWallpaper = (url: string) => {
    const isDark = settings.themeMode === 'dark';
    console.log('[App] Applying wallpaper, isDark:', isDark, 'url:', url);
    if (isDark) {
      updateSettings({ randomWallpaperImage: url });
      console.log('[App] Updated randomWallpaperImage');
    } else {
      updateSettings({ randomWallpaperImageLight: url });
      console.log('[App] Updated randomWallpaperImageLight');
    }
  };

  // 切换语言
  const handleLocaleChange = (locale: Locale) => {
    updateSettings({ locale });
  };

  // 快捷键添加书签的表单字段
  const bookmarkFields: EditModalField[] = useMemo(() => [
    {
      key: 'title',
      label: '标题',
      type: 'text',
      placeholder: '输入书签标题',
      required: true,
    },
    {
      key: 'url',
      label: '网址',
      type: 'url',
      placeholder: '输入网址',
      required: true,
    },
    {
      key: 'categoryId',
      label: '分类',
      type: 'select',
      options: categories
        .filter((c) => c.id !== 'all')
        .map((c) => ({ value: c.id, label: c.name })),
      required: true,
    },
  ], [categories]);

  // 处理快捷键添加书签
  const handleAddBookmark = useCallback((values: Record<string, string>) => {
    const newBookmark = {
      id: `bm-${Date.now()}`,
      title: values.title,
      url: values.url.startsWith('http') ? values.url : `https://${values.url}`,
      categoryId: values.categoryId || 'dev',
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      createdAt: Date.now(),
      visitCount: 0,
    };
    addBookmark(newBookmark);
  }, [addBookmark]);

  return (
    <I18nProvider locale={settings.locale} onLocaleChange={handleLocaleChange}>
    <div className={styles.app}>
      <Background />

      <main className={styles.main}>
        {/* 顶部栏：左侧时钟，右侧主题切换 + 每日一言 */}
        <div className={styles.topBar}>
          <div
            className={`${styles.topLeft} stagger-fade-in`}
            style={{ animationDelay: '0.1s' }}
          >
            {settings.showClock && <Clock />}
          </div>
          <div
            className={`${styles.topRight} stagger-fade-in`}
            style={{ animationDelay: '0.2s' }}
          >
            {settings.showQuote && <Quote />}
            {settings.showThemeToggle && <ThemeToggle />}
          </div>
        </div>

        {/* 核心区域：Logo + 搜索框 */}
        <div
          className={`${styles.heroSection} stagger-fade-in`}
          style={{ animationDelay: '0.3s' }}
        >
          <h1 className={styles.logo}>Cleartab</h1>
          <div className={styles.searchWrapper}>
            <SearchBar />
          </div>
        </div>

        {/* 内容区域 */}
        <div
          className={`${styles.content} stagger-fade-in`}
          style={{ animationDelay: '0.4s' }}
        >
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

      {/* 快捷键添加书签弹窗 */}
      <EditModal
        isOpen={isAddBookmarkOpen}
        onClose={() => setIsAddBookmarkOpen(false)}
        title="添加书签"
        fields={bookmarkFields}
        initialValues={{ categoryId: 'dev' }}
        onSave={handleAddBookmark}
      />

      {/* 通知容器 */}
      <ToastContainer />
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