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

interface GroundHeightMapOptions {
  mapWidth: number
  mapHeight: number
  amplitude: number
  heightOffset: number
  noiseReduction: number // 255 // Higher value means less noise
}

interface GroundMMeshOptions {
  heightMap: Uint8Array
  groundWidth: number,
  groundHeight: number,
  mapWidth: number
  mapHeight: number
  heightOffset: number
  subdivisions: number
  maxHeight: number
  minHeight: number
}

interface GroundOptions extends GroundHeightMapOptions, Omit<GroundMMeshOptions, 'heightMap'> {}

export interface GroundShapeOptions {
  maxAltitude: number // 0 to max height
  minAltitude: number // 0 to min height
  waveFrequency: number // 0 to 1 frequency of the waves. Higher frequency means more and smaller shapes.
}

export interface GroundBaseOptions extends GroundShapeOptions {
  groundWidth: number
  groundHeight: number
}

export interface GroundFilterOptions extends GroundShapeOptions {
  strength: number // 0 to 1. Proportion of the ground this filter occupies. 0 is null presence, 1 is full presence on the entire ground. Two filters of same strength will have the same presence.
  strengthVariation: number // 0 to 1. Variation of the size of the regions created by this filter. Higher value means more variation.
  regions: number // Number of regions this filter will create. Higher number means more scattered presence.
}

export interface GroundLODOptions {
  quality: number
  distance: number // Distance from the camera where this LOD will be applied
}

export class GroundGenerator {
  ground = new Ground()

  private baseShape:  GroundBaseOptions | null = null
  private filterShapes: GroundFilterOptions[] = []
  private lods: GroundLODOptions[] = []
  private waterLevel: number = 0

  setBaseShape(options: GroundBaseOptions): void {
    this.baseShape = options
  }

  addFilterShape(options: GroundFilterOptions): void {
    this.filterShapes.push(options)
  }

  addLOD(options: GroundLODOptions): void {
    this.lods.push(options)
  }

  setWaterLevel(level: number): void {
    this.waterLevel = level
  }

  generate(scene: BABYLON.Scene): void {
    Logger.trace("Generating ground...")

    // Suavizado de multiples noise filters
    // https://chatgpt.com/c/6925ed98-d9cc-8327-ad3e-8ac2436ccb49

    // Merge heigh maps
    // 1- Generate base height map
    // 2- Generate filter height maps
    //    - Generate N height maps (number of regions)
    //      - width = ground width * strength * random(0.8 to 1.2). If width > ground width, set to ground width
    //      - height = ground height * strength * random(0.8 to 1.2). If height > ground height, set to ground height
    // 3- Draw filters over base height map (from Filter 1 to Filter N)
    //    - Search a random point inside base map where the square enters.
    //    - If the square overlaps with previous filters, increment position by a random value (10 to 50) and check again, until it doesn't overlap.
    //    - Save position for afterward overlaps and softening.
    //    - Draw filter height map over base height map at found position.
    //    - Suavize edges between base and filter height maps.
    //    - Repeat for all regions and filters.
    // 5- Set textures according to height ranges and slopes.
    // 6- Add objects according to height ranges and slopes.
    //    - Objects can fit with slope or use a defined angle.

    if (!this.baseShape) {
      Logger.error("Base shape not defined. Cannot generate ground.")
      return
    }

    const noiseReductionFactor = 1

    this.generateHeightMap({
      mapWidth: this.baseShape.groundWidth,
      mapHeight: this.baseShape.groundHeight,
      amplitude: this.baseShape.maxAltitude - this.baseShape.minAltitude,
      heightOffset: this.baseShape.minAltitude,
      noiseReduction: 255,//this.baseShape.noiseReduction,  // 8a8f
    })

    // Base
    this.generateGround({
      groundWidth: 200,
      groundHeight: 200,
      mapWidth: 300,
      mapHeight: 300,
      amplitude: 10,
      heightOffset: 24,
      noiseReduction: 255,
      subdivisions: 20,
      maxHeight: 1,
      minHeight: 0
    }, new BABYLON.Color3(0, 0, 1), scene)

    // Filter 1
    /*this.generateGround({
      groundWidth: 200,
      groundHeight: 200,
      mapWidth: 300,
      mapHeight: 300,
      amplitude: 50,
      heightOffset: 24,
      noiseReduction: 50,
      subdivisions: 200,
      maxHeight: 0.2,
      minHeight: 0
    }, new BABYLON.Color3(1, 0, 0), scene)

    // Filter 2
    this.generateGround({
      groundWidth: 200,
      groundHeight: 200,
      mapWidth: 300,
      mapHeight: 300,
      amplitude: 50,
      heightOffset: 24,
      noiseReduction: 100,
      subdivisions: 100,
      maxHeight: 2,
      minHeight: 0
    }, new BABYLON.Color3(0, 1, 0), scene)*/
  }

