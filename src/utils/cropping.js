export class CropTool {
  constructor(canvas, onCropComplete) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onCropComplete = onCropComplete;
    this.isActive = false;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.cropX = 0;
    this.cropY = 0;
    this.cropWidth = 0;
    this.cropHeight = 0;
    
    this.setupEventListeners();
  }
  
  activate() {
    this.isActive = true;
    this.createOverlay();
  }
  
  deactivate() {
    this.isActive = false;
    this.removeOverlay();
  }
  
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'crop-overlay active';
    this.cropArea = document.createElement('div');
    this.cropArea.className = 'crop-area';
    this.overlay.appendChild(this.cropArea);
    this.canvas.parentElement.appendChild(this.overlay);
    
    const positions = ['nw', 'ne', 'sw', 'se'];
    positions.forEach(pos => {
      const handle = document.createElement('div');
      handle.className = `crop-handle ${pos}`;
      handle.style.cursor = `${pos}-resize`;
      this.cropArea.appendChild(handle);
    });
  }
  
  removeOverlay() {
    if (this.overlay) {
      this.overlay.remove();
    }
  }
  
  setupEventListeners() {
    this.overlay?.addEventListener('mousedown', this.startCrop.bind(this));
    document.addEventListener('mousemove', this.updateCrop.bind(this));
    document.addEventListener('mouseup', this.endCrop.bind(this));
  }
  
  startCrop(e) {
    if (!this.isActive) return;
    
    this.isDragging = true;
    const rect = this.canvas.getBoundingClientRect();
    this.startX = e.clientX - rect.left;
    this.startY = e.clientY - rect.top;
    this.cropX = this.startX;
    this.cropY = this.startY;
  }
  
  updateCrop(e) {
    if (!this.isDragging) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.cropWidth = x - this.startX;
    this.cropHeight = y - this.startY;
    
    this.updateCropArea();
  }
  
  updateCropArea() {
    if (!this.cropArea) return;
    
    const left = Math.min(this.startX, this.startX + this.cropWidth);
    const top = Math.min(this.startY, this.startY + this.cropHeight);
    const width = Math.abs(this.cropWidth);
    const height = Math.abs(this.cropHeight);
    
    this.cropArea.style.left = `${left}px`;
    this.cropArea.style.top = `${top}px`;
    this.cropArea.style.width = `${width}px`;
    this.cropArea.style.height = `${height}px`;
  }
  
  endCrop() {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    if (this.cropWidth && this.cropHeight) {
      const cropData = {
        x: this.cropX,
        y: this.cropY,
        width: this.cropWidth,
        height: this.cropHeight
      };
      this.onCropComplete(cropData);
    }
  }
}