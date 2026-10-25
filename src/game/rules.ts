import { C64 } from './c64Palette';
import {
  ActionFeedbackEvent,
  Direction,
  DungeonState,
  Enemy,
  EnemyType,
  InventoryItem,
  ItemType,
  LogEntry,
  PlayerState,
  Room,
  TileType,
  WorldItem,
} from './types';

export const MAP_WIDTH = 56;
export const MAP_HEIGHT = 38;
export const MAX_DUNGEON_LEVEL = 5;

const WEAPON_TIERS = [
  { name: 'Iron Shortsword', bonus: 0 },
  { name: 'Broad Claymore', bonus: 3 },
  { name: 'Runed Battleaxe', bonus: 6 },
  { name: 'Obsidian Halberd', bonus: 9 },
  { name: 'Sword of Fargoal', bonus: 13 },
];

const SHIELD_TIERS = [
  { name: 'Leather Buckler', bonus: 0 },
  { name: 'Iron Targe', bonus: 2 },
  { name: 'Templar Kite Shield', bonus: 4 },
  { name: 'Mithril Aegis', bonus: 6 },
];

/**
 * Deterministic Mulberry32 PRNG
 */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function isWalkableTile(tile: TileType): boolean {
  return (
    tile === TileType.FLOOR ||
    tile === TileType.CORRIDOR ||
    tile === TileType.DOOR_OPEN ||
    tile === TileType.STAIRS_DOWN ||
    tile === TileType.TRAP_SPIKE ||
    tile === TileType.TRAP_TRIGGERED ||
    tile === TileType.AMULET_PEDESTAL
  );
}

export function isOpaqueTile(tile: TileType): boolean {
  return (
    tile === TileType.VOID ||
    tile === TileType.WALL ||
    tile === TileType.WALL_MOSS ||
    tile === TileType.WALL_TORCH ||
    tile === TileType.DOOR_CLOSED ||
    tile === TileType.DOOR_LOCKED
  );
}

/**
 * Checks if a target coordinate (tx, ty) is reachable from (sx, sy)
 * passing through FLOOR, CORRIDOR, DOOR_OPEN, DOOR_CLOSED, STAIRS_DOWN, TRAPs,
 * and optionally allowing DOOR_LOCKED if passLocked is true.
 */
export function isReachableBFS(
  tiles: TileType[][],
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  passLocked = true
): boolean {
  const h = tiles.length;
  const w = tiles[0].length;
  const visited: boolean[][] = Array.from({ length: h }, () =>
    Array(w).fill(false)
  );
  const queue: [number, number][] = [[sx, sy]];
  visited[sy][sx] = true;

  const dirs = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ];

  while (queue.length > 0) {
    const [cx, cy] = queue.shift()!;
    if (cx === tx && cy === ty) return true;

    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || visited[ny][nx]) continue;
      const t = tiles[ny][nx];
      const canPass =
        isWalkableTile(t) ||
        t === TileType.DOOR_CLOSED ||
        (passLocked && t === TileType.DOOR_LOCKED);
      if (canPass) {
        visited[ny][nx] = true;
        queue.push([nx, ny]);
      }
    }
  }
  return false;
}

/**
 * Returns the set of all tiles reachable from (sx, sy) WITHOUT passing through any DOOR_LOCKED.
 */
export function getUnlockedReachableSet(
  tiles: TileType[][],
  sx: number,
  sy: number
): Set<string> {
  const h = tiles.length;
  const w = tiles[0].length;
  const reachable = new Set<string>();
  const queue: [number, number][] = [[sx, sy]];
  reachable.add(`${sx},${sy}`);

  const dirs = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ];

  while (queue.length > 0) {
    const [cx, cy] = queue.shift()!;
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      const key = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || reachable.has(key)) continue;
      const t = tiles[ny][nx];
      const canPass = isWalkableTile(t) || t === TileType.DOOR_CLOSED;
      if (canPass) {
        reachable.add(key);
        queue.push([nx, ny]);
      }
    }
  }
  return reachable;
}

/**
 * Computes Field of View (FOV) from player (px, py) with radius
 */
export function computeFOV(state: DungeonState, radius = 11): void {
  const { width, height, tiles, visible, explored, player } = state;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      visible[y][x] = false;
    }
  }

  const px = player.x;
  const py = player.y;
  visible[py][px] = true;
  explored[py][px] = true;

  const steps = 144;
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    let rx = px + 0.5;
    let ry = py + 0.5;

    for (let d = 0; d < radius; d++) {
      rx += dx * 0.5;
      ry += dy * 0.5;
      const tx = Math.floor(rx);
      const ty = Math.floor(ry);
      if (tx < 0 || ty < 0 || tx >= width || ty >= height) break;

      visible[ty][tx] = true;
      explored[ty][tx] = true;

      if (isOpaqueTile(tiles[ty][tx])) {
        break;
      }
    }
  }
}

export function createInitialPlayer(x: number, y: number): PlayerState {
  return {
    x,
    y,
    visualX: x,
    visualY: y,
    facing: 'RIGHT',
    hp: 28,
    maxHp: 28,
    attack: 6,
    defense: 1,
    weaponName: WEAPON_TIERS[0].name,
    shieldName: SHIELD_TIERS[0].name,
    gold: 0,
    keys: 1, // Start with 1 skeleton key in pouch
    score: 0,
    level: 1,
    xp: 0,
    nextXp: 30,
    inventory: [
      {
        id: 'init-potion-1',
        type: ItemType.POTION_HEAL,
        name: 'Crimson Elixir',
        description: 'Restores +14 HP immediately.',
        count: 2,
        value: 14,
      },
      {
        id: 'init-scroll-1',
        type: ItemType.SCROLL_SMITE,
        name: 'Scroll of SID Bolt',
        description: 'Strikes all visible monsters within 4 tiles for 12 DMG.',
        count: 1,
        value: 12,
      },
    ],
    hitFlashTimer: 0,
    scaleX: 1,
    scaleY: 1,
    attackAnimTimer: 0,
  };
}

/**
 * Generates a complete procedural dungeon floor with at least 11 interconnected rooms,
 * locked doors with guaranteed reachable keys, treasure chests, traps, items, and 4 enemy types.
 */
