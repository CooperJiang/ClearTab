import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { useSettingsStore, useBookmarkStore, useQuickLinkStore, useRecentVisitsStore } from '../../stores';
import { ACCENT_COLORS } from '../../types';
import type { Bookmark, Category, QuickLink, CustomRecentVisit } from '../../types';
import { ColorPicker } from '../ColorPicker';
import { Switch, Slider, Button, Input, Select } from '../ui';
import { TrashPanel } from '../TrashPanel';
import { useTranslation } from '../../i18n';
import { useToast } from '../ui/Toast';
import WebDAVClient from '../../services/webdavClient';
import type { SyncData, BrowserBookmarkSnapshot, BrowserBookmarkNodeSnapshot } from '../../types/sync';
import GitHubSyncClient from '../../services/githubSyncClient';
import { Modal } from '../Modal';
import {
  captureBrowserSnapshot,
  summarizeBrowserSnapshot,
  diffBrowserSnapshots,
  applyBrowserSnapshot,
  type BrowserBookmarkRestoreStrategy,
  type BrowserBookmarksDiff,
  type BrowserBookmarkStats,
} from '../../services/browserBookmarkSyncService';
import styles from './SettingsDrawer.module.css';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type MenuKey = 'theme' | 'layout' | 'tools' | 'trash' | 'dataSync' | 'system' | 'about';
type WebdavMergeStrategy = 'replace' | 'remotePrimary' | 'localPrimary';
type DiffSectionKey = 'bookmarks' | 'quickLinks' | 'categories' | 'visits';

interface CollectionDiff<T> {
  localOnly: T[];
  remoteOnly: T[];
  changed: Array<{ id: string; local: T; remote: T }>;
}

interface WebdavDiff {
  bookmarks: CollectionDiff<Bookmark>;
  quickLinks: CollectionDiff<QuickLink>;
  categories: CollectionDiff<Category>;
  visits: CollectionDiff<CustomRecentVisit>;
}

interface DiffSectionConfig {
  key: DiffSectionKey;
  label: string;
  diff: CollectionDiff<unknown>;
  getLabel: (item: any) => string;
  getSubtitle: (item: any) => string;
}

const mergeCollections = <T extends { id: string }>(
  baseItems: T[],
  secondaryItems: T[] | undefined,
  preferBase = true
): T[] => {
  if (!Array.isArray(secondaryItems)) {
    return [...baseItems];
  }
  const secondaryArray = secondaryItems as T[];
  const result = preferBase ? [...baseItems] : [...secondaryArray];
  const existingIds = new Set(result.map(item => item.id));
  const source = preferBase ? secondaryArray : baseItems;

  for (const item of source) {
    if (!existingIds.has(item.id)) {
      result.push(item);
    }
  }
  return result;
};

const createCollectionDiff = <T extends { id: string }>(
  localItems: T[],
  remoteItems: unknown
): CollectionDiff<T> => {
  if (!Array.isArray(remoteItems)) {
    return { localOnly: localItems, remoteOnly: [], changed: [] };
  }
  const remoteArray = remoteItems as T[];
  const localMap = new Map(localItems.map(item => [item.id, item]));
  const remoteMap = new Map(remoteArray.map(item => [item.id, item]));
  const localOnly = localItems.filter(item => !remoteMap.has(item.id));
  const remoteOnly = remoteArray.filter(item => !localMap.has(item.id));
  const changed: Array<{ id: string; local: T; remote: T }> = [];

  for (const remoteItem of remoteArray) {
    const localItem = localMap.get(remoteItem.id);
    if (localItem) {
      const localString = JSON.stringify(localItem);
      const remoteString = JSON.stringify(remoteItem);
      if (localString !== remoteString) {
        changed.push({ id: remoteItem.id, local: localItem, remote: remoteItem });
      }
    }
  }

  return { localOnly, remoteOnly, changed };
};

const getBookmarkLabel = (item: Bookmark | QuickLink | CustomRecentVisit): string => {
  if (!item) return '';
  const anyItem = item as any;
  if ('title' in item && anyItem.title) return anyItem.title;
  if ('url' in item && anyItem.url) return anyItem.url;
  if ('id' in item) return anyItem.id;
  return '';
};

const getCategoryLabel = (item: Category) => {
  if (!item) return '';
  return item.name || item.id;
};

const getItemSubtitle = (item: Bookmark | QuickLink | CustomRecentVisit) => {
  if (!item) return '';
  if ('url' in item && (item as any).url) return (item as any).url;
  if ('visitTime' in item && typeof (item as any).visitTime === 'number') {
    return new Date((item as any).visitTime).toLocaleString();
  }
  return '';
};

const createCollapsedDiffState = (): Record<DiffSectionKey, boolean> => ({
  bookmarks: false,
  quickLinks: false,
  categories: false,
  visits: false,
});

const mergeByStrategy = <T extends { id: string }>(
  localItems: T[],
  remoteItems: unknown,
  strategy: WebdavMergeStrategy
): T[] => {
  const remoteArray = Array.isArray(remoteItems) ? remoteItems as T[] : [];
  if (strategy === 'replace') {
    return remoteArray;
  }
  if (strategy === 'remotePrimary') {
    return mergeCollections(remoteArray, localItems, false);
  }
  return mergeCollections(localItems, remoteItems as T[], true);
};

// 菜单图标组件
const ThemeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const SystemIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const DataSyncIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path>
  </svg>
);

const ToolsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
  </svg>
);

const LayoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="3" y1="9" x2="21" y2="9"></line>
    <line x1="9" y1="21" x2="9" y2="9"></line>
  </svg>
);

const AboutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const { settings, updateSettings } = useSettingsStore();
  const bookmarkStore = useBookmarkStore();
  const quickLinkStore = useQuickLinkStore();
  const recentVisitsStore = useRecentVisitsStore();
  const { t, locale, setLocale, supportedLocales } = useTranslation();
  const { showToast } = useToast();
  const [activeMenu, setActiveMenu] = useState<MenuKey>('theme');
  const [webdavTesting, setWebdavTesting] = useState(false);
  const [webdavSyncing, setWebdavSyncing] = useState(false);
  const [webdavModalOpen, setWebdavModalOpen] = useState(false);
  const [pendingWebdavData, setPendingWebdavData] = useState<SyncData | null>(null);
  const [webdavDiff, setWebdavDiff] = useState<WebdavDiff | null>(null);
  const [expandedDiffSections, setExpandedDiffSections] = useState<Record<DiffSectionKey, boolean>>(createCollapsedDiffState());
  const [githubTesting, setGithubTesting] = useState(false);
  const [githubSyncing, setGithubSyncing] = useState(false);
  const [githubModalOpen, setGithubModalOpen] = useState(false);
  const [pendingGithubData, setPendingGithubData] = useState<SyncData | null>(null);
  const [githubDiff, setGithubDiff] = useState<WebdavDiff | null>(null);
  const [expandedGithubDiffSections, setExpandedGithubDiffSections] = useState<Record<DiffSectionKey, boolean>>({
    bookmarks: false,
    quickLinks: false,
    categories: false,
    visits: false,
  });
  const [localBrowserSnapshot, setLocalBrowserSnapshot] = useState<BrowserBookmarkSnapshot | null>(null);
  const [browserSnapshotError, setBrowserSnapshotError] = useState<string | null>(null);
  const [webdavBrowserStrategy, setWebdavBrowserStrategy] = useState<BrowserBookmarkRestoreStrategy>('skip');
  const [githubBrowserStrategy, setGithubBrowserStrategy] = useState<BrowserBookmarkRestoreStrategy>('skip');
  const [webdavBrowserPreviewOpen, setWebdavBrowserPreviewOpen] = useState(false);
  const [githubBrowserPreviewOpen, setGithubBrowserPreviewOpen] = useState(false);
  const [webdavActiveTab, setWebdavActiveTab] = useState<'custom' | 'browser'>('custom');
  const [githubActiveTab, setGithubActiveTab] = useState<'custom' | 'browser'>('custom');

  // WebDAV 配置的本地状态
  const [webdavLocalConfig, setWebdavLocalConfig] = useState({
    url: '',
    username: '',
    password: '',
    path: '',
  });

  // GitHub 配置的本地状态
  const [githubLocalConfig, setGithubLocalConfig] = useState({
    token: '',
  });

  // 当 settings 更新时同步本地状态
  useEffect(() => {
    setWebdavLocalConfig({
      url: settings.webdavUrl || '',
      username: settings.webdavUsername || '',
      password: settings.webdavPassword || '',
      path: settings.webdavPath || '',
    });
  }, [settings.webdavUrl, settings.webdavUsername, settings.webdavPassword, settings.webdavPath]);

  // GitHub 配置本地状态同步
  useEffect(() => {
    setGithubLocalConfig({
      token: settings.githubToken || '',
    });
  }, [settings.githubToken]);

  // 动态生成菜单项
  const menuItems: { key: MenuKey; label: string; icon: ReactNode }[] = [
    { key: 'theme', label: t.settings.theme.title, icon: <ThemeIcon /> },
    { key: 'layout', label: t.settings.menu.layout, icon: <LayoutIcon /> },
    { key: 'tools', label: t.settings.menu.tools, icon: <ToolsIcon /> },
    { key: 'trash', label: t.settings.trash.title, icon: <TrashIcon /> },
    { key: 'dataSync', label: t.dataSync.title, icon: <DataSyncIcon /> },
    { key: 'system', label: t.settings.system.title, icon: <SystemIcon /> },
    { key: 'about', label: t.settings.menu.about, icon: <AboutIcon /> },
  ];

  // 语言选项
  const languageOptions = supportedLocales.map(loc => ({
    value: loc.code,
    label: loc.name,
  }));

  // 直接使用 settings 中的值，保持同步
  const darkWallpaperInput = settings.customBackgroundImage || '';
  const lightWallpaperInput = settings.customBackgroundImageLight || '';

  const setDarkWallpaperInput = (value: string) => {
    updateSettings({ customBackgroundImage: value });
  };

  const setLightWallpaperInput = (value: string) => {
    updateSettings({ customBackgroundImageLight: value });
  };

  const loadLocalBrowserSnapshot = async () => {
    try {
      const snapshot = await captureBrowserSnapshot();
      if (snapshot === null) {
        setLocalBrowserSnapshot(null);
        setBrowserSnapshotError(t.dataSync.browser.apiUnavailable);
        return;
      }
      setLocalBrowserSnapshot(snapshot);
      setBrowserSnapshotError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : t.dataSync.browser.captureFailed;
      setLocalBrowserSnapshot(null);
      setBrowserSnapshotError(message);
    }
  };

  const handleColorSelect = (color: string) => {
    updateSettings({ accentColor: color });
  };

