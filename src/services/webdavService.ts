/**
 * WebDAV 同步服务
 * 支持坚果云等 WebDAV 服务
 */

import type { Bookmark, Category, CustomRecentVisit, QuickLink } from '../types';
import type { SyncData } from '../types/sync';

export interface WebDAVConfig {
  url: string;
  username: string;
  password: string;
  path: string;
}

export interface WebDAVResponse {
  success: boolean;
  message: string;
  data?: SyncData;
  recoverable?: boolean;
}

const SYNC_FILE_NAME = 'cleartab-sync.json';
const CURRENT_VERSION = 2;
const DEFAULT_TIMEOUT = 15_000;

class WebDAVService {
  /**
   * 带有超时控制的 fetch
   */
  private static async fetchWithTimeout(
    input: RequestInfo,
    init: RequestInit = {},
    timeout = DEFAULT_TIMEOUT
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * 创建 Basic Auth 头
   */
  private static getAuthHeader(username: string, password: string): string {
    const credentials = btoa(`${username}:${password}`);
    return `Basic ${credentials}`;
  }

  /**
   * 规范化 WebDAV 路径
   */
  private static normalizePath(basePath: string): string {
    let path = basePath.trim();
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    if (!path.endsWith('/')) {
      path = path + '/';
    }
    return path;
  }

  /**
   * 获取完整的文件 URL
   */
  private static getFileUrl(config: WebDAVConfig): string {
    let baseUrl = config.url.trim();
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    const path = this.normalizePath(config.path);
    return `${baseUrl}${path}${SYNC_FILE_NAME}`;
  }

  /**
   * 获取目录 URL
   */
  private static getDirUrl(config: WebDAVConfig): string {
    let baseUrl = config.url.trim();
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    const path = this.normalizePath(config.path);
    return `${baseUrl}${path}`;
  }

  /**
   * 测试 WebDAV 连接
   */
  static async testConnection(config: WebDAVConfig): Promise<WebDAVResponse> {
    try {
      const dirUrl = this.getDirUrl(config);
      const response = await this.fetchWithTimeout(dirUrl, {
        method: 'PROPFIND',
        headers: {
          'Authorization': this.getAuthHeader(config.username, config.password),
          'Depth': '0',
          'Content-Type': 'application/xml',
        },
      });

      if (response.status === 207 || response.status === 200) {
        return { success: true, message: 'Connection successful' };
      } else if (response.status === 401) {
        return { success: false, message: 'Authentication failed' };
      } else if (response.status === 404) {
        // 目录不存在，尝试创建
        const createResult = await this.createDirectory(config);
        if (createResult) {
          return { success: true, message: 'Directory created' };
        }
        return { success: false, message: 'Directory not found and cannot create' };
      } else {
        return { success: false, message: `Error: ${response.status} ${response.statusText}` };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: errorMessage, recoverable: true };
    }
  }

  /**
   * 创建目录
   */
  private static async createDirectory(config: WebDAVConfig): Promise<boolean> {
    try {
      const dirUrl = this.getDirUrl(config);
      const response = await this.fetchWithTimeout(dirUrl, {
        method: 'MKCOL',
        headers: {
          'Authorization': this.getAuthHeader(config.username, config.password),
        },
      });
      return response.status === 201 || response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * 上传数据到 WebDAV
   */
  static async uploadData(config: WebDAVConfig, data: SyncData): Promise<WebDAVResponse> {
    try {
      // 确保目录存在
      await this.createDirectory(config);

      const fileUrl = this.getFileUrl(config);
      const jsonData = JSON.stringify(data, null, 2);

      const response = await this.fetchWithTimeout(fileUrl, {
        method: 'PUT',
        headers: {
          'Authorization': this.getAuthHeader(config.username, config.password),
          'Content-Type': 'application/json',
        },
        body: jsonData,
      });

      if (response.status === 201 || response.status === 200 || response.status === 204) {
        return { success: true, message: 'Upload successful' };
      } else if (response.status === 401) {
        return { success: false, message: 'Authentication failed' };
      } else {
        return { success: false, message: `Error: ${response.status} ${response.statusText}` };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: errorMessage, recoverable: true };
    }
  }

  /**
   * 从 WebDAV 下载数据
   */
  static async downloadData(config: WebDAVConfig): Promise<WebDAVResponse> {
    try {
      const fileUrl = this.getFileUrl(config);

      const response = await this.fetchWithTimeout(fileUrl, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(config.username, config.password),
        },
      });

      if (response.status === 200) {
        const text = await response.text();
        try {
          const data = JSON.parse(text) as SyncData;
          return { success: true, data, message: 'Download successful' };
        } catch {
          return { success: false, message: 'Invalid JSON data' };
        }
      } else if (response.status === 404) {
        return { success: false, message: 'No sync data found' };
      } else if (response.status === 401) {
        return { success: false, message: 'Authentication failed' };
      } else {
        return { success: false, message: `Error: ${response.status} ${response.statusText}` };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: errorMessage, recoverable: true };
    }
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
    browserBookmarks?: SyncData['browserBookmarks']
  ): SyncData {
    return {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      settings,
      bookmarks,
      quickLinks,
      categories,
      customRecentVisits,
      browserBookmarks,
    };
  }

  /**
   * 检查配置是否完整
   */
  static isConfigComplete(config: Partial<WebDAVConfig>): config is WebDAVConfig {
    return !!(config.url && config.username && config.password && config.path);
  }
}

export default WebDAVService;
