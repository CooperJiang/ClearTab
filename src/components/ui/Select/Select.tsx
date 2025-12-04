import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  width?: number | string;
}

export function Select({ value, options, onChange, placeholder, width }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, dropUp: false });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // 计算容器宽度样式
  const containerStyle = width
    ? { width: typeof width === 'number' ? `${width}px` : width }
    : undefined;

  // 计算下拉框位置
  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = Math.min(options.length * 36 + 8, 200); // 估算高度

      // 如果下方空间不够且上方空间更大，则向上展开
      const shouldDropUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setPosition({
        top: shouldDropUp ? rect.top - dropdownHeight - 6 : rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        dropUp: shouldDropUp,
      });
    }
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        updatePosition();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div className={styles.container} style={containerStyle}>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
        onClick={handleToggle}
      >
        <span className={styles.selectedLabel}>
          {selectedOption?.label || placeholder || 'Select...'}
        </span>
        <svg
          className={`${styles.chevron} ${isOpen ? styles.rotated : ''}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && createPortal(
        <div
          className={`${styles.dropdown} ${position.dropUp ? styles.dropUp : ''}`}
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            width: position.width,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.option} ${option.value === value ? styles.selected : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              <span className={styles.optionLabel}>{option.label}</span>
              {option.value === value && (
                <svg
                  className={styles.checkIcon}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
