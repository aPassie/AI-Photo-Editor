import { filters } from './utils/filters.js';
import { CropTool } from './utils/cropping.js';
import { processImageData } from './utils/imageProcessor.js';

export class ImageEditor {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.originalImage = null;
    this.currentImage = null;
    this.adjustments = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      currentFilter: 'none'
    };
    
    this.cropTool = new CropTool(this.canvas, this.applyCrop.bind(this));
  }

  loadImage(img) {
    this.originalImage = img;
    this.currentImage = img;
    this.resizeCanvas();
    this.drawImage();
  }

  resizeCanvas() {
    const maxWidth = this.canvas.parentElement.clientWidth;
    const maxHeight = 600;
    
    let width = this.originalImage.width;
    let height = this.originalImage.height;
    
    if (width > maxWidth) {
      height = (maxWidth * height) / width;
      width = maxWidth;
    }
    
    if (height > maxHeight) {
      width = (maxHeight * width) / height;
      height = maxHeight;
    }
    
    this.canvas.width = width;
    this.canvas.height = height;
  }

  drawImage() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.currentImage, 0, 0, this.canvas.width, this.canvas.height);
    this.applyAdjustments();
    this.applyFilter();
  }

  applyAdjustments() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const processedData = processImageData(imageData, this.adjustments);
    this.ctx.putImageData(processedData, 0, 0);
  }

  applyFilter() {
    if (this.adjustments.currentFilter === 'none') return;
    
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const filteredData = filters[this.adjustments.currentFilter](imageData);
    this.ctx.putImageData(filteredData, 0, 0);
  }

  setFilter(filterName) {
    if (filters[filterName]) {
      this.adjustments.currentFilter = filterName;
      this.drawImage();
    }
  }

  startCrop() {
    this.cropTool.activate();
  }

  applyCrop(cropData) {
    const { x, y, width, height } = cropData;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = Math.abs(width);
    tempCanvas.height = Math.abs(height);
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCtx.drawImage(
      this.canvas,
      x, y, Math.abs(width), Math.abs(height),
      0, 0, Math.abs(width), Math.abs(height)
    );
    
    const img = new Image();
    img.onload = () => {
      this.currentImage = img;
      this.resizeCanvas();
      this.drawImage();
      this.cropTool.deactivate();
    };
    img.src = tempCanvas.toDataURL();
  }

  async removeBackground(apiKey) {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.textContent = 'Removing background...';
    this.canvas.parentElement.appendChild(loadingDiv);

    try {
      const blob = await new Promise(resolve => this.canvas.toBlob(resolve));
      const formData = new FormData();
      formData.append('image_file', blob);

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey
        },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to remove background');

      const buffer = await response.arrayBuffer();
      const blob2 = new Blob([buffer], { type: 'image/png' });
      const img = new Image();
      img.onload = () => {
        this.currentImage = img;
        this.drawImage();
      };
      img.src = URL.createObjectURL(blob2);
    } finally {
      loadingDiv.remove();
    }
  }

  adjustBrightness(value) {
    this.adjustments.brightness = value;
    this.drawImage();
  }

  adjustContrast(value) {
    this.adjustments.contrast = value;
    this.drawImage();
  }

  adjustSaturation(value) {
    this.adjustments.saturation = value;
    this.drawImage();
  }

  reset() {
    this.adjustments = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      currentFilter: 'none'
    };
    this.currentImage = this.originalImage;
    this.drawImage();
  }
}