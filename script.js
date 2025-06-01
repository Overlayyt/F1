// DOM Elements
const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('overlay');
const canvasCtx = canvasElement.getContext('2d');
const loadingIndicator = document.getElementById('loading-indicator');
const errorMessage = document.getElementById('error-message');
const helpModal = document.getElementById('help-modal');

// State variables
let currentMode = null;
let earringSrc = 'earrings/earring1.png';
let necklaceSrc = 'necklaces/necklace1.png';
let earringImg = null;
let necklaceImg = null;
let isProcessing = false;

// Smoothing variables
let leftEarPositions = [];
let rightEarPositions = [];
let chinPositions = [];

// Initialize application
async function initializeApp() {
  try {
    // Load images
    await initializeImages();
    
    // Initialize jewelry options
    insertJewelryOptions('earring', 'earring-options');
    insertJewelryOptions('necklace', 'necklace-options');
    
    // Initialize face mesh
    initializeFaceMesh();
    
    // Start camera
    const cameraStarted = await initializeCamera();
    
    if (cameraStarted) {
      // Hide loading indicator when everything is ready
      loadingIndicator.style.display = 'none';
    }
  } catch (error) {
    console.error('Initialization error:', error);
    loadingIndicator.style.display = 'none';
    showError('Failed to initialize application. Please refresh the page.');
  }
}

// Improved image loading with error handling
async function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.error(`Failed to load image: ${src}`);
      // Load a fallback image
      const fallback = new Image();
      fallback.src = 'fallback.png';
      resolve(fallback);
    };
  });
}

// Initialize images
async function initializeImages() {
  earringImg = await loadImage(earringSrc);
  necklaceImg = await loadImage(necklaceSrc);
}

// Change earring function
function changeEarring(filename) {
  earringSrc = `earrings/${filename}`;
  loadImage(earringSrc).then((img) => {
    if (img) earringImg = img;
  });
}

// Change necklace function
function changeNecklace(filename) {
  necklaceSrc = `necklaces/${filename}`;
  loadImage(necklaceSrc).then((img) => {
    if (img) necklaceImg = img;
  });
}

// Select mode function
function selectMode(mode) {
  currentMode = mode;

  // Hide all options groups
  document.querySelectorAll('.options-group').forEach(group => group.style.display = 'none');

  // Show the selected mode's options group
  document.getElementById(`${mode}-options`).style.display = 'flex';
}

// Insert jewelry options dynamically
function insertJewelryOptions(jewelryType, containerId) {
  const container = document.getElementById(containerId);

  // Clear existing options
  container.innerHTML = '';

  // Generate buttons for each jewelry item
  for (let i = 1; i <= 10; i++) {
    const filename = `${jewelryType}${i}.png`;
    const button = document.createElement('button');
    const img = document.createElement('img');
    img.src = `${jewelryType}s/${filename}`;
    img.alt = `${jewelryType.charAt(0).toUpperCase()}${jewelryType.slice(1)} ${i}`;
    img.style.width = '60px';
    img.style.height = '60px';
    img.style.borderRadius = '12px';
    img.style.transition = 'border 0.2s ease, transform 0.2s ease';

    button.appendChild(img);
    button.onclick = () => {
      if (jewelryType === 'earring') {
        changeEarring(filename);
      } else if (jewelryType === 'necklace') {
        changeNecklace(filename);
      }
    };

    container.appendChild(button);
  }
}

