/** Font size (px, floored to 0.5) at which text of `contentWidth` at `fontSize` fits `available`, capped at `max`. */
export function fitFontSize({
  available,
  contentWidth,
  fontSize,
  max,
}: {
  available: number;
  contentWidth: number;
  fontSize: number;
  max: number;
}) {
  if (contentWidth <= 0 || available <= 0) return Math.min(max, fontSize);
  const fitted = (fontSize * available) / contentWidth;
  return Math.floor(Math.min(max, fitted) * 2) / 2;
}