export function generateDungeon(
  dungeonLevel = 1,
  seed = Date.now(),
  existingPlayer?: PlayerState,
  bestScore = 0
): DungeonState {
  const rng = createRng(seed + dungeonLevel * 7919);
  const width = MAP_WIDTH;
  const height = MAP_HEIGHT;

  const tiles: TileType[][] = Array.from({ length: height }, () =>
    Array(width).fill(TileType.VOID)
  );
  const explored: boolean[][] = Array.from({ length: height }, () =>
    Array(width).fill(false)
  );
  const visible: boolean[][] = Array.from({ length: height }, () =>
    Array(width).fill(false)
  );

  const rooms: Room[] = [];
  const targetRoomCount = 12; // Always >= 10 rooms

  // 1. Place non-overlapping rooms using a 4x3 sector grid first to guarantee >= 12 rooms
  const cols = 4;
  const rows = 3;
  const cellW = Math.floor((width - 4) / cols);
  const cellH = Math.floor((height - 4) / rows);

  let roomId = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const rw = randInt(rng, 6, Math.min(10, cellW - 2));
      const rh = randInt(rng, 5, Math.min(8, cellH - 2));
      const minX = 2 + c * cellW + 1;
      const maxX = Math.max(minX, 2 + (c + 1) * cellW - rw - 1);
      const minY = 2 + r * cellH + 1;
      const maxY = Math.max(minY, 2 + (r + 1) * cellH - rh - 1);

      const rx = randInt(rng, minX, maxX);
      const ry = randInt(rng, minY, maxY);

      const room: Room = {
        id: roomId++,
        x: rx,
        y: ry,
        w: rw,
        h: rh,
        cx: Math.floor(rx + rw / 2),
        cy: Math.floor(ry + rh / 2),
      };
      rooms.push(room);

      for (let yy = ry; yy < ry + rh; yy++) {
        for (let xx = rx; xx < rx + rw; xx++) {
          tiles[yy][xx] = TileType.FLOOR;
        }
      }
    }
  }

  // Shuffle room order slightly within snake path so layout feels organic while connected
  const carveCorridor = (x1: number, y1: number, x2: number, y2: number) => {
    let cx = x1;
    let cy = y1;
    const horizFirst = rng() < 0.5;

    const stepTile = (tx: number, ty: number) => {
      if (tiles[ty][tx] === TileType.VOID) {
        tiles[ty][tx] = TileType.CORRIDOR;
      }
    };

    if (horizFirst) {
      while (cx !== x2) {
        stepTile(cx, cy);
        cx += cx < x2 ? 1 : -1;
      }
      while (cy !== y2) {
        stepTile(cx, cy);
        cy += cy < y2 ? 1 : -1;
      }
      stepTile(cx, cy);
    } else {
      while (cy !== y2) {
        stepTile(cx, cy);
        cy += cy < y2 ? 1 : -1;
      }
      while (cx !== x2) {
        stepTile(cx, cy);
        cx += cx < x2 ? 1 : -1;
      }
      stepTile(cx, cy);
    }
  };

  // Connect all rooms sequentially + add extra loop corridors for tactical exploration
  for (let i = 0; i < rooms.length - 1; i++) {
    carveCorridor(rooms[i].cx, rooms[i].cy, rooms[i + 1].cx, rooms[i + 1].cy);
  }
  // Connect top row to middle row and middle row to bottom row vertically
  for (let c = 0; c < cols; c++) {
    carveCorridor(rooms[c].cx, rooms[c].cy, rooms[c + cols].cx, rooms[c + cols].cy);
    carveCorridor(
      rooms[c + cols].cx,
      rooms[c + cols].cy,
      rooms[c + cols * 2].cx,
      rooms[c + cols * 2].cy
    );
  }

  // 2. Surround all FLOOR and CORRIDOR tiles with stone WALLs
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (tiles[y][x] === TileType.VOID) {
        let touchesFloor = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (
              tiles[ny]?.[nx] === TileType.FLOOR ||
              tiles[ny]?.[nx] === TileType.CORRIDOR
            ) {
              touchesFloor = true;
            }
          }
        }
        if (touchesFloor) {
          const roll = rng();
          if (roll < 0.14) {
            tiles[y][x] = TileType.WALL_MOSS;
          } else if (roll < 0.22) {
            tiles[y][x] = TileType.WALL_TORCH;
          } else {
            tiles[y][x] = TileType.WALL;
          }
        }
      }
    }
  }

  // Designate start room (room 0) and exit room (furthest room, rooms[rooms.length - 1])
  const startRoom = rooms[0];
  startRoom.isStart = true;
  const exitRoom = rooms[rooms.length - 1];
  exitRoom.isExit = true;

  // Ensure player spawns in the center of startRoom with clear surrounding tiles
  const startX = startRoom.cx;
  const startY = startRoom.cy;
  tiles[startY][startX] = TileType.FLOOR;
  tiles[startY][startX + 1] = TileType.FLOOR;

  // Place exit in exitRoom center
  const exitX = exitRoom.cx;
  const exitY = exitRoom.cy;
  tiles[exitY][exitX] =
    dungeonLevel >= MAX_DUNGEON_LEVEL
      ? TileType.AMULET_PEDESTAL
      : TileType.STAIRS_DOWN;

  // 3. Place Doors at choke points where a corridor enters a room
  const doorCandidates: { x: number; y: number }[] = [];
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      if (tiles[y][x] === TileType.CORRIDOR) {
        const horizWalls =
          isOpaqueTile(tiles[y][x - 1]) && isOpaqueTile(tiles[y][x + 1]);
        const vertWalls =
          isOpaqueTile(tiles[y - 1][x]) && isOpaqueTile(tiles[y + 1][x]);
        const touchesRoomFloor =
          tiles[y - 1][x] === TileType.FLOOR ||
          tiles[y + 1][x] === TileType.FLOOR ||
          tiles[y][x - 1] === TileType.FLOOR ||
          tiles[y][x + 1] === TileType.FLOOR;

        if ((horizWalls || vertWalls) && touchesRoomFloor) {
          doorCandidates.push({ x, y });
        }
      }
    }
  }

  let lockedDoorCount = 0;
  for (const dc of doorCandidates) {
    // Avoid adjacent doors
    const hasAdjacentDoor =
      tiles[dc.y - 1][dc.x] === TileType.DOOR_CLOSED ||
      tiles[dc.y + 1][dc.x] === TileType.DOOR_CLOSED ||
      tiles[dc.y][dc.x - 1] === TileType.DOOR_CLOSED ||
      tiles[dc.y][dc.x + 1] === TileType.DOOR_CLOSED ||
      tiles[dc.y - 1][dc.x] === TileType.DOOR_LOCKED ||
      tiles[dc.y + 1][dc.x] === TileType.DOOR_LOCKED ||
      tiles[dc.y][dc.x - 1] === TileType.DOOR_LOCKED ||
      tiles[dc.y][dc.x + 1] === TileType.DOOR_LOCKED;

    if (!hasAdjacentDoor && rng() < 0.45) {
      if (lockedDoorCount < 2 && rng() < 0.35) {
        tiles[dc.y][dc.x] = TileType.DOOR_LOCKED;
        lockedDoorCount++;
      } else {
        tiles[dc.y][dc.x] = TileType.DOOR_CLOSED;
      }
    }
  }

  // Verify reachability and place keys on the player-reachable side of any locked doors
  const unlockedReachable = getUnlockedReachableSet(tiles, startX, startY);
  const items: WorldItem[] = [];
  const occupied = new Set<string>([`${startX},${startY}`, `${exitX},${exitY}`]);

  // Spawn guaranteed keys in rooms that are unlocked-reachable from startX, startY
  const reachableFloorCoords: { x: number; y: number }[] = [];
  for (const coordStr of unlockedReachable) {
    const [kx, ky] = coordStr.split(',').map(Number);
    if (tiles[ky][kx] === TileType.FLOOR && !occupied.has(coordStr)) {
      reachableFloorCoords.push({ x: kx, y: ky });
    }
  }

  const keysToPlace = Math.max(2, lockedDoorCount + 1);
  for (let i = 0; i < keysToPlace && reachableFloorCoords.length > 0; i++) {
    const idx = randInt(rng, 0, reachableFloorCoords.length - 1);
    const pos = reachableFloorCoords.splice(idx, 1)[0];
    occupied.add(`${pos.x},${pos.y}`);
    items.push({
      id: `key-${dungeonLevel}-${i}`,
      type: ItemType.KEY,
      name: 'Brass Crypt Key',
      x: pos.x,
      y: pos.y,
      value: 1,
      collected: false,
    });
  }

  // Safety guarantee: Ensure exit is 100% reachable with BFS
  if (!isReachableBFS(tiles, startX, startY, exitX, exitY, true)) {
    carveCorridor(startX, startY, exitX, exitY);
  }

  // 4. Populate Rooms with Treasure Chests, Gold, Potions, Gear Upgrades, Traps, and Enemies
  const enemies: Enemy[] = [];

  for (let i = 1; i < rooms.length; i++) {
    const room = rooms[i];
    const getFreeTileInRoom = (): { x: number; y: number } | null => {
      for (let attempt = 0; attempt < 20; attempt++) {
        const tx = randInt(rng, room.x + 1, room.x + room.w - 2);
        const ty = randInt(rng, room.y + 1, room.y + room.h - 2);
        const key = `${tx},${ty}`;
        if (tiles[ty][tx] === TileType.FLOOR && !occupied.has(key)) {
          occupied.add(key);
          return { x: tx, y: ty };
        }
      }
      return null;
    };

    // Place a Treasure Chest in ~55% of rooms
    if (rng() < 0.55) {
      const pos = getFreeTileInRoom();
      if (pos) {
        items.push({
          id: `chest-${dungeonLevel}-${i}`,
          type: ItemType.CHEST_CLOSED,
          name: 'Ironbound Chest',
          x: pos.x,
          y: pos.y,
          value: randInt(rng, 25, 55) * dungeonLevel,
          collected: false,
        });
      }
    }

    // Place Gold Pile in ~65% of rooms
    if (rng() < 0.65) {
      const pos = getFreeTileInRoom();
      if (pos) {
        items.push({
          id: `gold-${dungeonLevel}-${i}`,
          type: ItemType.GOLD,
          name: 'Gold Ducats',
          x: pos.x,
          y: pos.y,
          value: randInt(rng, 10, 30) * dungeonLevel,
          collected: false,
        });
      }
    }

    // Place Healing Potion in ~45% of rooms
    if (rng() < 0.45) {
      const pos = getFreeTileInRoom();
      if (pos) {
        items.push({
          id: `potion-${dungeonLevel}-${i}`,
          type: ItemType.POTION_HEAL,
          name: 'Crimson Elixir',
          x: pos.x,
          y: pos.y,
          value: 12 + dungeonLevel * 2,
          collected: false,
        });
      }
    }

    // Place Scrolls or Equipment Upgrades in select rooms
    if (i === 3 || i === 8) {
      const pos = getFreeTileInRoom();
      if (pos) {
        const isWeapon = i === 3;
        items.push({
          id: `gear-${dungeonLevel}-${i}`,
          type: isWeapon ? ItemType.WEAPON_UPGRADE : ItemType.SHIELD_UPGRADE,
          name: isWeapon
            ? WEAPON_TIERS[Math.min(dungeonLevel, WEAPON_TIERS.length - 1)].name
            : SHIELD_TIERS[Math.min(dungeonLevel, SHIELD_TIERS.length - 1)].name,
          x: pos.x,
          y: pos.y,
          value: isWeapon ? 2 + dungeonLevel : 1 + Math.floor(dungeonLevel / 2),
          collected: false,
        });
      }
    } else if (i === 5 || i === 10) {
      const pos = getFreeTileInRoom();
      if (pos) {
        const isMap = i === 5;
        items.push({
          id: `scroll-${dungeonLevel}-${i}`,
          type: isMap ? ItemType.SCROLL_MAP : ItemType.SCROLL_SMITE,
          name: isMap ? 'Scroll of Clairvoyance' : 'Scroll of SID Bolt',
          x: pos.x,
          y: pos.y,
          value: isMap ? 1 : 12 + dungeonLevel * 3,
          collected: false,
        });
      }
    }

    // Place a Spike Trap in ~35% of rooms (never on exit or start)
    if (rng() < 0.35) {
      const pos = getFreeTileInRoom();
      if (pos) {
        tiles[pos.y][pos.x] = TileType.TRAP_SPIKE;
      }
    }

    // Spawn 1 to 2 Monsters per room (scaling with dungeonLevel)
    const enemyCount = i % 3 === 0 && dungeonLevel >= 2 ? 2 : 1;
    for (let eIdx = 0; eIdx < enemyCount; eIdx++) {
      const pos = getFreeTileInRoom();
      if (!pos) continue;

      const archetypes = [
        EnemyType.SKELETON,
        EnemyType.SLIME,
        EnemyType.CULTIST,
        EnemyType.GARGOYLE,
      ];
      const eType = archetypes[(i + eIdx + dungeonLevel) % archetypes.length];
      enemies.push(createEnemy(eType, pos.x, pos.y, dungeonLevel, `${dungeonLevel}-${i}-${eIdx}`));
    }
  }

  // Also place one friendly healing potion & gold pile right inside the starting room so player can test E/pickup immediately
  const startGoldPos = { x: startRoom.x + 1, y: startRoom.y + 1 };
  if (!occupied.has(`${startGoldPos.x},${startGoldPos.y}`)) {
    tiles[startGoldPos.y][startGoldPos.x] = TileType.FLOOR;
    occupied.add(`${startGoldPos.x},${startGoldPos.y}`);
    items.push({
      id: `gold-start-${dungeonLevel}`,
      type: ItemType.GOLD,
      name: 'Gold Ducats',
      x: startGoldPos.x,
      y: startGoldPos.y,
      value: 20,
      collected: false,
    });
  }

  const player: PlayerState = existingPlayer
    ? {
        ...existingPlayer,
        x: startX,
        y: startY,
        visualX: startX,
        visualY: startY,
        hitFlashTimer: 0,
        scaleX: 1,
        scaleY: 1,
      }
    : createInitialPlayer(startX, startY);

  const initialLogs: LogEntry[] = [
    {
      id: 1,
      text: `ENTERED DUNGEON LEVEL ${dungeonLevel} OF ${MAX_DUNGEON_LEVEL}.`,
      color: C64.YELLOW,
      turn: 0,
    },
    {
      id: 2,
      text:
        dungeonLevel === MAX_DUNGEON_LEVEL
          ? 'CLAIM THE AMULET OF APSHAI IN THE DEEPEST CHAMBER!'
          : `EXPLORE ${rooms.length} CHAMBERS AND FIND THE STAIRS DOWN.`,
      color: C64.CYAN,
      turn: 0,
    },
  ];

  const state: DungeonState = {
    width,
    height,
    dungeonLevel,
    maxDungeonLevel: MAX_DUNGEON_LEVEL,
    seed,
    tiles,
    explored,
    visible,
    rooms,
    player,
    enemies,
    items,
    logs: initialLogs,
    turns: 0,
    enemiesSlain: 0,
    phase: 'playing',
    inventoryOpen: false,
    runSummary: null,
  };

  computeFOV(state);
  return state;
}