// Initialize face mesh
function initializeFaceMesh() {
  const faceMesh = new FaceMesh({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` 
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  faceMesh.onResults(handleFaceMeshResults);
  return faceMesh;
}

// Handle face mesh results
function handleFaceMeshResults(results) {
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  if (results.multiFaceLandmarks.length > 0) {
    const landmarks = results.multiFaceLandmarks[0];

    const left = {
      x: landmarks[132].x * canvasElement.width,
      y: landmarks[132].y * canvasElement.height - 20,
    };

    const right = {
      x: landmarks[361].x * canvasElement.width,
      y: landmarks[361].y * canvasElement.height - 20,
    };

    const chin = {
      x: landmarks[152].x * canvasElement.width,
      y: landmarks[152].y * canvasElement.height + 10,
    };

    // Add to smoothing buffers
    leftEarPositions.push(left);
    rightEarPositions.push(right);
    chinPositions.push(chin);
    
    // Keep buffer size manageable
    if (leftEarPositions.length > 5) leftEarPositions.shift();
    if (rightEarPositions.length > 5) rightEarPositions.shift();
    if (chinPositions.length > 5) chinPositions.shift();

    // Get smoothed positions
    const leftSmooth = smooth(leftEarPositions);
    const rightSmooth = smooth(rightEarPositions);
    const chinSmooth = smooth(chinPositions);

    // Draw jewelry based on current mode
    if (currentMode === 'earring' && earringImg) {
      if (leftSmooth) canvasCtx.drawImage(earringImg, leftSmooth.x - 60, leftSmooth.y, 100, 100);
      if (rightSmooth) canvasCtx.drawImage(earringImg, rightSmooth.x - 20, rightSmooth.y, 100, 100);
    }

    if (currentMode === 'necklace' && necklaceImg && chinSmooth) {
      canvasCtx.drawImage(necklaceImg, chinSmooth.x - 100, chinSmooth.y, 200, 100);
    }
  }
}

// Smoothing function
function smooth(positions) {
  if (positions.length === 0) return null;
  const sum = positions.reduce((acc, pos) => ({ x: acc.x + pos.x, y: acc.y + pos.y }), { x: 0, y: 0 });
  return { x: sum.x / positions.length, y: sum.y / positions.length };
}

// Debounced face mesh processing
function debouncedFaceMeshProcessing() {
  if (isProcessing) return;
  isProcessing = true;
  
  requestAnimationFrame(async () => {
    await faceMesh.send({ image: videoElement });
    isProcessing = false;
  });
}

// Initialize camera
async function initializeCamera() {
  try {
    const camera = new Camera(videoElement, {
      onFrame: debouncedFaceMeshProcessing,
      width: 1280,
      height: 720,
    });
    
    await camera.start();
    
    // Set canvas size after video loads metadata
    videoElement.addEventListener('loadedmetadata', () => {
      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;
    });
    
    return true;
  } catch (error) {
    console.error('Camera initialization failed:', error);
    showError('Could not access camera. Please check permissions and try again.');
    return false;
  }
}

// Take snapshot function
function takeSnapshot() {
  try {
    const snapshotCanvas = document.createElement('canvas');
    const ctx = snapshotCanvas.getContext('2d');

    snapshotCanvas.width = videoElement.videoWidth;
    snapshotCanvas.height = videoElement.videoHeight;

    // Draw video
    ctx.drawImage(videoElement, 0, 0, snapshotCanvas.width, snapshotCanvas.height);

    // Overlay earring if active
    if (currentMode === 'earring' && earringImg) {
      const leftSmooth = smooth(leftEarPositions);
      const rightSmooth = smooth(rightEarPositions);
      if (leftSmooth) ctx.drawImage(earringImg, leftSmooth.x - 60, leftSmooth.y, 100, 100);
      if (rightSmooth) ctx.drawImage(earringImg, rightSmooth.x - 20, rightSmooth.y, 100, 100);
    }

    // Overlay necklace if active
    if (currentMode === 'necklace' && necklaceImg) {
      const chinSmooth = smooth(chinPositions);
      if (chinSmooth) ctx.drawImage(necklaceImg, chinSmooth.x - 100, chinSmooth.y, 200, 100);
    }

    // Convert to image and trigger download
    const dataURL = snapshotCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `jewelry-tryon-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error taking snapshot:', error);
    showError('Failed to take snapshot. Please try again.');
  }
}

// Show error message
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  
  // Hide error after 5 seconds
  setTimeout(() => {
    errorMessage.style.display = 'none';
  }, 5000);
}

// Show help modal
function showHelp() {
  helpModal.style.display = 'block';
}

// Hide help modal
function hideHelp() {
  helpModal.style.display = 'none';
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);