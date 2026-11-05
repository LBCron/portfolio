'use client';

import { LazyMotion, MotionConfig } from 'motion/react';
import { type ReactNode } from 'react';

import { useMotionPaused } from '@/lib/motion-preference';

const loadFeatures = () => import('./motion-features').then((module) => module.domAnimation);

export function MotionProvider({ children }: { children: ReactNode }) {
  const paused = useMotionPaused();

  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion={paused ? 'always' : 'user'}>{children}</MotionConfig>
    </LazyMotion>
  );
}
