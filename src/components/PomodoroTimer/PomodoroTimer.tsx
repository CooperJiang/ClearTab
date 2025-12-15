import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { DraggableWidget } from '../DraggableWidget';
import { useToast } from '../ui/Toast';
import { useSettingsStore } from '../../stores';
import styles from './PomodoroTimer.module.css';

// 持久化状态结构 - 保存绝对时间以支持跨窗口和刷新后继续
interface PomodoroStoredState {
  isRunning: boolean;
  endTime: number; // 计时结束的时间戳（毫秒）
  isWorkSession: boolean;
  sessionsCompleted: number;
  pausedTimeLeft: number; // 暂停时剩余的秒数
}

interface PomodoroPosition {
  x: number;
  y: number;
}

interface PomodoroWidgetProps {
  position: PomodoroPosition;
  onPositionChange: (position: PomodoroPosition) => void;
  onClose?: () => void;
}

const STORAGE_KEY = 'pomodoro-timer-state';
const POSITION_KEY = 'pomodoro-timer-position';
const TIMER_INTERVAL = 500; // 500ms 更新一次，平衡精度和性能

// 播放通知音效 - 提取到组件外部避免重复创建
function playNotification() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch {
    // 浏览器不支持
  }
}

// localStorage 操作函数 - 提取到组件外部
function loadStoredState(): PomodoroStoredState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return null;
}

