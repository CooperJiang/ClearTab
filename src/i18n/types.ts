// 支持的语言代码
export type Locale = 'zh-CN' | 'en-US';

// 语言配置
export interface LocaleConfig {
  code: Locale;
  name: string;        // 显示名称（用本地语言）
  englishName: string; // 英文名称
}

// 所有支持的语言配置
export const SUPPORTED_LOCALES: LocaleConfig[] = [
  { code: 'zh-CN', name: '简体中文', englishName: 'Chinese (Simplified)' },
  { code: 'en-US', name: 'English', englishName: 'English' },
];

// 默认语言
export const DEFAULT_LOCALE: Locale = 'zh-CN';

// 翻译文本结构
export interface TranslationSchema {
  // 通用
  common: {
    settings: string;
    reset: string;
    cancel: string;
    confirm: string;
    save: string;
    delete: string;
    edit: string;
    add: string;
    search: string;
    loading: string;
    noData: string;
  };

  // 设置页面
  settings: {
    title: string;
    theme: {
      title: string;
      darkMode: string;
      showThemeToggle: string;
      accentColor: string;
      customColor: string;
      borderRadius: string;
      radiusNone: string;
      radiusSmall: string;
      radiusMedium: string;
      radiusLarge: string;
      radiusXlarge: string;
    };
    wallpaper: {
      title: string;
      showRandomButton: string;
      customWallpaper: string;
      darkModeWallpaper: string;
      lightModeWallpaper: string;
      inputPlaceholder: string;
    };
    overlay: {
      title: string;
      darkMode: string;
      lightMode: string;
    };
    blur: {
      title: string;
      darkMode: string;
      lightMode: string;
    };
    clock: {
      title: string;
      showSeconds: string;
      clockColor: string;
    };
    display: {
      title: string;
      showClock: string;
      showQuote: string;
      showRecentVisits: string;
      showQuickLinks: string;
      showBookmarks: string;
    };
    system: {
      title: string;
      language: string;
      selectLanguage: string;
    };
    trash: {
      title: string;
      settings: string;
      enabled: string;
      enabledDesc: string;
      recycleBookmarks: string;
      recycleCategories: string;
      retentionDays: string;
      content: string;
      empty: string;
      clear: string;
      restore: string;
      restoreAll: string;
      restoreDay: string;
      permanentDelete: string;
      daysRemaining: string;
      bookmark: string;
      category: string;
      bookmarksCount: string;
      itemsCount: string;
      today: string;
      yesterday: string;
    };
  };

  // 搜索栏
  search: {
    placeholder: string;
    engineModal: {
      title: string;
      subtitle: string;
      minEngines: string;
      maxEngines: string;
    };
  };

  // 时钟
  clock: {
    greeting: {
      morning: string;
      afternoon: string;
      evening: string;
      night: string;
    };
  };

  // 书签
  bookmarks: {
    title: string;
    addBookmark: string;
    editBookmark: string;
    deleteConfirm: string;
    addCategory: string;
    editCategory: string;
    form: {
      title: string;
      url: string;
      category: string;
    };
  };

  // 快捷访问
  quickLinks: {
    title: string;
    addTitle: string;
    editTitle: string;
    name: string;
    namePlaceholder: string;
    url: string;
    urlPlaceholder: string;
  };

  // 最近访问
  recentVisits: {
    title: string;
  };

  // 每日一言
  quotes: {
    items: Array<{ text: string; source: string }>;
  };

  // 键盘提示
  keyboardHints: {
    search: string;
    toggleTheme: string;
  };

  // 壁纸按钮
  wallpaperButton: {
    tooltip: string;
  };
}
