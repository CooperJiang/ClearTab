/**
 * GitHub 同步客户端
 * 通过 background worker 与 GitHub API 通信
 */

import type { Bookmark, Category, CustomRecentVisit, QuickLink } from '../types';
import type { SyncData } from '../types/sync';
import type { GitHubConfig } from './githubSyncService';
import GitHubSyncService from './githubSyncService';

const MESSAGE_TIMEOUT = 15_000;

export interface GitHubSyncResult {
  success: boolean;
  message: string;
  gistId?: string;
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

class GitHubSyncClient {
  private static async sendMessageToBackground<T extends GitHubSyncResult>(
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
        console.log('[GitHubSyncClient] Sending message to background worker:', message);
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

          console.log('[GitHubSyncClient] Received response from background worker');
          finish(response as T);
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        finish({ success: false, message: errorMessage, recoverable: true } as T);
      }
    });
  }

  private static async executeRequest<T extends GitHubSyncResult>(
    message: Record<string, unknown>,
    directAction: () => Promise<T>
  ): Promise<T> {
    if (!isExtensionEnvironment()) {
      const directResult = await directAction();
      return { ...directResult, channel: 'direct' } as T;
    }

    try {
      console.log('[GitHubSyncClient] Attempting direct GitHub request');
      const directResult = await directAction();
      if (directResult.success || !directResult.recoverable) {
        return { ...directResult, channel: 'direct' } as T;
      }
      console.warn('[GitHubSyncClient] Direct request failed but is recoverable, switching to background worker:', directResult.message);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('[GitHubSyncClient] Direct request threw an error, switching to background worker:', errorMessage);
    }

    return this.sendMessageToBackground<T>(message);
  }

  /**
   * 测试 GitHub 连接
   */
  static async testConnection(token: string): Promise<{ success: boolean; message: string }> {
    const result = await this.executeRequest(
      { type: 'github:testConnection', token },
      () => GitHubSyncService.testConnection(token) as Promise<GitHubSyncResult>
    );
    return { success: result.success, message: result.message };
  }

  /**
   * 上传数据到 GitHub Gist
   */
  static async uploadData(config: GitHubConfig, data: SyncData): Promise<{ success: boolean; gistId?: string; message: string }> {
    const result = await this.executeRequest(
      { type: 'github:uploadData', config, data },
      () => GitHubSyncService.uploadData(config, data) as Promise<GitHubSyncResult>
    );
    return { success: result.success, gistId: result.gistId, message: result.message };
  }

  /**
   * 从 GitHub Gist 下载数据
   */
  static async downloadData(config: GitHubConfig): Promise<{ success: boolean; data?: SyncData; message: string }> {
    const result = await this.executeRequest(
      { type: 'github:downloadData', config },
      () => GitHubSyncService.downloadData(config) as Promise<GitHubSyncResult>
    );
    return { success: result.success, data: result.data, message: result.message };
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
  static isConfigComplete(config: Partial<GitHubConfig>): config is GitHubConfig {
    return !!(config.token && config.token.trim());
  }
}

export default GitHubSyncClient;
