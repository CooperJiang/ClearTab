import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}

export function Modal({ isOpen, onClose, title, subtitle, children, size = 'medium' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const prevIsOpen = useRef(isOpen);

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
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isClosing) {
        handleClose();
      }
    };

    if (shouldRender && !isClosing) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [shouldRender, isClosing]);

  const handleClose = () => {
    if (!isClosing) {
      setIsClosing(true);
    }
  };

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
      <div className={`${styles.modal} ${sizeClass} ${isClosing ? styles.closing : ''}`}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <h2 className={styles.title}>{title}</h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <button className={styles.closeButton} onClick={handleClose}>
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
