'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import type { GalleryImage } from '@/lib/content';

interface GalleryProps {
  images: readonly GalleryImage[];
}

export function Gallery({ images }: GalleryProps) {
  const t = useTranslations('project');
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchStart = useRef<number | null>(null);
  const [index, setIndex] = useState<number | null>(null);
  const current = index === null ? undefined : images[index];

  const close = useCallback(() => setIndex(null), []);
  const show = useCallback(
    (next: number) => setIndex((next + images.length) % images.length),
    [images.length],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (index !== null && !dialog.open) dialog.showModal();
    if (index === null && dialog.open) dialog.close();
  }, [index]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClick = (event: MouseEvent) => {
      if (event.target === dialog) close();
    };
    dialog.addEventListener('click', onClick);
    return () => dialog.removeEventListener('click', onClick);
  }, [close]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') show(index + 1);
      if (event.key === 'ArrowLeft') show(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, show]);

  if (images.length === 0) return null;

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2">
        {images.map((image, imageIndex) => (
          <li key={image.url}>
            <button
              type="button"
              onClick={() => setIndex(imageIndex)}
              aria-label={t('openImage', {
                index: imageIndex + 1,
                total: images.length,
                // The visible caption must be part of the name (WCAG 2.5.3).
                alt: image.caption
                  ? `${image.alt}. ${image.caption}`
                  : image.alt,
              })}
              className="group relative block w-full overflow-hidden rounded-md border border-line text-left"
            >
              <Image
                src={image.url}
                width={image.width}
                height={image.height}
                alt={image.alt}
                sizes="(min-width: 1024px) 360px, 100vw"
                placeholder={image.lqip ? 'blur' : 'empty'}
                blurDataURL={image.lqip}
                className="aspect-[16/10] h-auto w-full object-cover transition-transform duration-500 ease-out-expo group-hover:scale-[1.03]"
              />
              {image.caption ? (
                <span className="absolute inset-x-0 bottom-0 bg-bg-0/70 px-3 py-2 text-small text-text-1">
                  {image.caption}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={close}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onTouchStart={(event) => {
          touchStart.current = event.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          const end = event.changedTouches[0]?.clientX;
          touchStart.current = null;
          if (start === null || end === undefined || index === null) return;
          const delta = end - start;
          if (delta > 40) show(index - 1);
          if (delta < -40) show(index + 1);
        }}
        className="m-auto max-h-[min(92dvh,56rem)] w-[min(64rem,calc(100%-1.5rem))] rounded-xl border border-line-strong bg-bg-0 p-0 text-text-1 shadow-(--shadow-window) backdrop:bg-black/80"
      >
        {current ? (
          <figure className="relative">
            <h2 id={titleId} className="sr-only">
              {current.alt}
            </h2>
            <Image
              src={current.url}
              width={current.width}
              height={current.height}
              alt={current.alt}
              sizes="90vw"
              placeholder={current.lqip ? 'blur' : 'empty'}
              blurDataURL={current.lqip}
              className="max-h-[min(80dvh,42rem)] w-full object-contain"
            />
            {current.caption ? (
              <figcaption className="px-6 py-4 text-small text-text-2">
                {current.caption}
              </figcaption>
            ) : null}
            <p className="px-6 pb-4 font-mono text-[0.75rem] text-text-3">
              {t('imageCounter', {
                index: (index ?? 0) + 1,
                total: images.length,
              })}
            </p>
            <button
              type="button"
              onClick={close}
              aria-label={t('closeImage')}
              className="absolute top-3 right-3 inline-flex size-11 items-center justify-center rounded-full bg-bg-0/80 text-text-1"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => index !== null && show(index - 1)}
                  aria-label={t('previousImage')}
                  className="absolute top-1/2 left-3 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-bg-0/80 text-text-1"
                >
                  <ChevronLeft aria-hidden="true" className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => index !== null && show(index + 1)}
                  aria-label={t('nextImage')}
                  className="absolute top-1/2 right-3 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-bg-0/80 text-text-1"
                >
                  <ChevronRight aria-hidden="true" className="size-5" />
                </button>
              </>
            ) : null}
          </figure>
        ) : null}
      </dialog>
    </>
  );
}