// 重置壁纸（清空自定义和随机，恢复默认）
  const handleResetWallpaper = (theme: 'dark' | 'light') => {
    if (theme === 'dark') {
      updateSettings({
        customBackgroundImage: '',
        randomWallpaperImage: '',
      });
    } else {
      updateSettings({
        customBackgroundImageLight: '',
        randomWallpaperImageLight: '',
      });
    }
  };

  // 处理 WebDAV 输入框失焦保存
  const handleWebdavFieldBlur = (field: keyof typeof webdavLocalConfig, value: string) => {
    updateSettings({
      [`webdav${field.charAt(0).toUpperCase() + field.slice(1)}`]: value
    });
  };

  // WebDAV 配置是否完整（使用本地状态进行实时判断）
  const isWebdavConfigComplete = WebDAVClient.isConfigComplete({
    url: webdavLocalConfig.url,
    username: webdavLocalConfig.username,
    password: webdavLocalConfig.password,
    path: webdavLocalConfig.path,
  });

  // 测试 WebDAV 连接
  const handleTestWebdav = async () => {
    if (!isWebdavConfigComplete) {
      showToast(t.dataSync.webdav.configIncomplete, 'error');
      return;
    }
    setWebdavTesting(true);
    try {
      const result = await WebDAVClient.testConnection({
        url: webdavLocalConfig.url,
        username: webdavLocalConfig.username,
        password: webdavLocalConfig.password,
        path: webdavLocalConfig.path,
      });
      if (result.success) {
        showToast(t.dataSync.webdav.connectionSuccess, 'success');
      } else {
        showToast(`${t.dataSync.webdav.connectionFailed}: ${result.message}`, 'error');
      }
    } catch {
      showToast(t.dataSync.webdav.connectionFailed, 'error');
    } finally {
      setWebdavTesting(false);
    }
  };

  // 上传数据到 WebDAV
  const handleUploadToWebdav = async () => {
    if (!isWebdavConfigComplete) {
      showToast(t.dataSync.webdav.configIncomplete, 'error');
      return;
    }
    setWebdavSyncing(true);
    try {
      let browserSnapshot: BrowserBookmarkSnapshot | null = null;
      try {
        browserSnapshot = await captureBrowserSnapshot();
      } catch (error) {
        const message = error instanceof Error ? error.message : t.dataSync.browser.captureFailed;
        showToast(`${t.dataSync.browser.captureFailed}: ${message}`, 'error');
      }
      const syncData = WebDAVClient.createSyncData(
        settings as unknown as Record<string, unknown>,
        bookmarkStore.bookmarks,
        quickLinkStore.quickLinks,
        bookmarkStore.categories,
        recentVisitsStore.customVisits,
        {
          browserBookmarks: browserSnapshot && browserSnapshot.length ? browserSnapshot : undefined,
        }
      );
      const result = await WebDAVClient.uploadData(
        {
          url: webdavLocalConfig.url,
          username: webdavLocalConfig.username,
          password: webdavLocalConfig.password,
          path: webdavLocalConfig.path,
        },
        syncData
      );
      if (result.success) {
        updateSettings({ webdavLastSyncTime: Date.now() });
        showToast(t.dataSync.webdav.uploadSuccess, 'success');
      } else {
        showToast(`${t.dataSync.webdav.uploadFailed}: ${result.message}`, 'error');
      }
    } catch {
      showToast(t.dataSync.webdav.uploadFailed, 'error');
    } finally {
      setWebdavSyncing(false);
    }
  };

  // 从 WebDAV 下载数据
  const handleDownloadFromWebdav = async () => {
    if (!isWebdavConfigComplete) {
      showToast(t.dataSync.webdav.configIncomplete, 'error');
      return;
    }
    setWebdavSyncing(true);
    try {
      const result = await WebDAVClient.downloadData({
        url: webdavLocalConfig.url,
        username: webdavLocalConfig.username,
        password: webdavLocalConfig.password,
        path: webdavLocalConfig.path,
      });
      if (result.success && result.data) {
        const diff: WebdavDiff = {
          bookmarks: createCollectionDiff(bookmarkStore.bookmarks, result.data.bookmarks),
          quickLinks: createCollectionDiff(quickLinkStore.quickLinks, result.data.quickLinks),
          categories: createCollectionDiff(bookmarkStore.categories, result.data.categories),
          visits: createCollectionDiff(recentVisitsStore.customVisits, result.data.customRecentVisits),
        };
        setPendingWebdavData(result.data);
        setWebdavDiff(diff);
        setExpandedDiffSections(createCollapsedDiffState());
        if (result.data.browserBookmarks && result.data.browserBookmarks.length) {
          await loadLocalBrowserSnapshot();
        } else {
          setLocalBrowserSnapshot(null);
          setBrowserSnapshotError(null);
        }
        setWebdavBrowserStrategy('skip');
        setWebdavBrowserPreviewOpen(false);
        setWebdavActiveTab('custom');
        setWebdavModalOpen(true);
      } else {
        showToast(`${t.dataSync.webdav.downloadFailed}: ${result.message}`, 'error');
      }
    } catch {
      showToast(t.dataSync.webdav.downloadFailed, 'error');
    } finally {
      setWebdavSyncing(false);
    }
  };

  // GitHub 连接测试
  const handleTestGithub = async () => {
    const token = githubLocalConfig.token.trim();
    if (!token) {
      showToast(t.dataSync.github.configIncomplete, 'error');
      return;
    }
    if (token !== settings.githubToken) {
      updateSettings({ githubToken: token });
    }
    setGithubTesting(true);
    try {
      const result = await GitHubSyncClient.testConnection(token);
      if (result.success) {
        showToast(result.message, 'success');
      } else {
        showToast(`${t.dataSync.github.connectionFailed}: ${result.message}`, 'error');
      }
    } catch {
      showToast(t.dataSync.github.connectionFailed, 'error');
    } finally {
      setGithubTesting(false);
    }
  };

  // GitHub 上传数据
  const handleUploadToGithub = async () => {
    const token = githubLocalConfig.token.trim();
    if (!token) {
      showToast(t.dataSync.github.configIncomplete, 'error');
      return;
    }
    if (token !== settings.githubToken) {
      updateSettings({ githubToken: token });
    }
    setGithubSyncing(true);
    try {
      let browserSnapshot: BrowserBookmarkSnapshot | null = null;
      try {
        browserSnapshot = await captureBrowserSnapshot();
      } catch (error) {
        const message = error instanceof Error ? error.message : t.dataSync.browser.captureFailed;
        showToast(`${t.dataSync.browser.captureFailed}: ${message}`, 'error');
      }
      const syncData = GitHubSyncClient.createSyncData(
        settings as unknown as Record<string, unknown>,
        bookmarkStore.bookmarks,
        quickLinkStore.quickLinks,
        bookmarkStore.categories,
        recentVisitsStore.customVisits,
        {
          browserBookmarks: browserSnapshot && browserSnapshot.length ? browserSnapshot : undefined,
        }
      );
      const result = await GitHubSyncClient.uploadData(
        {
          token,
          gistId: settings.githubGistId || undefined,
        },
        syncData
      );
      if (result.success) {
        if (result.gistId && result.gistId !== settings.githubGistId) {
          updateSettings({ githubGistId: result.gistId });
          showToast(`${t.dataSync.github.uploadSuccess} (${t.dataSync.github.gistCreated})`, 'success');
        } else {
          showToast(t.dataSync.github.uploadSuccess, 'success');
        }
        updateSettings({ githubLastSyncTime: Date.now() });
      } else {
        showToast(`${t.dataSync.github.uploadFailed}: ${result.message}`, 'error');
      }
    } catch {
      showToast(t.dataSync.github.uploadFailed, 'error');
    } finally {
      setGithubSyncing(false);
    }
  };

  // GitHub 下载数据
  const handleDownloadFromGithub = async () => {
    const token = githubLocalConfig.token.trim();
    if (!token) {
      showToast(t.dataSync.github.configIncomplete, 'error');
      return;
    }
    if (!settings.githubGistId) {
      showToast(t.dataSync.github.requireUpload, 'error');
      return;
    }
    if (token !== settings.githubToken) {
      updateSettings({ githubToken: token });
    }
    setGithubSyncing(true);
    try {
      const result = await GitHubSyncClient.downloadData({
        token,
        gistId: settings.githubGistId,
      });
      if (result.success && result.data) {
        const diff: WebdavDiff = {
          bookmarks: createCollectionDiff(bookmarkStore.bookmarks, result.data.bookmarks),
          quickLinks: createCollectionDiff(quickLinkStore.quickLinks, result.data.quickLinks),
          categories: createCollectionDiff(bookmarkStore.categories, result.data.categories),
          visits: createCollectionDiff(recentVisitsStore.customVisits, result.data.customRecentVisits),
        };
        setPendingGithubData(result.data);
        setGithubDiff(diff);
        setExpandedGithubDiffSections(createCollapsedDiffState());
        if (result.data.browserBookmarks && result.data.browserBookmarks.length) {
          await loadLocalBrowserSnapshot();
        } else {
          setLocalBrowserSnapshot(null);
          setBrowserSnapshotError(null);
        }
        setGithubBrowserStrategy('skip');
        setGithubBrowserPreviewOpen(false);
        setGithubActiveTab('custom');
        setGithubModalOpen(true);
      } else {
        showToast(`${t.dataSync.github.downloadFailed}: ${result.message}`, 'error');
      }
    } catch {
      showToast(t.dataSync.github.downloadFailed, 'error');
    } finally {
      setGithubSyncing(false);
    }
  };

  // 通用的数据应用函数
  const applySyncData = (
    data: SyncData,
    strategy: WebdavMergeStrategy,
    source: 'webdav' | 'github'
  ) => {
    if (data.settings) {
      updateSettings(data.settings as Partial<typeof settings>);
    }

    if (Array.isArray(data.bookmarks)) {
      const merged = mergeByStrategy(
        bookmarkStore.bookmarks,
        data.bookmarks,
        strategy
      );
      bookmarkStore.setBookmarks(merged as typeof bookmarkStore.bookmarks);
    }

    if (Array.isArray(data.quickLinks)) {
      const merged = mergeByStrategy(
        quickLinkStore.quickLinks,
        data.quickLinks,
        strategy
      );
      quickLinkStore.setQuickLinks(merged as typeof quickLinkStore.quickLinks);
    }

    if (Array.isArray(data.categories)) {
      const merged = mergeByStrategy(
        bookmarkStore.categories,
        data.categories,
        strategy
      );
      bookmarkStore.setCategories(merged as typeof bookmarkStore.categories);
    }

    if (Array.isArray(data.customRecentVisits)) {
      const merged = mergeByStrategy(
        recentVisitsStore.customVisits,
        data.customRecentVisits,
        strategy
      );
      recentVisitsStore.setCustomVisits(merged as typeof recentVisitsStore.customVisits);
    }

    // 更新对应的同步时间
    if (source === 'webdav') {
      updateSettings({ webdavLastSyncTime: Date.now() });
    } else {
      updateSettings({ githubLastSyncTime: Date.now() });
    }

    const successMessage =
      strategy === 'replace'
        ? t.dataSync.webdav.downloadReplaceSuccess
        : strategy === 'remotePrimary'
          ? t.dataSync.webdav.downloadRemotePrimarySuccess
          : t.dataSync.webdav.downloadLocalPrimarySuccess;
    showToast(successMessage, 'success');
  };

  const handleWebdavDownloadChoice = async (strategy: WebdavMergeStrategy) => {
    if (!pendingWebdavData) return;
    setWebdavSyncing(true);
    try {
      applySyncData(pendingWebdavData, strategy, 'webdav');
      await applyBrowserData(pendingWebdavData.browserBookmarks, webdavBrowserStrategy);
      setPendingWebdavData(null);
      setWebdavDiff(null);
      setExpandedDiffSections(createCollapsedDiffState());
      setWebdavModalOpen(false);
      setWebdavBrowserStrategy('skip');
      setWebdavBrowserPreviewOpen(false);
    } finally {
      setWebdavSyncing(false);
    }
  };

  const handleCloseWebdavModal = () => {
    setPendingWebdavData(null);
    setWebdavDiff(null);
    setExpandedDiffSections(createCollapsedDiffState());
    setWebdavModalOpen(false);
    setWebdavBrowserStrategy('skip');
    setWebdavBrowserPreviewOpen(false);
    setWebdavActiveTab('custom');
  };

  const handleGithubDownloadChoice = async (strategy: WebdavMergeStrategy) => {
    if (!pendingGithubData) return;
    setGithubSyncing(true);
    try {
      applySyncData(pendingGithubData, strategy, 'github');
      await applyBrowserData(pendingGithubData.browserBookmarks, githubBrowserStrategy);
      setPendingGithubData(null);
      setGithubDiff(null);
      setExpandedGithubDiffSections(createCollapsedDiffState());
      setGithubModalOpen(false);
      setGithubBrowserStrategy('skip');
      setGithubBrowserPreviewOpen(false);
    } finally {
      setGithubSyncing(false);
    }
  };

  const handleCloseGithubModal = () => {
    setPendingGithubData(null);
    setGithubDiff(null);
    setExpandedGithubDiffSections(createCollapsedDiffState());
    setGithubModalOpen(false);
    setGithubBrowserStrategy('skip');
    setGithubBrowserPreviewOpen(false);
    setGithubActiveTab('custom');
  };

  const toggleGithubDiffSection = (key: DiffSectionKey) => {
    setExpandedGithubDiffSections(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 格式化最后同步时间
  const formatLastSyncTime = (timestamp: number) => {
    if (!timestamp) return t.dataSync.webdav.never;
    const date = new Date(timestamp);
    return date.toLocaleString(locale);
  };

  const localStats = {
    bookmarks: bookmarkStore.bookmarks.length,
    quickLinks: quickLinkStore.quickLinks.length,
    categories: bookmarkStore.categories.length,
    visits: recentVisitsStore.customVisits.length,
  };

  const remoteStats = {
    bookmarks: pendingWebdavData && Array.isArray(pendingWebdavData.bookmarks) ? pendingWebdavData.bookmarks.length : 0,
    quickLinks: pendingWebdavData && Array.isArray(pendingWebdavData.quickLinks) ? pendingWebdavData.quickLinks.length : 0,
    categories: pendingWebdavData && Array.isArray(pendingWebdavData.categories) ? pendingWebdavData.categories.length : 0,
    visits: pendingWebdavData && Array.isArray(pendingWebdavData.customRecentVisits) ? pendingWebdavData.customRecentVisits.length : 0,
  };
  const hasWebdavBrowserBackup = !!(pendingWebdavData?.browserBookmarks && pendingWebdavData.browserBookmarks.length);

  const localBrowserStats = useMemo(
    () => summarizeBrowserSnapshot(localBrowserSnapshot),
    [localBrowserSnapshot]
  );

  const webdavBrowserStats = useMemo(
    () => summarizeBrowserSnapshot(pendingWebdavData?.browserBookmarks || null),
    [pendingWebdavData?.browserBookmarks]
  );

  const githubBrowserStats = useMemo(
    () => summarizeBrowserSnapshot(pendingGithubData?.browserBookmarks || null),
    [pendingGithubData?.browserBookmarks]
  );

  const webdavBrowserDiff = useMemo(
    () => diffBrowserSnapshots(localBrowserSnapshot, pendingWebdavData?.browserBookmarks || null),
    [localBrowserSnapshot, pendingWebdavData?.browserBookmarks]
  );

  const githubBrowserDiff = useMemo(
    () => diffBrowserSnapshots(localBrowserSnapshot, pendingGithubData?.browserBookmarks || null),
    [localBrowserSnapshot, pendingGithubData?.browserBookmarks]
  );

  const formatDiffSummary = (diff?: CollectionDiff<unknown>) => {
    if (!diff) return t.dataSync.webdav.diffNoChanges;
    const added = diff.remoteOnly.length;
    const removed = diff.localOnly.length;
    const changed = diff.changed.length;
    if (!added && !removed && !changed) {
      return t.dataSync.webdav.diffNoChanges;
    }
    return `${t.dataSync.webdav.diffAdded}: ${added} · ${t.dataSync.webdav.diffRemoved}: ${removed} · ${t.dataSync.webdav.diffChanged}: ${changed}`;
  };

  const diffSectionsConfig: DiffSectionConfig[] = webdavDiff
    ? [
        {
          key: 'bookmarks' as DiffSectionKey,
          label: t.dataSync.webdav.stats.bookmarks,
          diff: webdavDiff.bookmarks,
          getLabel: (item: Bookmark) => getBookmarkLabel(item),
          getSubtitle: (item: Bookmark) => getItemSubtitle(item),
        },
        {
          key: 'quickLinks' as DiffSectionKey,
          label: t.dataSync.webdav.stats.quickLinks,
          diff: webdavDiff.quickLinks,
          getLabel: (item: QuickLink) => getBookmarkLabel(item),
          getSubtitle: (item: QuickLink) => getItemSubtitle(item),
        },
        {
          key: 'categories' as DiffSectionKey,
          label: t.dataSync.webdav.stats.categories,
          diff: webdavDiff.categories,
          getLabel: (item: Category) => getCategoryLabel(item),
          getSubtitle: () => '',
        },
        {
          key: 'visits' as DiffSectionKey,
          label: t.dataSync.webdav.stats.customVisits,
          diff: webdavDiff.visits,
          getLabel: (item: CustomRecentVisit) => getBookmarkLabel(item),
          getSubtitle: (item: CustomRecentVisit) => getItemSubtitle(item),
        },
      ]
    : [];

  // GitHub 远程数据统计
  const githubRemoteStats = {
    bookmarks: pendingGithubData && Array.isArray(pendingGithubData.bookmarks) ? pendingGithubData.bookmarks.length : 0,
    quickLinks: pendingGithubData && Array.isArray(pendingGithubData.quickLinks) ? pendingGithubData.quickLinks.length : 0,
    categories: pendingGithubData && Array.isArray(pendingGithubData.categories) ? pendingGithubData.categories.length : 0,
    visits: pendingGithubData && Array.isArray(pendingGithubData.customRecentVisits) ? pendingGithubData.customRecentVisits.length : 0,
  };
  const hasGithubBrowserBackup = !!(pendingGithubData?.browserBookmarks && pendingGithubData.browserBookmarks.length);

  const renderBrowserSyncSection = (
    remoteSnapshot: BrowserBookmarkSnapshot | null | undefined,
    remoteStats: BrowserBookmarkStats,
    diff: BrowserBookmarksDiff,
    strategy: BrowserBookmarkRestoreStrategy,
    setStrategy: (next: BrowserBookmarkRestoreStrategy) => void,
    previewOpen: boolean,
    setPreviewOpen: (next: boolean) => void
  ) => {
    if (!remoteSnapshot || remoteSnapshot.length === 0) {
      return (
        <div className={styles.chromeSyncSection}>
          <p className={styles.chromeSyncEmpty}>{t.dataSync.browser.emptyBackup}</p>
        </div>
      );
    }

    const strategyOptions: Array<{
      key: BrowserBookmarkRestoreStrategy;
      title: string;
      description: string;
    }> = [
      { key: 'skip', title: t.dataSync.browser.strategy.skip, description: t.dataSync.browser.strategy.skipDesc },
      { key: 'append', title: t.dataSync.browser.strategy.append, description: t.dataSync.browser.strategy.appendDesc },
      { key: 'replace', title: t.dataSync.browser.strategy.replace, description: t.dataSync.browser.strategy.replaceDesc },
    ];

    const disableBrowserActions = !!browserSnapshotError;

    return (
      <div className={styles.chromeSyncSection}>
        <div className={styles.chromeSyncHeader}>
          <div>
            <span className={styles.chromeSyncTitle}>{t.dataSync.browser.title}</span>
            <p className={styles.chromeSyncDescription}>{t.dataSync.browser.description}</p>
          </div>
          <Button variant="ghost" size="small" onClick={() => setPreviewOpen(!previewOpen)}>
            {previewOpen ? t.dataSync.browser.previewClose : t.dataSync.browser.previewButton}
          </Button>
        </div>
        <div className={styles.chromeSyncStatsRow}>
          <div className={styles.chromeSyncStatsCard}>
            <span>{t.dataSync.webdav.localData}</span>
            <strong>{localBrowserStats.totalBookmarks}</strong>
            <p>{t.dataSync.browser.statsFolders}: {localBrowserStats.totalFolders}</p>
          </div>
          <div className={styles.chromeSyncStatsCard}>
            <span>{t.dataSync.webdav.remoteData}</span>
            <strong>{remoteStats.totalBookmarks}</strong>
            <p>{t.dataSync.browser.statsFolders}: {remoteStats.totalFolders}</p>
          </div>
          <div className={styles.chromeSyncStatsCard}>
            <span>{t.dataSync.browser.diffLabel}</span>
            <strong>{diff.added + diff.changed}</strong>
            <p>
              {t.dataSync.browser.diffAdded}: {diff.added} · {t.dataSync.browser.diffRemoved}: {diff.removed} · {t.dataSync.browser.diffChanged}: {diff.changed}
            </p>
          </div>
        </div>
        <p className={styles.chromeSyncNote}>{t.dataSync.browser.metadataNote}</p>
        {browserSnapshotError && (
          <p className={styles.chromeSyncError}>{browserSnapshotError}</p>
        )}
        <div className={styles.chromeStrategyRow}>
          {strategyOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`${styles.chromeStrategyCard} ${strategy === option.key ? styles.chromeStrategyCardActive : ''}`}
              onClick={() => setStrategy(option.key)}
              disabled={option.key !== 'skip' && disableBrowserActions}
            >
              <strong>{option.title}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
        {previewOpen && (
          <div className={styles.chromePreview}>
            {renderBrowserPreviewTree(remoteSnapshot)}
          </div>
        )}
      </div>
    );
  };

  const renderBrowserPreviewTree = (branches: BrowserBookmarkSnapshot) => {
    if (!branches || !branches.length) {
      return <p className={styles.chromePreviewEmpty}>{t.dataSync.browser.previewEmpty}</p>;
    }

    let rendered = 0;
    const MAX_ITEMS = 200;

    const renderNodes = (nodes: BrowserBookmarkNodeSnapshot[], depth = 0) => {
      return (
        <ul className={styles.chromePreviewList}>
          {nodes.map((node, index) => {
            if (rendered >= MAX_ITEMS) {
              return null;
            }
            rendered += 1;
            if (node.type === 'folder') {
              return (
                <li key={`${node.title}-${depth}-${index}`}>
                  <div className={styles.chromePreviewFolder}>
                    <span>{node.title || t.dataSync.browser.unnamedFolder}</span>
                  </div>
                  {node.children && node.children.length > 0 ? renderNodes(node.children, depth + 1) : (
                    <p className={styles.chromePreviewEmpty}>{t.dataSync.browser.emptyFolder}</p>
                  )}
                </li>
              );
            }
            return (
              <li key={`${node.title}-${node.url}-${depth}-${index}`}>
                <div className={styles.chromePreviewBookmark}>
                  <span className={styles.chromePreviewBookmarkTitle}>{node.title || node.url || t.dataSync.browser.unnamedBookmark}</span>
                  {node.url && <span className={styles.chromePreviewBookmarkUrl}>{node.url}</span>}
                </div>
              </li>
            );
          })}
        </ul>
      );
    };

    return (
      <div className={styles.chromePreviewTree}>
        {branches.map((branch) => (
          <div className={styles.chromePreviewBranch} key={branch.rootId}>
            <strong>{branch.rootTitle || t.dataSync.browser.defaultRoot}</strong>
            {branch.items.length ? renderNodes(branch.items) : (
              <p className={styles.chromePreviewEmpty}>{t.dataSync.browser.emptyFolder}</p>
            )}
          </div>
        ))}
        {rendered >= MAX_ITEMS && (
          <p className={styles.chromePreviewHint}>{t.dataSync.browser.previewLimit}</p>
        )}
      </div>
    );
  };

  // GitHub diff 配置
  const githubDiffSectionsConfig: DiffSectionConfig[] = githubDiff
    ? [
        {
          key: 'bookmarks' as DiffSectionKey,
          label: t.dataSync.webdav.stats.bookmarks,
          diff: githubDiff.bookmarks,
          getLabel: (item: Bookmark) => getBookmarkLabel(item),
          getSubtitle: (item: Bookmark) => getItemSubtitle(item),
        },
        {
          key: 'quickLinks' as DiffSectionKey,
          label: t.dataSync.webdav.stats.quickLinks,
          diff: githubDiff.quickLinks,
          getLabel: (item: QuickLink) => getBookmarkLabel(item),
          getSubtitle: (item: QuickLink) => getItemSubtitle(item),
        },
        {
          key: 'categories' as DiffSectionKey,
          label: t.dataSync.webdav.stats.categories,
          diff: githubDiff.categories,
          getLabel: (item: Category) => getCategoryLabel(item),
          getSubtitle: () => '',
        },
        {
          key: 'visits' as DiffSectionKey,
          label: t.dataSync.webdav.stats.customVisits,
          diff: githubDiff.visits,
          getLabel: (item: CustomRecentVisit) => getBookmarkLabel(item),
          getSubtitle: (item: CustomRecentVisit) => getItemSubtitle(item),
        },
      ]
    : [];

  const toggleDiffSection = (key: DiffSectionKey) => {
    setExpandedDiffSections(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const applyBrowserData = async (
    snapshot: BrowserBookmarkSnapshot | null | undefined,
    strategy: BrowserBookmarkRestoreStrategy
  ) => {
    if (!snapshot || !snapshot.length || strategy === 'skip') {
      return;
    }
    try {
      await applyBrowserSnapshot(snapshot, strategy);
      const successMessage =
        strategy === 'replace'
          ? t.dataSync.browser.replaceSuccess
          : t.dataSync.browser.appendSuccess;
      showToast(successMessage, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : t.dataSync.browser.applyFailed;
      showToast(`${t.dataSync.browser.applyFailed}: ${message}`, 'error');
    }
  };

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
            <span className={styles.sidebarTitle}>{t.settings.title}</span>
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
            {activeMenu === 'theme' && (
              <>
                {/* 深色模式切换 */}
                <div className={styles.section}>
                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>{t.settings.theme.darkMode}</span>
                    <Switch
                      checked={settings.themeMode === 'dark'}
                      onChange={(checked) => updateSettings({ themeMode: checked ? 'dark' : 'light' })}
                    />
                  </div>
                </div>

                {/* 显示主题切换按钮 */}
                <div className={styles.section}>
                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>{t.settings.theme.showThemeToggle}</span>
                    <Switch
                      checked={settings.showThemeToggle}
                      onChange={(checked) => updateSettings({ showThemeToggle: checked })}
                    />
                  </div>
                </div>


                {/* 书签分组设置 */}
                <div className={styles.section}>
                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>{t.bookmarkGrouping.title}</span>
                    <Switch
                      checked={settings.enableBookmarkGrouping}
                      onChange={(checked) => updateSettings({ enableBookmarkGrouping: checked })}
                    />
                  </div>
                  <p className={styles.settingDescription}>
                    {t.bookmarkGrouping.description}
                  </p>
                </div>

                {/* 圆角设置 */}
                <div className={styles.section}>
                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>{t.settings.theme.borderRadius}</span>
                    <div className={styles.radiusOptions}>
                      {(['none', 'small', 'medium', 'large', 'xlarge'] as const).map((radius) => {
                        const radiusStyle = { none: '0', small: '4px', medium: '8px', large: '12px', xlarge: '16px' }[radius];
                        return (
                          <button
                            key={radius}
                            className={`${styles.radiusButton} ${settings.borderRadius === radius ? styles.active : ''}`}
                            onClick={() => updateSettings({ borderRadius: radius })}
                            style={{ borderRadius: radiusStyle }}
                          >
                            {t.settings.theme[`radius${radius.charAt(0).toUpperCase() + radius.slice(1)}` as keyof typeof t.settings.theme]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 主题色选择 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>{t.settings.theme.accentColor}</h3>
                  <div className={styles.colorGrid}>
                    {ACCENT_COLORS.map((item) => (
                      <button
                        key={item.id}
                        className={`${styles.colorButton} ${
                          settings.accentColor === item.color ? styles.active : ''
                        }`}
                        style={{ backgroundColor: item.color }}
                        onClick={() => handleColorSelect(item.color)}
                        title={item.name}
                      >
                        {settings.accentColor === item.color && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                  {/* 自定义颜色 */}
                  <div className={styles.customColorRow}>
                    <span className={styles.customColorLabel}>{t.settings.theme.customColor}</span>
                    <ColorPicker
                      value={settings.accentColor}
                      onChange={handleColorSelect}
                    />
                  </div>
                </div>

                {/* 随机壁纸按钮 */}
                <div className={styles.section}>
                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>{t.settings.wallpaper.showRandomButton}</span>
                    <Switch
                      checked={settings.showWallpaperButton}
                      onChange={(checked) => updateSettings({ showWallpaperButton: checked })}
                    />
                  </div>
                </div>

                {/* 壁纸设置 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>{t.settings.wallpaper.customWallpaper}</h3>

                  {/* 暗色模式壁纸 */}
                  <div className={styles.wallpaperGroup}>
                    <label className={styles.wallpaperLabel}>{t.settings.wallpaper.darkModeWallpaper}</label>
                    <div className={styles.wallpaperInputRow}>
                      <Input
                        type="text"
                        placeholder={t.settings.wallpaper.inputPlaceholder}
                        value={darkWallpaperInput}
                        onChange={(e) => setDarkWallpaperInput(e.target.value)}
                        fullWidth
                      />
                      <Button variant="secondary" onClick={() => handleResetWallpaper('dark')}>
                        {t.common.reset}
                      </Button>
                    </div>
                  </div>

                  {/* 亮色模式壁纸 */}
                  <div className={styles.wallpaperGroup}>
                    <label className={styles.wallpaperLabel}>{t.settings.wallpaper.lightModeWallpaper}</label>
                    <div className={styles.wallpaperInputRow}>
                      <Input
                        type="text"
                        placeholder={t.settings.wallpaper.inputPlaceholder}
                        value={lightWallpaperInput}
                        onChange={(e) => setLightWallpaperInput(e.target.value)}
                        fullWidth
                      />
                      <Button variant="secondary" onClick={() => handleResetWallpaper('light')}>
                        {t.common.reset}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* PixelPunk 随机壁纸 API 设置 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>PixelPunk API</h3>
                  <div className={styles.wallpaperGroup}>
                    <label className={styles.wallpaperLabel}>API URL</label>
                    <Input
                      type="text"
                      placeholder="https://v1.pixelpunk.cc/api/v1/r/rnd_7Zxaj9XXhBa4"
                      value={settings.pixelPunkApiUrl}
                      onChange={(e) => updateSettings({ pixelPunkApiUrl: e.target.value })}
                      fullWidth
                    />
                  </div>
                </div>

                {/* 遮罩透明度设置 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>{t.settings.overlay.title}</h3>
                  <Slider
                    label={t.settings.overlay.darkMode}
                    displayValue={`${Math.round(settings.backgroundOverlayDark * 100)}%`}
                    min={0}
                    max={100}
                    step={5}
                    value={settings.backgroundOverlayDark * 100}
                    onChange={(v) => updateSettings({ backgroundOverlayDark: v / 100 })}
                  />
                  <Slider
                    label={t.settings.overlay.lightMode}
                    displayValue={`${Math.round(settings.backgroundOverlayLight * 100)}%`}
                    min={0}
                    max={100}
                    step={5}
                    value={settings.backgroundOverlayLight * 100}
                    onChange={(v) => updateSettings({ backgroundOverlayLight: v / 100 })}
                  />
                </div>

                {/* 背景模糊设置 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>{t.settings.blur.title}</h3>
                  <Slider
                    label={t.settings.blur.darkMode}
                    displayValue={`${settings.backgroundBlurDark}px`}
                    min={0}
                    max={20}
                    step={1}
                    value={settings.backgroundBlurDark}
                    onChange={(v) => updateSettings({ backgroundBlurDark: v })}
                  />
                  <Slider
                    label={t.settings.blur.lightMode}
                    displayValue={`${settings.backgroundBlurLight}px`}
                    min={0}
                    max={20}
                    step={1}
                    value={settings.backgroundBlurLight}
                    onChange={(v) => updateSettings({ backgroundBlurLight: v })}
                  />
                </div>

                {/* 显示模块 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>{t.settings.display.title}</h3>
                  <div className={styles.optionList}>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>{t.settings.display.showBookmarks}</span>
                      <Switch
                        checked={settings.showBookmarks}
                        onChange={(checked) => updateSettings({ showBookmarks: checked })}
                      />
                    </div>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>{t.settings.display.showRecentVisits}</span>
                      <Switch
                        checked={settings.showRecentVisits}
                        onChange={(checked) => updateSettings({ showRecentVisits: checked })}
                      />
                    </div>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>{t.settings.display.showQuickLinks}</span>
                      <Switch
                        checked={settings.showQuickLinks}
                        onChange={(checked) => updateSettings({ showQuickLinks: checked })}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeMenu === 'layout' && (
              <>
                {/* 侧边栏布局模式 */}
                <div className={styles.section}>
                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>{t.settings.layout.sidebarLayout}</span>
                    <Switch
                      checked={settings.layoutMode === 'sidebar'}
                      onChange={(checked) =>
                        updateSettings({ layoutMode: checked ? 'sidebar' : 'classic' })
                      }
                    />
                  </div>
                  <p className={styles.settingDescription}>
                    {t.settings.layout.sidebarDescription}
                  </p>
                </div>

                {/* 主视图宽度设置 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>{t.settings.layout.mainAreaTitle}</h3>
                  <div className={styles.optionList}>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>{t.settings.layout.limitContentWidth}</span>
                      <Switch
                        checked={(settings.contentMaxWidth ?? 0) > 0}
                        onChange={(checked) =>
                          updateSettings({ contentMaxWidth: checked ? 1400 : 0 })
                        }
                      />
                    </div>
                    {(settings.contentMaxWidth ?? 0) > 0 && (
                      <Slider
                        label={t.settings.layout.maxContentWidth}
                        displayValue={`${settings.contentMaxWidth} px`}
                        min={800}
                        max={2400}
                        step={50}
                        value={settings.contentMaxWidth}
                        onChange={(v) => updateSettings({ contentMaxWidth: v })}
                      />
                    )}
                  </div>
                  <p className={styles.settingDescription}>
                    {t.settings.layout.mainAreaDescription}
                  </p>
                </div>

                {/* 搜索栏设置 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>{t.settings.layout.searchBarTitle}</h3>
                  <div className={styles.optionList}>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>{t.settings.layout.showSearchBar}</span>
                      <Switch
                        checked={settings.showSearchBar}
                        onChange={(checked) => updateSettings({ showSearchBar: checked })}
                      />
                    </div>
                    {settings.showSearchBar && (
                      <>
                        <Slider
                          label={t.settings.layout.height}
                          displayValue={`${settings.searchBarHeight} px`}
                          min={36}
                          max={60}
                          step={2}
                          value={settings.searchBarHeight}
                          onChange={(v) => updateSettings({ searchBarHeight: v })}
                        />
                        <Slider
                          label={t.settings.layout.width}
                          displayValue={`${settings.searchBarWidth} px`}
                          min={400}
                          max={800}
                          step={20}
                          value={settings.searchBarWidth}
                          onChange={(v) => updateSettings({ searchBarWidth: v })}
                        />
                        <Slider
                          label={t.settings.layout.radius}
                          displayValue={`${settings.searchBarBorderRadius} px`}
                          min={0}
                          max={30}
                          step={1}
                          value={settings.searchBarBorderRadius}
                          onChange={(v) => updateSettings({ searchBarBorderRadius: v })}
                        />
                        <Slider
                          label={t.settings.layout.opacity}
                          displayValue={`${Math.round(settings.searchBarOpacity * 100)}%`}
                          min={0}
                          max={100}
                          step={1}
                          value={settings.searchBarOpacity * 100}
                          onChange={(v) => updateSettings({ searchBarOpacity: v / 100 })}
                        />
                        <div className={styles.settingRow}>
                          <span className={styles.settingLabel}>{t.settings.layout.searchHistory}</span>
                          <Switch
                            checked={settings.showSearchHistory}
                            onChange={(checked) => updateSettings({ showSearchHistory: checked })}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeMenu === 'tools' && (
              <>
                {/* 时钟设置 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>{t.settings.clock.title}</h3>
                  <div className={styles.optionList}>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>{t.settings.display.showClock}</span>
                      <Switch
                        checked={settings.showClock}
                        onChange={(checked) => updateSettings({ showClock: checked })}
                      />
                    </div>
                    {settings.showClock && (
                      <>
                        <div className={styles.settingRow}>
                          <span className={styles.settingLabel}>{t.settings.clock.showSeconds}</span>
                          <Switch
                            checked={settings.showSeconds}
                            onChange={(checked) => updateSettings({ showSeconds: checked })}
                          />
                        </div>
                        <div className={styles.settingRow}>
                          <span className={styles.settingLabel}>{t.settings.clock.clockColor}</span>
                          <ColorPicker
                            value={settings.clockColor}
                            onChange={(color) => updateSettings({ clockColor: color })}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 一言设置 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>{t.settings.quote.title}</h3>
                  <div className={styles.optionList}>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>{t.settings.display.showQuote}</span>
                      <Switch
                        checked={settings.showQuote}
                        onChange={(checked) => updateSettings({ showQuote: checked })}
                      />
                    </div>
                    {settings.showQuote && (
                      <div className={styles.settingRow}>
                        <span className={styles.settingLabel}>{t.settings.quote.refreshInterval}</span>
                        <Select
                          value={settings.quoteRefreshInterval}
                          onChange={(value) => updateSettings({ quoteRefreshInterval: value as any })}
                          options={[
                            { value: 'refresh', label: t.settings.quote.refreshOptions.refresh },
                            { value: '1min', label: t.settings.quote.refreshOptions['1min'] },
                            { value: '10min', label: t.settings.quote.refreshOptions['10min'] },
                            { value: '1hour', label: t.settings.quote.refreshOptions['1hour'] },
                            { value: '1day', label: t.settings.quote.refreshOptions['1day'] },
                          ]}
                          width={140}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 番茄钟设置 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>{t.settings.pomodoro.title}</h3>
                  <div className={styles.optionList}>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>{t.settings.pomodoro.showTimer}</span>
                      <Switch
                        checked={settings.showPomodoroTimer}
                        onChange={(checked) => updateSettings({ showPomodoroTimer: checked })}
                      />
                    </div>
                    {settings.showPomodoroTimer && (
                      <>
                        <div className={styles.settingRow}>
                          <span className={styles.settingLabel}>{t.settings.pomodoro.workDuration}</span>
                          <Select
                            value={String(settings.pomodoroWorkDuration ?? 25)}
                            onChange={(value) => updateSettings({ pomodoroWorkDuration: Number(value) })}
                            options={[
                              { value: '15', label: t.settings.pomodoro.minutes.replace('{value}', '15') },
                              { value: '20', label: t.settings.pomodoro.minutes.replace('{value}', '20') },
                              { value: '25', label: t.settings.pomodoro.minutes.replace('{value}', '25') },
                              { value: '30', label: t.settings.pomodoro.minutes.replace('{value}', '30') },
                              { value: '45', label: t.settings.pomodoro.minutes.replace('{value}', '45') },
                              { value: '60', label: t.settings.pomodoro.minutes.replace('{value}', '60') },
                            ]}
                            width={120}
                          />
                        </div>
                        <div className={styles.settingRow}>
                          <span className={styles.settingLabel}>{t.settings.pomodoro.breakDuration}</span>
                          <Select
                            value={String(settings.pomodoroBreakDuration ?? 5)}
                            onChange={(value) => updateSettings({ pomodoroBreakDuration: Number(value) })}
                            options={[
                              { value: '3', label: t.settings.pomodoro.minutes.replace('{value}', '3') },
                              { value: '5', label: t.settings.pomodoro.minutes.replace('{value}', '5') },
                              { value: '10', label: t.settings.pomodoro.minutes.replace('{value}', '10') },
                              { value: '15', label: t.settings.pomodoro.minutes.replace('{value}', '15') },
                            ]}
                            width={120}
                          />
                        </div>
                        <div className={styles.settingRow}>
                          <span className={styles.settingLabel}>{t.settings.pomodoro.showSecondTicks}</span>
                          <Switch
                            checked={settings.pomodoroShowSecondTicks}
                            onChange={(checked) => updateSettings({ pomodoroShowSecondTicks: checked })}
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <p className={styles.settingDescription}>
                    {t.settings.pomodoro.description}
                  </p>
                </div>
              </>
            )}

            {activeMenu === 'trash' && (
              <TrashPanel />
            )}

            {activeMenu === 'dataSync' && (
              <>
                {/* WebDAV 同步 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>{t.dataSync.webdav.title}</h3>
                  
                  {/* 启用 WebDAV */}
                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>{t.dataSync.webdav.enable}</span>
                    <Switch
                      checked={settings.webdavEnabled}
                      onChange={(checked) => updateSettings({ webdavEnabled: checked })}
                    />
                  </div>

                  {/* WebDAV 配置 */}
                  {settings.webdavEnabled && (
                    <>
                      {/* 服务器地址 */}
                      <div className={styles.wallpaperGroup}>
                        <label className={styles.wallpaperLabel}>{t.dataSync.webdav.serverUrl}</label>
                        <Input
                          type="text"
                          placeholder={t.dataSync.webdav.serverUrlPlaceholder}
                          value={webdavLocalConfig.url}
                          onChange={(e) => setWebdavLocalConfig(prev => ({ ...prev, url: e.target.value }))}
                          onBlur={(e) => handleWebdavFieldBlur('url', e.target.value)}
                          fullWidth
                        />
                      </div>

                      {/* 用户名 */}
                      <div className={styles.wallpaperGroup}>
                        <label className={styles.wallpaperLabel}>{t.dataSync.webdav.username}</label>
                        <Input
                          type="text"
                          placeholder={t.dataSync.webdav.usernamePlaceholder}
                          value={webdavLocalConfig.username}
                          onChange={(e) => setWebdavLocalConfig(prev => ({ ...prev, username: e.target.value }))}
                          onBlur={(e) => handleWebdavFieldBlur('username', e.target.value)}
                          fullWidth
                        />
                      </div>

                      {/* 密码 */}
                      <div className={styles.wallpaperGroup}>
                        <label className={styles.wallpaperLabel}>{t.dataSync.webdav.password}</label>
                        <Input
                          type="password"
                          placeholder={t.dataSync.webdav.passwordPlaceholder}
                          value={webdavLocalConfig.password}
                          onChange={(e) => setWebdavLocalConfig(prev => ({ ...prev, password: e.target.value }))}
                          onBlur={(e) => handleWebdavFieldBlur('password', e.target.value)}
                          fullWidth
                        />
                      </div>

                      {/* 同步路径 */}
                      <div className={styles.wallpaperGroup}>
                        <label className={styles.wallpaperLabel}>{t.dataSync.webdav.path}</label>
                        <Input
                          type="text"
                          placeholder={t.dataSync.webdav.pathPlaceholder}
                          value={webdavLocalConfig.path}
                          onChange={(e) => setWebdavLocalConfig(prev => ({ ...prev, path: e.target.value }))}
                          onBlur={(e) => handleWebdavFieldBlur('path', e.target.value)}
                          fullWidth
                        />
                      </div>

                      {/* 自动同步 */}
                      <div className={styles.settingRow}>
                        <span className={styles.settingLabel}>{t.dataSync.webdav.autoSync}</span>
                        <Switch
                          checked={settings.webdavAutoSync}
                          onChange={(checked) => updateSettings({ webdavAutoSync: checked })}
                        />
                      </div>
                      <p className={styles.settingDescription}>
                        {t.dataSync.webdav.autoSyncDesc}
                      </p>

                      {/* 最后同步时间 */}
                      <div className={styles.settingRow}>
                        <span className={styles.settingLabel}>{t.dataSync.webdav.lastSync}</span>
                        <span className={styles.settingValue}>
                          {formatLastSyncTime(settings.webdavLastSyncTime)}
                        </span>
                      </div>

                      {/* 操作按钮 */}
                      <div className={styles.syncButtonGroup}>
                        <Button
                          variant="secondary"
                          onClick={handleTestWebdav}
                          disabled={webdavTesting || webdavSyncing}
                        >
                          {webdavTesting ? t.dataSync.webdav.testing : t.dataSync.webdav.testConnection}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={handleUploadToWebdav}
                          disabled={webdavTesting || webdavSyncing}
                        >
                          {webdavSyncing ? t.dataSync.webdav.syncing : t.dataSync.webdav.uploadData}
                        </Button>
                        <Button
                          variant="primary"
                          onClick={handleDownloadFromWebdav}
                          disabled={webdavTesting || webdavSyncing}
                        >
                          {webdavSyncing ? t.dataSync.webdav.syncing : t.dataSync.webdav.downloadData}
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {/* GitHub Gist 同步 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>{t.dataSync.github.title}</h3>

                  {/* 启用 GitHub */}
                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>{t.dataSync.github.enable}</span>
                    <Switch
                      checked={settings.githubEnabled}
                      onChange={(checked) => updateSettings({ githubEnabled: checked })}
                    />
                  </div>

                  {/* GitHub 配置 */}
                  {settings.githubEnabled && (
                    <>
                      {/* Token */}
                      <div className={styles.wallpaperGroup}>
                        <label className={styles.wallpaperLabel}>{t.dataSync.github.token}</label>
                        <Input
                          type="password"
                          placeholder={t.dataSync.github.tokenPlaceholder}
                          value={githubLocalConfig.token}
                          onChange={(e) => setGithubLocalConfig(prev => ({ ...prev, token: e.target.value }))}
                          onBlur={(e) => updateSettings({ githubToken: e.target.value })}
                          fullWidth
                        />
                        <p className={styles.settingDescription}>
                          {t.dataSync.github.tokenHelp}
                          <a
                            href="https://github.com/settings/tokens/new?scopes=gist&description=Cleartab%20Sync"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.helpLink}
                          >
                            {t.dataSync.github.tokenHelpLink}
                          </a>
                        </p>
                      </div>

                      {/* Gist ID */}
                      {settings.githubGistId && (
                        <div className={styles.wallpaperGroup}>
                          <label className={styles.wallpaperLabel}>{t.dataSync.github.gistId}</label>
                          <Input
                            type="text"
                            value={settings.githubGistId}
                            readOnly
                            fullWidth
                          />
                          <p className={styles.settingDescription}>
                            {t.dataSync.github.gistIdHelp}
                          </p>
                        </div>
                      )}

                      {/* 自动同步 */}
                      <div className={styles.settingRow}>
                        <span className={styles.settingLabel}>{t.dataSync.github.autoSync}</span>
                        <Switch
                          checked={settings.githubAutoSync}
                          onChange={(checked) => updateSettings({ githubAutoSync: checked })}
                        />
                      </div>
                      <p className={styles.settingDescription}>
                        {t.dataSync.github.autoSyncDesc}
                      </p>

                      {/* 最后同步时间 */}
                      <div className={styles.settingRow}>
                        <span className={styles.settingLabel}>{t.dataSync.github.lastSync}</span>
                        <span className={styles.settingValue}>
                          {formatLastSyncTime(settings.githubLastSyncTime)}
                        </span>
                      </div>

                      {/* 操作按钮 */}
                      <div className={styles.syncButtonGroup}>
                        <Button
                          variant="secondary"
                          onClick={handleTestGithub}
                          disabled={githubTesting || githubSyncing}
                        >
                          {githubTesting ? t.dataSync.github.testing : t.dataSync.github.testConnection}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={handleUploadToGithub}
                          disabled={githubTesting || githubSyncing}
                        >
                          {githubSyncing ? t.dataSync.github.syncing : t.dataSync.github.uploadData}
                        </Button>
                        <Button
                          variant="primary"
                          onClick={handleDownloadFromGithub}
                          disabled={githubTesting || githubSyncing || !settings.githubGistId}
                        >
                          {githubSyncing ? t.dataSync.github.syncing : t.dataSync.github.downloadData}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {activeMenu === 'system' && (
              <>
                <div className={styles.section}>
                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>{t.settings.system.language}</span>
                    <Select
                      value={locale}
                      options={languageOptions}
                      onChange={(value) => setLocale(value as typeof locale)}
                      width={140}
                    />
                  </div>
                </div>

                <div className={styles.section}>
                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>{t.bookmarkMode.title}</span>
                    <Select
                      value={settings.bookmarkMode}
                      options={[
                        { value: 'chrome', label: t.bookmarkMode.chrome },
                        { value: 'local', label: t.bookmarkMode.local }
                      ]}
                      onChange={(value) => updateSettings({ bookmarkMode: value as 'chrome' | 'local' })}
                      width={140}
                    />
                  </div>
                  <p className={styles.settingDescription}>
                    {settings.bookmarkMode === 'chrome'
                      ? t.bookmarkMode.chromeDesc
                      : t.bookmarkMode.localDesc}
                  </p>
                </div>

                {/* 最近访问设置 */}
                {settings.showRecentVisits && (
                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>{t.recentVisits.settings.title}</h3>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>{t.recentVisits.settings.count}</span>
                      <Select
                        value={String(settings.recentVisitsCount)}
                        onChange={(value) => updateSettings({ recentVisitsCount: Number(value) })}
                        width={140}
                        options={[
                          { value: '6', label: '6' },
                          { value: '8', label: '8' },
                          { value: '10', label: '10' },
                          { value: '12', label: '12' },
                          { value: '15', label: '15' },
                          { value: '20', label: '20' },
                        ]}
                      />
                    </div>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>{t.recentVisits.settings.mode}</span>
                      <Select
                        value={settings.recentVisitsMode}
                        onChange={(value) => updateSettings({ recentVisitsMode: value as 'chrome' | 'custom' })}
                        width={140}
                        options={[
                          { value: 'custom', label: t.recentVisits.settings.modeCustom },
                          { value: 'chrome', label: t.recentVisits.settings.modeChrome },
                        ]}
                      />
                    </div>
                    <p className={styles.settingDescription}>
                      {settings.recentVisitsMode === 'custom'
                        ? t.recentVisits.settings.customDesc
                        : t.recentVisits.settings.chromeDesc}
                    </p>
                  </div>
                )}
              </>
            )}

            {activeMenu === 'about' && (
              <>
                {/* 版本信息 */}
                <div className={styles.section}>
                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>{t.settings.about.version}</span>
                    <span className={styles.settingValue}>1.0.0</span>
                  </div>
                </div>

                {/* 加入官方群 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>{t.settings.about.community}</h3>
                  <div className={styles.optionList}>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>{t.settings.about.wechat}</span>
                      <span className={styles.settingValue}>{t.settings.about.comingSoon}</span>
                    </div>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>{t.settings.about.qq}</span>
                      <span className={styles.settingValue}>{t.settings.about.comingSoon}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {pendingWebdavData && (
        <Modal
          isOpen={webdavModalOpen}
          onClose={handleCloseWebdavModal}
          title={t.dataSync.webdav.downloadDialogTitle}
          subtitle={t.dataSync.webdav.downloadDialogSubtitle}
          size="large"
        >
      <p className={styles.syncModalDescription}>{t.dataSync.webdav.downloadDialogDescription}</p>
      <div className={styles.syncTabBar}>
        <button
          type="button"
          className={`${styles.syncTabButton} ${webdavActiveTab === 'custom' ? styles.syncTabButtonActive : ''}`}
          onClick={() => setWebdavActiveTab('custom')}
        >
          {t.dataSync.browser.tabCustom}
        </button>
        <button
          type="button"
          className={`${styles.syncTabButton} ${webdavActiveTab === 'browser' ? styles.syncTabButtonActive : ''}`}
          onClick={() => setWebdavActiveTab('browser')}
          disabled={!hasWebdavBrowserBackup}
        >
          {t.dataSync.browser.tabBrowser}
        </button>
      </div>
      {webdavActiveTab === 'custom' ? (
        <>
          <div className={styles.syncModalStats}>
            <div className={styles.syncModalCard}>
              <div className={styles.syncModalCardHeader}>
                <span>{t.dataSync.webdav.localData}</span>
                <span>{formatLastSyncTime(settings.webdavLastSyncTime)}</span>
              </div>
              <ul className={styles.syncModalMetrics}>
                <li className={styles.syncModalMetric}>
                  <span>{t.dataSync.webdav.stats.bookmarks}</span>
                  <strong>{localStats.bookmarks}</strong>
                </li>
                <li className={styles.syncModalMetric}>
                  <span>{t.dataSync.webdav.stats.quickLinks}</span>
                  <strong>{localStats.quickLinks}</strong>
                </li>
                <li className={styles.syncModalMetric}>
                  <span>{t.dataSync.webdav.stats.categories}</span>
                  <strong>{localStats.categories}</strong>
                </li>
                <li className={styles.syncModalMetric}>
                  <span>{t.dataSync.webdav.stats.customVisits}</span>
                  <strong>{localStats.visits}</strong>
                </li>
              </ul>
            </div>
            <div className={styles.syncModalCard}>
              <div className={styles.syncModalCardHeader}>
                <span>{t.dataSync.webdav.remoteData}</span>
                <span>{formatLastSyncTime(pendingWebdavData.timestamp || 0)}</span>
              </div>
              <ul className={styles.syncModalMetrics}>
                <li className={styles.syncModalMetric}>
                  <span>{t.dataSync.webdav.stats.bookmarks}</span>
                  <strong>{remoteStats.bookmarks}</strong>
                </li>
                <li className={styles.syncModalMetric}>
                  <span>{t.dataSync.webdav.stats.quickLinks}</span>
                  <strong>{remoteStats.quickLinks}</strong>
                </li>
                <li className={styles.syncModalMetric}>
                  <span>{t.dataSync.webdav.stats.categories}</span>
                  <strong>{remoteStats.categories}</strong>
                </li>
                <li className={styles.syncModalMetric}>
                  <span>{t.dataSync.webdav.stats.customVisits}</span>
                  <strong>{remoteStats.visits}</strong>
                </li>
              </ul>
            </div>
          </div>
          {webdavDiff && (
            <div className={styles.syncDiffWrapper}>
              <h4 className={styles.syncDiffTitle}>{t.dataSync.webdav.diffTitle}</h4>
              <div className={styles.syncDiffSections}>
                {diffSectionsConfig.map(section => (
                  <div className={styles.syncDiffSection} key={section.key}>
                    <div className={styles.syncDiffHeader}>
                      <div>
                        <span className={styles.syncDiffSectionTitle}>{section.label}</span>
                        <p className={styles.syncDiffSummary}>{formatDiffSummary(section.diff)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => toggleDiffSection(section.key)}
                      >
                        {expandedDiffSections[section.key]
                          ? t.dataSync.webdav.diffHideDetails
                          : t.dataSync.webdav.diffShowDetails}
                      </Button>
                    </div>
                    {expandedDiffSections[section.key] && (
                      <div className={styles.syncDiffDetails}>
                        <div className={styles.syncDiffList}>
                          <div className={styles.syncDiffListHeader}>
                            {t.dataSync.webdav.diffRemoteOnly} ({section.diff.remoteOnly.length})
                          </div>
                          {section.diff.remoteOnly.length ? (
                            <ul>
                              {section.diff.remoteOnly.map((item: any) => (
                                <li key={item.id}>
                                  <span className={styles.syncDiffItemTitle}>{section.getLabel(item)}</span>
                                  {section.getSubtitle(item) && (
                                    <span className={styles.syncDiffItemSubtitle}>{section.getSubtitle(item)}</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className={styles.syncDiffEmpty}>{t.dataSync.webdav.diffEmpty}</p>
                          )}
                        </div>
                        <div className={styles.syncDiffList}>
                          <div className={styles.syncDiffListHeader}>
                            {t.dataSync.webdav.diffLocalOnly} ({section.diff.localOnly.length})
                          </div>
                          {section.diff.localOnly.length ? (
                            <ul>
                              {section.diff.localOnly.map((item: any) => (
                                <li key={item.id}>
                                  <span className={styles.syncDiffItemTitle}>{section.getLabel(item)}</span>
                                  {section.getSubtitle(item) && (
                                    <span className={styles.syncDiffItemSubtitle}>{section.getSubtitle(item)}</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className={styles.syncDiffEmpty}>{t.dataSync.webdav.diffEmpty}</p>
                          )}
                        </div>
                        <div className={styles.syncDiffList}>
                          <div className={styles.syncDiffListHeader}>
                            {t.dataSync.webdav.diffConflicts} ({section.diff.changed.length})
                          </div>
                          {section.diff.changed.length ? (
                            <ul>
                              {section.diff.changed.map((item: any) => (
                                <li key={item.id}>
                                  <span className={styles.syncDiffItemTitle}>{section.getLabel(item.remote)}</span>
                                  <div className={styles.syncDiffConflictRow}>
                                    <span className={styles.syncDiffTag}>{t.dataSync.webdav.diffRemoteVersion}</span>
                                    <span className={styles.syncDiffConflictText}>
                                      {section.getSubtitle(item.remote) || t.dataSync.webdav.diffNoDetails}
                                    </span>
                                  </div>
                                  <div className={styles.syncDiffConflictRow}>
                                    <span className={styles.syncDiffTag}>{t.dataSync.webdav.diffLocalVersion}</span>
                                    <span className={styles.syncDiffConflictText}>
                                      {section.getSubtitle(item.local) || t.dataSync.webdav.diffNoDetails}
                                    </span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className={styles.syncDiffEmpty}>{t.dataSync.webdav.diffEmpty}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        renderBrowserSyncSection(
          pendingWebdavData?.browserBookmarks,
          webdavBrowserStats,
          webdavBrowserDiff,
          webdavBrowserStrategy,
          setWebdavBrowserStrategy,
          webdavBrowserPreviewOpen,
          setWebdavBrowserPreviewOpen
        )
      )}
          <div className={styles.syncModalActions}>
            <Button variant="ghost" onClick={handleCloseWebdavModal}>
              {t.dataSync.webdav.downloadCancel}
            </Button>
            <div className={styles.syncModalStrategies}>
              <div className={styles.syncModalActionCard}>
                <div>
                  <strong>{t.dataSync.webdav.downloadRemotePrimary}</strong>
                  <p>{t.dataSync.webdav.downloadRemotePrimaryDesc}</p>
                </div>
                <Button variant="secondary" onClick={() => handleWebdavDownloadChoice('remotePrimary')} disabled={webdavSyncing}>
                  {t.dataSync.webdav.downloadRemotePrimary}
                </Button>
              </div>
              <div className={styles.syncModalActionCard}>
                <div>
                  <strong>{t.dataSync.webdav.downloadLocalPrimary}</strong>
                  <p>{t.dataSync.webdav.downloadLocalPrimaryDesc}</p>
                </div>
                <Button variant="secondary" onClick={() => handleWebdavDownloadChoice('localPrimary')} disabled={webdavSyncing}>
                  {t.dataSync.webdav.downloadLocalPrimary}
                </Button>
              </div>
              <div className={styles.syncModalActionCard}>
                <div>
                  <strong>{t.dataSync.webdav.downloadReplace}</strong>
                  <p>{t.dataSync.webdav.downloadReplaceDesc}</p>
                </div>
                <Button variant="primary" onClick={() => handleWebdavDownloadChoice('replace')} disabled={webdavSyncing}>
                  {t.dataSync.webdav.downloadReplace}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* GitHub 下载数据弹窗 */}
      {pendingGithubData && (
        <Modal
          isOpen={githubModalOpen}
          onClose={handleCloseGithubModal}
          title={t.dataSync.webdav.downloadDialogTitle}
          subtitle={t.dataSync.github.title}
          size="large"
        >
      <p className={styles.syncModalDescription}>{t.dataSync.webdav.downloadDialogDescription}</p>
      <div className={styles.syncTabBar}>
        <button
          type="button"
          className={`${styles.syncTabButton} ${githubActiveTab === 'custom' ? styles.syncTabButtonActive : ''}`}
          onClick={() => setGithubActiveTab('custom')}
        >
          {t.dataSync.browser.tabCustom}
        </button>
        <button
          type="button"
          className={`${styles.syncTabButton} ${githubActiveTab === 'browser' ? styles.syncTabButtonActive : ''}`}
          onClick={() => setGithubActiveTab('browser')}
          disabled={!hasGithubBrowserBackup}
        >
          {t.dataSync.browser.tabBrowser}
        </button>
      </div>
      {githubActiveTab === 'custom' ? (
        <>
          <div className={styles.syncModalStats}>
            <div className={styles.syncModalCard}>
              <div className={styles.syncModalCardHeader}>
                <span>{t.dataSync.webdav.localData}</span>
                <span>{formatLastSyncTime(settings.githubLastSyncTime)}</span>
              </div>
              <ul className={styles.syncModalMetrics}>
                <li className={styles.syncModalMetric}>
                  <span>{t.dataSync.webdav.stats.bookmarks}</span>
                  <strong>{localStats.bookmarks}</strong>
                </li>
                <li className={styles.syncModalMetric}>
                  <span>{t.dataSync.webdav.stats.quickLinks}</span>
                  <strong>{localStats.quickLinks}</strong>
                </li>
                <li className={styles.syncModalMetric}>
                  <span>{t.dataSync.webdav.stats.categories}</span>
                  <strong>{localStats.categories}</strong>
                </li>
                <li className={styles.syncModalMetric}>
                  <span>{t.dataSync.webdav.stats.customVisits}</span>
                  <strong>{localStats.visits}</strong>
                </li>
              </ul>
            </div>
            <div className={styles.syncModalCard}>
              <div className={styles.syncModalCardHeader}>
                <span>{t.dataSync.webdav.remoteData}</span>
                <span>{formatLastSyncTime(pendingGithubData.timestamp || 0)}</span>
              </div>
              <ul className={styles.syncModalMetrics}>
                <li className={styles.syncModalMetric}>
                  <span>{t.dataSync.webdav.stats.bookmarks}</span>
                  <strong>{githubRemoteStats.bookmarks}</strong>
                </li>
                <li className={styles.syncModalMetric}>
                  <span>{t.dataSync.webdav.stats.quickLinks}</span>
                  <strong>{githubRemoteStats.quickLinks}</strong>
                </li>
                <li className={styles.syncModalMetric}>
                  <span>{t.dataSync.webdav.stats.categories}</span>
                  <strong>{githubRemoteStats.categories}</strong>
                </li>
                <li className={styles.syncModalMetric}>
                  <span>{t.dataSync.webdav.stats.customVisits}</span>
                  <strong>{githubRemoteStats.visits}</strong>
                </li>
              </ul>
            </div>
          </div>
          {githubDiff && (
            <div className={styles.syncDiffWrapper}>
              <h4 className={styles.syncDiffTitle}>{t.dataSync.webdav.diffTitle}</h4>
              <div className={styles.syncDiffSections}>
                {githubDiffSectionsConfig.map(section => (
                  <div className={styles.syncDiffSection} key={section.key}>
                    <div className={styles.syncDiffHeader}>
                      <div>
                        <span className={styles.syncDiffSectionTitle}>{section.label}</span>
                        <p className={styles.syncDiffSummary}>{formatDiffSummary(section.diff)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => toggleGithubDiffSection(section.key)}
                      >
                        {expandedGithubDiffSections[section.key]
                          ? t.dataSync.webdav.diffHideDetails
                          : t.dataSync.webdav.diffShowDetails}
                      </Button>
                    </div>
                    {expandedGithubDiffSections[section.key] && (
                      <div className={styles.syncDiffDetails}>
                        <div className={styles.syncDiffList}>
                          <div className={styles.syncDiffListHeader}>
                            {t.dataSync.webdav.diffRemoteOnly} ({section.diff.remoteOnly.length})
                          </div>
                          {section.diff.remoteOnly.length ? (
                            <ul>
                              {section.diff.remoteOnly.map((item: any) => (
                                <li key={item.id}>
                                  <span className={styles.syncDiffItemTitle}>{section.getLabel(item)}</span>
                                  {section.getSubtitle(item) && (
                                    <span className={styles.syncDiffItemSubtitle}>{section.getSubtitle(item)}</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className={styles.syncDiffEmpty}>{t.dataSync.webdav.diffEmpty}</p>
                          )}
                        </div>
                        <div className={styles.syncDiffList}>
                          <div className={styles.syncDiffListHeader}>
                            {t.dataSync.webdav.diffLocalOnly} ({section.diff.localOnly.length})
                          </div>
                          {section.diff.localOnly.length ? (
                            <ul>
                              {section.diff.localOnly.map((item: any) => (
                                <li key={item.id}>
                                  <span className={styles.syncDiffItemTitle}>{section.getLabel(item)}</span>
                                  {section.getSubtitle(item) && (
                                    <span className={styles.syncDiffItemSubtitle}>{section.getSubtitle(item)}</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className={styles.syncDiffEmpty}>{t.dataSync.webdav.diffEmpty}</p>
                          )}
                        </div>
                        <div className={styles.syncDiffList}>
                          <div className={styles.syncDiffListHeader}>
                            {t.dataSync.webdav.diffConflicts} ({section.diff.changed.length})
                          </div>
                          {section.diff.changed.length ? (
                            <ul>
                              {section.diff.changed.map((item) => (
                                <li key={item.id}>
                                  <span className={styles.syncDiffItemTitle}>{section.getLabel(item.remote)}</span>
                                  <div className={styles.syncDiffConflictRow}>
                                    <span className={styles.syncDiffTag}>{t.dataSync.webdav.diffRemoteVersion}</span>
                                    <span className={styles.syncDiffConflictText}>
                                      {section.getSubtitle(item.remote) || t.dataSync.webdav.diffNoDetails}
                                    </span>
                                  </div>
                                  <div className={styles.syncDiffConflictRow}>
                                    <span className={styles.syncDiffTag}>{t.dataSync.webdav.diffLocalVersion}</span>
                                    <span className={styles.syncDiffConflictText}>
                                      {section.getSubtitle(item.local) || t.dataSync.webdav.diffNoDetails}
                                    </span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className={styles.syncDiffEmpty}>{t.dataSync.webdav.diffEmpty}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        renderBrowserSyncSection(
          pendingGithubData?.browserBookmarks,
          githubBrowserStats,
          githubBrowserDiff,
          githubBrowserStrategy,
          setGithubBrowserStrategy,
          githubBrowserPreviewOpen,
          setGithubBrowserPreviewOpen
        )
      )}
          <div className={styles.syncModalActions}>
            <Button variant="ghost" onClick={handleCloseGithubModal}>
              {t.dataSync.webdav.downloadCancel}
            </Button>
            <div className={styles.syncModalStrategies}>
              <div className={styles.syncModalActionCard}>
                <div>
                  <strong>{t.dataSync.webdav.downloadRemotePrimary}</strong>
                  <p>{t.dataSync.webdav.downloadRemotePrimaryDesc}</p>
                </div>
                <Button variant="secondary" onClick={() => handleGithubDownloadChoice('remotePrimary')} disabled={githubSyncing}>
                  {t.dataSync.webdav.downloadRemotePrimary}
                </Button>
              </div>
              <div className={styles.syncModalActionCard}>
                <div>
                  <strong>{t.dataSync.webdav.downloadLocalPrimary}</strong>
                  <p>{t.dataSync.webdav.downloadLocalPrimaryDesc}</p>
                </div>
                <Button variant="secondary" onClick={() => handleGithubDownloadChoice('localPrimary')} disabled={githubSyncing}>
                  {t.dataSync.webdav.downloadLocalPrimary}
                </Button>
              </div>
              <div className={styles.syncModalActionCard}>
                <div>
                  <strong>{t.dataSync.webdav.downloadReplace}</strong>
                  <p>{t.dataSync.webdav.downloadReplaceDesc}</p>
                </div>
                <Button variant="primary" onClick={() => handleGithubDownloadChoice('replace')} disabled={githubSyncing}>
                  {t.dataSync.webdav.downloadReplace}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
