import { useSettingsStore } from '../../stores';
import styles from './Background.module.css';

export function Background() {
  const { settings } = useSettingsStore();

  // 根据主题模式选择背景图
  // 优先级：随机壁纸 > 自定义壁纸 > 默认壁纸
  const getBackgroundImage = () => {
    if (settings.themeMode === 'light') {
      return settings.randomWallpaperImageLight
        || settings.customBackgroundImageLight
        || settings.backgroundImageLight;
    }
    return settings.randomWallpaperImage
      || settings.customBackgroundImage
      || settings.backgroundImage;
  };

  // 根据主题模式获取模糊值
  const getBlurValue = () => {
    return settings.themeMode === 'light'
      ? settings.backgroundBlurLight
      : settings.backgroundBlurDark;
  };

  // 根据主题模式获取透明度
  const getOverlayOpacity = () => {
    return settings.themeMode === 'light'
      ? settings.backgroundOverlayLight
      : settings.backgroundOverlayDark;
  };

  return (
    <div className={styles.background}>
      <img
        src={getBackgroundImage()}
        alt=""
        className={styles.image}
      />
      <div
        className={styles.overlay}
        style={{
          opacity: getOverlayOpacity(),
          backdropFilter: `blur(${getBlurValue()}px)`,
          WebkitBackdropFilter: `blur(${getBlurValue()}px)`,
        }}
      />
      <div className={styles.gradientOverlay} />
    </div>
  );
}
