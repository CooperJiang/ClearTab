import { useTranslation } from '../../i18n';
import styles from './Quote.module.css';

export function Quote() {
  const { t } = useTranslation();

  // 基于日期选择每日一言，确保同一天显示相同的内容
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const quoteIndex = dayOfYear % t.quotes.items.length;
  const quote = t.quotes.items[quoteIndex];

  return (
    <div className={styles.quote}>
      <p className={styles.text}>{quote.text}</p>
      <span className={styles.source}>{quote.source}</span>
    </div>
  );
}
