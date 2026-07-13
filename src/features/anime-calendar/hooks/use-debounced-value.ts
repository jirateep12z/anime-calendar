'use client';

import { useEffect, useState } from 'react';

export function UseDebouncedValue<Value>(
  current_value: Value,
  delay_milliseconds: number
): Value {
  const [debounced_value, set_debounced_value] = useState(current_value);

  useEffect(() => {
    const timeout_id = window.setTimeout(() => {
      set_debounced_value(current_value);
    }, delay_milliseconds);

    return () => window.clearTimeout(timeout_id);
  }, [current_value, delay_milliseconds]);

  return debounced_value;
}
