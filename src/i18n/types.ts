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
    clear: string;
    collapse: string;
    expand: string;
    openInNewTab: string;
    search: string;
    loading: string;
    noData: string;
  };

  // 设置页面
  settings: {
    title: string;
    menu: {
      layout: string;
      tools: string;
      about: string;
    };
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
    layout: {
      title: string;
      sidebarLayout: string;
      sidebarDescription: string;
      mainAreaTitle: string;
      limitContentWidth: string;
      maxContentWidth: string;
      mainAreaDescription: string;
      searchBarTitle: string;
      showSearchBar: string;
      height: string;
      width: string;
      radius: string;
      opacity: string;
      searchHistory: string;
    };
    quote: {
      title: string;
      refreshInterval: string;
      refreshOptions: {
        refresh: string;
        '1min': string;
        '10min': string;
        '1hour': string;
        '1day': string;
      };
    };
    pomodoro: {
      title: string;
      showTimer: string;
      workDuration: string;
      breakDuration: string;
      showSecondTicks: string;
      description: string;
      minutes: string;
    };
    about: {
      title: string;
      version: string;
      community: string;
      wechat: string;
      qq: string;
      comingSoon: string;
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
      browserMode: string;
      localMode: string;
      browserUnavailable: string;
      browserMissingUrl: string;
      browserRestoreFailed: string;
      browserCategoryUnsupported: string;
    };
  };

  // 搜索栏
  search: {
    placeholder: string;
    historyTitle: string;
    clearHistory: string;
    engineModal: {
      title: string;
      subtitle: string;
      minEngines: string;
      maxEngines: string;
      selectionHint: string;
      customTitle: string;
      customPlaceholder: string;
      deleteCustom: string;
      saveCustom?: string;
      customDefaultName: string;
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

  // 主题切换
  themeToggle: {
    toLight: string;
    toDark: string;
  };

  // 侧边栏
  sidebar: {
    expand: string;
    collapse: string;
    quickLinks: string;
    recentVisits: string;
    categories: string;
    editQuickLink: string;
    editCategory: string;
  };

  // 可拖拽小组件
  widget: {
    expand: string;
    minimize: string;
    close: string;
  };

  // 书签
  bookmarks: {
    title: string;
    addBookmark: string;
    editBookmark: string;
    deleteConfirm: string;
    addCategory: string;
    editCategory: string;
    deleteCategoryTitle: string;
    deleteCategoryConfirmChrome: string;
    deleteCategoryConfirmLocal: string;
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
    settings: {
      title: string;
      count: string;
      mode: string;
      modeCustom: string;
      modeChrome: string;
      customDesc: string;
      chromeDesc: string;
    };
  };

  // 书签分组
  bookmarkGrouping: {
    title: string;
    description: string;
  };

  // 书签模式
  bookmarkMode: {
    title: string;
    chrome: string;
    local: string;
    chromeDesc: string;
    localDesc: string;
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

  // 通知消息
  toast: {
    wallpaperLoadSuccess: string;
    wallpaperLoadError: string;
    wallpaperLoadTimeout: string;
    wallpaperApiNotConfigured: string;
  };

  // 数据同步
  dataSync: {
    title: string;
    webdav: {
      title: string;
      enable: string;
      serverUrl: string;
      serverUrlPlaceholder: string;
      username: string;
      usernamePlaceholder: string;
      password: string;
      passwordPlaceholder: string;
      path: string;
      pathPlaceholder: string;
      autoSync: string;
      autoSyncDesc: string;
      testConnection: string;
      syncNow: string;
      uploadData: string;
      downloadData: string;
      lastSync: string;
      never: string;
      testing: string;
      syncing: string;
      connectionSuccess: string;
      connectionFailed: string;
      syncSuccess: string;
      syncFailed: string;
      uploadSuccess: string;
      uploadFailed: string;
      downloadSuccess: string;
      downloadFailed: string;
      configIncomplete: string;
      downloadDialogTitle: string;
      downloadDialogSubtitle: string;
      downloadDialogDescription: string;
      downloadReplace: string;
      downloadReplaceDesc: string;
      downloadRemotePrimary: string;
      downloadRemotePrimaryDesc: string;
      downloadLocalPrimary: string;
      downloadLocalPrimaryDesc: string;
      downloadCancel: string;
      downloadReplaceSuccess: string;
      downloadRemotePrimarySuccess: string;
      downloadLocalPrimarySuccess: string;
      localData: string;
      remoteData: string;
      stats: {
        bookmarks: string;
        quickLinks: string;
        categories: string;
        customVisits: string;
      };
      diffTitle: string;
      diffAdded: string;
      diffRemoved: string;
      diffChanged: string;
      diffNoChanges: string;
      diffShowDetails: string;
      diffHideDetails: string;
      diffRemoteOnly: string;
      diffLocalOnly: string;
      diffConflicts: string;
      diffRemoteVersion: string;
      diffLocalVersion: string;
      diffNoDetails: string;
      diffEmpty: string;
    };
    github: {
      title: string;
      enable: string;
      token: string;
      tokenPlaceholder: string;
      tokenHelp: string;
      tokenHelpLink: string;
      gistId: string;
      gistIdPlaceholder: string;
      gistIdHelp: string;
      autoSync: string;
      autoSyncDesc: string;
      testConnection: string;
      uploadData: string;
      downloadData: string;
      lastSync: string;
      never: string;
      testing: string;
      syncing: string;
      connectionSuccess: string;
      connectionFailed: string;
      uploadSuccess: string;
      uploadFailed: string;
      downloadSuccess: string;
      downloadFailed: string;
      configIncomplete: string;
      gistCreated: string;
      requireUpload: string;
    };
    browser: {
      title: string;
      description: string;
      statsFolders: string;
      diffLabel: string;
      diffAdded: string;
      diffRemoved: string;
      diffChanged: string;
      metadataNote: string;
      previewButton: string;
      previewClose: string;
      previewEmpty: string;
      previewLimit: string;
      emptyFolder: string;
      unnamedFolder: string;
      unnamedBookmark: string;
      defaultRoot: string;
      emptyBackup: string;
      apiUnavailable: string;
      captureFailed: string;
      appendSuccess: string;
      replaceSuccess: string;
      applyFailed: string;
      strategy: {
        skip: string;
        skipDesc: string;
        append: string;
        appendDesc: string;
        replace: string;
        replaceDesc: string;
      };
      tabCustom: string;
      tabBrowser: string;
    };
  };
}
