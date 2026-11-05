'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  type FormEvent,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { deleteDocumentAction, saveDocumentAction } from '@/lib/admin/actions';
import { fieldId, getIn, setIn } from '@/lib/admin/path';
import { getSessionStatus, renewSession } from '@/lib/auth/actions';
import { type FieldErrors } from '@/lib/content/admin/normalize';
import { type Reference } from '@/lib/content/admin/types';
import { type DocumentType } from '@/lib/content/schema';
import { toast } from '@/stores/toast-store';

import { idToSegment } from '../areas';
import { inputClass } from './styles';

type Values = Record<string, unknown>;

export const SESSION_EXPIRED =
  'Your session expired. Sign in again in another tab, then retry. Your edits are kept here.';

/**
 * Renewing on a timer keeps long edits from outliving the 30 min idle limit.
 */
const KEEP_ALIVE_MS = 10 * 60_000;

export interface FormApi {
  disabled: boolean;
  error: (path: string) => string | undefined;
  get: (path: string) => unknown;
  set: (path: string, value: unknown) => void;
  values: Values;
}

const noSubscription = () => () => {};

const FormContext = createContext<FormApi | null>(null);

export function useForm(): FormApi {
  const api = useContext(FormContext);

  if (!api) throw new Error('Fields must be inside a DocumentEditor');

  return api;
}

interface DocumentEditorProps {
  /**
   * The list this editor belongs to (also where deleting returns).
   */
  basePath: string;
  children: ReactNode;
  /**
   * Text the owner must type to delete the document.
   */
  deleteConfirm?: string | undefined;
  /**
   * `null` creates a new document.
   */
  id: null | string;
  initial: Values;
  readOnlyReason: null | string;
  rev?: string | undefined;
  singleton?: boolean;
  title: string;
  /**
   * Document type, e.g. `project`.
   */
  type: string;
}

function humanize(path: string) {
  return path.replace(/\.(\d+)/g, ' #$1').replace(/\./g, ' · ');
}

