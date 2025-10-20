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

@SceneState({
  actors: [

  ]
})
export class SceneStateStart extends SceneStateInterface {
  onStart() {
    this.switchCamera(CameraIngame, {})
    this.spawn.actor(ActorPlayer)
  }
}
