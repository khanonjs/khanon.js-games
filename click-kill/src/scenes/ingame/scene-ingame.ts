import * as BABYLON from '@babylonjs/core'
import { CreateGroundFromHeightMap } from '@babylonjs/core/Meshes/Builders/groundBuilder'
import {
  Logger,
  Scene,
  SceneInterface
} from '@khanonjs/engine'

import { ActorPlayer } from '../../actors/actor-player'
import { GroundGenerator } from '../../ground-generator/ground-generator'
import { SceneStateStart } from './state-start'

@Scene({
  configuration: {
    clearColor: new BABYLON.Color4(0.25, 0.25, 0.25, 1.0)
  },
  states: [
    SceneStateStart
  ],
  actors: [
    ActorPlayer
  ]
})
export class SceneIngame extends SceneInterface {
  light1: BABYLON.HemisphericLight
  groundGenerator = new GroundGenerator()

  onLoaded() {
    this.build()
    this.light1 = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(1, 0, 0), this.babylon.scene)
  }

  onUnload() {
  }

  onStart() {
  }

  onStop() {
  }

  build() {
    Logger.trace('Building scene ingame...')
    this.groundGenerator.setBaseShape({
      groundWidth: 100,
      groundHeight: 100,
      maxAltitude: 10,
      minAltitude: -10,
      waveFrequency: 1
    })
    this.groundGenerator.generate(this.babylon.scene)
    Logger.trace('Scene built')
  }
}