/**
 * 首字母图标生成工具
 * 用于生成优雅的文本logo
 */

/**
 * 生成稳定的颜色（基于文本的hash值）
 * 确保同一文本总是生成同一颜色
 *
 * @param text 输入文本
 * @returns RGB颜色值 (r, g, b)
 */
function generateColorFromText(text: string): [number, number, number] {
  // 预定义的色板（精选颜色，视觉效果好）
  const colors: Array<[number, number, number]> = [
    [59, 130, 246],    // 蓝色
    [139, 92, 246],    // 紫色
    [236, 72, 153],    // 粉红色
    [34, 197, 94],     // 绿色
    [249, 115, 22],    // 橙色
    [84, 182, 255],    // 浅蓝
    [168, 85, 247],    // 深紫
    [244, 63, 94],     // 红色
    [14, 165, 233],    // 天蓝
    [132, 204, 22],    // 石灰色
  ];

  // 计算文本的简单hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  // 使用hash值选择颜色（确保一致性）
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
}

/**
 * 提取首字母或首个字符
 * 支持中文、英文、emoji等
 *
 * @param text 输入文本
 * @returns 首字符
 */
function getFirstCharacter(text: string): string {
  if (!text) return '?';
  // 移除所有空格，取第一个非空字符
  const trimmed = text.replace(/\s/g, '');
  return trimmed[0].toUpperCase();
}

/**
 * 生成首字母图标（SVG Data URL）
 *
 * @param text 输入文本（通常是书签标题）
 * @param size 图标大小，默认64px
 * @returns SVG Data URL
 */
export function generateLetterIcon(text: string, size = 64): string {
  const char = getFirstCharacter(text);
  const [r, g, b] = generateColorFromText(text);
  const bgColor = `rgb(${r}, ${g}, ${b})`;

  // 生成SVG
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
    <!-- 背景圆形 -->
    <rect width="${size}" height="${size}" fill="${bgColor}" rx="${size * 0.1}"/>
    <!-- 文字 -->
    <text
      x="${size / 2}"
      y="${size / 2 + size * 0.15}"
      font-size="${size * 0.5}"
      font-weight="600"
      font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      text-anchor="middle"
      fill="white"
      dominant-baseline="middle"
    >
      ${char}
    </text>
  </svg>`;

  // 编码为Data URL
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml,${encoded}`;
}

/**
 * 判断是否是有效的图片URL（基本检查）
 *
 * @param url URL字符串
 * @returns 是否看起来像图片
 */
export function isValidImageUrl(url: string | null): boolean {
  if (!url) return false;
  if (url.startsWith('data:image/')) return true;
  if (url.startsWith('blob:')) return true;

  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.toLowerCase();
    return (
      /\.(jpg|jpeg|png|gif|webp|ico|svg)$/i.test(path) ||
      url.includes('favicon')
    );
  } catch {
    return false;
  }
}
