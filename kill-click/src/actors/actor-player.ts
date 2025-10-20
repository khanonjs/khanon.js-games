import {
  Actor,
  ActorInterface,
  MeshInterface
} from '@khanonjs/engine'

import { MeshPlayer } from '../meshes/mesh-player'

@Actor({
  meshes: [MeshPlayer]
})
export class ActorPlayer extends ActorInterface<MeshInterface> {
  onSpawn() {
    this.setBody(MeshPlayer)
  }

  onDestroy() {
    // Invoked on actor destroy
  }
}