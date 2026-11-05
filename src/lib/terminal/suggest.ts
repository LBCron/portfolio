export function levenshtein(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    for (let j = 1; j <= b.length; j += 1) {
      row[j] = Math.min(
        (previous[j] as number) + 1,
        (row[j - 1] as number) + 1,
        (previous[j - 1] as number) + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = row;
  }

  return previous[b.length] as number;
}

/**
 * The closest candidate within distance 2, or `null`.
 */
export function didYouMean(input: string, candidates: readonly string[]): null | string {
  let best: { distance: number; name: string } | null = null;
  for (const name of candidates) {
    const distance = levenshtein(input.toLowerCase(), name);

    if (distance <= 2 && (!best || distance < best.distance)) {
      best = { name, distance };
    }
  }

  return best?.name ?? null;
}
