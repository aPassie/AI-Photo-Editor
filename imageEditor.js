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
    
    this.history = [];
    this.maxHistory = 20;
    
    this.handleKeyboard = this.handleKeyboard.bind(this);
    document.addEventListener('keydown', this.handleKeyboard);

    document.getElementById('rotateClockwise').addEventListener('click', () => {
      this.rotateImage(90);
    });

    document.getElementById('rotateAnticlockwise').addEventListener('click', () => {
      this.rotateImage(-90);
    });

    document.getElementById('flipHorizontal').addEventListener('click', () => {
      this.flipImage('horizontal');
    });

    document.getElementById('flipVertical').addEventListener('click', () => {
      this.flipImage('vertical');
    });

    this.currentAdjustments = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0
    };
    this.currentFilters = [];
  }

  handleKeyboard(e) {
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      this.undo();
    }
  }

  saveState() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(this.canvas, 0, 0);
    
    this.history.push({
      imageData: tempCanvas.toDataURL(),
      width: this.canvas.width,
      height: this.canvas.height
    });
    
    if (this.history.length > 10) {
      this.history.shift();
    }
  }

  undo() {
    if (this.history.length === 0) return;
    
    const lastState = this.history.pop();
    
    const tempImage = new Image();
    tempImage.onload = () => {
      this.canvas.width = lastState.width;
      this.canvas.height = lastState.height;
      
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(tempImage, 0, 0);
      
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

    tempCtx.drawImage(this.currentImage, 0, 0, tempCanvas.width, tempCanvas.height);

    let imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      if (this.adjustments.exposure !== 0) {
        const exposureFactor = Math.pow(2, this.adjustments.exposure / 100);
        r *= exposureFactor;
        g *= exposureFactor;
        b *= exposureFactor;
      }

      if (this.adjustments.brightness !== 0) {
        const brightnessFactor = 1 + (this.adjustments.brightness / 100);
        r *= brightnessFactor;
        g *= brightnessFactor;
        b *= brightnessFactor;
      }

      if (this.adjustments.contrast !== 0) {
        const contrast = Math.max(-100, Math.min(100, this.adjustments.contrast));
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        r = factor * (r - 128) + 128;
        g = factor * (g - 128) + 128;
        b = factor * (b - 128) + 128;
      }

      let [h, s, l] = this.rgbToHsl(r, g, b);

      if (this.adjustments.saturation !== 0) {
        s = Math.max(0, Math.min(1, s * (1 + this.adjustments.saturation / 100)));
      }

      [r, g, b] = this.hslToRgb(h, s, l);

      if (this.adjustments.temperature !== 0) {
        const temp = this.adjustments.temperature / 100;
        r += temp * 255 * (temp > 0 ? 1 : 0.5);
        b -= temp * 255 * (temp < 0 ? 1 : 0.5);
      }

      if (this.adjustments.tint !== 0) {
        const tintValue = this.adjustments.tint / 100;
        g += tintValue * 255 * (tintValue > 0 ? 1 : 0.5);
      }

      if (this.adjustments.sharpness > 0) {
        const centerPixel = [r, g, b];
        const sharpnessFactor = this.adjustments.sharpness / 100;
        
        const avgColor = (r + g + b) / 3;
        r = r + (r - avgColor) * sharpnessFactor;
        g = g + (g - avgColor) * sharpnessFactor;
        b = b + (b - avgColor) * sharpnessFactor;
      }

      if (this.adjustments.vignette > 0) {
        const x = (i / 4) % tempCanvas.width;
        const y = Math.floor((i / 4) / tempCanvas.width);
        
        const centerX = tempCanvas.width / 2;
        const centerY = tempCanvas.height / 2;
        const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        
        const vignetteFactor = Math.cos((distance / maxDistance) * Math.PI * (this.adjustments.vignette / 100));
        
        r *= Math.max(0, vignetteFactor);
        g *= Math.max(0, vignetteFactor);
        b *= Math.max(0, vignetteFactor);
      }

      data[i] = Math.max(0, Math.min(255, Math.round(r)));
      data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
      data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
    }

    tempCtx.putImageData(imageData, 0, 0);
    
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
      h = s = 0;
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
      r = g = b = l;
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

    this.currentAdjustments[type] = value;

    this.applyAllEffects();
  }

  applyFilter(filterName, intensity = 1) {
    if (!this.currentImage) return;

    if (filterName === 'none') {
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

    this.currentFilters = [];

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

    this.currentFilters = [filterValue];

    switch(filterName) {
      case 'blur':
        this.currentAdjustments.blur = intensity;
        break;
    }

    this.applyAllEffects();
    this.saveState();
  }

  resetFilters() {
    if (!this.currentImage) return;
    
    this.currentAdjustments = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0
    };
    this.currentFilters = [];

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.filter = 'none';
    this.ctx.drawImage(this.currentImage, 0, 0, this.canvas.width, this.canvas.height);
    
    this.saveState();
  }

  loadImage(img) {
    this.originalImage = img;
    this.currentImage = img;
    
    const aspectRatio = img.width / img.height;
    if (img.width > img.height) {
      this.canvas.width = Math.min(800, img.width);
      this.canvas.height = this.canvas.width / aspectRatio;
    } else {
      this.canvas.height = Math.min(800, img.height);
      this.canvas.width = this.canvas.height * aspectRatio;
    }
    
    this.history = [];
    this.currentFilter = null;
    
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
    
    this.currentFilters = [];
    
    this.ctx.filter = 'none';
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
    
    this.saveState();
  }

  resizeCanvas() {
    if (!this.currentImage) return;

    const maxWidth = this.canvas.parentElement.clientWidth;
    const maxHeight = window.innerHeight * 0.7;
    
    const imgWidth = this.originalImage.width;
    const imgHeight = this.originalImage.height;
    const ratio = imgWidth / imgHeight;

    if (ratio > maxWidth / maxHeight) {
      this.canvas.width = maxWidth;
      this.canvas.height = maxWidth / ratio;
    } else {
      this.canvas.height = maxHeight;
      this.canvas.width = maxHeight * ratio;
    }
  }

  drawImage() {
    if (!this.currentImage) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    const ratio = this.currentImage.width / this.currentImage.height;
    let drawWidth = this.canvas.width;
    let drawHeight = this.canvas.height;
    
    if (ratio > this.canvas.width / this.canvas.height) {
      drawHeight = this.canvas.width / ratio;
    } else {
      drawWidth = this.canvas.height * ratio;
    }
    
    const x = (this.canvas.width - drawWidth) / 2;
    const y = (this.canvas.height - drawHeight) / 2;
    
    this.ctx.drawImage(this.currentImage, x, y, drawWidth, drawHeight);
  }

  resizeImageForAPI(image, maxDimension = 2000, maxSizeBytes = 9 * 1024 * 1024) {
    const canvas = document.createElement('canvas');
    let width = image.naturalWidth || image.width;
    let height = image.naturalHeight || image.height;

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
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.textContent = 'Removing background...';
    this.canvas.parentElement.style.position = 'relative';
    this.canvas.parentElement.appendChild(loadingDiv);
    
    try {
      const resizedCanvas = this.resizeImageForAPI(this.currentImage);
      
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
        
        const noBackgroundImage = new Image();
        noBackgroundImage.onload = () => {
          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = this.canvas.width;
          finalCanvas.height = this.canvas.height;
          const finalCtx = finalCanvas.getContext('2d');
          
          finalCtx.drawImage(noBackgroundImage, 0, 0, finalCanvas.width, finalCanvas.height);
          
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
    
    this.saveState();
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
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.drawImage(this.canvas, 0, 0);

    return tempCanvas.toDataURL('image/png');
  }

  resetAll() {
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

    this.currentFilters = [];
    this.currentFilter = null;

    const filterOptions = document.querySelectorAll('.filter-option');
    filterOptions.forEach(option => {
      option.classList.remove('active');
      if (option.dataset.filter === 'none') {
        option.classList.add('active');
      }
      const sliderContainer = option.querySelector('.filter-slider-container');
      if (sliderContainer) {
        const slider = sliderContainer.querySelector('.filter-slider');
        const value = sliderContainer.querySelector('.filter-slider-value');
        if (slider) slider.value = slider.defaultValue;
        if (value) value.textContent = slider.defaultValue + (slider.dataset.filter === 'blur' ? 'px' : '%');
      }
    });

    const sliders = document.querySelectorAll('.slider-container input[type="range"]');
    sliders.forEach(slider => {
      slider.value = 0;
      const valueDisplay = slider.parentElement.querySelector('.slider-value');
      if (valueDisplay) {
        valueDisplay.textContent = '0';
      }
    });

    this.currentImage = this.originalImage;
    
    const maxWidth = this.canvas.parentElement.clientWidth;
    const maxHeight = window.innerHeight * 0.7;
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    const ratio = this.originalImage.width / this.originalImage.height;
    if (ratio > maxWidth / maxHeight) {
      tempCanvas.width = maxWidth;
      tempCanvas.height = maxWidth / ratio;
    } else {
      tempCanvas.height = maxHeight;
      tempCanvas.width = maxHeight * ratio;
    }
    
    tempCtx.drawImage(this.originalImage, 0, 0, tempCanvas.width, tempCanvas.height);
    
    this.canvas.width = tempCanvas.width;
    this.canvas.height = tempCanvas.height;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.filter = 'none';
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(tempCanvas, 0, 0);
    
    const img = new Image();
    img.onload = () => {
      this.currentImage = img;
    };
    img.src = this.canvas.toDataURL();
  }

  initCrop() {
    if (!this.currentImage) return;

    const cropPreview = document.querySelector('.crop-preview');
    
    const img = document.createElement('img');
    img.src = this.canvas.toDataURL();
    cropPreview.innerHTML = '';
    cropPreview.appendChild(img);
    
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
    
    const croppedCanvas = this.cropper.getCroppedCanvas();
    
    this.canvas.width = croppedCanvas.width;
    this.canvas.height = croppedCanvas.height;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(croppedCanvas, 0, 0);
    
    const tempImage = new Image();
    tempImage.onload = () => {
      this.currentImage = tempImage;
      this.cropper.destroy();
      this.cropper = null;
      
      document.querySelector('.crop-popup').classList.remove('active');
    };
    tempImage.src = this.canvas.toDataURL();
  }

  rotateImage(degrees) {
    if (!this.currentImage) {
      console.log('No current image loaded');
      return;
    }

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    if (Math.abs(degrees) === 90) {
        tempCanvas.width = this.canvas.height;
        tempCanvas.height = this.canvas.width;
    } else {
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
    }

    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
    tempCtx.rotate((degrees * Math.PI) / 180);
    tempCtx.drawImage(
        this.canvas, 
        -this.canvas.width / 2, 
        -this.canvas.height / 2
    );

    this.canvas.width = tempCanvas.width;
    this.canvas.height = tempCanvas.height;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(tempCanvas, 0, 0);

    const img = new Image();
    img.onload = () => {
      this.currentImage = img;
    };
    img.src = tempCanvas.toDataURL();

    this.saveState();
  }

  flipImage(direction) {
    if (!this.currentImage) {
      console.log('No current image loaded');
      return;
    }

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;

    if (direction === 'horizontal') {
      tempCtx.translate(tempCanvas.width, 0);
      tempCtx.scale(-1, 1);
    } else if (direction === 'vertical') {
      tempCtx.translate(0, tempCanvas.height);
      tempCtx.scale(1, -1);
    }

    tempCtx.drawImage(this.canvas, 0, 0);

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(tempCanvas, 0, 0);

    const img = new Image();
    img.onload = () => {
      this.currentImage = img;
    };
    img.src = tempCanvas.toDataURL();

    this.saveState();
  }

  applyAllEffects() {
    if (!this.currentImage) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.filter = 'none';
    this.ctx.drawImage(this.currentImage, 0, 0, this.canvas.width, this.canvas.height);

    if (Object.values(this.adjustments).some(v => v !== 0)) {
      this.updateCanvas();
    }

    if (this.currentFilters.length > 0) {
      this.ctx.filter = this.currentFilters.join(' ');
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(this.currentImage, 0, 0, this.canvas.width, this.canvas.height);
    }
  }
}