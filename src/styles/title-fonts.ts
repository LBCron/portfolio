import {
  Amita,
  Courgette,
  Euphoria_Script,
  Kaushan_Script,
  Lobster,
  Pacifico,
  Princess_Sofia,
  Redressed,
  Rock_Salt,
  Sacramento,
} from 'next/font/google';

/**
 * Hero title fonts (D67), self-hosted at build time. `preload: false` keeps
 * the browser from fetching all ten: only the chosen font's variable is used
 * by rendered text (the hero H1), so only its file is requested (after first paint, with the
 * size-adjusted fallback in between). Loaders must be module-level consts.
 */
const amita = Amita({
  variable: '--font-title-amita',
  weight: '400',
  display: 'swap',
  preload: false,
  subsets: ['latin', 'latin-ext'],
});
const courgette = Courgette({
  variable: '--font-title-courgette',
  weight: '400',
  display: 'swap',
  preload: false,
  subsets: ['latin', 'latin-ext'],
});
const euphoria_script = Euphoria_Script({
  variable: '--font-title-euphoria-script',
  weight: '400',
  display: 'swap',
  preload: false,
  subsets: ['latin', 'latin-ext'],
});
const kaushan_script = Kaushan_Script({
  variable: '--font-title-kaushan-script',
  weight: '400',
  display: 'swap',
  preload: false,
  subsets: ['latin', 'latin-ext'],
});
const lobster = Lobster({
  variable: '--font-title-lobster',
  weight: '400',
  display: 'swap',
  preload: false,
  subsets: ['latin', 'latin-ext'],
});
const pacifico = Pacifico({
  variable: '--font-title-pacifico',
  weight: '400',
  display: 'swap',
  preload: false,
  subsets: ['latin', 'latin-ext'],
});
const princess_sofia = Princess_Sofia({
  variable: '--font-title-princess-sofia',
  weight: '400',
  display: 'swap',
  preload: false,
  subsets: ['latin', 'latin-ext'],
});
const redressed = Redressed({
  variable: '--font-title-redressed',
  weight: '400',
  display: 'swap',
  preload: false,
  subsets: ['latin', 'latin-ext'],
});
const rock_salt = Rock_Salt({
  variable: '--font-title-rock-salt',
  weight: '400',
  display: 'swap',
  preload: false,
  subsets: ['latin'],
});
const sacramento = Sacramento({
  variable: '--font-title-sacramento',
  weight: '400',
  display: 'swap',
  preload: false,
  subsets: ['latin', 'latin-ext'],
});

/** Set on `<html>` by the root layout, so the fonts' CSS ships in the layout
 * stylesheet instead of a second render-blocking one (D67). */
export const titleFontVariables = [
  amita,
  courgette,
  euphoria_script,
  kaushan_script,
  lobster,
  pacifico,
  princess_sofia,
  redressed,
  rock_salt,
  sacramento,
]
  .map((font) => font.variable)
  .join(' ');
