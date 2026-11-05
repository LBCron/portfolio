/**
 * The only part of the secret feature in the public terminal chunk: just enough
 * to know when to load the lazy module.
 */
export const SECRET_NAMES = ['su', 'admin', 'logout'] as const;

export const isSecretName = (name: string | undefined) =>
  (SECRET_NAMES as ReadonlyArray<string | undefined>).includes(name);
