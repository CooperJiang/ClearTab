// 书签类型
export interface Bookmark {
  id: string;
  title: string;
  url: string;
  icon?: string;
  color: string;
  categoryId: string;
  createdAt: number;
  visitCount: number;
  lastVisitedAt?: number;
}

// 分类类型
export interface Category {
  id: string;
  name: string;
  order: number;
}

// 快捷访问类型
export interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  color: string;
  order: number;
}

// 搜索引擎类型
export interface SearchEngine {
  id: string;
  name: string;
  url: string;
  icon?: string;
}

// 主题模式
export type ThemeMode = 'light' | 'dark';

// 语言类型（从 i18n 重新导出以方便使用）
export type { Locale } from '../i18n/types';

// 设置类型
export interface Settings {
  backgroundImage: string;
  backgroundImageLight: string;
  customBackgroundImage: string;
  customBackgroundImageLight: string;
  backgroundOverlayDark: number;
  backgroundOverlayLight: number;
  backgroundBlurDark: number;
  backgroundBlurLight: number;
  defaultSearchEngine: string;
  enabledSearchEngines: string[];
  customSearchEngines: SearchEngine[];
  showRecentVisits: boolean;
  showQuickLinks: boolean;
  showBookmarks: boolean;
  showClock: boolean;
  showSeconds: boolean;
  clockColor: string;
  showQuote: boolean;
  showThemeToggle: boolean;
  userName: string;
  themeMode: ThemeMode;
  accentColor: string;
  // 随机壁纸设置
  showWallpaperButton: boolean;
  randomWallpaperImage: string;
  randomWallpaperImageLight: string;
  // 语言设置
  locale: import('../i18n/types').Locale;
  // 外观设置
  borderRadius: 'none' | 'small' | 'medium' | 'large' | 'xlarge';
}

// 所有可用的搜索引擎
export const ALL_SEARCH_ENGINES: SearchEngine[] = [
  // 常用搜索
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=', icon: '/icons/engines/baidu.svg' },
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=', icon: '/icons/engines/google.svg' },
  { id: 'bing', name: '必应', url: 'https://www.bing.com/search?q=', icon: '/icons/engines/bing.svg' },
  { id: 'yandex', name: 'Yandex', url: 'https://yandex.com/search/?text=', icon: '/icons/engines/yandex.svg' },
  { id: 'so', name: '综合搜索', url: 'https://www.so.com/s?q=', icon: '/icons/engines/so.svg' },
  { id: 'sogou', name: '搜狗', url: 'https://www.sogou.com/web?query=', icon: '/icons/engines/sogou.svg' },
  { id: 'fsou', name: 'F搜', url: 'https://fsoufsou.com/search?q=', icon: '/icons/engines/fsou.svg' },
  { id: 'metaso', name: '秘塔AI', url: 'https://metaso.cn/?q=', icon: '/icons/engines/metaso.svg' },
  // 社交媒体
  { id: 'douyin', name: '抖音', url: 'https://www.douyin.com/search/', icon: '/icons/engines/douyin.svg' },
  { id: 'github', name: 'GitHub', url: 'https://github.com/search?q=', icon: '/icons/engines/github.svg' },
  { id: 'jd', name: '京东', url: 'https://search.jd.com/Search?keyword=', icon: '/icons/engines/jd.svg' },
  { id: 'weibo', name: '微博', url: 'https://s.weibo.com/weibo?q=', icon: '/icons/engines/weibo.svg' },
  { id: 'bilibili', name: '哔哩哔哩', url: 'https://search.bilibili.com/all?keyword=', icon: '/icons/engines/bilibili.svg' },
  { id: 'taobao', name: '淘宝', url: 'https://s.taobao.com/search?q=', icon: '/icons/engines/taobao.svg' },
  { id: 'xiaohongshu', name: '小红书', url: 'https://www.xiaohongshu.com/search_result?keyword=', icon: '/icons/engines/xiaohongshu.svg' },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', icon: '/icons/engines/duckduckgo.svg' },
  // 开发者工具
  { id: 'kaifa', name: '开发者搜索', url: 'https://kaifa.baidu.com/searchPage?wd=', icon: '/icons/engines/kaifa.svg' },
  { id: 'zhihu', name: '知乎', url: 'https://www.zhihu.com/search?type=content&q=', icon: '/icons/engines/zhihu.svg' },
  { id: 'stackoverflow', name: 'StackOverflow', url: 'https://stackoverflow.com/search?q=', icon: '/icons/engines/stackoverflow.svg' },
  { id: 'naver', name: 'NAVER', url: 'https://search.naver.com/search.naver?query=', icon: '/icons/engines/naver.svg' },
  { id: 'mdn', name: 'MDN', url: 'https://developer.mozilla.org/zh-CN/search?q=', icon: '/icons/engines/mdn.svg' },
  { id: 'yahoo', name: 'Yahoo', url: 'https://search.yahoo.com/search?p=', icon: '/icons/engines/yahoo.svg' },
  { id: 'scholar', name: 'Google Scholar', url: 'https://scholar.google.com/scholar?q=', icon: '/icons/engines/scholar.svg' },
  { id: 'douban', name: '豆瓣', url: 'https://www.douban.com/search?q=', icon: '/icons/engines/douban.svg' },
  { id: 'toutiao', name: '头条搜索', url: 'https://so.toutiao.com/search?dvpf=pc&keyword=', icon: '/icons/engines/toutiao.svg' },
];

