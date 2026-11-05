import { useEffect, useState } from 'react';

/**
 * Tracks which section sits in the reading band of the viewport. Only the
 * sections that exist on the page are observed.
 */
export function useActiveSection(ids: readonly string[], enabled: boolean): null | string {
  const [active, setActive] = useState<null | string>(null);

  useEffect(() => {
    if (!enabled) return;

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );

    elements.forEach((element) => observer.observe(element));

    const onScroll = (): void => {
      if (window.scrollY < 80) setActive(null);
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return (): void => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [ids, enabled]);

  return enabled ? active : null;
}
