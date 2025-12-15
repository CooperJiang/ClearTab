import { useCurrentTime } from '../../hooks';
import { useSettingsStore } from '../../stores';
import styles from './Clock.module.css';

export function Clock() {
  const { settings } = useSettingsStore();
  const { timeString, dateString } = useCurrentTime(settings.showSeconds, settings.locale);

  return (
    <div className={styles.clock}>
      <div className={styles.time} style={{ color: settings.clockColor }}>
        {timeString}
      </div>
      <div className={styles.date} style={{ color: settings.clockColor }}>
        {dateString}
      </div>
    </div>
  );
}
