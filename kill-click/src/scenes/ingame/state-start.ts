/* eslint-disable camelcase */
import * as BABYLON from '@babylonjs/core'
import {
  KJS,
  Logger,
  SceneAction,
  SceneState,
  SceneStateInterface,
  Sprite,
  SpriteConstructor
} from '@khanonjs/engine'

import { ActorPlayer } from '../../actors/actor-player'
import { CameraIngame } from './camera-ingame'
import { CameraTest } from './camera-test'

@SceneState({
  actors: [

  ]
})
export class SceneStateStart extends SceneStateInterface {
  onStart() {
    this.switchCamera(CameraTest, {})
    this.spawn.actor(ActorPlayer)
  }
}
