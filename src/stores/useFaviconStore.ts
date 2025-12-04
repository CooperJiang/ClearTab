import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FaviconCacheItem {
  dataUrl: string;
  timestamp: number;
}

interface FaviconFailureItem {
  failureCount: number;
  lastFailTime: number;
}

interface FaviconStoreState {
  // 缓存：domain -> dataUrl
  cache: Record<string, FaviconCacheItem>;
  // 失败记录：domain -> 失败次数
  failures: Record<string, FaviconFailureItem>;

  // 方法
  getCachedFavicon: (domain: string) => string | null;
  cacheFavicon: (domain: string, dataUrl: string) => void;
  recordFailure: (domain: string) => void;
  shouldRetry: (domain: string, maxFailures?: number) => boolean;
  clearOldCache: (maxAgeMs?: number) => void;
  getFailureCount: (domain: string) => number;
}

const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7天
const MAX_FAILURES = 3; // 失败超过3次就不再尝试

export const useFaviconStore = create<FaviconStoreState>()(
  persist(
    (set, get) => ({
      cache: {},
      failures: {},

      /**
       * 从缓存获取favicon
       */
      getCachedFavicon: (domain: string) => {
        const state = get();
        const item = state.cache[domain];

        if (!item) return null;

        // 检查缓存是否过期
        const ageMs = Date.now() - item.timestamp;
        if (ageMs > CACHE_EXPIRY_MS) {
          // 清除过期缓存
          set((state) => ({
            cache: Object.fromEntries(
              Object.entries(state.cache).filter(
                ([_, v]) => Date.now() - v.timestamp <= CACHE_EXPIRY_MS
              )
            ),
          }));
          return null;
        }

        return item.dataUrl;
      },

      /**
       * 存储favicon到缓存
       */
      cacheFavicon: (domain: string, dataUrl: string) => {
        set((state) => ({
          cache: {
            ...state.cache,
            [domain]: {
              dataUrl,
              timestamp: Date.now(),
            },
          },
          // 清除此域名的失败记录（成功了）
          failures: Object.fromEntries(
            Object.entries(state.failures).filter(([k]) => k !== domain)
          ),
        }));
      },

      /**
       * 记录失败
       */
      recordFailure: (domain: string) => {
        set((state) => ({
          failures: {
            ...state.failures,
            [domain]: {
              failureCount: (state.failures[domain]?.failureCount ?? 0) + 1,
              lastFailTime: Date.now(),
            },
          },
        }));
      },

      /**
       * 判断是否应该重试（失败次数未超过限制）
       */
      shouldRetry: (domain: string, maxFailures = MAX_FAILURES) => {
        const state = get();
        const failure = state.failures[domain];

        if (!failure) return true; // 没有失败记录，可以尝试

        return failure.failureCount < maxFailures;
      },

      /**
       * 获取失败次数
       */
      getFailureCount: (domain: string) => {
        const state = get();
        return state.failures[domain]?.failureCount ?? 0;
      },

      /**
       * 清理过期缓存
       */
      clearOldCache: (maxAgeMs = CACHE_EXPIRY_MS) => {
        set((state) => ({
          cache: Object.fromEntries(
            Object.entries(state.cache).filter(
              ([_, v]) => Date.now() - v.timestamp <= maxAgeMs
            )
          ),
        }));
      },
    }),
    {
      name: 'favicon-store',
    }
  )
);