export function createEnemy(
  type: EnemyType,
  x: number,
  y: number,
  dungeonLevel: number,
  idSuffix: string
): Enemy {
  const scale = 1 + (dungeonLevel - 1) * 0.28;
  switch (type) {
    case EnemyType.SKELETON:
      return {
        id: `enemy-skel-${idSuffix}`,
        type,
        name: 'Crypt Skeleton',
        x,
        y,
        visualX: x,
        visualY: y,
        hp: Math.round(11 * scale),
        maxHp: Math.round(11 * scale),
        attack: Math.round(4 * scale),
        xpValue: 12 * dungeonLevel,
        scoreValue: 50 * dungeonLevel,
        turnCounter: 0,
        isTelegraphing: false,
        hitFlashTimer: 0,
        koTimer: 0,
        scaleX: 1,
        scaleY: 1,
      };
    case EnemyType.SLIME:
      return {
        id: `enemy-slime-${idSuffix}`,
        type,
        name: 'Venom Slime',
        x,
        y,
        visualX: x,
        visualY: y,
        hp: Math.round(14 * scale),
        maxHp: Math.round(14 * scale),
        attack: Math.round(3 * scale),
        xpValue: 10 * dungeonLevel,
        scoreValue: 40 * dungeonLevel,
        turnCounter: 0,
        isTelegraphing: false,
        hitFlashTimer: 0,
        koTimer: 0,
        scaleX: 1,
        scaleY: 1,
      };
    case EnemyType.CULTIST:
      return {
        id: `enemy-cult-${idSuffix}`,
        type,
        name: 'Void Cultist',
        x,
        y,
        visualX: x,
        visualY: y,
        hp: Math.round(9 * scale),
        maxHp: Math.round(9 * scale),
        attack: Math.round(5 * scale),
        xpValue: 16 * dungeonLevel,
        scoreValue: 75 * dungeonLevel,
        turnCounter: 0,
        isTelegraphing: false,
        hitFlashTimer: 0,
        koTimer: 0,
        scaleX: 1,
        scaleY: 1,
      };
    case EnemyType.GARGOYLE:
      return {
        id: `enemy-garg-${idSuffix}`,
        type,
        name: 'Stone Gargoyle',
        x,
        y,
        visualX: x,
        visualY: y,
        hp: Math.round(15 * scale),
        maxHp: Math.round(15 * scale),
        attack: Math.round(5 * scale),
        xpValue: 18 * dungeonLevel,
        scoreValue: 90 * dungeonLevel,
        turnCounter: 0,
        isTelegraphing: false,
        hitFlashTimer: 0,
        koTimer: 0,
        scaleX: 1,
        scaleY: 1,
      };
  }
}

