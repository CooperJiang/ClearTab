import { useState, useMemo, useCallback, useRef, useEffect, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { FixedSizeGrid } from 'react-window';
import { useBookmarkAdapter } from '../../hooks/useBookmarkAdapter';
import { useTrashStore, useSettingsStore, useBookmarkStore, useRecentVisitsStore, useBookmarkMetadataStore } from '../../stores';
import { getDomain } from '../../utils';
import { Button, ContextMenu, ConfirmDialog, type ContextMenuItem } from '../ui';
import { EditModal, type EditModalField } from '../EditModal';
import { FaviconImage } from '../FaviconImage';
import { useTranslation } from '../../i18n';
import styles from './BookmarkGrid.module.css';

const MIN_COL_WIDTH = 220; // 最小列宽
const MAX_COL_WIDTH = 280; // 最大列宽，防止少量项过宽
const GRID_GAP = 10; // gap
const CARD_HEIGHT = 70; // 卡片高度

export function BookmarkGrid({ showCategories = true }: { showCategories?: boolean }) {
  const { settings } = useSettingsStore();
  const { addToTrash } = useTrashStore();
  const addVisit = useRecentVisitsStore((state) => state.addVisit);
  const { t } = useTranslation();

  // 使用统一的适配器 Hook 处理 Chrome 或本地书签模式
  const {
    mode,
    bookmarks,
    categories,
    isLoading,
    error,
    addBookmark: adapterAddBookmark,
    deleteBookmark: adapterDeleteBookmark,
    updateBookmark: adapterUpdateBookmark,
    renameCategory: adapterRenameCategory,
    deleteChromeCategoryFolder,
    addChromeCategory,
    moveBookmarkToCategory,
    reorderCategories: adapterReorderCategories,
    reorderBookmarks: adapterReorderBookmarks,
  } = useBookmarkAdapter();

  // 本地模式下获取额外的功能（分类管理、拖拽等）
  const localStore = useBookmarkStore();
  const {
    activeCategory,
    collapsedCategories,
    setActiveCategory,
    toggleCategoryCollapse,
    incrementVisitCount,
    addCategory,
    deleteCategory,
    reorderCategories,
    reorderBookmarks,
  } = localStore;

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<string | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });

  // 删除确认弹窗状态
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState<{
    categoryId: string;
    bookmarkCount: number;
  } | null>(null);

  // 分类拖拽状态
  const [catDragIndex, setCatDragIndex] = useState<number | null>(null);
  const [catOverIndex, setCatOverIndex] = useState<number | null>(null);

  // 书签拖拽状态
  const [bookmarkDragIndex, setBookmarkDragIndex] = useState<number | null>(null);
  const [bookmarkOverIndex, setBookmarkOverIndex] = useState<number | null>(null);
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null);
  const dragBookmarkRef = useRef<string | null>(null);
  const gridWrapperRef = useRef<HTMLDivElement>(null);

  // 过滤书签（支持搜索和分类过滤）
  const filteredBookmarks = useMemo(() => {
    let result = bookmarks;

    // 按分类过滤
    if (activeCategory !== 'all') {
      result = result.filter((b) => b.categoryId === activeCategory);
    }

    // 按搜索词过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.url.toLowerCase().includes(query)
      );
    }

    return result;
  }, [bookmarks, activeCategory, searchQuery]);

  const columns = useMemo(() => {
    const availableWidth = Math.max(gridSize.width, MIN_COL_WIDTH);
    // 优先按最小宽度 + 间距排列
    const minCols = Math.max(1, Math.floor((availableWidth + GRID_GAP) / (MIN_COL_WIDTH + GRID_GAP)));
    // 再限制最大宽度，避免少量元素拉伸过宽
    const maxCols = Math.max(1, Math.floor((availableWidth + GRID_GAP) / (MAX_COL_WIDTH + GRID_GAP)));
    return Math.max(maxCols, minCols);
  }, [gridSize.width]);

  const columnWidth = useMemo(() => {
    const availableWidth = Math.max(gridSize.width, MIN_COL_WIDTH);
    const totalGap = GRID_GAP * Math.max(0, columns - 1);
    const widthWithoutGap = Math.max(availableWidth - totalGap, MIN_COL_WIDTH);
    const rawWidth = widthWithoutGap / columns;
    return Math.min(Math.max(rawWidth, MIN_COL_WIDTH), MAX_COL_WIDTH);
  }, [gridSize.width, columns]);

  const rowHeight = CARD_HEIGHT + GRID_GAP;
  const rowCount = Math.ceil(filteredBookmarks.length / columns);

  // 监听容器尺寸，便于虚拟化计算
  useEffect(() => {
    const wrapper = gridWrapperRef.current;
    if (!wrapper) return;

    const updateSize = () => {
      const rect = wrapper.getBoundingClientRect();
      setGridSize({
        width: rect.width,
        height: rect.height,
      });
    };

    updateSize();

    // 监听 wrapper 自身
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(wrapper);

    // 同时监听 window resize
    window.addEventListener('resize', updateSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  useEffect(() => {
    const resetDragState = () => {
      setBookmarkDragIndex(null);
      setBookmarkOverIndex(null);
      dragBookmarkRef.current = null;
    };

    window.addEventListener('cleartab-bookmark-drop', resetDragState);
    return () => {
      window.removeEventListener('cleartab-bookmark-drop', resetDragState);
    };
  }, []);

  const shouldVirtualize = useMemo(() => {
    return !settings.enableBookmarkGrouping && gridSize.width > 0 && gridSize.height > 0 && filteredBookmarks.length > 60;
  }, [settings.enableBookmarkGrouping, gridSize.width, gridSize.height, filteredBookmarks.length]);

  // 按分类分组的书签（仅在"全部"模式下使用，且启用了分组功能）
  const groupedBookmarks = useMemo(() => {
    if (!settings.enableBookmarkGrouping || activeCategory !== 'all' || searchQuery.trim()) {
      return null;
    }

    const groups = new Map<string, typeof bookmarks>();
    const categoryOrder = categories.filter(c => c.id !== 'all').map(c => c.id);

    for (const bookmark of bookmarks) {
      const catId = bookmark.categoryId;
      if (!groups.has(catId)) {
        groups.set(catId, []);
      }
      groups.get(catId)!.push(bookmark);
    }

    // 按分类顺序返回
    return categoryOrder
      .filter(catId => groups.has(catId))
      .map(catId => ({
        categoryId: catId,
        categoryName: categories.find(c => c.id === catId)?.name || catId,
        bookmarks: groups.get(catId)!,
      }));
  }, [bookmarks, categories, activeCategory, searchQuery, settings.enableBookmarkGrouping]);

  const handleBookmarkClick = (id: string) => {
    // 仅在本地模式下跟踪访问计数
    if (mode === 'local') {
      incrementVisitCount(id);
    }

    // 自定义模式下记录最近访问
    if (settings.recentVisitsMode === 'custom') {
      const bookmark = bookmarks.find((b) => b.id === id);
      if (bookmark) {
        addVisit(bookmark.url, bookmark.title);
      }
    }
  };

  // 书签表单字段（根据模式动态生成）
  const bookmarkFields = useMemo(() => {
    const fields: EditModalField[] = [
      {
        key: 'title',
        label: t.bookmarks.form.title,
        type: 'text',
        placeholder: t.bookmarks.form.title,
        required: true,
      },
      {
        key: 'url',
        label: t.bookmarks.form.url,
        type: 'url',
        placeholder: t.bookmarks.form.url,
        required: true,
      },
    ];

    // 仅在本地模式下添加分类字段
    if (mode === 'local') {
      fields.push({
        key: 'categoryId',
        label: t.bookmarks.form.category,
        type: 'select',
        options: categories
          .filter((c) => c.id !== 'all')
          .map((c) => ({ value: c.id, label: c.name })),
        required: true,
      });
    }

    return fields;
  }, [mode, t.bookmarks.form.title, t.bookmarks.form.url, t.bookmarks.form.category, categories]);

  // 分类表单字段
  const categoryFields: EditModalField[] = [
    {
      key: 'name',
      label: t.bookmarks.form.title,
      type: 'text',
      placeholder: t.bookmarks.form.title,
      required: true,
    },
  ];

  const handleAddBookmark = (values: Record<string, string>) => {
    const url = values.url.startsWith('http') ? values.url : `https://${values.url}`;
    const categoryId = mode === 'local' ? (values.categoryId || 'dev') : undefined;

    // 使用适配器的 addBookmark 方法，同时传递分类信息
    adapterAddBookmark(values.title, url, categoryId);
  };

  const handleEditBookmark = (values: Record<string, string>) => {
    if (!editingBookmark) return;
    const url = values.url.startsWith('http') ? values.url : `https://${values.url}`;

    // 使用适配器的 updateBookmark 方法
    adapterUpdateBookmark(editingBookmark, {
      title: values.title,
      url,
    });

    // 在本地模式下，还需要更新分类
    if (mode === 'local') {
      localStore.updateBookmark(editingBookmark, {
        categoryId: values.categoryId,
      });
    }
  };

  const handleDeleteBookmark = () => {
    if (editingBookmark) {
      const bookmark = bookmarks.find(b => b.id === editingBookmark);
      if (bookmark) {
        // 添加到回收站
        const metadataSnapshot =
          mode === 'chrome' && (bookmark as any).chromeId
            ? useBookmarkMetadataStore.getState().getMetadata((bookmark as any).chromeId)
            : undefined;

        addToTrash({
          id: `trash-${Date.now()}`,
          type: 'bookmark',
          data: bookmark,
          deletedAt: Date.now(),
          mode,
          browserParentId: mode === 'chrome' && bookmark.categoryId !== 'all' ? bookmark.categoryId : undefined,
          browserMetadata: metadataSnapshot ? { ...metadataSnapshot } : undefined,
        });
      }
      adapterDeleteBookmark(editingBookmark);
    }
  };

  // 删除书签（右键菜单）
  const handleDeleteBookmarkById = (bookmarkId: string) => {
    const bookmark = bookmarks.find(b => b.id === bookmarkId);
    if (bookmark) {
      const metadataSnapshot =
        mode === 'chrome' && (bookmark as any).chromeId
          ? useBookmarkMetadataStore.getState().getMetadata((bookmark as any).chromeId)
          : undefined;

      addToTrash({
        id: `trash-${Date.now()}`,
        type: 'bookmark',
        data: bookmark,
        deletedAt: Date.now(),
        mode,
        browserParentId: mode === 'chrome' && bookmark.categoryId !== 'all' ? bookmark.categoryId : undefined,
        browserMetadata: metadataSnapshot ? { ...metadataSnapshot } : undefined,
      });
    }
    adapterDeleteBookmark(bookmarkId);
  };

  const handleAddCategory = (values: Record<string, string>) => {
    if (mode === 'chrome') {
      // Chrome 模式：调用适配器创建文件夹
      addChromeCategory(values.name);
    } else {
      // 本地模式
      const newCategory = {
        id: `cat-${Date.now()}`,
        name: values.name,
        order: categories.length,
      };
      addCategory(newCategory);
    }
  };

  const handleEditCategory = (values: Record<string, string>) => {
    if (!editingCategory) return;

    if (mode === 'chrome') {
      // Chrome 模式：调用适配器的重命名方法
      adapterRenameCategory(editingCategory, values.name);
    } else {
      // 本地模式：使用 store 的 updateCategory 方法
      const state = useBookmarkStore.getState();
      state.updateCategory(editingCategory, { name: values.name });
    }
  };

  const handleDeleteCategory = () => {
    if (editingCategory) {
      performDeleteCategory(editingCategory);
    }
  };

  // 尝试删除分类（检查是否需要确认）
  const tryDeleteCategory = (categoryId: string) => {
    const categoryBookmarks = bookmarks.filter(b => b.categoryId === categoryId);
    if (categoryBookmarks.length > 0) {
      // 有书签，需要确认
      setDeleteCategoryConfirm({
        categoryId,
        bookmarkCount: categoryBookmarks.length,
      });
    } else {
      // 没有书签，直接删除
      performDeleteCategory(categoryId);
    }
  };

  // 执行删除分类
  const performDeleteCategory = (categoryId: string) => {
    if (mode === 'chrome') {
      // Chrome 模式：调用适配器删除文件夹
      deleteChromeCategoryFolder(categoryId);
    } else {
      // 本地模式
      const category = categories.find(c => c.id === categoryId);
      const categoryBookmarks = bookmarks.filter(b => b.categoryId === categoryId);

      if (category) {
        // 添加分类到回收站，同时保存其下的书签
        addToTrash({
          id: `trash-${Date.now()}`,
          type: 'category',
          data: category,
          deletedAt: Date.now(),
          mode: 'local',
          relatedBookmarks: categoryBookmarks,
        });
      }

      deleteCategory(categoryId);
    }

    // 如果当前激活的是被删除的分类，切换到全部
    if (activeCategory === categoryId) {
      setActiveCategory('all');
    }
  };

  const currentBookmark = editingBookmark
    ? bookmarks.find((b) => b.id === editingBookmark)
    : null;

  const currentCategory = editingCategory
    ? categories.find((c) => c.id === editingCategory)
    : null;

  // ========== 分类拖拽处理 ==========
  const handleCatDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `category:${categories[index].id}`);
    setTimeout(() => setCatDragIndex(index), 0);
  }, [categories]);

  const handleCatDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    const data = e.dataTransfer.types.includes('text/plain');
    if (data && catDragIndex !== null && catDragIndex !== index) {
      setCatOverIndex(index);
    }
    // 处理书签拖入分类
    if (dragBookmarkRef.current && categories[index].id !== 'all') {
      e.dataTransfer.dropEffect = 'move';
      setDragOverCategoryId(categories[index].id);
    }
  }, [catDragIndex, categories]);

  const handleCatDragLeave = useCallback(() => {
    setCatOverIndex(null);
    setDragOverCategoryId(null);
  }, []);

  const handleCatDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    // 尝试读取 JSON 数据（书签拖入分类）
    const jsonData = e.dataTransfer.getData('application/json');
    if (jsonData && categories[dropIndex].id !== 'all') {
      try {
        const parsed = JSON.parse(jsonData);
        if (parsed.type === 'bookmark' && parsed.id) {
          const targetCategoryId = categories[dropIndex].id;
          console.log('Moving bookmark to category:', parsed.id, '->', targetCategoryId);
          if (mode === 'chrome') {
            moveBookmarkToCategory(parsed.id, targetCategoryId);
          } else {
            localStore.updateBookmark(parsed.id, { categoryId: targetCategoryId });
          }
          setDragOverCategoryId(null);
          setBookmarkDragIndex(null);
          setBookmarkOverIndex(null);
          dragBookmarkRef.current = null;
          setActiveCategory(targetCategoryId);
          return;
        }
      } catch {
        // 解析失败，继续处理其他情况
      }
    }

    // 分类排序
    if (catDragIndex === null || catDragIndex === dropIndex) {
      setCatDragIndex(null);
      setCatOverIndex(null);
      return;
    }

    const newCategories = [...categories];
    const [draggedItem] = newCategories.splice(catDragIndex, 1);
    newCategories.splice(dropIndex, 0, draggedItem);

    if (mode === 'chrome') {
      // Chrome 模式：调用适配器重新排序
      const orderedIds = newCategories.filter(c => c.id !== 'all').map(c => c.id);
      console.log('Reordering categories:', orderedIds);
      adapterReorderCategories(orderedIds);
    } else {
      // 本地模式
      reorderCategories(newCategories);
    }

    setCatDragIndex(null);
    setCatOverIndex(null);
  }, [categories, catDragIndex, mode, reorderCategories, localStore, moveBookmarkToCategory, adapterReorderCategories]);

  const handleCatDragEnd = useCallback(() => {
    setCatDragIndex(null);
    setCatOverIndex(null);
    setDragOverCategoryId(null);
  }, []);

  // ========== 书签拖拽处理 ==========
  const handleBookmarkDragStart = useCallback((e: React.DragEvent, index: number, id: string) => {
    dragBookmarkRef.current = id;
    e.dataTransfer.effectAllowed = 'copyMove';

    // 设置 dragData，用于内部分类拖拽和书签排序
    const bookmark = bookmarks.find(b => b.id === id);
    if (bookmark) {
      // 使用 'application/json' 存储内部数据，用于分类拖拽
      e.dataTransfer.setData('application/json', JSON.stringify({
        type: 'bookmark',
        id,
        title: bookmark.title,
        url: bookmark.url
      }));

      // 同时设置文本数据作为备用（用于拖到快捷访问等）
      e.dataTransfer.setData('text/plain', `external:${JSON.stringify({
        title: bookmark.title,
        url: bookmark.url
      })}`);
    }

    setTimeout(() => setBookmarkDragIndex(index), 0);
  }, [bookmarks]);

  const handleBookmarkDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (bookmarkDragIndex !== index) {
      setBookmarkOverIndex(index);
    }
  }, [bookmarkDragIndex]);

  const handleBookmarkDragLeave = useCallback(() => {
    setBookmarkOverIndex(null);
  }, []);

  const handleBookmarkDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (bookmarkDragIndex === null || bookmarkDragIndex === dropIndex) {
      setBookmarkDragIndex(null);
      setBookmarkOverIndex(null);
      return;
    }

    // 获取当前显示的书签在全部书签中的索引
    const draggedBookmark = filteredBookmarks[bookmarkDragIndex];
    const targetBookmark = filteredBookmarks[dropIndex];

    const fullDragIndex = bookmarks.findIndex(b => b.id === draggedBookmark.id);
    const fullDropIndex = bookmarks.findIndex(b => b.id === targetBookmark.id);

    const newBookmarks = [...bookmarks];
    const [draggedItem] = newBookmarks.splice(fullDragIndex, 1);
    newBookmarks.splice(fullDropIndex, 0, draggedItem);

    // 策略说明：
    // 在"全部"分类视图中的排序是自定义排序，会应用到整个书签列表
    // 在具体分类视图中的排序仅在该分类内排序
    // 都通过调用重排序方法来实现，该方法会按分类内排序 Chrome 书签
    if (mode === 'chrome') {
      // Chrome 模式：调用适配器重新排序
      console.log('Reordering bookmarks in Chrome mode');
      adapterReorderBookmarks(newBookmarks);
    } else {
      // 本地模式
      reorderBookmarks(newBookmarks);
    }

    setBookmarkDragIndex(null);
    setBookmarkOverIndex(null);
  }, [bookmarks, filteredBookmarks, bookmarkDragIndex, mode, reorderBookmarks, adapterReorderBookmarks]);

  const handleBookmarkDragEnd = useCallback(() => {
    setBookmarkDragIndex(null);
    setBookmarkOverIndex(null);
    dragBookmarkRef.current = null;
  }, []);

  // ========== 右键菜单 ==========
  const getBookmarkContextMenuItems = (bookmarkId: string): ContextMenuItem[] => [
    {
      id: 'edit',
      label: t.common.edit,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
      onClick: () => setEditingBookmark(bookmarkId),
    },
    {
      id: 'open-new-tab',
      label: t.common.openInNewTab,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      ),
      onClick: () => {
        const bookmark = bookmarks.find(b => b.id === bookmarkId);
        if (bookmark) window.open(bookmark.url, '_blank');
      },
    },
    { id: 'divider', label: '', divider: true },
    {
      id: 'delete',
      label: t.common.delete,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      ),
      danger: true,
      onClick: () => handleDeleteBookmarkById(bookmarkId),
    },
  ];

  const getCategoryContextMenuItems = (categoryId: string): ContextMenuItem[] => {
    // 不允许删除"全部"分类
    if (categoryId === 'all') {
      return [];
    }

    return [
      {
        id: 'edit',
        label: t.common.edit,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        ),
        onClick: () => setEditingCategory(categoryId),
      },
      { id: 'divider', label: '', divider: true },
      {
        id: 'delete',
        label: t.common.delete,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        ),
        danger: true,
        onClick: () => tryDeleteCategory(categoryId),
      },
    ];
  };

  const renderVirtualCell = useCallback(({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: CSSProperties }) => {
    const itemIndex = rowIndex * columns + columnIndex;
    if (itemIndex >= filteredBookmarks.length) return null;
    const bookmark = filteredBookmarks[itemIndex];
    const adjustedStyle: React.CSSProperties = {
      ...style,
      width: columnWidth,
      height: CARD_HEIGHT,
      top: (style.top as number) ?? 0,
      left: ((style.left as number) ?? 0) + columnIndex * GRID_GAP,
      boxSizing: 'border-box',
    };

    return (
      <div style={adjustedStyle}>
        <ContextMenu key={bookmark.id} items={getBookmarkContextMenuItems(bookmark.id)}>
          <a
            href={bookmark.url}
            className={`${styles.card} ${bookmarkDragIndex === itemIndex ? styles.dragging : ''} ${bookmarkOverIndex === itemIndex ? styles.dragOver : ''}`}
            onClick={() => handleBookmarkClick(bookmark.id)}
            title={bookmark.title}
            draggable
            onDragStart={(e) => handleBookmarkDragStart(e, itemIndex, bookmark.id)}
            onDragOver={(e) => handleBookmarkDragOver(e, itemIndex)}
            onDragLeave={handleBookmarkDragLeave}
            onDrop={(e) => handleBookmarkDrop(e, itemIndex)}
            onDragEnd={handleBookmarkDragEnd}
            style={{ height: CARD_HEIGHT }}
          >
            <div
              className={styles.icon}
              style={{ backgroundColor: bookmark.color }}
            >
              {bookmark.icon ? (
                <img src={bookmark.icon} alt="" />
              ) : (
                <FaviconImage
                  url={bookmark.url}
                  title={bookmark.title}
                  color={bookmark.color}
                  size={40}
                />
              )}
            </div>
            <div className={styles.info}>
              <span className={styles.title}>{bookmark.title}</span>
              <span className={styles.domain}>{getDomain(bookmark.url)}</span>
            </div>
          </a>
        </ContextMenu>
      </div>
    );
  }, [filteredBookmarks, columns, columnWidth, rowHeight, rowCount, bookmarkDragIndex, bookmarkOverIndex, handleBookmarkClick, handleBookmarkDragStart, handleBookmarkDragOver, handleBookmarkDragLeave, handleBookmarkDrop, handleBookmarkDragEnd, getBookmarkContextMenuItems]);

  const SearchIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );

  const CloseIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );

  return (
    <div className={styles.container}>
      {/* 头部：分类标签 + 操作按钮 */}
      {showCategories && (
        <div className={styles.header}>
          <div className={styles.categories}>
            {categories.map((category, index) => {
              const isAll = category.id === 'all';
              const isActive = activeCategory === category.id;
              const isDragging = catDragIndex === index;
              // 区分：分类排序拖拽 vs 书签拖入分类
              const isCategoryDragOver = catOverIndex === index && catDragIndex !== null;
              const isBookmarkDragOver = dragOverCategoryId === category.id;

              // 分类拖拽排序（两种模式都支持）
              const isDraggable = !isAll;

              const categoryButton = (
                <motion.button
                  key={category.id}
                  className={`${styles.categoryTab} ${
                    isDragging ? styles.dragging : ''
                  } ${isCategoryDragOver ? styles.dragOver : ''
                  } ${isBookmarkDragOver ? styles.dragOverBookmark : ''}`}
                  onClick={() => setActiveCategory(category.id)}
                  draggable={isDraggable}
                  onDragStart={isDraggable ? (e) => handleCatDragStart(e as unknown as React.DragEvent, index) : undefined}
                  onDragOver={(e) => handleCatDragOver(e as unknown as React.DragEvent, index)}
                  onDragLeave={handleCatDragLeave}
                  onDrop={(e) => handleCatDrop(e as unknown as React.DragEvent, index)}
                  onDragEnd={handleCatDragEnd}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activePill"
                      className={styles.activePill}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className={styles.categoryText}>{category.name}</span>
                </motion.button>
              );

              if (isAll) {
                return categoryButton;
              }

              // 所有分类都支持右键菜单
              return (
                <ContextMenu key={category.id} items={getCategoryContextMenuItems(category.id)}>
                  {categoryButton}
                </ContextMenu>
              );
            })}
            {/* 添加分类按钮（两种模式都支持） */}
            <button
              className={styles.addCategoryButton}
              onClick={() => setIsAddCategoryOpen(true)}
              title={t.common.add}
            >
              +
            </button>
          </div>
          <div className={styles.actions}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>{SearchIcon}</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.common.search}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button
                  className={styles.clearSearch}
                  onClick={() => setSearchQuery('')}
                >
                  {CloseIcon}
                </button>
              )}
            </div>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setIsAddModalOpen(true)}
            >
              + {t.common.add}
            </Button>
          </div>
        </div>
      )}

      {/* 书签网格 */}
      <div
        className={styles.gridWrapper}
        ref={gridWrapperRef}
        style={shouldVirtualize ? { overflow: 'hidden', width: '100%' } : undefined}
      >
        {/* 加载状态 */}
        {isLoading && (
          <div className={styles.empty}>
            <p>{t.common.loading || '加载中...'}</p>
          </div>
        )}

        {/* 错误状态 */}
        {error && !isLoading && (
          <div className={styles.empty}>
            <p style={{ color: '#ef4444' }}>{error}</p>
          </div>
        )}

        {/* 分组显示模式 */}
        {!isLoading && !error && groupedBookmarks && (
          <div className={styles.groupContainer}>
            {groupedBookmarks.length === 0 ? (
              <div className={styles.empty}>
                <p>{t.common.noData}</p>
              </div>
            ) : (
              groupedBookmarks.map((group) => {
                const isCollapsed = collapsedCategories.has(group.categoryId);
                return (
                  <div key={group.categoryId}>
                    <div
                      className={`${styles.groupHeader} ${isCollapsed ? styles.collapsed : ''}`}
                      onClick={() => toggleCategoryCollapse(group.categoryId)}
                    >
                      <span className={styles.groupToggle}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                      <span className={styles.groupTitle}>{group.categoryName}</span>
                      <span className={styles.groupCount}>{group.bookmarks.length}</span>
                    </div>
                    <div className={`${styles.groupContent} ${isCollapsed ? styles.collapsed : ''}`}>
                      {group.bookmarks.map((bookmark) => (
                        <ContextMenu key={bookmark.id} items={getBookmarkContextMenuItems(bookmark.id)}>
                          <a
                            href={bookmark.url}
                            className={styles.card}
                            onClick={() => handleBookmarkClick(bookmark.id)}
                            title={bookmark.title}
                          >
                            <div
                              className={styles.icon}
                              style={{ backgroundColor: bookmark.color }}
                            >
                              {bookmark.icon ? (
                                <img src={bookmark.icon} alt="" />
                              ) : (
                                <FaviconImage
                                  url={bookmark.url}
                                  title={bookmark.title}
                                  color={bookmark.color}
                                  size={40}
                                />
                              )}
                            </div>
                            <div className={styles.info}>
                              <span className={styles.title}>{bookmark.title}</span>
                              <span className={styles.domain}>{getDomain(bookmark.url)}</span>
                            </div>
                          </a>
                        </ContextMenu>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 普通网格模式 */}
        {!isLoading && !error && !groupedBookmarks && (
          shouldVirtualize ? (
            <FixedSizeGrid
              className={styles.virtualGrid}
              columnCount={columns}
              columnWidth={columnWidth}
              height={gridSize.height || 400}
              rowCount={rowCount}
              rowHeight={rowHeight}
              width={gridWrapperRef.current?.getBoundingClientRect().width || gridSize.width || 800}
              itemKey={({ columnIndex, rowIndex }) => {
                const idx = rowIndex * columns + columnIndex;
                return filteredBookmarks[idx]?.id ?? `empty-${idx}`;
              }}
            >
              {renderVirtualCell}
            </FixedSizeGrid>
          ) : (
            <div className={styles.grid}>
              {filteredBookmarks.length === 0 ? (
                <div className={styles.empty}>
                  <p>{t.common.noData}</p>
                </div>
              ) : (
                filteredBookmarks.map((bookmark, index) => (
                  <ContextMenu key={bookmark.id} items={getBookmarkContextMenuItems(bookmark.id)}>
                    <a
                      href={bookmark.url}
                      className={`${styles.card} ${bookmarkDragIndex === index ? styles.dragging : ''} ${bookmarkOverIndex === index ? styles.dragOver : ''}`}
                      onClick={() => handleBookmarkClick(bookmark.id)}
                      title={bookmark.title}
                      draggable
                      onDragStart={(e) => handleBookmarkDragStart(e, index, bookmark.id)}
                      onDragOver={(e) => handleBookmarkDragOver(e, index)}
                      onDragLeave={handleBookmarkDragLeave}
                      onDrop={(e) => handleBookmarkDrop(e, index)}
                      onDragEnd={handleBookmarkDragEnd}
                    >
                      <div
                        className={styles.icon}
                        style={{ backgroundColor: bookmark.color }}
                      >
                        {bookmark.icon ? (
                          <img src={bookmark.icon} alt="" />
                        ) : (
                          <FaviconImage
                            url={bookmark.url}
                            title={bookmark.title}
                            color={bookmark.color}
                            size={40}
                          />
                        )}
                      </div>
                      <div className={styles.info}>
                        <span className={styles.title}>{bookmark.title}</span>
                        <span className={styles.domain}>{getDomain(bookmark.url)}</span>
                      </div>
                    </a>
                  </ContextMenu>
                ))
              )}
            </div>
          )
        )}
      </div>

      {/* 添加书签弹窗 */}
      <EditModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t.bookmarks.addBookmark}
        fields={bookmarkFields}
        initialValues={{ categoryId: activeCategory === 'all' ? 'dev' : activeCategory }}
        onSave={handleAddBookmark}
      />

      {/* 编辑书签弹窗 */}
      <EditModal
        isOpen={!!editingBookmark}
        onClose={() => setEditingBookmark(null)}
        title={t.bookmarks.editBookmark}
        fields={bookmarkFields}
        initialValues={
          currentBookmark
            ? {
                title: currentBookmark.title,
                url: currentBookmark.url,
                categoryId: currentBookmark.categoryId,
              }
            : {}
        }
        onSave={handleEditBookmark}
        onDelete={handleDeleteBookmark}
      />

      {/* 添加分类弹窗 */}
      <EditModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        title={t.bookmarks.addCategory}
        fields={categoryFields}
        onSave={handleAddCategory}
      />

      {/* 编辑分类弹窗 */}
      <EditModal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title={t.bookmarks.editCategory}
        fields={categoryFields}
        initialValues={currentCategory ? { name: currentCategory.name } : {}}
        onSave={handleEditCategory}
        onDelete={handleDeleteCategory}
      />

      {/* 删除分类确认弹窗 */}
      <ConfirmDialog
        isOpen={!!deleteCategoryConfirm}
        onClose={() => setDeleteCategoryConfirm(null)}
        onConfirm={() => {
          if (deleteCategoryConfirm) {
            performDeleteCategory(deleteCategoryConfirm.categoryId);
          }
        }}
        title={t.bookmarks.deleteCategoryTitle}
        message={mode === 'chrome'
          ? t.bookmarks.deleteCategoryConfirmChrome.replace('{count}', String(deleteCategoryConfirm?.bookmarkCount || 0))
          : t.bookmarks.deleteCategoryConfirmLocal.replace('{count}', String(deleteCategoryConfirm?.bookmarkCount || 0))
        }
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
        danger
      />
    </div>
  );
}
