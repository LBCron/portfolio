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

import type { TitleFont } from '@/lib/content/taxonomy';

/**
 * Hero title fonts (D67), self-hosted at build time. `preload: false` keeps
 * the browser from fetching all ten: only the class of the chosen font is
 * rendered, so only its file is requested (after first paint, with the
 * size-adjusted fallback in between). Loaders must be module-level consts.
 */
const amita = Amita({
  weight: '400',
  display: 'swap',
  preload: false,
  subsets: ['latin', 'latin-ext'],
});
const courgette = Courgette({
  weight: '400',
  display: 'swap',
  preload: false,
  subsets: ['latin', 'latin-ext'],
});
const euphoria_script = Euphoria_Script({
  weight: '400',
  display: 'swap',
  preload: false,
  subsets: ['latin', 'latin-ext'],
});
const kaushan_script = Kaushan_Script({
  weight: '400',
  display: 'swap',
  preload: false,
  subsets: ['latin', 'latin-ext'],
});
const lobster = Lobster({
  weight: '400',
  display: 'swap',
  preload: false,
  subsets: ['latin', 'latin-ext'],
});
const pacifico = Pacifico({
  weight: '400',
  display: 'swap',
  preload: false,
  subsets: ['latin', 'latin-ext'],
});
const princess_sofia = Princess_Sofia({
  weight: '400',
  display: 'swap',
  preload: false,
  subsets: ['latin', 'latin-ext'],
});
const redressed = Redressed({
  weight: '400',
  display: 'swap',
  preload: false,
  subsets: ['latin', 'latin-ext'],
});
const rock_salt = Rock_Salt({
  weight: '400',
  display: 'swap',
  preload: false,
  subsets: ['latin'],
});
const sacramento = Sacramento({
  weight: '400',
  display: 'swap',
  preload: false,
  subsets: ['latin', 'latin-ext'],
});

export const titleFontClass: Record<TitleFont, string> = {
  amita: amita.className,
  courgette: courgette.className,
  'euphoria-script': euphoria_script.className,
  'kaushan-script': kaushan_script.className,
  lobster: lobster.className,
  pacifico: pacifico.className,
  'princess-sofia': princess_sofia.className,
  redressed: redressed.className,
  'rock-salt': rock_salt.className,
  sacramento: sacramento.className,
};
