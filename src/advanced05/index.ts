import type { PerspectiveCamera, Scene, WebGLRenderer, PMREMGenerator } from 'three';
import { CubeCamera, Mesh } from 'three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TeapotGeometry } from 'three/examples/jsm/geometries/TeapotGeometry';
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
    const teapotRenderTarget = new THREE.WebGLCubeRenderTarget(128, {
      format: THREE.RGBAFormat,
      generateMipmaps: true,
      minFilter: THREE.LinearMipMapLinearFilter,
    });
    // @ts-expect-error
    teapotRenderTarget._pmremG = new THREE.PMREMGenerator(this.renderer);

    const teapotCamera = new THREE.CubeCamera(0.01, 10, teapotRenderTarget);
    const teapotGeometry = new TeapotGeometry(0.7, 24);
    const teapotMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.05,
      ior: 2.5, // 굴절률 1이 진공, 2.419가 다이아몬드, 1.4~1.7이 유리매질이라고 함
      // @ts-expect-error
      thickness: 0.2, // 유리의 두께
      transmission: 1, // 광학적 투명도
      side: THREE.DoubleSide,
      envMap: teapotRenderTarget.texture,
      envMapIntensity: 1,
    });
    const teapot = new THREE.Mesh(teapotGeometry, teapotMaterial);
    teapot.add(teapotCamera);
    teapot.name = 'teapot';
    this.scene.add(teapot);

    const cylinderGeometry = new THREE.CylinderGeometry(0.1, 0.2, 1.5, 32);
    const cylinderMaterial = new THREE.MeshNormalMaterial();
    const cylinderPivot = new THREE.Object3D();
    cylinderPivot.name = 'cylinderPivot';
    for (let degree = 0; degree <= 360; degree += 30) {
      const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
      const radian = THREE.MathUtils.degToRad(degree);
      cylinder.position.set(2 * Math.sin(radian), 0, 2 * Math.cos(radian));
      cylinderPivot.add(cylinder);
    }
    this.scene.add(cylinderPivot);
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
    camera.position.set(0, 4, 5);
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

    const teapot = this.scene.getObjectByName('teapot');
    const cylinderPivot = this.scene.getObjectByName('cylinderPivot');
    if (cylinderPivot) {
      cylinderPivot.rotation.y = Math.sin(seconds * 0.5);
    }
    if (teapot instanceof Mesh) {
      const teapotCamera = teapot.children[0];
      if (teapotCamera instanceof CubeCamera) {
        teapotCamera.update(this.renderer, this.scene);
        teapot.visible = false;
        // @ts-expect-error
        const pmremGenerator = teapotCamera.renderTarget._pmremG as PMREMGenerator;
        const renderTarget = pmremGenerator.fromCubemap(teapotCamera.renderTarget.texture);
        teapot.material.envMap = renderTarget.texture;
        teapot.material.needsUpdate = true;
        teapot.visible = true;
      }
    }
  };
}

window.onload = async () => {
  const container = document.getElementById('webgl-container') as HTMLDivElement;
  await App.init(container);
};
