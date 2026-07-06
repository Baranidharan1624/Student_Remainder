import { useState, useEffect } from 'react';

export function useCountdown() {
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    // Update every minute (60000 ms)
    const interval = setInterval(() => {
      setTick(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return tick;
}
