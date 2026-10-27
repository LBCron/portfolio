import { getContent } from '@/lib/content';
import { requireAdmin } from '@/lib/auth/session';

export default async function Dashboard() {
  await requireAdmin();
  const content = getContent();
  const [
    profile,
    contact,
    resume,
    links,
    recommended,
    projects,
    experience,
    education,
    technologies,
    practices,
  ] = await Promise.all([
    content.getProfile('en'),
    content.getContact('en'),
    content.getResume(),
    content.getFeaturedLinks('en'),
    content.getRecommendedProfiles('en'),
    content.getProjects('en'),
    content.getExperience('en'),
    content.getEducation('en'),
    content.getTechnologies('en'),
    content.getPractices('en'),
  ]);

  const counts: [string, string | number][] = [
    ['Profile', profile ? 'Set' : 'Missing'],
    ['Contact', contact ? 'Set' : 'Missing'],
    ['Résumé', resume ? 'Set' : 'Missing'],
    ['Links', links.length],
    ['Recommended', recommended.length],
    ['Projects', projects.length],
    ['Experience', experience.length],
    ['Education', education.length],
    ['Technologies', technologies.length],
    ['Practices', practices.length],
  ];

  return (
    <>
      <h1 className="text-h2">Dashboard</h1>
      <p className="mt-2 text-text-2">Visible items on the public site.</p>
      <dl className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {counts.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-line bg-surface-1 p-4"
          >
            <dt className="text-small text-text-3">{label}</dt>
            <dd className="mt-1 text-h3 text-text-1">{value}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
