import * as THREE from 'three';
import type { PerspectiveCamera, Scene, WebGLRenderer, Object3D } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { debounce } from 'lodash-es';

class App {
  private readonly container: HTMLDivElement;
  private readonly renderer: WebGLRenderer;
  private readonly scene: Scene;
  private readonly camera: PerspectiveCamera;
  private readonly controls: OrbitControls;

  private constructor(container: HTMLDivElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();

    this.camera = this.setupCamera();
    this.controls = this.setupControls();
    this.setupLight();

    window.onresize = debounce(this.resize, 200);
    this.resize();

    requestAnimationFrame(this.render);
  }

  public static init = async (container: HTMLDivElement): Promise<App> => {
    const app = new App(container);
    const { scene, camera, controls, loadGLTF, zoomFit } = app;

    const gltf = await loadGLTF();
    const object = gltf.scene;
    scene.add(object);
    zoomFit(object, camera, controls);

    return app;
  };

  private readonly loadGLTF = async (): Promise<GLTF> => {
    const gltfLoader = new GLTFLoader();
    const url = `/static/models/shiba/scene.gltf`;
    return await gltfLoader.loadAsync(url);
  };

  private readonly zoomFit = (object: Object3D, camera: PerspectiveCamera, controls: OrbitControls, offset = 1.25) => {
    // 모델의 경계박스
    const boundingBox = new THREE.Box3().setFromObject(object);
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());

    // 이상적인 카메라 위치 구하기
    const halfFov = THREE.MathUtils.degToRad(camera.fov * 0.5);
    const halfLength = size.length() / 2;
    const distance = (halfLength / Math.tan(halfFov)) * offset;
    const direction = new THREE.Vector3().subVectors(camera.position, center).normalize();
    const position = new THREE.Vector3().copy(direction).multiplyScalar(distance).add(center);
    camera.position.copy(position);

    // 카메라가 물체 중심을 바라보도록 하기
    camera.lookAt(center);
    controls.target = center;
  };

  private readonly setupControls = (): OrbitControls => {
    return new OrbitControls(this.camera, this.container);
  };

  private readonly setupCamera = (): PerspectiveCamera => {
    // prettier-ignore
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.z = 4;
    this.scene.add(camera);

    return camera;
  };

  private readonly setupLight = (): void => {
    const color = 0xffffff;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    this.camera.add(light);
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
    // this.box.rotation.x = time * 0.001;
    // this.box.rotation.y = time * 0.001;
  };
}

window.onload = async () => {
  const container = document.getElementById('webgl-container') as HTMLDivElement;
  await App.init(container);
};
