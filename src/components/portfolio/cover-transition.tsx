import { type ReactNode, ViewTransition } from 'react';

/**
 * One name per project, so a card cover and the detail hero form a pair.
 */
export function coverTransitionName(slug: string): string {
  return `project-cover-${slug}`;
}

/**
 * Morphs a project cover between its card and the detail hero during a
 * client-side navigation (React `<ViewTransition>`, D62). `default="none"`
 * keeps it out of unrelated transitions; `share` is the only animation, and the
 * CSS for `.project-cover` lives in `globals.css` (reduced motion and Pause
 * animations make it instant). Without View Transitions support the navigation
 * simply happens; without JavaScript it is a plain link.
 *
 * The child must be a single element (the cover `img` or the generated art).
 * Every slug may appear at most once per page: duplicate names abort the
 * browser's transition.
 */
export function CoverTransition({ slug, children }: { children: ReactNode; slug: string }) {
  return (
    <ViewTransition name={coverTransitionName(slug)} share="project-cover" default="none">
      {children}
    </ViewTransition>
  );
}
