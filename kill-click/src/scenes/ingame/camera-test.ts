import * as BABYLON from '@babylonjs/core'
import {
  Camera,
  CameraInterface,
  InputEvent,
  InputEventIds
} from '@khanonjs/engine'

@Camera()
export class CameraTest extends CameraInterface {
  onInitialize(scene: BABYLON.Scene) {
    const camera = new BABYLON.UniversalCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
    camera.target = new BABYLON.Vector3(1, 0, 0)
    camera.inputs.addMouseWheel()

    return camera
  }

  onStart(): void {
    this.babylon.camera.keysLeft.push(65)
    this.babylon.camera.keysRight.push(68)
    this.babylon.camera.keysUp.push(87)
    this.babylon.camera.keysDown.push(83)
    this.babylon.camera.keysUpward.push(82)
    this.babylon.camera.keysDownward.push(70)
  }
}
