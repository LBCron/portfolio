'use client';

import {
  CheckboxGroup,
  LocalizedField,
  Section,
  SelectField,
  TextField,
  ToggleField,
} from '../editor/fields';
import { LinkIconField } from '../editor/icon-fields';
import { ImageField } from '../editor/image-field';

export function LinkForm() {
  return (
    <Section title="Link">
      <LocalizedField path="label" label="Label" max={40} />
      <TextField
        path="url"
        label="URL"
        type="url"
        hint="https, or mailto:you@example.com"
        maxLength={2048}
      />
      <SelectField
        path="kind"
        label="Kind"
        options={[
          { value: 'social', label: 'Social profile' },
          { value: 'site', label: 'Website' },
          { value: 'other', label: 'Other' },
        ]}
      />
      <LinkIconField path="icon" />
      <CheckboxGroup
        path="placements"
        label="Where it appears"
        options={[
          { value: 'header', label: 'Header (max 3 icons)' },
          { value: 'contact', label: 'Contact section' },
          { value: 'footer', label: 'Footer' },
        ]}
      />
      <ToggleField
        path="isOwnProfile"
        label="This is my own profile"
        hint='Adds rel="me" and lists it in the structured data. Needs an https URL.'
      />
      <ToggleField path="visible" label="Visible on the site" />
    </Section>
  );
}

export function RecommendedForm() {
  return (
    <Section title="Person">
      <TextField path="name" label="Name" maxLength={80} />
      <LocalizedField path="role" label="Role" max={80} />
      <LocalizedField path="note" label="Why follow them" max={140} multiline rows={2} />
      <TextField path="url" label="Profile URL" type="url" hint="https only" maxLength={2048} />
      <ImageField path="avatar" label="Avatar" alt={false} />
      <ToggleField path="visible" label="Visible on the site" />
    </Section>
  );
}
