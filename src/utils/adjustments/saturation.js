export function applySaturation(r, g, b, saturation) {
  const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
  const satFactor = 1 + saturation / 100;
  return {
    r: gray + satFactor * (r - gray),
    g: gray + satFactor * (g - gray),
    b: gray + satFactor * (b - gray)
  };
}