export function addLog(state: DungeonState, text: string, color: string = C64.WHITE): void {
  const nextId = (state.logs[state.logs.length - 1]?.id ?? 0) + 1;
  state.logs.push({
    id: nextId,
    text: text.toUpperCase(),
    color,
    turn: state.turns,
  });
  if (state.logs.length > 30) {
    state.logs.shift();
  }
}

export function addInventoryItem(
  player: PlayerState,
  type: ItemType,
  name: string,
  description: string,
  value: number,
  count = 1
): void {
  const existing = player.inventory.find((i) => i.type === type);
  if (existing) {
    existing.count += count;
  } else {
    player.inventory.push({
      id: `inv-${type}-${Date.now()}`,
      type,
      name,
      description,
      count,
      value,
    });
  }
}

export function awardXpAndScore(
  state: DungeonState,
  xp: number,
  score: number,
  events: ActionFeedbackEvent[]
): void {
  const { player } = state;
  player.xp += xp;
  player.score += score;
  while (player.xp >= player.nextXp) {
    player.xp -= player.nextXp;
    player.level += 1;
    player.nextXp = Math.round(player.nextXp * 1.45);
    player.maxHp += 6;
    player.hp = player.maxHp;
    player.attack += 2;
    player.defense += 1;
    addLog(
      state,
      `LEVEL UP! RANK ${player.level}: +6 MAX HP, +2 ATK, +1 DEF!`,
      C64.LIGHT_GREEN
    );
    events.push({
      kind: 'level_up',
      x: player.x,
      y: player.y,
      text: 'LEVEL UP!',
      color: C64.LIGHT_GREEN,
      heavy: true,
    });
  }
}

/**
 * Handles player movement in a cardinal direction.
 * Supports bump-attacking adjacent monsters and auto-collecting floor gold.
 */