  private generateGround(options: GroundOptions, color: BABYLON.Color3, scene: BABYLON.Scene): BABYLON.Mesh {
    const heightMap = this.generateHeightMap({
      mapWidth: options.mapWidth,
      mapHeight: options.mapHeight,
      amplitude: options.amplitude,
      heightOffset: options.heightOffset,
      noiseReduction: options.noiseReduction,
    })

    const mesh = this.generateMesh({
      heightMap: heightMap,
      groundWidth: options.groundWidth,
      groundHeight: options.groundHeight,
      mapWidth: options.mapWidth,
      mapHeight: options.mapHeight,
      heightOffset: options.heightOffset,
      subdivisions: options.subdivisions,
      maxHeight: options.maxHeight,
      minHeight: options.minHeight,
    }, scene, color)

    const ratio = 0.5; // target: 50% of original polygons

    // Create a simplification settings object
    /*const simplificationSettings = {
        strategy: BABYLON.SimplificationType.QUADRATIC, // other options: "STANDARD", "QUADRATIC"
        quality: 0.5,  // 0 = worst quality, 1 = best quality
        distance: 1.0  // optional: influence LOD based on camera distance
    };

    // https://doc.babylonjs.com/features/featuresDeepDive/mesh/simplifyingMeshes
    // BABYLON.SimplificationQueue.SimplifyMesh(mesh, ratio, simplificationSettings);
    mesh.simplify([{ quality: 0.1, distance: 0 }], true, BABYLON.SimplificationType.QUADRATIC);*/

    return mesh
  }

  private generateMesh(options: GroundMMeshOptions, scene: BABYLON.Scene, testColor: BABYLON.Color3): BABYLON.Mesh {
    // Create ground from height map
    Logger.trace("Generating ground from height map...")
    const mesh = BABYLON.MeshBuilder.CreateGroundFromHeightMap("gdhm", {
      data: options.heightMap,
      width: options.mapWidth,
      height: options.mapHeight
      }, {
      width: options.groundWidth,
      height: options.groundHeight,
      subdivisions: options.subdivisions,
      maxHeight: options.maxHeight,
      minHeight: options.minHeight,
      colorFilter: new BABYLON.Color3(options.heightOffset, options.heightOffset, options.heightOffset),
    }, scene);
    const mat = new BABYLON.StandardMaterial("wireMat", scene)
    mat.diffuseColor = testColor
    mat.wireframe = true
    mesh.material = mat
    Logger.trace("Ground generated", mesh.material)

    return mesh
  }

  private generateHeightMap(options: GroundHeightMapOptions): Uint8Array {
    // Return heigh map Uint8Array
    try {
      // Noise generation
      Logger.trace("Generating noise...")
      const noise2D = createNoise2D()

      // Create height map data
      Logger.trace("Creating height map data...")

      const data = new Uint8Array(options.mapWidth * options.mapHeight * 4) as any
      for (let y = 0; y < options.mapHeight; y++) {
        for (let x = 0; x < options.mapWidth; x++) {
          let value = noise2D(x / options.noiseReduction, y / options.noiseReduction)  * options.amplitude + options.heightOffset + 1
          if (value < 0) {
            value = 0
          } else if (value > 255) {
            value = 255
          }
          data[(x + (y * options.mapWidth)) * 4 + 0] = value // R
          data[(x + (y * options.mapWidth)) * 4 + 1] = value // G
          data[(x + (y * options.mapWidth)) * 4 + 2] = value // B
          data[(x + (y * options.mapWidth)) * 4 + 3] = 0   // A
        }
      }

      return data
    } catch (error) {
      Logger.error("Error generating ground", error)
      return null as any
    }
  }
}