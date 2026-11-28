'use client';

/// <reference types="react/canary" />
import { ViewTransition } from 'react';

/** Name shared by the same account's card on every screen, for the view transition. */
export function sharedCardName(accountId: string): string {
  return `y2-card-${accountId}`;
}

/**
 * Lets an account card move between screens as the same object. React pairs a
 * named card leaving the old screen with one of the same name entering the new
 * screen and morphs it; without a name, or without a partner, nothing animates.
 *
 * The boundary is always rendered (only the name toggles) so marking a card does
 * not remount it.
 */
export function SharedCard({
  accountId,
  children,
}: {
  /** Account whose card this is when it should take part; null otherwise. */
  accountId: string | null;
  children: React.ReactNode;
}) {
  return (
    <ViewTransition
      name={accountId ? sharedCardName(accountId) : undefined}
      share="y2-card-share"
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
