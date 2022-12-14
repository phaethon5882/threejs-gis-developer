import * as THREE from 'three';
import { Object3D, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

type ModelName = 'solarSystem' | 'earthOrbit' | 'moonOrbit';
type ModelMap = Record<ModelName, Object3D>;

class App {
  private readonly container: HTMLDivElement;
  private readonly renderer: WebGLRenderer;
  private readonly scene: Scene;
  private readonly camera: PerspectiveCamera;
  private readonly models: ModelMap;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.scene = new THREE.Scene();
    this.camera = this.setupCamera();

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    this.setupLight();
    this.models = this.setupModels();

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

  private readonly setupModels = (): ModelMap => {
    const solarSystem = new THREE.Object3D();
    this.scene.add(solarSystem);

    // 공용 구 geometry
    const sphereGeometry = new THREE.SphereGeometry(1, 12, 12);

    // 태양 추가
    const sunMaterial = new THREE.MeshPhongMaterial({
      emissive: 0xffff00,
      flatShading: true,
    });
    const sunMesh = new THREE.Mesh(sphereGeometry, sunMaterial);
    sunMesh.scale.set(3, 3, 3);
    solarSystem.add(sunMesh);

    // 지구 추가
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x2233ff,
      emissive: 0x112244,
      flatShading: true,
    });
    const earthMesh = new THREE.Mesh(sphereGeometry, earthMaterial);
    const earthOrbit = new THREE.Object3D();
    earthOrbit.position.set(10, 0, 0);
    earthOrbit.add(earthMesh);
    solarSystem.add(earthOrbit);

    // 달 추가
    const moonMaterial = new THREE.MeshPhongMaterial({
      color: 0x888888,
      emissive: 0x222222,
      flatShading: true,
    });
    const moonMesh = new THREE.Mesh(sphereGeometry, moonMaterial);
    moonMesh.scale.set(0.5, 0.5, 0.5);

    // 지구 관점에서 x 축으로 2만큼 떨어지게 배치
    const moonOrbit = new THREE.Object3D();
    moonOrbit.add(moonMesh);
    moonOrbit.position.set(2, 0, 0);
    earthOrbit.add(moonOrbit);

    return {
      solarSystem,
      earthOrbit,
      moonOrbit,
    };
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
    const { solarSystem, earthOrbit, moonOrbit } = this.models;
    solarSystem.rotation.set(0, seconds * 0.5, 0);
    earthOrbit.rotation.set(0, seconds * 2, 0);
    moonOrbit.rotation.set(0, seconds * 0.005, 0);
  };
}

window.onload = () => {
  const container = document.getElementById('webgl-container') as HTMLDivElement;
  new App(container);
};
