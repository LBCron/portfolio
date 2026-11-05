import { ArrowLeft } from 'lucide-react';

interface NotFoundViewProps {
  homeHref: string;
  homeLabel: string;
  prompt: string;
  text: string;
  title: string;
}

/**
 * Terminal-flavored 404 body shared by the localized and global pages.
 */
export function NotFoundView({ title, text, prompt, homeHref, homeLabel }: NotFoundViewProps) {
  return (
    <section className="container-page flex min-h-[70dvh] flex-col justify-center py-32">
      <p className="mb-6 font-mono text-small break-all text-term-green">{prompt}</p>
      <h1 className="text-h2">{title}</h1>
      <p className="mt-4 measure text-text-2">{text}</p>
      <p className="mt-10">
        <a
          href={homeHref}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-text-1 px-6 text-small font-medium text-bg-0"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {homeLabel}
        </a>
      </p>
    </section>
  );
}
