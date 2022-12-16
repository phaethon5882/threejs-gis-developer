import type { Group, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import * as THREE from 'three';
import fontJson from 'three/examples/fonts/helvetiker_regular.typeface.json';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';

class App {
  private readonly container: HTMLDivElement;
  private readonly renderer: WebGLRenderer;
  private readonly scene: Scene;
  private readonly camera: PerspectiveCamera;
  private readonly model: Group;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.scene = new THREE.Scene();
    this.camera = this.setupCamera();

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    this.setupLight();
    this.model = this.setupModel();

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
    camera.position.set(0, 0, 40);
    return camera;
  };

  private readonly setupLight = (): void => {
    const color = 0xffffff;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    this.scene.add(light);
  };

  private readonly setupModel = (): Group => {
    const fontLoader = new FontLoader();
    const textGeometry = new TextGeometry('Y u n k i', {
      font: fontLoader.parse(fontJson),
      size: 9,
      height: 1.5,
      curveSegments: 5,
      bevelEnabled: true,
      bevelThickness: 1.5,
      bevelSize: 1,
      bevelSegments: 6,
    });

    const textMaterial = new THREE.MeshPhongMaterial({ color: 0x515151 });
    const text = new THREE.Mesh(textGeometry, textMaterial);

    const wireframeGeometry = new THREE.WireframeGeometry(textGeometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);

    const group = new THREE.Group();
    group.add(text);
    group.add(wireframe);
    this.scene.add(group);

    return group;
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
    // this.model.rotation.x = time * 0.001;
    // this.model.rotation.y = time * 0.001;
  };
}

window.onload = () => {
  const container = document.getElementById('webgl-container') as HTMLDivElement;
  new App(container);
};
