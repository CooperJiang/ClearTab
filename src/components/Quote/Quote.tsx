import { useDailyQuote } from '../../hooks/useDailyQuote';
import styles from './Quote.module.css';

export function Quote() {
  const quote = useDailyQuote();

  return (
    <div className={styles.quote}>
      <p className={styles.text}>{quote.text}</p>
      <span className={styles.source}>{quote.source}</span>
    </div>
  );
}
