import { useEffect, useState, useCallback } from 'react';
import chromeHistoryService, { type HistoryItem } from '../services/chromeHistoryService';
import { useRecentVisitsStore } from '../stores';
import { useSettingsStore } from '../stores';

interface UseRecentVisitsOptions {
  limit?: number;
  enabled?: boolean;
}

/**
 * 获取最近访问的 Hook
 * 支持两种模式：
 * 1. chrome: 使用 Chrome History API
 * 2. custom: 使用自定义跟踪
 */
export function useRecentVisits({ limit = 8, enabled = true }: UseRecentVisitsOptions = {}) {
  const [recentVisits, setRecentVisits] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const settings = useSettingsStore((state) => state.settings);
  const customVisits = useRecentVisitsStore((state) => state.customVisits);

  const effectiveLimit = limit || settings.recentVisitsCount;
  const mode = settings.recentVisitsMode;

  const loadRecentVisits = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (mode === 'custom') {
        // 自定义模式：使用本地存储的访问记录
        const visits: HistoryItem[] = customVisits.slice(0, effectiveLimit).map((v) => ({
          id: v.id,
          url: v.url,
          title: v.title,
          lastVisitTime: v.visitTime,
          visitCount: 1,
        }));
        setRecentVisits(visits);
        setError(null);
      } else {
        // Chrome 模式：使用 Chrome History API
        const isAvailable = chromeHistoryService.isAvailable();

        if (!isAvailable) {
          setError('Chrome History API not available');
          setRecentVisits([]);
          setIsLoading(false);
          return;
        }

        const visits = await chromeHistoryService.getRecentHistory(effectiveLimit);

        // 去重：按 URL 去重
        const seen = new Set<string>();
        const deduplicated = visits.filter((v) => {
          if (seen.has(v.url)) {
            return false;
          }
          seen.add(v.url);
          return true;
        });

        setRecentVisits(deduplicated);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recent visits');
      setRecentVisits([]);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveLimit, enabled, mode, customVisits]);

  useEffect(() => {
    loadRecentVisits();
  }, [loadRecentVisits]);

  const refresh = useCallback(() => {
    loadRecentVisits();
  }, [loadRecentVisits]);

  return {
    recentVisits,
    isLoading,
    error,
    refresh,
  };
}
