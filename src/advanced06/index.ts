import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { debounce } from 'lodash-es';
import { Particle, ParticleMesh } from './particle';
import Picker from './picker';

class App {
  private readonly container: HTMLDivElement;
  private readonly renderer: WebGLRenderer;
  private readonly scene: Scene;
  private readonly camera: PerspectiveCamera;
  private readonly controls: OrbitControls;
  private readonly picker: Picker;

  private constructor(container: HTMLDivElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = this.setupCamera();
    this.controls = this.setupControls();
    this.picker = this.setupPicker();
    this.setupLight();

    window.onresize = debounce(this.resize, 200);
    this.resize();

    requestAnimationFrame(this.render);
  }

  public static init = async (container: HTMLDivElement): Promise<App> => {
    const app = new App(container);
    const { setupModels } = app;
    setupModels();

    return app;
  };

  private readonly setupModels = () => {
    const geometry = new THREE.BoxGeometry();

    for (let y = -20; y <= 20; y += 1) {
      for (let x = -20; x < 20; x += 1) {
        const color = new THREE.Color().setHSL(0, 0, 0.1);
        const material = new THREE.MeshStandardMaterial({ color });
        new Particle(this.scene, geometry, material, x, y);
      }
    }
  };

  private readonly setupPicker = () => {
    const picker = new Picker();
    const onMouseMove = (event: MouseEvent) => {
      const { clientWidth, clientHeight } = this.container;
      /**
       * x, y 좌표를 [-1, 1] 로 정규화 해야함
       * 마우스 좌표계랑 threejs 의 y 좌표계가 반대라서 -를 곱한것임.
       */
      picker.cursorNormalizedPosition = {
        x: (event.offsetX / clientWidth) * 2 - 1,
        y: -(event.offsetY / clientHeight) * 2 + 1,
      };
    };
    this.container.addEventListener('mousemove', onMouseMove);

    return picker;
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
    camera.position.set(0, 0, 40);
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
    requestAnimationFrame(this.render);
  };

  private readonly update = (time: DOMHighResTimeStamp): void => {
    const seconds = time * 0.001;

    if (this.picker.cursorNormalizedPosition) {
      this.picker.setFromCamera(this.picker.cursorNormalizedPosition, this.camera);
      const targets = this.picker.intersectObjects(this.scene.children);
      if (targets.length > 0) {
        const mesh = targets[0].object;
        // 광선 추적해서 발견한놈 타이머 시작
        if (mesh instanceof ParticleMesh) {
          const particle = mesh.getParticle();
          particle?.awake(seconds);
        }
      }
    }

    this.scene.traverse((obj3D) => {
      // 업데이트 계속 호출
      if (obj3D instanceof ParticleMesh) {
        const particle = obj3D.getParticle();
        if (particle?.awakenTime) {
          particle.update(seconds);
        }
      }
    });
  };
}

window.onload = async () => {
  const container = document.getElementById('webgl-container') as HTMLDivElement;
  await App.init(container);
};
