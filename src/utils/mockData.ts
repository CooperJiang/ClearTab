import type { Bookmark, QuickLink } from '../types';
import { generateId, getRandomColor } from './helpers';

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
