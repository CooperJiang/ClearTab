import type { TranslationSchema } from '../types';

export const enUS: TranslationSchema = {
  common: {
    settings: 'Settings',
    reset: 'Reset',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    loading: 'Loading...',
    noData: 'No data',
  },

  settings: {
    title: 'Settings',
    theme: {
      title: 'Theme',
      darkMode: 'Dark Mode',
      showThemeToggle: 'Show theme toggle button',
      accentColor: 'Accent Color',
      customColor: 'Custom',
      borderRadius: 'Border Radius',
      radiusNone: 'None',
      radiusSmall: 'Small',
      radiusMedium: 'Medium',
      radiusLarge: 'Large',
      radiusXlarge: 'XLarge',
    },
    wallpaper: {
      title: 'Wallpaper',
      showRandomButton: 'Show random wallpaper button',
      customWallpaper: 'Custom Wallpaper',
      darkModeWallpaper: 'Dark mode wallpaper',
      lightModeWallpaper: 'Light mode wallpaper',
      inputPlaceholder: 'Enter image URL (leave empty for default)',
    },
    overlay: {
      title: 'Overlay Opacity',
      darkMode: 'Dark mode',
      lightMode: 'Light mode',
    },
    blur: {
      title: 'Background Blur',
      darkMode: 'Dark mode',
      lightMode: 'Light mode',
    },
    clock: {
      title: 'Clock',
      showSeconds: 'Show seconds',
      clockColor: 'Clock color',
    },
    display: {
      title: 'Display',
      showClock: 'Show clock',
      showQuote: 'Show daily quote',
      showRecentVisits: 'Show recent visits',
      showQuickLinks: 'Show quick links',
      showBookmarks: 'Show bookmarks',
    },
    system: {
      title: 'System',
      language: 'Language',
      selectLanguage: 'Select language',
    },
    trash: {
      title: 'Trash',
      settings: 'Trash Settings',
      enabled: 'Enable Trash',
      enabledDesc: 'Deleted items will be temporarily retained',
      recycleBookmarks: 'Recycle Bookmarks',
      recycleCategories: 'Recycle Categories',
      retentionDays: 'Retention Period',
      content: 'Trash Contents',
      empty: 'Trash is empty',
      clear: 'Clear',
      restore: 'Restore',
      restoreAll: 'Restore All',
      restoreDay: 'Restore Day',
      permanentDelete: 'Delete permanently',
      daysRemaining: 'days remaining',
      bookmark: 'Bookmark',
      category: 'Category',
      bookmarksCount: 'bookmarks',
      itemsCount: 'items',
      today: 'Today',
      yesterday: 'Yesterday',
    },
  },

  search: {
    placeholder: 'Search or enter URL',
    engineModal: {
      title: 'Search Engines',
      subtitle: 'Select search engines to enable',
      minEngines: 'Select at least 1 search engine',
      maxEngines: 'Select up to 8 search engines',
    },
  },

  clock: {
    greeting: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
      night: 'Good night',
    },
  },

  bookmarks: {
    title: 'Bookmarks',
    addBookmark: 'Add bookmark',
    editBookmark: 'Edit bookmark',
    deleteConfirm: 'Are you sure you want to delete this bookmark?',
    addCategory: 'Add category',
    editCategory: 'Edit category',
    form: {
      title: 'Title',
      url: 'URL',
      category: 'Category',
    },
  },

  quickLinks: {
    title: 'Quick Links',
    addTitle: 'Add Quick Link',
    editTitle: 'Edit Quick Link',
    name: 'Name',
    namePlaceholder: 'Enter name',
    url: 'URL',
    urlPlaceholder: 'Enter URL',
  },

  recentVisits: {
    title: 'Recent Visits',
  },

  quotes: {
    items: [
      { text: '"Code is written for humans to read, and only incidentally for machines to execute."', source: '— Donald Knuth' },
      { text: '"Simplicity is prerequisite for reliability."', source: '— Edsger Dijkstra' },
      { text: '"Make it work, make it right, make it fast."', source: '— Kent Beck' },
      { text: '"Any fool can write code that a computer can understand. Good programmers write code that humans can understand."', source: '— Martin Fowler' },
      { text: '"The best code is no code at all."', source: '— Jeff Atwood' },
      { text: '"Premature optimization is the root of all evil."', source: '— Donald Knuth' },
    ],
  },

  keyboardHints: {
    search: 'Search',
    toggleTheme: 'Toggle theme',
  },

  wallpaperButton: {
    tooltip: 'Random wallpaper',
  },
};
