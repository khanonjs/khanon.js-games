/**
 * The ground is built by a random height map, where points under the sea level have water over them,
 * and points over the sea level will go from grass to dust. The uneven ground has a certain range to avoid spikes.
 * This class returns a Babylon Mesh object.
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
  noiseReduction: number // 255 // Higher value means less noise
}

interface GroundMMeshOptions {
  heightMap: Uint8Array
  groundWidth: number,
  groundHeight: number,
  mapWidth: number
  mapHeight: number
  subdivisions: number
  maxHeight: number
  minHeight: number
}

interface GroundOptions extends GroundHeightMapOptions, Omit<GroundMMeshOptions, 'heightMap'> {}

export interface GroundShapeOptions {
  maxAltitude: number // 0 to max height
  minAltitude: number // 0 to min height
  waveFrequency: number // 0 to N frequency of the waves. Higher frequency means more and smaller shapes.
  quality?: number // 0 to 1. Default 0.5.
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

    if (this.baseShape.maxAltitude < this.baseShape.minAltitude) {  // 8a8f make generic to shapes
      Logger.error("Shape maxAltitude must be equal or higher than minAltitude.")
      return
    }

    const noiseReductionFactor = 1
    const sizeFactor = (this.baseShape.groundWidth + this.baseShape.groundHeight) / 2.0

    // Wave frequency is applied as a multiplier to the noise noiseReduction, so higher frequency means more and smaller shapes.
    // Subdivisions are fixed according to the noise reduction, so higher frequency means more subdivisions and better quality, but also worse performance. We can consider to add a max subdivisions limit to avoid performance issues.
    const waveFrequency = this.baseShape.waveFrequency || 1
    const noiseReduction = 30// sizeFactor * waveFrequency
    const subdivisions = 50 // 20 is the base subdivisions for wave frequency 1. Higher wave frequency means more subdivisions and better quality, but also worse performance.
    const amplitude = (this.baseShape.maxAltitude - this.baseShape.minAltitude)

    Logger.trace("aki noise reduction", noiseReduction)
    Logger.trace("aki subdivisions", subdivisions)
    Logger.trace("aki amplitude", amplitude)

    const heightMap = this.generateHeightMap({
      mapWidth: this.baseShape.groundWidth,
      mapHeight: this.baseShape.groundHeight,
      amplitude: amplitude,
      noiseReduction: noiseReduction,
    })

    Logger.trace("Heightmap", heightMap)

    const mesh = this.generateMesh({
      heightMap: heightMap,
      groundWidth: this.baseShape.groundWidth,
      groundHeight: this.baseShape.groundHeight,
      mapWidth: this.baseShape.groundWidth,
      mapHeight: this.baseShape.groundHeight,
      subdivisions: subdivisions,
      maxHeight: this.baseShape.maxAltitude, // 8a8f queremos que la amplitud coincida en tamaño con la proporción de otros objetos en la escena
      minHeight: this.baseShape.minAltitude,
    }, scene, new BABYLON.Color3(0, 0, 1))

    // ************ 8a8f
    mesh.computeWorldMatrix(true);

    const boundingInfo = mesh.getBoundingInfo();
    const minHeight = boundingInfo.boundingBox.minimumWorld.y;
    const maxHeight = boundingInfo.boundingBox.maximumWorld.y;
    Logger.trace("aki MESH MIN MAX", minHeight, maxHeight)
    Logger.trace("aki MESH HEIGHT", maxHeight - minHeight)

    // ************

    // Base
    /*this.generateGround({
      groundWidth: 100,
      groundHeight: 100,
      mapWidth: 100,
      mapHeight: 100,
      amplitude: 10,
      heightOffset: 24,
      noiseReduction: 10,
      subdivisions: 20,
      maxHeight: 1,
      minHeight: 0
    }, new BABYLON.Color3(0, 0, 1), scene)*/

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
      noiseReduction: options.noiseReduction,
    })

    const mesh = this.generateMesh({
      heightMap: heightMap,
      groundWidth: options.groundWidth,
      groundHeight: options.groundHeight,
      mapWidth: options.mapWidth,
      mapHeight: options.mapHeight,
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
    Logger.trace("Generating mesh from height map...", options)
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
      // colorFilter: new BABYLON.Color3(1, 1, 1), // Points color offset. Using this causes inaccurate height. TODO: Why?
    }, scene);
    const mat = new BABYLON.StandardMaterial("wireMat", scene)
    mat.diffuseColor = testColor
    mat.wireframe = true
    mesh.material = mat
    // mesh.translate(new BABYLON.Vector3(-options.minHeight, 0, 0), 1)
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
      Logger.trace("Creating height map data...", options)

      let minV = 999
      let maxV = -999

      const data = new Uint8Array(options.mapWidth * options.mapHeight * 4)
      const height = new Float32Array(options.mapWidth * options.mapHeight)
      const amplitudeDiv2 = options.amplitude
      for (let y = 0; y < options.mapHeight; y++) {
        for (let x = 0; x < options.mapWidth; x++) {
          const noise = noise2D(x / options.noiseReduction, y / options.noiseReduction) // From -1 to 1
          let value = noise * amplitudeDiv2

          if (value < minV) {
            minV = value
          } else if (value > maxV) {
            maxV = value
          }

          height[(x + (y * options.mapWidth))] = value
        }
      }

      Logger.trace("aki value min max ", minV, maxV)

      const subVal = minV
      const mulVal = 255.0 / (options.amplitude * 2)

      Logger.trace("aki subVal mulVal", subVal, mulVal, options.amplitude)

      minV = 999  // 8a8f eliminar
      maxV = -999

      for (let y = 0; y < options.mapHeight; y++) {
        for (let x = 0; x < options.mapWidth; x++) {
          const offset = Math.round((height[(x + (y * options.mapWidth))] - subVal) * mulVal) // 0 to 255 (Why does it only reach between 254.4 and 254.5???)

          if (offset < minV) {  // 8a8f eliminar
            minV = offset
          } else if (offset > maxV) {
            maxV = offset
          }

          // Logger.trace("aki offset", offset)

          data[(x + (y * options.mapWidth)) * 4 + 0] = offset // R
          data[(x + (y * options.mapWidth)) * 4 + 1] = offset // G
          data[(x + (y * options.mapWidth)) * 4 + 2] = offset // B
          data[(x + (y * options.mapWidth)) * 4 + 3] = 0   // A
        }
      }

      Logger.trace("aki offset min max ", minV, maxV)

      return data
    } catch (error) {
      Logger.error("Error generating ground", error)
      return null as any
    }
  }
}