export function applyBrightness(r, g, b, brightness) {
  return {
    r: r + brightness,
    g: g + brightness,
    b: b + brightness
  };
}