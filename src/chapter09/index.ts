/**
 * 그림자를 활성화 하기 위해서 3가지 설정이 필요함
 * 1. 렌더러: renderer.shadowMap.enabled = true;
 * 2. 광원: 그림자를 만드는 광원을 고르고 ( Directional, Point, SpotLight 만 가능 ) light.castShadow = true;
 * 3. 모델: object3D.receiveShadow, object3D.castShadow 를 true 로 해줘야함. 각각 그림자를 받을건지 그림자를 발생시킬건지를 나타탬
 */
import type { PerspectiveCamera, Scene, WebGLRenderer, Object3D } from 'three';
import {
  DirectionalLight,
  DirectionalLightHelper,
  PointLight,
  PointLightHelper,
  SpotLight,
  SpotLightHelper,
} from 'three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const SMALL_SPHERE_PIVOT = 'smallSpherePivot';

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
    this.renderer.shadowMap.enabled = true;
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
    // 보조광을 둬서 좀 더 밝게 만듦
    const auxLight = new THREE.DirectionalLight(0xffffff, 0.5);
    auxLight.position.set(0, 5, 0);
    auxLight.target.position.set(0, 0, 0);
    this.scene.add(auxLight.target);
    this.scene.add(auxLight);

    // 방향조명
    // const light = new THREE.DirectionalLight('#ffffff', 1);
    // light.target.position.set(0, 0, 0);
    // this.scene.add(light.target);
    // this.scene.add(light);
    // 방향조명의 카메라 절두체 크기 변경
    // 그림자 잘리는 거 방지하려고 광원의 절두체를 키운다. ( 광원의 절두체는 OrthographicCamera 를 씀 )
    // light.shadow.camera.top = light.shadow.camera.right = 6;
    // light.shadow.camera.bottom = light.shadow.camera.left = -6;
    // const helper = new THREE.DirectionalLightHelper(light);
    // this.scene.add(helper);

    // 점광원
    // const light = new THREE.PointLight(0xffffff, 0.7);
    // light.position.set(0, 5, 0);
    // this.scene.add(light);
    // const helper = new THREE.PointLightHelper(light);
    // this.scene.add(helper);

    // 집중조명
    const light = new THREE.SpotLight(0xffffff, 1);
    light.position.set(0, 5, 0);
    light.target.position.set(0, 0, 0);
    light.angle = THREE.MathUtils.degToRad(30); // fovy 값같은거라고 보면됨 클 수록 빛이 넓게 퍼짐
    light.penumbra = 0.2;
    this.scene.add(light.target);
    this.scene.add(light);

    // 광원의 그림자 투영 활성화
    light.castShadow = true;
    // 그림자 품질을 높이려면 쉐도우맵 해상도를 높이면 된다.
    light.shadow.mapSize.set(2048, 2048); // 기본값은 512x512
    // 그림자의 가장자리를 블러처리하는 용도: 기본값 1, 클수록 블러링된다.
    light.shadow.radius = 1;

    const helper = new THREE.SpotLightHelper(light);
    this.scene.add(helper);

    const lightCameraHelper = new THREE.CameraHelper(light.shadow.camera);
    this.scene.add(lightCameraHelper);

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
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 가운데 흰색 반구
    const bigSphereGeometry = new THREE.TorusKnotGeometry(1, 0.3, 128, 64, 2, 3); // 반구
    const bigSphereMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.2,
    });

    const bigSphere = new THREE.Mesh(bigSphereGeometry, bigSphereMaterial);
    bigSphere.position.y = 1.6;
    bigSphere.receiveShadow = true;
    bigSphere.castShadow = true;
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
      torus.receiveShadow = true;
      torus.castShadow = true;
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
    smallSpherePivot.name = SMALL_SPHERE_PIVOT; // 이름을 부여해두면 scene.getObjectByName() 으로 언제든지 조회가능
    smallSphere.position.set(3, 0.5, 0);
    smallSphere.receiveShadow = true;
    smallSphere.castShadow = true;
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
    const smallSpherePivot = this.scene.getObjectByName(SMALL_SPHERE_PIVOT);
    if (smallSpherePivot != null) {
      smallSpherePivot.rotation.y = THREE.MathUtils.degToRad(seconds * 50);

      const smallSphere = smallSpherePivot.children[0];
      if (this.light instanceof DirectionalLight) {
        smallSphere.getWorldPosition(this.light.target.position); // 작은 구의 월드좌표를 광원의 타겟으로 변경

        if (this.lightHelper instanceof DirectionalLightHelper) {
          this.lightHelper.update();
        }
      }
      if (this.light instanceof PointLight) {
        smallSphere.getWorldPosition(this.light.position);
        if (this.lightHelper instanceof PointLightHelper) {
          this.lightHelper.update();
        }
      }
      if (this.light instanceof SpotLight) {
        smallSphere.getWorldPosition(this.light.target.position);
        if (this.lightHelper instanceof SpotLightHelper) {
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
