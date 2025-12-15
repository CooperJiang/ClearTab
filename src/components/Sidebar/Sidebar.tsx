import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { useBookmarkStore, useQuickLinkStore, useRecentVisitsStore, useSettingsStore } from '../../stores';
import { useTranslation } from '../../i18n';
import { FaviconImage } from '../FaviconImage';
import { Tooltip } from '../Tooltip';
import { ContextMenu, type ContextMenuItem } from '../ui';
import { EditModal, type EditModalField } from '../EditModal';
import { ChevronLeft } from 'lucide-react';
import styles from './Sidebar.module.css';

// 条件 Tooltip 包装器
interface ConditionalTooltipProps {
  show: boolean;
  content: string;
  children: ReactNode;
}

function ConditionalTooltip({ show, content, children }: ConditionalTooltipProps) {
  if (show) {
    return <Tooltip content={content} position="right">{children}</Tooltip>;
  }
  return <>{children}</>;
}

const SIDEBAR_COLLAPSED_KEY = 'cleartab-sidebar-collapsed';
const SIDEBAR_WIDTH_KEY = 'cleartab-sidebar-width';
const MIN_WIDTH = 160;
const MAX_WIDTH = 320;
const DEFAULT_WIDTH = 200;
const COLLAPSED_WIDTH = 56;

