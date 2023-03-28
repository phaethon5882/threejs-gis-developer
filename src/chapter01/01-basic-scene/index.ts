import * as THREE from 'three';

// Scene
const scene = new THREE.Scene();

// Red Cube
const redCube = createRedCube(scene);

// Camera
const camera = initializeCamera(scene);

// Renderer
const renderer = initializeRenderer(scene, camera);

function createRedCube(scene: THREE.Scene) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: '#ff0000' });
  const mesh = new THREE.Mesh(geometry, material);

  scene.add(mesh);

  return mesh;
}

function initializeCamera(scene: THREE.Scene) {
  const fov = 75;
  const aspectRatio = window.innerWidth / window.innerHeight;
  const near = 0.1;
  const far = 100;
  const camera = new THREE.PerspectiveCamera(fov, aspectRatio, near, far);

  camera.position.z = 3;

  scene.add(camera);

  return camera;
}

function initializeRenderer(scene: THREE.Scene, camera: THREE.Camera) {
  const canvas = document.querySelector('.webgl');

  if (!canvas) {
    throw new Error('canvas.webgl does not exist.');
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.render(scene, camera);

  return renderer;
}
