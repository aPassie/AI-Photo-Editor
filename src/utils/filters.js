/**
 * Collection of image filter functions
 * @module filters
 */

/**
 * Object containing all available filter functions
 * @type {Object.<string, function>}
 */
export const filters = {
  /**
   * No filter - returns original image
   * @param {ImageData} imageData - The image data to process
   * @returns {ImageData} Unmodified image data
   */
  none: (imageData) => imageData,
  
  /**
   * Convert image to grayscale
   * @param {ImageData} imageData - The image data to process
   * @returns {ImageData} Grayscale image data
   */
  grayscale: (imageData) => {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = data[i + 1] = data[i + 2] = gray;
    }
    return imageData;
  },
  
  /**
   * Apply sepia tone effect
   * @param {ImageData} imageData - The image data to process
   * @returns {ImageData} Sepia-toned image data
   */
  sepia: (imageData) => {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
      data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
      data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
    }
    return imageData;
  },
  
  /**
   * Invert image colors
   * @param {ImageData} imageData - The image data to process
   * @returns {ImageData} Color-inverted image data
   */
  invert: (imageData) => {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
    return imageData;
  },
  
  /**
   * Apply Gaussian blur effect
   * Uses a 3x3 convolution kernel
   * @param {ImageData} imageData - The image data to process
   * @returns {ImageData} Blurred image data
   */
  blur: (imageData) => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const kernel = [
      [1/9, 1/9, 1/9],
      [1/9, 1/9, 1/9],
      [1/9, 1/9, 1/9]
    ];
    
    const result = new Uint8ClampedArray(data);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              sum += data[idx] * kernel[ky + 1][kx + 1];
            }
          }
          const idx = (y * width + x) * 4 + c;
          result[idx] = sum;
        }
      }
    }
    
    imageData.data.set(result);
    return imageData;
  }
};