import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description?: string;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * 键盘快捷键 Hook
 *
 * 支持的快捷键：
 * - / : 聚焦搜索框
 * - ⌘/Ctrl + K : 打开全局搜索
 * - ⌘/Ctrl + , : 打开设置
 * - Esc : 关闭弹窗/返回
 * - ⌘/Ctrl + D : 切换深色模式
 * - ⌘/Ctrl + B : 添加书签
 * - 1-9 : 快速打开对应位置的快捷链接
 */
export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // 忽略在输入框中的快捷键（除了 Escape）
    const isInputFocused =
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement ||
      document.activeElement?.getAttribute('contenteditable') === 'true';

    for (const shortcut of shortcuts) {
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

      // 对于带修饰键的快捷键，检查修饰键
      const hasModifier = shortcut.ctrl || shortcut.meta || shortcut.shift || shortcut.alt;

      if (hasModifier) {
        // 带修饰键的快捷键
        const modifierMatch =
          (shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey) || shortcut.meta) &&
          (shortcut.meta ? e.metaKey : true) &&
          (shortcut.shift ? e.shiftKey : !e.shiftKey) &&
          (shortcut.alt ? e.altKey : !e.altKey);

        if (keyMatch && modifierMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      } else {
        // 不带修饰键的快捷键，在输入框中时跳过（除了 Escape）
        if (isInputFocused && shortcut.key.toLowerCase() !== 'escape') {
          continue;
        }

        if (keyMatch && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// 预定义的快捷键配置
export const SHORTCUT_KEYS = {
  SEARCH_FOCUS: '/',
  GLOBAL_SEARCH: 'k',
  SETTINGS: ',',
  ESCAPE: 'Escape',
  TOGGLE_THEME: 'd',
  ADD_BOOKMARK: 'b',
  QUICK_LINK_1: '1',
  QUICK_LINK_2: '2',
  QUICK_LINK_3: '3',
  QUICK_LINK_4: '4',
  QUICK_LINK_5: '5',
  QUICK_LINK_6: '6',
  QUICK_LINK_7: '7',
  QUICK_LINK_8: '8',
  QUICK_LINK_9: '9',
} as const;
