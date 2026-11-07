import 'server-only';

import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import { isIP } from 'node:net';
import { Readable } from 'node:stream';

import { sanitizeSvg } from '@/lib/admin/upload/svg';
import { type SvgData } from '@/lib/content/schema';

export type RemoteIconResult = { message: string; ok: false } | { ok: true; svg: SvgData };

export interface RemoteIconFetcher {
  fetch: (url: string, signal?: AbortSignal) => Promise<RemoteIconResult>;
}

const MAX_URL = 2048;
const MAX_BODY = 100 * 1024;
const MAX_HOPS = 3;
const TIMEOUT_MS = 5000;

const fail = (message: string): RemoteIconResult => ({ ok: false, message });

/**
 * True for loopback, private, link-local, CGNAT, multicast, metadata and
 * reserved addresses.
 */
export function isBlockedAddress(address: string): boolean {
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);

  if (mapped) return isBlockedAddress(mapped[1] as string);

  const hex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(address);

  if (hex) {
    const high = Number.parseInt(hex[1] as string, 16);
    const low = Number.parseInt(hex[2] as string, 16);

    return isBlockedAddress(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
  }

  if (isIP(address) === 4) {
    const [a = 0, b = 0, c = 0] = address.split('.').map(Number);

    return (
      a === 0
      || a === 10
      || a === 127
      || a >= 224
      || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168)
      || (a === 192 && b === 0 && (c === 0 || c === 2))
      || (a === 198 && (b === 18 || b === 19))
      || (a === 198 && b === 51 && c === 100)
      || (a === 203 && b === 0 && c === 113)
    );
  }

  const lower = address.toLowerCase();

  return (
    lower === '::'
    || lower === '::1'
    || /^f[cd]/.test(lower) // unique local
    || /^fe[89ab]/.test(lower) // link-local
    || lower.startsWith('ff') // multicast
    || lower.startsWith('64:ff9b') // NAT64
  );
}

type Resolver = (host: string) => Promise<string[]>;

const resolveHost: Resolver = async (host) =>
  (await lookup(host, { all: true })).map((entry) => entry.address);

async function checkUrl(
  raw: string,
  allowedHosts: Set<string> | undefined,
  resolve: Resolver,
): Promise<{ address: string } | { error: string }> {
  let url: URL;

  try {
    url = new URL(raw);
  } catch {
    return { error: 'That is not a valid URL' };
  }

  if (raw.length > MAX_URL) return { error: 'That URL is too long' };

  if (url.protocol !== 'https:' || (url.port && url.port !== '443')) {
    return { error: 'Only https URLs on the default port are allowed' };
  }

  if (url.username || url.password) return { error: 'URLs with credentials are not allowed' };

  if (allowedHosts && !allowedHosts.has(url.hostname)) return { error: 'That host is not allowed' };

  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(host) ? [host] : await resolve(host).catch(() => []);

  const [address] = addresses;

  if (!address) return { error: 'That host could not be reached' };

  return addresses.some(isBlockedAddress) ? { error: 'That host is not allowed' } : { address };
}

type PinnedFetch = (url: string, init: RequestInit, address: string) => Promise<Response>;

/**
 * Connects to the address that was just validated, so the host cannot resolve
 * differently at connect time (DNS rebinding). TLS SNI, certificate checks and
 * the Host header stay on the original hostname.
 */
const pinnedFetch: PinnedFetch = (raw, init, address) => {
  const url = new URL(raw);
  const literal = isIP(url.hostname.replace(/^\[|\]$/g, '')) !== 0;

  return new Promise((resolve, reject) => {
    const req = request(
      {
        host: address,
        port: 443,
        path: url.pathname + url.search,
        method: 'GET',
        ...(literal ? {} : { servername: url.hostname }),
        headers: { ...(init.headers as Record<string, string>), Host: url.host },
        ...(init.signal ? { signal: init.signal } : {}),
      },
      (res) => {
        const headers = new Headers();

        for (const [key, value] of Object.entries(res.headers)) {
          if (value !== undefined)
            headers.set(key, Array.isArray(value) ? value.join(', ') : value);
        }

        const status = res.statusCode ?? 502;
        const empty = status === 204 || status === 205 || status === 304;

        resolve(
          new Response(empty ? null : (Readable.toWeb(res) as ReadableStream), { status, headers }),
        );
      },
    );

    req.on('error', reject);
    req.end();
  });
};

async function readCapped(response: Response): Promise<null | string> {
  const reader = response.body?.getReader();

  if (!reader) return null;

  const chunks: Uint8Array[] = [];
  let size = 0;

  for (;;) {
    const { done, value } = await reader.read();

    if (done) break;

    size += value.byteLength;

    if (size > MAX_BODY) {
      await reader.cancel();

      return null;
    }

    chunks.push(value);
  }

  return new TextDecoder().decode(Buffer.concat(chunks));
}

/**
 * Admin-initiated, SSRF-hardened SVG download (D73). `allowedHosts` narrows
 * AI-proposed URLs; manual imports pass none. Each hop connects to its own
 * validated address (see `pinnedFetch`).
 */
export function createRemoteIconFetcher(
  options: { allowedHosts?: Set<string>; fetchImpl?: PinnedFetch; resolve?: Resolver } = {},
): RemoteIconFetcher {
  const { allowedHosts, fetchImpl = pinnedFetch, resolve = resolveHost } = options;

  return {
    async fetch(start, signal): Promise<RemoteIconResult> {
      const timeout = AbortSignal.timeout(TIMEOUT_MS);
      const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
      let current = start;

      for (let hop = 0; hop <= MAX_HOPS; hop += 1) {
        const checked = await checkUrl(current, allowedHosts, resolve);

        if ('error' in checked) return fail(checked.error);

        let response: Response;

        try {
          response = await fetchImpl(
            current,
            {
              redirect: 'manual',
              credentials: 'omit',
              cache: 'no-store',
              headers: { 'User-Agent': 'juliolmuller.com-logo-import', 'Accept': 'image/svg+xml' },
              signal: combined,
            },
            checked.address,
          );
        } catch {
          return fail('That URL could not be reached');
        }

        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');

          await response.body?.cancel();

          if (!location) return fail('That URL redirects nowhere');

          try {
            current = new URL(location, current).toString();
          } catch {
            return fail('That URL redirects to an invalid address');
          }

          continue;
        }

        if (!response.ok) return fail('That URL could not be reached');

        const type = response.headers.get('content-type') ?? '';

        if (!/^(?:image\/svg\+xml|text\/)/i.test(type)) return fail('That URL is not an SVG');

        let text: null | string;

        try {
          text = await readCapped(response);
        } catch {
          return fail('That URL could not be read');
        }

        if (text === null) return fail('That file is too large');

        if (!/<svg[\s>]/i.test(text)) return fail('That URL is not an SVG');

        const result = sanitizeSvg(text);

        return result.ok ? { ok: true, svg: result.svg } : fail(result.message);
      }

      return fail('That URL redirects too many times');
    },
  };
}