export function movePlayer(
  state: DungeonState,
  dir: Direction,
  bestScore = 0
): ActionFeedbackEvent[] {
  const events: ActionFeedbackEvent[] = [];
  if (state.phase !== 'playing') return events;

  const { player, tiles } = state;
  player.facing = dir;

  const delta: Record<Direction, [number, number]> = {
    UP: [0, -1],
    DOWN: [0, 1],
    LEFT: [-1, 0],
    RIGHT: [1, 0],
  };

  const [dx, dy] = delta[dir];
  const nx = player.x + dx;
  const ny = player.y + dy;

  if (nx < 0 || ny < 0 || nx >= state.width || ny >= state.height) {
    events.push({ kind: 'bump_wall', x: player.x, y: player.y });
    return events;
  }

  // Check if an alive enemy occupies the target tile -> bump-attack!
  const targetEnemy = state.enemies.find(
    (e) => e.hp > 0 && e.x === nx && e.y === ny
  );
  if (targetEnemy) {
    return attackEnemy(state, targetEnemy, bestScore);
  }

  const targetTile = tiles[ny][nx];

  // Check closed or locked doors
  if (targetTile === TileType.DOOR_CLOSED) {
    tiles[ny][nx] = TileType.DOOR_OPEN;
    state.turns += 1;
    addLog(state, 'OPENED HEAVY OAK DOOR.', C64.LIGHT_GREY);
    events.push({
      kind: 'open_door',
      x: nx,
      y: ny,
      text: 'OPEN',
      color: C64.WHITE,
    });
    computeFOV(state);
    runEnemyTurns(state, events, bestScore);
    return events;
  }

  if (targetTile === TileType.DOOR_LOCKED) {
    if (player.keys > 0) {
      player.keys -= 1;
      player.score += 25;
      tiles[ny][nx] = TileType.DOOR_OPEN;
      state.turns += 1;
      addLog(state, 'UNLOCKED IRON GRATE WITH BRASS KEY!', C64.YELLOW);
      events.push({
        kind: 'unlock_door',
        x: nx,
        y: ny,
        text: 'UNLOCKED!',
        color: C64.YELLOW,
      });
      computeFOV(state);
      runEnemyTurns(state, events, bestScore);
    } else {
      addLog(state, 'LOCKED! YOU NEED A BRASS CRYPT KEY.', C64.LIGHT_RED);
      events.push({
        kind: 'locked_door',
        x: nx,
        y: ny,
        text: 'LOCKED',
        color: C64.LIGHT_RED,
      });
    }
    return events;
  }

  if (!isWalkableTile(targetTile)) {
    events.push({ kind: 'bump_wall', x: nx, y: ny });
    return events;
  }

  // Valid step!
  player.x = nx;
  player.y = ny;
  player.scaleX = 0.88;
  player.scaleY = 1.14;
  state.turns += 1;
  events.push({ kind: 'move', x: nx, y: ny });

  // Check spike trap
  if (targetTile === TileType.TRAP_SPIKE) {
    tiles[ny][nx] = TileType.TRAP_TRIGGERED;
    const trapDmg = Math.max(2, 3 + state.dungeonLevel - Math.floor(player.defense / 2));
    player.hp = Math.max(0, player.hp - trapDmg);
    player.hitFlashTimer = 0.08;
    addLog(state, `FLOOR SPIKES SPRING! TOOK ${trapDmg} DAMAGE!`, C64.LIGHT_RED);
    events.push({
      kind: 'trap_hit',
      x: nx,
      y: ny,
      amount: trapDmg,
      text: `-${trapDmg} TRAP`,
      color: C64.LIGHT_RED,
      heavy: true,
    });
    if (checkPlayerDefeat(state, 'IMPALED BY ANCIENT FLOOR SPIKES', bestScore, events)) {
      return events;
    }
  }

  // Auto-pickup Gold & Keys when stepping directly onto them (can also use E)
  const floorItem = state.items.find(
    (it) => !it.collected && it.x === nx && it.y === ny
  );
  if (floorItem) {
    if (floorItem.type === ItemType.GOLD) {
      floorItem.collected = true;
      player.gold += floorItem.value;
      player.score += floorItem.value;
      addLog(state, `PICKED UP ${floorItem.value} GOLD DUCATS.`, C64.YELLOW);
      events.push({
        kind: 'pickup_gold',
        x: nx,
        y: ny,
        amount: floorItem.value,
        text: `+${floorItem.value}G`,
        color: C64.YELLOW,
      });
    } else if (floorItem.type === ItemType.KEY) {
      floorItem.collected = true;
      player.keys += 1;
      player.score += 30;
      addLog(state, 'FOUND A BRASS CRYPT KEY!', C64.CYAN);
      events.push({
        kind: 'pickup_key',
        x: nx,
        y: ny,
        text: '+1 KEY',
        color: C64.CYAN,
      });
    } else {
      addLog(
        state,
        `STANDING ON ${floorItem.name}. PRESS [E] TO COLLECT/OPEN.`,
        C64.LIGHT_GREEN
      );
    }
  }

  if (targetTile === TileType.STAIRS_DOWN) {
    addLog(state, 'STONE STAIRS LEAD DOWN. PRESS [E] TO DESCEND.', C64.CYAN);
  } else if (targetTile === TileType.AMULET_PEDESTAL) {
    addLog(
      state,
      'THE AMULET OF APSHAI GLOWS HERE! PRESS [E] TO CLAIM VICTORY!',
      C64.YELLOW
    );
  }

  computeFOV(state);
  runEnemyTurns(state, events, bestScore);
  return events;
}

/**
 * Attacks a specific enemy or finds an adjacent enemy in front of / next to the player (SPACE)
 */
export function playerAttackAction(
  state: DungeonState,
  bestScore = 0
): ActionFeedbackEvent[] {
  if (state.phase !== 'playing') return [];
  const { player } = state;

  const delta: Record<Direction, [number, number]> = {
    UP: [0, -1],
    DOWN: [0, 1],
    LEFT: [-1, 0],
    RIGHT: [1, 0],
  };

  const [fx, fy] = delta[player.facing];
  // 1. Check enemy directly in facing tile
  let target = state.enemies.find(
    (e) => e.hp > 0 && e.x === player.x + fx && e.y === player.y + fy
  );

  // 2. Otherwise check any orthogonally or diagonally adjacent alive enemy (prioritizing telegraphing ones)
  if (!target) {
    const adjacent = state.enemies.filter(
      (e) =>
        e.hp > 0 &&
        Math.abs(e.x - player.x) <= 1 &&
        Math.abs(e.y - player.y) <= 1
    );
    adjacent.sort((a, b) => Number(b.isTelegraphing) - Number(a.isTelegraphing));
    target = adjacent[0];
  }

  if (!target) {
    player.attackAnimTimer = 0.14;
    addLog(state, 'YOU SWING YOUR BLADE AT SHADOWS.', C64.MEDIUM_GREY);
    return [
      {
        kind: 'attack_miss',
        x: player.x + fx,
        y: player.y + fy,
        text: 'SWING',
        color: C64.LIGHT_GREY,
      },
    ];
  }

  return attackEnemy(state, target, bestScore);
}

export function attackEnemy(
  state: DungeonState,
  target: Enemy,
  bestScore = 0
): ActionFeedbackEvent[] {
  const events: ActionFeedbackEvent[] = [];
  const { player } = state;

  // Face the target
  if (target.x > player.x) player.facing = 'RIGHT';
  else if (target.x < player.x) player.facing = 'LEFT';
  else if (target.y > player.y) player.facing = 'DOWN';
  else if (target.y < player.y) player.facing = 'UP';

  player.attackAnimTimer = 0.16;
  player.scaleX = 1.18;
  player.scaleY = 0.85;
  state.turns += 1;

  // Calculate damage (bonus damage if interrupting an enemy telegraph!)
  const isInterrupt = target.isTelegraphing;
  const dmg = player.attack + (isInterrupt ? 3 : 0);
  target.hp = Math.max(0, target.hp - dmg);
  target.hitFlashTimer = 0.08;
  target.scaleX = 1.25;
  target.scaleY = 0.76;

  if (target.hp <= 0) {
    target.koTimer = 0.35;
    target.isTelegraphing = false;
    state.enemiesSlain += 1;
    addLog(
      state,
      `SLAIN ${target.name} FOR ${dmg} DMG! (+${target.scoreValue} PTS)`,
      C64.LIGHT_GREEN
    );
    events.push({
      kind: 'attack_kill',
      x: target.x,
      y: target.y,
      amount: dmg,
      text: `-${dmg} KO!`,
      color: C64.YELLOW,
      heavy: true,
    });
    awardXpAndScore(state, target.xpValue, target.scoreValue, events);
  } else {
    if (isInterrupt) {
      target.isTelegraphing = false;
      addLog(
        state,
        `COUNTER-STRUCK ${target.name} FOR ${dmg} DMG (${target.hp}/${target.maxHp} HP)!`,
        C64.YELLOW
      );
    } else {
      addLog(
        state,
        `HIT ${target.name} FOR ${dmg} DMG (${target.hp}/${target.maxHp} HP).`,
        C64.WHITE
      );
    }
    events.push({
      kind: 'attack_hit',
      x: target.x,
      y: target.y,
      amount: dmg,
      text: isInterrupt ? `-${dmg} CRIT!` : `-${dmg}`,
      color: isInterrupt ? C64.YELLOW : C64.WHITE,
      heavy: isInterrupt,
    });
  }

  runEnemyTurns(state, events, bestScore);
  return events;
}

/**
 * Handles [E] Interact action:
 * - Claim Amulet of Apshai (Victory!)
 * - Descend Stairs to next dungeon level
 * - Collect/Open underfoot or adjacent items/chests
 * - Open/Unlock adjacent doors
 */
