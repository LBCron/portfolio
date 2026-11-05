import { ArrowUpRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';

import { cardSurface } from '@/components/ui/card-styles';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeader } from '@/components/ui/section-header';
import { cn } from '@/lib/cn';
import { type RecommendedProfile } from '@/lib/content';

import { externalRel } from './links';

/**
 * "Worth following": hidden when no profile is visible.
 */
export async function Recommended({
  profiles,
}: {
  profiles: RecommendedProfile[];
}): Promise<null | React.JSX.Element> {
  if (profiles.length === 0) return null;

  const t = await getTranslations('recommended');

  return (
    <section id="recommended" aria-labelledby="recommended-title" className="section-y">
      <div className="container-page">
        <SectionHeader
          id="recommended-title"
          index={6}
          eyebrow={t('eyebrow')}
          title={t('title')}
          lead={t('lead')}
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((person, index) => (
            <li key={person.id}>
              <Reveal index={index % 3} className={cn(cardSurface, 'flex h-full flex-col p-5')}>
                <div className="flex items-center gap-4">
                  {person.avatar ? (
                    <Image
                      src={person.avatar.url}
                      width={person.avatar.width}
                      height={person.avatar.height}
                      alt=""
                      sizes="56px"
                      placeholder={person.avatar.lqip ? 'blur' : 'empty'}
                      blurDataURL={person.avatar.lqip}
                      className="size-14 shrink-0 rounded-full border border-line-strong object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex size-14 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface-2 font-mono text-text-1"
                    >
                      {person.name.charAt(0)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-semibold text-text-1">{person.name}</h3>
                    <p className="text-small text-text-2">{person.role}</p>
                  </div>
                </div>
                <p className="mt-4 text-[0.9375rem] text-text-2">{person.note}</p>
                <a
                  href={person.url}
                  target="_blank"
                  rel={externalRel()}
                  aria-label={t('visitLabel', { name: person.name })}
                  className="mt-auto inline-flex min-h-11 items-center gap-1.5 self-start pt-4 text-small text-text-1 underline-offset-4 hover-fine:underline"
                >
                  {t('visit')}
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </a>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
