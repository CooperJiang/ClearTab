import { useTranslation } from '../../i18n';
import styles from './KeyboardHints.module.css';

export function KeyboardHints() {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <div className={styles.hint}>
        <kbd className={styles.key}>/</kbd>
        <span>{t.keyboardHints.search}</span>
      </div>
      <div className={styles.hint}>
        <kbd className={styles.key}>⌘K</kbd>
        <span>{t.keyboardHints.search}</span>
      </div>
    </div>
  );
}
