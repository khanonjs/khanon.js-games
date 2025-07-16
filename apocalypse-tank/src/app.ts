import {
  App,
  AppInterface,
  Logger
} from '@khanonjs/engine'

@App({
  name: 'apocalypse-tank'
})
export class MyApp extends AppInterface {
  onStart() {
    // Entry point of your app
    Logger.trace('Hello world!')
  }

  onClose() {
    Logger.info('App onClose')
  }

  onError(error?: string) {
    Logger.error('App onError:', error)
  }
}
