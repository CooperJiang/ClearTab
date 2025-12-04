import { useState } from 'react';
import { Modal } from '../Modal';
import { getAllEngines, type SearchEngine } from '../../types';
import { useSettingsStore } from '../../stores';
import styles from './SearchEngineModal.module.css';

interface SearchEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MIN_ENGINES = 1;
const MAX_ENGINES = 8;

export function SearchEngineModal({ isOpen, onClose }: SearchEngineModalProps) {
  const { settings, updateSettings } = useSettingsStore();
  const [customUrl, setCustomUrl] = useState('');

  // 获取所有引擎（内置 + 自定义）
  const allEngines = getAllEngines(settings.customSearchEngines);

  const handleToggle = (id: string) => {
    const currentIds = settings.enabledSearchEngines;
    let newIds: string[];

    if (currentIds.includes(id)) {
      if (currentIds.length <= MIN_ENGINES) return;
      newIds = currentIds.filter(i => i !== id);
    } else {
      if (currentIds.length >= MAX_ENGINES) return;
      newIds = [...currentIds, id];
    }

    updateSettings({ enabledSearchEngines: newIds });

    // 如果当前默认引擎被移除，切换到第一个启用的引擎
    if (!newIds.includes(settings.defaultSearchEngine)) {
      updateSettings({ defaultSearchEngine: newIds[0] });
    }
  };

  const handleAddCustom = () => {
    if (!customUrl.trim()) return;

    // 验证URL格式
    if (!customUrl.includes('%s') && !customUrl.includes('=')) {
      return;
    }

    // 创建自定义引擎ID
    const customId = `custom_${Date.now()}`;

    // 从URL提取域名作为名称
    let name = '自定义';
    try {
      const url = new URL(customUrl.includes('%s') ? customUrl.replace('%s', 'test') : customUrl);
      name = url.hostname.replace('www.', '').split('.')[0];
      name = name.charAt(0).toUpperCase() + name.slice(1);
    } catch {
      // 使用默认名称
    }

    const customEngine: SearchEngine = {
      id: customId,
      name,
      url: customUrl.includes('%s') ? customUrl.replace('%s', '') : customUrl,
      icon: undefined,
    };

    // 保存自定义引擎到 settings
    const newCustomEngines = [...settings.customSearchEngines, customEngine];

    // 如果启用的引擎数量未满，同时启用这个引擎
    if (settings.enabledSearchEngines.length < MAX_ENGINES) {
      updateSettings({
        customSearchEngines: newCustomEngines,
        enabledSearchEngines: [...settings.enabledSearchEngines, customId],
      });
    } else {
      updateSettings({
        customSearchEngines: newCustomEngines,
      });
    }

    setCustomUrl('');
  };

  // 删除自定义引擎
  const handleDeleteCustomEngine = (engineId: string) => {
    // 从自定义引擎列表中移除
    const newCustomEngines = settings.customSearchEngines.filter(e => e.id !== engineId);
    // 从启用列表中移除
    const newEnabledIds = settings.enabledSearchEngines.filter(id => id !== engineId);

    // 如果删除的是当前默认引擎，切换到第一个启用的引擎
    let newDefault = settings.defaultSearchEngine;
    if (settings.defaultSearchEngine === engineId && newEnabledIds.length > 0) {
      newDefault = newEnabledIds[0];
    }

    updateSettings({
      customSearchEngines: newCustomEngines,
      enabledSearchEngines: newEnabledIds,
      defaultSearchEngine: newDefault,
    });
  };

  // 检查是否为自定义引擎
  const isCustomEngine = (id: string) => id.startsWith('custom_');

  const isSelected = (id: string) => settings.enabledSearchEngines.includes(id);
  const canSelect = settings.enabledSearchEngines.length < MAX_ENGINES;
  const canDeselect = settings.enabledSearchEngines.length > MIN_ENGINES;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="添加搜索引擎"
      subtitle={`最少添加${MIN_ENGINES}种，最多添加${MAX_ENGINES}种（已选${settings.enabledSearchEngines.length}种）`}
    >
      <div className={styles.engineGrid}>
        {allEngines.map((engine) => {
          const selected = isSelected(engine.id);
          const disabled = !selected && !canSelect;
          const isCustom = isCustomEngine(engine.id);

          return (
            <div key={engine.id} className={styles.engineCardWrapper}>
              <button
                type="button"
                className={`${styles.engineCard} ${selected ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
                onClick={() => handleToggle(engine.id)}
                disabled={disabled || (selected && !canDeselect)}
              >
                <div className={styles.checkbox}>
                  {selected && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
                <div className={styles.engineIcon}>
                  {engine.icon ? (
                    <img src={engine.icon} alt={engine.name} />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                  )}
                </div>
                <div className={styles.engineInfo}>
                  <span className={styles.engineName}>{engine.name}</span>
                  <span className={styles.engineUrl}>{engine.url}</span>
                </div>
              </button>
              {isCustom && (
                <button
                  type="button"
                  className={styles.deleteCustomButton}
                  onClick={() => handleDeleteCustomEngine(engine.id)}
                  title="删除自定义引擎"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.customSection}>
        <div className={styles.customTitle}>自定义搜索引擎</div>
        <div className={styles.customInputRow}>
          <div className={styles.customInputWrapper}>
            <svg className={styles.globeIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <input
              type="text"
              className={styles.customInput}
              placeholder="请输入搜索地址，用%s代替关键词，例：https://www.baidu.com/s?wd=%s"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
            />
          </div>
          <button
            className={styles.customSaveButton}
            onClick={handleAddCustom}
            disabled={!customUrl.trim()}
          >
            保存
          </button>
        </div>
      </div>
    </Modal>
  );
}
