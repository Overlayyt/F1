const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('overlay');
const canvasCtx = canvasElement.getContext('2d');

let currentMode = null; // Start with no mode selected
let earringSrc = 'earrings/earring1.png';
let necklaceSrc = 'necklaces/necklace1.png';

let earringImg = null;
let necklaceImg = null;

// Load image dynamically
function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null); // Fallback if image fails to load
  });
}

// Initialize images
async function initializeImages() {
  earringImg = await loadImage(earringSrc);
  necklaceImg = await loadImage(necklaceSrc);
}
initializeImages();

// Function to change earring
function changeEarring(filename) {
  earringSrc = `earrings/${filename}`;
  loadImage(earringSrc).then((img) => {
    if (img) earringImg = img;
  });
}

// Function to change necklace
function changeNecklace(filename) {
  necklaceSrc = `necklaces/${filename}`;
  loadImage(necklaceSrc).then((img) => {
    if (img) necklaceImg = img;
  });
}

// Function to select mode
function selectMode(mode) {
  currentMode = mode;

  // Hide all options groups
  document.querySelectorAll('.options-group').forEach(group => group.style.display = 'none');

  // Show the selected mode's options group
  document.getElementById(`${mode}-options`).style.display = 'flex';
}

// Function to dynamically insert jewelry options
function insertJewelryOptions(jewelryType, containerId) {
  const container = document.getElementById(containerId);

  // Clear existing options
  container.innerHTML = '';

  // Generate buttons for each jewelry item
  for (let i = 1; i <= 12; i++) {
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

// Initialize jewelry options
document.addEventListener('DOMContentLoaded', () => {
  insertJewelryOptions('earring', 'earring-options');
  insertJewelryOptions('necklace', 'necklace-options');
});

// Initialize face mesh
const faceMesh = new FaceMesh({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` 
});

faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

// Smoothing logic
let leftEarPositions = [];
let rightEarPositions = [];
let chinPositions = [];

function smooth(positions) {
  if (positions.length === 0) return null;
  const sum = positions.reduce((acc, pos) => ({ x: acc.x + pos.x, y: acc.y + pos.y }), { x: 0, y: 0 });
  return { x: sum.x / positions.length, y: sum.y / positions.length };
}

faceMesh.onResults((results) => {
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

    leftEarPositions.push(left);
    rightEarPositions.push(right);
    chinPositions.push(chin);
    if (leftEarPositions.length > 5) leftEarPositions.shift();
    if (rightEarPositions.length > 5) rightEarPositions.shift();
    if (chinPositions.length > 5) chinPositions.shift();

    const leftSmooth = smooth(leftEarPositions);
    const rightSmooth = smooth(rightEarPositions);
    const chinSmooth = smooth(chinPositions);

    if (currentMode === 'earring' && earringImg) {
      if (leftSmooth) canvasCtx.drawImage(earringImg, leftSmooth.x - 60, leftSmooth.y, 100, 100);
      if (rightSmooth) canvasCtx.drawImage(earringImg, rightSmooth.x - 20, rightSmooth.y, 100, 100);
    }

    if (currentMode === 'necklace' && necklaceImg && chinSmooth) {
      canvasCtx.drawImage(necklaceImg, chinSmooth.x - 100, chinSmooth.y, 200, 100);
    }
  }
});

// Start camera
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await faceMesh.send({ image: videoElement });
  },
  width: 1280,
  height: 720,
});
camera.start();

// Set canvas size after video loads metadata
videoElement.addEventListener('loadedmetadata', () => {
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;
});

// Take Snapshot Function
function takeSnapshot() {
  const snapshotCanvas = document.createElement('canvas');
  const ctx = snapshotCanvas.getContext('2d');

  snapshotCanvas.width = videoElement.videoWidth;
  snapshotCanvas.height = videoElement.videoHeight;

  // Draw video
  ctx.drawImage(videoElement, 0, 0, snapshotCanvas.width, snapshotCanvas.height);

  // Overlay earring if active and available
  if (currentMode === 'earring' && earringImg) {
    const leftSmooth = smooth(leftEarPositions);
    const rightSmooth = smooth(rightEarPositions);
    if (leftSmooth) ctx.drawImage(earringImg, leftSmooth.x - 60, leftSmooth.y, 100, 100);
    if (rightSmooth) ctx.drawImage(earringImg, rightSmooth.x - 20, rightSmooth.y, 100, 100);
  }

  // Overlay necklace if active and available
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
}