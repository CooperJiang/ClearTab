import { useState, useEffect } from 'react';
import { QUOTES } from '../types';
import { useSettingsStore } from '../stores/useSettingsStore';

export function useDailyQuote() {
  const [quote, setQuote] = useState(QUOTES[0]);
  const quoteRefreshInterval = useSettingsStore((state) => state.settings.quoteRefreshInterval);

  useEffect(() => {
    const updateQuote = () => {
      switch (quoteRefreshInterval) {
        case 'refresh':
          // 每次刷新随机选择
          const randomIndex = Math.floor(Math.random() * QUOTES.length);
          setQuote(QUOTES[randomIndex]);
          break;
        case '1day':
          // 每日一言（基于日期）
          const today = new Date();
          const dayOfYear = Math.floor(
            (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          const quoteIndex = dayOfYear % QUOTES.length;
          setQuote(QUOTES[quoteIndex]);
          break;
        default:
          // 其他间隔都使用随机模式
          const idx = Math.floor(Math.random() * QUOTES.length);
          setQuote(QUOTES[idx]);
      }
    };

    // 首次加载立即更新
    updateQuote();

    // 根据刷新间隔设置定时器
    let interval: ReturnType<typeof setInterval> | null = null;

    if (quoteRefreshInterval !== '1day' && quoteRefreshInterval !== 'refresh') {
      const intervalMs = {
        '1min': 1 * 60 * 1000,
        '10min': 10 * 60 * 1000,
        '1hour': 60 * 60 * 1000,
      }[quoteRefreshInterval] || 60 * 1000;

      interval = setInterval(updateQuote, intervalMs);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [quoteRefreshInterval]);

  return quote;
}
