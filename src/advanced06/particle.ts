import type { Scene, BufferGeometry, Material } from 'three';
import { Mesh, MeshStandardMaterial } from 'three';
import * as THREE from 'three';

export class Particle<
  TGeometry extends BufferGeometry = BufferGeometry,
  TMaterial extends Material | Material[] = Material | Material[],
> {
  public mesh: ParticleMesh;
  public awakenTime?: number; // 초
  public origin: {
    position: THREE.Vector3;
    rotation: THREE.Euler;
  };

  constructor(scene: Scene, geometry: TGeometry, material: TMaterial, x = 0, y = 0) {
    const mesh = new ParticleMesh(geometry, material);
    mesh.position.set(x, y, 0);
    mesh.setParticle(this);
    scene.add(mesh);
    this.mesh = mesh;
    this.origin = {
      position: new THREE.Vector3().copy(mesh.position),
      rotation: new THREE.Euler().copy(mesh.rotation),
    };
  }

  public readonly awake = (time: number) => {
    if (!this.awakenTime) {
      this.awakenTime = time;
    }
  };

  public readonly update = (time: number) => {
    if (this.awakenTime) {
      const duration = 6.0;
      const elapsedTime = time - this.awakenTime;
      if (elapsedTime >= duration) {
        this.reset();
      }

      // 12초 동안 12번 회전시키겠다.
      this.mesh.rotation.x = THREE.MathUtils.lerp(0, 2 * Math.PI * duration, elapsedTime / duration);

      let hs = 0;
      let l = 0;
      if (elapsedTime < duration / 2) {
        hs = THREE.MathUtils.lerp(0.0, 1.0, elapsedTime / (duration / 2));
        l = THREE.MathUtils.lerp(0.1, 1.0, elapsedTime / (duration / 2));
      } else {
        hs = THREE.MathUtils.lerp(1.0, 0.0, elapsedTime / (duration / 2) - 1);
        l = THREE.MathUtils.lerp(1.0, 0.1, elapsedTime / (duration / 2) - 1);
      }

      if (this.mesh.material instanceof MeshStandardMaterial) {
        this.mesh.material.color.setHSL(hs, hs, l);
        // 0 ~ 15 까지 앞으로 튀어나온다.
        this.mesh.position.z = hs * 15.0;
      }
    }
  };

  private readonly reset = () => {
    this.awakenTime = undefined;
    if (this.mesh.material instanceof MeshStandardMaterial) {
      this.mesh.material.color.setHSL(0, 0, 0.1);
    }
    const { position, rotation } = this.origin;
    this.mesh.position.set(position.x, position.y, position.z);
    this.mesh.rotation.set(rotation.x, rotation.y, rotation.z);
  };
}

export class ParticleMesh extends Mesh {
  private particle?: Particle;

  public readonly setParticle = (particle: Particle) => {
    this.particle = particle;
  };

  public readonly getParticle = () => this.particle;
}
