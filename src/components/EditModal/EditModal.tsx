import { useState, useEffect, useRef, useId } from 'react';
import { Modal } from '../Modal';
import { Input, Button, Select, type SelectOption } from '../ui';
import { useTranslation } from '../../i18n';
import { ensureProtocol } from '../../utils/helpers';
import styles from './EditModal.module.css';

export interface EditModalField {
  key: string;
  label: string;
  type: 'text' | 'url' | 'select';
  placeholder?: string;
  options?: SelectOption[];
  required?: boolean;
}

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fields: EditModalField[];
  initialValues?: Record<string, string>;
  onSave: (values: Record<string, string>) => void | Promise<void>;
  onDelete?: () => void;
}

export function EditModal({
  isOpen,
  onClose,
  title,
  fields,
  initialValues = {},
  onSave,
  onDelete,
}: EditModalProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formId = useId();
  const prevIsOpen = useRef(false);

  // 只在 isOpen 从 false 变为 true 时初始化
  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      const defaultValues: Record<string, string> = {};
      fields.forEach(f => {
        const initialValue = initialValues[f.key] || '';
        defaultValues[f.key] = f.type === 'select' && !f.options?.some(option => option.value === initialValue)
          ? f.options?.[0]?.value || ''
          : initialValue;
      });
      setValues(defaultValues);
      setError(null);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, fields, initialValues]);

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    const normalizedValues = { ...values };

    for (const field of fields) {
      const value = values[field.key]?.trim() || '';
      if (field.required && (!value || (field.type === 'select' && !field.options?.some(option => option.value === value)))) {
        setError(t.common.requiredField.replace('{field}', field.label));
        return;
      }
      normalizedValues[field.key] = value;
      if (field.type === 'url' && value) {
        const url = ensureProtocol(value);
        try {
          new URL(url);
        } catch {
          setError(t.common.invalidUrl);
          return;
        }
        normalizedValues[field.key] = url;
      }
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave(normalizedValues);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="small" closeDisabled={isSaving}>
      <form onSubmit={handleSubmit} className={styles.form} noValidate aria-busy={isSaving}>
        {fields.map(field => (
          <div key={field.key} className={styles.field}>
            <label className={styles.label} htmlFor={`${formId}-${field.key}`}>
              {field.label}
              {field.required && <span className={styles.required}>*</span>}
            </label>
            {field.type === 'select' && field.options ? (
              <Select
                id={`${formId}-${field.key}`}
                disabled={isSaving}
                value={values[field.key] || ''}
                options={field.options}
                onChange={value => handleChange(field.key, value)}
                placeholder={field.placeholder}
              />
            ) : (
              <Input
                id={`${formId}-${field.key}`}
                type={field.type === 'url' ? 'url' : 'text'}
                required={field.required}
                disabled={isSaving}
                value={values[field.key] || ''}
                onChange={e => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                fullWidth
              />
            )}
          </div>
        ))}

        {error && <p className={styles.error} role="alert">{error}</p>}

        <div className={styles.actions}>
          {onDelete && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                onDelete();
                onClose();
              }}
              className={styles.deleteButton}
              disabled={isSaving}
            >
              {t.common.delete}
            </Button>
          )}
          <div className={styles.rightActions}>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
              {t.common.cancel}
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? t.common.saving : t.common.save}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
