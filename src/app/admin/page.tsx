import Link from 'next/link';

import { AREA_CONFIG } from '@/components/admin/area-config';
import { AREAS, idToSegment } from '@/components/admin/areas';
import { DashboardActions } from '@/components/admin/dashboard-actions';
import { requireAdmin } from '@/lib/auth/session';
import { getAdminStore } from '@/lib/content/admin';
import { findAttention } from '@/lib/content/admin/attention';
import { type AdminDoc } from '@/lib/content/admin/types';
import { type DocumentType } from '@/lib/content/schema';

export default async function Dashboard() {
  await requireAdmin();

  const store = getAdminStore();
  const lists = await Promise.all(AREAS.map((area) => store.list(area.type)));
  const docs = Object.fromEntries(AREAS.map((area, index) => [area.type, lists[index]])) as Partial<
    Record<DocumentType, AdminDoc[]>
  >;
  const areaOf = (type: DocumentType) => AREAS.find((area) => area.type === type);
  const hrefFor = (type: DocumentType, id: string): string => {
    const area = areaOf(type);

    if (!area) return '/admin';

    return area.singleton || !id
      ? `/admin/${area.slug}`
      : `/admin/${area.slug}/${idToSegment(type, id)}`;
  };

  const attention = findAttention(docs);
  const recent = AREAS.flatMap((area, index) => (lists[index] ?? []).map((doc) => ({ area, doc })))
    .filter(({ doc }) => typeof doc.updatedAt === 'string')
    .sort((a, b) => String(b.doc.updatedAt).localeCompare(String(a.doc.updatedAt)))
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-h2">Dashboard</h1>
      <p className="mt-2 text-text-2">What is on the site, and what needs a look.</p>

      <div className="mt-6">
        <DashboardActions />
      </div>

      <h2 className="mt-10 text-h3">Content</h2>
      <ul className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {AREAS.map((area, index) => {
          const list = lists[index] ?? [];
          const hidden = list.filter((doc) => doc['visible'] === false).length;

          return (
            <li key={area.slug}>
              <Link
                href={`/admin/${area.slug}`}
                prefetch={false}
                className="block rounded-xl border border-line bg-surface-1 p-4 hover-fine:border-line-strong"
              >
                <span className="block text-small text-text-3">{area.label}</span>
                <span className="mt-1 block text-h3 text-text-1">
                  {area.singleton ? (list.length > 0 ? 'Set' : 'Missing') : list.length}
                  {hidden > 0 ? (
                    <span className="ml-2 text-small text-text-3">{hidden} hidden</span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-10 text-h3">Needs attention</h2>
      {attention.length === 0 ? (
        <p className="mt-3 text-text-2">Nothing to fix.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {attention.slice(0, 30).map((item, index) => {
            const doc = docs[item.type]?.find((entry) => entry.id === item.id);
            const config = AREA_CONFIG[areaOf(item.type)?.slug ?? ''];

            return (
              <li key={`${item.id}-${index}`} className="text-small">
                <Link
                  href={hrefFor(item.type, item.id)}
                  prefetch={false}
                  className="font-medium text-text-1 underline underline-offset-4"
                >
                  {(doc && config?.name(doc)) || areaOf(item.type)?.label}
                </Link>
                <span className="text-text-2"> · {item.issue}</span>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="mt-10 text-h3">Recent changes</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {recent.map(({ area, doc }) => (
          <li key={doc.id} className="text-small">
            <Link
              href={hrefFor(area.type, doc.id)}
              prefetch={false}
              className="font-medium text-text-1 underline underline-offset-4"
            >
              {AREA_CONFIG[area.slug]?.name(doc) || area.label}
            </Link>
            <span className="text-text-2">
              {' '}
              · {area.label} · {new Date(String(doc.updatedAt)).toLocaleString('en')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
