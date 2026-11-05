'use client';

import { LocalizedField, Section, SelectField, TextField, ToggleField } from '../editor/fields';
import { TechIconFields } from '../editor/icon-fields';

const CATEGORIES = [
  ['language', 'Languages'],
  ['frontend', 'Frontend'],
  ['backend', 'Backend & APIs'],
  ['data', 'Data & messaging'],
  ['cloud', 'Cloud & DevOps'],
  ['integration', 'Integrations & automation'],
  ['ai', 'AI agents & tooling'],
] as const;

export function TechnologyForm(): React.JSX.Element {
  return (
    <>
      <Section title="Technology">
        <TextField path="name" label="Name" maxLength={40} />
        <SelectField
          path="category"
          label="Category"
          options={CATEGORIES.map(([value, label]) => ({ value, label }))}
        />
        <SelectField
          path="priority"
          label="Prominence"
          hint="How large it appears in the technology cloud."
          options={[
            { value: 1, label: '1 · Core (largest)' },
            { value: 2, label: '2 · Regular' },
            { value: 3, label: '3 · Occasional (smallest)' },
          ]}
        />
        <TextField path="url" label="Website (optional)" type="url" />
        <TextField
          path="brandColor"
          label="Brand color (optional)"
          mono
          placeholder="#8b7cff"
          maxLength={7}
        />
        <ToggleField path="visible" label="Visible on the site" />
      </Section>
      <Section title="Icon">
        <TechIconFields />
      </Section>
    </>
  );
}

export function PracticeForm(): React.JSX.Element {
  return (
    <Section title="Practice">
      <LocalizedField path="label" label="Label" max={60} />
      <ToggleField path="visible" label="Visible on the site" />
    </Section>
  );
}
