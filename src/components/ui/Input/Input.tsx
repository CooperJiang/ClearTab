import type { InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  fullWidth?: boolean;
}

export function Input({
  fullWidth = false,
  className,
  disabled,
  ...props
}: InputProps) {
  const classNames = [
    styles.input,
    fullWidth ? styles.fullWidth : '',
    disabled ? styles.disabled : '',
    className || '',
  ].filter(Boolean).join(' ');

  return (
    <input className={classNames} disabled={disabled} {...props} />
  );
}
