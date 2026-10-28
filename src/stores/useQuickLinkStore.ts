import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuickLink } from '../types';
import { MOCK_QUICKLINKS } from '../utils/mockData';

// 记录首次初始化所使用的示例数据版本，不用于覆盖用户数据。
const MOCK_DATA_VERSION = 3;

interface QuickLinkState {
  quickLinks: QuickLink[];
  isInitialized: boolean;
  mockDataVersion: number;

  // Actions
  addQuickLink: (link: QuickLink) => void;
  updateQuickLink: (id: string, updates: Partial<QuickLink>) => void;
  deleteQuickLink: (id: string) => void;
  reorderQuickLinks: (links: QuickLink[]) => void;
  initializeWithMockData: () => void;
  // 云同步相关
  setQuickLinks: (links: QuickLink[]) => void;
}

export const useQuickLinkStore = create<QuickLinkState>()(
  persist(
    (set, get) => ({
      quickLinks: [],
      isInitialized: false,
      mockDataVersion: MOCK_DATA_VERSION,

      addQuickLink: (link) =>
        set((state) => ({
          quickLinks: [...state.quickLinks, link],
        })),

      updateQuickLink: (id, updates) =>
        set((state) => ({
          quickLinks: state.quickLinks.map((l) =>
            l.id === id ? { ...l, ...updates } : l
          ),
        })),

      deleteQuickLink: (id) =>
        set((state) => ({
          quickLinks: state.quickLinks.filter((l) => l.id !== id),
        })),

      reorderQuickLinks: (links) =>
        set({ quickLinks: links }),

      initializeWithMockData: () => {
        const state = get();
        // 示例数据只用于首次启动，版本更新不能覆盖用户的数据。
        if (state.isInitialized) return;
        set({
          ...(state.quickLinks.length === 0 ? {
            quickLinks: MOCK_QUICKLINKS,
          } : {}),
          isInitialized: true,
          mockDataVersion: MOCK_DATA_VERSION,
        });
      },

      // 云同步相关
      setQuickLinks: (links) => set({ quickLinks: links, isInitialized: true }),
    }),
    {
      name: 'newtab-quicklinks',
    }
  )
);
