import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FaviconCacheItem {
  base64: string;  // base64格式的图片数据
  timestamp: number;
}

interface FaviconStoreState {
  // 成功的缓存：domain -> base64
  cache: Record<string, FaviconCacheItem>;
  // 失败的域名：domain -> timestamp
  failedDomains: Record<string, number>;

  // 方法
  getCachedFavicon: (domain: string) => string | null;
  cacheFavicon: (domain: string, base64: string) => void;
  markAsFailed: (domain: string) => void;
  hasFailed: (domain: string) => boolean;
  clearCache: () => void;
}

const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;   // 成功缓存7天
const FAILURE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 失败记录7天后可重试

export const useFaviconStore = create<FaviconStoreState>()(
  persist(
    (set, get) => ({
      cache: {},
      failedDomains: {},

      /**
       * 从缓存获取favicon（返回base64）
       */
      getCachedFavicon: (domain: string) => {
        const item = get().cache[domain];
        if (!item) return null;

        // 检查缓存是否过期
        if (Date.now() - item.timestamp > CACHE_EXPIRY_MS) {
          return null;
        }

        return item.base64;
      },

      /**
       * 存储favicon到缓存（base64格式）
       */
      cacheFavicon: (domain: string, base64: string) => {
        set((state) => ({
          cache: {
            ...state.cache,
            [domain]: {
              base64,
              timestamp: Date.now(),
            },
          },
          // 同时清除失败记录
          failedDomains: Object.fromEntries(
            Object.entries(state.failedDomains).filter(([k]) => k !== domain)
          ),
        }));
      },

      /**
       * 标记域名为失败（7天后可重试）
       */
      markAsFailed: (domain: string) => {
        set((state) => ({
          failedDomains: {
            ...state.failedDomains,
            [domain]: Date.now(),
          },
        }));
      },

      /**
       * 检查域名是否在失败冷却期内
       */
      hasFailed: (domain: string) => {
        const failedTime = get().failedDomains[domain];
        if (!failedTime) return false;

        // 7天后可以重试
        if (Date.now() - failedTime > FAILURE_EXPIRY_MS) {
          return false;
        }

        return true;
      },

      /**
       * 清除所有缓存
       */
      clearCache: () => {
        set({ cache: {}, failedDomains: {} });
      },
    }),
    {
      name: 'favicon-store',
    }
  )
);
