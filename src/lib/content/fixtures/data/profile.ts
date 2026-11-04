import { owner } from '@/config/site';

import type { DocumentInput } from '../../schema';
import { L, fixtureImage, singletonMeta } from '../helpers';

const photoAlt = L('Portrait of Julio L. Muller', 'Retrato de Julio L. Muller');

export const profile: DocumentInput<'profile'> = {
  ...singletonMeta('profile'),
  displayName: owner.name,
  jobTitle: L(owner.jobTitle, 'Engenheiro de Software Full Stack Sênior'),
  heroLead: L(
    'I design and build web software, end to end.',
    'Projeto e construo software web de ponta a ponta.',
  ),
  titleFont: 'kaushan-script',
  photo: fixtureImage('profile-photo', photoAlt, { x: 0.5, y: 0.4 }),
  photoLg: fixtureImage('profile-photo-lg', photoAlt, { x: 0.5, y: 0.35 }),
  bio: L(
    [
      'I am a web-first full stack engineer. Most of my work lives in the browser and on the servers behind it, and I also build mobile and desktop apps, automations and integrations when the problem calls for them.',
      'I like messy domains. I start by untangling the language of the business, then shape it into a clean architecture with honest estimates and small, focused teams. Boring, well-tested code is a feature.',
      'Away from the editor I mentor engineers who are growing into senior roles and keep a notebook of things I learn the hard way, so the next person does not have to.',
    ].join('\n\n'),
    [
      'Sou um engenheiro full stack com foco em web. A maior parte do meu trabalho acontece no navegador e nos servidores por trás dele, mas também desenvolvo apps mobile e desktop, automações e integrações quando o problema pede.',
      'Gosto de domínios bagunçados. Começo destrinchando a linguagem do negócio e depois transformo isso em uma arquitetura limpa, com estimativas honestas e times pequenos e focados. Código simples e bem testado é uma qualidade, não um defeito.',
      'Longe do editor, faço mentoria para pessoas que estão chegando ao nível sênior e mantenho um caderno com o que aprendi do jeito difícil, para que a próxima pessoa não precise passar pelo mesmo.',
    ].join('\n\n'),
  ),
  location: L(`${owner.city}, ${owner.country}`, `${owner.city}, Brasil`),
  spokenLanguages: [
    L('Portuguese (native)', 'Português (nativo)'),
    L('English (professional)', 'Inglês (profissional)'),
  ],
  focus: L('Web platforms and APIs', 'Plataformas web e APIs'),
  metrics: [
    {
      value: '10+',
      countTo: 10,
      suffix: '+',
      label: L('years building software', 'anos criando software'),
    },
    {
      value: '40+',
      countTo: 40,
      suffix: '+',
      label: L('projects shipped', 'projetos entregues'),
    },
    {
      value: '6',
      countTo: 6,
      label: L('teams led or mentored', 'times liderados ou mentorados'),
    },
    {
      value: '99.9%',
      label: L(
        'uptime on flagship projects',
        'de disponibilidade nos projetos principais',
      ),
    },
  ],
};
