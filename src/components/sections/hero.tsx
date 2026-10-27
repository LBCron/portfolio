import { ArrowRight, FileText } from 'lucide-react';
import { getImageProps } from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { CSSProperties } from 'react';

import { LinkIcon } from '@/components/content/link-icon';
import { Monogram } from '@/components/layout/monogram';
import { HeroBackdrop } from '@/components/motion/hero-backdrop';
import { Magnetic } from '@/components/motion/magnetic';
import { RotatingWords } from '@/components/motion/rotating-words';
import { ScrollCue } from '@/components/motion/scroll-cue';
import { ButtonAnchor } from '@/components/ui/button';
import { OpenTerminalButton } from '@/components/window-manager/open-terminal-button';
import { Chip } from '@/components/ui/chip';
import { Tooltip } from '@/components/ui/tooltip';
import { owner } from '@/config/site';
import type { AppLocale } from '@/i18n/routing';
import { cn } from '@/lib/cn';
import type { Experience, FeaturedLink, Profile } from '@/lib/content';
import { formatList } from '@/lib/format';

import { externalRel } from './links';

const ACCENT_WORDS = 2;
const MAX_HERO_LINKS = 5;
const HERO_SIZES =
  '(min-width: 1440px) 504px, (min-width: 1280px) 448px, (min-width: 1024px) 360px, 96px';

interface HeroProps {
  locale: AppLocale;
  profile: Profile | null;
  links: FeaturedLink[];
  experience: Experience[];
  hasResume: boolean;
  nextSection: 'quote' | 'about' | 'stack';
}

function HeadlineWord({
  word,
  index,
  accent,
}: {
  word: string;
  index: number;
  accent: boolean;
}) {
  return (
    <span className="reveal-word">
      <span
        className={accent ? 'text-gradient' : undefined}
        style={{ '--word-index': index } as CSSProperties}
      >
        {word}
      </span>
    </span>
  );
}

