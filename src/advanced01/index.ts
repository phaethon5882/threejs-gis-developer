/**
 * navigator.mediaDevices.getUserMedia(constraints) 를 사용하면 웹캠 스트림을 꺼내쓸 수 있다.
 * video dom element 하나 만들고 srcObject 에다가 넘겨주고 play() 를 호출하면 된다.
 *
 * THREE.VideoTexture(videoElement) 를 사용하면 비디오 텍스처를 만들 수 있다.
 * 위에서 만든 videoElement 를 넘겨주면 텍스쳐로 만들어준다.
 * 주의할점은 video 가 로딩이 되고 나서 매쉬를 만들어야 된다는거~
 */
import type { PerspectiveCamera, Scene, VideoTexture, WebGLRenderer } from 'three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class App {
  private readonly container: HTMLDivElement;
  private readonly renderer: WebGLRenderer;
  private readonly scene: Scene;
  private readonly camera: PerspectiveCamera;

  private constructor(container: HTMLDivElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();

    this.camera = this.setupCamera();
    this.setupLight();
    this.setupControls();

    window.onresize = this.resize;
    this.resize();

    requestAnimationFrame(this.render);
  }

  public static init = async (container: HTMLDivElement): Promise<App> => {
    const app = new App(container);
    await app.setupModel();
    return app;
  };

  setupModel = async (): Promise<void> => {
    const map = await this.getVideoTexture();
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const boxMaterial = new THREE.MeshPhongMaterial({ map });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    this.scene.add(box);
  };

  getVideoTexture = async (): Promise<VideoTexture> => {
    const video = document.createElement('video');
    const constraints: MediaStreamConstraints = {
      video: {
        aspectRatio: this.camera.aspect,
      },
    };

    // 웹캠 지원 확인
    if (navigator.mediaDevices?.getUserMedia) {
      video.srcObject = await navigator.mediaDevices.getUserMedia(constraints);
      await video.play();
      return new THREE.VideoTexture(video);
    } else {
      throw new Error('MediaDevices 인터페이스 사용 불가');
    }
  };

  private readonly setupControls = () => {
    new OrbitControls(this.camera, this.container);
  };

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
    // this.box.rotation.x = time * 0.001;
    // this.box.rotation.y = time * 0.001;
  };
}

window.onload = async () => {
  const container = document.getElementById('webgl-container') as HTMLDivElement;
  await App.init(container);
};
