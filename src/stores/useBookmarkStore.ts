import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Bookmark, Category } from '../types';
import { DEFAULT_CATEGORIES } from '../types';
import { MOCK_BOOKMARKS } from '../utils/mockData';

interface BookmarkState {
  bookmarks: Bookmark[];
  categories: Category[];
  activeCategory: string;
  isInitialized: boolean;
  mockDataVersion: number;
  collapsedCategories: Set<string>;

  // Actions
  addBookmark: (bookmark: Bookmark) => void;
  updateBookmark: (id: string, updates: Partial<Bookmark>) => void;
  deleteBookmark: (id: string) => void;
  reorderBookmarks: (bookmarks: Bookmark[]) => void;
  setActiveCategory: (categoryId: string) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (categories: Category[]) => void;
  incrementVisitCount: (id: string) => void;
  toggleCategoryCollapse: (categoryId: string) => void;
  initializeWithMockData: () => void;
  // 云同步相关
  setBookmarks: (bookmarks: Bookmark[]) => void;
  setCategories: (categories: Category[]) => void;
}

// 记录首次初始化所使用的示例数据版本，不用于覆盖用户数据。
const MOCK_DATA_VERSION = 4;

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      categories: DEFAULT_CATEGORIES,
      activeCategory: 'all',
      isInitialized: false,
      mockDataVersion: MOCK_DATA_VERSION,
      collapsedCategories: new Set<string>(),

      addBookmark: (bookmark) =>
        set((state) => ({
          bookmarks: [...state.bookmarks, bookmark],
        })),

      updateBookmark: (id, updates) =>
        set((state) => ({
          bookmarks: state.bookmarks.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        })),

      deleteBookmark: (id) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.id !== id),
        })),

      reorderBookmarks: (bookmarks) =>
        set({ bookmarks }),

      setActiveCategory: (categoryId) =>
        set({ activeCategory: categoryId }),

      addCategory: (category) =>
        set((state) => ({
          categories: [...state.categories, category],
        })),

      updateCategory: (id, updates) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
          bookmarks: state.bookmarks.filter((b) => b.categoryId !== id),
          activeCategory: state.activeCategory === id ? 'all' : state.activeCategory,
        })),

      reorderCategories: (categories) =>
        set({ categories }),

      incrementVisitCount: (id) =>
        set((state) => ({
          bookmarks: state.bookmarks.map((b) =>
            b.id === id
              ? { ...b, visitCount: b.visitCount + 1, lastVisitedAt: Date.now() }
              : b
          ),
        })),

      toggleCategoryCollapse: (categoryId) =>
        set((state) => {
          const newCollapsed = new Set(state.collapsedCategories);
          if (newCollapsed.has(categoryId)) {
            newCollapsed.delete(categoryId);
          } else {
            newCollapsed.add(categoryId);
          }
          return { collapsedCategories: newCollapsed };
        }),

      initializeWithMockData: () => {
        const state = get();
        // 示例数据只用于首次启动，版本更新不能覆盖用户的数据。
        if (state.isInitialized) return;
        set({
          ...(state.bookmarks.length === 0 ? {
            bookmarks: MOCK_BOOKMARKS,
          } : {}),
          isInitialized: true,
          mockDataVersion: MOCK_DATA_VERSION,
        });
      },

      // 云同步相关
      setBookmarks: (bookmarks) => set({ bookmarks, isInitialized: true }),
      
      setCategories: (categories) => set({ categories }),
    }),
    {
      name: 'newtab-bookmarks',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const data = JSON.parse(str);
          return {
            ...data,
            state: {
              ...data.state,
              collapsedCategories: new Set(data.state?.collapsedCategories || []),
            },
          };
        },
        setItem: (name, value) => {
          const data = {
            ...value,
            state: {
              ...value.state,
              collapsedCategories: Array.from(value.state?.collapsedCategories || []),
            },
          };
          localStorage.setItem(name, JSON.stringify(data));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
