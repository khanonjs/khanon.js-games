import {
  Mesh,
  MeshInterface
} from '@khanonjs/engine'

@Mesh({
  url: './assets/meshes/player.glb',
  animations: [
    { id: 'idle', loop: true },
    { id: 'attack', loop: true },
    { id: 'walk', loop: false },
    { id: 'run', loop: false },
    { id: 'jump', loop: false },
    { id: 'shooting', loop: false },
    { id: 'death', loop: false },
    { id: 'diying', loop: false }
  ]
})
export class MeshPlayer extends MeshInterface {}