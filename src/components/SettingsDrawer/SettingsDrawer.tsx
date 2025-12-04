import { useState, type ReactNode } from 'react';
import { useSettingsStore } from '../../stores';
import { ACCENT_COLORS } from '../../types';
import { ColorPicker } from '../ColorPicker';
import { Switch, Slider, Button, Input, Select } from '../ui';
import { TrashPanel } from '../TrashPanel';
import { useTranslation } from '../../i18n';
import styles from './SettingsDrawer.module.css';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type MenuKey = 'theme' | 'trash' | 'system';

// 菜单图标组件
const ThemeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const SystemIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const { settings, updateSettings } = useSettingsStore();
  const { t, locale, setLocale, supportedLocales } = useTranslation();
  const [activeMenu, setActiveMenu] = useState<MenuKey>('theme');

  // 动态生成菜单项
  const menuItems: { key: MenuKey; label: string; icon: ReactNode }[] = [
    { key: 'theme', label: t.settings.theme.title, icon: <ThemeIcon /> },
    { key: 'trash', label: t.settings.trash.title, icon: <TrashIcon /> },
    { key: 'system', label: t.settings.system.title, icon: <SystemIcon /> },
  ];

  // 语言选项
  const languageOptions = supportedLocales.map(loc => ({
    value: loc.code,
    label: loc.name,
  }));

  // 直接使用 settings 中的值，保持同步
  const darkWallpaperInput = settings.customBackgroundImage || '';
  const lightWallpaperInput = settings.customBackgroundImageLight || '';

  const setDarkWallpaperInput = (value: string) => {
    updateSettings({ customBackgroundImage: value });
  };

  const setLightWallpaperInput = (value: string) => {
    updateSettings({ customBackgroundImageLight: value });
  };

  const handleColorSelect = (color: string) => {
    updateSettings({ accentColor: color });
  };

