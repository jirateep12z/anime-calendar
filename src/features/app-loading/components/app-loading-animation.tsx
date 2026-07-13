'use client';

import type { CSSProperties } from 'react';

const LOADING_DOT_INDEXES = [0, 1, 2] as const;

export function AppLoadingAnimation() {
  return (
    <div
      className="app-loading-content flex flex-col items-center gap-6"
      role="status"
      aria-live="polite"
      aria-label="กำลังโหลด"
    >
      <div className="flex items-center gap-3" aria-hidden="true">
        {LOADING_DOT_INDEXES.map(dot_index => (
          <span
            key={dot_index}
            style={{ '--loading-dot-index': dot_index } as CSSProperties}
            className="app-loading-dot bg-foreground size-4 rounded-xl"
          />
        ))}
      </div>
      <p className="app-loading-label text-foreground text-lg font-medium">
        กำลังโหลด
        {LOADING_DOT_INDEXES.map(dot_index => (
          <span
            key={dot_index}
            style={{ '--loading-dot-index': dot_index } as CSSProperties}
            className="app-loading-label-dot"
            aria-hidden="true"
          >
            .
          </span>
        ))}
      </p>
    </div>
  );
}
