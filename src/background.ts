/**
 * Background Service Worker
 * 支持 Chrome 和 Firefox
 * 处理后台任务和事件监听
 */

import { BrowserAPI } from './utils/browserAPI';
import WebDAVService, { type WebDAVConfig } from './services/webdavService';
import GitHubSyncService, { type GitHubConfig } from './services/githubSyncService';
import type { SyncData } from './types/sync';

// 监听扩展安装
BrowserAPI.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
  } else if (details.reason === 'update') {
    console.log('Extension updated');
  }
});

// 监听来自内容脚本或 popup 的消息
BrowserAPI.runtime.onMessage.addListener((
  request: unknown,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void
) => {
  console.log('[Background] Message received:', request);

  // 确保 request 是对象
  if (!request || typeof request !== 'object') {
    console.log('[Background] Invalid request format');
    return;
  }

  const msg = request as Record<string, unknown>;
  console.log('[Background] Message type:', msg.type);

  if (msg.type === 'webdav:testConnection') {
    console.log('[Background] Handling webdav:testConnection');
    (async () => {
      try {
        const result = await WebDAVService.testConnection(msg.config as WebDAVConfig);
        console.log('[Background] WebDAV testConnection result:', result);
        sendResponse(result);
      } catch (error) {
        console.error('[Background] WebDAV testConnection error:', error);
        sendResponse({ success: false, message: error instanceof Error ? error.message : 'Unknown error' });
      }
    })();
    return true; // 异步响应
  }

  if (msg.type === 'webdav:uploadData') {
    console.log('[Background] Handling webdav:uploadData');
    (async () => {
      try {
        const result = await WebDAVService.uploadData(msg.config as WebDAVConfig, msg.data as SyncData);
        console.log('[Background] WebDAV uploadData result:', result);
        sendResponse(result);
      } catch (error) {
        console.error('[Background] WebDAV uploadData error:', error);
        sendResponse({ success: false, message: error instanceof Error ? error.message : 'Unknown error' });
      }
    })();
    return true;
  }

  if (msg.type === 'webdav:downloadData') {
    console.log('[Background] Handling webdav:downloadData');
    (async () => {
      try {
        const result = await WebDAVService.downloadData(msg.config as WebDAVConfig);
        console.log('[Background] WebDAV downloadData result:', result);
        sendResponse(result);
      } catch (error) {
        console.error('[Background] WebDAV downloadData error:', error);
        sendResponse({ success: false, data: undefined, message: error instanceof Error ? error.message : 'Unknown error' });
      }
    })();
    return true;
  }

  if (msg.type === 'github:testConnection') {
    console.log('[Background] Handling github:testConnection');
    (async () => {
      try {
        const result = await GitHubSyncService.testConnection(msg.token as string);
        console.log('[Background] GitHub testConnection result:', result);
        sendResponse(result);
      } catch (error) {
        console.error('[Background] GitHub testConnection error:', error);
        sendResponse({ success: false, message: error instanceof Error ? error.message : 'Unknown error' });
      }
    })();
    return true;
  }

  if (msg.type === 'github:uploadData') {
    console.log('[Background] Handling github:uploadData');
    (async () => {
      try {
        const result = await GitHubSyncService.uploadData(msg.config as GitHubConfig, msg.data as SyncData);
        console.log('[Background] GitHub uploadData result:', result);
        sendResponse(result);
      } catch (error) {
        console.error('[Background] GitHub uploadData error:', error);
        sendResponse({ success: false, message: error instanceof Error ? error.message : 'Unknown error' });
      }
    })();
    return true;
  }

  if (msg.type === 'github:downloadData') {
    console.log('[Background] Handling github:downloadData');
    (async () => {
      try {
        const result = await GitHubSyncService.downloadData(msg.config as GitHubConfig);
        console.log('[Background] GitHub downloadData result:', result);
        sendResponse(result);
      } catch (error) {
        console.error('[Background] GitHub downloadData error:', error);
        sendResponse({ success: false, data: undefined, message: error instanceof Error ? error.message : 'Unknown error' });
      }
    })();
    return true;
  }

  console.log('Message received:', request);
  sendResponse({ status: 'success' });
});

export {};
