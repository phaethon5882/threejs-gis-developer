import type { PerspectiveCamera, Scene, WebGLRenderer, Material } from 'three';
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
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = this.setupCamera();
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
    camera.position.set(-2, 0, 10);

    return camera;
  };

  private readonly setupLight = (): void => {
    const color = 0xffffff;
    const intensity = 1.8;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(4, 4, 4);
    this.scene.add(light);
  };

  private readonly setupModels = (): void => {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('/static/images/uv_grid_opengl.jpg', (texture) => {
      texture.repeat.x = 1;
      texture.repeat.y = 1;

      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;

      texture.offset.x = 0;
      texture.offset.y = 0;

      texture.rotation = THREE.MathUtils.degToRad(45);
      texture.center.x = 0.5;
      texture.center.y = 0.5;

      /**
       * mipMap 은 메모리를 많이 잡아먹으니까 필요할때만 쓰자. 앵간하면 기본 필터 써도 이상없다함
       * MIP 은 라틴어인 multum in parvo(적은 공간에 더 많이)를 줄여쓴것이다.
       */
      // texture.magFilter = THREE.LinearFilter; // 여기서 NearestFilter 쓰면 가까이 있는거 4개 써서 엄청 깨짐
      // texture.minFilter = THREE.NearestMipmapLinearFilter;
    });
    const material = new THREE.MeshStandardMaterial({
      map: texture,
    });

    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const box = new THREE.Mesh(boxGeometry, material);
    box.position.set(-1, 0, 0);
    this.scene.add(box);

    const sphereGeometry = new THREE.SphereGeometry(0.7, 32, 32);
    const sphere = new THREE.Mesh(sphereGeometry, material);
    sphere.position.set(1, 0, 0);
    this.scene.add(sphere);
  };

  private readonly getPhysicalMaterial = (): Material => {
    return new THREE.MeshPhysicalMaterial({
      color: 0xff0000,
      emissive: 0x000000,
      // 금속성이 없는데
      roughness: 1,
      metalness: 0,
      // clearcoat 로 코팅을 하면, 삐까뻔적해진다.
      clearcoat: 0.4,
      clearcoatRoughness: 0,
      wireframe: false,
      flatShading: false,
    });
  };

  private readonly getStandardMaterial = (): Material => {
    return new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0x000000,
      roughness: 0.25,
      metalness: 0.1,
      wireframe: false,
      flatShading: false,
    });
  };

  private readonly getPhongMaterial = (): Material => {
    return new THREE.MeshPhongMaterial({
      color: 0xff0000,
      emissive: 0x000000,
      specular: 0xffff00,
      shininess: 5,
      flatShading: false,
      wireframe: false,
    });
  };

  private readonly getLambertMaterial = (): Material => {
    return new THREE.MeshLambertMaterial({
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,

      color: 0xd25383,
      emissive: 0x555500,
      wireframe: false,
    });
  };

  private readonly getBasicMaterial = (): Material => {
    // MeshBasicMaterial 은 광원의 영향을 받지 않는다.
    return new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.5,
      /**
       * 깊이를 저장하는 z-buffer 설정
       * z-buffer 는 0~1 사이의 값을 갖고
       * 값이 클수록 카메라로부터 멀리있음을 나타낸다.
       * 이를 시각화하면 가까울 수록 어둡고 멀수록 밝게 보인다.
       * 멀리있는 물체가 가까이 있는 물체에 가려졌을 때 렌더링 되지 않는걸 막으려고 만들어졌다.
       */
      depthTest: true,
      depthWrite: true,
      // 앞부분만 렌더, BackSide, DoubleSide 도 있지만 이 재질에선 광원효과 안 받아서 차이를 느끼기 힘듦
      side: THREE.FrontSide,

      color: 0xffffff,
      wireframe: false,
    });
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