export function interactAction(
  state: DungeonState,
  bestScore = 0
): ActionFeedbackEvent[] {
  const events: ActionFeedbackEvent[] = [];
  if (state.phase !== 'playing') return events;

  const { player, tiles } = state;

  // 1. Check Amulet Pedestal underfoot or adjacent
  const coordsToCheck: [number, number][] = [
    [player.x, player.y],
    [player.x, player.y - 1],
    [player.x, player.y + 1],
    [player.x - 1, player.y],
    [player.x + 1, player.y],
  ];

  for (const [cx, cy] of coordsToCheck) {
    if (cx < 0 || cy < 0 || cx >= state.width || cy >= state.height) continue;
    if (tiles[cy][cx] === TileType.AMULET_PEDESTAL) {
      player.score += 1000;
      state.phase = 'gameover';
      const newBest = Math.max(bestScore, player.score);
      state.runSummary = {
        outcome: 'victory',
        cause: 'CLAIMED THE LEGENDARY AMULET OF APSHAI!',
        score: player.score,
        bestScore: newBest,
        dungeonLevel: state.dungeonLevel,
        enemiesSlain: state.enemiesSlain,
        goldCollected: player.gold,
        turnsTaken: state.turns,
      };
      addLog(state, 'VICTORY! YOU RECLAIMED THE AMULET OF APSHAI!', C64.YELLOW);
      events.push({
        kind: 'victory',
        x: cx,
        y: cy,
        text: 'VICTORY!',
        color: C64.YELLOW,
        heavy: true,
      });
      return events;
    }
  }

  // 2. Check Stairs Down underfoot or adjacent
  for (const [cx, cy] of coordsToCheck) {
    if (cx < 0 || cy < 0 || cx >= state.width || cy >= state.height) continue;
    if (tiles[cy][cx] === TileType.STAIRS_DOWN) {
      const nextLevel = state.dungeonLevel + 1;
      player.score += 200 * state.dungeonLevel;
      const nextDungeon = generateDungeon(
        nextLevel,
        state.seed,
        player,
        bestScore
      );
      nextDungeon.turns = state.turns + 1;
      nextDungeon.enemiesSlain = state.enemiesSlain;
      Object.assign(state, nextDungeon);
      addLog(
        state,
        `DESCENDED TO DUNGEON LEVEL ${nextLevel}! (+${200 * (nextLevel - 1)} PTS)`,
        C64.CYAN
      );
      events.push({
        kind: 'descend_stairs',
        x: state.player.x,
        y: state.player.y,
        text: `DEPTH ${nextLevel}`,
        color: C64.CYAN,
        heavy: true,
      });
      return events;
    }
  }

  // 3. Check collectible items or chests underfoot or orthogonally adjacent
  for (const [cx, cy] of coordsToCheck) {
    const item = state.items.find(
      (it) => !it.collected && it.x === cx && it.y === cy
    );
    if (item) {
      collectWorldItem(state, item, events);
      state.turns += 1;
      runEnemyTurns(state, events, bestScore);
      return events;
    }
  }

  // 4. Check closed or locked doors orthogonally adjacent
  for (const [cx, cy] of coordsToCheck.slice(1)) {
    if (cx < 0 || cy < 0 || cx >= state.width || cy >= state.height) continue;
    const t = tiles[cy][cx];
    if (t === TileType.DOOR_CLOSED) {
      tiles[cy][cx] = TileType.DOOR_OPEN;
      state.turns += 1;
      addLog(state, 'OPENED HEAVY OAK DOOR.', C64.LIGHT_GREY);
      events.push({
        kind: 'open_door',
        x: cx,
        y: cy,
        text: 'OPEN',
        color: C64.WHITE,
      });
      computeFOV(state);
      runEnemyTurns(state, events, bestScore);
      return events;
    }
    if (t === TileType.DOOR_LOCKED) {
      if (player.keys > 0) {
        player.keys -= 1;
        player.score += 25;
        tiles[cy][cx] = TileType.DOOR_OPEN;
        state.turns += 1;
        addLog(state, 'UNLOCKED IRON GRATE WITH BRASS KEY!', C64.YELLOW);
        events.push({
          kind: 'unlock_door',
          x: cx,
          y: cy,
          text: 'UNLOCKED!',
          color: C64.YELLOW,
        });
        computeFOV(state);
        runEnemyTurns(state, events, bestScore);
      } else {
        addLog(state, 'LOCKED! REQUIRES A BRASS CRYPT KEY.', C64.LIGHT_RED);
        events.push({
          kind: 'locked_door',
          x: cx,
          y: cy,
          text: 'LOCKED',
          color: C64.LIGHT_RED,
        });
      }
      return events;
    }
  }

  addLog(state, 'NOTHING NEARBY TO INTERACT WITH.', C64.MEDIUM_GREY);
  return events;
}

function collectWorldItem(
  state: DungeonState,
  item: WorldItem,
  events: ActionFeedbackEvent[]
): void {
  const { player } = state;
  switch (item.type) {
    case ItemType.CHEST_CLOSED: {
      item.type = ItemType.CHEST_OPEN;
      item.collected = true;
      player.gold += item.value;
      player.score += item.value + 50;
      // Chests also grant 1 Healing Potion!
      addInventoryItem(
        player,
        ItemType.POTION_HEAL,
        'Crimson Elixir',
        'Restores +14 HP immediately.',
        14,
        1
      );
      addLog(
        state,
        `OPENED CHEST: +${item.value} GOLD & +1 CRIMSON ELIXIR!`,
        C64.YELLOW
      );
      events.push({
        kind: 'open_chest',
        x: item.x,
        y: item.y,
        amount: item.value,
        text: `+${item.value}G & ELIXIR!`,
        color: C64.YELLOW,
        heavy: true,
      });
      break;
    }
    case ItemType.GOLD: {
      item.collected = true;
      player.gold += item.value;
      player.score += item.value;
      addLog(state, `PICKED UP ${item.value} GOLD DUCATS.`, C64.YELLOW);
      events.push({
        kind: 'pickup_gold',
        x: item.x,
        y: item.y,
        amount: item.value,
        text: `+${item.value}G`,
        color: C64.YELLOW,
      });
      break;
    }
    case ItemType.KEY: {
      item.collected = true;
      player.keys += 1;
      player.score += 30;
      addLog(state, 'COLLECTED A BRASS CRYPT KEY!', C64.CYAN);
      events.push({
        kind: 'pickup_key',
        x: item.x,
        y: item.y,
        text: '+1 KEY',
        color: C64.CYAN,
      });
      break;
    }
    case ItemType.POTION_HEAL: {
      item.collected = true;
      player.score += 20;
      addInventoryItem(
        player,
        ItemType.POTION_HEAL,
        item.name,
        `Restores +${item.value} HP immediately.`,
        item.value,
        1
      );
      addLog(state, `STORED ${item.name} IN PACK ([I] TO USE).`, C64.LIGHT_GREEN);
      events.push({
        kind: 'pickup_potion',
        x: item.x,
        y: item.y,
        text: '+ELIXIR',
        color: C64.LIGHT_GREEN,
      });
      break;
    }
    case ItemType.SCROLL_SMITE:
    case ItemType.SCROLL_MAP: {
      item.collected = true;
      player.score += 35;
      addInventoryItem(
        player,
        item.type,
        item.name,
        item.type === ItemType.SCROLL_MAP
          ? 'Reveals the entire dungeon floor.'
          : `Strikes nearby visible foes for ${item.value} DMG.`,
        item.value,
        1
      );
      addLog(state, `ACQUIRED ${item.name}!`, C64.CYAN);
      events.push({
        kind: 'pickup_potion',
        x: item.x,
        y: item.y,
        text: `+${item.name.split(' ')[2] || 'SCROLL'}`,
        color: C64.CYAN,
      });
      break;
    }
    case ItemType.WEAPON_UPGRADE: {
      item.collected = true;
      player.attack += item.value;
      player.weaponName = item.name;
      player.score += 80;
      addLog(
        state,
        `EQUIPPED ${item.name}! ATTACK +${item.value} (NOW ${player.attack}).`,
        C64.YELLOW
      );
      events.push({
        kind: 'pickup_gear',
        x: item.x,
        y: item.y,
        text: `+${item.value} ATK!`,
        color: C64.YELLOW,
        heavy: true,
      });
      break;
    }
    case ItemType.SHIELD_UPGRADE: {
      item.collected = true;
      player.defense += item.value;
      player.shieldName = item.name;
      player.score += 80;
      addLog(
        state,
        `EQUIPPED ${item.name}! DEFENSE +${item.value} (NOW ${player.defense}).`,
        C64.CYAN
      );
      events.push({
        kind: 'pickup_gear',
        x: item.x,
        y: item.y,
        text: `+${item.value} DEF!`,
        color: C64.CYAN,
        heavy: true,
      });
      break;
    }
  }
}

