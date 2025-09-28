import { SceneInterface } from '@khanonjs/engine/decorators/scene'

export class SceneIngame extends SceneInterface {
  tileMap: ("floor" | "wall")[][];
  tankPositions: { x: number; y: number; }[];

  buildMap() {
    // Parameters for the map
    const width = 20; // map width in tiles
    const height = 15; // map height in tiles
    const tileMap: ('floor' | 'wall')[][] = [];

    // Helper to fill the map with floors
    for (let y = 0; y < height; y++) {
      tileMap[y] = [];
      for (let x = 0; x < width; x++) {
        tileMap[y][x] = 'floor';
      }
    }

    // Place outer walls
    for (let x = 0; x < width; x++) {
      tileMap[0][x] = 'wall';
      tileMap[height - 1][x] = 'wall';
    }
    for (let y = 0; y < height; y++) {
      tileMap[y][0] = 'wall';
      tileMap[y][width - 1] = 'wall';
    }

    // Helper to add a wall block (rectangle)
    function addWallBlock(x: number, y: number, w: number, h: number) {
      for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
          if (
            y + i > 0 && y + i < height - 1 &&
            x + j > 0 && x + j < width - 1
          ) {
            tileMap[y + i][x + j] = 'wall';
          }
        }
      }
    }

    // Add some random wall blocks, but keep a path open
    const randomBlocks = 3;
    for (let i = 0; i < randomBlocks; i++) {
      // Random width and height between 1 and 4
      const w = Math.floor(Math.random() * 4) + 1;
      const h = Math.floor(Math.random() * 4) + 1;
      // Random position, avoiding outer walls
      const x = Math.floor(Math.random() * (width - w - 2)) + 1;
      const y = Math.floor(Math.random() * (height - h - 2)) + 1;
      addWallBlock(x, y, w, h);
    }

    // Ensure tanks can reach each other by carving a path
    function carvePath(x1: number, y1: number, x2: number, y2: number) {
      let x = x1, y = y1;
      while (x !== x2) {
        tileMap[y][x] = 'floor';
        x += x < x2 ? 1 : -1;
      }
      while (y !== y2) {
        tileMap[y][x] = 'floor';
        y += y < y2 ? 1 : -1;
      }
      tileMap[y][x] = 'floor';
    }

    // Example tank spawn points
    const tank1 = { x: 1, y: 1 };
    const tank2 = { x: width - 2, y: height - 2 };

    // Carve a path between tanks
    carvePath(tank1.x, tank1.y, tank2.x, tank2.y);

    // Store the map and tank positions in the scene
    this.tileMap = tileMap;
    this.tankPositions = [tank1, tank2];
  }
}