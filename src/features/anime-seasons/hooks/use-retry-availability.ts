'use client';

import { useEffect, useState } from 'react';

const MAXIMUM_TIMER_DELAY_MILLISECONDS = 2_147_483_647;

export function UseRetryAvailability(
  retry_at_milliseconds: number | null
): boolean {
  const [expired_deadline, set_expired_deadline] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (retry_at_milliseconds === null) return;

    let timer: ReturnType<typeof setTimeout>;
    const CheckDeadline = () => {
      const remaining_milliseconds = retry_at_milliseconds - Date.now();

      if (remaining_milliseconds <= 0) {
        set_expired_deadline(retry_at_milliseconds);

        return;
      }

      timer = setTimeout(
        CheckDeadline,
        Math.min(remaining_milliseconds, MAXIMUM_TIMER_DELAY_MILLISECONDS)
      );
    };

    timer = setTimeout(CheckDeadline, 0);

    return () => clearTimeout(timer);
  }, [retry_at_milliseconds]);

  return (
    retry_at_milliseconds === null || expired_deadline === retry_at_milliseconds
  );
}
