/**
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @param {number} brightness - Brightness adjustment value
 * @returns {Object} Adjusted RGB values
 */
export function applyBrightness(r, g, b, brightness) {
  return {
    r: r + brightness,
    g: g + brightness,
    b: b + brightness
  };
}

/**
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @param {number} contrast - Contrast adjustment value (-100 to 100)
 * @returns {Object} Adjusted RGB values
 */
export function applyContrast(r, g, b, contrast) {
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  return {
    r: factor * (r - 128) + 128,
    g: factor * (g - 128) + 128,
    b: factor * (b - 128) + 128
  };
}

/**
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @param {number} saturation - Saturation adjustment value (-100 to 100)
 * @returns {Object} Adjusted RGB values
 */
export function applySaturation(r, g, b, saturation) {
  const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
  const satFactor = 1 + saturation / 100;
  return {
    r: gray + satFactor * (r - gray),
    g: gray + satFactor * (g - gray),
    b: gray + satFactor * (b - gray)
  };
}

/**
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @param {Object} adjustments - Object containing adjustment values
 * @returns {Object} Adjusted RGB values
 */
export function applyAllAdjustments(r, g, b, adjustments) {
  if (adjustments.brightness !== 0) {
    const brightResult = applyBrightness(r, g, b, adjustments.brightness);
    r = brightResult.r;
    g = brightResult.g;
    b = brightResult.b;
  }

  if (adjustments.contrast !== 0) {
    const contrastResult = applyContrast(r, g, b, adjustments.contrast);
    r = contrastResult.r;
    g = contrastResult.g;
    b = contrastResult.b;
  }

  if (adjustments.saturation !== 0) {
    const satResult = applySaturation(r, g, b, adjustments.saturation);
    r = satResult.r;
    g = satResult.g;
    b = satResult.b;
  }

  return {
    r: Math.max(0, Math.min(255, Math.round(r))),
    g: Math.max(0, Math.min(255, Math.round(g))),
    b: Math.max(0, Math.min(255, Math.round(b)))
  };
}
