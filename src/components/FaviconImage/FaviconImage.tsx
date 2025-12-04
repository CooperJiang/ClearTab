import { useEffect, useState } from 'react';
import { getFavicon } from '../../utils/faviconService';
import { generateLetterIcon } from '../../utils/letterIconUtils';
import styles from './FaviconImage.module.css';

export interface FaviconImageProps {
  /**
   * 书签的完整URL
   */
  url: string;

  /**
   * 书签标题（用于生成首字母图标备用方案）
   */
  title: string;

  /**
   * 图标大小（px）
   */
  size?: number;

  /**
   * 自定义CSS class
   */
  className?: string;

  /**
   * 背景颜色（可选，用于备用图标）
   */
  color?: string;

  /**
   * 图片加载失败时的回调
   */
  onLoadError?: () => void;
}

/**
 * Favicon图片组件
 *
 * 完整的favicon获取流程：
 * 1. 加载组件时，尝试获取favicon
 * 2. 成功 → 显示真实favicon
 * 3. 失败或网络离线 → 显示首字母图标
 * 4. 用户交互时，可以重试获取
 *
 * 所有请求都带有缓存和失败记录机制
 */
export function FaviconImage({
  url,
  title,
  size = 32,
  className = '',
  onLoadError,
}: FaviconImageProps) {
  const [favicon, setFavicon] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  /**
   * 获取favicon的核心逻辑
   */
  const loadFavicon = async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const faviconUrl = await getFavicon(url);

      if (faviconUrl) {
        setFavicon(faviconUrl);
      } else {
        // 获取失败，使用首字母图标
        setHasError(true);
      }
    } catch (error) {
      console.error(`[FaviconImage] Error loading favicon for ${url}:`, error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 初始化加载
   */
  useEffect(() => {
    loadFavicon();
  }, [url]);

  /**
   * 处理图片加载失败
   */
  const handleImageError = () => {
    console.warn(`[FaviconImage] Image load failed, using fallback: ${title}`);
    setHasError(true);
    onLoadError?.();
  };

  // 显示备用方案（首字母图标）
  const fallbackIcon = generateLetterIcon(title, size);

  return (
    <div
      className={`${styles.container} ${hasError ? styles.fallback : ''} ${className}`}
      style={{ width: size, height: size }}
      title={`${title} (${url})`}
    >
      {favicon && !hasError ? (
        <img
          src={favicon}
          alt={title}
          className={styles.image}
          style={{ width: size, height: size }}
          onError={handleImageError}
        />
      ) : (
        <img
          src={fallbackIcon}
          alt={title}
          className={styles.image}
          style={{ width: size, height: size }}
        />
      )}

      {isLoading && <div className={styles.skeleton} />}
    </div>
  );
}

export default FaviconImage;
