'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { ErrorBoundary } from '@/components/ui/error-boundary';
import { cn } from '@/lib/cn';
import { techCategories, type TechCategory } from '@/lib/content/taxonomy';
import type { Practice } from '@/lib/content/types';
import { useReducedMotionPreference } from '@/lib/motion-preference';

import type { CloudTech } from './geoid-sphere';
import { StackList } from './stack-list';
import { geoidStageClassName } from './stage';
import type { StackTech } from './types';

const GeoidSphere = dynamic(
  () => import('./geoid-sphere').then((module) => module.GeoidSphere),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        className={`${geoidStageClassName} rounded-[50%] bg-surface-1/40`}
      />
    ),
  },
);

function toCloudTech(tech: StackTech): CloudTech {
  return {
    id: tech.id,
    name: tech.name,
    category: tech.category,
    icon: tech.icon,
    brandColor: tech.brandColor,
    url: tech.url,
    priority: tech.priority,
  };
}

function useMobileCull(technologies: CloudTech[]) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => setNarrow(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return useMemo(() => {
    if (!narrow) return technologies;
    return technologies.filter((tech) => tech.priority <= 2);
  }, [narrow, technologies]);
}

export function TechCloudShell({
  technologies,
  practices,
}: {
  technologies: StackTech[];
  practices: Practice[];
}) {
  const t = useTranslations('stack');
  const reduced = useReducedMotionPreference();
  const isClient = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const [failed, setFailed] = useState(false);
  const [category, setCategory] = useState<TechCategory | null>(null);
  const [selected, setSelected] = useState<CloudTech | null>(null);
  const [near, setNear] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const showCloud = isClient && !reduced && !failed;

  const cloudTechs = useMemo(
    () => technologies.map(toCloudTech),
    [technologies],
  );
  const visibleCloud = useMobileCull(cloudTechs);

  const categoryLabels = Object.fromEntries(
    techCategories.map((key) => [key, t(`categories.${key}`)]),
  ) as Record<TechCategory, string>;

  const announced =
    selected && (!category || selected.category === category) ? selected : null;

  useEffect(() => {
    if (!selected) return;
    const timer = window.setTimeout(() => setSelected(null), 2500);
    return () => window.clearTimeout(timer);
  }, [selected]);

  useEffect(() => {
    if (!showCloud || near) return;
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: '300px' },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [showCloud, near]);

  const counts = useMemo(() => {
    const map = new Map<TechCategory, number>();
    for (const tech of visibleCloud) {
      map.set(tech.category, (map.get(tech.category) ?? 0) + 1);
    }
    return map;
  }, [visibleCloud]);

  const list = (
    <StackList
      technologies={technologies}
      practices={practices}
      categoryLabels={categoryLabels}
      practicesTitle={t('practicesTitle')}
    />
  );

  const chips = showCloud ? (
    <div
      role="toolbar"
      aria-label={t('filterLabel')}
      className="flex flex-wrap items-center justify-center gap-2"
    >
      {techCategories.map((key) => {
        const count = counts.get(key) ?? 0;
        if (count === 0) return null;
        const active = category === key;
        const label = categoryLabels[key];
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            aria-label={t('filterChip', { category: label, count })}
            onClick={() => setCategory(active ? null : key)}
            className={cn(
              'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3 text-small transition-colors',
              active
                ? 'border-accent-2/50 bg-accent-2/10 text-text-1'
                : 'border-line text-text-2 hover-fine:border-line-strong hover-fine:text-text-1',
            )}
          >
            {label}{' '}
            <span aria-hidden="true" className="text-text-3 tabular-nums">
              {count}
            </span>
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <div className="space-y-8">
      {chips ? <div className="container-page">{chips}</div> : null}

      {showCloud ? (
        <>
          <div ref={hostRef}>
            {near ? (
              <ErrorBoundary
                fallback={<div className="container-page">{list}</div>}
                onError={() => setFailed(true)}
              >
                <GeoidSphere
                  technologies={visibleCloud}
                  activeCategory={category}
                  paused={reduced}
                  selectedId={announced?.id ?? null}
                  onSelect={setSelected}
                />
              </ErrorBoundary>
            ) : (
              <div
                aria-hidden="true"
                className={`${geoidStageClassName} rounded-[50%] bg-surface-1/40`}
              />
            )}
          </div>

          <div
            aria-live="polite"
            className="container-page text-center text-small text-text-2"
          >
            {announced ? (
              <p>
                <span className="text-text-1">{announced.name}</span>
                <span className="text-text-3">
                  {' '}
                  · {categoryLabels[announced.category]}
                </span>
                {announced.url ? (
                  <>
                    {' '}
                    <a
                      href={announced.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-2 underline-offset-4 hover-fine:underline"
                    >
                      {t('officialSite')}
                    </a>
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <div className="container-page">{list}</div>
      )}
    </div>
  );
}
