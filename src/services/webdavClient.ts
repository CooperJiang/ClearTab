/**
 * WebDAV 客户端
 * 在扩展环境下通过 chrome.runtime.sendMessage 与 background worker 通信
 * 在开发环境下直接调用 WebDAVService
 */

import type { Bookmark, Category, CustomRecentVisit, QuickLink } from '../types';
import type { SyncData } from '../types/sync';
import type { WebDAVConfig, WebDAVResponse } from './webdavService';
import WebDAVService from './webdavService';

const MESSAGE_TIMEOUT = 15_000;

export interface WebDAVResult {
  success: boolean;
  message: string;
  data?: SyncData;
  recoverable?: boolean;
  channel?: 'direct' | 'background';
}

/**
 * 检测是否在扩展环境中运行
 */
function isExtensionEnvironment(): boolean {
  return typeof chrome !== 'undefined' &&
         chrome.runtime &&
         typeof chrome.runtime.sendMessage === 'function' &&
         typeof chrome.runtime.id === 'string';
}

class WebDAVClient {
  private static async sendMessageToBackground<T extends WebDAVResult>(
    message: Record<string, unknown>
  ): Promise<T> {
    return new Promise((resolve) => {
      let settled = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const finish = (result: T) => {
        if (settled) return;
        settled = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        resolve({ ...result, channel: 'background' } as T);
      };

      timeoutId = setTimeout(() => {
        finish({ success: false, message: 'Background request timed out', recoverable: true } as T);
      }, MESSAGE_TIMEOUT);

      try {
        console.log('[WebDAVClient] Sending message to background worker:', message);
        chrome.runtime.sendMessage(message, (response) => {
          if (settled) {
            return;
          }

          const lastError = chrome.runtime.lastError;
          if (lastError) {
            finish({
              success: false,
              message: lastError.message || 'Unknown error',
              recoverable: true,
            } as T);
            return;
          }

          if (!response) {
            finish({ success: false, message: 'No response from background worker', recoverable: true } as T);
            return;
          }

          console.log('[WebDAVClient] Received response from background worker');
          finish(response as T);
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        finish({ success: false, message: errorMessage, recoverable: true } as T);
      }
    });
  }

  private static async executeRequest<T extends WebDAVResult>(
    message: Record<string, unknown>,
    directAction: () => Promise<T>
  ): Promise<T> {
    if (!isExtensionEnvironment()) {
      const directResult = await directAction();
      return { ...directResult, channel: 'direct' } as T;
    }

    try {
      console.log('[WebDAVClient] Attempting direct WebDAV request');
      const directResult = await directAction();
      if (directResult.success || !directResult.recoverable) {
        return { ...directResult, channel: 'direct' } as T;
      }
      console.warn('[WebDAVClient] Direct request failed but is recoverable, switching to background worker:', directResult.message);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('[WebDAVClient] Direct request threw an error, switching to background worker:', errorMessage);
    }

    return this.sendMessageToBackground<T>(message);
  }

  /**
   * 测试 WebDAV 连接
   */
  static async testConnection(config: WebDAVConfig): Promise<WebDAVResponse> {
    return this.executeRequest(
      { type: 'webdav:testConnection', config },
      () => WebDAVService.testConnection(config)
    );
  }

  /**
   * 上传数据到 WebDAV
   */
  static async uploadData(config: WebDAVConfig, data: SyncData): Promise<WebDAVResponse> {
    return this.executeRequest(
      { type: 'webdav:uploadData', config, data },
      () => WebDAVService.uploadData(config, data)
    );
  }

  /**
   * 从 WebDAV 下载数据
   */
  static async downloadData(config: WebDAVConfig): Promise<WebDAVResponse> {
    return this.executeRequest(
      { type: 'webdav:downloadData', config },
      () => WebDAVService.downloadData(config)
    );
  }

  /**
   * 创建同步数据对象
   */
  static createSyncData(
    settings: Record<string, unknown>,
    bookmarks: Bookmark[],
    quickLinks: QuickLink[],
    categories: Category[],
    customRecentVisits: CustomRecentVisit[],
    options?: {
      browserBookmarks?: SyncData['browserBookmarks'];
    }
  ): SyncData {
    return {
      version: 2,
      timestamp: Date.now(),
      settings,
      bookmarks,
      quickLinks,
      categories,
      customRecentVisits,
      browserBookmarks: options?.browserBookmarks,
    };
  }

  /**
   * 检查配置是否完整
   */
  static isConfigComplete(config: Partial<WebDAVConfig>): config is WebDAVConfig {
    return !!(config.url && config.username && config.password && config.path);
  }
}

export default WebDAVClient;
