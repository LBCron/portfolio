/**
 * Placeholder art rendered by `scripts/generate-fixtures.ts` into
 * `public/fixtures/`. Abstract only: no text, logos or fake UI screenshots.
 * Authored masters (real photos) are encoded from the listed source files.
 */

export type FixtureArtStyle = 'avatar' | 'cover' | 'portrait';

export interface FixtureAuthoredSource {
  /**
   * Keep an alpha channel (lossy WebP otherwise flattens it).
   */
  alpha?: boolean;
  fit: 'cover' | 'inside';
  /**
   * Filename under `public/fixtures/images/`.
   */
  source: string;
}

export interface FixtureImageSpec {
  authored?: FixtureAuthoredSource;
  height: number;
  key: string;
  style: FixtureArtStyle;
  width: number;
}

const cover = (key: string): FixtureImageSpec => ({
  key,
  style: 'cover',
  width: 1600,
  height: 1000,
});

const avatar = (key: string): FixtureImageSpec => ({
  key,
  style: 'avatar',
  width: 256,
  height: 256,
});

export const fixtureImageSpecs = [
  {
    key: 'profile-photo',
    style: 'portrait',
    width: 800,
    height: 800,
    authored: { source: 'profile-photo.jpg', fit: 'cover' },
  },
  {
    key: 'profile-photo-lg',
    style: 'portrait',
    width: 720,
    height: 964,
    authored: {
      source: 'julio_retrato_fundo_transparente_degrade.png',
      fit: 'inside',
      alpha: true,
    },
  },
  avatar('avatar-ada-sample'),
  avatar('avatar-marco-placeholder'),
  avatar('avatar-lin-example'),
  avatar('avatar-sofia-demo'),
  cover('project-orbit-dashboard-cover'),
  cover('project-orbit-dashboard-gallery-1'),
  cover('project-orbit-dashboard-gallery-2'),
  cover('project-orbit-dashboard-gallery-3'),
  cover('project-pocket-ledger-cover'),
  cover('project-tidy-desk-cover'),
  cover('project-pay-bridge-cover'),
  cover('project-lint-kit-cover'),
] as const satisfies readonly FixtureImageSpec[];

export type FixtureImageKey = (typeof fixtureImageSpecs)[number]['key'];

export const fixturePdfKeys = ['resume-en', 'resume-pt'] as const;
export type FixturePdfKey = (typeof fixturePdfKeys)[number];
