import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '../../i18n';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  closeDisabled?: boolean;
}

export function Modal({ isOpen, onClose, title, subtitle, children, size = 'medium', closeDisabled = false }: ModalProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const prevIsOpen = useRef(isOpen);

  const handleClose = useCallback(() => {
    if (!isClosing && !closeDisabled) setIsClosing(true);
  }, [isClosing, closeDisabled]);

  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      // 打开弹窗
      setShouldRender(true);
      setIsClosing(false);
    } else if (!isOpen && prevIsOpen.current && shouldRender) {
      // 外部触发关闭，开始关闭动画
      setIsClosing(true);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, shouldRender]);

  useEffect(() => {
    if (!shouldRender) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const firstInput = overlayRef.current?.querySelector<HTMLElement>('input, textarea, select');
    (firstInput || overlayRef.current?.querySelector<HTMLElement>('button'))?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [shouldRender]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented && !e.isComposing && overlayRef.current?.contains(e.target as Node)) {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };

    if (shouldRender && !isClosing) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [shouldRender, isClosing, handleClose]);

  const handleAnimationEnd = (e: React.AnimationEvent) => {
    // 只处理overlay的动画结束事件
    if (e.target === overlayRef.current && isClosing) {
      setShouldRender(false);
      setIsClosing(false);
      // 只有当外部还没关闭时才调用onClose
      if (prevIsOpen.current) {
        onClose();
      }
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current && !isClosing) {
      handleClose();
    }
  };

  if (!shouldRender) return null;

  const sizeClass = size === 'small' ? styles.small : size === 'large' ? styles.large : '';

  return createPortal(
    <div
      className={`${styles.overlay} ${isClosing ? styles.closing : ''}`}
      ref={overlayRef}
      onClick={handleOverlayClick}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className={`${styles.modal} ${sizeClass} ${isClosing ? styles.closing : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <h2 className={styles.title} id={titleId}>{title}</h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <button type="button" className={styles.closeButton} onClick={handleClose} aria-label={t.common.close} disabled={closeDisabled}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
