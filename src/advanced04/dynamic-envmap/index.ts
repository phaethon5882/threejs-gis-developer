import type { PerspectiveCamera, Scene, WebGLRenderer, WebGLRenderTargetOptions } from 'three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
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
    const { setupBackgroundWithHDRi, setupModels } = app;
    await setupBackgroundWithHDRi();
    setupModels();

    return app;
  };

  private readonly setupBackgroundWithHDRi = async (): Promise<void> => {
    const loader = new THREE.TextureLoader();
    const hdriTexture = await loader.loadAsync('/static/hdri/cannon.jpeg');
    const renderTarget = new THREE.WebGLCubeRenderTarget(hdriTexture.image.height);
    renderTarget.fromEquirectangularTexture(this.renderer, hdriTexture);
    this.scene.background = renderTarget.texture;
  };

  private readonly setupModels = () => {
    const renderTargetOptions: WebGLRenderTargetOptions = {
      format: THREE.RGBAFormat,
      generateMipmaps: true,
      minFilter: THREE.LinearMipMapLinearFilter,
    };

    const sphereRenderTarget = new THREE.WebGLCubeRenderTarget(256, renderTargetOptions);
    const sphereCamera = new THREE.CubeCamera(0.1, 1000, sphereRenderTarget);
    const sphereGeometry = new THREE.SphereGeometry(1.5);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      envMap: sphereRenderTarget.texture,
      reflectivity: 0.95,
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    const spherePivot = new THREE.Object3D();
    spherePivot.add(sphere).add(sphereCamera);
    spherePivot.position.set(1, 0, 1);
    this.scene.add(spherePivot);

    const cylinderRenderTarget = new THREE.WebGLCubeRenderTarget(256, renderTargetOptions);
    const cylinderCamera = new THREE.CubeCamera(0.1, 1000, cylinderRenderTarget);
    const cylinderGeometry = new THREE.CylinderGeometry(0.5, 1, 3, 32);
    const cylinderMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      envMap: cylinderRenderTarget.texture,
      reflectivity: 0.95,
    });
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    const cylinderPivot = new THREE.Object3D();
    cylinderPivot.add(cylinder).add(cylinderCamera);
    cylinderPivot.position.set(-1, 0, -1);
    this.scene.add(cylinderPivot);

    const torusRenderTarget = new THREE.WebGLCubeRenderTarget(256, renderTargetOptions);
    const torusCamera = new THREE.CubeCamera(0.1, 1000, torusRenderTarget);
    const torusGeometry = new THREE.TorusGeometry(4, 0.5, 24, 64);
    const torusMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      envMap: torusRenderTarget.texture,
      reflectivity: 0.95,
    });
    const torus = new THREE.Mesh(torusGeometry, torusMaterial);
    const torusPivot = new THREE.Object3D();
    torusPivot.add(torus).add(torusCamera);
    torus.name = 'torus';
    torus.rotation.x = Math.PI / 2;
    this.scene.add(torusPivot);

    const planeRenderTarget = new THREE.WebGLCubeRenderTarget(2048, renderTargetOptions);
    const planeCamera = new THREE.CubeCamera(0.1, 1000, planeRenderTarget);
    const planeGeometry = new THREE.PlaneGeometry(12, 12);
    const planeMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      envMap: planeRenderTarget.texture,
      reflectivity: 0.95,
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    const planePivot = new THREE.Object3D();
    planePivot.add(plane).add(planeCamera);
    planePivot.position.y = -4.8;
    plane.rotation.x = -Math.PI / 2;
    this.scene.add(planePivot);
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
      1000
    );
    camera.position.set(0, 4, 9);
    this.scene.add(camera);

    return camera;
  };

  private readonly setupLight = (): void => {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.25);
    directionalLight.position.set(-1, 2, 4);
    this.scene.add(directionalLight);
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
    this.updateEnvMap();
    requestAnimationFrame(this.render);
  };

  private readonly updateEnvMap = () => {
    this.scene.traverse((object) => {
      const [mesh, cubeCamera] = object.children;
      if (mesh instanceof THREE.Mesh && cubeCamera instanceof THREE.CubeCamera) {
        mesh.visible = false; // 자기자신을 껐다 키는 이유는 무한루프 빠지지 않게 하려고임
        cubeCamera.update(this.renderer, this.scene);
        mesh.visible = true;
      }
    });
  };

  private readonly update = (time: DOMHighResTimeStamp): void => {
    const seconds = time * 0.001;

    const torus = this.scene.getObjectByName('torus');
    if (torus) {
      torus.rotation.x = Math.sin(seconds);
    }
  };
}

window.onload = async () => {
  const container = document.getElementById('webgl-container') as HTMLDivElement;
  await App.init(container);
};
