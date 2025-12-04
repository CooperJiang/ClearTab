import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CustomRecentVisit } from '../types';

interface RecentVisitsState {
  // 自定义模式下的访问记录
  customVisits: CustomRecentVisit[];

  // Actions
  addVisit: (url: string, title: string) => void;
  removeVisit: (id: string) => void;
  clearVisits: () => void;
}

const MAX_VISITS = 100; // 最多保存100条记录

export const useRecentVisitsStore = create<RecentVisitsState>()(
  persist(
    (set) => ({
      customVisits: [],

      addVisit: (url: string, title: string) =>
        set((state) => {
          // 过滤掉内部页面
          if (
            url.startsWith('chrome://') ||
            url.startsWith('chrome-extension://') ||
            url.startsWith('edge://') ||
            url.startsWith('about:')
          ) {
            return state;
          }

          // 检查是否已存在相同 URL，如果存在则更新时间并移到最前面
          const existingIndex = state.customVisits.findIndex(
            (v) => v.url === url
          );

          let newVisits: CustomRecentVisit[];

          if (existingIndex >= 0) {
            // 已存在，更新时间并移到最前面
            const existing = state.customVisits[existingIndex];
            newVisits = [
              { ...existing, title: title || existing.title, visitTime: Date.now() },
              ...state.customVisits.slice(0, existingIndex),
              ...state.customVisits.slice(existingIndex + 1),
            ];
          } else {
            // 不存在，添加新记录
            const newVisit: CustomRecentVisit = {
              id: `visit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              url,
              title: title || url,
              visitTime: Date.now(),
            };
            newVisits = [newVisit, ...state.customVisits];
          }

          // 限制最大数量
          if (newVisits.length > MAX_VISITS) {
            newVisits = newVisits.slice(0, MAX_VISITS);
          }

          return { customVisits: newVisits };
        }),

      removeVisit: (id: string) =>
        set((state) => ({
          customVisits: state.customVisits.filter((v) => v.id !== id),
        })),

      clearVisits: () => set({ customVisits: [] }),
    }),
    {
      name: 'newtab-recent-visits',
    }
  )
);
