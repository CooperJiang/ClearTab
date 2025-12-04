import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

interface SettingsState {
  settings: Settings;

  // Actions
  updateSettings: (updates: Partial<Settings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,

      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),

      resetSettings: () =>
        set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'newtab-settings',
      // 合并默认值，确保新字段有值
      // 重要：持久化的值应该优先于默认值，以保留用户设置（如已保存的壁纸）
      merge: (persistedState, currentState) => {
        const persisted = persistedState as SettingsState;
        return {
          ...currentState,
          settings: {
            ...DEFAULT_SETTINGS,
            ...persisted?.settings,
          },
        };
      },
    }
  )
);
