import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

let modelsLoaded = false;

export const loadModels = async () => {
  if (modelsLoaded) return;
  
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  
  modelsLoaded = true;
};

export const getFaceDescriptor = async (video: HTMLVideoElement) => {
  const detection = await faceapi
    .detectSingleFace(video)
    .withFaceLandmarks()
    .withFaceDescriptor();
    
  return detection?.descriptor;
};

export const enrollFace = (descriptor: Float32Array) => {
  const descriptorArray = Array.from(descriptor);
  localStorage.setItem('enrolled_face_descriptor', JSON.stringify(descriptorArray));
};

export const getEnrolledFace = (): Float32Array | null => {
  const stored = localStorage.getItem('enrolled_face_descriptor');
  if (!stored) return null;
  return new Float32Array(JSON.parse(stored));
};

export const verifyFace = (currentDescriptor: Float32Array, enrolledDescriptor: Float32Array) => {
  const distance = faceapi.euclideanDistance(currentDescriptor, enrolledDescriptor);
  // Threshold for recognition (lower is stricter)
  // 0.6 is common for face-api.js
  return distance < 0.5;
};
