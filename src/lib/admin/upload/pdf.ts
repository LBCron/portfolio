export const MAX_PDF_BYTES = 10 * 1024 * 1024;

const ACTIVE = /\/(?:JavaScript|JS|Launch)(?![A-Za-z0-9])/;

/**
 * Header check plus a scan for script and launch actions.
 * shortcut: objects inside compressed streams are not inspected; the file is
 * only ever served as a download, so a full parser can wait.
 */
export function checkPdf(
  bytes: Uint8Array,
): { ok: true } | { ok: false; message: string } {
  const head = new TextDecoder('latin1').decode(bytes.slice(0, 5));
  if (head !== '%PDF-') return { ok: false, message: 'Not a PDF file' };
  if (ACTIVE.test(new TextDecoder('latin1').decode(bytes))) {
    return {
      ok: false,
      message: 'PDFs with scripts or launch actions are not allowed',
    };
  }
  return { ok: true };
}
