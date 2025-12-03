import styles from './Slider.module.css';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  displayValue?: string;
  disabled?: boolean;
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  displayValue,
  disabled = false,
}: SliderProps) {
  return (
    <div className={`${styles.container} ${disabled ? styles.disabled : ''}`}>
      {(label || displayValue) && (
        <div className={styles.header}>
          {label && <span className={styles.label}>{label}</span>}
          {displayValue && <span className={styles.value}>{displayValue}</span>}
        </div>
      )}
      <input
        type="range"
        className={styles.slider}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
      />
    </div>
  );
}
