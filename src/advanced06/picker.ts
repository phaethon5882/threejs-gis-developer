import { Raycaster } from 'three';

export default class Picker extends Raycaster {
  public cursorNormalizedPosition?: { x: number; y: number };
}
