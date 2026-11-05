'use client';

import { type ReactNode, useEffect } from 'react';

type Pane = 'education' | 'experience';

function paneFromHash(): null | Pane {
  const hash = window.location.hash;

  if (hash === '#education') return 'education';

  if (hash === '#experience' || hash === '#resume') return 'experience';

  return null;
}

const tabClass =
  'inline-flex min-h-11 cursor-pointer items-center rounded-full px-4 text-small text-text-2 transition-colors has-[:checked]:bg-surface-2 has-[:checked]:text-text-1 has-[:checked]:shadow-[inset_0_0_0_1px_var(--color-line-strong)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent-2 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-bg-0';

/**
 * Experience | Education switch. Native radios + CSS, so the first HTML matches
 * the client tree (D46). Both panels stay in the DOM.
 */
export function ResumePanes({
  tablistLabel,
  experienceLabel,
  educationLabel,
  experience,
  education,
}: {
  education: ReactNode;
  educationLabel: string;
  experience: ReactNode;
  experienceLabel: string;
  tablistLabel: string;
}): null | React.JSX.Element {
  const hasExperience = experience !== null && experience !== undefined;
  const hasEducation = education !== null && education !== undefined;

  useEffect(() => {
    const apply = (): void => {
      const pane = paneFromHash();

      if (pane === 'education' && !hasEducation) return;

      if (pane === 'experience' && !hasExperience) return;

      if (!pane) return;

      const input = document.querySelector<HTMLInputElement>(`[data-resume-pane="${pane}"]`);

      if (input) input.checked = true;
    };

    apply();
    window.addEventListener('hashchange', apply);

    return (): void => window.removeEventListener('hashchange', apply);
  }, [hasEducation, hasExperience]);

  if (!hasExperience && !hasEducation) return null;

  if (!hasExperience || !hasEducation) {
    return <>{experience ?? education}</>;
  }

  return (
    <div className="group/panes">
      <div
        role="radiogroup"
        aria-label={tablistLabel}
        className="mb-8 inline-flex rounded-full border border-line bg-surface-1/60 p-0.5"
      >
        <label className={tabClass}>
          <input
            type="radio"
            name="resume-pane"
            data-resume-pane="experience"
            defaultChecked
            className="sr-only"
          />
          {experienceLabel}
        </label>
        <label className={tabClass}>
          <input type="radio" name="resume-pane" data-resume-pane="education" className="sr-only" />
          {educationLabel}
        </label>
      </div>

      <div className="hidden group-has-[[data-resume-pane=experience]:checked]/panes:block">
        {experience}
      </div>
      <div className="hidden group-has-[[data-resume-pane=education]:checked]/panes:block">
        {education}
      </div>
    </div>
  );
}