function Headline({ text }: { text: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  const accentFrom = Math.max(0, words.length - ACCENT_WORDS);
  const lead = words.slice(0, accentFrom);
  const accent = words.slice(accentFrom);

  return (
    <>
      {lead.length > 0 ? (
        <span>
          {lead.map((word, index) => (
            <span key={`${word}-${index}`}>
              {index > 0 ? ' ' : null}
              <HeadlineWord word={word} index={index} accent={false} />
            </span>
          ))}
        </span>
      ) : null}
      {lead.length > 0 && accent.length > 0 ? ' ' : null}
      {accent.length > 0 ? (
        <span className="lg:whitespace-nowrap">
          {accent.map((word, index) => (
            <span key={`${word}-${accentFrom + index}`}>
              {index > 0 ? ' ' : null}
              <HeadlineWord word={word} index={accentFrom + index} accent />
            </span>
          ))}
        </span>
      ) : null}
    </>
  );
}

export async function Hero({
  locale,
  profile,
  links,
  experience,
  hasResume,
  nextSection,
}: HeroProps) {
  const [t, tA11y] = await Promise.all([
    getTranslations('hero'),
    getTranslations('a11y'),
  ]);
  const headline = profile?.heroHeadline ?? owner.name;
  const words = profile?.rotatingWords ?? [];
  const heroLinks = links
    .filter((link) => link.placements.includes('hero'))
    .slice(0, MAX_HERO_LINKS);
  const current = experience
    .flatMap((entry) =>
      entry.roles
        .filter((role) => !role.end)
        .map((role) => ({ title: role.title, company: entry.company })),
    )
    .at(0);
  const photo = profile?.photo;
  const photoLg = profile?.photoLg ?? photo;

  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100svh] flex-col"
    >
      <HeroBackdrop />
      <div className="container-page grid flex-1 items-center gap-10 pt-[calc(var(--header-height)+3rem)] pb-24 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-10 xl:gap-12">
        <div className="lg:order-last">
          <Portrait
            photo={photo}
            photoLg={photoLg}
            role={t('eyebrow', {
              jobTitle: profile?.jobTitle ?? owner.jobTitle,
            })}
          />
        </div>
        <div className="min-w-0">
          <h1
            id="hero-title"
            className="max-w-[17ch] text-display lg:max-w-none lg:text-[clamp(2.75rem,1.8rem+2.8vw,5rem)]"
          >
            <Headline text={headline} />
          </h1>

          {words.length > 0 ? (
            <p className="mt-6 text-h3 font-medium text-text-1">
              <span className="sr-only">
                {t('rotatingSentence', { list: formatList(locale, words) })}
              </span>
              <span aria-hidden="true">{t('rotatingPrefix')} </span>
              <RotatingWords words={words} />
            </p>
          ) : null}

          {profile?.heroLead ? (
            <p className="mt-5 max-w-[60ch] text-[1.0625rem] text-text-2 lg:text-lg">
              {profile.heroLead}
            </p>
          ) : null}

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Magnetic>
              <ButtonAnchor href="#work">
                {t('seeWork')}
                <ArrowRight
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover/button:translate-x-0.5"
                />
              </ButtonAnchor>
            </Magnetic>
            <ButtonAnchor href="#contact" variant="secondary">
              {t('getInTouch')}
            </ButtonAnchor>
            {hasResume ? (
              <a
                href={`/${locale}/resume`}
                className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-small text-text-2 underline-offset-4 hover-fine:text-text-1 hover-fine:underline"
              >
                <FileText aria-hidden="true" className="size-4" />
                {t('resume')}
              </a>
            ) : null}
            <OpenTerminalButton label={t('openTerminal')} />
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-4">
            {heroLinks.length > 0 ? (
              <ul
                aria-label={t('linksLabel')}
                className="flex items-center gap-1"
              >
                {heroLinks.map((link) => (
                  <li key={link.id}>
                    <Tooltip content={link.label} side="bottom">
                      <a
                        href={link.url}
                        target="_blank"
                        rel={externalRel(link.isOwnProfile)}
                        aria-label={`${link.label} ${tA11y('opensInNewTab')}`}
                        className="inline-flex size-11 items-center justify-center rounded-full border border-line text-text-2 transition-colors hover-fine:border-line-strong hover-fine:bg-surface-1 hover-fine:text-text-1"
                      >
                        <LinkIcon
                          icon={link.icon}
                          className="size-[1.125rem]"
                        />
                      </a>
                    </Tooltip>
                  </li>
                ))}
              </ul>
            ) : null}
            {current ? (
              <p className="inline-flex items-center gap-2 font-mono text-[0.8125rem] text-text-2">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-term-green shadow-[0_0_10px_rgb(74_222_128/0.6)]"
                />
                {t('currentRole', current)}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 md:block">
        <ScrollCue href={`#${nextSection}`} label={t('scrollCue')} />
      </div>
    </section>
  );
}

function RoleCallout({ title }: { title: string }) {
  return (
    <div className="pointer-events-none absolute top-[6%] left-[22%] z-[2] hidden lg:block">
      <span
        aria-hidden="true"
        className="absolute top-1/2 left-0 h-px w-28 origin-left -translate-y-1/2 rotate-[14deg] bg-gradient-to-r from-line-strong to-transparent"
      />
      <Chip className="absolute top-1/2 right-full -translate-y-1/2 whitespace-nowrap">
        {title}
      </Chip>
    </div>
  );
}

function Portrait({
  photo,
  photoLg,
  role,
}: {
  photo: Profile['photo'];
  photoLg: Profile['photoLg'];
  role: string;
}) {
  const frameClass = cn(
    'relative shrink-0',
    'size-24 overflow-hidden rounded-lg p-[2px] shadow-[0_20px_60px_-20px_rgb(139_124_255/0.55)] max-lg:bg-gradient-accent',
    'lg:aspect-[3/4] lg:h-auto lg:w-[clamp(18rem,min(35vw,calc((100svh-var(--header-height)-9rem)*0.75)),31.5rem)] lg:overflow-visible lg:rounded-none lg:p-0 lg:shadow-none',
  );

  if (!photo) {
    return (
      <div className={frameClass}>
        <div className="relative z-[1] flex size-full items-center justify-center rounded-[inherit] bg-surface-1 lg:bg-transparent">
          <Monogram className="size-1/2" />
        </div>
        <RoleCallout title={role} />
      </div>
    );
  }

  const desktop = photoLg ?? photo;
  const common = {
    alt: photo.alt,
    sizes: HERO_SIZES,
    priority: true,
  } as const;

  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({
    ...common,
    src: desktop.url,
    width: desktop.width,
    height: desktop.height,
  });

  const {
    props: { srcSet: mobileSrcSet, ...img },
  } = getImageProps({
    ...common,
    src: photo.url,
    width: photo.width,
    height: photo.height,
  });

  const objectPosition = photo.focal
    ? `${photo.focal.x * 100}% ${photo.focal.y * 100}%`
    : undefined;

  return (
    <div className={frameClass}>
      <div
        className={cn(
          'relative size-full overflow-hidden rounded-[inherit] bg-surface-1',
          'max-lg:[background-image:var(--portrait-lqip)] max-lg:bg-cover max-lg:[background-position:var(--portrait-focal)]',
          'lg:overflow-visible lg:rounded-none lg:bg-transparent',
        )}
        style={
          photo.lqip
            ? ({
                '--portrait-lqip': `url(${photo.lqip})`,
                '--portrait-focal': objectPosition ?? 'center',
              } as CSSProperties)
            : undefined
        }
      >
        <picture>
          <source media="(min-width: 1024px)" srcSet={desktopSrcSet} />
          <source media="(max-width: 1023px)" srcSet={mobileSrcSet} />
          <img
            {...img}
            alt={photo.alt}
            className={cn(
              'relative z-[1] size-full object-cover max-lg:[object-position:var(--portrait-focal,center)]',
              'lg:object-contain lg:object-bottom',
              img.className,
            )}
            style={{
              ...img.style,
              width: '100%',
              height: '100%',
            }}
          />
        </picture>
        <RoleCallout title={role} />
      </div>
    </div>
  );
}
