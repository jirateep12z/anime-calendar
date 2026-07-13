'use client';

import { useCallback } from 'react';

import type { RefCallback } from 'react';

const LAYOUT_CHANGING_ATTRIBUTE = 'data-layout-changing';
const SUPPRESSED_FRAME_COUNT = 2;

/**
 * Returns a callback ref that marks the element with
 * `data-layout-changing="true"` for a few frames whenever the media query
 * match changes, so styles can disable transitions and the element jumps
 * straight to its new layout instead of animating.
 */
export function UseLayoutChangeTransitionSuppression<
  ElementType extends HTMLElement
>(media_query: string): RefCallback<ElementType> {
  return useCallback(
    (element: ElementType | null) => {
      if (!element) return;

      const media_query_list = window.matchMedia(media_query);
      let pending_frame_id: number | null = null;

      const CancelPendingFrame = () => {
        if (pending_frame_id === null) return;

        window.cancelAnimationFrame(pending_frame_id);
        pending_frame_id = null;
      };

      const ReleaseAfterFrames = (remaining_frame_count: number) => {
        pending_frame_id = window.requestAnimationFrame(() => {
          if (remaining_frame_count > 1) {
            ReleaseAfterFrames(remaining_frame_count - 1);

            return;
          }

          pending_frame_id = null;
          element.removeAttribute(LAYOUT_CHANGING_ATTRIBUTE);
        });
      };

      const HandleMediaQueryChange = () => {
        CancelPendingFrame();
        element.setAttribute(LAYOUT_CHANGING_ATTRIBUTE, 'true');
        ReleaseAfterFrames(SUPPRESSED_FRAME_COUNT);
      };

      media_query_list.addEventListener('change', HandleMediaQueryChange);

      return () => {
        media_query_list.removeEventListener('change', HandleMediaQueryChange);
        CancelPendingFrame();
        element.removeAttribute(LAYOUT_CHANGING_ATTRIBUTE);
      };
    },
    [media_query]
  );
}
