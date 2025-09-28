const fs = require('fs');
const path = require('path');

const games = [
  'apocalypse-tank',
]

const babylonjs_version = '^8.17.0'
const khanonjsjs_version = '^0.2.16'

games.forEach(gameName => {
   console.log(`Updating packages for game '${gameName}'...`)
   const package = require(`./${gameName}/package.json`)
   package.devDependencies['@babylonjs/inspector'] = babylonjs_version
   package.dependencies['@khanonjs/engine'] = khanonjsjs_version
   package.dependencies['@babylonjs/core'] = babylonjs_version
   package.dependencies['@babylonjs/gui'] = babylonjs_version

   fs.writeFile(`./${gameName}/package.json`, JSON.stringify(package, null, 2), (err) => {
      if (err) {
          console.log(`Error saving package in path '${path}':`, err)
          process.exit(1)
      } else {
         console.log(`Package updated in game '${gameName}'.`)
      }
   })

   require('child_process').exec('npm i', { cwd: `./${gameName}` })
})