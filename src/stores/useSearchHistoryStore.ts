import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SearchHistoryItem {
  id: string;
  query: string;
  engineId: string;
  timestamp: number;
}

interface SearchHistoryState {
  history: SearchHistoryItem[];
  maxItems: number;

  // Actions
  addHistory: (query: string, engineId: string) => void;
  removeHistory: (id: string) => void;
  clearHistory: () => void;
  getRecentHistory: (limit?: number) => SearchHistoryItem[];
}

export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set, get) => ({
      history: [],
      maxItems: 50,

      addHistory: (query, engineId) => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) return;

        set((state) => {
          // 如果已存在相同的搜索词，先移除旧的
          const filtered = state.history.filter(
            (item) => item.query.toLowerCase() !== trimmedQuery.toLowerCase()
          );

          const newItem: SearchHistoryItem = {
            id: `sh-${Date.now()}`,
            query: trimmedQuery,
            engineId,
            timestamp: Date.now(),
          };

          // 添加新记录到开头，保持最大数量
          const newHistory = [newItem, ...filtered].slice(0, state.maxItems);

          return { history: newHistory };
        });
      },

      removeHistory: (id) =>
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        })),

      clearHistory: () => set({ history: [] }),

      getRecentHistory: (limit = 10) => {
        return get().history.slice(0, limit);
      },
    }),
    {
      name: 'newtab-search-history',
    }
  )
);
