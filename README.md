# AI Photo Editor 🎨

A powerful, modern, and user-friendly photo editing web application built with JavaScript. This project provides a comprehensive set of tools for image manipulation, including AI-enhanced features, filters, and adjustments.

## ✨ Features

### Basic Editing Tools
- 📸 Image upload and download functionality
- ✂️ Crop and resize capabilities
- 🔄 Rotate and flip transformations
- ↩️ Undo/Redo support

### Image Adjustments
- 🌟 Brightness
- 🎯 Contrast
- 🎨 Saturation
- ☀️ Exposure
- 🔪 Sharpness
- 🌡️ Temperature
- 🎭 Tint
- 🌌 Vignette

### Additional Features
- 🌓 Dark/Light theme toggle
- 🖼️ Real-time preview
- ⌨️ Keyboard shortcuts
- 📱 Responsive design

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local development server (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/AI-Photo-Editor.git
```

2. Navigate to the project directory:
```bash
cd AI-Photo-Editor
```

3. Open `index.html` in your web browser or serve through a local development server.

## 🛠️ Usage

1. **Upload an Image**
   - Click the "Upload" button or drag and drop an image
   - Supported formats: JPG, PNG, WebP

2. **Apply Adjustments**
   - Use the left panel sliders to adjust image properties
   - All changes are applied in real-time

3. **Apply Filters**
   - Choose from various preset filters
   - Adjust filter intensity using the slider

4. **Transform Image**
   - Use rotation buttons to rotate 90° clockwise or counterclockwise
   - Use flip buttons for horizontal or vertical flipping
   - Use the crop tool for precise cropping

5. **Save Your Work**
   - Click the "Download" button to save your edited image

## ⌨️ Keyboard Shortcuts

- `Ctrl + Z`: Undo
- `Ctrl + Y`: Redo
- `Ctrl + S`: Save/Download
- `R`: Reset adjustments
- `C`: Activate crop tool

## 🏗️ Project Structure

```
AI-Photo-Editor/
├── index.html          # Main HTML file
├── imageEditor.js      # Core editor functionality
├── main.js            # Main application logic
├── style.css          # Styling
└── src/
    └── utils/
        ├── imageProcessor.js    # Image processing utilities
        └── imageAdjustments.js  # Image adjustment functions
```

## 🔧 Technical Implementation

- Built with vanilla JavaScript for optimal performance
- Uses HTML5 Canvas for image manipulation
- Modular architecture for maintainability
- Real-time image processing
- Event-driven user interactions

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Parth Sankhla**

## 🙏 Acknowledgments

- [CropperJS](https://fengyuanchen.github.io/cropperjs/) for image cropping functionality
- [Font Awesome](https://fontawesome.com/) for icons
- [Fontshare](https://www.fontshare.com/) for typography
