import { ArrowUpRight, CalendarDays, FileText, Phone } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { LinkIcon } from '@/components/content/link-icon';
import { SectionHeader } from '@/components/ui/section-header';
import { type AppLocale, localeTags, routing } from '@/i18n/routing';
import { type Contact as ContactData, type FeaturedLink, type Resume } from '@/lib/content';

import { EmailActions } from './email-actions';
import { externalRel } from './links';

interface ContactProps {
  contact: ContactData | null;
  links: FeaturedLink[];
  locale: AppLocale;
  resume: null | Resume;
}

const linkClass =
  'inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-small text-text-1 transition-colors hover-fine:border-line-strong hover-fine:bg-surface-1';

export async function Contact({ locale, contact, links, resume }: ContactProps) {
  const [t, tA11y, tHeader] = await Promise.all([
    getTranslations('contact'),
    getTranslations('a11y'),
    getTranslations('header'),
  ]);
  const contactLinks = links.filter((link) => link.placements.includes('contact'));
  const resumeLocales = [locale, ...routing.locales.filter((other) => other !== locale)].filter(
    (candidate) => resume?.files[candidate],
  );
  const [user = '', domain = ''] = contact?.email.split('@') ?? [];
  const obfuscated = `${user} [${t('emailAt')}] ${domain.replaceAll('.', ` [${t('emailDot')}] `)}`;

  return (
    <section id="contact" aria-labelledby="contact-title" className="section-y">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-xl border border-line bg-surface-1 px-6 py-12 shadow-(--shadow-card-inset) sm:px-10 md:px-14 md:py-16">
          <div
            aria-hidden="true"
            className="decorative pointer-events-none absolute -top-40 -right-32 size-[28rem] rounded-full bg-[radial-gradient(circle,rgb(139_124_255/0.22),transparent_65%)]"
          />
          <SectionHeader
            id="contact-title"
            index={5}
            eyebrow={t('eyebrow')}
            title={contact?.ctaHeading ?? t('fallbackHeading')}
            lead={contact?.ctaText ?? t('fallbackText')}
            className="mb-10 md:mb-12"
          />

          {contact ? (
            <div>
              <p className="sr-only">{t('email')}</p>
              <EmailActions
                user={user}
                domain={domain}
                labels={{
                  copy: t('copyEmail'),
                  copied: t('copied'),
                  copyFailed: t('copyFailed'),
                }}
              />
              <noscript>
                <p className="font-mono text-lg text-text-1">{obfuscated}</p>
              </noscript>
            </div>
          ) : null}

          <ul className="mt-8 flex flex-wrap gap-2">
            {resumeLocales.map((fileLocale, index) => (
              <li key={fileLocale}>
                <a
                  href={`/${fileLocale}/resume`}
                  hrefLang={localeTags[fileLocale]}
                  className={linkClass}
                >
                  <FileText aria-hidden="true" className="size-4" />
                  {index === 0 ? (
                    t('resume')
                  ) : (
                    <span>
                      {t.rich('resumeOther', {
                        language: tHeader(`languageNames.${fileLocale}`),
                        lang: (chunks) => <span lang={localeTags[fileLocale]}>{chunks}</span>,
                      })}
                    </span>
                  )}
                </a>
              </li>
            ))}
            {contact?.bookingUrl ? (
              <li>
                <a
                  href={contact.bookingUrl}
                  target="_blank"
                  rel={externalRel()}
                  aria-label={t('bookingLabel')}
                  className={linkClass}
                >
                  <CalendarDays aria-hidden="true" className="size-4" />
                  {t('booking')}
                </a>
              </li>
            ) : null}
            {contact?.phone ? (
              <li>
                <a href={`tel:${contact.phone}`} className={linkClass}>
                  <Phone aria-hidden="true" className="size-4" />
                  {t('phone', { phone: contact.phone })}
                </a>
              </li>
            ) : null}
          </ul>

          {contactLinks.length > 0 ? (
            <div className="mt-10 border-t border-line pt-8">
              <h3 className="font-label text-text-3">{t('linksLabel')}</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {contactLinks.map((link) => {
                  const external = !link.url.startsWith('mailto:');

                  return (
                    <li key={link.id}>
                      <a
                        href={link.url}
                        target={external ? '_blank' : undefined}
                        rel={external ? externalRel(link.isOwnProfile) : undefined}
                        className={linkClass}
                      >
                        <LinkIcon icon={link.icon} />
                        {link.label}
                        {external ? (
                          <>
                            <ArrowUpRight aria-hidden="true" className="size-3.5 text-text-3" />
                            <span className="sr-only"> {tA11y('opensInNewTab')}</span>
                          </>
                        ) : null}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
