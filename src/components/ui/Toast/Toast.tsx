import { useState } from 'react';
import { useToastStore, type ToastType } from '../../../stores/useToastStore';
import styles from './Toast.module.css';

const icons: Record<ToastType, React.ReactNode> = {
  success: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  ),
};

interface ToastItemProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

function ToastItem({ id, type, message, duration }: ToastItemProps) {
  const { removeToast } = useToastStore();
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      removeToast(id);
    }, 200); // 动画时间
  };

  return (
    <div
      className={`${styles.toast} ${styles[type]} ${isClosing ? styles.closing : ''}`}
      role="alert"
    >
      <div className={styles.icon}>{icons[type]}</div>
      <div className={styles.content}>
        <p className={styles.message}>{message}</p>
      </div>
      <button
        className={styles.closeButton}
        onClick={handleClose}
        aria-label="Close notification"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      {duration && duration > 0 && (
        <div
          className={styles.progressBar}
          style={{ animation: `${styles.progress} ${duration}ms linear forwards` }}
        />
      )}
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToastStore();

  return (
    <div className={styles.container} role="region" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
        />
      ))}
    </div>
  );
}
