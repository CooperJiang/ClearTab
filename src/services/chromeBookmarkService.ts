/**
 * Bookmarks API 服务
 * 支持 Chrome 和 Firefox
 * 提供与浏览器书签 API 的交互接口
 */

import { BrowserAPI, getLastError } from '../utils/browserAPI';

export interface ChromeBookmark {
  id: string;
  parentId?: string;
  title: string;
  url?: string;
  children?: ChromeBookmark[];
  dateAdded?: number;
  dateGroupModified?: number;
}

export interface BookmarkMetadata {
  id: string;
  chromeId: string;
  color?: string;
  tags: string[];
  isPinned: boolean;
  customTitle?: string;
  customOrder: number;
  createdAt: number;
  updatedAt: number;
}

class BookmarkService {
  /**
   * 获取所有书签树
   */
  static async getBookmarks(): Promise<ChromeBookmark[]> {
    return new Promise((resolve, reject) => {
      if (!BrowserAPI?.bookmarks) {
        reject(new Error('Bookmarks API not available'));
        return;
      }

      BrowserAPI.bookmarks.getTree((bookmarkTreeNodes) => {
        if (getLastError()) {
          reject(new Error(getLastError()));
        } else {
          resolve(bookmarkTreeNodes);
        }
      });
    });
  }

  /**
   * 扁平化书签树，去掉分隔符和文件夹，返回只有 URL 的书签
   */
  static async getBookmarksFlat(): Promise<ChromeBookmark[]> {
    const tree = await this.getBookmarks();
    const bookmarks: ChromeBookmark[] = [];

    const traverse = (nodes: ChromeBookmark[]) => {
      for (const node of nodes) {
        // 跳过文件夹（没有 URL）和分隔符
        if (node.url) {
          bookmarks.push(node);
        }
        // 递归遍历子节点
        if (node.children) {
          traverse(node.children);
        }
      }
    };

    traverse(tree);
    return bookmarks;
  }

  /**
   * 获取书签树结构（保留文件夹）
   */
  static async getBookmarksTree(): Promise<ChromeBookmark[]> {
    const tree = await this.getBookmarks();
    // 移除最外层根节点的"Other Bookmarks"等，返回实际的书签结构
    return tree[0]?.children || [];
  }

  /**
   * 添加书签
   */
  static async addBookmark(
    title: string,
    url: string,
    parentId?: string
  ): Promise<ChromeBookmark> {
    return new Promise((resolve, reject) => {
      if (!BrowserAPI?.bookmarks) {
        reject(new Error('Bookmarks API not available'));
        return;
      }

      BrowserAPI.bookmarks.create(
        {
          title,
          url,
          parentId,
        },
        (bookmark) => {
          if (getLastError()) {
            reject(new Error(getLastError()));
          } else {
            resolve(bookmark);
          }
        }
      );
    });
  }

  /**
   * 删除书签
   */
  static async deleteBookmark(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!BrowserAPI?.bookmarks) {
        reject(new Error('Bookmarks API not available'));
        return;
      }

      BrowserAPI.bookmarks.remove(id, () => {
        if (getLastError()) {
          reject(new Error(getLastError()));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 更新书签
   */
  static async updateBookmark(
    id: string,
    changes: { title?: string; url?: string }
  ): Promise<ChromeBookmark> {
    return new Promise((resolve, reject) => {
      if (!BrowserAPI?.bookmarks) {
        reject(new Error('Bookmarks API not available'));
        return;
      }

      BrowserAPI.bookmarks.update(id, changes, (bookmark) => {
        if (getLastError()) {
          reject(new Error(getLastError()));
        } else {
          resolve(bookmark);
        }
      });
    });
  }

  /**
   * 移动书签
   */
  static async moveBookmark(
    id: string,
    parentId: string,
    index?: number
  ): Promise<ChromeBookmark> {
    return new Promise((resolve, reject) => {
      if (!BrowserAPI?.bookmarks) {
        reject(new Error('Bookmarks API not available'));
        return;
      }

      BrowserAPI.bookmarks.move(id, { parentId, index }, (bookmark) => {
        if (getLastError()) {
          reject(new Error(getLastError()));
        } else {
          resolve(bookmark);
        }
      });
    });
  }

  /**
   * 创建文件夹
   */
  static async createFolder(
    title: string,
    parentId?: string
  ): Promise<ChromeBookmark> {
    return new Promise((resolve, reject) => {
      if (!BrowserAPI?.bookmarks) {
        reject(new Error('Bookmarks API not available'));
        return;
      }

      BrowserAPI.bookmarks.create(
        {
          title,
          parentId: parentId || '1', // 默认放在书签栏
        },
        (folder) => {
          if (getLastError()) {
            reject(new Error(getLastError()));
          } else {
            resolve(folder);
          }
        }
      );
    });
  }

  /**
   * 删除文件夹（递归删除）
   */
  static async deleteFolder(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!BrowserAPI?.bookmarks) {
        reject(new Error('Bookmarks API not available'));
        return;
      }

      BrowserAPI.bookmarks.removeTree(id, () => {
        if (getLastError()) {
          reject(new Error(getLastError()));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 获取指定节点的子节点
   */
  static async getChildren(id: string): Promise<ChromeBookmark[]> {
    return new Promise((resolve, reject) => {
      if (!BrowserAPI?.bookmarks) {
        reject(new Error('Bookmarks API not available'));
        return;
      }

      BrowserAPI.bookmarks.getChildren(id, (children) => {
        if (getLastError()) {
          reject(new Error(getLastError()));
        } else {
          resolve(children);
        }
      });
    });
  }

  /**
   * 获取指定节点详情
   */
  static async getBookmark(id: string): Promise<ChromeBookmark> {
    return new Promise((resolve, reject) => {
      if (!BrowserAPI?.bookmarks) {
        reject(new Error('Bookmarks API not available'));
        return;
      }

      BrowserAPI.bookmarks.get(id, (results) => {
        if (getLastError()) {
          reject(new Error(getLastError()));
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  /**
   * 监听书签变化
   */
  static onChanged(
    callback: (changeType: string, id: string, changeInfo: any) => void
  ) {
    if (!BrowserAPI?.bookmarks) return;

    const handlers = {
      onCreated: (id: string, bookmark: ChromeBookmark) => {
        callback('created', id, bookmark);
      },
      onRemoved: (id: string, removeInfo: any) => {
        callback('removed', id, removeInfo);
      },
      onChanged: (id: string, changeInfo: any) => {
        callback('changed', id, changeInfo);
      },
      onMoved: (id: string, moveInfo: any) => {
        callback('moved', id, moveInfo);
      },
    };

    BrowserAPI.bookmarks.onCreated.addListener(handlers.onCreated);
    BrowserAPI.bookmarks.onRemoved.addListener(handlers.onRemoved);
    BrowserAPI.bookmarks.onChanged.addListener(handlers.onChanged);
    BrowserAPI.bookmarks.onMoved.addListener(handlers.onMoved);

    // 返回取消监听的函数
    return () => {
      BrowserAPI.bookmarks.onCreated.removeListener(handlers.onCreated);
      BrowserAPI.bookmarks.onRemoved.removeListener(handlers.onRemoved);
      BrowserAPI.bookmarks.onChanged.removeListener(handlers.onChanged);
      BrowserAPI.bookmarks.onMoved.removeListener(handlers.onMoved);
    };
  }

  /**
   * 检查 Bookmarks API 是否可用
   */
  static isAvailable(): boolean {
    return !!BrowserAPI?.bookmarks;
  }
}

export default BookmarkService;
