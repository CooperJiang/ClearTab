import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuickLink } from '../types';
import { MOCK_QUICKLINKS } from '../utils/mockData';

// 当修改 MOCK_QUICKLINKS 数据时，增加这个版本号
const MOCK_DATA_VERSION = 2;

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
        // 如果 mock 数据版本更新了，或者没有初始化过且没有快捷链接，则加载 mock 数据
        if (state.mockDataVersion < MOCK_DATA_VERSION || (!state.isInitialized && state.quickLinks.length === 0)) {
          set({
            quickLinks: MOCK_QUICKLINKS,
            isInitialized: true,
            mockDataVersion: MOCK_DATA_VERSION,
          });
        }
      },
    }),
    {
      name: 'newtab-quicklinks',
    }
  )
);
