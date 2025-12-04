// 壁纸源类型
export type WallpaperSource = 'pixelpunk';

export interface WallpaperInfo {
  url: string;
  source: WallpaperSource;
}

// PixelPunk 随机壁纸 API
// 参考: https://pixelpunk.cc/
// API 返回 304 重定向，每次都返回不同的随机壁纸
// 我们需要获取最终的图片 URL（跟踪重定向）
export async function fetchRandomWallpaper(pixelPunkApiUrl: string): Promise<WallpaperInfo> {
  try {
    console.log('[wallpaperApi] Fetching PixelPunk API:', pixelPunkApiUrl);

    // 使用 fetch 获取重定向后的最终 URL
    const response = await fetch(pixelPunkApiUrl, { method: 'HEAD' });
    const finalUrl = response.url;

    console.log('[wallpaperApi] Got final image URL:', finalUrl);

    return {
      url: finalUrl,
      source: 'pixelpunk',
    };
  } catch (error) {
    console.error('[wallpaperApi] Failed to fetch PixelPunk:', error);
    throw new Error('Failed to fetch wallpaper from PixelPunk API');
  }
}
