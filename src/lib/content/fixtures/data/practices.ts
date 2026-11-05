import { type DocumentInput } from '../../schema';
import { L, meta } from '../helpers';

const labels = [
  L('REST API design', 'Design de APIs REST'),
  L('Clean Architecture', 'Clean Architecture'),
  L('SOLID', 'SOLID'),
  L('Domain-Driven Design', 'Domain-Driven Design (DDD)'),
  L('Microservices', 'Microsserviços'),
  L('Microfrontends', 'Microfrontends'),
  L('Design systems', 'Design systems'),
  L('Observability', 'Observabilidade'),
  L('CI/CD', 'CI/CD'),
  L('Spec-driven development', 'Desenvolvimento guiado por especificação'),
  L('LLMs and AI', 'LLMs e IA'),
  L('Payment APIs and systems', 'APIs e sistemas de pagamento'),
  L('Solution architecture', 'Arquitetura de soluções'),
  L('Tech leadership', 'Liderança técnica'),
  L('Open source contribution', 'Contribuição para open source'),
  L('Automation', 'Automação'),
];

export const practices: Array<DocumentInput<'practice'>> = labels.map((label, index) => ({
  ...meta('practice', label.en),
  label,
  order: (index + 1) * 10,
  visible: true,
}));
