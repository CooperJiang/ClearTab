import { useState, useEffect, useRef } from 'react';
import { Modal } from '../Modal';
import { Input, Button, Select, type SelectOption } from '../ui';
import { useTranslation } from '../../i18n';
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
  onSave: (values: Record<string, string>) => void;
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
  const prevIsOpen = useRef(false);

  // 只在 isOpen 从 false 变为 true 时初始化
  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      const defaultValues: Record<string, string> = {};
      fields.forEach(f => {
        defaultValues[f.key] = initialValues[f.key] || '';
      });
      setValues(defaultValues);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, fields, initialValues]);

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 验证必填字段
    for (const field of fields) {
      if (field.required && !values[field.key]?.trim()) {
        return;
      }
    }

    onSave(values);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="small">
      <form onSubmit={handleSubmit} className={styles.form}>
        {fields.map(field => (
          <div key={field.key} className={styles.field}>
            <label className={styles.label}>
              {field.label}
              {field.required && <span className={styles.required}>*</span>}
            </label>
            {field.type === 'select' && field.options ? (
              <Select
                value={values[field.key] || ''}
                options={field.options}
                onChange={value => handleChange(field.key, value)}
                placeholder={field.placeholder}
              />
            ) : (
              <Input
                type={field.type === 'url' ? 'url' : 'text'}
                value={values[field.key] || ''}
                onChange={e => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                fullWidth
              />
            )}
          </div>
        ))}

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
            >
              {t.common.delete}
            </Button>
          )}
          <div className={styles.rightActions}>
            <Button type="button" variant="secondary" onClick={onClose}>
              {t.common.cancel}
            </Button>
            <Button type="submit" variant="primary">
              {t.common.save}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
