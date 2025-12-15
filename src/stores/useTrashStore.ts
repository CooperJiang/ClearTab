import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Bookmark, Category } from '../types';
import type { BookmarkMode } from '../hooks/useBookmarkAdapter';
import type { BookmarkMetadata } from './useBookmarkMetadataStore';

export interface TrashItem {
  id: string;
  type: 'bookmark' | 'category';
  data: Bookmark | Category;
  deletedAt: number;
  mode: BookmarkMode;
  // 分类删除时，保存其下的书签
  relatedBookmarks?: Bookmark[];
  browserParentId?: string;
  browserMetadata?: BookmarkMetadata;
}

export interface TrashSettings {
  enabled: boolean;
  recycleBookmarks: boolean;
  recycleCategories: boolean;
  retentionDays: number; // 保留天数
}

interface TrashState {
  items: TrashItem[];
  settings: TrashSettings;

  // Actions
  addToTrash: (item: TrashItem) => void;
  removeFromTrash: (id: string) => void;
  restoreItem: (id: string) => TrashItem | null;
  clearTrash: () => void;
  cleanExpiredItems: () => void;
  updateSettings: (settings: Partial<TrashSettings>) => void;
  getExpiredItems: () => TrashItem[];
}

const DEFAULT_SETTINGS: TrashSettings = {
  enabled: true,
  recycleBookmarks: true,
  recycleCategories: true,
  retentionDays: 15,
};

export const useTrashStore = create<TrashState>()(
  persist(
    (set, get) => ({
      items: [],
      settings: DEFAULT_SETTINGS,

      addToTrash: (item) => {
        const { settings } = get();
        if (!settings.enabled) return;

        // 根据设置判断是否回收
        if (item.type === 'bookmark' && !settings.recycleBookmarks) return;
        if (item.type === 'category' && !settings.recycleCategories) return;

        set((state) => ({
          items: [item, ...state.items],
        }));
      },

      removeFromTrash: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      restoreItem: (id) => {
        const state = get();
        const item = state.items.find((trashItem) => trashItem.id === id) || null;
        if (item) {
          set({
            items: state.items.filter((trashItem) => trashItem.id !== id),
          });
        }
        return item;
      },

      clearTrash: () => set({ items: [] }),

      cleanExpiredItems: () => {
        const { settings, items } = get();
        const now = Date.now();
        const retentionMs = settings.retentionDays * 24 * 60 * 60 * 1000;

        const validItems = items.filter(
          (item) => now - item.deletedAt < retentionMs
        );

        if (validItems.length !== items.length) {
          set({ items: validItems });
        }
      },

      getExpiredItems: () => {
        const { settings, items } = get();
        const now = Date.now();
        const retentionMs = settings.retentionDays * 24 * 60 * 60 * 1000;

        return items.filter((item) => now - item.deletedAt >= retentionMs);
      },

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: 'newtab-trash',
    }
  )
);
