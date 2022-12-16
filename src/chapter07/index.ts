import type { PerspectiveCamera, Scene, WebGLRenderer, Object3D } from 'three';
import { DirectionalLight, DirectionalLightHelper } from 'three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib';

const SMALL_SPHERE_PIVOT_NAME = 'smallSpherePivot';

class App {
  private readonly container: HTMLDivElement;
  private readonly renderer: WebGLRenderer;
  private readonly scene: Scene;
  private readonly camera: PerspectiveCamera;
  private readonly light: Object3D;
  private readonly lightHelper: Object3D;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.scene = new THREE.Scene();
    this.camera = this.setupCamera();

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    const { light, helper } = this.setupLightAndHelper();
    this.light = light;
    this.lightHelper = helper;
    this.setupModel();
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
    // camera.position.z = 2;
    camera.position.set(7, 7, 0);
    camera.lookAt(0, 0, 0);

    return camera;
  };

  private readonly setupLightAndHelper = () => {
    /**
     * AmbientLight: 는 환경광 또는 주변광으로 불리는데. 모든 면을 고르게 비추는 광원이다. 음영이 생기지 않는다.
     * 주로 빛이 닿지 않는 물체도 보이게 하고 싶을 때 쓰고 아주 약하게 준다.
     */
    // const light = new THREE.AmbientLight(0xff0000, 0.2);
    /**
     * HemisphereLight: 마찬가지로 주변광이어서 음영이 안 생기는데. 하늘에서 내리 쬐는 색과 바닥의 반사광을 나타내준다.
     */
    // const light = new THREE.HemisphereLight('#b0d8f5', '#bb7a1c', 1);
    /**
     * DirectionalLight: 빛의 물체간의 거리에 상관없이 동일한 태양광같은 빛을 비춘다.
     */
    // const light = new THREE.DirectionalLight('#ffffff', 1);
    // light.position.set(0, 5, 0);
    // light.target.position.set(0, 0, 0);
    // this.scene.add(light.target);
    // this.scene.add(light);
    //
    // const helper = new THREE.DirectionalLightHelper(light);
    // this.scene.add(helper);
    /**
     * RectAreaLight: 형광등이나 창문으로 세어나오는 빛을 표현하기 위해 쓰인다.
     * 쓰기 위해선 RectAreaLightUniformsLib.init() 호출 필수
     */
    RectAreaLightUniformsLib.init();

    const light = new THREE.RectAreaLight('#ffffff', 10, 6, 1);
    light.position.set(0, 5, 0);
    light.rotation.x = THREE.MathUtils.degToRad(-90);

    const helper = new RectAreaLightHelper(light);
    light.add(helper);
    this.scene.add(light);

    return {
      light,
      helper,
    };
  };

  private readonly setupModel = (): void => {
    // 땅
    const groundGeometry = new THREE.PlaneGeometry(10, 10);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c3e50,
      roughness: 0.5,
      metalness: 0.5,
      side: THREE.DoubleSide,
    });

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = THREE.MathUtils.degToRad(-90); // 평면을 바닥으로 눞히겠다
    this.scene.add(ground);

    // 가운데 흰색 반구
    const bigSphereGeometry = new THREE.SphereGeometry(1.5, 64, 64, 0, Math.PI); // 반구
    const bigSphereMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.2,
    });

    const bigSphere = new THREE.Mesh(bigSphereGeometry, bigSphereMaterial);
    bigSphere.rotation.x = THREE.MathUtils.degToRad(-90);
    this.scene.add(bigSphere);

    // 원 둘레에 있는 8개의 토러스들
    const torusGeometry = new THREE.TorusGeometry(0.4, 0.1, 32, 32);
    const torusMaterial = new THREE.MeshStandardMaterial({
      color: 0x9b59b6,
      roughness: 0.5,
      metalness: 0.9,
    });

    for (let i = 0; i < 8; i++) {
      const torusPivot = new THREE.Object3D();
      const torus = new THREE.Mesh(torusGeometry, torusMaterial);
      torusPivot.rotation.y = THREE.MathUtils.degToRad(45 * i);
      torus.position.set(3, 0.5, 0);
      torusPivot.add(torus);
      this.scene.add(torusPivot);
    }

    // 토러스 사이를 지나가는 작은 구
    const smallSphereGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const smallSphereMaterial = new THREE.MeshStandardMaterial({
      color: 0xe74c3c,
      roughness: 0.2,
      metalness: 0.5,
    });
    const smallSpherePivot = new THREE.Object3D();
    const smallSphere = new THREE.Mesh(smallSphereGeometry, smallSphereMaterial);
    smallSpherePivot.add(smallSphere);
    smallSpherePivot.name = SMALL_SPHERE_PIVOT_NAME; // 이름을 부여해두면 scene.getObjectByName() 으로 언제든지 조회가능
    smallSphere.position.set(3, 0.5, 0);
    this.scene.add(smallSpherePivot);
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
    const smallSpherePivot = this.scene.getObjectByName(SMALL_SPHERE_PIVOT_NAME);
    if (smallSpherePivot != null) {
      smallSpherePivot.rotation.y = THREE.MathUtils.degToRad(seconds * 50);

      if (this.light instanceof DirectionalLight) {
        const smallSphere = smallSpherePivot.children[0];
        smallSphere.getWorldPosition(this.light.target.position); // 작은 구의 월드좌표를 광원의 타겟으로 변경

        if (this.lightHelper instanceof DirectionalLightHelper) {
          this.lightHelper.update();
        }
      }
    }
  };
}

window.onload = () => {
  const container = document.getElementById('webgl-container') as HTMLDivElement;
  new App(container);
};