// 默认启用的搜索引擎ID
export const DEFAULT_ENABLED_ENGINE_IDS = ['google', 'baidu', 'bing', 'github'];

// 根据启用的ID获取搜索引擎列表
export const getEnabledEngines = (enabledIds: string[], customEngines: SearchEngine[] = []): SearchEngine[] => {
  // 合并内置引擎和自定义引擎
  const allEngines = [...ALL_SEARCH_ENGINES, ...customEngines];
  return enabledIds
    .map(id => allEngines.find(e => e.id === id))
    .filter((e): e is SearchEngine => e !== undefined);
};

// 获取所有可用引擎（内置 + 自定义）
export const getAllEngines = (customEngines: SearchEngine[] = []): SearchEngine[] => {
  return [...ALL_SEARCH_ENGINES, ...customEngines];
};

// 默认分类
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'all', name: '全部', order: 0 },
  { id: 'dev', name: '开发', order: 1 },
  { id: 'design', name: '设计', order: 2 },
  { id: 'learn', name: '学习', order: 3 },
  { id: 'tools', name: '工具', order: 4 },
  { id: 'entertainment', name: '娱乐', order: 5 },
  { id: 'news', name: '资讯', order: 6 },
];

// 可选主题色
export const ACCENT_COLORS = [
  // 第一排：暖色系
  { id: 'red', color: '#ef4444', name: '红色' },
  { id: 'orange', color: '#f97316', name: '橙色' },
  { id: 'amber', color: '#f59e0b', name: '琥珀' },
  { id: 'yellow', color: '#eab308', name: '黄色' },
  { id: 'lime', color: '#84cc16', name: '青柠' },
  { id: 'green', color: '#22c55e', name: '绿色' },
  { id: 'emerald', color: '#10b981', name: '翠绿' },
  { id: 'teal', color: '#14b8a6', name: '蓝绿' },
  { id: 'cyan', color: '#06b6d4', name: '青色' },
  // 第二排：冷色系
  { id: 'sky', color: '#0ea5e9', name: '天蓝' },
  { id: 'blue', color: '#3b82f6', name: '蓝色' },
  { id: 'indigo', color: '#6366f1', name: '靛蓝' },
  { id: 'violet', color: '#8b5cf6', name: '紫罗兰' },
  { id: 'purple', color: '#a855f7', name: '紫色' },
  { id: 'fuchsia', color: '#d946ef', name: '洋红' },
  { id: 'pink', color: '#ec4899', name: '粉色' },
  { id: 'rose', color: '#f43f5e', name: '玫瑰' },
  { id: 'slate', color: '#64748b', name: '灰蓝' },
];

// 默认设置
export const DEFAULT_SETTINGS: Settings = {
  backgroundImage: '/wallpapers/dark-default.jpg',
  backgroundImageLight: '/wallpapers/light-default.jpg',
  customBackgroundImage: '',
  customBackgroundImageLight: '',
  backgroundOverlayDark: 0.6,
  backgroundOverlayLight: 0.3,
  backgroundBlurDark: 0,
  backgroundBlurLight: 8,
  defaultSearchEngine: 'google',
  enabledSearchEngines: DEFAULT_ENABLED_ENGINE_IDS,
  customSearchEngines: [],
  showRecentVisits: true,
  showQuickLinks: true,
  showBookmarks: true,
  showClock: true,
  showSeconds: false,
  clockColor: '#ffffff',
  showQuote: true,
  showThemeToggle: false,
  userName: '',
  themeMode: 'dark',
  accentColor: '#f59e0b',
  showWallpaperButton: false,
  randomWallpaperImage: '',
  randomWallpaperImageLight: '',
  locale: 'zh-CN',
  borderRadius: 'medium',
};

// 每日一言
export const QUOTES = [
  { text: '"代码是写给人看的，顺便让机器执行。"', source: '— Donald Knuth' },
  { text: '"简单是可靠的先决条件。"', source: '— Edsger Dijkstra' },
  { text: '"先让它工作，再让它正确，最后让它快。"', source: '— Kent Beck' },
  { text: '"优秀程序员写人能懂的代码。"', source: '— Martin Fowler' },
  { text: '"最好的代码是没有代码。"', source: '— Jeff Atwood' },
  { text: '"过早优化是万恶之源。"', source: '— Donald Knuth' },
];

// 生成随机颜色
export const COLORS = [
  '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4',
  '#14b8a6', '#10b981', '#22c55e', '#84cc16', '#eab308',
  '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#d946ef',
];
