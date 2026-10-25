import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateDungeon,
  isReachableBFS,
  movePlayer,
  playerAttackAction,
  interactAction,
  useInventoryItem,
  MAX_DUNGEON_LEVEL,
} from './rules';
import { EnemyType, ItemType, TileType } from './types';

test('procedural dungeon generates >= 10 interconnected rooms and reachable exit across multiple seeds', () => {
  for (let seed = 100; seed < 110; seed++) {
    const state = generateDungeon(1, seed);
    assert.ok(
      state.rooms.length >= 10,
      `Expected at least 10 rooms, got ${state.rooms.length}`
    );

    const exitRoom = state.rooms.find((r) => r.isExit);
    assert.ok(exitRoom, 'Exit room must exist');
    assert.equal(
      state.tiles[exitRoom.cy][exitRoom.cx],
      TileType.STAIRS_DOWN,
      'Exit room center must have STAIRS_DOWN on level 1'
    );

    const reachable = isReachableBFS(
      state.tiles,
      state.player.x,
      state.player.y,
      exitRoom.cx,
      exitRoom.cy,
      true
    );
    assert.equal(
      reachable,
      true,
      `Exit must be reachable from player spawn on seed ${seed}`
    );
  }
});

test('player movement respects walls and locked doors when out of keys, and unlocks with key', () => {
  const state = generateDungeon(1, 42);
  const px = state.player.x;
  const py = state.player.y;

  // Clear any enemies adjacent to player for clean movement test
  state.enemies = [];

  // Place a solid wall to the LEFT of player
  state.tiles[py][px - 1] = TileType.WALL;
  movePlayer(state, 'LEFT');
  assert.equal(state.player.x, px, 'Player should not walk into a stone wall');

  // Place a locked door to the RIGHT of player and set keys = 0
  state.tiles[py][px + 1] = TileType.DOOR_LOCKED;
  state.player.keys = 0;
  movePlayer(state, 'RIGHT');
  assert.equal(
    state.tiles[py][px + 1],
    TileType.DOOR_LOCKED,
    'Locked door remains locked when player has 0 keys'
  );
  assert.equal(state.player.x, px, 'Player cannot pass locked door without key');

  // Give player 1 key and move RIGHT to unlock
  state.player.keys = 1;
  movePlayer(state, 'RIGHT');
  assert.equal(
    state.tiles[py][px + 1],
    TileType.DOOR_OPEN,
    'Locked door opens when player has a key'
  );
  assert.equal(state.player.keys, 0, 'Key is consumed upon unlocking door');
});

test('combat with SPACE damages adjacent enemy, awards score/XP on kill, and triggers enemy AI', () => {
  const state = generateDungeon(1, 777);
  const px = state.player.x;
  const py = state.player.y;
  state.tiles[py][px + 1] = TileType.FLOOR;

  state.enemies = [
    {
      id: 'test-skel',
      type: EnemyType.SKELETON,
      name: 'Crypt Skeleton',
      x: px + 1,
      y: py,
      visualX: px + 1,
      visualY: py,
      hp: 10,
      maxHp: 10,
      attack: 4,
      xpValue: 20,
      scoreValue: 50,
      turnCounter: 0,
      isTelegraphing: false,
      hitFlashTimer: 0,
      koTimer: 0,
      scaleX: 1,
      scaleY: 1,
    },
  ];

  state.player.facing = 'RIGHT';
  state.player.attack = 6;
  const initialScore = state.player.score;

  // First strike (6 dmg -> 4 HP left; Skeleton telegraphs heavy strike on its turn)
  playerAttackAction(state);
  assert.equal(state.enemies[0].hp, 4);
  assert.equal(
    state.enemies[0].isTelegraphing,
    true,
    'Adjacent skeleton should telegraph its strike'
  );

  // Second strike interrupts telegraph and defeats skeleton
  playerAttackAction(state);
  assert.equal(state.enemies[0].hp, 0);
  assert.equal(state.enemiesSlain, 1);
  assert.ok(
    state.player.score >= initialScore + 50,
    'Score should increase on enemy kill'
  );
});

test('distinct enemy types execute different behaviors (Cultist kites, Slime hops every 2nd turn)', () => {
  const state = generateDungeon(1, 999);
  const px = state.player.x;
  const py = state.player.y;

  // Clear area around player
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      state.tiles[py + dy][px + dx] = TileType.FLOOR;
    }
  }

  const cultist = {
    id: 'test-cultist',
    type: EnemyType.CULTIST,
    name: 'Void Cultist',
    x: px + 1,
    y: py,
    visualX: px + 1,
    visualY: py,
    hp: 12,
    maxHp: 12,
    attack: 5,
    xpValue: 15,
    scoreValue: 75,
    turnCounter: 0,
    isTelegraphing: false,
    hitFlashTimer: 0,
    koTimer: 0,
    scaleX: 1,
    scaleY: 1,
  };

  const slime = {
    id: 'test-slime',
    type: EnemyType.SLIME,
    name: 'Venom Slime',
    x: px - 3,
    y: py,
    visualX: px - 3,
    visualY: py,
    hp: 12,
    maxHp: 12,
    attack: 3,
    xpValue: 10,
    scoreValue: 40,
    turnCounter: 0,
    isTelegraphing: false,
    hitFlashTimer: 0,
    koTimer: 0,
    scaleX: 1,
    scaleY: 1,
  };

  state.enemies = [cultist, slime];

  // Trigger a turn by swinging at empty air UP
  state.player.facing = 'UP';
  playerAttackAction(state);

  // Cultist was at distance 1 (px+1), so it should retreat to px+2!
  assert.equal(
    cultist.x,
    px + 2,
    'Cultist kiter should retreat when adjacent to player'
  );
  // Slime on turnCounter 1 should step closer from px-3 to px-2
  assert.equal(slime.x, px - 2, 'Slime should move on odd turnCounter');

  // Next turn: Slime turnCounter is 2 (even), so it stays at px-2
  playerAttackAction(state);
  assert.equal(slime.x, px - 2, 'Slime should pause on even turnCounter');
});

test('inventory healing potion restores HP and E interacts with chests and stairs', () => {
  const state = generateDungeon(1, 1234);
  state.enemies = [];
  state.player.hp = 10;
  state.player.maxHp = 28;

  useInventoryItem(state, ItemType.POTION_HEAL);
  assert.equal(state.player.hp, 24, 'Crimson Elixir should restore +14 HP');

  // Place a closed chest at player position and press E (interactAction)
  state.items.push({
    id: 'test-chest',
    type: ItemType.CHEST_CLOSED,
    name: 'Ironbound Chest',
    x: state.player.x,
    y: state.player.y,
    value: 50,
    collected: false,
  });
  const goldBefore = state.player.gold;
  interactAction(state);
  assert.equal(state.player.gold, goldBefore + 50, 'Opening chest grants gold');

  // Place STAIRS_DOWN at player position and interact to descend to Level 2
  state.tiles[state.player.y][state.player.x] = TileType.STAIRS_DOWN;
  interactAction(state);
  assert.equal(
    state.dungeonLevel,
    2,
    'Interacting with STAIRS_DOWN advances dungeon to Level 2'
  );

  // Claim Amulet on MAX_DUNGEON_LEVEL triggers victory
  state.dungeonLevel = MAX_DUNGEON_LEVEL;
  state.tiles[state.player.y][state.player.x] = TileType.AMULET_PEDESTAL;
  interactAction(state);
  assert.equal(state.phase, 'gameover');
  assert.equal(state.runSummary?.outcome, 'victory');
});