export function Sidebar() {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
      return saved ? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Number(saved))) : DEFAULT_WIDTH;
    } catch {
      return DEFAULT_WIDTH;
    }
  });

  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const { settings } = useSettingsStore();
  const {
    categories,
    activeCategory,
    setActiveCategory,
    reorderCategories,
    updateBookmark,
    updateCategory,
    deleteCategory,
  } = useBookmarkStore();
  const {
    quickLinks,
    reorderQuickLinks,
    updateQuickLink,
    deleteQuickLink,
  } = useQuickLinkStore();
  const { customVisits, removeVisit } = useRecentVisitsStore();

  // 编辑弹窗状态
  const [editingQuickLink, setEditingQuickLink] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  // 拖拽状态
  const [catDragIndex, setCatDragIndex] = useState<number | null>(null);
  const [catOverIndex, setCatOverIndex] = useState<number | null>(null);
  const [quickLinkDragIndex, setQuickLinkDragIndex] = useState<number | null>(null);
  const [quickLinkOverIndex, setQuickLinkOverIndex] = useState<number | null>(null);
  const dragBookmarkRef = useRef<string | null>(null);
  const dragQuickLinkRef = useRef<string | null>(null);

  const toggleCollapse = () => {
    setIsCollapsed((prev: boolean) => {
      const newState = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(newState));
      } catch {
        // localStorage not available
      }
      return newState;
    });
  };

  // ========== 宽度拖拽调整 ==========
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!sidebarRef.current) return;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      // 保存宽度到 localStorage
      try {
        localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
      } catch {
        // localStorage not available
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, sidebarWidth]);

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
  }, [catDragIndex]);

  const handleCatDragLeave = useCallback(() => {
    setCatOverIndex(null);
  }, []);

  const handleCatDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    // 书签拖入分类
    const jsonData = e.dataTransfer.getData('application/json');
    if (jsonData) {
      try {
        const parsed = JSON.parse(jsonData);
        if (parsed.type === 'bookmark' && parsed.id) {
          const targetCategoryId = categories[dropIndex].id;
          updateBookmark(parsed.id, { categoryId: targetCategoryId });
          setActiveCategory(targetCategoryId);
          setCatDragIndex(null);
          setCatOverIndex(null);
          dragBookmarkRef.current = null;
          // 通知 BookmarkGrid 重置拖拽状态
          window.dispatchEvent(new Event('cleartab-bookmark-drop'));
          return;
        }
      } catch {
        // 解析失败，继续处理分类排序
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
    reorderCategories(newCategories);

    setCatDragIndex(null);
    setCatOverIndex(null);
  }, [categories, catDragIndex, reorderCategories, updateBookmark, setActiveCategory]);

  const handleCatDragEnd = useCallback(() => {
    setCatDragIndex(null);
    setCatOverIndex(null);
  }, []);

  // ========== 快捷访问拖拽处理 ==========
  const handleQuickLinkDragStart = useCallback((e: React.DragEvent, index: number, id: string) => {
    dragQuickLinkRef.current = id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    setTimeout(() => setQuickLinkDragIndex(index), 0);
  }, []);

  const handleQuickLinkDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (quickLinkDragIndex !== index) {
      setQuickLinkOverIndex(index);
    }
  }, [quickLinkDragIndex]);

  const handleQuickLinkDragLeave = useCallback(() => {
    setQuickLinkOverIndex(null);
  }, []);

  const handleQuickLinkDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    // 书签拖入快捷访问
    const jsonData = e.dataTransfer.getData('application/json');
    if (jsonData) {
      try {
        const parsed = JSON.parse(jsonData);
        if (parsed.type === 'bookmark' && parsed.id) {
          // 添加到快捷访问的指定位置
          const exists = quickLinks.some(link => link.url === parsed.url);
          if (!exists) {
            const newLink = {
              id: `ql-${Date.now()}`,
              title: parsed.title,
              url: parsed.url,
              color: '#f59e0b',
              order: dropIndex,
            };
            // 先添加到末尾，然后重新排序到指定位置
            const newLinks = [...quickLinks];
            newLinks.splice(dropIndex, 0, newLink);
            reorderQuickLinks(newLinks);
          }
          setQuickLinkDragIndex(null);
          setQuickLinkOverIndex(null);
          dragBookmarkRef.current = null;
          // 通知 BookmarkGrid 重置拖拽状态
          window.dispatchEvent(new Event('cleartab-bookmark-drop'));
          return;
        }
      } catch {
        // 解析失败，继续处理快捷访问排序
      }
    }

    // 快捷访问排序
    if (quickLinkDragIndex === null || quickLinkDragIndex === dropIndex) {
      setQuickLinkDragIndex(null);
      setQuickLinkOverIndex(null);
      return;
    }

    const newLinks = [...quickLinks];
    const [draggedItem] = newLinks.splice(quickLinkDragIndex, 1);
    newLinks.splice(dropIndex, 0, draggedItem);
    reorderQuickLinks(newLinks);

    setQuickLinkDragIndex(null);
    setQuickLinkOverIndex(null);
  }, [quickLinks, quickLinkDragIndex, reorderQuickLinks]);

  const handleQuickLinkDragEnd = useCallback(() => {
    setQuickLinkDragIndex(null);
    setQuickLinkOverIndex(null);
    dragQuickLinkRef.current = null;
  }, []);

  // ========== 右键菜单 ==========
  const getQuickLinkContextMenuItems = useCallback((linkId: string, url: string): ContextMenuItem[] => [
    {
      id: 'edit',
      label: t.common.edit,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
      onClick: () => setEditingQuickLink(linkId),
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
      onClick: () => window.open(url, '_blank'),
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
      onClick: () => deleteQuickLink(linkId),
    },
  ], [deleteQuickLink]);

  const getRecentVisitContextMenuItems = useCallback((visitId: string, url: string): ContextMenuItem[] => [
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
      onClick: () => window.open(url, '_blank'),
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
      onClick: () => removeVisit(visitId),
    },
  ], [removeVisit]);

  const getCategoryContextMenuItems = useCallback((categoryId: string): ContextMenuItem[] => {
    if (categoryId === 'all') return [];
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
        onClick: () => {
          deleteCategory(categoryId);
          if (activeCategory === categoryId) {
            setActiveCategory('all');
          }
        },
      },
    ];
  }, [deleteCategory, activeCategory, setActiveCategory]);

  // 编辑表单字段
  const quickLinkFields: EditModalField[] = [
    { key: 'title', label: t.quickLinks.name, type: 'text', required: true },
    { key: 'url', label: t.quickLinks.url, type: 'url', required: true },
  ];

  const categoryFields: EditModalField[] = [
    { key: 'name', label: t.bookmarks.form.title, type: 'text', required: true },
  ];

  const currentQuickLink = editingQuickLink ? quickLinks.find(l => l.id === editingQuickLink) : null;
  const currentCategory = editingCategory ? categories.find(c => c.id === editingCategory) : null;

  const handleEditQuickLink = (values: Record<string, string>) => {
    if (!editingQuickLink) return;
    updateQuickLink(editingQuickLink, {
      title: values.title,
      url: values.url.startsWith('http') ? values.url : `https://${values.url}`,
    });
  };

  const handleDeleteQuickLink = () => {
    if (editingQuickLink) {
      deleteQuickLink(editingQuickLink);
    }
  };

  const handleEditCategory = (values: Record<string, string>) => {
    if (!editingCategory) return;
    updateCategory(editingCategory, { name: values.name });
  };

  const handleDeleteCategory = () => {
    if (editingCategory) {
      deleteCategory(editingCategory);
      if (activeCategory === editingCategory) {
        setActiveCategory('all');
      }
    }
  };

  return (
    <aside
      ref={sidebarRef}
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''} ${isResizing ? styles.resizing : ''}`}
      style={{ width: isCollapsed ? COLLAPSED_WIDTH : sidebarWidth }}
    >
      <div className={styles.content}>
        <div className={styles.header}>
          <h1
          className={`${styles.logo} ${isCollapsed ? styles.collapsed : ''}`}
          onClick={isCollapsed ? toggleCollapse : undefined}
          style={isCollapsed ? { cursor: 'pointer' } : undefined}
          title={isCollapsed ? t.sidebar.expand : undefined}
        >
          {isCollapsed ? 'C' : 'Cleartab'}
        </h1>
        {!isCollapsed && (
          <button className={styles.collapseButton} onClick={toggleCollapse} title={t.sidebar.collapse}>
            <ChevronLeft size={16} className={styles.collapseIcon} />
          </button>
        )}
      </div>
      <nav className={styles.nav}>
        {settings.showQuickLinks && (
          <section className={styles.section}>
            <h2 className={`${styles.sectionTitle} ${isCollapsed ? styles.collapsed : ''}`}>{t.sidebar.quickLinks}</h2>
            <div className={styles.list}>
              {quickLinks.map((link, index) => (
                <ContextMenu key={link.id} items={getQuickLinkContextMenuItems(link.id, link.url)}>
                  <ConditionalTooltip show={isCollapsed} content={link.title}>
                    <a
                        href={link.url}
                        className={`${styles.navItem} ${styles.iconOnly} ${quickLinkDragIndex === index ? styles.dragging : ''} ${quickLinkOverIndex === index ? styles.dragOver : ''}`}
                        draggable
                        onDragStart={(e) => handleQuickLinkDragStart(e, index, link.id)}
                        onDragOver={(e) => handleQuickLinkDragOver(e, index)}
                        onDragLeave={handleQuickLinkDragLeave}
                        onDrop={(e) => handleQuickLinkDrop(e, index)}
                        onDragEnd={handleQuickLinkDragEnd}
                      >
                        <FaviconImage url={link.url} title={link.title} color={link.color} size={18} />
                        <span className={styles.navItemName}>{link.title}</span>
                      </a>
                    </ConditionalTooltip>
                  </ContextMenu>
                ))}
              </div>
            </section>
          )}

        {settings.showRecentVisits && (
          <section className={styles.section}>
            <h2 className={`${styles.sectionTitle} ${isCollapsed ? styles.collapsed : ''}`}>{t.sidebar.recentVisits}</h2>
            <div className={styles.list}>
              {customVisits.slice(0, 5).map((item) => (
                <ContextMenu key={item.id} items={getRecentVisitContextMenuItems(item.id, item.url)}>
                  <ConditionalTooltip show={isCollapsed} content={item.title}>
                    <a href={item.url} className={`${styles.navItem} ${styles.iconOnly}`}>
                        <FaviconImage url={item.url} title={item.title} color="#64748b" size={18} />
                        <span className={styles.navItemName}>{item.title}</span>
                      </a>
                    </ConditionalTooltip>
                  </ContextMenu>
                ))}
              </div>
            </section>
          )}

          <section className={`${styles.section} ${styles.categoriesSection}`}>
            <h2 className={`${styles.sectionTitle} ${isCollapsed ? styles.collapsed : ''}`}>{t.sidebar.categories}</h2>
            <div className={styles.list}>
              {categories.map((category, index) => {
                const isAll = category.id === 'all';
                const isDraggable = !isAll;
                const categoryButton = (
                  <button
                    className={`${styles.navItem} ${activeCategory === category.id ? styles.active : ''} ${catDragIndex === index ? styles.dragging : ''} ${catOverIndex === index ? styles.dragOver : ''}`}
                    onClick={() => setActiveCategory(category.id)}
                    draggable={isDraggable}
                    onDragStart={isDraggable ? (e) => handleCatDragStart(e, index) : undefined}
                    onDragOver={(e) => handleCatDragOver(e, index)}
                    onDragLeave={handleCatDragLeave}
                    onDrop={(e) => handleCatDrop(e, index)}
                    onDragEnd={handleCatDragEnd}
                  >
                    <span className={styles.navItemName}>{category.name}</span>
                  </button>
                );

                if (isAll) {
                  return (
                    <ConditionalTooltip key={category.id} show={isCollapsed} content={category.name}>
                      {categoryButton}
                    </ConditionalTooltip>
                  );
                }

                return (
                  <ContextMenu key={category.id} items={getCategoryContextMenuItems(category.id)}>
                    <ConditionalTooltip show={isCollapsed} content={category.name}>
                      {categoryButton}
                    </ConditionalTooltip>
                  </ContextMenu>
                );
              })}
            </div>
          </section>
        </nav>
      </div>

      {/* 拖拽调整宽度手柄 */}
      {!isCollapsed && (
        <div
          className={styles.resizeHandle}
          onMouseDown={handleResizeStart}
        />
      )}

      {/* 编辑快捷访问弹窗 */}
      <EditModal
        isOpen={!!editingQuickLink}
        onClose={() => setEditingQuickLink(null)}
        title={t.sidebar.editQuickLink}
        fields={quickLinkFields}
        initialValues={currentQuickLink ? { title: currentQuickLink.title, url: currentQuickLink.url } : {}}
        onSave={handleEditQuickLink}
        onDelete={handleDeleteQuickLink}
      />

      {/* 编辑分类弹窗 */}
      <EditModal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title={t.sidebar.editCategory}
        fields={categoryFields}
        initialValues={currentCategory ? { name: currentCategory.name } : {}}
        onSave={handleEditCategory}
        onDelete={handleDeleteCategory}
      />
    </aside>
  );
}
