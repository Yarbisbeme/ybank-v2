'use client';

import { useSyncExternalStore } from 'react';

/** Whether a CSS media query matches; false during SSR and the first hydration pass. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Tailwind `md` breakpoint: where the app switches from the mobile to the desktop layout. */
export const MD_UP = '(min-width: 768px)';
