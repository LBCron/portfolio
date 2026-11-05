'use client';

import { useServerInsertedHTML } from 'next/navigation';
import { useRef } from 'react';

import { MOTION_INIT_SCRIPT } from '@/lib/motion-init';

/**
 * D21: injects the motion-init IIFE into `<head>` through the SSR stream so it
 * runs before first paint. The client tree returns `null` — React 19 never
 * executes (or even accepts) a `<script>` created during client render.
 */
export function MotionInit(): null {
  const flushedRef = useRef(false);

  useServerInsertedHTML(() => {
    if (flushedRef.current) return null;

    flushedRef.current = true;

    // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml -- constant script, the sanctioned exception (D21)
    return <script id="motion-init" dangerouslySetInnerHTML={{ __html: MOTION_INIT_SCRIPT }} />;
  });

  return null;
}
