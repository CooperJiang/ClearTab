/**
 * History API 服务
 * 支持 Chrome 和 Firefox
 * 用于读取浏览器历史记录
 */

import { BrowserAPI, getLastError } from '../utils/browserAPI';

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  lastVisitTime?: number;
  visitCount?: number;
}

class HistoryService {
  /**
   * 检查 History API 是否可用
   */
  isAvailable(): boolean {
    return BrowserAPI.history !== undefined &&
           typeof BrowserAPI.history.search === 'function';
  }

  /**
   * 获取最近访问的历史记录
   * @param maxResults 最大返回数量，默认 20
   * @param startTime 开始时间，默认为过去 7 天
   */
  async getRecentHistory(maxResults: number = 20, startTime?: number): Promise<HistoryItem[]> {
    if (!this.isAvailable()) {
      console.warn('Chrome History API is not available');
      return [];
    }

    // 默认查询过去 7 天的记录
    const defaultStartTime = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return new Promise((resolve) => {
      BrowserAPI.history.search(
        {
          text: '', // 空字符串匹配所有
          startTime: startTime || defaultStartTime,
          maxResults: maxResults * 2, // 获取更多用于过滤
        },
        (results) => {
          if (getLastError()) {
            console.error('History API error:', getLastError());
            resolve([]);
            return;
          }

          // 过滤和转换结果（并按 URL 去重）
          const seen = new Set<string>();
          const filteredResults = (results || [])
            .filter((item) => {
              // 过滤掉无效的 URL
              if (!item.url) return false;
              // 过滤掉 chrome:// 和 edge:// 等浏览器内部页面
              if (item.url.startsWith('chrome://') ||
                  item.url.startsWith('chrome-extension://') ||
                  item.url.startsWith('edge://') ||
                  item.url.startsWith('about:')) {
                return false;
              }
              // 去重：相同 URL 只保留一条
              if (seen.has(item.url)) {
                return false;
              }
              seen.add(item.url);
              return true;
            })
            .slice(0, maxResults)
            .map((item) => {
              let title = item.title;
              if (!title) {
                try {
                  title = new URL(item.url!).hostname;
                } catch {
                  title = item.url!;
                }
              }
              return {
                id: item.id || `history-${Date.now()}-${Math.random()}`,
                url: item.url!,
                title,
                lastVisitTime: item.lastVisitTime,
                visitCount: item.visitCount,
              };
            });

          resolve(filteredResults);
        }
      );
    });
  }

  /**
   * 搜索历史记录
   * @param query 搜索关键词
   * @param maxResults 最大返回数量
   */
  async searchHistory(query: string, maxResults: number = 20): Promise<HistoryItem[]> {
    if (!this.isAvailable()) {
      console.warn('Chrome History API is not available');
      return [];
    }

    return new Promise((resolve) => {
      BrowserAPI.history.search(
        {
          text: query,
          maxResults,
        },
        (results) => {
          if (getLastError()) {
            console.error('History API error:', getLastError());
            resolve([]);
            return;
          }

          const historyItems = results
            .filter((item) => item.url && item.title)
            .map((item) => ({
              id: item.id || `history-${Date.now()}-${Math.random()}`,
              url: item.url!,
              title: item.title || new URL(item.url!).hostname,
              lastVisitTime: item.lastVisitTime,
              visitCount: item.visitCount,
            }));

          resolve(historyItems);
        }
      );
    });
  }

  /**
   * 获取某个 URL 的访问详情
   * @param url 要查询的 URL
   */
  async getVisits(url: string): Promise<chrome.history.VisitItem[]> {
    if (!this.isAvailable()) {
      return [];
    }

    return new Promise((resolve) => {
      BrowserAPI.history.getVisits({ url }, (visits) => {
        if (getLastError()) {
          console.error('History API error:', getLastError());
          resolve([]);
          return;
        }
        resolve(visits);
      });
    });
  }
}

export default new HistoryService();
