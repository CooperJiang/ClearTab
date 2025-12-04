import type { TranslationSchema } from '../types';

export const zhCN: TranslationSchema = {
  common: {
    settings: '设置',
    reset: '重置',
    cancel: '取消',
    confirm: '确定',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    add: '添加',
    search: '搜索',
    loading: '加载中...',
    noData: '暂无数据',
  },

  settings: {
    title: '设置',
    theme: {
      title: '主题/壁纸',
      darkMode: '深色模式',
      showThemeToggle: '显示主题切换按钮',
      accentColor: '主题色',
      customColor: '自定义',
      borderRadius: '圆角',
      radiusNone: '无',
      radiusSmall: '小',
      radiusMedium: '中',
      radiusLarge: '大',
      radiusXlarge: '超大',
    },
    wallpaper: {
      title: '壁纸',
      showRandomButton: '显示随机壁纸按钮',
      customWallpaper: '自定义壁纸',
      darkModeWallpaper: '暗色模式壁纸',
      lightModeWallpaper: '亮色模式壁纸',
      inputPlaceholder: '输入图片URL（留空使用默认）',
    },
    overlay: {
      title: '遮罩透明度',
      darkMode: '暗色模式',
      lightMode: '亮色模式',
    },
    blur: {
      title: '背景模糊',
      darkMode: '暗色模式',
      lightMode: '亮色模式',
    },
    clock: {
      title: '时间模块',
      showSeconds: '显示秒',
      clockColor: '时间颜色',
    },
    display: {
      title: '显示',
      showClock: '显示时钟',
      showQuote: '显示每日一言',
      showRecentVisits: '显示最近访问',
      showQuickLinks: '显示快捷访问',
      showBookmarks: '显示书签',
    },
    system: {
      title: '系统设置',
      language: '语言',
      selectLanguage: '选择语言',
    },
    trash: {
      title: '回收站',
      settings: '回收站设置',
      enabled: '启用回收站',
      enabledDesc: '删除的内容将暂时保留',
      recycleBookmarks: '回收书签',
      recycleCategories: '回收分类',
      retentionDays: '保留时间',
      content: '回收站内容',
      empty: '回收站为空',
      clear: '清空',
      restore: '恢复',
      restoreAll: '全部恢复',
      restoreDay: '恢复当天',
      permanentDelete: '永久删除',
      daysRemaining: '天后过期',
      bookmark: '书签',
      category: '分类',
      bookmarksCount: '个书签',
      itemsCount: '项',
      today: '今天',
      yesterday: '昨天',
    },
  },

  search: {
    placeholder: '搜索或输入网址',
    engineModal: {
      title: '搜索引擎',
      subtitle: '选择要启用的搜索引擎',
      minEngines: '至少选择1个搜索引擎',
      maxEngines: '最多选择8个搜索引擎',
    },
  },

  clock: {
    greeting: {
      morning: '早上好',
      afternoon: '下午好',
      evening: '傍晚好',
      night: '晚上好',
    },
  },

  bookmarks: {
    title: '书签',
    addBookmark: '添加书签',
    editBookmark: '编辑书签',
    deleteConfirm: '确定删除此书签吗？',
    addCategory: '添加分类',
    editCategory: '编辑分类',
    form: {
      title: '标题',
      url: '网址',
      category: '分类',
    },
  },

  quickLinks: {
    title: '快捷访问',
    addTitle: '添加快捷访问',
    editTitle: '编辑快捷访问',
    name: '名称',
    namePlaceholder: '输入名称',
    url: '网址',
    urlPlaceholder: '输入网址',
  },

  recentVisits: {
    title: '最近访问',
    settings: {
      title: '最近访问设置',
      count: '显示数量',
      mode: '记录模式',
      modeCustom: '自定义跟踪',
      modeChrome: 'Chrome 历史',
      customDesc: '自定义跟踪：仅记录从本页面点击的链接',
      chromeDesc: 'Chrome 历史：读取浏览器完整历史记录',
    },
  },

  bookmarkGrouping: {
    title: '书签分组显示',
    description: '启用后，书签将按分类折叠显示；禁用后显示为传统网格视图',
  },

  bookmarkMode: {
    title: '书签模式',
    chrome: 'Chrome 同步',
    local: '本地管理',
    chromeDesc: '使用 Chrome 浏览器的书签，支持多设备同步',
    localDesc: '使用本地管理的书签，所有数据存储在浏览器本地',
  },

  quotes: {
    items: [
      { text: '"代码是写给人看的，顺便让机器执行。"', source: '— Donald Knuth' },
      { text: '"简单是可靠的先决条件。"', source: '— Edsger Dijkstra' },
      { text: '"先让它工作，再让它正确，最后让它快。"', source: '— Kent Beck' },
      { text: '"优秀程序员写人能懂的代码。"', source: '— Martin Fowler' },
      { text: '"最好的代码是没有代码。"', source: '— Jeff Atwood' },
      { text: '"过早优化是万恶之源。"', source: '— Donald Knuth' },
    ],
  },

  keyboardHints: {
    search: '搜索',
    toggleTheme: '切换主题',
  },

  wallpaperButton: {
    tooltip: '切换随机壁纸',
  },

  toast: {
    wallpaperLoadSuccess: '壁纸更新成功',
    wallpaperLoadError: '获取壁纸失败',
    wallpaperLoadTimeout: '壁纸加载超时',
    wallpaperApiNotConfigured: 'PixelPunk API 未配置',
  },
};
