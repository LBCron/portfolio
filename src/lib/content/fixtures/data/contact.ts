import { type DocumentInput } from '../../schema';
import { fixtureFile, L, singletonMeta } from '../helpers';

export const contact: DocumentInput<'contact'> = {
  ...singletonMeta('contact'),
  email: 'hello@example.com',
  showPhone: false,
  bookingUrl: 'https://example.com/book',
  ctaHeading: L('Let’s build something that lasts', 'Vamos construir algo que dure'),
  ctaText: L(
    'Have a hard problem, a product idea or a role in mind? Let’s talk.',
    'Tem um problema difícil, uma ideia de produto ou uma vaga em mente? Vamos conversar.',
  ),
};

export const resume: DocumentInput<'resume'> = {
  ...singletonMeta('resume'),
  file: {
    en: fixtureFile('resume-en'),
    pt: fixtureFile('resume-pt'),
  },
};
