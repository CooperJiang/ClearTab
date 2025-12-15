import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BookmarkMetadata {
  chromeId: string; // Chrome 书签 ID
  color?: string; // 自定义颜色
  tags: string[]; // 标签列表
  isPinned: boolean; // 是否置顶到快捷访问
  customTitle?: string; // 自定义标题（仅在本地显示）
  customOrder: number; // 自定义排序权重
  createdAt: number; // 创建时间
  updatedAt: number; // 更新时间
}

interface BookmarkMetadataState {
  metadata: Map<string, BookmarkMetadata>;
  allTags: Set<string>;

  // Actions
  setMetadata: (chromeId: string, meta: Partial<BookmarkMetadata>) => void;
  getMetadata: (chromeId: string) => BookmarkMetadata | undefined;
  deleteMetadata: (chromeId: string) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  getAllTags: () => string[];
  addTagToBookmark: (chromeId: string, tag: string) => void;
  removeTagFromBookmark: (chromeId: string, tag: string) => void;
  togglePin: (chromeId: string) => void;
  setColor: (chromeId: string, color: string) => void;
  resetMetadata: () => void;
}

export const useBookmarkMetadataStore = create<BookmarkMetadataState>()(
  persist(
    (set, get) => ({
      metadata: new Map(),
      allTags: new Set(),

      setMetadata: (chromeId: string, meta: Partial<BookmarkMetadata>) => {
        set((state) => {
          const newMetadata = new Map(state.metadata);
          const existing = newMetadata.get(chromeId);
          newMetadata.set(chromeId, {
            chromeId,
            color: existing?.color,
            tags: existing?.tags || [],
            isPinned: existing?.isPinned || false,
            customOrder: existing?.customOrder || 0,
            createdAt: existing?.createdAt || Date.now(),
            ...meta,
            updatedAt: Date.now(),
          });
          return { metadata: newMetadata };
        });
      },

      getMetadata: (chromeId: string) => {
        return get().metadata.get(chromeId);
      },

      deleteMetadata: (chromeId: string) => {
        set((state) => {
          const newMetadata = new Map(state.metadata);
          newMetadata.delete(chromeId);
          return { metadata: newMetadata };
        });
      },

      addTag: (tag: string) => {
        set((state) => {
          const newTags = new Set(state.allTags);
          newTags.add(tag);
          return { allTags: newTags };
        });
      },

      removeTag: (tag: string) => {
        set((state) => {
          // 只有当没有书签使用这个标签时才删除
          const hasBookmarkWithTag = Array.from(state.metadata.values()).some((m) =>
            m.tags.includes(tag)
          );
          if (!hasBookmarkWithTag) {
            const newTags = new Set(state.allTags);
            newTags.delete(tag);
            return { allTags: newTags };
          }
          return {};
        });
      },

      getAllTags: () => {
        return Array.from(get().allTags).sort();
      },

      addTagToBookmark: (chromeId: string, tag: string) => {
        set((state) => {
          const meta = state.metadata.get(chromeId);
          if (!meta) {
            get().setMetadata(chromeId, { tags: [tag] });
            get().addTag(tag);
          } else if (!meta.tags.includes(tag)) {
            const newMetadata = new Map(state.metadata);
            newMetadata.set(chromeId, {
              ...meta,
              tags: [...meta.tags, tag],
              updatedAt: Date.now(),
            });
            set({ metadata: newMetadata });
            get().addTag(tag);
          }
          return {};
        });
      },

      removeTagFromBookmark: (chromeId: string, tag: string) => {
        set((state) => {
          const meta = state.metadata.get(chromeId);
          if (meta) {
            const newMetadata = new Map(state.metadata);
            newMetadata.set(chromeId, {
              ...meta,
              tags: meta.tags.filter((t) => t !== tag),
              updatedAt: Date.now(),
            });
            set({ metadata: newMetadata });
            get().removeTag(tag);
          }
          return {};
        });
      },

      togglePin: (chromeId: string) => {
        set((state) => {
          const meta = state.metadata.get(chromeId);
          const newIsPinned = !(meta?.isPinned || false);
          get().setMetadata(chromeId, { isPinned: newIsPinned });
          return {};
        });
      },

      setColor: (chromeId: string, color: string) => {
        get().setMetadata(chromeId, { color });
      },

      resetMetadata: () => {
        set({
          metadata: new Map(),
          allTags: new Set(),
        });
      },
    }),
    {
      name: 'newtab-bookmark-metadata',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const data = JSON.parse(str);
          return {
            ...data,
            state: {
              ...data.state,
              metadata: new Map(data.state?.metadata || []),
              allTags: new Set(data.state?.allTags || []),
            },
          };
        },
        setItem: (name, value) => {
          const data = {
            ...value,
            state: {
              ...value.state,
              metadata: Array.from(value.state?.metadata || new Map()),
              allTags: Array.from(value.state?.allTags || new Set()),
            },
          };
          localStorage.setItem(name, JSON.stringify(data));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
