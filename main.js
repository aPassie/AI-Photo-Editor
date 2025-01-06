let editor;

document.addEventListener('DOMContentLoaded', () => {
  editor = new ImageEditor('canvas');
  setupEventListeners();
  updateSliderValues();
  initializeTheme();
});

function setupEventListeners() {
  const uploadBtn = document.getElementById('uploadBtn');
  const imageUpload = document.getElementById('imageUpload');
  const removeBackgroundBtn = document.getElementById('removeBackground');
  const downloadBtn = document.getElementById('downloadBtn');
  const resetBtn = document.getElementById('reset');
  const undoBtn = document.getElementById('undoBtn');
  const cropBtn = document.getElementById('cropBtn');
  const cropPopup = document.getElementById('cropPopup');
  const closeCropBtn = document.getElementById('closeCrop');
  const applyCropBtn = document.getElementById('applyCrop');
  const aspectRatioBtns = document.querySelectorAll('.aspect-ratio-btn');
  const sliders = document.querySelectorAll('input[type="range"]');
  const filterOptions = document.querySelectorAll('.filter-option');
  const themeToggle = document.getElementById('themeToggle');

  uploadBtn.addEventListener('click', () => imageUpload.click());
  
  imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          editor.loadImage(img);
          document.getElementById('uploadPrompt').style.display = 'none';
          
          editor.reset();
          updateSliderValues();
          updateFilterSelection('none');
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  removeBackgroundBtn.addEventListener('click', async () => {
    if (!editor.currentImage) {
      alert('Please upload an image first');
      return;
    }
    const apiKey = '7j5Upt8StQigcnciUFynboa3';
    try {
      await editor.removeBackground(apiKey);
    } catch (error) {
      alert('Error removing background. Please check your API key.');
    }
  });

  downloadBtn.addEventListener('click', () => {
    if (!editor.currentImage) {
      alert('Please upload an image first');
      return;
    }
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = editor.exportImage();
    link.click();
  });

  resetBtn.addEventListener('click', () => {
    if (!editor.currentImage) {
      alert('Please upload an image first');
      return;
    }
    editor.reset();
    updateSliderValues();
    updateFilterSelection('none');
  });

  undoBtn.addEventListener('click', () => {
    if (!editor.currentImage) {
      alert('Please upload an image first');
      return;
    }
    editor.undo();
  });

  cropBtn.addEventListener('click', () => {
    if (!editor.currentImage) {
      alert('Please upload an image first');
      return;
    }
    cropPopup.classList.add('active');
    editor.initCrop();
  });

  closeCropBtn.addEventListener('click', () => {
    cropPopup.classList.add('closing');
    setTimeout(() => {
      cropPopup.classList.remove('active', 'closing');
    }, 300); 
  });

  cropPopup.addEventListener('click', (e) => {
    if (e.target === cropPopup) {
      cropPopup.classList.add('closing');
      setTimeout(() => {
        cropPopup.classList.remove('active', 'closing');
      }, 300); 
    }
  });

  applyCropBtn.addEventListener('click', () => {
    editor.applyCrop();
    cropPopup.classList.add('closing');
    setTimeout(() => {
      cropPopup.classList.remove('active', 'closing');
    }, 300); 
  });

  aspectRatioBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      aspectRatioBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      editor.setAspectRatio(btn.dataset.ratio);
    });
  });

  editor.canvas.addEventListener('adjustmentsChanged', (event) => {
    const { adjustments, hasHistory, currentFilter } = event.detail;
    
    Object.entries(adjustments).forEach(([key, value]) => {
      const slider = document.getElementById(key);
      if (slider) {
        slider.value = value;
        const valueDisplay = slider.parentElement.querySelector('.slider-value');
        if (valueDisplay) {
          valueDisplay.textContent = value;
        }
      }
    });

    const filterOptions = document.querySelectorAll('.filter-option');
    filterOptions.forEach(option => {
      option.classList.remove('active');
      if ((!hasHistory || currentFilter === null) && option.dataset.filter === 'none') {
        option.classList.add('active');
      } else if (currentFilter && option.dataset.filter === currentFilter.name) {
        option.classList.add('active');
      }
    });

    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) {
      undoBtn.disabled = !hasHistory;
    }
  });

  sliders.forEach(slider => {
    slider.addEventListener('input', (e) => {
      if (!editor.currentImage) {
        alert('Please upload an image first');
        return;
      }
      const value = parseFloat(e.target.value);
      const sliderId = e.target.id;
      
      const valueDisplay = slider.parentElement.querySelector('.slider-value');
      if (valueDisplay) {
        valueDisplay.textContent = value;
      }
      
      editor.setAdjustment(sliderId, value);
    });
  });

  filterOptions.forEach(option => {
    option.addEventListener('click', () => {
      if (!editor.currentImage) {
        alert('Please upload an image first');
        return;
      }
      const filterName = option.dataset.filter;
      updateFilterSelection(filterName);
      
      if (filterName === 'none') {
        editor.applyFilter('none');
      } else {
        const filterSlider = option.querySelector('.filter-slider');
        const value = filterSlider ? parseInt(filterSlider.value) : 100;
        applyFilter(filterName, value);
      }
    });
  });

  document.querySelectorAll('.filter-slider').forEach(slider => {
    slider.addEventListener('input', (e) => {
      if (!editor.currentImage) {
        alert('Please upload an image first');
        return;
      }
      const filterName = e.target.dataset.filter;
      const value = parseInt(e.target.value);
      
      const valueDisplay = e.target.nextElementSibling;
      valueDisplay.textContent = filterName === 'blur' ? `${value}px` : `${value}%`;
      
      applyFilter(filterName, value);
    });
  });

  const checkbox = themeToggle.querySelector('input');

  const currentTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  checkbox.checked = currentTheme === 'light';

  checkbox.addEventListener('change', function() {
    const theme = this.checked ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  });
}

function initializeTheme() {
  const themeToggle = document.getElementById('themeToggle').querySelector('input');
  
  const savedTheme = localStorage.getItem('theme') || 'dark';
  
  document.documentElement.setAttribute('data-theme', savedTheme);
  themeToggle.checked = savedTheme === 'light'; 
  
  themeToggle.addEventListener('change', () => {
    const newTheme = themeToggle.checked ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });
}

function applyFilter(filterName, value) {
  if (!editor.currentImage) {
    alert('Please upload an image first');
    return;
  }

  switch (filterName) {
    case 'grayscale':
    case 'sepia':
    case 'invert':
      editor.applyFilter(filterName, value / 100);
      break;
    case 'blur':
      editor.applyFilter(filterName, value);
      break;
    case 'none':
      editor.applyFilter('none');
      break;
  }
}

function updateSliderValues() {
  const sliders = document.querySelectorAll('input[type="range"]');
  sliders.forEach(slider => {
    if (slider.classList.contains('filter-slider')) {
      const defaultValue = slider.id === 'blur' ? 0 : 100;
      slider.value = defaultValue;
      const valueDisplay = slider.nextElementSibling;
      if (valueDisplay) {
        valueDisplay.textContent = slider.id === 'blur' ? '0px' : '100%';
      }
    } else {
      slider.value = 0;
      const valueDisplay = slider.parentElement.querySelector('.slider-value');
      if (valueDisplay) {
        valueDisplay.textContent = '0';
      }
    }
  });
}

function updateFilterSelection(filterName) {
  document.querySelectorAll('.filter-option').forEach(option => {
    option.classList.toggle('active', option.dataset.filter === filterName);
  });
}