export { ToastContainer } from './Toast';
export type { Toast, ToastType } from '../../../stores/useToastStore';

// 便捷 hook 用于显示 toast
import { useToastStore } from '../../../stores/useToastStore';
import type { ToastType as TType } from '../../../stores/useToastStore';

export function useToast() {
  const addToast = useToastStore((state) => state.addToast);

  const showToast = (message: string, type: TType = 'info', duration?: number) => {
    addToast({ message, type, duration });
  };

  return { showToast };
}
