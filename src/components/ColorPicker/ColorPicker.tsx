import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './ColorPicker.module.css';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

// HSV 转 RGB
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

// RGB 转 HSV
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }

  return [h, s, v];
}

// Hex 转 RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
    ];
  }
  return [0, 0, 0];
}

// RGB 转 Hex
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hsv, setHsv] = useState<[number, number, number]>(() => {
    const rgb = hexToRgb(value);
    return rgbToHsv(...rgb);
  });
  const [inputValue, setInputValue] = useState(value);

  const containerRef = useRef<HTMLDivElement>(null);
  const saturationRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  // 同步外部 value 变化
  useEffect(() => {
    const rgb = hexToRgb(value);
    setHsv(rgbToHsv(...rgb));
    setInputValue(value);
  }, [value]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 更新颜色
  const updateColor = useCallback((newHsv: [number, number, number]) => {
    setHsv(newHsv);
    const rgb = hsvToRgb(...newHsv);
    const hex = rgbToHex(...rgb);
    setInputValue(hex);
    onChange(hex);
  }, [onChange]);

  // 饱和度/明度面板拖拽
  const handleSaturationMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const updateSaturation = (clientX: number, clientY: number) => {
      const rect = saturationRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      updateColor([hsv[0], x, 1 - y]);
    };

    updateSaturation(e.clientX, e.clientY);

    const handleMouseMove = (e: MouseEvent) => updateSaturation(e.clientX, e.clientY);
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 色相滑块拖拽
  const handleHueMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const updateHue = (clientX: number) => {
      const rect = hueRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      updateColor([x * 360, hsv[1], hsv[2]]);
    };

    updateHue(e.clientX);

    const handleMouseMove = (e: MouseEvent) => updateHue(e.clientX);
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 手动输入
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      const rgb = hexToRgb(val);
      setHsv(rgbToHsv(...rgb));
      onChange(val);
    }
  };

  const handleInputBlur = () => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(inputValue)) {
      setInputValue(value);
    }
  };

  // 当前颜色的纯色相色（用于饱和度面板背景）
  const hueColor = rgbToHex(...hsvToRgb(hsv[0], 1, 1));

  return (
    <div className={styles.container} ref={containerRef}>
      {/* 颜色预览按钮 */}
      <button
        type="button"
        className={styles.trigger}
        style={{ backgroundColor: value }}
        onClick={() => setIsOpen(!isOpen)}
      />
      <span className={styles.value}>{value}</span>

      {/* 弹出面板 */}
      {isOpen && (
        <div className={styles.popup}>
          {/* 饱和度/明度面板 */}
          <div
            ref={saturationRef}
            className={styles.saturation}
            style={{ backgroundColor: hueColor }}
            onMouseDown={handleSaturationMouseDown}
          >
            <div className={styles.saturationWhite} />
            <div className={styles.saturationBlack} />
            <div
              className={styles.saturationPointer}
              style={{
                left: `${hsv[1] * 100}%`,
                top: `${(1 - hsv[2]) * 100}%`,
              }}
            />
          </div>

          {/* 色相滑块 */}
          <div
            ref={hueRef}
            className={styles.hue}
            onMouseDown={handleHueMouseDown}
          >
            <div
              className={styles.huePointer}
              style={{ left: `${(hsv[0] / 360) * 100}%` }}
            />
          </div>

          {/* Hex 输入 */}
          <div className={styles.inputRow}>
            <input
              type="text"
              className={styles.hexInput}
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              maxLength={7}
            />
          </div>
        </div>
      )}
    </div>
  );
}
