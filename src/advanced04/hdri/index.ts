import type { CubeTexture, PerspectiveCamera, Scene, Texture, WebGLRenderer } from 'three';
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
    const pmremG = new THREE.PMREMGenerator(this.renderer);
    const renderTarget = pmremG.fromEquirectangular(this.scene.background as Texture);
    const hdriMap = renderTarget.texture;

    const geometry = new THREE.SphereGeometry();
    const material01 = new THREE.MeshStandardMaterial({
      color: '#2ecc71',
      roughness: 0,
      metalness: 1,
      envMap: hdriMap,
    });
    const material02 = new THREE.MeshStandardMaterial({
      color: '#e74c3c',
      roughness: 0,
      metalness: 1,
      envMap: hdriMap,
    });

    const gap = 10.0;
    const rangeMin = -20.0;
    const rangeMax = 20.0;
    let flag = true;

    for (let x = rangeMin; x <= rangeMax; x += gap) {
      for (let y = rangeMin; y <= rangeMax; y += gap) {
        for (let z = rangeMin * 10; z <= rangeMax; z += gap) {
          flag = !flag;
          const mesh = new THREE.Mesh(geometry, flag ? material01 : material02);
          mesh.position.set(x, y, z);
          this.scene.add(mesh);
        }
      }
    }
  };

  /**
   * cubeMap: 정육면체에 텍스처를 맵핑해서 다이나믹한 반사를 표현할 수 있음
   */
  private readonly setupCubeMap = async (): Promise<CubeTexture> => {
    const loader = new THREE.CubeTextureLoader();
    const cubeTexture = await new Promise<CubeTexture>((resolve) => {
      loader.load(
        [
          '/static/cubemaps/Citadella2/posx.jpg',
          '/static/cubemaps/Citadella2/negx.jpg',
          '/static/cubemaps/Citadella2/posy.jpg',
          '/static/cubemaps/Citadella2/negy.jpg',
          '/static/cubemaps/Citadella2/posz.jpg',
          '/static/cubemaps/Citadella2/negz.jpg',
        ],
        resolve,
      );
    });
    this.scene.background = cubeTexture;
    return cubeTexture;
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
    camera.position.z = 80;
    this.scene.add(camera);

    return camera;
  };

  private readonly setupLight = (): void => {
    const color = 0xffffff;
    const intensity = 1.5;
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
  };
}

window.onload = async () => {
  const container = document.getElementById('webgl-container') as HTMLDivElement;
  await App.init(container);
};