/**
 * Uses an item from the player's inventory by ItemType
 */
export function useInventoryItem(
  state: DungeonState,
  itemType: ItemType,
  bestScore = 0
): ActionFeedbackEvent[] {
  const events: ActionFeedbackEvent[] = [];
  if (state.phase !== 'playing') return events;

  const { player } = state;
  const invItem = player.inventory.find(
    (i) => i.type === itemType && i.count > 0
  );
  if (!invItem) return events;

  if (itemType === ItemType.POTION_HEAL) {
    const heal = Math.min(player.maxHp - player.hp, invItem.value);
    const actualHeal = heal > 0 ? heal : invItem.value;
    player.hp = Math.min(player.maxHp, player.hp + invItem.value);
    invItem.count -= 1;
    addLog(
      state,
      `QUAFFED ${invItem.name}: RESTORED +${actualHeal} HP (${player.hp}/${player.maxHp})!`,
      C64.LIGHT_GREEN
    );
    events.push({
      kind: 'use_potion',
      x: player.x,
      y: player.y,
      amount: actualHeal,
      text: `+${actualHeal} HP`,
      color: C64.LIGHT_GREEN,
    });
  } else if (itemType === ItemType.SCROLL_MAP) {
    invItem.count -= 1;
    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        if (state.tiles[y][x] !== TileType.VOID) {
          state.explored[y][x] = true;
        }
      }
    }
    addLog(
      state,
      'READ SCROLL OF CLAIRVOYANCE: ENTIRE FLOOR REVEALED!',
      C64.CYAN
    );
    events.push({
      kind: 'use_scroll',
      x: player.x,
      y: player.y,
      text: 'MAP REVEALED!',
      color: C64.CYAN,
      heavy: true,
    });
  } else if (itemType === ItemType.SCROLL_SMITE) {
    invItem.count -= 1;
    let hitCount = 0;
    for (const enemy of state.enemies) {
      if (enemy.hp <= 0) continue;
      const dist =
        Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
      if (dist <= 5 && state.visible[enemy.y]?.[enemy.x]) {
        hitCount++;
        const dmg = invItem.value;
        enemy.hp = Math.max(0, enemy.hp - dmg);
        enemy.hitFlashTimer = 0.1;
        if (enemy.hp <= 0) {
          enemy.koTimer = 0.35;
          enemy.isTelegraphing = false;
          state.enemiesSlain += 1;
          awardXpAndScore(state, enemy.xpValue, enemy.scoreValue, events);
          events.push({
            kind: 'attack_kill',
            x: enemy.x,
            y: enemy.y,
            amount: dmg,
            text: `-${dmg} ZAP!`,
            color: C64.CYAN,
            heavy: true,
          });
        } else {
          events.push({
            kind: 'attack_hit',
            x: enemy.x,
            y: enemy.y,
            amount: dmg,
            text: `-${dmg} ZAP!`,
            color: C64.CYAN,
            heavy: true,
          });
        }
      }
    }
    addLog(
      state,
      hitCount > 0
        ? `SID BOLT STRUCK ${hitCount} MONSTER(S) FOR ${invItem.value} DMG!`
        : 'SID BOLT CRACKLED THROUGH THE EMPTY CHAMBER.',
      C64.CYAN
    );
    events.push({
      kind: 'use_scroll',
      x: player.x,
      y: player.y,
      text: 'SID BOLT!',
      color: C64.CYAN,
      heavy: true,
    });
  }

  player.inventory = player.inventory.filter((i) => i.count > 0);
  state.turns += 1;
  runEnemyTurns(state, events, bestScore);
  return events;
}

function checkPlayerDefeat(
  state: DungeonState,
  cause: string,
  bestScore: number,
  events: ActionFeedbackEvent[]
): boolean {
  if (state.player.hp <= 0) {
    state.player.hp = 0;
    state.phase = 'gameover';
    const newBest = Math.max(bestScore, state.player.score);
    state.runSummary = {
      outcome: 'defeat',
      cause,
      score: state.player.score,
      bestScore: newBest,
      dungeonLevel: state.dungeonLevel,
      enemiesSlain: state.enemiesSlain,
      goldCollected: state.player.gold,
      turnsTaken: state.turns,
    };
    addLog(state, `YOU PERISHED: ${cause}!`, C64.LIGHT_RED);
    events.push({
      kind: 'defeat',
      x: state.player.x,
      y: state.player.y,
      text: 'DEFEATED!',
      color: C64.LIGHT_RED,
      heavy: true,
    });
    return true;
  }
  return false;
}

/**
 * Executes AI turns for all living enemies within active/aggro distance.
 * Enforces an attack token cap (max 2 simultaneous attacks per turn) so crowds remain fair and readable.
 * Implements 4 distinct archetype behaviors:
 * - SKELETON: Relentless melee chaser; telegraphs heavy bone cleave when adjacent.
 * - SLIME: Moves on even turns in diagonal/cardinal hops; immediate acid nip when adjacent.
 * - CULTIST: Ranged kiter; retreats if distance <= 2, telegraphs dark bolt from distance 2..4.
 * - GARGOYLE: Fast flanker/charger; aligns with player row/col and charges 2 tiles.
 */
