export function applyContrast(r, g, b, contrast) {
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  return {
    r: factor * (r - 128) + 128,
    g: factor * (g - 128) + 128,
    b: factor * (b - 128) + 128
  };
}