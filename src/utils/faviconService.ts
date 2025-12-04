import { useFaviconStore } from '../stores/useFaviconStore';
import { isOnline, extractDomain } from './networkUtils';

/**
 * Favicon获取服务
 * 使用多级回退机制确保高成功率和快速响应
 *
 * 优先级：
 * 1. 缓存 → 直接返回
 * 2. 失败过多 → 放弃，返回null
 * 3. 网络离线 → 放弃，返回null
 * 4. 尝试 Google Favicon (1秒超时)
 * 5. 尝试 DuckDuckGo Favicon (1秒超时)
 * 6. 失败 → 记录失败，返回null
 */

interface FaviconService {
  getFavicon: (bookmarkUrl: string) => Promise<string | null>;
}

const TIMEOUT_MS = 1000; // 单个请求超时
const MAX_RETRIES = 3; // 最多失败3次后放弃

/**
 * 获取Favicon的主函数
 * @param bookmarkUrl 书签的完整URL
 * @returns favicon 的 data URL，失败返回 null
 */
export async function getFavicon(bookmarkUrl: string): Promise<string | null> {
  const domain = extractDomain(bookmarkUrl);
  const store = useFaviconStore();

  console.log(`[Favicon] Fetching for domain: ${domain}`);

  // 1️⃣ 检查缓存
  const cached = store.getCachedFavicon(domain);
  if (cached) {
    console.log(`[Favicon] Found in cache: ${domain}`);
    return cached;
  }

  // 2️⃣ 检查失败记录
  if (!store.shouldRetry(domain, MAX_RETRIES)) {
    console.log(
      `[Favicon] Exceeded max failures (${MAX_RETRIES}) for domain: ${domain}`
    );
    return null;
  }

  // 3️⃣ 检查网络连接
  if (!isOnline()) {
    console.log(`[Favicon] Network offline for domain: ${domain}`);
    return null;
  }

  // 4️⃣ 尝试 Google Favicon
  try {
    const googleUrl = await fetchFaviconWithTimeout(
      `https://www.google.com/s2/favicons?sz=64&domain=${domain}`,
      TIMEOUT_MS
    );
    console.log(`[Favicon] Got from Google for domain: ${domain}`);
    store.cacheFavicon(domain, googleUrl);
    return googleUrl;
  } catch (error) {
    console.warn(`[Favicon] Google failed for ${domain}:`, error);
  }

  // 5️⃣ 尝试 DuckDuckGo Favicon
  try {
    const ddgUrl = await fetchFaviconWithTimeout(
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      TIMEOUT_MS
    );
    console.log(`[Favicon] Got from DuckDuckGo for domain: ${domain}`);
    store.cacheFavicon(domain, ddgUrl);
    return ddgUrl;
  } catch (error) {
    console.warn(`[Favicon] DuckDuckGo failed for ${domain}:`, error);
  }

  // 6️⃣ 全部失败，记录并返回null
  console.log(`[Favicon] All methods failed for domain: ${domain}`);
  store.recordFailure(domain);
  return null;
}

/**
 * 使用超时机制获取favicon
 * 返回图片的 data URL
 *
 * @param url favicon的URL
 * @param timeoutMs 超时毫秒数
 * @returns data URL
 */
async function fetchFaviconWithTimeout(
  url: string,
  timeoutMs: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    fetch(url, {
      signal: controller.signal,
      mode: 'no-cors', // 允许跨域
    })
      .then((response) => {
        clearTimeout(timeoutId);
        return response.blob();
      })
      .then((blob) => {
        if (!blob) {
          reject(new Error('Empty response'));
          return;
        }
        // 转换为 data URL
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          reject(new Error('Failed to read blob'));
        };
        reader.readAsDataURL(blob);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

export const faviconService: FaviconService = {
  getFavicon,
};
