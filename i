<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Overlay Jewels Try-On</title>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel&family=Poppins&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <!-- Loading Indicator -->
  <div id="loading-indicator" class="loading">
    Loading jewelry options...
  </div>

  <!-- Error Message Container -->
  <div id="error-message" class="error-message" style="display: none;"></div>

  <!-- Video and Canvas Elements -->
  <video id="webcam" autoplay muted playsinline></video>
  <canvas id="overlay"></canvas>

  <!-- Branding with Camera Icon -->
  <div id="branding">
    <img src="cameraicon.png" alt="Camera Icon" class="camera-icon" style="width: 52px; height: 52px;" />
    <span>Virtual Jewelry Try-On</span>
  </div>

  <!-- Mode Selection Buttons -->
  <div id="jewelry-mode">
    <button onclick="selectMode('earring')">Earring</button>
    <button onclick="selectMode('necklace')">Necklace</button>
  </div>

  <!-- Earring Options -->
  <div id="earring-options" class="options-group" style="display: none;">
    <!-- Dynamically populated -->
  </div>

  <!-- Necklace Options -->
  <div id="necklace-options" class="options-group" style="display: none;">
    <!-- Dynamically populated -->
  </div>

  <!-- Save Snapshot Button -->
  <button id="snapshot-btn" onclick="takeSnapshot()" style="background: none; border: none; padding: 0; cursor: pointer;">
    <img src="camera-icon.png" alt="Camera Icon" style="width: 32px; height: 32px;" />
  </button>

  <!-- Help Button -->
  <button id="help-btn" class="help-button" onclick="showHelp()">?</button>

  <!-- Help Modal -->
  <div id="help-modal" class="modal" style="display: none;">
    <div class="modal-content">
      <span class="close" onclick="hideHelp()">&times;</span>
      <h2>How to Use</h2>
      <ol>
        <li>Allow camera access when prompted</li>
        <li>Select Earring or Necklace mode</li>
        <li>Choose from the jewelry options at the bottom</li>
        <li>Click the camera icon to save your look</li>
      </ol>
    </div>
  </div>

  <!-- Scripts -->
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"></script>
  <script src="script.js"></script>
</body>
</html>