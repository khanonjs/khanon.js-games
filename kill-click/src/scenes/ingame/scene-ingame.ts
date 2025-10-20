import {
  Color3,
  Color4,
  Mesh
} from '@babylonjs/core'
import { CreateGroundFromHeightMap } from '@babylonjs/core/Meshes/Builders/groundBuilder'
import {
  Logger,
  Scene,
  SceneInterface
} from '@khanonjs/engine'

import { ActorPlayer } from '../../actors/actor-player'
import { CameraIngame } from './camera-ingame'
import { SceneStateStart } from './state-start'

@Scene({
  configuration: {
    clearColor: new Color4(0.25, 0.25, 0.25, 1.0)
  },
  states: [
    SceneStateStart
  ],
  actors: [
    ActorPlayer
  ]
})
export class SceneIngame extends SceneInterface {
  ground: Mesh

  onLoaded() {
    Logger.trace("WTF???")
    this.build()
  }

  onUnload() {
  }

  onStart() {
  }

  onStop() {
  }

  build() {
    Logger.trace('Building scene ingame...')
    // Define height and width of the height map
    const height = 64
    const width = 64

    // Create a simple height map (flat, all zeros)
    const heightMap = new Uint8Array(width * height)
    // Optionally, fill with some pattern:
    // for (let y = 0; y < height; y++) {
    //   for (let x = 0; x < width; x++) {
    //     heightMap[y * width + x] = Math.floor(32 + 32 * Math.sin(x / 8) * Math.cos(y / 8))
    //   }
    // }

    // Create a Blob URL for the height map as an image
    // Babylon.js expects an image, so we need to convert the Uint8Array to an image
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    const imgData = ctx.createImageData(width, height)
    for (let i = 0; i < heightMap.length; i++) {
      imgData.data[i * 4 + 0] = heightMap[i] // R
      imgData.data[i * 4 + 1] = heightMap[i] // G
      imgData.data[i * 4 + 2] = heightMap[i] // B
      imgData.data[i * 4 + 3] = 255          // A
    }
    ctx.putImageData(imgData, 0, 0)
    const url_to_height_map = canvas.toDataURL()

    // Options for the ground
    const options = {
      width,
      height,
      colorFilter: new Color3(1.0, 0.0, 0.0),
    }

    // Create ground from height map
    this.ground = CreateGroundFromHeightMap("gdhm", { data: heightMap, height, width }, options, this.babylon.scene)
  }
}