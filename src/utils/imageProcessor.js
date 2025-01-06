import { applyBrightness } from './adjustments/brightness';
import { applyContrast } from './adjustments/contrast';
import { applySaturation } from './adjustments/saturation';
import { clampColor } from './color';

export function processImageData(imageData, adjustments) {
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    let { r, g, b } = applyBrightness(data[i], data[i + 1], data[i + 2], adjustments.brightness);
    ({ r, g, b } = applyContrast(r, g, b, adjustments.contrast));
    ({ r, g, b } = applySaturation(r, g, b, adjustments.saturation));
    
    data[i] = clampColor(r);
    data[i + 1] = clampColor(g);
    data[i + 2] = clampColor(b);
  }
  
  return imageData;
}