export function DocumentEditor({
  type,
  id,
  initial,
  rev: initialRev,
  readOnlyReason,
  basePath,
  title,
  singleton = false,
  deleteConfirm,
  children,
}: DocumentEditorProps) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(initial);
  const [baseline, setBaseline] = useState<Values>(initial);
  const [rev, setRev] = useState(initialRev);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  // Lets tests (and impatient fingers) know the form is interactive.
  const hydrated = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );

  const disabled = readOnlyReason !== null || saving;
  const dirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(baseline),
    [values, baseline],
  );

  // Leaving with unsaved edits: the browser prompt for reloads and closes, a
  // confirm for in-app links.
  useEffect(() => {
    if (!dirty) return;

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.('a[href]');

      if (!(link instanceof HTMLAnchorElement) || link.target === '_blank') return;

      const url = new URL(link.href);

      if (
        url.origin === window.location.origin
        && url.pathname === window.location.pathname
        && url.search === window.location.search
      ) {
        return;
      }

      if (!window.confirm('Discard unsaved changes?')) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', onClick, true);

    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [dirty]);

  // Typing sends no requests, so renew the session while edits are pending.
  useEffect(() => {
    if (!dirty) return;

    const timer = window.setInterval(() => {
      renewSession().catch(() => {});
    }, KEEP_ALIVE_MS);

    return () => window.clearInterval(timer);
  }, [dirty]);

  const api = useMemo<FormApi>(
    () => ({
      values,
      get: (path) => getIn(values, path),
      set: (path, value) => {
        setValues((current) => setIn(current, path, value));
        setErrors((current) => {
          if (!(path in current)) return current;

          const { [path]: _removed, ...rest } = current;
          void _removed;

          return rest;
        });
      },
      error: (path) => errors[path],
      disabled,
    }),
    [values, errors, disabled],
  );

  async function save(overwrite = false) {
    setSaving(true);

    try {
      const outcome = await saveDocumentAction(type, id, values, overwrite ? undefined : rev);

      if (outcome.ok) {
        setValues(outcome.doc);
        setBaseline(outcome.doc);
        setRev(outcome.rev);
        setErrors({});
        setFormErrors([]);
        toast('Published · public pages refreshed', 'success');

        if (!id && !singleton)
          router.replace(`${basePath}/${idToSegment(type as DocumentType, outcome.id)}`);

        return;
      }

      if (outcome.kind === 'invalid') {
        setErrors(outcome.fieldErrors);
        setFormErrors(outcome.formErrors);
        toast('Fix the highlighted fields', 'error');
        requestAnimationFrame(() => summaryRef.current?.focus());
      } else if (outcome.kind === 'conflict') {
        setConflict(true);
      } else if (outcome.kind === 'readonly') {
        toast('This data is read-only', 'error');
      } else if (outcome.kind === 'exists') {
        toast('That item already exists', 'error');
      } else {
        toast('This item no longer exists', 'error');
      }
    } catch {
      // Without a session the action is answered with the 404 page and throws.
      const signedIn =
        !navigator.onLine
        || (await getSessionStatus().then(
          (status) => status.isAdmin,
          () => false,
        ));

      toast(
        signedIn ? 'Could not save. Check your connection and try again.' : SESSION_EXPIRED,
        'error',
      );
    } finally {
      setSaving(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();

    if (!disabled && dirty) void save();
  }

  const errorEntries = Object.entries(errors);

  return (
    <FormContext.Provider value={api}>
      <form onSubmit={onSubmit} noValidate data-hydrated={hydrated} className="mx-auto max-w-4xl">
        <h1 className="text-h2">{title}</h1>
        {readOnlyReason ? (
          <p
            role="status"
            className="mt-4 rounded-md border border-warn/50 p-3 text-small text-warn"
          >
            {readOnlyReason}. You can look around, but nothing can be saved.
          </p>
        ) : null}

        {errorEntries.length > 0 || formErrors.length > 0 ? (
          <div
            ref={summaryRef}
            role="alert"
            tabIndex={-1}
            className="mt-6 rounded-md border border-danger/60 bg-surface-1 p-4 text-small outline-none"
          >
            <p className="font-medium text-danger">
              {errorEntries.length + formErrors.length} problems to fix
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {formErrors.map((message) => (
                <li key={message}>{message}</li>
              ))}
              {errorEntries.map(([path, message]) => (
                <li key={path}>
                  <a
                    href={`#${fieldId(path)}`}
                    onClick={(event) => {
                      const target = document.getElementById(fieldId(path));

                      if (target) {
                        event.preventDefault();
                        target.focus();
                        target.scrollIntoView({ block: 'center' });
                      }
                    }}
                    className="underline"
                  >
                    {humanize(path)}
                  </a>
                  : {message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-8">{children}</div>

        {id && !singleton && deleteConfirm ? (
          <DeleteSection
            type={type}
            id={id}
            rev={rev}
            confirmText={deleteConfirm}
            basePath={basePath}
            disabled={readOnlyReason !== null}
          />
        ) : null}

        <div className="sticky bottom-14 z-10 mt-10 flex flex-wrap items-center gap-3 border-t border-line bg-bg-0/95 py-3 backdrop-blur md:bottom-0">
          <Button type="submit" disabled={disabled || !dirty}>
            {saving ? 'Saving…' : 'Save and publish'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!dirty || saving}
            onClick={() => {
              setValues(baseline);
              setErrors({});
              setFormErrors([]);
            }}
          >
            Discard changes
          </Button>
          <span role="status" className="text-small text-text-3">
            {dirty ? 'Unsaved changes' : 'All changes saved'}
          </span>
        </div>
      </form>

      <Dialog
        open={conflict}
        onClose={() => setConflict(false)}
        title="This item changed elsewhere"
        closeLabel="Close"
      >
        <p className="mb-6">
          Someone saved a newer version while you were editing. Reload to see it (your edits here
          are lost), or overwrite it with your version.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => window.location.reload()}>Reload</Button>
          <Button
            variant="secondary"
            onClick={() => {
              setConflict(false);
              void save(true);
            }}
          >
            Overwrite
          </Button>
        </div>
      </Dialog>
    </FormContext.Provider>
  );
}

function DeleteSection({
  type,
  id,
  rev,
  confirmText,
  basePath,
  disabled,
}: {
  basePath: string;
  confirmText: string;
  disabled: boolean;
  id: string;
  rev: string | undefined;
  type: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [references, setReferences] = useState<Reference[]>([]);

  async function remove() {
    setBusy(true);

    try {
      const outcome = await deleteDocumentAction(type, id, rev);

      if (outcome.ok) {
        toast('Deleted', 'success');
        router.push(basePath);
      } else if (outcome.kind === 'in-use') {
        setReferences(outcome.references);
      } else if (outcome.kind === 'conflict') {
        toast('This item changed elsewhere. Reload before deleting.', 'error');
      } else {
        toast('Could not delete this item', 'error');
      }
    } catch {
      toast('Could not delete. Check your connection.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-12 rounded-md border border-danger/40 p-4">
      <h2 className="text-h3">Delete</h2>
      <p className="mt-1 text-small text-text-3">
        Hiding the item removes it from the site and can be undone. Deleting is permanent.
      </p>
      <Button
        className="mt-4"
        variant="secondary"
        disabled={disabled}
        onClick={() => {
          setTyped('');
          setReferences([]);
          setOpen(true);
        }}
      >
        Delete…
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete permanently?"
        closeLabel="Close"
      >
        <p className="mb-4">
          Type <strong className="font-mono text-text-1">{confirmText}</strong> to confirm.
        </p>
        <label className="sr-only" htmlFor="delete-confirm">
          Confirmation text
        </label>
        <input
          id="delete-confirm"
          className={inputClass}
          value={typed}
          autoComplete="off"
          onChange={(event) => setTyped(event.target.value)}
          // The dialog sits inside the editor <form>: Enter would save it.
          onKeyDown={(event) => event.key === 'Enter' && event.preventDefault()}
        />
        {references.length > 0 ? (
          <div role="alert" className="mt-4 text-small text-danger">
            <p>It is still used by:</p>
            <ul className="mt-1 list-disc pl-5">
              {references.map((ref) => (
                <li key={ref.id}>
                  {ref.label} <span className="text-text-3">({ref.type})</span>
                </li>
              ))}
            </ul>
            <p className="mt-2">Remove those references first, or hide it instead.</p>
          </div>
        ) : null}
        <Button
          className="mt-6"
          disabled={typed !== confirmText || busy}
          onClick={() => void remove()}
        >
          {busy ? 'Deleting…' : 'Delete permanently'}
        </Button>
      </Dialog>
    </section>
  );
}
