import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './ContextMenu.module.css';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  children: React.ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
  disabled?: boolean;
}

interface MenuPosition {
  x: number;
  y: number;
}

export function ContextMenu({ items, children, onOpen, onClose, disabled }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (disabled) return;

    e.preventDefault();
    e.stopPropagation();

    // 计算菜单位置
    const menuWidth = 180;
    const menuHeight = items.filter(i => !i.divider).length * 36 + items.filter(i => i.divider).length * 9;

    let x = e.clientX;
    let y = e.clientY;

    // 防止菜单超出视口
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 8;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 8;
    }

    setPosition({ x, y });
    setIsOpen(true);
    onOpen?.();
  }, [disabled, items, onOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const handleItemClick = useCallback((item: ContextMenuItem) => {
    if (item.disabled || item.divider) return;
    item.onClick?.();
    handleClose();
  }, [handleClose]);

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    // 延迟添加监听器，避免立即触发
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, handleClose]);

  // 滚动时关闭
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => handleClose();
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen, handleClose]);

  return (
    <>
      <div
        ref={triggerRef}
        onContextMenu={handleContextMenu}
        style={{ display: 'contents' }}
      >
        {children}
      </div>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          className={styles.menu}
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          {items.map((item) => {
            if (item.divider) {
              return <div key={item.id} className={styles.divider} />;
            }

            return (
              <button
                key={item.id}
                className={`${styles.item} ${item.danger ? styles.danger : ''} ${item.disabled ? styles.disabled : ''}`}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
              >
                {item.icon && <span className={styles.icon}>{item.icon}</span>}
                <span className={styles.label}>{item.label}</span>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}
