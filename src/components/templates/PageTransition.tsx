'use client';

/// <reference types="react/canary" />
import { ViewTransition } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Animates the page content when the route changes, so a navigation reads as a
 * move instead of an abrupt swap. The shell (sidebar, navbar) stays still to
 * keep the user's bearings.
 *
 * Keyed by pathname only: query-string changes on the same page (for example
 * ?accountId= while swiping cards on /accounts) are updates, and update="none"
 * keeps them from animating the whole page.
 *
 * Uses the browser View Transitions API through React; where it is unsupported
 * the page simply swaps as before.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ViewTransition
      key={pathname}
      enter="y2-page-enter"
      exit="y2-page-exit"
      update="none"
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
