class ImageEditor {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.originalImage = null;
    this.currentImage = null;
    this.adjustments = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      exposure: 0,
      sharpness: 0,
      temperature: 0,
      tint: 0,
      vignette: 0
    };
    this.currentFilter = null;
    this.cropData = null;
    this.cropper = null;
    
    // Undo history
    this.history = [];
    this.maxHistory = 20; // Maximum number of states to keep
    
    // Bind keyboard shortcuts
    this.handleKeyboard = this.handleKeyboard.bind(this);
    document.addEventListener('keydown', this.handleKeyboard);

    // Add rotation event listeners
    document.getElementById('rotateClockwise').addEventListener('click', () => {
      this.rotateImage(90);
    });

    document.getElementById('rotateAnticlockwise').addEventListener('click', () => {
      this.rotateImage(-90);
    });

    // Add flip event listeners
    document.getElementById('flipHorizontal').addEventListener('click', () => {
      this.flipImage('horizontal');
    });

    document.getElementById('flipVertical').addEventListener('click', () => {
      this.flipImage('vertical');
    });

    // Add properties to track current adjustments and filters
    this.currentAdjustments = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0
    };
    this.currentFilters = [];
  }

  handleKeyboard(e) {
    // Check for Ctrl+Z
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      this.undo();
    }
  }

  saveState() {
    // Create a copy of the current canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(this.canvas, 0, 0);
    
    // Save the current state
    this.history.push({
      imageData: tempCanvas.toDataURL(),
      width: this.canvas.width,
      height: this.canvas.height
    });
    
    // Limit history size
    if (this.history.length > 10) {
      this.history.shift();
    }
  }

  undo() {
    if (this.history.length === 0) return;
    
    // Get the last state
    const lastState = this.history.pop();
    
    // Create temp image to load the previous state
    const tempImage = new Image();
    tempImage.onload = () => {
      // Reset canvas dimensions to previous state
      this.canvas.width = lastState.width;
      this.canvas.height = lastState.height;
      
      // Draw the previous state
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(tempImage, 0, 0);
      
      // Update current image
      this.currentImage = tempImage;
    };
    tempImage.src = lastState.imageData;
  }

  updateCanvas() {
    if (!this.currentImage) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw the current image to temp canvas
    tempCtx.drawImage(this.currentImage, 0, 0, tempCanvas.width, tempCanvas.height);

    // Get image data for adjustments
    let imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;

    // Apply adjustments
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Apply exposure (before other adjustments)
      if (this.adjustments.exposure !== 0) {
        const exposureFactor = Math.pow(2, this.adjustments.exposure / 100);
        r *= exposureFactor;
        g *= exposureFactor;
        b *= exposureFactor;
      }

      // Apply brightness
      if (this.adjustments.brightness !== 0) {
        const brightnessFactor = 1 + (this.adjustments.brightness / 100);
        r *= brightnessFactor;
        g *= brightnessFactor;
        b *= brightnessFactor;
      }

      // Apply contrast
      if (this.adjustments.contrast !== 0) {
        const contrast = Math.max(-100, Math.min(100, this.adjustments.contrast));
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        r = factor * (r - 128) + 128;
        g = factor * (g - 128) + 128;
        b = factor * (b - 128) + 128;
      }

      // Convert to HSL for saturation adjustment
      let [h, s, l] = this.rgbToHsl(r, g, b);

      // Apply saturation
      if (this.adjustments.saturation !== 0) {
        s = Math.max(0, Math.min(1, s * (1 + this.adjustments.saturation / 100)));
      }

      // Convert back to RGB
      [r, g, b] = this.hslToRgb(h, s, l);

      // Apply temperature
      if (this.adjustments.temperature !== 0) {
        const temp = this.adjustments.temperature / 100;
        r += temp * 255 * (temp > 0 ? 1 : 0.5);
        b -= temp * 255 * (temp < 0 ? 1 : 0.5);
      }

      // Apply tint
      if (this.adjustments.tint !== 0) {
        const tintValue = this.adjustments.tint / 100;
        g += tintValue * 255 * (tintValue > 0 ? 1 : 0.5);
      }

      // Apply sharpness
      if (this.adjustments.sharpness > 0) {
        const centerPixel = [r, g, b];
        const sharpnessFactor = this.adjustments.sharpness / 100;
        
        // Calculate local contrast
        const avgColor = (r + g + b) / 3;
        r = r + (r - avgColor) * sharpnessFactor;
        g = g + (g - avgColor) * sharpnessFactor;
        b = b + (b - avgColor) * sharpnessFactor;
      }

      // Apply vignette (after all color adjustments)
      if (this.adjustments.vignette > 0) {
        const x = (i / 4) % tempCanvas.width;
        const y = Math.floor((i / 4) / tempCanvas.width);
        
        // Calculate distance from center
        const centerX = tempCanvas.width / 2;
        const centerY = tempCanvas.height / 2;
        const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        
        // Calculate vignette factor with smooth falloff
        const vignetteFactor = Math.cos((distance / maxDistance) * Math.PI * (this.adjustments.vignette / 100));
        
        r *= Math.max(0, vignetteFactor);
        g *= Math.max(0, vignetteFactor);
        b *= Math.max(0, vignetteFactor);
      }

      // Ensure values are within bounds
      data[i] = Math.max(0, Math.min(255, Math.round(r)));
      data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
      data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
    }

    // Put the processed image data back
    tempCtx.putImageData(imageData, 0, 0);
    
    // Clear and draw the processed image
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(tempCanvas, 0, 0);
  }

  getFilterString(filterName, intensity) {
    switch (filterName) {
      case 'grayscale':
        return `grayscale(${intensity})`;
      case 'sepia':
        return `sepia(${intensity})`;
      case 'invert':
        return `invert(${intensity * 100}%)`;
      case 'blur':
        return `blur(${intensity}px)`;
      default:
        return 'none';
    }
  }

  rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return [h, s, l];
  }

  hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  applyAdjustment(type, value) {
    if (!this.currentImage) return;

    // Update the current adjustment value
    this.currentAdjustments[type] = value;

    // Apply all effects
    this.applyAllEffects();
  }

  applyFilter(filterName, intensity = 1) {
    if (!this.currentImage) return;

    if (filterName === 'none') {
      // Reset all filters
      this.currentFilters = [];
      this.currentAdjustments = {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0
      };
      this.ctx.filter = 'none';
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(this.currentImage, 0, 0, this.canvas.width, this.canvas.height);
      this.saveState();
      return;
    }

    // Clear all existing filters when applying a new one
    this.currentFilters = [];

    // Create the filter value based on intensity
    let filterValue;
    switch(filterName) {
      case 'grayscale':
        filterValue = `grayscale(${intensity * 100}%)`;
        break;
      case 'sepia':
        filterValue = `sepia(${intensity * 100}%)`;
        break;
      case 'invert':
        filterValue = `invert(${intensity * 100}%)`;
        break;
      case 'blur':
        filterValue = `blur(${intensity}px)`;
        break;
      default:
        filterValue = filterName;
    }

    // Add the new filter
    this.currentFilters = [filterValue];

    // Update related adjustment if any
    switch(filterName) {
      case 'blur':
        this.currentAdjustments.blur = intensity;
        break;
      // Add other adjustment synchronizations as needed
    }

    // Reapply all adjustments and filters
    this.applyAllEffects();
    this.saveState();
  }

  resetFilters() {
    if (!this.currentImage) return;
    
    // Reset all adjustments and filters
    this.currentAdjustments = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0
    };
    this.currentFilters = [];

    // Reset canvas to original image
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.filter = 'none';
    this.ctx.drawImage(this.currentImage, 0, 0, this.canvas.width, this.canvas.height);
    
    this.saveState();
  }

  loadImage(img) {
    this.originalImage = img;
    this.currentImage = img;
    
    // Calculate dimensions to maintain aspect ratio
    const aspectRatio = img.width / img.height;
    if (img.width > img.height) {
      this.canvas.width = Math.min(800, img.width);
      this.canvas.height = this.canvas.width / aspectRatio;
    } else {
      this.canvas.height = Math.min(800, img.height);
      this.canvas.width = this.canvas.height * aspectRatio;
    }
    
    // Clear history when loading new image
    this.history = [];
    this.currentFilter = null;
    
    // Reset adjustments
    this.adjustments = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      exposure: 0,
      sharpness: 0,
      temperature: 0,
      tint: 0,
      vignette: 0
    };
    
    // Draw the image immediately
    const ctx = this.canvas.getContext('2d');
    ctx.filter = 'none';
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
    
    // Save initial state
    this.saveState();
  }

  resizeCanvas() {
    // Set display dimensions for the canvas
    const maxDisplayWidth = this.canvas.parentElement.clientWidth;
    const maxDisplayHeight = window.innerHeight * 0.7; // 70% of viewport height
    
    // Calculate display scale while maintaining aspect ratio
    const scale = Math.min(
      maxDisplayWidth / this.originalImage.width,
      maxDisplayHeight / this.originalImage.height
    );
    
    // Set canvas to original dimensions for full quality
    this.canvas.width = this.originalImage.width;
    this.canvas.height = this.originalImage.height;
    
    // Set display size using CSS
    this.canvas.style.width = (this.originalImage.width * scale) + 'px';
    this.canvas.style.height = (this.originalImage.height * scale) + 'px';
  }

  drawImage() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.currentImage, 0, 0, this.canvas.width, this.canvas.height);
  }

  resizeImageForAPI(image, maxDimension = 2000, maxSizeBytes = 9 * 1024 * 1024) {
    const canvas = document.createElement('canvas');
    let width = image.naturalWidth || image.width;
    let height = image.naturalHeight || image.height;

    // Resize if dimensions are too large
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, width, height);

    return canvas;
  }

  async getOptimizedBlob(canvas, maxSizeBytes = 9 * 1024 * 1024) {
    let quality = 1.0;
    let blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    
    // Reduce quality until file size is under maxSizeBytes
    while (blob.size > maxSizeBytes && quality > 0.1) {
      quality -= 0.1;
      blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    }

    if (blob.size > maxSizeBytes) {
      throw new Error('Unable to compress image to acceptable size. Please use a smaller image.');
    }

    return blob;
  }

  async removeBackground(apiKey) {
    if (!this.currentImage) {
      alert('Please upload an image first');
      return;
    }

    this.saveState();
    
    // Create and show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.textContent = 'Removing background...';
    this.canvas.parentElement.style.position = 'relative';
    this.canvas.parentElement.appendChild(loadingDiv);
    
    try {
      // Resize image if needed
      const resizedCanvas = this.resizeImageForAPI(this.currentImage);
      
      // Get optimized blob
      const blob = await this.getOptimizedBlob(resizedCanvas);
      console.log('Processed image size:', blob.size, 'bytes');

      const formData = new FormData();
      formData.append('size', 'auto');
      formData.append('image_file', blob, 'image.png');

      console.log('Sending image to remove.bg API...');

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey
        },
        body: formData
      });

      if (response.ok) {
        console.log('Received successful response from remove.bg');
        const resultBlob = await response.blob();
        const url = URL.createObjectURL(resultBlob);
        
        // Load the no-background image
        const noBackgroundImage = new Image();
        noBackgroundImage.onload = () => {
          // Create a new canvas for the final image
          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = this.canvas.width;
          finalCanvas.height = this.canvas.height;
          const finalCtx = finalCanvas.getContext('2d');
          
          // Draw the no-background image
          finalCtx.drawImage(noBackgroundImage, 0, 0, finalCanvas.width, finalCanvas.height);
          
          // Update the current image
          const finalImg = new Image();
          finalImg.onload = () => {
            this.currentImage = finalImg;
            this.updateCanvas();
            this.saveState();
            URL.revokeObjectURL(url);
            loadingDiv.remove();
          };
          finalImg.src = finalCanvas.toDataURL('image/png');
        };
        noBackgroundImage.src = url;
      } else {
        const errorData = await response.json();
        console.error('Remove.bg API error:', errorData);
        throw new Error(errorData.errors?.[0]?.title || 'Failed to remove background');
      }
    } catch (error) {
      console.error('Error removing background:', error);
      loadingDiv.remove();
      alert(error.message || 'Failed to remove background. Please check your API key and try again.');
      // Revert to previous state if there's an error
      if (this.history.length > 0) {
        this.undo();
      }
    }
  }

  setAdjustment(type, value) {
    this.saveState();
    if (type in this.adjustments) {
      this.adjustments[type] = value;
      this.updateCanvas();
    }
  }

  reset() {
    this.adjustments = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      exposure: 0,
      sharpness: 0,
      temperature: 0,
      tint: 0,
      vignette: 0
    };
    this.currentImage = this.originalImage;
    this.updateCanvas();
  }

  setFilter(filterName) {
    if (!this.currentImage) return;
    
    this.saveState(); // Save state before applying filter
    this.applyFilter(filterName);
  }

  resetAdjustments() {
    this.saveState();
    this.adjustments = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      exposure: 0,
      sharpness: 0,
      temperature: 0,
      tint: 0,
      vignette: 0
    };
    this.updateCanvas();
  }

  exportImage() {
    // Create a temporary canvas at original dimensions
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.originalImage.width;
    tempCanvas.height = this.originalImage.height;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    
    // Draw the original image
    tempCtx.drawImage(this.currentImage, 0, 0, tempCanvas.width, tempCanvas.height);
    
    // Get image data and apply adjustments
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      
      // Apply brightness
      r += this.adjustments.brightness;
      g += this.adjustments.brightness;
      b += this.adjustments.brightness;
      
      // Apply contrast
      const contrast = Math.min(Math.max(this.adjustments.contrast, -100), 100);
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      r = Math.max(0, Math.min(255, Math.round(factor * (r - 128) + 128)));
      g = Math.max(0, Math.min(255, Math.round(factor * (g - 128) + 128)));
      b = Math.max(0, Math.min(255, Math.round(factor * (b - 128) + 128)));
      
      // Apply saturation
      const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
      const satFactor = 1 + this.adjustments.saturation / 100;
      r = gray + satFactor * (r - gray);
      g = gray + satFactor * (g - gray);
      b = gray + satFactor * (b - gray);
      
      // Apply exposure
      const exposureFactor = Math.pow(2, this.adjustments.exposure / 100);
      r *= exposureFactor;
      g *= exposureFactor;
      b *= exposureFactor;

      // Apply sharpness using a simple contrast enhancement for affected pixels
      if (this.adjustments.sharpness > 0) {
        const centerPixel = [r, g, b];
        const sharpnessFactor = this.adjustments.sharpness / 100;
        
        // Enhance contrast between center pixel and surrounding pixels
        r = r + (r - (r + g + b) / 3) * sharpnessFactor;
        g = g + (g - (r + g + b) / 3) * sharpnessFactor;
        b = b + (b - (r + g + b) / 3) * sharpnessFactor;
      }

      // Apply temperature
      if (this.adjustments.temperature !== 0) {
        const temp = this.adjustments.temperature / 100;
        r += temp * 255 * (temp > 0 ? 1 : 0.5);
        b -= temp * 255 * (temp < 0 ? 1 : 0.5);
      }

      // Apply tint
      if (this.adjustments.tint !== 0) {
        const tintValue = this.adjustments.tint / 100;
        g += tintValue * 255 * (tintValue > 0 ? 1 : 0.5);
      }

      // Apply vignette
      if (this.adjustments.vignette > 0) {
        const x = (i / 4) % tempCanvas.width;
        const y = Math.floor((i / 4) / tempCanvas.width);
        
        // Calculate distance from center
        const centerX = tempCanvas.width / 2;
        const centerY = tempCanvas.height / 2;
        const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        
        // Calculate vignette factor with smooth falloff
        const vignetteFactor = 1 - (distance / maxDistance) * (this.adjustments.vignette / 100);
        
        r *= vignetteFactor;
        g *= vignetteFactor;
        b *= vignetteFactor;
      }

      // Ensure values are within bounds
      data[i] = Math.max(0, Math.min(255, Math.round(r)));
      data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
      data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
    }
    
    tempCtx.putImageData(imageData, 0, 0);
    
    // Apply any active filters
    if (this.currentFilters.length > 0) {
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = tempCanvas.width;
      finalCanvas.height = tempCanvas.height;
      const finalCtx = finalCanvas.getContext('2d');
      
      finalCtx.filter = this.currentFilters.join(' ');
      finalCtx.drawImage(tempCanvas, 0, 0);
      
      return finalCanvas.toDataURL('image/png');
    }
    
    return tempCanvas.toDataURL('image/png');
  }

  resetAll() {
    // Reset all adjustments
    this.adjustments = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      exposure: 0,
      sharpness: 0,
      temperature: 0,
      tint: 0,
      vignette: 0
    };

    // Reset filter options
    const filterOptions = document.querySelectorAll('.filter-option');
    filterOptions.forEach(option => {
      option.classList.remove('active');
      if (option.dataset.filter === 'none') {
        option.classList.add('active');
      }
    });

    // Reset slider values
    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
      slider.value = 0;
      const valueDisplay = slider.previousElementSibling.querySelector('.slider-value');
      if (valueDisplay) {
        valueDisplay.textContent = '0';
      }
    });
  }

  initCrop() {
    if (!this.currentImage) return;

    const cropPreview = document.querySelector('.crop-preview');
    
    // Create image element for cropper
    const img = document.createElement('img');
    img.src = this.canvas.toDataURL();
    cropPreview.innerHTML = '';
    cropPreview.appendChild(img);
    
    // Initialize cropper
    if (this.cropper) {
      this.cropper.destroy();
    }
    
    this.cropper = new Cropper(img, {
      viewMode: 1,
      dragMode: 'move',
      aspectRatio: NaN,
      autoCropArea: 0.8,
      restore: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
      ready: () => {
        // Add custom styles to the cropper
        const cropBox = document.querySelector('.cropper-crop-box');
        if (cropBox) {
          cropBox.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        }
      }
    });
  }

  setAspectRatio(ratio) {
    if (!this.cropper) return;
    
    if (ratio === 'free') {
      this.cropper.setAspectRatio(NaN);
      return;
    }
    
    const [width, height] = ratio.split(':').map(Number);
    this.cropper.setAspectRatio(width / height);
  }

  applyCrop() {
    if (!this.cropper) return;
    
    this.saveState();
    
    // Get the cropped canvas
    const croppedCanvas = this.cropper.getCroppedCanvas();
    
    // Update the main canvas with the cropped image
    this.canvas.width = croppedCanvas.width;
    this.canvas.height = croppedCanvas.height;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(croppedCanvas, 0, 0);
    
    // Update current image
    const tempImage = new Image();
    tempImage.onload = () => {
      this.currentImage = tempImage;
      this.cropper.destroy();
      this.cropper = null;
      
      // Close the crop popup
      document.querySelector('.crop-popup').classList.remove('active');
    };
    tempImage.src = this.canvas.toDataURL();
  }

  rotateImage(degrees) {
    if (!this.currentImage) {
      console.log('No current image loaded');
      return;
    }

    // Create a temporary canvas
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // Set dimensions based on rotation
    if (Math.abs(degrees) === 90) {
        tempCanvas.width = this.canvas.height;
        tempCanvas.height = this.canvas.width;
    } else {
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
    }

    // Translate and rotate
    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
    tempCtx.rotate((degrees * Math.PI) / 180);
    tempCtx.drawImage(
        this.canvas, 
        -this.canvas.width / 2, 
        -this.canvas.height / 2
    );

    // Update canvas dimensions and draw rotated image
    this.canvas.width = tempCanvas.width;
    this.canvas.height = tempCanvas.height;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(tempCanvas, 0, 0);

    this.saveState();
  }

  flipImage(direction) {
    if (!this.currentImage) {
      console.log('No current image loaded');
      return;
    }

    // Create a temporary canvas
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;

    // Set up the transformation
    if (direction === 'horizontal') {
      tempCtx.translate(tempCanvas.width, 0);
      tempCtx.scale(-1, 1);
    } else if (direction === 'vertical') {
      tempCtx.translate(0, tempCanvas.height);
      tempCtx.scale(1, -1);
    }

    // Draw the flipped image
    tempCtx.drawImage(this.canvas, 0, 0);

    // Clear and update the main canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(tempCanvas, 0, 0);

    this.saveState();
  }

  applyAllEffects() {
    // Reset canvas to original image
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.filter = 'none';
    this.ctx.drawImage(this.currentImage, 0, 0, this.canvas.width, this.canvas.height);

    // Build filter string from adjustments and filters
    let filterString = '';

    // Add adjustments to filter string
    if (this.currentAdjustments.brightness !== 100) {
      filterString += `brightness(${this.currentAdjustments.brightness}%) `;
    }
    if (this.currentAdjustments.contrast !== 100) {
      filterString += `contrast(${this.currentAdjustments.contrast}%) `;
    }
    if (this.currentAdjustments.saturation !== 100) {
      filterString += `saturate(${this.currentAdjustments.saturation}%) `;
    }
    if (this.currentAdjustments.blur !== 0) {
      filterString += `blur(${this.currentAdjustments.blur}px) `;
    }

    // Add current filter
    if (this.currentFilters.length > 0) {
      filterString += this.currentFilters.join(' ');
    }

    // Apply all filters at once
    this.ctx.filter = filterString.trim() || 'none';
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.currentImage, 0, 0, this.canvas.width, this.canvas.height);
  }
}