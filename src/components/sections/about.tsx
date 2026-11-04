import { getTranslations } from 'next-intl/server';

import { Markdown } from '@/components/markdown/markdown';
import { CountUp } from '@/components/motion/count-up';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeader } from '@/components/ui/section-header';
import { type AppLocale, localeTags } from '@/i18n/routing';
import { cn } from '@/lib/cn';
import type { Metric, Profile } from '@/lib/content';

const MAX_METRICS = 4;

function MetricValue({
  metric,
  locale,
}: {
  metric: Metric;
  locale: AppLocale;
}) {
  if (metric.countTo === undefined) return metric.value;
  return (
    <CountUp
      to={metric.countTo}
      prefix={metric.prefix}
      suffix={metric.suffix}
      localeTag={localeTags[locale]}
    />
  );
}

export async function About({
  locale,
  profile,
}: {
  locale: AppLocale;
  profile: Profile;
}) {
  const [t, tSummary, tA11y] = await Promise.all([
    getTranslations('about'),
    getTranslations('summary'),
    getTranslations('a11y'),
  ]);
  const metrics = profile.metrics.slice(0, MAX_METRICS);

  return (
    <section id="about" aria-labelledby="about-title" className="section-y">
      <div className="container-page">
        <SectionHeader
          id="about-title"
          index={1}
          eyebrow={t('eyebrow')}
          title={t('title')}
        />
        <div
          className={cn(
            metrics.length > 0 &&
              'grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:gap-16',
          )}
        >
          <Reveal className="measure">
            <Markdown
              topHeadingLevel={3}
              idPrefix="bio"
              newTabLabel={tA11y('opensInNewTab')}
              scrollRegionLabel={tA11y('scrollRegion')}
              className="text-[1.0625rem] lg:text-lg [&_p:first-child]:text-text-1"
            >
              {profile.bio}
            </Markdown>
          </Reveal>

          {metrics.length > 0 ? (
            <Reveal index={1}>
              <ul
                id="summary"
                aria-label={tSummary('metricsLabel')}
                className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-1"
              >
                {metrics.map((metric) => (
                  <li key={metric.label} className="bg-surface-1 p-5 sm:p-6">
                    <p className="text-[2rem] leading-none font-semibold tracking-tight text-text-1 tabular-nums">
                      <MetricValue metric={metric} locale={locale} />
                    </p>
                    <p className="mt-2 text-small text-text-2">
                      {metric.label}
                    </p>
                  </li>
                ))}
              </ul>
            </Reveal>
          ) : (
            <div id="summary" hidden />
          )}
        </div>
      </div>
    </section>
  );
}
