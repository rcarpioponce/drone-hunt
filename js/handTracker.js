// ─── HAND TRACKER (MediaPipe HandLandmarker) ────────────────────────────────
// Exposes: init(videoEl), getHand() -> {landmarks} | null

import { FilesetResolver, HandLandmarker }
  from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs';

let handLandmarker = null;
let lastResult     = null;
let videoEl        = null;

export async function init(video) {
  videoEl = video;

  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
  );

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: 1,
  });
}

// Call once per frame, passing performance.now() as timestamp
export function detect(timestamp) {
  if (!handLandmarker || !videoEl || videoEl.readyState < 2) return;
  lastResult = handLandmarker.detectForVideo(videoEl, timestamp);
}

// Returns { landmarks: [{x,y,z}, ...21 items] } or null
export function getHand() {
  if (!lastResult || !lastResult.landmarks || lastResult.landmarks.length === 0) {
    return null;
  }
  return { landmarks: lastResult.landmarks[0] };
}
