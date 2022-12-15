import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { VertexNormalsHelper } from 'three/examples/jsm/helpers/VertexNormalsHelper';

class App {
  private readonly container: HTMLDivElement;
  private readonly renderer: WebGLRenderer;
  private readonly scene: Scene;
  private readonly camera: PerspectiveCamera;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.scene = new THREE.Scene();
    this.camera = this.setupCamera();

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    this.setupLight();
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

  private readonly setupModel = (): void => {
    // prettier-ignore
    const rawPositions = [
      -1, -1, 0,
      1, -1, 0,
      -1, 1, 0,
      1, 1, 0
    ];

    // prettier-ignore
    const rawNormals = [
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
    ];

    // prettier-ignore
    const rawColors = [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1,
      1, 1, 0,
    ];

    // prettier-ignore
    const rawUVs = [
      0, 0,
      1, 0,
      0, 1,
      1, 1
    ];

    const positions = new Float32Array(rawPositions);
    const normals = new Float32Array(rawNormals);
    const colors = new Float32Array(rawColors);
    const uvs = new Float32Array(rawUVs);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    // 사각형은 2개의 삼각형 매쉬로 변형되는데. 정점의 순서를 부여한다.
    // 한 행에서 정점의 방향은 반시계 방향으로 나열해야한다고 함
    // prettier-ignore
    geometry.setIndex([
      0, 1, 2,
      2, 1, 3
    ]);

    /** 빛이 닿은 표면의 색깔을 칠하기 위해 입사각과 반사각을 계산해야하는데. 이 때 법선벡터가 사용된다. */
    // geometry.computeVertexNormals(); <- 법선벡터 계산을 자동으로 해줌.
    const textureLoader = new THREE.TextureLoader();
    const map = textureLoader.load('/static/images/uv_grid_opengl.jpg');
    const material = new THREE.MeshPhongMaterial({ color: 0xffffff, vertexColors: false, map });

    const box = new THREE.Mesh(geometry, material);
    this.scene.add(box);

    const normalsHelper = new VertexNormalsHelper(box, 0.1, 0xffff00);
    this.scene.add(normalsHelper);
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

  private readonly update = (time: DOMHighResTimeStamp): void => {};
}

window.onload = () => {
  const container = document.getElementById('webgl-container') as HTMLDivElement;
  new App(container);
};