export function runEnemyTurns(
  state: DungeonState,
  events: ActionFeedbackEvent[],
  bestScore = 0
): void {
  const { player, tiles } = state;
  let concurrentAttackers = 0;
  const maxAttackersPerTurn = 2;

  const isOccupied = (tx: number, ty: number, ignoreId: string): boolean => {
    if (player.x === tx && player.y === ty) return true;
    return state.enemies.some(
      (e) => e.hp > 0 && e.id !== ignoreId && e.x === tx && e.y === ty
    );
  };

  const canStep = (tx: number, ty: number, ignoreId: string): boolean => {
    if (tx < 0 || ty < 0 || tx >= state.width || ty >= state.height) return false;
    return isWalkableTile(tiles[ty][tx]) && !isOccupied(tx, ty, ignoreId);
  };

  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) continue;
    enemy.turnCounter += 1;

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const manhattan = Math.abs(dx) + Math.abs(dy);

    // Only active if within 9 tiles of player
    if (manhattan > 9) {
      enemy.isTelegraphing = false;
      continue;
    }

    // 1. Resolve active windup telegraph from previous turn!
    if (enemy.isTelegraphing) {
      enemy.isTelegraphing = false;
      const inRange =
        enemy.type === EnemyType.CULTIST
          ? manhattan <= 5 && state.visible[enemy.y]?.[enemy.x]
          : manhattan <= 1 ||
            (Math.abs(dx) <= 1 && Math.abs(dy) <= 1);

      if (inRange && concurrentAttackers < maxAttackersPerTurn) {
        concurrentAttackers++;
        const rawDmg = enemy.attack + 2;
        const dmg = Math.max(1, rawDmg - player.defense);
        player.hp = Math.max(0, player.hp - dmg);
        player.hitFlashTimer = 0.09;
        enemy.scaleX = 1.22;
        enemy.scaleY = 0.8;
        addLog(
          state,
          `${enemy.name} UNLEASHES TELEGRAPHED STRIKE FOR ${dmg} DMG!`,
          C64.LIGHT_RED
        );
        events.push({
          kind: 'player_hurt',
          x: player.x,
          y: player.y,
          amount: dmg,
          text: `-${dmg} HP`,
          color: C64.LIGHT_RED,
          heavy: true,
        });
        if (
          checkPlayerDefeat(
            state,
            `SLAIN BY ${enemy.name.toUpperCase()}`,
            bestScore,
            events
          )
        ) {
          return;
        }
        continue;
      }
    }

    // 2. Archetype-specific AI decision policy
    if (enemy.type === EnemyType.SKELETON) {
      // Relentless Chaser
      if (manhattan === 1) {
        // Wind up heavy bone cleave if > 10% player HP, or immediate light strike
        enemy.isTelegraphing = true;
        enemy.telegraphTargetX = player.x;
        enemy.telegraphTargetY = player.y;
        addLog(
          state,
          `${enemy.name} RAISES ITS RUNE BLADE TO STRIKE!`,
          C64.ORANGE
        );
        events.push({
          kind: 'enemy_telegraph',
          x: enemy.x,
          y: enemy.y,
          text: '!',
          color: C64.ORANGE,
        });
      } else {
        stepToward(enemy, player.x, player.y, canStep);
      }
    } else if (enemy.type === EnemyType.SLIME) {
      // Erratic Hopper: moves on odd turns, strikes when adjacent
      if (manhattan === 1 && concurrentAttackers < maxAttackersPerTurn) {
        concurrentAttackers++;
        const dmg = Math.max(1, enemy.attack - player.defense);
        player.hp = Math.max(0, player.hp - dmg);
        player.hitFlashTimer = 0.06;
        addLog(state, `${enemy.name} SPLASHES ACID FOR ${dmg} DMG!`, C64.LIGHT_RED);
        events.push({
          kind: 'player_hurt',
          x: player.x,
          y: player.y,
          amount: dmg,
          text: `-${dmg} ACID`,
          color: C64.LIGHT_GREEN,
        });
        if (
          checkPlayerDefeat(state, 'DISSOLVED BY VENOM SLIME', bestScore, events)
        ) {
          return;
        }
      } else if (enemy.turnCounter % 2 === 1) {
        stepToward(enemy, player.x, player.y, canStep);
      }
    } else if (enemy.type === EnemyType.CULTIST) {
      // Ranged Kiter: retreats if player is adjacent, telegraphs dark bolt at range 2..4
      if (manhattan === 1) {
        // Try to step away from player
        const retreatX = enemy.x - Math.sign(dx);
        const retreatY = enemy.y - Math.sign(dy);
        if (canStep(retreatX, enemy.y, enemy.id)) {
          enemy.x = retreatX;
        } else if (canStep(enemy.x, retreatY, enemy.id)) {
          enemy.y = retreatY;
        } else {
          enemy.isTelegraphing = true;
          enemy.telegraphTargetX = player.x;
          enemy.telegraphTargetY = player.y;
        }
      } else if (manhattan >= 2 && manhattan <= 4 && state.visible[enemy.y]?.[enemy.x]) {
        enemy.isTelegraphing = true;
        enemy.telegraphTargetX = player.x;
        enemy.telegraphTargetY = player.y;
        addLog(
          state,
          `${enemy.name} CHANTS A VOID BOLT INCANTATION!`,
          C64.PURPLE
        );
        events.push({
          kind: 'enemy_telegraph',
          x: enemy.x,
          y: enemy.y,
          text: 'HEX!',
          color: C64.PURPLE,
        });
      } else {
        stepToward(enemy, player.x, player.y, canStep);
      }
    } else if (enemy.type === EnemyType.GARGOYLE) {
      // Line-of-Sight Charger / Flanker
      if (manhattan === 1) {
        enemy.isTelegraphing = true;
        enemy.telegraphTargetX = player.x;
        enemy.telegraphTargetY = player.y;
        addLog(state, `${enemy.name} COILS STONE WINGS TO POUNCE!`, C64.ORANGE);
        events.push({
          kind: 'enemy_telegraph',
          x: enemy.x,
          y: enemy.y,
          text: '!',
          color: C64.ORANGE,
        });
      } else {
        // Can swoop up to 2 tiles if aligned with player
        stepToward(enemy, player.x, player.y, canStep);
        if (
          (enemy.x === player.x || enemy.y === player.y) &&
          Math.abs(player.x - enemy.x) + Math.abs(player.y - enemy.y) > 1
        ) {
          stepToward(enemy, player.x, player.y, canStep);
        }
      }
    }
  }
}

function stepToward(
  enemy: Enemy,
  targetX: number,
  targetY: number,
  canStep: (tx: number, ty: number, id: string) => boolean
): void {
  const dx = targetX - enemy.x;
  const dy = targetY - enemy.y;
  const stepX = Math.sign(dx);
  const stepY = Math.sign(dy);

  if (Math.abs(dx) >= Math.abs(dy)) {
    if (stepX !== 0 && canStep(enemy.x + stepX, enemy.y, enemy.id)) {
      enemy.x += stepX;
      return;
    }
    if (stepY !== 0 && canStep(enemy.x, enemy.y + stepY, enemy.id)) {
      enemy.y += stepY;
      return;
    }
  } else {
    if (stepY !== 0 && canStep(enemy.x, enemy.y + stepY, enemy.id)) {
      enemy.y += stepY;
      return;
    }
    if (stepX !== 0 && canStep(enemy.x + stepX, enemy.y, enemy.id)) {
      enemy.x += stepX;
      return;
    }
  }
}
