<div align="center">

# ClearTab

**🎨 A Clean and Efficient New Tab Browser Extension**

A modern browser new tab page built with React + TypeScript, focused on minimal design and efficient experience.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vitejs.dev/)

English | [中文](./README.md)

</div>

---

## 📸 Preview

<p align="center">
  <img src="./public/screenshots/preview-dark.png" alt="Dark Theme Preview" width="100%">
</p>

<p align="center">
  <img src="./public/screenshots/preview-light.png" alt="Light Theme Preview" width="100%">
</p>

---

## 🚀 Quick Installation

### Option 1: Download Pre-built Package (Recommended)

Pre-built extension packages are available in the project root directory:

| Browser | Download |
|---------|----------|
| Chrome / Edge | [`cleartab-chrome-v1.0.0.zip`](./cleartab-chrome-v1.0.0.zip) |
| Firefox | [`cleartab-firefox-v1.0.0.zip`](./cleartab-firefox-v1.0.0.zip) |

**Chrome / Edge Installation:**
1. Download and extract `cleartab-chrome-v1.0.0.zip`
2. Open browser, navigate to `chrome://extensions/` (or `edge://extensions/` for Edge)
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the extracted folder

**Firefox Installation:**
1. Download `cleartab-firefox-v1.0.0.zip`
2. Open Firefox, navigate to `about:addons`
3. Click the gear icon → "Install Add-on From File"
4. Select the downloaded zip file

### Option 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/CooperJiang/ClearTab.git
cd ClearTab

# Install dependencies
npm install

# Development mode (with hot reload)
npm run dev:watch

# Build for production
npm run build
```

After building, load the `dist` directory as an unpacked extension.

---

## ✨ Features

### 🔍 Multi Search Engine
- **25+ built-in search engines**: Google, Bing, GitHub, Stack Overflow, MDN, YouTube, Reddit, and more
- Support for **custom search engines**
- One-click switch between default search engines
- Global search panel (`⌘/Ctrl + K`) for quick searching

### 🔖 Bookmark Management
- **12 category tabs**: All, Dev, Design, Learn, Tools, Entertainment, News, AI, Social, Shopping, Finance, Reading
- Support for **custom categories** - add/edit/delete
- **Drag & drop sorting** for bookmarks and categories
- Visit count and last visit time tracking
- **Chrome bookmark sync** or local-only mode
- **Trash bin** for recovering deleted bookmarks

### ⚡ Quick Links
- Quick access panel at the top for favorite sites
- Customizable quick links
- Keyboard shortcuts for quick access (`Alt + 1-9`)
- Drag & drop sorting

### 📊 Recent Visits
- Automatic tracking of recently visited sites
- Chrome history mode or custom mode
- Configurable display count

### 🎨 Themes & Personalization
- **Dark/Light theme** toggle
- **18 accent colors** to choose from
- **Custom wallpapers**: Upload local images or use online random wallpapers
- Wallpaper **blur effect** and **overlay opacity** adjustment
- **Independent wallpaper** settings for dark/light mode
- **Border radius** customization
- **Content max width** limit

### ⏰ Clock & Quotes
- Real-time clock display (12/24 hour format)
- Daily inspirational quotes
- Can be toggled independently

### 🍅 Pomodoro Timer
- Built-in Pomodoro technique timer
- Customizable work/break duration
- Draggable position
- Second-level tick marks

### 🌐 Multi-language Support
- 简体中文 (Chinese)
- English
- Switchable in settings

### ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus search bar |
| `⌘/Ctrl + K` | Open global search |
| `⌘/Ctrl + ,` | Open settings |
| `⌘/Ctrl + D` | Toggle dark/light theme |
| `⌘/Ctrl + B` | Add new bookmark |
| `Alt + 1-9` | Quick open corresponding quick link |
| `Esc` | Close modal/panel |

### 🔒 Privacy & Security
- **All data stored locally**, nothing uploaded to servers
- Optional **WebDAV sync** support
- Optional **GitHub Gist sync** support
- No account registration required

### 📱 Layout Modes
- **Classic layout**: Centered alignment, traditional new tab style
- **Sidebar layout**: Left-side category navigation, ideal for heavy bookmark users

---

## 🛠️ Tech Stack

| Technology | Version | Description |
|------------|---------|-------------|
| [React](https://react.dev/) | 19 | UI Framework |
| [TypeScript](https://www.typescriptlang.org/) | 5.9 | Type Safety |
| [Vite](https://vitejs.dev/) | 7 | Build Tool |
| [Zustand](https://zustand-demo.pmnd.rs/) | 5 | State Management |
| [Framer Motion](https://www.framer.com/motion/) | 12 | Animation Library |
| [Lucide React](https://lucide.dev/) | - | Icon Library |
| CSS Modules | - | Scoped Styling |

---

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Background/      # Background wallpaper
│   ├── BookmarkGrid/    # Bookmark grid
│   ├── Clock/           # Clock display
│   ├── GlobalSearch/    # Global search
│   ├── PomodoroTimer/   # Pomodoro timer
│   ├── QuickLinks/      # Quick links
│   ├── Quote/           # Daily quotes
│   ├── RecentVisits/    # Recent visits
│   ├── SearchBar/       # Search bar
│   ├── SettingsDrawer/  # Settings panel
│   ├── Sidebar/         # Sidebar navigation
│   ├── ThemeToggle/     # Theme toggle
│   ├── TrashPanel/      # Trash bin
│   └── ui/              # Base UI components
├── stores/              # Zustand state management
├── services/            # Services (Chrome API, sync, etc.)
├── hooks/               # Custom hooks
├── i18n/                # Internationalization
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── App.tsx              # App entry point
```

---

## ⚙️ Settings

### Wallpaper Settings
- Custom wallpaper upload
- Online random wallpaper (custom API support)
- Overlay opacity adjustment
- Blur effect intensity

### Theme Settings
- Dark/Light mode
- 18 accent colors
- Border radius
- Content max width

### Component Display
- Clock toggle
- Daily quote toggle
- Search bar toggle
- Quick links toggle
- Recent visits toggle
- Bookmarks toggle
- Wallpaper button toggle
- Pomodoro timer toggle

### Search Engines
- Enable/disable search engines
- Drag & drop sorting
- Custom search engines

### Data Management
- Bookmark mode switch (Chrome/Local)
- WebDAV sync configuration
- GitHub Gist sync configuration
- Data import/export

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Made with ❤️ by [CooperJiang](https://github.com/CooperJiang)**

If you find this project helpful, please give it a ⭐ Star!

</div>
