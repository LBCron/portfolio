import { type DocumentInput, type TechCategory } from '../../schema';
import { meta } from '../helpers';

type Icon =
  | { iconSlug: string; iconSource: 'devicon' }
  | { iconSlug: string; iconSource: 'simple-icons' }
  | { iconSource: 'monogram'; monogram?: string };

interface Entry {
  brandColor?: string;
  icon: Icon;
  name: string;
  priority: 1 | 2 | 3;
  url: string;
}

const si = (iconSlug: string): Icon => ({
  iconSource: 'simple-icons',
  iconSlug,
});
const devicon = (iconSlug: string): Icon => ({
  iconSource: 'devicon',
  iconSlug,
});
const monogram = (text?: string): Icon => ({
  iconSource: 'monogram',
  ...(text ? { monogram: text } : {}),
});

/**
 * Prototype `techs-cloud` inventory (D37) plus Appendix C items that still
 * resolve in Simple Icons / Devicon. VBA uses Devicon `visualbasic`. Excel,
 * Power BI, SharePoint, VS Code and GPT stay monograms (SVGL marks are
 * gradients, masks or evenodd — the sanitizer cannot keep them).
 */
const inventory: Record<TechCategory, Entry[]> = {
  language: [
    {
      name: 'JavaScript',
      priority: 1,
      icon: si('javascript'),
      url: 'https://developer.mozilla.org/docs/Web/JavaScript',
    },
    {
      name: 'TypeScript',
      priority: 1,
      icon: si('typescript'),
      url: 'https://www.typescriptlang.org',
    },
    {
      name: 'HTML5',
      priority: 1,
      icon: si('html5'),
      url: 'https://html.spec.whatwg.org',
    },
    {
      name: 'CSS3',
      priority: 1,
      icon: si('css'),
      url: 'https://www.w3.org/Style/CSS/',
    },
    {
      name: 'SQL',
      priority: 1,
      icon: devicon('sqldeveloper'),
      url: 'https://en.wikipedia.org/wiki/SQL',
      brandColor: '#e64627',
    },
    { name: 'Go', priority: 2, icon: si('go'), url: 'https://go.dev' },
    {
      name: 'Java',
      priority: 2,
      icon: devicon('java'),
      url: 'https://dev.java',
      brandColor: '#f89820',
    },
    {
      name: 'Python',
      priority: 2,
      icon: si('python'),
      url: 'https://www.python.org',
    },
    { name: 'PHP', priority: 2, icon: si('php'), url: 'https://www.php.net' },
    { name: 'Lua', priority: 2, icon: si('lua'), url: 'https://www.lua.org' },
    {
      name: 'Ruby',
      priority: 3,
      icon: si('ruby'),
      url: 'https://www.ruby-lang.org',
    },
    {
      name: 'C',
      priority: 3,
      icon: si('c'),
      url: 'https://en.wikipedia.org/wiki/C_(programming_language)',
    },
    {
      name: 'Kotlin',
      priority: 3,
      icon: si('kotlin'),
      url: 'https://kotlinlang.org',
    },
    {
      name: 'Bash',
      priority: 3,
      icon: si('gnubash'),
      url: 'https://www.gnu.org/software/bash/',
    },
    {
      name: 'VBA',
      priority: 3,
      icon: devicon('visualbasic'),
      url: 'https://learn.microsoft.com/office/vba/api/overview/',
      brandColor: '#004e8c',
    },
  ],
  frontend: [
    { name: 'React', priority: 1, icon: si('react'), url: 'https://react.dev' },
    {
      name: 'Vue.js',
      priority: 1,
      icon: si('vuedotjs'),
      url: 'https://vuejs.org',
    },
    {
      name: 'Next.js',
      priority: 1,
      icon: si('nextdotjs'),
      url: 'https://nextjs.org',
    },
    {
      name: 'Tailwind CSS',
      priority: 1,
      icon: si('tailwindcss'),
      url: 'https://tailwindcss.com',
    },
    { name: 'Nuxt', priority: 2, icon: si('nuxt'), url: 'https://nuxt.com' },
    {
      name: 'React Native',
      priority: 2,
      icon: si('react'),
      url: 'https://reactnative.dev',
    },
    {
      name: 'Expo',
      priority: 2,
      icon: si('expo'),
      url: 'https://expo.dev',
    },
    {
      name: 'Electron',
      priority: 2,
      icon: si('electron'),
      url: 'https://www.electronjs.org',
    },
    {
      name: 'Vite',
      priority: 2,
      icon: si('vite'),
      url: 'https://vite.dev',
    },
    {
      name: 'AngularJS',
      priority: 3,
      icon: devicon('angularjs'),
      url: 'https://angularjs.org',
      brandColor: '#e23237',
    },
    {
      name: 'Sass',
      priority: 3,
      icon: si('sass'),
      url: 'https://sass-lang.com',
    },
    {
      name: 'Bootstrap',
      priority: 3,
      icon: si('bootstrap'),
      url: 'https://getbootstrap.com',
    },
    {
      name: 'Material UI',
      priority: 3,
      icon: si('mui'),
      url: 'https://mui.com',
    },
    {
      name: 'Redux',
      priority: 3,
      icon: si('redux'),
      url: 'https://redux.js.org',
    },
    {
      name: 'jQuery',
      priority: 3,
      icon: si('jquery'),
      url: 'https://jquery.com',
    },
    {
      name: 'Zustand',
      priority: 3,
      icon: devicon('zustand'),
      url: 'https://zustand.docs.pmnd.rs',
      brandColor: '#b39069',
    },
    {
      name: 'TanStack Query',
      priority: 3,
      icon: si('reactquery'),
      url: 'https://tanstack.com/query',
    },
  ],
  backend: [
    {
      name: 'Node.js',
      priority: 1,
      icon: si('nodedotjs'),
      url: 'https://nodejs.org',
    },
    {
      name: 'Express',
      priority: 1,
      icon: si('express'),
      url: 'https://expressjs.com',
    },
    {
      name: 'GraphQL',
      priority: 1,
      icon: si('graphql'),
      url: 'https://graphql.org',
    },
    { name: 'Bun', priority: 1, icon: si('bun'), url: 'https://bun.com' },
    {
      name: 'NestJS',
      priority: 2,
      icon: si('nestjs'),
      url: 'https://nestjs.com',
    },
    {
      name: 'Fastify',
      priority: 2,
      icon: si('fastify'),
      url: 'https://fastify.dev',
    },
    {
      name: 'Prisma',
      priority: 2,
      icon: si('prisma'),
      url: 'https://www.prisma.io',
    },
    {
      name: 'gRPC',
      priority: 2,
      icon: devicon('grpc'),
      url: 'https://grpc.io',
      brandColor: '#2da6b0',
    },
    {
      name: 'Swagger',
      priority: 3,
      icon: si('swagger'),
      url: 'https://www.openapis.org',
    },
    {
      name: 'FeathersJS',
      priority: 3,
      icon: devicon('feathersjs'),
      url: 'https://feathersjs.com',
      brandColor: '#333333',
    },
    {
      name: 'Laravel',
      priority: 3,
      icon: si('laravel'),
      url: 'https://laravel.com',
    },
    {
      name: 'Spring',
      priority: 3,
      icon: si('spring'),
      url: 'https://spring.io',
    },
    {
      name: 'Apache',
      priority: 3,
      icon: si('apache'),
      url: 'https://httpd.apache.org',
    },
    {
      name: 'Socket.io',
      priority: 3,
      icon: si('socketdotio'),
      url: 'https://socket.io',
    },
    {
      name: 'Axios',
      priority: 3,
      icon: si('axios'),
      url: 'https://axios-http.com',
    },
    {
      name: 'Composer',
      priority: 3,
      icon: si('composer'),
      url: 'https://getcomposer.org',
    },
    { name: 'npm', priority: 3, icon: si('npm'), url: 'https://www.npmjs.com' },
  ],
  data: [
    {
      name: 'PostgreSQL',
      priority: 1,
      icon: si('postgresql'),
      url: 'https://www.postgresql.org',
    },
    { name: 'Redis', priority: 1, icon: si('redis'), url: 'https://redis.io' },
    {
      name: 'MongoDB',
      priority: 2,
      icon: si('mongodb'),
      url: 'https://www.mongodb.com',
    },
    {
      name: 'MySQL',
      priority: 2,
      icon: si('mysql'),
      url: 'https://www.mysql.com',
    },
    {
      name: 'RabbitMQ',
      priority: 2,
      icon: si('rabbitmq'),
      url: 'https://www.rabbitmq.com',
    },
    {
      name: 'Kafka',
      priority: 2,
      icon: si('apachekafka'),
      url: 'https://kafka.apache.org',
    },
    {
      name: 'Google Cloud Pub/Sub',
      priority: 2,
      icon: si('googlepubsub'),
      url: 'https://cloud.google.com/pubsub',
    },
    {
      name: 'BigQuery',
      priority: 2,
      icon: si('googlebigquery'),
      url: 'https://cloud.google.com/bigquery',
    },
    {
      name: 'DynamoDB',
      priority: 3,
      icon: devicon('dynamodb'),
      url: 'https://aws.amazon.com/dynamodb/',
      brandColor: '#4053d6',
    },
    {
      name: 'Elasticsearch',
      priority: 3,
      icon: si('elasticsearch'),
      url: 'https://www.elastic.co/elasticsearch',
    },
  ],
  cloud: [
    {
      name: 'AWS',
      priority: 1,
      icon: devicon('amazonwebservices'),
      url: 'https://aws.amazon.com',
      brandColor: '#ff9900',
    },
    {
      name: 'Google Cloud',
      priority: 1,
      icon: si('googlecloud'),
      url: 'https://cloud.google.com',
    },
    {
      name: 'Docker',
      priority: 1,
      icon: si('docker'),
      url: 'https://www.docker.com',
    },
    { name: 'Git', priority: 1, icon: si('git'), url: 'https://git-scm.com' },
    {
      name: 'GitHub',
      priority: 1,
      icon: si('github'),
      url: 'https://github.com',
    },
    {
      name: 'Vercel',
      priority: 1,
      icon: si('vercel'),
      url: 'https://vercel.com',
    },
    {
      name: 'Kubernetes',
      priority: 2,
      icon: si('kubernetes'),
      url: 'https://kubernetes.io',
    },
    {
      name: 'GitHub Actions',
      priority: 2,
      icon: si('githubactions'),
      url: 'https://github.com/features/actions',
    },
    {
      name: 'Terraform',
      priority: 2,
      icon: si('terraform'),
      url: 'https://www.terraform.io',
    },
    {
      name: 'Android',
      priority: 2,
      icon: si('android'),
      url: 'https://developer.android.com',
    },
    {
      name: 'GitLab',
      priority: 3,
      icon: si('gitlab'),
      url: 'https://gitlab.com',
    },
    {
      name: 'ArgoCD',
      priority: 3,
      icon: devicon('argocd'),
      url: 'https://argo-cd.readthedocs.io',
      brandColor: '#ef7b4d',
    },
    {
      name: 'CircleCI',
      priority: 3,
      icon: si('circleci'),
      url: 'https://circleci.com',
    },
    {
      name: 'Firebase',
      priority: 3,
      icon: si('firebase'),
      url: 'https://firebase.google.com',
    },
    {
      name: 'Datadog',
      priority: 3,
      icon: si('datadog'),
      url: 'https://www.datadoghq.com',
    },
    {
      name: 'Linux',
      priority: 3,
      icon: si('linux'),
      url: 'https://www.kernel.org',
    },
  ],
  integration: [
    {
      name: 'Okta',
      priority: 2,
      icon: si('okta'),
      url: 'https://www.okta.com',
    },
    {
      name: 'Stripe',
      priority: 2,
      icon: si('stripe'),
      url: 'https://stripe.com',
    },
    {
      name: 'Sanity',
      priority: 2,
      icon: si('sanity'),
      url: 'https://www.sanity.io',
    },
    { name: 'SAP', priority: 3, icon: si('sap'), url: 'https://www.sap.com' },
    {
      name: 'Figma',
      priority: 3,
      icon: si('figma'),
      url: 'https://www.figma.com',
    },
    {
      name: 'Postman',
      priority: 3,
      icon: si('postman'),
      url: 'https://www.postman.com',
    },
    {
      name: 'Jira',
      priority: 3,
      icon: si('jira'),
      url: 'https://www.atlassian.com/software/jira',
    },
    {
      name: 'Mapbox',
      priority: 3,
      icon: si('mapbox'),
      url: 'https://www.mapbox.com',
    },
    {
      name: 'Cypress',
      priority: 3,
      icon: si('cypress'),
      url: 'https://www.cypress.io',
    },
    { name: 'Jest', priority: 3, icon: si('jest'), url: 'https://jestjs.io' },
    {
      name: 'ESLint',
      priority: 3,
      icon: si('eslint'),
      url: 'https://eslint.org',
    },
    {
      name: 'Babel',
      priority: 3,
      icon: si('babel'),
      url: 'https://babeljs.io',
    },
    {
      name: 'Excel / Power Query',
      priority: 3,
      icon: monogram('XL'),
      url: 'https://learn.microsoft.com/power-query/',
      brandColor: '#217346',
    },
    {
      name: 'Power BI',
      priority: 3,
      icon: monogram('BI'),
      url: 'https://www.microsoft.com/power-platform/products/power-bi',
      brandColor: '#f2c811',
    },
    {
      name: 'SharePoint',
      priority: 3,
      icon: monogram(),
      url: 'https://www.microsoft.com/microsoft-365/sharepoint/collaboration',
      brandColor: '#0078d4',
    },
  ],
  ai: [
    {
      name: 'Cursor',
      priority: 2,
      icon: si('cursor'),
      url: 'https://cursor.com',
    },
    {
      name: 'VS Code',
      priority: 3,
      // Devicon `vscode` uses fill-rule=evenodd (rejected by D13 geometry).
      icon: monogram('VS'),
      url: 'https://code.visualstudio.com',
      brandColor: '#007acc',
    },
    {
      name: 'Claude',
      priority: 3,
      icon: si('claude'),
      url: 'https://claude.ai',
    },
    {
      name: 'GPT',
      priority: 3,
      icon: monogram('GPT'),
      url: 'https://chatgpt.com',
      brandColor: '#10a37f',
    },
    {
      name: 'Gemini',
      priority: 3,
      icon: si('googlegemini'),
      url: 'https://gemini.google.com',
    },
    {
      name: 'Lovable',
      priority: 3,
      icon: devicon('lovable'),
      url: 'https://lovable.dev',
      brandColor: '#ff6b6b',
    },
  ],
};

export const technologies: Array<DocumentInput<'technology'>> = Object.entries(inventory).flatMap(
  ([category, entries], categoryIndex) =>
    entries.map((entry, index) => ({
      ...meta('technology', entry.name),
      name: entry.name,
      category: category as TechCategory,
      ...entry.icon,
      priority: entry.priority,
      url: entry.url,
      ...(entry.brandColor ? { brandColor: entry.brandColor } : {}),
      order: (categoryIndex + 1) * 100 + index * 10,
      visible: true,
    })),
);
