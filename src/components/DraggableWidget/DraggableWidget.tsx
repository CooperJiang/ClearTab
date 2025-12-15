import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useTranslation } from '../../i18n';
import styles from './DraggableWidget.module.css';

interface Position {
  x: number;
  y: number;
}

interface DraggableWidgetProps {
  id: string;
  title: string;
  defaultPosition: Position;
  onPositionChange?: (position: Position) => void;
  children: ReactNode;
  width?: number;
  height?: number | 'auto';
  minimizable?: boolean;
  closable?: boolean;
  onClose?: () => void;
  hideHeader?: boolean; // 隐藏标题栏
  transparent?: boolean; // 透明背景
}

export function DraggableWidget({
  title,
  defaultPosition,
  onPositionChange,
  children,
  width = 300,
  height = 'auto',
  minimizable = true,
  closable = false,
  onClose,
  hideHeader = false,
  transparent = false,
}: DraggableWidgetProps) {
  const { t } = useTranslation();
  const [position, setPosition] = useState<Position>(defaultPosition);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // 处理鼠标按下
  const handleMouseDown = (e: React.MouseEvent) => {
    // 如果隐藏标题栏，整个组件可拖拽；否则只能拖拽标题栏
    if (!hideHeader && !headerRef.current?.contains(e.target as Node)) return;

    setIsDragging(true);
    if (widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // 处理鼠标移动
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newPosition = {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      };

      // 限制在窗口内
      const maxX = window.innerWidth - (width || 300);
      const maxY = window.innerHeight - 80;

      const clampedPosition = {
        x: Math.max(0, Math.min(newPosition.x, maxX)),
        y: Math.max(0, Math.min(newPosition.y, maxY)),
      };

      setPosition(clampedPosition);
      onPositionChange?.(clampedPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, width, onPositionChange]);

  return (
    <div
      ref={widgetRef}
      className={`${styles.widget} ${isDragging ? styles.dragging : ''} ${transparent ? styles.transparent : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${width}px`,
        height: isMinimized ? 'auto' : typeof height === 'string' ? height : `${height}px`,
      }}
      onMouseDown={hideHeader ? handleMouseDown : undefined}
    >
      {/* 标题栏 */}
      {!hideHeader && (
        <div
          ref={headerRef}
          className={styles.header}
          onMouseDown={handleMouseDown}
        >
          <div className={styles.title}>{title}</div>
          <div className={styles.actions}>
            {minimizable && (
              <button
                className={styles.actionBtn}
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? t.widget.expand : t.widget.minimize}
              >
                {isMinimized ? '▲' : '▼'}
              </button>
            )}
            {closable && (
              <button
                className={styles.actionBtn}
                onClick={onClose}
                title={t.widget.close}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* 内容区 */}
      {!isMinimized && <div className={`${styles.content} ${hideHeader ? styles.fullContent : ''}`}>{children}</div>}
    </div>
  );
}
