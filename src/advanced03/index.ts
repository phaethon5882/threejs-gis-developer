import type { AnimationMixer, Group, Object3D, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import * as THREE from 'three';
import { Clock } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { debounce } from 'lodash-es';

class App {
  private readonly container: HTMLDivElement;
  private readonly renderer: WebGLRenderer;
  private readonly scene: Scene;
  private readonly camera: PerspectiveCamera;
  private animeMixer?: AnimationMixer;
  private clock?: Clock;
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
    const { camera, controls, loadFBX, setupAnimationMixer, zoomFit } = app;

    const object = await loadFBX('/static/models/arrebola/Standing W_Briefcase Idle.fbx');
    zoomFit(object, camera, controls, 'z');
    setupAnimationMixer(object);

    return app;
  };

  private readonly loadFBX = async (url: string): Promise<Group> => {
    const fbxLoader = new FBXLoader();
    const object = await fbxLoader.loadAsync(url);
    this.scene.add(object);

    return object;
  };

  private readonly setupAnimationMixer = (object: Object3D): void => {
    this.animeMixer = new THREE.AnimationMixer(object);
    const clip = this.animeMixer.clipAction(object.animations[0]);
    clip.play();
    this.clock = new Clock();
  };

  private readonly zoomFit = (
    object: Object3D,
    camera: PerspectiveCamera,
    controls: OrbitControls,
    viewMode: 'x' | 'y' | 'z',
    bFront = true, // viewMode 축의 앞면을 보여줄지 뒷몇을 보여줄지
  ) => {
    const boundingBox = new THREE.Box3().setFromObject(object);
    const boxCenter = boundingBox.getCenter(new THREE.Vector3());
    const boxSize = boundingBox.getSize(new THREE.Vector3());

    const direction = new THREE.Vector3(viewMode === 'x' ? 1 : 0, viewMode === 'y' ? 1 : 0, viewMode === 'z' ? 1 : 0);
    if (!bFront) {
      direction[viewMode] *= -1;
    }
    // 카메라를 물체 중심에서 우리가 정한 방향벡터쪽으로 1만큼 이동
    camera.position.set(boxCenter.x + direction.x, boxCenter.y + direction.y, boxCenter.z + direction.z);

    // 이상적인 카메라 위치 구하기
    const halfFov = THREE.MathUtils.degToRad(camera.fov * 0.5);
    const distance = (boxSize.length() * 0.5) / Math.tan(halfFov);
    const position = new THREE.Vector3().copy(direction).multiplyScalar(distance).add(boxCenter);
    camera.position.copy(position);
    camera.updateProjectionMatrix();
    camera.lookAt(boxCenter);
    controls.target = boxCenter;
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
    // const seconds = time * 0.001;
    if (this.animeMixer && this.clock) {
      const delta = this.clock.getDelta(); // 다음 getDelta() 를 호출할 때까지 몇초가 걸렸는지 알려줌 (0.01~~)
      this.animeMixer.update(delta); // delta 값을 넘겨주면 그 만큼 키프레임을 이동시키는 것 같음
    }
  };
}

window.onload = async () => {
  const container = document.getElementById('webgl-container') as HTMLDivElement;
  await App.init(container);
};
