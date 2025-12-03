import { useState, useEffect } from 'react';
import { QUOTES } from '../types';

export function useDailyQuote() {
  const [quote, setQuote] = useState(QUOTES[0]);

  useEffect(() => {
    // 基于日期选择每日一言，确保同一天显示相同的内容
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const quoteIndex = dayOfYear % QUOTES.length;
    setQuote(QUOTES[quoteIndex]);
  }, []);

  return quote;
}
