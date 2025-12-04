import styles from './LetterIcon.module.css';

interface LetterIconProps {
  letter: string;
  backgroundColor: string;
}

export function LetterIcon({ letter, backgroundColor }: LetterIconProps) {
  return (
    <div className={styles.icon} style={{ backgroundColor }}>
      <span className={styles.letter}>{letter}</span>
    </div>
  );
}