// 重置壁纸（清空自定义和随机，恢复默认）
  const handleResetWallpaper = (theme: 'dark' | 'light') => {
    if (theme === 'dark') {
      updateSettings({
        customBackgroundImage: '',
        randomWallpaperImage: '',
      });
    } else {
      updateSettings({
        customBackgroundImageLight: '',
        randomWallpaperImageLight: '',
      });
    }
  };

  return (
    <>
      {/* 遮罩层 */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.open : ''}`}
        onClick={onClose}
      />

      {/* 抽屉 */}
      <div className={`${styles.drawer} ${isOpen ? styles.open : ''}`}>
        {/* 侧边菜单 */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarTitle}>{t.settings.title}</span>
          </div>
          <nav className={styles.menu}>
            {menuItems.map((item) => (
              <button
                key={item.key}
                className={`${styles.menuItem} ${activeMenu === item.key ? styles.active : ''}`}
                onClick={() => setActiveMenu(item.key)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* 内容区 */}
        <div className={styles.content}>
          <div className={styles.contentHeader}>
            <h2 className={styles.contentTitle}>
              {menuItems.find((item) => item.key === activeMenu)?.label}
            </h2>
            <button className={styles.closeButton} onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className={styles.contentBody}>
            {activeMenu === 'theme' && (
              <>
                {/* 深色模式切换 */}
                <div className={styles.section}>
                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>{t.settings.theme.darkMode}</span>
                    <Switch
                      checked={settings.themeMode === 'dark'}
                      onChange={(checked) => updateSettings({ themeMode: checked ? 'dark' : 'light' })}
                    />
                  </div>
                </div>

                {/* 显示主题切换按钮 */}
                <div className={styles.section}>
                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>{t.settings.theme.showThemeToggle}</span>
                    <Switch
                      checked={settings.showThemeToggle}
                      onChange={(checked) => updateSettings({ showThemeToggle: checked })}
                    />
                  </div>
                </div>

                {/* 显示模块设置 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>显示模块</h3>
                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>{t.settings.display?.showRecentVisits || '显示最近访问'}</span>
                    <Switch
                      checked={settings.showRecentVisits}
                      onChange={(checked) => updateSettings({ showRecentVisits: checked })}
                    />
                  </div>
                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>{t.settings.display?.showQuickLinks || '显示快捷访问'}</span>
                    <Switch
                      checked={settings.showQuickLinks}
                      onChange={(checked) => updateSettings({ showQuickLinks: checked })}
                    />
                  </div>
                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>{t.settings.display?.showBookmarks || '显示书签'}</span>
                    <Switch
                      checked={settings.showBookmarks}
                      onChange={(checked) => updateSettings({ showBookmarks: checked })}
                    />
                  </div>
                </div>

                {/* 书签分组设置 */}
                <div className={styles.section}>
                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>{t.bookmarkGrouping.title}</span>
                    <Switch
                      checked={settings.enableBookmarkGrouping}
                      onChange={(checked) => updateSettings({ enableBookmarkGrouping: checked })}
                    />
                  </div>
                  <p className={styles.settingDescription}>
                    {t.bookmarkGrouping.description}
                  </p>
                </div>

                {/* 圆角设置 */}
                <div className={styles.section}>
                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>{t.settings.theme.borderRadius}</span>
                    <div className={styles.radiusOptions}>
                      {(['none', 'small', 'medium', 'large', 'xlarge'] as const).map((radius) => {
                        const radiusStyle = { none: '0', small: '4px', medium: '8px', large: '12px', xlarge: '16px' }[radius];
                        return (
                          <button
                            key={radius}
                            className={`${styles.radiusButton} ${settings.borderRadius === radius ? styles.active : ''}`}
                            onClick={() => updateSettings({ borderRadius: radius })}
                            style={{ borderRadius: radiusStyle }}
                          >
                            {t.settings.theme[`radius${radius.charAt(0).toUpperCase() + radius.slice(1)}` as keyof typeof t.settings.theme]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 主题色选择 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>{t.settings.theme.accentColor}</h3>
                  <div className={styles.colorGrid}>
                    {ACCENT_COLORS.map((item) => (
                      <button
                        key={item.id}
                        className={`${styles.colorButton} ${
                          settings.accentColor === item.color ? styles.active : ''
                        }`}
                        style={{ backgroundColor: item.color }}
                        onClick={() => handleColorSelect(item.color)}
                        title={item.name}
                      >
                        {settings.accentColor === item.color && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                  {/* 自定义颜色 */}
                  <div className={styles.customColorRow}>
                    <span className={styles.customColorLabel}>{t.settings.theme.customColor}</span>
                    <ColorPicker
                      value={settings.accentColor}
                      onChange={handleColorSelect}
                    />
                  </div>
                </div>

                {/* 随机壁纸按钮 */}
                <div className={styles.section}>
                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>{t.settings.wallpaper.showRandomButton}</span>
                    <Switch
                      checked={settings.showWallpaperButton}
                      onChange={(checked) => updateSettings({ showWallpaperButton: checked })}
                    />
                  </div>
                </div>

                {/* 壁纸设置 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>{t.settings.wallpaper.customWallpaper}</h3>

                  {/* 暗色模式壁纸 */}
                  <div className={styles.wallpaperGroup}>
                    <label className={styles.wallpaperLabel}>{t.settings.wallpaper.darkModeWallpaper}</label>
                    <div className={styles.wallpaperInputRow}>
                      <Input
                        type="text"
                        placeholder={t.settings.wallpaper.inputPlaceholder}
                        value={darkWallpaperInput}
                        onChange={(e) => setDarkWallpaperInput(e.target.value)}
                        fullWidth
                      />
                      <Button variant="secondary" onClick={() => handleResetWallpaper('dark')}>
                        {t.common.reset}
                      </Button>
                    </div>
                  </div>

                  {/* 亮色模式壁纸 */}
                  <div className={styles.wallpaperGroup}>
                    <label className={styles.wallpaperLabel}>{t.settings.wallpaper.lightModeWallpaper}</label>
                    <div className={styles.wallpaperInputRow}>
                      <Input
                        type="text"
                        placeholder={t.settings.wallpaper.inputPlaceholder}
                        value={lightWallpaperInput}
                        onChange={(e) => setLightWallpaperInput(e.target.value)}
                        fullWidth
                      />
                      <Button variant="secondary" onClick={() => handleResetWallpaper('light')}>
                        {t.common.reset}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* PixelPunk 随机壁纸 API 设置 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>PixelPunk API</h3>
                  <div className={styles.wallpaperGroup}>
                    <label className={styles.wallpaperLabel}>API URL</label>
                    <Input
                      type="text"
                      placeholder="https://v1.pixelpunk.cc/api/v1/r/rnd_7Zxaj9XXhBa4"
                      value={settings.pixelPunkApiUrl}
                      onChange={(e) => updateSettings({ pixelPunkApiUrl: e.target.value })}
                      fullWidth
                    />
                  </div>
                </div>

                {/* 遮罩透明度设置 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>{t.settings.overlay.title}</h3>
                  <Slider
                    label={t.settings.overlay.darkMode}
                    displayValue={`${Math.round(settings.backgroundOverlayDark * 100)}%`}
                    min={0}
                    max={100}
                    step={5}
                    value={settings.backgroundOverlayDark * 100}
                    onChange={(v) => updateSettings({ backgroundOverlayDark: v / 100 })}
                  />
                  <Slider
                    label={t.settings.overlay.lightMode}
                    displayValue={`${Math.round(settings.backgroundOverlayLight * 100)}%`}
                    min={0}
                    max={100}
                    step={5}
                    value={settings.backgroundOverlayLight * 100}
                    onChange={(v) => updateSettings({ backgroundOverlayLight: v / 100 })}
                  />
                </div>

                {/* 背景模糊设置 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>{t.settings.blur.title}</h3>
                  <Slider
                    label={t.settings.blur.darkMode}
                    displayValue={`${settings.backgroundBlurDark}px`}
                    min={0}
                    max={20}
                    step={1}
                    value={settings.backgroundBlurDark}
                    onChange={(v) => updateSettings({ backgroundBlurDark: v })}
                  />
                  <Slider
                    label={t.settings.blur.lightMode}
                    displayValue={`${settings.backgroundBlurLight}px`}
                    min={0}
                    max={20}
                    step={1}
                    value={settings.backgroundBlurLight}
                    onChange={(v) => updateSettings({ backgroundBlurLight: v })}
                  />
                </div>

                {/* 时间模块设置 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>{t.settings.clock.title}</h3>
                  <div className={styles.optionList}>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>{t.settings.clock.showSeconds}</span>
                      <Switch
                        checked={settings.showSeconds}
                        onChange={(checked) => updateSettings({ showSeconds: checked })}
                      />
                    </div>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>{t.settings.clock.clockColor}</span>
                      <ColorPicker
                        value={settings.clockColor}
                        onChange={(color) => updateSettings({ clockColor: color })}
                      />
                    </div>
                  </div>
                </div>

                {/* 显示设置 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>{t.settings.display.title}</h3>
                  <div className={styles.optionList}>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>{t.settings.display.showClock}</span>
                      <Switch
                        checked={settings.showClock}
                        onChange={(checked) => updateSettings({ showClock: checked })}
                      />
                    </div>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>{t.settings.display.showQuote}</span>
                      <Switch
                        checked={settings.showQuote}
                        onChange={(checked) => updateSettings({ showQuote: checked })}
                      />
                    </div>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>{t.settings.display.showRecentVisits}</span>
                      <Switch
                        checked={settings.showRecentVisits}
                        onChange={(checked) => updateSettings({ showRecentVisits: checked })}
                      />
                    </div>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>{t.settings.display.showQuickLinks}</span>
                      <Switch
                        checked={settings.showQuickLinks}
                        onChange={(checked) => updateSettings({ showQuickLinks: checked })}
                      />
                    </div>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>{t.settings.display.showBookmarks}</span>
                      <Switch
                        checked={settings.showBookmarks}
                        onChange={(checked) => updateSettings({ showBookmarks: checked })}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeMenu === 'trash' && (
              <TrashPanel />
            )}

            {activeMenu === 'system' && (
              <>
                <div className={styles.section}>
                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>{t.settings.system.language}</span>
                    <Select
                      value={locale}
                      options={languageOptions}
                      onChange={(value) => setLocale(value as typeof locale)}
                      width={140}
                    />
                  </div>
                </div>

                <div className={styles.section}>
                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>{t.bookmarkMode.title}</span>
                    <Select
                      value={settings.bookmarkMode}
                      options={[
                        { value: 'chrome', label: t.bookmarkMode.chrome },
                        { value: 'local', label: t.bookmarkMode.local }
                      ]}
                      onChange={(value) => updateSettings({ bookmarkMode: value as 'chrome' | 'local' })}
                      width={140}
                    />
                  </div>
                  <p className={styles.settingDescription}>
                    {settings.bookmarkMode === 'chrome'
                      ? t.bookmarkMode.chromeDesc
                      : t.bookmarkMode.localDesc}
                  </p>
                </div>

                {/* 最近访问设置 */}
                {settings.showRecentVisits && (
                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>{t.recentVisits.settings.title}</h3>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>{t.recentVisits.settings.count}</span>
                      <Select
                        value={String(settings.recentVisitsCount)}
                        onChange={(value) => updateSettings({ recentVisitsCount: Number(value) })}
                        width={140}
                        options={[
                          { value: '6', label: '6' },
                          { value: '8', label: '8' },
                          { value: '10', label: '10' },
                          { value: '12', label: '12' },
                          { value: '15', label: '15' },
                          { value: '20', label: '20' },
                        ]}
                      />
                    </div>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>{t.recentVisits.settings.mode}</span>
                      <Select
                        value={settings.recentVisitsMode}
                        onChange={(value) => updateSettings({ recentVisitsMode: value as 'chrome' | 'custom' })}
                        width={140}
                        options={[
                          { value: 'custom', label: t.recentVisits.settings.modeCustom },
                          { value: 'chrome', label: t.recentVisits.settings.modeChrome },
                        ]}
                      />
                    </div>
                    <p className={styles.settingDescription}>
                      {settings.recentVisitsMode === 'custom'
                        ? t.recentVisits.settings.customDesc
                        : t.recentVisits.settings.chromeDesc}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
