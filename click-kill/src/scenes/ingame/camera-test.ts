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
    const camera = new BABYLON.UniversalCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene)
    camera.target = new BABYLON.Vector3(-10.102044888250914, 55.6463880802311, -111.3237338070253)
    camera.position = new BABYLON.Vector3(-11.102044841641263, 60.64638809808052, -121.32373384272415)
    camera.rotation = new BABYLON.Vector3(0.4616605138420217, 0.09966865066995244, 0)
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
