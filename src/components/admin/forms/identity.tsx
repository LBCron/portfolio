'use client';

import {
  LocalizedField,
  NumberField,
  Section,
  TextField,
  ToggleField,
} from '../editor/fields';
import { useForm } from '../editor/form';
import { ImageField, PdfField } from '../editor/image-field';
import { ListEditor } from '../editor/list-editor';

const blank = () => ({ en: '', pt: '' });

export function ProfileForm() {
  return (
    <>
      <Section title="Identity">
        <TextField path="displayName" label="Display name" maxLength={80} />
        <LocalizedField path="jobTitle" label="Job title" max={80} />
        <LocalizedField path="location" label="Location" max={80} />
        <LocalizedField path="focus" label="Current focus" max={120} />
        <ListEditor
          path="spokenLanguages"
          label="Spoken languages"
          itemLabel="language"
          min={1}
          max={6}
          newItem={blank}
        >
          {(_, itemPath) => (
            <LocalizedField path={itemPath} label="Language" max={60} />
          )}
        </ListEditor>
      </Section>

      <Section title="Hero">
        <LocalizedField path="heroHeadline" label="Headline" max={90} />
        <LocalizedField
          path="heroLead"
          label="Lead paragraph"
          max={280}
          multiline
        />
        <ListEditor
          path="rotatingWords"
          label="Rotating words"
          itemLabel="word"
          min={1}
          max={6}
          newItem={blank}
        >
          {(_, itemPath) => (
            <LocalizedField path={itemPath} label="Word" max={40} />
          )}
        </ListEditor>
        <ImageField
          path="photo"
          label="Photo (square, hero and social image)"
        />
        <ImageField
          path="photoLg"
          label="Large photo (3:4, from large screens up)"
        />
      </Section>

      <Section title="About">
        <LocalizedField path="bio" label="Bio (Markdown)" max={1500} markdown />
        <ListEditor
          path="metrics"
          label="Metrics"
          itemLabel="metric"
          max={4}
          newItem={() => ({ value: '', label: blank() })}
        >
          {(_, itemPath) => (
            <>
              <TextField
                path={`${itemPath}.value`}
                label="Value"
                maxLength={12}
                hint="Shown as is, e.g. 12+"
              />
              <LocalizedField
                path={`${itemPath}.label`}
                label="Label"
                max={48}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <NumberField
                  path={`${itemPath}.countTo`}
                  label="Count up to"
                  min={0}
                  hint="Optional animation target"
                />
                <TextField
                  path={`${itemPath}.prefix`}
                  label="Prefix"
                  maxLength={4}
                />
                <TextField
                  path={`${itemPath}.suffix`}
                  label="Suffix"
                  maxLength={4}
                />
              </div>
            </>
          )}
        </ListEditor>
        <LocalizedField
          path="featuredQuote.text"
          label="Highlighted quote"
          max={160}
          multiline
          rows={2}
        />
        <LocalizedField
          path="featuredQuote.attribution"
          label="Quote attribution (optional)"
          max={80}
        />
      </Section>
    </>
  );
}

export function ContactForm() {
  return (
    <Section title="Contact details">
      <TextField path="email" label="Email" type="email" maxLength={254} />
      <TextField
        path="phone"
        label="Phone (optional)"
        type="tel"
        hint="International format, e.g. +5541999990000"
      />
      <ToggleField
        path="showPhone"
        label="Show the phone number publicly"
        hint="Off by default. When off, the number is never sent to visitors."
      />
      <TextField
        path="bookingUrl"
        label="Booking link (optional)"
        type="url"
        hint="https only"
      />
      <LocalizedField path="ctaHeading" label="Contact heading" max={80} />
      <LocalizedField path="ctaText" label="Contact text" max={280} multiline />
    </Section>
  );
}

export function ResumeForm() {
  const form = useForm();
  const updated = form.get('updatedAt');
  return (
    <Section
      title="Résumé files"
      description="One PDF per language. Visitors get the file that matches the site language."
    >
      <PdfField path="file.en" label="English PDF" />
      <PdfField path="file.pt" label="Portuguese PDF" />
      {typeof updated === 'string' ? (
        <p className="text-small text-text-3">
          Last saved {new Date(updated).toLocaleString('en')}
        </p>
      ) : null}
    </Section>
  );
}
