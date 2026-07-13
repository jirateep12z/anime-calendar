import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768;

export function UseIsMobile() {
  const [is_mobile, set_is_mobile] = useState<boolean | undefined>(() => {
    if (typeof window === 'undefined') return undefined;

    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      set_is_mobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    mql.addEventListener('change', onChange);

    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!is_mobile;
}
