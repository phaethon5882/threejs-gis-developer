import type { AnimationMixer, Clock, PerspectiveCamera, Scene, Texture, WebGLRenderer } from 'three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { debounce } from 'lodash-es';

class App {
  private readonly container: HTMLDivElement;
  private readonly renderer: WebGLRenderer;
  private readonly scene: Scene;
  private readonly camera: PerspectiveCamera;
  private readonly animeMixer?: AnimationMixer;
  private readonly clock?: Clock;
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
    const { setupBackground, setupEquirectangularMap, setupModels } = app;
    await setupBackground();
    const equirectangularMap = setupEquirectangularMap();
    setupModels(equirectangularMap);

    return app;
  };

  private readonly setupModels = (equirectangularMap: Texture) => {
    const geometry = new THREE.SphereGeometry();
    const material01 = new THREE.MeshStandardMaterial({
      color: '#2ecc71',
      roughness: 0,
      metalness: 1,
      envMap: equirectangularMap,
    });
    const material02 = new THREE.MeshStandardMaterial({
      color: '#e74c3c',
      roughness: 0,
      metalness: 1,
      envMap: equirectangularMap,
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

  private readonly setupBackground = async () => {
    /**
    // 배경과 동일한 안개색을 줘야 자연스럽게 표현가능
    this.scene.background = new THREE.Color('#9b59b6');
    this.scene.fog = new THREE.FogExp2(this.scene.background.getHex(), 0.02);
     */
    const textureLoader = new THREE.TextureLoader();
    this.scene.background = await textureLoader.loadAsync('/static/images/space.jpg');
  };

  /**
   * PMREM = Prefiltered, Mipmapped Radiance Environment Map
   * Equirectangular = 등장방형도법
   */
  private readonly setupEquirectangularMap = () => {
    const backgroundTexture = this.scene.background as Texture;
    const pmremGen = new THREE.PMREMGenerator(this.renderer);
    return pmremGen.fromEquirectangular(backgroundTexture).texture;
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
