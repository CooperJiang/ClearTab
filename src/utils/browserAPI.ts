/**
 * 浏览器 API 兼容层
 * 支持 Chrome 和 Firefox
 * 自动检测环境并使用相应的 API
 */

// 定义类型
interface BrowserAPINamespace {
  runtime: typeof chrome.runtime | typeof browser.runtime;
  bookmarks: typeof chrome.bookmarks | typeof browser.bookmarks;
  history: typeof chrome.history | typeof browser.history;
}

/**
 * 检测是否在 Firefox 环境
 */
function isFirefox(): boolean {
  return typeof browser !== 'undefined' && browser !== undefined;
}

/**
 * 获取浏览器 API
 * 优先使用 Firefox API，降级到 Chrome API
 */
export const BrowserAPI: BrowserAPINamespace = {
  runtime: isFirefox()
    ? (browser?.runtime as typeof chrome.runtime)
    : chrome.runtime,
  bookmarks: isFirefox()
    ? (browser?.bookmarks as typeof chrome.bookmarks)
    : chrome.bookmarks,
  history: isFirefox()
    ? (browser?.history as typeof chrome.history)
    : chrome.history,
};

/**
 * 获取最后的错误信息
 * Chrome 和 Firefox 都支持 runtime.lastError
 */
export function getLastError(): string | undefined {
  return BrowserAPI.runtime.lastError?.message;
}

/**
 * 检查浏览器环境
 */
export function getBrowserInfo(): { isFirefox: boolean; isChrome: boolean } {
  return {
    isFirefox: isFirefox(),
    isChrome: !isFirefox(),
  };
}

export default BrowserAPI;
