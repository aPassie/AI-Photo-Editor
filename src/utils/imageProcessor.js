import { applyAllAdjustments } from './imageAdjustments';
import { clampColor } from './color';

export function processImageData(imageData, adjustments) {
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const { r, g, b } = applyAllAdjustments(
      data[i], 
      data[i + 1], 
      data[i + 2], 
      adjustments
    );
    
    data[i] = r;     // No need for clampColor since applyAllAdjustments already clamps
    data[i + 1] = g;
    data[i + 2] = b;
  }
  
  return imageData;
}