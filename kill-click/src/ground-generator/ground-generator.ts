/**
 * The ground is built by a random height map, where points under the sea level have water over them,
 * and points over the sea level will go from grass to dust. The uneven ground has a certain range to avoid spikes.
 */

import * as BABYLON from '@babylonjs/core'
import {
  KJS,
  Logger
} from '@khanonjs/engine'

import { Ground } from './ground'
import { createNoise2D } from './simplex-noise'

export class GroundGenerator {
  ground = new Ground()

  generate(scene: BABYLON.Scene) {
    const noise2D = createNoise2D()
    const width = 600
    const height = 600
    const data = new Uint8Array(width * height * 4)
    let array: number[][] = []
    const factor1 = 20
    const factor2 = 20
    const subdivisions = 32
    for (let y = 0; y < height; y++) {
      array[y] = []
      for (let x = 0; x < width; x++) {
        let value = noise2D(x / 255.0, y / 255.0) * factor1 + factor2 + 1
        // console.log("aki value", value)
        // value += 255.0
        array[y][x] = value
        data[(x + (y * width)) * 4 + 0] = value // R
        data[(x + (y * width)) * 4 + 1] = value // G
        data[(x + (y * width)) * 4 + 2] = value // B
        data[(x + (y * width)) * 4 + 3] = 0   // A
      }
    }
    Logger.trace("aki array", array)

    // this.ground.mesh = BABYLON.MeshBuilder.CreateGroundFromHeightMap("gdhm", "assets/heightmap 2.png", { width: 100, height: 100, subdivisions: 100 }, scene);

    Logger.trace("Generating ground from height map...")
    this.ground.mesh = BABYLON.MeshBuilder.CreateGroundFromHeightMap("gdhm", {
      data,
      width,
      height
    }, {
      width: 100,
      height: 100,
      subdivisions,
      colorFilter: new BABYLON.Color3(factor2, factor2, factor2),
    }, scene);
    Logger.trace("Ground generated")
  }
}