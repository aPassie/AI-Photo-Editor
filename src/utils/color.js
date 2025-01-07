/**
 * Color utility functions for image processing
 * @module color
 */

/**
 * Clamp a color value between 0 and 255
 * @param {number} value - Color value to clamp
 * @returns {number} Clamped value between 0 and 255
 */
export function clampColor(value) {
  return Math.max(0, Math.min(255, value));
}