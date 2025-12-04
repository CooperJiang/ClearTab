import { useState } from 'react';
import { useTranslation } from '../../i18n';
import { useToast } from '../../hooks/useToast';
import styles from './WallpaperButton.module.css';

interface WallpaperButtonProps {
  onGetWallpaperUrl: () => Promise<string>;
  onApplyWallpaper: (url: string) => void;
}

const LOAD_TIMEOUT = 15000; // 15秒超时

export function WallpaperButton({ onGetWallpaperUrl, onApplyWallpaper }: WallpaperButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const toast = useToast();

  const handleClick = async () => {
    // 防止重复点击
    if (isLoading) {
      console.log('[WallpaperButton] Already loading, ignoring click');
      return;
    }

    setIsLoading(true);
    try {
      // 获取壁纸 URL
      console.log('[WallpaperButton] Fetching wallpaper URL...');
      const url = await onGetWallpaperUrl();
      console.log('[WallpaperButton] Got wallpaper URL:', url);

      // 预加载图片
      console.log('[WallpaperButton] Loading image...');
      await loadImage(url);

      // 图片加载成功，应用壁纸
      console.log('[WallpaperButton] Image loaded successfully, applying wallpaper');
      onApplyWallpaper(url);
      console.log('[WallpaperButton] Wallpaper applied');
      toast.success(t.toast.wallpaperLoadSuccess);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to load wallpaper:', errorMessage);

      if (errorMessage.includes('Image load timeout')) {
        toast.error(t.toast.wallpaperLoadTimeout);
      } else if (errorMessage.includes('not configured')) {
        toast.error(t.toast.wallpaperApiNotConfigured);
      } else {
        toast.error(t.toast.wallpaperLoadError);
      }
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
