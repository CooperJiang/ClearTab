/**
 * 网络检测工具
 * 用于检测网络连接是否可用
 */

/**
 * 简单的网络可用性检测
 * 基于 navigator.onLine（不完全可靠）
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * 更可靠的网络连接检测
 * 尝试fetch一个小资源，超时时间可配置
 *
 * @param timeoutMs 超时毫秒数，默认3秒
 * @returns 是否网络可用
 */
export async function checkInternetConnection(timeoutMs = 3000): Promise<boolean> {
  try {
    // 如果离线模式，直接返回false
    if (!navigator.onLine) {
      return false;
    }

    // 尝试fetch一个小的资源（使用HEAD请求更快）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      // HEAD请求如果能到达，说明网络可用（即使返回404也说明网络连接了）
      return true;
    } catch (error) {
      clearTimeout(timeoutId);
      return false;
    }
  } catch {
    return false;
  }
}

/**
 * 提取URL的domain（用作favicon缓存key）
 * @param url 完整的URL
 * @returns domain
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    // 如果URL无效，尝试添加 https://
    try {
      const urlObj = new URL(`https://${url}`);
      return urlObj.hostname;
    } catch {
      return url.replace(/^https?:\/\//, '').split('/')[0];
    }
  }
}
