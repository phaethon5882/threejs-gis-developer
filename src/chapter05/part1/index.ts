import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class App {
  private readonly container: HTMLDivElement;
  private readonly renderer: WebGLRenderer;
  private readonly scene: Scene;
  private readonly camera: PerspectiveCamera;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.scene = new THREE.Scene();
    this.camera = this.setupCamera();

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    this.setupLight();
    this.setupModels();

    this.setupControls();

    window.onresize = this.resize;
    this.resize();

    requestAnimationFrame(this.render);
  }

  private readonly setupCamera = (): PerspectiveCamera => {
    const { clientWidth, clientHeight } = this.container;
    const fov = 75;
    const aspect = clientWidth / clientHeight;
    const near = 0.1;
    const far = 100;

    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 0, 25);

    return camera;
  };

  private readonly setupLight = (): void => {
    const color = 0xffffff;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    this.scene.add(light);
  };

  private readonly setupModels = (): void => {
    const vertices = [];
    for (let i = 0; i < 10_000; i++) {
      const x = THREE.MathUtils.randFloatSpread(5); // -2.5 ~ 2.5;
      const y = THREE.MathUtils.randFloatSpread(5);
      const z = THREE.MathUtils.randFloatSpread(5);
      vertices.push(x, y, z);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const textureLoader = new THREE.TextureLoader();
    const material = new THREE.PointsMaterial({
      map: textureLoader.load('/static/images/disc.png'),
      alphaTest: 0.5, // 픽셀의 alpha 값이 0.5보다 크면 렌더링
      color: 0x00ffff,
      size: 0.1,
      sizeAttenuation: true, // 카메라에서 멀어질 수록 사이즈를 작게 랜더링
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);
  };

  private readonly setupControls = (): void => {
    new OrbitControls(this.camera, this.container);
  };

  private readonly resize = (): void => {
    const { clientWidth, clientHeight } = this.container;
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(clientWidth, clientHeight);
  };

  private readonly render = (time: DOMHighResTimeStamp): void => {
    this.renderer.render(this.scene, this.camera);
    this.update(time);
    requestAnimationFrame(this.render);
  };

  private readonly update = (time: DOMHighResTimeStamp): void => {
    const seconds = time * 0.001;
    // const { solarSystem, earthOrbit, moonOrbit } = this.models;
    // solarSystem.rotation.set(0, seconds * 0.5, 0);
    // earthOrbit.rotation.set(0, seconds * 2, 0);
    // moonOrbit.rotation.set(0, seconds * 0.005, 0);
  };
}

window.onload = () => {
  const container = document.getElementById('webgl-container') as HTMLDivElement;
  new App(container);
};
