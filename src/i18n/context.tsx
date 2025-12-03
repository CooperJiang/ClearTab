import { createContext, useContext, useMemo, useCallback, type ReactNode } from 'react';
import type { Locale, TranslationSchema } from './types';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './types';
import { zhCN } from './locales/zh-CN';
import { enUS } from './locales/en-US';

// 所有翻译文件映射
const translations: Record<Locale, TranslationSchema> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

// i18n 上下文类型
interface I18nContextValue {
  locale: Locale;
  t: TranslationSchema;
  setLocale: (locale: Locale) => void;
  supportedLocales: typeof SUPPORTED_LOCALES;
}

// 创建上下文
const I18nContext = createContext<I18nContextValue | null>(null);

// Provider Props
interface I18nProviderProps {
  children: ReactNode;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

// i18n Provider 组件
export function I18nProvider({ children, locale, onLocaleChange }: I18nProviderProps) {
  const t = useMemo(() => {
    return translations[locale] || translations[DEFAULT_LOCALE];
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    if (SUPPORTED_LOCALES.some(l => l.code === newLocale)) {
      onLocaleChange(newLocale);
    }
  }, [onLocaleChange]);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    t,
    setLocale,
    supportedLocales: SUPPORTED_LOCALES,
  }), [locale, t, setLocale]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

// 使用 i18n 的 Hook
export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}

// 导出类型
export type { Locale, TranslationSchema } from './types';
export { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './types';
