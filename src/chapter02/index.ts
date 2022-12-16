import type { Group, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

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
    camera.position.z = 2;

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
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
    const boxMaterial = new THREE.MeshPhongMaterial({ color: 0x515151 });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);

    const wireframeGeometry = new THREE.WireframeGeometry(boxGeometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);

    const group = new THREE.Group();
    group.add(box);
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