function saveStoredState(state: PomodoroStoredState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadPosition(): PomodoroPosition | null {
  try {
    const saved = localStorage.getItem(POSITION_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return null;
}

function savePosition(position: PomodoroPosition) {
  localStorage.setItem(POSITION_KEY, JSON.stringify(position));
}

// 计算剩余时间
function calculateTimeLeft(stored: PomodoroStoredState | null, defaultDuration: number): number {
  if (!stored) return defaultDuration * 60;
  if (stored.isRunning) {
    return Math.max(0, Math.ceil((stored.endTime - Date.now()) / 1000));
  }
  return stored.pausedTimeLeft ?? defaultDuration * 60;
}

// 格式化时间
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// 预生成刻度数组，避免每次渲染重新创建
const TICKS_12 = Array.from({ length: 12 }, (_, i) => i);
const TICKS_60 = Array.from({ length: 60 }, (_, i) => i);
const CIRCLE_LENGTH = 2 * Math.PI * 46;

export function PomodoroTimer({ position, onPositionChange, onClose }: PomodoroWidgetProps) {
  const { showToast } = useToast();
  const { settings, updateSettings } = useSettingsStore();

  // 从 settings 获取配置
  const workDuration = settings.pomodoroWorkDuration ?? 25;
  const breakDuration = settings.pomodoroBreakDuration ?? 5;
  const showSecondTicks = settings.pomodoroShowSecondTicks ?? true;

  // 初始化位置
  const [currentPosition, setCurrentPosition] = useState<PomodoroPosition>(() => {
    return loadPosition() || position;
  });

  // 初始化状态
  const [state, setState] = useState(() => {
    const stored = loadStoredState();
    const timeLeft = calculateTimeLeft(stored, workDuration);
    return {
      isRunning: stored?.isRunning ?? false,
      timeLeft,
      isWorkSession: stored?.isWorkSession ?? true,
      sessionsCompleted: stored?.sessionsCompleted ?? 0,
      endTime: stored?.endTime ?? 0,
    };
  });

  // 用于追踪是否已通知
  const hasNotifiedRef = useRef(false);

  // 监听 storage 事件同步其他窗口
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const stored: PomodoroStoredState = JSON.parse(e.newValue);
          setState({
            isRunning: stored.isRunning,
            timeLeft: calculateTimeLeft(stored, workDuration),
            isWorkSession: stored.isWorkSession,
            sessionsCompleted: stored.sessionsCompleted,
            endTime: stored.endTime,
          });
        } catch { /* ignore */ }
      }
      if (e.key === POSITION_KEY && e.newValue) {
        try {
          setCurrentPosition(JSON.parse(e.newValue));
        } catch { /* ignore */ }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [workDuration]);

  // 处理计时结束
  const handleTimerComplete = useCallback(() => {
    const isNextWork = !state.isWorkSession;
    const nextDuration = isNextWork ? workDuration : breakDuration;
    const newSessionsCompleted = isNextWork ? state.sessionsCompleted + 1 : state.sessionsCompleted;

    playNotification();
    showToast(
      isNextWork
        ? `休息结束！开始第 ${newSessionsCompleted + 1} 个番茄`
        : `专注完成！休息一下吧`,
      'success'
    );

    const newState = {
      isRunning: false,
      timeLeft: nextDuration * 60,
      isWorkSession: isNextWork,
      sessionsCompleted: newSessionsCompleted,
      endTime: 0,
    };

    setState(newState);
    saveStoredState({
      isRunning: false,
      endTime: 0,
      isWorkSession: isNextWork,
      sessionsCompleted: newSessionsCompleted,
      pausedTimeLeft: nextDuration * 60,
    });
  }, [state.isWorkSession, state.sessionsCompleted, workDuration, breakDuration, showToast]);

  // 定时器
  useEffect(() => {
    if (!state.isRunning) return;

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((state.endTime - Date.now()) / 1000));

      if (remaining <= 0 && !hasNotifiedRef.current) {
        hasNotifiedRef.current = true;
        handleTimerComplete();
      } else if (remaining > 0) {
        setState(prev => ({ ...prev, timeLeft: remaining }));
      }
    }, TIMER_INTERVAL);

    return () => clearInterval(timer);
  }, [state.isRunning, state.endTime, handleTimerComplete]);

  // 重置通知标记
  useEffect(() => {
    if (state.timeLeft > 0) {
      hasNotifiedRef.current = false;
    }
  }, [state.timeLeft]);

  // 操作函数 - 使用 useCallback 避免子组件重新渲染
  const toggleTimer = useCallback(() => {
    if (state.isRunning) {
      // 暂停
      setState(prev => ({ ...prev, isRunning: false, endTime: 0 }));
      saveStoredState({
        isRunning: false,
        endTime: 0,
        isWorkSession: state.isWorkSession,
        sessionsCompleted: state.sessionsCompleted,
        pausedTimeLeft: state.timeLeft,
      });
    } else {
      // 开始
      const endTime = Date.now() + state.timeLeft * 1000;
      setState(prev => ({ ...prev, isRunning: true, endTime }));
      saveStoredState({
        isRunning: true,
        endTime,
        isWorkSession: state.isWorkSession,
        sessionsCompleted: state.sessionsCompleted,
        pausedTimeLeft: state.timeLeft,
      });
    }
  }, [state.isRunning, state.timeLeft, state.isWorkSession, state.sessionsCompleted]);

  const resetTimer = useCallback(() => {
    const duration = state.isWorkSession ? workDuration : breakDuration;
    setState(prev => ({
      ...prev,
      isRunning: false,
      timeLeft: duration * 60,
      endTime: 0,
    }));
    saveStoredState({
      isRunning: false,
      endTime: 0,
      isWorkSession: state.isWorkSession,
      sessionsCompleted: state.sessionsCompleted,
      pausedTimeLeft: duration * 60,
    });
  }, [state.isWorkSession, state.sessionsCompleted, workDuration, breakDuration]);

  const skipSession = useCallback(() => {
    const isNextWork = !state.isWorkSession;
    const nextDuration = isNextWork ? workDuration : breakDuration;
    const newSessionsCompleted = isNextWork ? state.sessionsCompleted + 1 : state.sessionsCompleted;

    setState({
      isRunning: false,
      timeLeft: nextDuration * 60,
      isWorkSession: isNextWork,
      sessionsCompleted: newSessionsCompleted,
      endTime: 0,
    });
    saveStoredState({
      isRunning: false,
      endTime: 0,
      isWorkSession: isNextWork,
      sessionsCompleted: newSessionsCompleted,
      pausedTimeLeft: nextDuration * 60,
    });
  }, [state.isWorkSession, state.sessionsCompleted, workDuration, breakDuration]);

  const handlePositionChange = useCallback((newPosition: PomodoroPosition) => {
    setCurrentPosition(newPosition);
    savePosition(newPosition);
    onPositionChange(newPosition);
  }, [onPositionChange]);

  const handleClose = useCallback(() => {
    updateSettings({ pomodoroPosition: currentPosition });
    onClose?.();
  }, [currentPosition, updateSettings, onClose]);

  // 使用 useMemo 缓存计算结果
  const totalSeconds = useMemo(
    () => (state.isWorkSession ? workDuration : breakDuration) * 60,
    [state.isWorkSession, workDuration, breakDuration]
  );

  const progress = useMemo(
    () => (totalSeconds - state.timeLeft) / totalSeconds,
    [totalSeconds, state.timeLeft]
  );

  const secondAngle = useMemo(
    () => ((60 - (state.timeLeft % 60)) / 60) * 360,
    [state.timeLeft]
  );

  const strokeDashoffset = useMemo(
    () => CIRCLE_LENGTH * (1 - progress),
    [progress]
  );

  const formattedTime = useMemo(
    () => formatTime(state.timeLeft),
    [state.timeLeft]
  );

  // 缓存刻度渲染
  const tickElements = useMemo(() => {
    if (showSecondTicks) {
      return TICKS_60.map((i) => (
        <div
          key={i}
          className={i % 5 === 0 ? styles.tickMajor : styles.tickMinor}
          style={{ transform: `rotate(${i * 6}deg)` }}
        />
      ));
    }
    return TICKS_12.map((i) => (
      <div
        key={i}
        className={styles.tick}
        style={{ transform: `rotate(${i * 30}deg)` }}
      />
    ));
  }, [showSecondTicks]);

  return (
    <DraggableWidget
      id="pomodoro-timer"
      title=""
      defaultPosition={currentPosition}
      onPositionChange={handlePositionChange}
      width={140}
      height={140}
      minimizable={false}
      closable={false}
      hideHeader
      transparent
    >
      <div className={`${styles.clock} ${state.isWorkSession ? styles.workMode : styles.breakMode}`}>
        {/* 关闭按钮 */}
        <button className={styles.closeBtn} onClick={handleClose} title="关闭">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* 进度环 */}
        <svg className={styles.ring} viewBox="0 0 100 100">
          <circle
            className={styles.ringBg}
            cx="50"
            cy="50"
            r="46"
            fill="none"
            strokeWidth="4"
          />
          <circle
            className={styles.ringProgress}
            cx="50"
            cy="50"
            r="46"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={CIRCLE_LENGTH}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 50 50)"
          />
        </svg>

        {/* 刻度 */}
        <div className={styles.ticks}>{tickElements}</div>

        {/* 秒针 */}
        {state.isRunning && (
          <div
            className={styles.secondHand}
            style={{ transform: `rotate(${secondAngle}deg)` }}
          />
        )}
        <div className={styles.centerDot} />

        {/* 状态 */}
        <div className={styles.status}>
          {state.isWorkSession ? '专注' : '休息'}
        </div>

        {/* 时间 */}
        <div className={styles.time}>{formattedTime}</div>

        {/* 按钮 */}
        <div className={styles.buttons}>
          <button className={styles.btn} onClick={resetTimer} title="重置">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
          <button
            className={`${styles.btn} ${styles.mainBtn}`}
            onClick={toggleTimer}
            title={state.isRunning ? '暂停' : '开始'}
          >
            {state.isRunning ? (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button className={styles.btn} onClick={skipSession} title="跳过">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
              <path d="M5 4l10 8-10 8V4z" />
              <rect x="17" y="4" width="2" height="16" />
            </svg>
          </button>
        </div>
      </div>
    </DraggableWidget>
  );
}
