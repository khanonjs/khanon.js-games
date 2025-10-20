import * as BABYLON from '@babylonjs/core'
import {
  Camera,
  CameraInterface
} from '@khanonjs/engine'

@Camera()
export class CameraIngame extends CameraInterface {
  onInitialize(scene: BABYLON.Scene) {
    const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
    camera.target = new BABYLON.Vector3(1, 0, 0)
    camera.inputs.clear()
    return camera
  }
}