export enum TileType {
  VOID = 0,
  WALL = 1,
  WALL_MOSS = 2,
  WALL_TORCH = 3,
  FLOOR = 4,
  CORRIDOR = 5,
  DOOR_CLOSED = 6,
  DOOR_LOCKED = 7,
  DOOR_OPEN = 8,
  STAIRS_DOWN = 9,
  TRAP_SPIKE = 10,
  TRAP_TRIGGERED = 11,
  AMULET_PEDESTAL = 12,
}

export enum EnemyType {
  SKELETON = 'SKELETON',       // Relentless Chaser, heavy bone cleave telegraph
  SLIME = 'SLIME',             // Erratic Acid Hopper, moves every 2nd turn or splits/surges
  CULTIST = 'CULTIST',         // Ranged Kiter, keeps distance and telegraphs dark bolt
  GARGOYLE = 'GARGOYLE',       // Line-of-sight Charger / fast flanker
}

export enum ItemType {
  POTION_HEAL = 'POTION_HEAL',
  GOLD = 'GOLD',
  KEY = 'KEY',
  CHEST_CLOSED = 'CHEST_CLOSED',
  CHEST_OPEN = 'CHEST_OPEN',
  WEAPON_UPGRADE = 'WEAPON_UPGRADE',
  SHIELD_UPGRADE = 'SHIELD_UPGRADE',
  SCROLL_SMITE = 'SCROLL_SMITE',
  SCROLL_MAP = 'SCROLL_MAP',
  AMULET_OF_APSHAI = 'AMULET_OF_APSHAI',
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Room {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
  isLocked?: boolean;
  isStart?: boolean;
  isExit?: boolean;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  name: string;
  x: number;
  y: number;
  visualX: number;
  visualY: number;
  hp: number;
  maxHp: number;
  attack: number;
  xpValue: number;
  scoreValue: number;
  turnCounter: number;
  isTelegraphing: boolean;
  telegraphTargetX?: number;
  telegraphTargetY?: number;
  hitFlashTimer: number;
  koTimer: number; // > 0 when defeated and playing topple/dissolve animation
  scaleX: number;
  scaleY: number;
}

export interface WorldItem {
  id: string;
  type: ItemType;
  name: string;
  x: number;
  y: number;
  value: number; // gold amount, heal amount, or upgrade bonus
  collected: boolean;
}

export interface InventoryItem {
  id: string;
  type: ItemType;
  name: string;
  description: string;
  count: number;
  value: number;
}

export interface LogEntry {
  id: number;
  text: string;
  color: string;
  turn: number;
}

export interface PlayerState {
  x: number;
  y: number;
  visualX: number;
  visualY: number;
  facing: Direction;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  weaponName: string;
  shieldName: string;
  gold: number;
  keys: number;
  score: number;
  level: number; // Character XP level
  xp: number;
  nextXp: number;
  inventory: InventoryItem[];
  hitFlashTimer: number;
  scaleX: number;
  scaleY: number;
  attackAnimTimer: number;
}

export type GamePhase = 'title' | 'playing' | 'paused' | 'gameover';

export interface RunSummary {
  outcome: 'victory' | 'defeat';
  cause: string;
  score: number;
  bestScore: number;
  dungeonLevel: number;
  enemiesSlain: number;
  goldCollected: number;
  turnsTaken: number;
}

export interface DungeonState {
  width: number;
  height: number;
  dungeonLevel: number;
  maxDungeonLevel: number;
  seed: number;
  tiles: TileType[][];
  explored: boolean[][];
  visible: boolean[][];
  rooms: Room[];
  player: PlayerState;
  enemies: Enemy[];
  items: WorldItem[];
  logs: LogEntry[];
  turns: number;
  enemiesSlain: number;
  phase: GamePhase;
  inventoryOpen: boolean;
  runSummary: RunSummary | null;
}

export interface ActionFeedbackEvent {
  kind:
    | 'move'
    | 'bump_wall'
    | 'locked_door'
    | 'unlock_door'
    | 'open_door'
    | 'attack_hit'
    | 'attack_kill'
    | 'attack_miss'
    | 'player_hurt'
    | 'pickup_gold'
    | 'pickup_key'
    | 'pickup_potion'
    | 'pickup_gear'
    | 'open_chest'
    | 'use_potion'
    | 'use_scroll'
    | 'trap_hit'
    | 'descend_stairs'
    | 'level_up'
    | 'enemy_telegraph'
    | 'victory'
    | 'defeat';
  x: number;
  y: number;
  amount?: number;
  text?: string;
  color?: string;
  heavy?: boolean;
}
