import { type Dispatch, useEffect, useRef, useState } from 'react';

export const useCountDown = (time: number): [boolean, Dispatch<boolean>] => {
  const [isCountdown, setIsCountdown] = useState(false);
  const [countdown, setCountDown] = useState(time || 0);
  const timerRef = useRef<any>();

  useEffect(() => {
    if (isCountdown) {
      timerRef.current = setTimeout(() => {
        if (countdown === 1) {
          setIsCountdown(false);
          return clearTimeout(timerRef.current);
        }

        setCountDown(countdown - 1);
      }, 1000);
    }

    return () => {
      timerRef?.current && clearTimeout(timerRef.current);
    };
  }, [isCountdown, countdown]);

  return [isCountdown, setIsCountdown];
};
