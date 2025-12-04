/**
 * Background Service Worker
 * 支持 Chrome 和 Firefox
 * 处理后台任务和事件监听
 */

import { BrowserAPI } from './utils/browserAPI';

// 监听扩展安装
BrowserAPI.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
  } else if (details.reason === 'update') {
    console.log('Extension updated');
  }
});

// 监听来自 content scripts 或 popup 的消息
BrowserAPI.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log('Message received:', request);
  sendResponse({ status: 'success' });
});

export {};
