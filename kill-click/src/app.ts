import {
  App,
  AppInterface,
  KJS,
  Logger
} from '@khanonjs/engine'

import { AppStateIngame } from './app-state-ingame'

@App({
  name: 'kill-click'
})
export class MyApp extends AppInterface {
  onStart() {
    this.switchState(AppStateIngame, {})
  }

  onClose() {
    Logger.info('App onClose')
  }

  onError(error?: string) {
    Logger.error('App onError:', error)
  }
}
