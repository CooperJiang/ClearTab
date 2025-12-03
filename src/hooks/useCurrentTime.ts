import { useState, useEffect } from 'react';

export function useCurrentTime(showSeconds: boolean = false) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // 如果显示秒，每秒更新；否则每分钟更新
    const interval = showSeconds ? 1000 : 1000;
    const timer = setInterval(() => {
      setTime(new Date());
    }, interval);

    return () => clearInterval(timer);
  }, [showSeconds]);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const timeString = showSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;

  // 简洁的日期格式：12月2日 星期二
  const month = time.getMonth() + 1;
  const day = time.getDate();
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekday = weekdays[time.getDay()];
  const dateString = `${month}月${day}日 ${weekday}`;

  return { time, timeString, dateString };
}
