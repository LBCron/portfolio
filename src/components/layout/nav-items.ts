export const NAV_SECTIONS = ['about', 'stack', 'work', 'resume', 'contact'] as const;

export type NavSection = (typeof NAV_SECTIONS)[number];
