import { useFaviconStore } from '../stores/useFaviconStore';
import { extractDomain } from './networkUtils';

/**
 * Favicon获取服务
 *
 * 流程：
 * 1. 检查缓存 → 有base64直接返回
 * 2. 检查失败标记 → 7天内失败过的不请求
 * 3. 请求Google Favicon服务 → 转成base64存储
 * 4. 失败 → 标记失败，返回null（使用首字母图标）
 */

const TIMEOUT_MS = 5000; // 5秒超时
const pendingRequests = new Map<string, Promise<string | null>>();

/**
 * 获取Favicon
 * @param bookmarkUrl 书签的完整URL
 * @returns base64格式的favicon，失败返回null
 */
export async function getFavicon(bookmarkUrl: string): Promise<string | null> {
  const domain = extractDomain(bookmarkUrl);
  const store = useFaviconStore.getState();

  // 1️⃣ 检查缓存（返回base64）
  const cached = store.getCachedFavicon(domain);
  if (cached) {
    return cached;
  }

  // 2️⃣ 检查是否已失败过（7天内不再请求）
  if (store.hasFailed(domain)) {
    return null;
  }

  if (!navigator.onLine) return null;
  const pending = pendingRequests.get(domain);
  if (pending) return pending;

  // 3️⃣ 请求Google Favicon并转成base64
  const googleUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;

  const request = (async () => {
    try {
      const base64 = await fetchImageAsBase64(googleUrl, TIMEOUT_MS);
      if (base64 && base64.length > 500) {
        store.cacheFavicon(domain, base64);
        return base64;
      }
      store.markAsFailed(domain);
      return null;
    } finally {
      pendingRequests.delete(domain);
    }
  })();
  pendingRequests.set(domain, request);
  return request;
}

/**
 * 获取图片并转换为base64
 */
async function fetchImageAsBase64(url: string, timeoutMs: number): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // 允许跨域

    const timer = setTimeout(() => {
      resolve(null);
    }, timeoutMs);

    img.onload = () => {
      clearTimeout(timer);
      try {
        // 使用canvas转换为base64
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL('image/png');
        resolve(base64);
      } catch {
        // canvas转换失败（可能是跨域问题）
        resolve(null);
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };

    img.src = url;
  });
}
