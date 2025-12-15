<div align="center">

# ClearTab

**🎨 简洁高效的浏览器新标签页扩展**

一个基于 React + TypeScript 构建的现代化浏览器新标签页，专注于简洁设计与高效体验。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vitejs.dev/)

[English](./README_EN.md) | 中文

</div>

---

## 📸 预览

<p align="center">
  <img src="./public/screenshots/preview-dark.png" alt="深色主题预览" width="100%">
</p>

<p align="center">
  <img src="./public/screenshots/preview-light.png" alt="浅色主题预览" width="100%">
</p>

---

## 🚀 快速安装

### 方式一：直接下载安装包（推荐）

项目根目录已提供打包好的扩展文件，可直接下载使用：

| 浏览器 | 下载文件 |
|--------|----------|
| Chrome / Edge | [`cleartab-chrome-v1.0.0.zip`](./cleartab-chrome-v1.0.0.zip) |
| Firefox | [`cleartab-firefox-v1.0.0.zip`](./cleartab-firefox-v1.0.0.zip) |

**Chrome / Edge 安装步骤：**
1. 下载 `cleartab-chrome-v1.0.0.zip` 并解压
2. 打开浏览器，访问 `chrome://extensions/`（Edge 为 `edge://extensions/`）
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择解压后的文件夹

**Firefox 安装步骤：**
1. 下载 `cleartab-firefox-v1.0.0.zip`
2. 打开 Firefox，访问 `about:addons`
3. 点击齿轮图标 → 「从文件安装附加组件」
4. 选择下载的 zip 文件

### 方式二：从源码构建

```bash
# 克隆项目
git clone https://github.com/CooperJiang/ClearTab.git
cd ClearTab

# 安装依赖
npm install

# 开发模式（支持热重载）
npm run dev:watch

# 构建生产版本
npm run build
```

构建完成后，`dist` 目录即为扩展文件，按上述步骤加载即可。

---

## ✨ 功能特性

### 🔍 多搜索引擎
- 内置 **25+ 搜索引擎**：Google、百度、Bing、GitHub、Stack Overflow、MDN、bilibili、知乎、小红书等
- 支持**自定义搜索引擎**，添加任意搜索网站
- 一键切换默认搜索引擎
- 全局搜索面板（`⌘/Ctrl + K`）快速搜索

### 🔖 书签管理
- **12 个分类标签**：全部、开发、设计、学习、工具、娱乐、资讯、AI、社交、购物、金融、阅读
- 支持**自定义分类**，添加/编辑/删除分类
- **拖拽排序**书签和分类
- 书签访问计数和最后访问时间记录
- 支持 **Chrome 书签同步**或本地独立管理两种模式
- **垃圾箱功能**，误删书签可恢复

### ⚡ 快捷链接
- 顶部快捷访问面板，一键直达常用网站
- 支持自定义快捷链接
- 键盘快捷键快速访问（`Alt + 1-9`）
- 拖拽排序

### 📊 最近访问
- 自动记录最近访问的网站
- 支持 Chrome 历史模式或自定义模式
- 可配置显示数量

### 🎨 主题与个性化
- **深色/浅色主题**切换
- **18 种主题色**可选
- **自定义壁纸**：上传本地图片或使用在线随机壁纸
- 壁纸**模糊效果**和**遮罩透明度**调节
- 深色/浅色模式**独立壁纸配置**
- **圆角大小**自定义
- **内容最大宽度**限制

### ⏰ 时钟与名言
- 实时时钟显示（支持 12/24 小时制）
- 每日一言/励志名言展示
- 可独立开关

### 🍅 番茄钟
- 内置番茄工作法计时器
- 可自定义工作/休息时长
- 可拖拽移动位置
- 秒级刻度显示

### 🌐 多语言支持
- 简体中文
- English
- 可在设置中切换

### ⌨️ 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `/` | 聚焦搜索框 |
| `⌘/Ctrl + K` | 打开全局搜索 |
| `⌘/Ctrl + ,` | 打开设置面板 |
| `⌘/Ctrl + D` | 切换深色/浅色主题 |
| `⌘/Ctrl + B` | 添加新书签 |
| `Alt + 1-9` | 快速打开对应快捷链接 |
| `Esc` | 关闭弹窗/面板 |

### 🔒 隐私安全
- **所有数据本地存储**，不上传任何服务器
- 支持 **WebDAV 同步**（可选）
- 支持 **GitHub Gist 同步**（可选）
- 无需注册账号

### 📱 布局模式
- **经典布局**：居中对齐，传统新标签页风格
- **侧边栏布局**：左侧分类导航，适合书签较多的用户

---

## 🛠️ 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| [React](https://react.dev/) | 19 | UI 框架 |
| [TypeScript](https://www.typescriptlang.org/) | 5.9 | 类型安全 |
| [Vite](https://vitejs.dev/) | 7 | 构建工具 |
| [Zustand](https://zustand-demo.pmnd.rs/) | 5 | 状态管理 |
| [Framer Motion](https://www.framer.com/motion/) | 12 | 动画库 |
| [Lucide React](https://lucide.dev/) | - | 图标库 |
| CSS Modules | - | 样式隔离 |

---

## 📁 项目结构

```
src/
├── components/          # React 组件
│   ├── Background/      # 背景壁纸
│   ├── BookmarkGrid/    # 书签网格
│   ├── Clock/           # 时钟显示
│   ├── GlobalSearch/    # 全局搜索
│   ├── PomodoroTimer/   # 番茄钟
│   ├── QuickLinks/      # 快捷链接
│   ├── Quote/           # 每日一言
│   ├── RecentVisits/    # 最近访问
│   ├── SearchBar/       # 搜索栏
│   ├── SettingsDrawer/  # 设置面板
│   ├── Sidebar/         # 侧边栏
│   ├── ThemeToggle/     # 主题切换
│   ├── TrashPanel/      # 垃圾箱
│   └── ui/              # 基础 UI 组件
├── stores/              # Zustand 状态管理
├── services/            # 服务层（Chrome API、同步等）
├── hooks/               # 自定义 Hooks
├── i18n/                # 国际化
├── types/               # TypeScript 类型定义
├── utils/               # 工具函数
└── App.tsx              # 应用入口
```

---

## ⚙️ 设置选项

### 壁纸设置
- 自定义上传壁纸
- 在线随机壁纸（支持自定义 API）
- 遮罩透明度调节
- 模糊效果强度

### 主题设置
- 深色/浅色模式
- 18 种主题色
- 圆角大小
- 内容最大宽度

### 组件显示
- 时钟开关
- 每日一言开关
- 搜索栏开关
- 快捷链接开关
- 最近访问开关
- 书签开关
- 壁纸按钮开关
- 番茄钟开关

### 搜索引擎
- 启用/禁用搜索引擎
- 拖拽排序
- 自定义搜索引擎

### 数据管理
- 书签模式切换（Chrome/本地）
- WebDAV 同步配置
- GitHub Gist 同步配置
- 数据导入/导出

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

---

<div align="center">

**Made with ❤️ by [CooperJiang](https://github.com/CooperJiang)**

如果这个项目对你有帮助，请给一个 ⭐ Star 支持一下！

</div>
