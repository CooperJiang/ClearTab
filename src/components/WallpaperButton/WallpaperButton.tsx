import { useState } from 'react';
import { useTranslation } from '../../i18n';
import styles from './WallpaperButton.module.css';

interface WallpaperButtonProps {
  onGetWallpaperUrl: () => Promise<string>;
  onApplyWallpaper: (url: string) => void;
}

const LOAD_TIMEOUT = 15000; // 15秒超时

export function WallpaperButton({ onGetWallpaperUrl, onApplyWallpaper }: WallpaperButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handleClick = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // 获取壁纸 URL
      const url = await onGetWallpaperUrl();

      // 预加载图片
      await loadImage(url);

      // 图片加载成功，应用壁纸
      onApplyWallpaper(url);
    } catch (error) {
      console.error('Failed to load wallpaper:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={`${styles.button} ${isLoading ? styles.loading : ''}`}
      onClick={handleClick}
      disabled={isLoading}
      title={t.wallpaperButton.tooltip}
    >
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* 风车图标 */}
        <path d="M12 12L12 2C12 2 17 7 12 12" />
        <path d="M12 12L22 12C22 12 17 17 12 12" />
        <path d="M12 12L12 22C12 22 7 17 12 12" />
        <path d="M12 12L2 12C2 12 7 7 12 12" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
    </button>
  );
}

// 预加载图片，带超时
function loadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => {
      reject(new Error('Image load timeout'));
    }, LOAD_TIMEOUT);

    img.onload = () => {
      clearTimeout(timer);
      resolve();
    };

    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Image load failed'));
    };

    img.src = url;
  });
}
