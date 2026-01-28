import {
  AppState,
  AppStateInterface,
  KJS,
  Logger
} from '@khanonjs/engine'

import { SceneIngame } from './scenes/ingame/scene-ingame'
import { SceneStateStart } from './scenes/ingame/state-start'

@AppState({
  scenes: [
    SceneIngame
  ]
})
export class AppStateIngame extends AppStateInterface {
  onStart() {
    KJS.Scene.start(SceneIngame, SceneStateStart, {})
  }
}
