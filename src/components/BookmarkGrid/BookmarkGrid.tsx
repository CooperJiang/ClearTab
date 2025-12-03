import { useState, useMemo, useCallback, useRef } from 'react';
import { useBookmarkStore, useTrashStore } from '../../stores';
import { getFaviconUrl, getDomain } from '../../utils';
import { Button, ContextMenu, ConfirmDialog, type ContextMenuItem } from '../ui';
import { EditModal, type EditModalField } from '../EditModal';
import { useTranslation } from '../../i18n';
import { COLORS } from '../../types';
import styles from './BookmarkGrid.module.css';

export function BookmarkGrid() {
  const {
    bookmarks,
    categories,
    activeCategory,
    setActiveCategory,
    incrementVisitCount,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    reorderBookmarks,
    addCategory,
    deleteCategory,
    reorderCategories,
  } = useBookmarkStore();
  const { addToTrash } = useTrashStore();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<string | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

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

  const handleBookmarkClick = (id: string) => {
    incrementVisitCount(id);
  };

  // 书签表单字段
  const bookmarkFields: EditModalField[] = [
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
    {
      key: 'categoryId',
      label: t.bookmarks.form.category,
      type: 'select',
      options: categories
        .filter((c) => c.id !== 'all')
        .map((c) => ({ value: c.id, label: c.name })),
      required: true,
    },
  ];

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
  };

  const handleEditBookmark = (values: Record<string, string>) => {
    if (!editingBookmark) return;
    updateBookmark(editingBookmark, {
      title: values.title,
      url: values.url.startsWith('http') ? values.url : `https://${values.url}`,
      categoryId: values.categoryId,
    });
  };

  const handleDeleteBookmark = () => {
    if (editingBookmark) {
      const bookmark = bookmarks.find(b => b.id === editingBookmark);
      if (bookmark) {
        // 添加到回收站
        addToTrash({
          id: `trash-${Date.now()}`,
          type: 'bookmark',
          data: bookmark,
          deletedAt: Date.now(),
        });
      }
      deleteBookmark(editingBookmark);
    }
  };

  // 删除书签（右键菜单）
  const handleDeleteBookmarkById = (bookmarkId: string) => {
    const bookmark = bookmarks.find(b => b.id === bookmarkId);
    if (bookmark) {
      addToTrash({
        id: `trash-${Date.now()}`,
        type: 'bookmark',
        data: bookmark,
        deletedAt: Date.now(),
      });
    }
    deleteBookmark(bookmarkId);
  };

  const handleAddCategory = (values: Record<string, string>) => {
    const newCategory = {
      id: `cat-${Date.now()}`,
      name: values.name,
      order: categories.length,
    };
    addCategory(newCategory);
  };

  const handleEditCategory = (values: Record<string, string>) => {
    if (!editingCategory) return;
    // 使用 store 的 updateCategory 方法
    const state = useBookmarkStore.getState();
    state.updateCategory(editingCategory, { name: values.name });
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
    const category = categories.find(c => c.id === categoryId);
    const categoryBookmarks = bookmarks.filter(b => b.categoryId === categoryId);

    if (category) {
      // 添加分类到回收站，同时保存其下的书签
      addToTrash({
        id: `trash-${Date.now()}`,
        type: 'category',
        data: category,
        deletedAt: Date.now(),
        relatedBookmarks: categoryBookmarks,
      });
    }

    deleteCategory(categoryId);

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
    const data = e.dataTransfer.getData('text/plain');

    // 书签拖入分类
    if (data.startsWith('bookmark:') && categories[dropIndex].id !== 'all') {
      const bookmarkId = data.replace('bookmark:', '');
      updateBookmark(bookmarkId, { categoryId: categories[dropIndex].id });
      setDragOverCategoryId(null);
      return;
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
    reorderCategories(newCategories);

    setCatDragIndex(null);
    setCatOverIndex(null);
  }, [categories, catDragIndex, reorderCategories, updateBookmark]);

  const handleCatDragEnd = useCallback(() => {
    setCatDragIndex(null);
    setCatOverIndex(null);
    setDragOverCategoryId(null);
  }, []);

  // ========== 书签拖拽处理 ==========
  const handleBookmarkDragStart = useCallback((e: React.DragEvent, index: number, id: string) => {
    dragBookmarkRef.current = id;
    e.dataTransfer.effectAllowed = 'copyMove';

    // 设置内部用的数据（用于分类间移动）
    e.dataTransfer.setData('text/plain', `bookmark:${id}`);

    // 同时设置外部用的数据（用于拖到快捷访问）
    const bookmark = bookmarks.find(b => b.id === id);
    if (bookmark) {
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
    reorderBookmarks(newBookmarks);

    setBookmarkDragIndex(null);
    setBookmarkOverIndex(null);
  }, [bookmarks, filteredBookmarks, bookmarkDragIndex, reorderBookmarks]);

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
      label: '新标签页打开',
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

  const getCategoryContextMenuItems = (categoryId: string): ContextMenuItem[] => [
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
      <div className={styles.header}>
        <div className={styles.categories}>
          {categories.map((category, index) => {
            const isAll = category.id === 'all';
            const isDragging = catDragIndex === index;
            const isDragOver = catOverIndex === index || dragOverCategoryId === category.id;

            const categoryButton = (
              <button
                key={category.id}
                className={`${styles.categoryTab} ${
                  activeCategory === category.id ? styles.active : ''
                } ${isDragging ? styles.dragging : ''} ${isDragOver ? styles.dragOver : ''}`}
                onClick={() => setActiveCategory(category.id)}
                draggable={!isAll}
                onDragStart={!isAll ? (e) => handleCatDragStart(e, index) : undefined}
                onDragOver={(e) => handleCatDragOver(e, index)}
                onDragLeave={handleCatDragLeave}
                onDrop={(e) => handleCatDrop(e, index)}
                onDragEnd={handleCatDragEnd}
              >
                {category.name}
              </button>
            );

            if (isAll) {
              return categoryButton;
            }

            return (
              <ContextMenu key={category.id} items={getCategoryContextMenuItems(category.id)}>
                {categoryButton}
              </ContextMenu>
            );
          })}
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

      {/* 书签网格 */}
      <div className={styles.gridWrapper}>
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
                      <img src={getFaviconUrl(bookmark.url)} alt="" />
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
        title="删除分类"
        message={`该分类下有 ${deleteCategoryConfirm?.bookmarkCount || 0} 个书签，删除后书签也会被移入回收站。确定要删除吗？`}
        confirmText="删除"
        cancelText="取消"
        danger
      />
    </div>
  );
}
