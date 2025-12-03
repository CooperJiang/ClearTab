// 壁纸源类型
export type WallpaperSource = 'bing' | 'picsum';

export interface WallpaperInfo {
  url: string;
  source: WallpaperSource;
}

// Bing 每日壁纸 API（使用代理避免 CORS）
// 参考: https://github.com/TimothyYe/bing-wallpaper
function fetchBingWallpaper(): WallpaperInfo {
  const idx = Math.floor(Math.random() * 8);
  return {
    url: `https://bing.biturl.top/?resolution=1920&format=image&index=${idx}&mkt=zh-CN`,
    source: 'bing',
  };
}

// Picsum 随机壁纸（Lorem Picsum）
// 参考: https://picsum.photos/
function fetchPicsumWallpaper(): WallpaperInfo {
  const id = Math.floor(Math.random() * 1000);
  return {
    url: `https://picsum.photos/id/${id}/1920/1080`,
    source: 'picsum',
  };
}

// 随机获取壁纸（从 Bing 和 Picsum）
export async function fetchRandomWallpaper(): Promise<WallpaperInfo> {
  const sources: WallpaperSource[] = ['bing', 'picsum'];
  const randomSource = sources[Math.floor(Math.random() * sources.length)];

  switch (randomSource) {
    case 'bing':
      return fetchBingWallpaper();
    case 'picsum':
      return fetchPicsumWallpaper();
    default:
      return fetchBingWallpaper();
  }
}
