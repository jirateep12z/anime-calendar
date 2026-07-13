'use client';

import { useEffect, useState } from 'react';

const TOP_REVEAL_OFFSET_PIXELS = 64;
const END_HIDE_OFFSET_PIXELS = 112;
const SCROLL_DELTA_THRESHOLD_PIXELS = 8;

interface ScrollPosition {
  readonly current_scroll_y: number;
  readonly max_scroll_y: number;
}

function ReadScrollPosition(): ScrollPosition {
  const max_scroll_y = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight
  );
  const current_scroll_y = Math.min(Math.max(window.scrollY, 0), max_scroll_y);

  return { current_scroll_y, max_scroll_y };
}

export function UseScrollHidden(): boolean {
  const [is_scroll_hidden, set_is_scroll_hidden] = useState(false);

  useEffect(() => {
    let anchor_scroll_y = ReadScrollPosition().current_scroll_y;
    let pending_frame_id: number | null = null;

    const UpdateScrollHidden = () => {
      pending_frame_id = null;
      const { current_scroll_y, max_scroll_y } = ReadScrollPosition();

      if (current_scroll_y <= TOP_REVEAL_OFFSET_PIXELS) {
        anchor_scroll_y = current_scroll_y;
        set_is_scroll_hidden(false);

        return;
      }

      if (max_scroll_y - current_scroll_y <= END_HIDE_OFFSET_PIXELS) {
        anchor_scroll_y = current_scroll_y;
        set_is_scroll_hidden(true);

        return;
      }

      const scroll_delta_pixels = current_scroll_y - anchor_scroll_y;

      if (Math.abs(scroll_delta_pixels) < SCROLL_DELTA_THRESHOLD_PIXELS) return;

      anchor_scroll_y = current_scroll_y;
      set_is_scroll_hidden(scroll_delta_pixels > 0);
    };

    const HandleWindowScroll = () => {
      if (pending_frame_id !== null) return;

      pending_frame_id = window.requestAnimationFrame(UpdateScrollHidden);
    };

    window.addEventListener('scroll', HandleWindowScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', HandleWindowScroll);

      if (pending_frame_id !== null) {
        window.cancelAnimationFrame(pending_frame_id);
      }
    };
  }, []);

  return is_scroll_hidden;
}
