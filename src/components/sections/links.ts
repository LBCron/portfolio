/**
 * `rel` for external links: own profiles also get `me` (§13.5).
 */
export function externalRel(isOwnProfile = false) {
  return isOwnProfile ? 'me noopener noreferrer' : 'noopener noreferrer';
}
