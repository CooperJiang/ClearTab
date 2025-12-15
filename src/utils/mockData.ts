import type { Bookmark, QuickLink } from '../types';
import { generateId } from './helpers';

// 示例书签数据
export const MOCK_BOOKMARKS: Bookmark[] = [
  // 开发类
  { id: generateId(), title: 'GitHub', url: 'https://github.com', color: '#333333', categoryId: 'dev', createdAt: Date.now(), visitCount: 15 },
  { id: generateId(), title: 'Stack Overflow', url: 'https://stackoverflow.com', color: '#f48024', categoryId: 'dev', createdAt: Date.now(), visitCount: 12 },
  { id: generateId(), title: 'MDN Web Docs', url: 'https://developer.mozilla.org', color: '#000000', categoryId: 'dev', createdAt: Date.now(), visitCount: 8 },
  { id: generateId(), title: 'VS Code', url: 'https://code.visualstudio.com', color: '#007acc', categoryId: 'dev', createdAt: Date.now(), visitCount: 5 },
  { id: generateId(), title: 'npm', url: 'https://www.npmjs.com', color: '#cb3837', categoryId: 'dev', createdAt: Date.now(), visitCount: 10 },
  { id: generateId(), title: 'TypeScript', url: 'https://www.typescriptlang.org', color: '#3178c6', categoryId: 'dev', createdAt: Date.now(), visitCount: 7 },
  { id: generateId(), title: 'React', url: 'https://react.dev', color: '#61dafb', categoryId: 'dev', createdAt: Date.now(), visitCount: 20 },
  { id: generateId(), title: 'Vite', url: 'https://vitejs.dev', color: '#646cff', categoryId: 'dev', createdAt: Date.now(), visitCount: 6 },
  { id: generateId(), title: 'Next.js', url: 'https://nextjs.org', color: '#000000', categoryId: 'dev', createdAt: Date.now(), visitCount: 9 },
  { id: generateId(), title: 'Tailwind CSS', url: 'https://tailwindcss.com', color: '#06b6d4', categoryId: 'dev', createdAt: Date.now(), visitCount: 11 },
  { id: generateId(), title: 'Vue.js', url: 'https://vuejs.org', color: '#42b883', categoryId: 'dev', createdAt: Date.now(), visitCount: 4 },
  { id: generateId(), title: 'Node.js', url: 'https://nodejs.org', color: '#339933', categoryId: 'dev', createdAt: Date.now(), visitCount: 8 },
  { id: generateId(), title: 'Docker Hub', url: 'https://hub.docker.com', color: '#2496ed', categoryId: 'dev', createdAt: Date.now(), visitCount: 3 },
  { id: generateId(), title: 'Vercel', url: 'https://vercel.com', color: '#000000', categoryId: 'dev', createdAt: Date.now(), visitCount: 5 },

  // 设计类
  { id: generateId(), title: 'Figma', url: 'https://www.figma.com', color: '#f24e1e', categoryId: 'design', createdAt: Date.now(), visitCount: 18 },
  { id: generateId(), title: 'Dribbble', url: 'https://dribbble.com', color: '#ea4c89', categoryId: 'design', createdAt: Date.now(), visitCount: 7 },
  { id: generateId(), title: 'Behance', url: 'https://www.behance.net', color: '#1769ff', categoryId: 'design', createdAt: Date.now(), visitCount: 5 },
  { id: generateId(), title: 'Unsplash', url: 'https://unsplash.com', color: '#000000', categoryId: 'design', createdAt: Date.now(), visitCount: 12 },
  { id: generateId(), title: 'Pinterest', url: 'https://www.pinterest.com', color: '#e60023', categoryId: 'design', createdAt: Date.now(), visitCount: 6 },
  { id: generateId(), title: 'Coolors', url: 'https://coolors.co', color: '#0066ff', categoryId: 'design', createdAt: Date.now(), visitCount: 4 },
  { id: generateId(), title: 'Pexels', url: 'https://www.pexels.com', color: '#05a081', categoryId: 'design', createdAt: Date.now(), visitCount: 8 },
  { id: generateId(), title: 'Iconify', url: 'https://iconify.design', color: '#1769aa', categoryId: 'design', createdAt: Date.now(), visitCount: 9 },
  { id: generateId(), title: 'Font Awesome', url: 'https://fontawesome.com', color: '#528dd7', categoryId: 'design', createdAt: Date.now(), visitCount: 3 },
  { id: generateId(), title: 'Adobe Color', url: 'https://color.adobe.com', color: '#ff0000', categoryId: 'design', createdAt: Date.now(), visitCount: 2 },

  // 学习类
  { id: generateId(), title: '掘金', url: 'https://juejin.cn', color: '#1e80ff', categoryId: 'learn', createdAt: Date.now(), visitCount: 25 },
  { id: generateId(), title: '知乎', url: 'https://www.zhihu.com', color: '#0084ff', categoryId: 'learn', createdAt: Date.now(), visitCount: 15 },
  { id: generateId(), title: 'Medium', url: 'https://medium.com', color: '#000000', categoryId: 'learn', createdAt: Date.now(), visitCount: 8 },
  { id: generateId(), title: 'Coursera', url: 'https://www.coursera.org', color: '#0056d2', categoryId: 'learn', createdAt: Date.now(), visitCount: 4 },
  { id: generateId(), title: 'LeetCode', url: 'https://leetcode.cn', color: '#ffa116', categoryId: 'learn', createdAt: Date.now(), visitCount: 30 },
  { id: generateId(), title: '慕课网', url: 'https://www.imooc.com', color: '#f01414', categoryId: 'learn', createdAt: Date.now(), visitCount: 6 },
  { id: generateId(), title: 'freeCodeCamp', url: 'https://www.freecodecamp.org', color: '#0a0a23', categoryId: 'learn', createdAt: Date.now(), visitCount: 5 },
  { id: generateId(), title: 'Dev.to', url: 'https://dev.to', color: '#0a0a0a', categoryId: 'learn', createdAt: Date.now(), visitCount: 7 },
  { id: generateId(), title: 'CSS-Tricks', url: 'https://css-tricks.com', color: '#ff7a59', categoryId: 'learn', createdAt: Date.now(), visitCount: 9 },
  { id: generateId(), title: 'Udemy', url: 'https://www.udemy.com', color: '#a435f0', categoryId: 'learn', createdAt: Date.now(), visitCount: 3 },

  // 工具类
  { id: generateId(), title: 'Google 翻译', url: 'https://translate.google.com', color: '#4285f4', categoryId: 'tools', createdAt: Date.now(), visitCount: 20 },
  { id: generateId(), title: 'Notion', url: 'https://www.notion.so', color: '#000000', categoryId: 'tools', createdAt: Date.now(), visitCount: 35 },
  { id: generateId(), title: 'Trello', url: 'https://trello.com', color: '#0052cc', categoryId: 'tools', createdAt: Date.now(), visitCount: 8 },
  { id: generateId(), title: 'Canva', url: 'https://www.canva.com', color: '#00c4cc', categoryId: 'tools', createdAt: Date.now(), visitCount: 12 },
  { id: generateId(), title: 'JSON Editor', url: 'https://jsoneditoronline.org', color: '#3883fa', categoryId: 'tools', createdAt: Date.now(), visitCount: 6 },
  { id: generateId(), title: 'Regex101', url: 'https://regex101.com', color: '#06b6d4', categoryId: 'tools', createdAt: Date.now(), visitCount: 4 },
  { id: generateId(), title: 'TinyPNG', url: 'https://tinypng.com', color: '#8cc63e', categoryId: 'tools', createdAt: Date.now(), visitCount: 10 },
  { id: generateId(), title: 'Remove.bg', url: 'https://www.remove.bg', color: '#1877f2', categoryId: 'tools', createdAt: Date.now(), visitCount: 5 },
  { id: generateId(), title: 'Carbon', url: 'https://carbon.now.sh', color: '#f8f8f8', categoryId: 'tools', createdAt: Date.now(), visitCount: 7 },
  { id: generateId(), title: 'Excalidraw', url: 'https://excalidraw.com', color: '#6965db', categoryId: 'tools', createdAt: Date.now(), visitCount: 9 },

  // 娱乐类
  { id: generateId(), title: 'YouTube', url: 'https://www.youtube.com', color: '#ff0000', categoryId: 'entertainment', createdAt: Date.now(), visitCount: 50 },
  { id: generateId(), title: 'Bilibili', url: 'https://www.bilibili.com', color: '#00a1d6', categoryId: 'entertainment', createdAt: Date.now(), visitCount: 45 },
  { id: generateId(), title: 'Netflix', url: 'https://www.netflix.com', color: '#e50914', categoryId: 'entertainment', createdAt: Date.now(), visitCount: 15 },
  { id: generateId(), title: 'Spotify', url: 'https://www.spotify.com', color: '#1db954', categoryId: 'entertainment', createdAt: Date.now(), visitCount: 20 },
  { id: generateId(), title: '网易云音乐', url: 'https://music.163.com', color: '#c20c0c', categoryId: 'entertainment', createdAt: Date.now(), visitCount: 18 },
  { id: generateId(), title: 'Twitch', url: 'https://www.twitch.tv', color: '#9146ff', categoryId: 'entertainment', createdAt: Date.now(), visitCount: 8 },
  { id: generateId(), title: '抖音', url: 'https://www.douyin.com', color: '#000000', categoryId: 'entertainment', createdAt: Date.now(), visitCount: 12 },
  { id: generateId(), title: '豆瓣', url: 'https://www.douban.com', color: '#007722', categoryId: 'entertainment', createdAt: Date.now(), visitCount: 6 },
  { id: generateId(), title: 'Steam', url: 'https://store.steampowered.com', color: '#1b2838', categoryId: 'entertainment', createdAt: Date.now(), visitCount: 10 },

  // 资讯类
  { id: generateId(), title: 'Hacker News', url: 'https://news.ycombinator.com', color: '#ff6600', categoryId: 'news', createdAt: Date.now(), visitCount: 22 },
  { id: generateId(), title: 'TechCrunch', url: 'https://techcrunch.com', color: '#0a9e01', categoryId: 'news', createdAt: Date.now(), visitCount: 8 },
  { id: generateId(), title: 'The Verge', url: 'https://www.theverge.com', color: '#e5127d', categoryId: 'news', createdAt: Date.now(), visitCount: 6 },
  { id: generateId(), title: '36氪', url: 'https://36kr.com', color: '#0478e5', categoryId: 'news', createdAt: Date.now(), visitCount: 15 },
  { id: generateId(), title: '少数派', url: 'https://sspai.com', color: '#da2828', categoryId: 'news', createdAt: Date.now(), visitCount: 18 },
  { id: generateId(), title: 'Product Hunt', url: 'https://www.producthunt.com', color: '#da552f', categoryId: 'news', createdAt: Date.now(), visitCount: 10 },
  { id: generateId(), title: 'Wired', url: 'https://www.wired.com', color: '#000000', categoryId: 'news', createdAt: Date.now(), visitCount: 4 },
  { id: generateId(), title: 'Ars Technica', url: 'https://arstechnica.com', color: '#ff4e00', categoryId: 'news', createdAt: Date.now(), visitCount: 5 },
  { id: generateId(), title: 'InfoQ', url: 'https://www.infoq.cn', color: '#007bff', categoryId: 'news', createdAt: Date.now(), visitCount: 7 },

  // AI 类
  { id: generateId(), title: 'ChatGPT', url: 'https://chat.openai.com', color: '#10a37f', categoryId: 'ai', createdAt: Date.now(), visitCount: 100 },
  { id: generateId(), title: 'Claude', url: 'https://claude.ai', color: '#d97706', categoryId: 'ai', createdAt: Date.now(), visitCount: 85 },
  { id: generateId(), title: 'Midjourney', url: 'https://www.midjourney.com', color: '#000000', categoryId: 'ai', createdAt: Date.now(), visitCount: 40 },
  { id: generateId(), title: 'Stable Diffusion', url: 'https://stability.ai', color: '#7c3aed', categoryId: 'ai', createdAt: Date.now(), visitCount: 25 },
  { id: generateId(), title: 'Hugging Face', url: 'https://huggingface.co', color: '#ffcc00', categoryId: 'ai', createdAt: Date.now(), visitCount: 30 },
  { id: generateId(), title: 'Perplexity', url: 'https://www.perplexity.ai', color: '#20b2aa', categoryId: 'ai', createdAt: Date.now(), visitCount: 45 },
  { id: generateId(), title: 'Poe', url: 'https://poe.com', color: '#7b68ee', categoryId: 'ai', createdAt: Date.now(), visitCount: 20 },
  { id: generateId(), title: 'Gemini', url: 'https://gemini.google.com', color: '#4285f4', categoryId: 'ai', createdAt: Date.now(), visitCount: 35 },
  { id: generateId(), title: '文心一言', url: 'https://yiyan.baidu.com', color: '#2932e1', categoryId: 'ai', createdAt: Date.now(), visitCount: 28 },
  { id: generateId(), title: '通义千问', url: 'https://tongyi.aliyun.com', color: '#ff6a00', categoryId: 'ai', createdAt: Date.now(), visitCount: 22 },
  { id: generateId(), title: 'Cursor', url: 'https://cursor.sh', color: '#000000', categoryId: 'ai', createdAt: Date.now(), visitCount: 50 },
  { id: generateId(), title: 'v0.dev', url: 'https://v0.dev', color: '#000000', categoryId: 'ai', createdAt: Date.now(), visitCount: 38 },

  // 社交类
  { id: generateId(), title: 'Twitter / X', url: 'https://twitter.com', color: '#000000', categoryId: 'social', createdAt: Date.now(), visitCount: 60 },
  { id: generateId(), title: '微博', url: 'https://weibo.com', color: '#e6162d', categoryId: 'social', createdAt: Date.now(), visitCount: 35 },
  { id: generateId(), title: '小红书', url: 'https://www.xiaohongshu.com', color: '#fe2c55', categoryId: 'social', createdAt: Date.now(), visitCount: 40 },
  { id: generateId(), title: 'Instagram', url: 'https://www.instagram.com', color: '#e4405f', categoryId: 'social', createdAt: Date.now(), visitCount: 30 },
  { id: generateId(), title: 'Facebook', url: 'https://www.facebook.com', color: '#1877f2', categoryId: 'social', createdAt: Date.now(), visitCount: 15 },
  { id: generateId(), title: 'LinkedIn', url: 'https://www.linkedin.com', color: '#0a66c2', categoryId: 'social', createdAt: Date.now(), visitCount: 25 },
  { id: generateId(), title: 'Discord', url: 'https://discord.com', color: '#5865f2', categoryId: 'social', createdAt: Date.now(), visitCount: 45 },
  { id: generateId(), title: 'Telegram', url: 'https://web.telegram.org', color: '#26a5e4', categoryId: 'social', createdAt: Date.now(), visitCount: 20 },
  { id: generateId(), title: 'Reddit', url: 'https://www.reddit.com', color: '#ff4500', categoryId: 'social', createdAt: Date.now(), visitCount: 28 },
  { id: generateId(), title: 'V2EX', url: 'https://www.v2ex.com', color: '#333333', categoryId: 'social', createdAt: Date.now(), visitCount: 32 },

  // 购物类
  { id: generateId(), title: '淘宝', url: 'https://www.taobao.com', color: '#ff5000', categoryId: 'shopping', createdAt: Date.now(), visitCount: 50 },
  { id: generateId(), title: '京东', url: 'https://www.jd.com', color: '#e1251b', categoryId: 'shopping', createdAt: Date.now(), visitCount: 45 },
  { id: generateId(), title: '拼多多', url: 'https://www.pinduoduo.com', color: '#e02e24', categoryId: 'shopping', createdAt: Date.now(), visitCount: 20 },
  { id: generateId(), title: '天猫', url: 'https://www.tmall.com', color: '#ff0036', categoryId: 'shopping', createdAt: Date.now(), visitCount: 35 },
  { id: generateId(), title: 'Amazon', url: 'https://www.amazon.com', color: '#ff9900', categoryId: 'shopping', createdAt: Date.now(), visitCount: 30 },
  { id: generateId(), title: '当当', url: 'https://www.dangdang.com', color: '#e4393c', categoryId: 'shopping', createdAt: Date.now(), visitCount: 10 },
  { id: generateId(), title: '唱片网', url: 'https://www.smzdm.com', color: '#e02e24', categoryId: 'shopping', createdAt: Date.now(), visitCount: 28 },
  { id: generateId(), title: '网易严选', url: 'https://you.163.com', color: '#d43c33', categoryId: 'shopping', createdAt: Date.now(), visitCount: 15 },

  // 金融类
  { id: generateId(), title: '支付宝', url: 'https://www.alipay.com', color: '#1677ff', categoryId: 'finance', createdAt: Date.now(), visitCount: 40 },
  { id: generateId(), title: '雪球', url: 'https://xueqiu.com', color: '#1da1f2', categoryId: 'finance', createdAt: Date.now(), visitCount: 35 },
  { id: generateId(), title: '东方财富', url: 'https://www.eastmoney.com', color: '#e41f19', categoryId: 'finance', createdAt: Date.now(), visitCount: 25 },
  { id: generateId(), title: '同花顺', url: 'https://www.10jqka.com.cn', color: '#e60012', categoryId: 'finance', createdAt: Date.now(), visitCount: 20 },
  { id: generateId(), title: 'Yahoo Finance', url: 'https://finance.yahoo.com', color: '#6001d2', categoryId: 'finance', createdAt: Date.now(), visitCount: 18 },
  { id: generateId(), title: 'TradingView', url: 'https://www.tradingview.com', color: '#2962ff', categoryId: 'finance', createdAt: Date.now(), visitCount: 30 },
  { id: generateId(), title: 'CoinMarketCap', url: 'https://coinmarketcap.com', color: '#3861fb', categoryId: 'finance', createdAt: Date.now(), visitCount: 22 },
  { id: generateId(), title: 'Binance', url: 'https://www.binance.com', color: '#f0b90b', categoryId: 'finance', createdAt: Date.now(), visitCount: 28 },

  // 阅读类
  { id: generateId(), title: '微信读书', url: 'https://weread.qq.com', color: '#1aad19', categoryId: 'reading', createdAt: Date.now(), visitCount: 45 },
  { id: generateId(), title: 'Kindle', url: 'https://read.amazon.com', color: '#ff9900', categoryId: 'reading', createdAt: Date.now(), visitCount: 20 },
  { id: generateId(), title: '豆瓣读书', url: 'https://book.douban.com', color: '#007722', categoryId: 'reading', createdAt: Date.now(), visitCount: 30 },
  { id: generateId(), title: 'Goodreads', url: 'https://www.goodreads.com', color: '#553b08', categoryId: 'reading', createdAt: Date.now(), visitCount: 15 },
  { id: generateId(), title: '起点读书', url: 'https://www.qidian.com', color: '#e4393c', categoryId: 'reading', createdAt: Date.now(), visitCount: 25 },
  { id: generateId(), title: '番茄小说', url: 'https://www.fqnovel.com', color: '#ff6633', categoryId: 'reading', createdAt: Date.now(), visitCount: 18 },
  { id: generateId(), title: '多看阅读', url: 'https://www.duokan.com', color: '#4a9ef8', categoryId: 'reading', createdAt: Date.now(), visitCount: 12 },
  { id: generateId(), title: 'Z-Library', url: 'https://z-lib.org', color: '#e74c3c', categoryId: 'reading', createdAt: Date.now(), visitCount: 35 },
];

// 示例快捷访问
export const MOCK_QUICKLINKS: QuickLink[] = [
  { id: generateId(), title: 'GitHub', url: 'https://github.com', color: '#333333', order: 0 },
  { id: generateId(), title: 'Google', url: 'https://www.google.com', color: '#4285f4', order: 1 },
  { id: generateId(), title: 'ChatGPT', url: 'https://chat.openai.com', color: '#10a37f', order: 2 },
  { id: generateId(), title: 'Notion', url: 'https://www.notion.so', color: '#000000', order: 3 },
  { id: generateId(), title: 'YouTube', url: 'https://www.youtube.com', color: '#ff0000', order: 4 },
  { id: generateId(), title: 'Twitter', url: 'https://twitter.com', color: '#1da1f2', order: 5 },
  { id: generateId(), title: 'Figma', url: 'https://www.figma.com', color: '#f24e1e', order: 6 },
  { id: generateId(), title: 'Bilibili', url: 'https://www.bilibili.com', color: '#00a1d6', order: 7 },
];
