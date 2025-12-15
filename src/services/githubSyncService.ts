/**
 * GitHub Gist 同步服务
 * 使用 Personal Access Token 存储和同步数据
 */

import type { SyncData } from '../types/sync';

export interface GitHubConfig {
  token: string;
  gistId?: string; // 如果为空，会自动创建新的 Gist
}

const GIST_FILENAME = 'cleartab-sync.json';
const GIST_DESCRIPTION = 'Cleartab sync data backup';

class GitHubSyncService {
  /**
   * 测试 GitHub 连接和权限
   * 先检测 gist 接口（只需要 gist scope），再尝试获取用户信息（可选，需要 read:user）
   */
  static async testConnection(token: string): Promise<{ success: boolean; message: string }> {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    };

    try {
      const gistResponse = await fetch('https://api.github.com/gists?per_page=1', { headers });

      if (gistResponse.status === 200) {
        let message = 'Token valid';

        // 尝试获取用户名（如果缺少 read:user scope 会失败，但不影响整体结果）
        try {
          const userResponse = await fetch('https://api.github.com/user', { headers });
          if (userResponse.status === 200) {
            const data = await userResponse.json() as { login?: string };
            if (data?.login) {
              message = `Connected as @${data.login}`;
            }
          }
        } catch (optionalError) {
          console.warn('[GitHubSyncService] Optional user info fetch failed:', optionalError);
        }

        return { success: true, message };
      } else if (gistResponse.status === 401) {
        return { success: false, message: 'Invalid token' };
      } else if (gistResponse.status === 403) {
        return { success: false, message: 'Token missing gist scope' };
      } else {
        return { success: false, message: `Error: ${gistResponse.status}` };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: errorMessage };
    }
  }

  /**
   * 创建新的 Gist
   */
  static async createGist(token: string, data: SyncData): Promise<{ success: boolean; gistId?: string; message: string }> {
    try {
      const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: GIST_DESCRIPTION,
          public: false,
          files: {
            [GIST_FILENAME]: {
              content: JSON.stringify(data, null, 2),
            },
          },
        }),
      });

      if (response.status === 201) {
        const gist = await response.json() as { id: string };
        return { success: true, gistId: gist.id, message: 'Gist created' };
      } else if (response.status === 401) {
        return { success: false, message: 'Invalid token' };
      } else {
        return { success: false, message: `Error: ${response.status}` };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: errorMessage };
    }
  }

  /**
   * 上传数据到 Gist
   */
  static async uploadData(config: GitHubConfig, data: SyncData): Promise<{ success: boolean; gistId?: string; message: string }> {
    try {
      // 如果没有 gistId，先创建一个新的 Gist
      if (!config.gistId) {
        return this.createGist(config.token, data);
      }

      // 更新现有的 Gist
      const response = await fetch(`https://api.github.com/gists/${config.gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: {
            [GIST_FILENAME]: {
              content: JSON.stringify(data, null, 2),
            },
          },
        }),
      });

      if (response.status === 200) {
        return { success: true, gistId: config.gistId, message: 'Upload successful' };
      } else if (response.status === 401) {
        return { success: false, message: 'Invalid token' };
      } else if (response.status === 404) {
        // Gist 不存在，创建新的
        return this.createGist(config.token, data);
      } else {
        return { success: false, message: `Error: ${response.status}` };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: errorMessage };
    }
  }

  /**
   * 从 Gist 下载数据
   */
  static async downloadData(config: GitHubConfig): Promise<{ success: boolean; data?: SyncData; message: string }> {
    try {
      if (!config.gistId) {
        return { success: false, message: 'No Gist ID configured' };
      }

      const response = await fetch(`https://api.github.com/gists/${config.gistId}`, {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (response.status === 200) {
        const gist = await response.json() as { files: Record<string, { content: string }> };
        const file = gist.files[GIST_FILENAME];

        if (!file) {
          return { success: false, message: 'Sync file not found in Gist' };
        }

        try {
          const data = JSON.parse(file.content) as SyncData;
          return { success: true, data, message: 'Download successful' };
        } catch {
          return { success: false, message: 'Invalid JSON data in Gist' };
        }
      } else if (response.status === 401) {
        return { success: false, message: 'Invalid token' };
      } else if (response.status === 404) {
        return { success: false, message: 'Gist not found' };
      } else {
        return { success: false, message: `Error: ${response.status}` };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: errorMessage };
    }
  }

  /**
   * 检查配置是否完整
   */
  static isConfigComplete(config: Partial<GitHubConfig>): config is GitHubConfig {
    return !!(config.token && config.token.trim());
  }
}

export default GitHubSyncService;
