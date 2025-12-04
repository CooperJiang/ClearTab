import { useEffect, useState, useCallback } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useBookmarkStore } from '../stores/useBookmarkStore';
import { useBookmarkMetadataStore } from '../stores/useBookmarkMetadataStore';
import ChromeBookmarkService from '../services/chromeBookmarkService';
import type { ChromeBookmark } from '../services/chromeBookmarkService';
import type { Bookmark, Category } from '../types';
import { DEFAULT_CATEGORIES } from '../types';

export type BookmarkMode = 'chrome' | 'local';

interface AdaptedBookmark extends Bookmark {
  source: 'chrome' | 'local';
  chromeId?: string;
}

/**
 * 统一书签数据适配器
 * 根据模式自动切换 Chrome 书签或本地书签
 */
export function useBookmarkAdapter() {
  const { settings, updateSettings } = useSettingsStore();
  const localStore = useBookmarkStore();
  const metadataStore = useBookmarkMetadataStore();

  const [mode, setMode] = useState<BookmarkMode>('chrome');
  const [bookmarks, setBookmarks] = useState<AdaptedBookmark[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取 Chrome 书签模式下的数据
  const loadChromeBookmarks = useCallback(async () => {
    try {
      if (!ChromeBookmarkService.isAvailable()) {
        setError('Chrome Bookmarks API not available');
        return;
      }

      setIsLoading(true);

      // 获取完整的书签树
      const bookmarkTree = await ChromeBookmarkService.getBookmarks();

      // 存储文件夹信息：folderId -> folderName
      const folderMap = new Map<string, string>();
      // 存储书签的父文件夹ID：bookmarkId -> parentFolderId
      const bookmarkParentMap = new Map<string, string>();
      // 存储所有书签
      const allBookmarks: ChromeBookmark[] = [];

      // Chrome 的根书签文件夹 ID（不能移动）
      const rootFolderIds = ['0', '1', '2', '3'];
      // 系统文件夹名称
      const systemFolderNames = ['Bookmarks Bar', '书签栏', 'Other Bookmarks', '其他书签', 'Mobile bookmarks', '移动设备书签'];

      // 递归遍历书签树
      const traverseTree = (nodes: ChromeBookmark[], parentId: string = '') => {
        for (const node of nodes) {
          if (node.children && !node.url) {
            // 这是一个文件夹
            const folderName = node.title || '未命名文件夹';
            // 过滤根文件夹和系统文件夹（基于 ID 和名称）
            const isRootFolder = rootFolderIds.includes(node.id);
            const isSystemFolder = systemFolderNames.includes(folderName);

            if (!isRootFolder && !isSystemFolder && folderName) {
              folderMap.set(node.id, folderName);
            }
            // 递归处理子节点
            traverseTree(node.children, node.id);
          } else if (node.url) {
            // 这是一个书签
            allBookmarks.push(node);
            bookmarkParentMap.set(node.id, parentId);
          }
        }
      };

      traverseTree(bookmarkTree);

      // 构建分类列表
      const extractedCategories: Category[] = [
        { id: 'all', name: '全部', order: 0 },
      ];

      let order = 1;
      folderMap.forEach((folderName, folderId) => {
        extractedCategories.push({
          id: folderId,
          name: folderName,
          order,
        });
        order++;
      });

      setCategories(extractedCategories);

      // 将 Chrome 书签转换为我们的格式，并关联到对应的文件夹分类
      const adaptedBookmarks: AdaptedBookmark[] = allBookmarks.map(
        (cb: ChromeBookmark) => {
          const meta = metadataStore.getMetadata(cb.id);
          const parentFolderId = bookmarkParentMap.get(cb.id) || '';
          // 如果父文件夹在我们的分类列表中，使用它；否则使用 'all'
          const categoryId = folderMap.has(parentFolderId) ? parentFolderId : 'all';

          return {
            id: `chrome-${cb.id}`,
            chromeId: cb.id,
            title: meta?.customTitle || cb.title || '',
            url: cb.url || '',
            categoryId,
            color: meta?.color || '#8b5cf6',
            createdAt: cb.dateAdded || Date.now(),
            visitCount: 0,
            source: 'chrome',
            icon: undefined,
          };
        }
      );

      setBookmarks(adaptedBookmarks);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Chrome bookmarks');
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  }, [metadataStore]);

  // 获取本地书签模式下的数据
  const loadLocalBookmarks = useCallback(() => {
    setIsLoading(true);
    const localBookmarks = localStore.bookmarks.map((b) => ({
      ...b,
      source: 'local' as const,
    }));
    setBookmarks(localBookmarks);
    setCategories(localStore.categories);
    setError(null);
    setIsLoading(false);
  }, [localStore.bookmarks, localStore.categories]);

  // 根据模式加载数据
  useEffect(() => {
    const bookmarkMode = (settings.bookmarkMode as BookmarkMode) || 'chrome';
    setMode(bookmarkMode);

    if (bookmarkMode === 'chrome') {
      loadChromeBookmarks();
    } else {
      loadLocalBookmarks();
    }
  }, [settings.bookmarkMode, loadChromeBookmarks, loadLocalBookmarks]);

  // 添加书签
  const addBookmark = useCallback(
    async (title: string, url: string, categoryId?: string) => {
      try {
        if (mode === 'chrome') {
          const chromeBookmark = await ChromeBookmarkService.addBookmark(title, url);
          if (chromeBookmark.id) {
            metadataStore.setMetadata(chromeBookmark.id, {
              chromeId: chromeBookmark.id,
              tags: categoryId ? [categoryId] : [],
              isPinned: false,
              customOrder: 0,
            });
          }
          await loadChromeBookmarks();
        } else {
          localStore.addBookmark({
            id: `bm-${Date.now()}`,
            title,
            url,
            categoryId: categoryId || 'dev',
            color: '#8b5cf6',
            createdAt: Date.now(),
            visitCount: 0,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add bookmark');
      }
    },
    [mode, metadataStore, localStore, loadChromeBookmarks]
  );

  // 删除书签
  const deleteBookmark = useCallback(
    async (id: string) => {
      try {
        const bookmark = bookmarks.find((b) => b.id === id);
        if (!bookmark) return;

        if (bookmark.source === 'chrome' && bookmark.chromeId) {
          await ChromeBookmarkService.deleteBookmark(bookmark.chromeId);
          metadataStore.deleteMetadata(bookmark.chromeId);
          await loadChromeBookmarks();
        } else {
          localStore.deleteBookmark(id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete bookmark');
      }
    },
    [bookmarks, mode, metadataStore, localStore, loadChromeBookmarks]
  );

  // 更新书签
  const updateBookmark = useCallback(
    async (id: string, updates: { title?: string; url?: string }) => {
      try {
        const bookmark = bookmarks.find((b) => b.id === id);
        if (!bookmark) return;

        if (bookmark.source === 'chrome' && bookmark.chromeId) {
          await ChromeBookmarkService.updateBookmark(bookmark.chromeId, updates);
          if (updates.title) {
            metadataStore.setMetadata(bookmark.chromeId, { customTitle: updates.title });
          }
          await loadChromeBookmarks();
        } else {
          localStore.updateBookmark(id, updates);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update bookmark');
      }
    },
    [bookmarks, metadataStore, localStore, loadChromeBookmarks]
  );

  // 切换模式
  const switchMode = useCallback((newMode: BookmarkMode) => {
    updateSettings({ bookmarkMode: newMode });
  }, [updateSettings]);

  // 为 Chrome 书签添加标签
  const addTagToBookmark = useCallback(
    (bookmarkId: string, tag: string) => {
      const bookmark = bookmarks.find((b) => b.id === bookmarkId);
      if (bookmark && bookmark.source === 'chrome' && bookmark.chromeId) {
        metadataStore.addTagToBookmark(bookmark.chromeId, tag);
      }
    },
    [bookmarks, metadataStore]
  );

  // 置顶/取消置顶书签
  const togglePin = useCallback(
    (bookmarkId: string) => {
      const bookmark = bookmarks.find((b) => b.id === bookmarkId);
      if (bookmark && bookmark.source === 'chrome' && bookmark.chromeId) {
        metadataStore.togglePin(bookmark.chromeId);
      }
    },
    [bookmarks, metadataStore]
  );

  // 设置书签颜色
  const setBookmarkColor = useCallback(
    (bookmarkId: string, color: string) => {
      const bookmark = bookmarks.find((b) => b.id === bookmarkId);
      if (bookmark && bookmark.source === 'chrome' && bookmark.chromeId) {
        metadataStore.setColor(bookmark.chromeId, color);
      }
    },
    [bookmarks, metadataStore]
  );

  // Chrome 模式：重命名分类
  const renameCategory = useCallback(
    async (categoryId: string, newName: string) => {
      if (mode !== 'chrome') return;
      try {
        await ChromeBookmarkService.updateBookmark(categoryId, { title: newName });
        await loadChromeBookmarks();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to rename category');
      }
    },
    [mode, loadChromeBookmarks]
  );

  // Chrome 模式：删除分类（文件夹）
  const deleteChromeCategoryFolder = useCallback(
    async (categoryId: string) => {
      if (mode !== 'chrome') return;
      try {
        await ChromeBookmarkService.deleteFolder(categoryId);
        await loadChromeBookmarks();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete category');
      }
    },
    [mode, loadChromeBookmarks]
  );

  // Chrome 模式：添加分类（新建文件夹）
  const addChromeCategory = useCallback(
    async (categoryName: string) => {
      if (mode !== 'chrome') return;
      try {
        // 获取书签栏文件夹 ID（通常是 '1'）
        await ChromeBookmarkService.createFolder(categoryName, '1');
        await loadChromeBookmarks();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create category');
      }
    },
    [mode, loadChromeBookmarks]
  );

  // Chrome 模式：移动书签到不同分类
  const moveBookmarkToCategory = useCallback(
    async (bookmarkId: string, targetCategoryId: string) => {
      const bookmark = bookmarks.find((b) => b.id === bookmarkId);
      if (!bookmark || bookmark.source !== 'chrome' || !bookmark.chromeId) return;

      try {
        // 获取目标分类的子节点数量，用于 index
        const children = await ChromeBookmarkService.getChildren(targetCategoryId);
        await ChromeBookmarkService.moveBookmark(bookmark.chromeId, targetCategoryId, children.length);
        await loadChromeBookmarks();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to move bookmark');
      }
    },
    [bookmarks, loadChromeBookmarks]
  );

  // Chrome 模式：重新排序分类或书签
  const reorderCategories = useCallback(
    async (orderedCategoryIds: string[]) => {
      if (mode !== 'chrome') return;
      try {
        // Chrome 的根书签文件夹 ID（不能移动）
        // '0' = 根节点, '1' = 书签栏, '2' = 其他书签, '3' = 移动设备书签
        const rootFolderIds = ['0', '1', '2', '3'];

        // 过滤掉根文件夹
        const movableCategories = orderedCategoryIds.filter(id => !rootFolderIds.includes(id));

        if (movableCategories.length === 0) {
          console.log('No movable categories to reorder');
          return;
        }

        // 获取第一个可移动分类的 parentId 作为目标父节点
        const firstCategory = await ChromeBookmarkService.getBookmark(movableCategories[0]);
        const parentId = firstCategory.parentId || '1';

        // 不能移动到根节点下
        if (rootFolderIds.includes(parentId)) {
          console.log('Categories are in root folder, reordering within:', parentId);
        }

        console.log('Reordering', movableCategories.length, 'categories in parent:', parentId);

        for (let i = 0; i < movableCategories.length; i++) {
          const categoryId = movableCategories[i];
          await ChromeBookmarkService.moveBookmark(categoryId, parentId, i);
        }
        await loadChromeBookmarks();
      } catch (err) {
        console.error('Failed to reorder categories:', err);
        setError(err instanceof Error ? err.message : 'Failed to reorder categories');
      }
    },
    [mode, loadChromeBookmarks]
  );

  // Chrome 模式：重新排序书签
  const reorderBookmarks = useCallback(
    async (orderedBookmarks: AdaptedBookmark[]) => {
      if (mode !== 'chrome') return;
      try {
        // 只重排当前可见的书签（同一分类内）
        // 获取被拖动书签的原始 Chrome 信息
        const bookmarksWithParent: { bookmark: AdaptedBookmark; parentId: string }[] = [];

        for (const bookmark of orderedBookmarks) {
          if (bookmark.source === 'chrome' && bookmark.chromeId) {
            const chromeBookmark = await ChromeBookmarkService.getBookmark(bookmark.chromeId);
            bookmarksWithParent.push({
              bookmark,
              parentId: chromeBookmark.parentId || '1'
            });
          }
        }

        // 按 parentId 分组
        const groupedByParent = new Map<string, typeof bookmarksWithParent>();
        for (const item of bookmarksWithParent) {
          if (!groupedByParent.has(item.parentId)) {
            groupedByParent.set(item.parentId, []);
          }
          groupedByParent.get(item.parentId)!.push(item);
        }

        // 为每个父节点内的书签重新排序
        for (const [parentId, items] of groupedByParent) {
          console.log(`Reordering ${items.length} bookmarks in parent: ${parentId}`);
          for (let i = 0; i < items.length; i++) {
            const { bookmark } = items[i];
            if (bookmark.chromeId) {
              await ChromeBookmarkService.moveBookmark(bookmark.chromeId, parentId, i);
            }
          }
        }

        await loadChromeBookmarks();
      } catch (err) {
        console.error('Failed to reorder bookmarks:', err);
        setError(err instanceof Error ? err.message : 'Failed to reorder bookmarks');
      }
    },
    [mode, loadChromeBookmarks]
  );

  return {
    mode,
    bookmarks,
    categories,
    isLoading,
    error,
    addBookmark,
    deleteBookmark,
    updateBookmark,
    switchMode,
    addTagToBookmark,
    togglePin,
    setBookmarkColor,
    renameCategory,
    deleteChromeCategoryFolder,
    addChromeCategory,
    moveBookmarkToCategory,
    reorderCategories,
    reorderBookmarks,
    getAllTags: metadataStore.getAllTags,
  };
}
