import { C64, CHAR_TO_C64 } from './c64Palette';
import {
  ActionFeedbackEvent,
  DungeonState,
  EnemyType,
  ItemType,
  TileType,
} from './types';

export const SPRITE_SIZE = 16;

/**
 * 16x16 authentic Commodore 64 pixel-art bitmaps using C64 color characters
 */
const SPRITE_BITMAPS: Record<string, string[]> = {
  HERO: [
    '.....EEEEEE.....',
    '....EEEEEEEE....',
    '....E11EE11E....',
    '....E10EE01E....',
    '....EEEEEEEE....',
    '..7..DDDDDD..1..',
    '.777.667766.111.',
    '.737.667766..1..',
    '.777.666666..1..',
    '..7..997799..8..',
    '.....666666.....',
    '.....66..66.....',
    '....999..999....',
    '....99....99....',
    '................',
    '................',
  ],
  SKELETON: [
    '.....111111.....',
    '....11111111....',
    '....10011001....',
    '....10011001....',
    '.....110011.....',
    '.....101101..F..',
    '....11111111.F..',
    '...11.1111.11F..',
    '...1..1001..18..',
    '......1111......',
    '.....11..11.....',
    '.....1....1.....',
    '....11....11....',
    '....F......F....',
    '................',
    '................',
  ],
  SLIME: [
    '................',
    '................',
    '......DDDD......',
    '....DDDDDDDD....',
    '...DDD11DD11D...',
    '..DDDD10DD10DD..',
    '..DDDDDDDDDDDD..',
    '.DDDD55DDDD55DD.',
    '.DDDDDDDDDDDDDD.',
    '.555DDDDDDDD555.',
    '.55555555555555.',
    '..555555555555..',
    '................',
    '................',
    '................',
    '................',
  ],
  CULTIST: [
    '......4444......',
    '.....444444.....',
    '....44000044....',
    '....40700704....',
    '....44000044....',
    '.....444444..3..',
    '....44477444333.',
    '...444477444.3..',
    '...44.4444.448..',
    '......4774...8..',
    '.....444444..8..',
    '.....444444.....',
    '....444..444....',
    '....22....22....',
    '................',
    '................',
  ],
  GARGOYLE: [
    '.CC..........CC.',
    'CFFC..CCCC..CFFC',
    'CFFCCCFFFFCCCFFC',
    '.CFFFFA00AFFFFC.',
    '..CFFFA00AFFFC..',
    '..CCFFFFFFFFCC..',
    '...C..FFFF..C...',
    '.....FFFFFF.....',
    '....CCFFFFCC....',
    '....C.FFFF.C....',
    '.....CC..CC.....',
    '.....C....C.....',
    '....77....77....',
    '................',
    '................',
    '................',
  ],
  CHEST_CLOSED: [
    '................',
    '................',
    '..777777777777..',
    '.78888888888887.',
    '.78999999999987.',
    '.78999977999987.',
    '.77777711777777.',
    '.78999977999987.',
    '.78999999999987.',
    '.78888888888887.',
    '.77777777777777.',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  CHEST_OPEN: [
    '................',
    '..777777777777..',
    '.78999999999987.',
    '.77777777777777.',
    '.70007711770007.',
    '.70777777777707.',
    '.77777777777777.',
    '.78999977999987.',
    '.78999999999987.',
    '.78888888888887.',
    '.77777777777777.',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  POTION_HEAL: [
    '................',
    '......1111......',
    '.......88.......',
    '......1AA1......',
    '.....1AAAA1.....',
    '....1AA11AA1....',
    '...1AA1AA22A1...',
    '...1AAAAAAAA1...',
    '...1AA22222A1...',
    '....12222221....',
    '.....111111.....',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  GOLD: [
    '................',
    '................',
    '.......77.......',
    '......7117......',
    '.....777777.....',
    '....77887717....',
    '...7177777777...',
    '..777788871777..',
    '..788777777887..',
    '..777777777777..',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  KEY: [
    '................',
    '................',
    '....7777........',
    '...771177.......',
    '...71..17.......',
    '...77..77.......',
    '....7777777777..',
    '............77..',
    '..........77.7..',
    '..........7..7..',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  WEAPON_UPGRADE: [
    '.............11.',
    '............131.',
    '...........131..',
    '..........131...',
    '.........131....',
    '........131.....',
    '....7..131......',
    '....77131.......',
    '.....777........',
    '....8877........',
    '...88..7........',
    '..78............',
    '................',
    '................',
    '................',
    '................',
  ],
  SHIELD_UPGRADE: [
    '................',
    '...3333333333...',
    '..311111111113..',
    '..316667766613..',
    '..316667766613..',
    '..317771177713..',
    '..316667766613..',
    '...3166776613...',
    '....31677613....',
    '.....317713.....',
    '......3333......',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  SCROLL: [
    '................',
    '....887777788...',
    '....711111117...',
    '.....1441441....',
    '.....1111111....',
    '.....1333331....',
    '.....1111111....',
    '.....1444441....',
    '....711111117...',
    '....887777788...',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  AMULET: [
    '.....77..77.....',
    '....7..77..7....',
    '....7......7....',
    '.....7....7.....',
    '......7777......',
    '....77133177....',
    '...7133113317...',
    '...7331111337...',
    '...7133113317...',
    '....77133177....',
    '......7777......',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
};

class SpriteCache {
  private cache = new Map<string, HTMLCanvasElement>();

  public getSprite(name: string): HTMLCanvasElement | null {
    if (typeof document === 'undefined') return null;
    if (this.cache.has(name)) return this.cache.get(name)!;

    const matrix = SPRITE_BITMAPS[name];
    if (!matrix) return null;

    const canvas = document.createElement('canvas');
    canvas.width = SPRITE_SIZE;
    canvas.height = SPRITE_SIZE;
    const ctx = canvas.getContext('2d')!;

    for (let y = 0; y < SPRITE_SIZE; y++) {
      const row = matrix[y] || '';
      for (let x = 0; x < SPRITE_SIZE; x++) {
        const ch = row[x] || '.';
        const color = CHAR_TO_C64[ch];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    this.cache.set(name, canvas);
    return canvas;
  }
}

export const spriteCache = new SpriteCache();

/**
 * Zero-GC Fixed-Capacity Pooled Particle & Combat Text Ring Buffers
 */
interface PooledParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface FloatingCombatText {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  text: string;
  color: string;
}

export class EffectsPool {
  private particles: PooledParticle[] = Array.from({ length: 128 }, () => ({
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: 0.4,
    color: C64.WHITE,
    size: 2,
  }));

  private texts: FloatingCombatText[] = Array.from({ length: 24 }, () => ({
    active: false,
    x: 0,
    y: 0,
    vy: -1.2,
    life: 0,
    maxLife: 0.85,
    text: '',
    color: C64.WHITE,
  }));

  private pHead = 0;
  private tHead = 0;
  public trauma = 0;
  public hitstopTimer = 0;

  public spawnBurst(
    tileX: number,
    tileY: number,
    color: string,
    count: number,
    speed = 3.2
  ): void {
    for (let i = 0; i < count; i++) {
      const p = this.particles[this.pHead];
      this.pHead = (this.pHead + 1) % this.particles.length;
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const spd = speed * (0.4 + Math.random() * 0.8);
      p.active = true;
      p.x = tileX + 0.5;
      p.y = tileY + 0.5;
      p.vx = Math.cos(angle) * spd;
      p.vy = Math.sin(angle) * spd;
      p.life = 0.25 + Math.random() * 0.25;
      p.maxLife = p.life;
      p.color = color;
      p.size = Math.random() > 0.4 ? 2 : 3;
    }
  }

  public spawnText(tileX: number, tileY: number, text: string, color: string): void {
    const t = this.texts[this.tHead];
    this.tHead = (this.tHead + 1) % this.texts.length;
    t.active = true;
    t.x = tileX + 0.5;
    t.y = tileY + 0.1;
    t.vy = -1.35;
    t.life = 0.85;
    t.maxLife = 0.85;
    t.text = text;
    t.color = color;
  }

  public triggerEvents(events: ActionFeedbackEvent[]): void {
    for (const ev of events) {
      if (ev.text) {
        this.spawnText(ev.x, ev.y, ev.text, ev.color || C64.WHITE);
      }
      if (ev.heavy) {
        this.trauma = Math.min(1, this.trauma + 0.48);
        this.hitstopTimer = 0.048;
        this.spawnBurst(ev.x, ev.y, ev.color || C64.YELLOW, 16, 4.2);
      } else if (ev.kind === 'move') {
        this.spawnBurst(ev.x, ev.y, C64.DARK_GREY, 3, 1.4);
      } else if (ev.kind !== 'enemy_telegraph') {
        this.trauma = Math.min(1, this.trauma + 0.16);
        this.spawnBurst(ev.x, ev.y, ev.color || C64.WHITE, 6, 2.5);
      }
    }
  }

  public update(dt: number): void {
    this.trauma = Math.max(0, this.trauma - dt * 2.4);
    this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
    }

    for (let i = 0; i < this.texts.length; i++) {
      const t = this.texts[i];
      if (!t.active) continue;
      t.life -= dt;
      if (t.life <= 0) {
        t.active = false;
        continue;
      }
      t.y += t.vy * dt;
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    tilePx: number
  ): void {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      const sx = Math.round((p.x - camX) * tilePx);
      const sy = Math.round((p.y - camY) * tilePx);
      ctx.fillStyle = p.color;
      const s = p.size * Math.max(1, Math.floor(tilePx / 16));
      ctx.fillRect(sx, sy, s, s);
    }

    ctx.font = `bold ${Math.max(10, Math.floor(tilePx * 0.36))}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    for (let i = 0; i < this.texts.length; i++) {
      const t = this.texts[i];
      if (!t.active) continue;
      const sx = Math.round((t.x - camX) * tilePx);
      const sy = Math.round((t.y - camY) * tilePx);
      ctx.fillStyle = C64.BLACK;
      ctx.fillText(t.text, sx + 2, sy + 2);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, sx, sy);
    }
  }
}

/**
 * Renders the C64 dungeon world onto the HTML5 Canvas
 */
export function renderDungeonCanvas(
  ctx: CanvasRenderingContext2D,
  state: DungeonState,
  effects: EffectsPool,
  timeSec: number,
  cameraTargetX: number,
  cameraTargetY: number
): void {
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;
  ctx.imageSmoothingEnabled = false;

  // Clear background with C64 Black
  ctx.fillStyle = C64.BLACK;
  ctx.fillRect(0, 0, cw, ch);

  // Tile size in pixels (32px or 36px for chunky C64 look)
  const tilePx = Math.max(28, Math.min(44, Math.floor(Math.min(cw / 20, ch / 13))));
  const halfCols = cw / tilePx / 2;
  const halfRows = ch / tilePx / 2;

  // Apply decaying trauma^2 camera shake
  const shakeMag = effects.trauma * effects.trauma * 0.42;
  const shakeX = shakeMag * Math.sin(timeSec * 55);
  const shakeY = shakeMag * Math.cos(timeSec * 63);

  const camX = cameraTargetX + 0.5 - halfCols + shakeX;
  const camY = cameraTargetY + 0.5 - halfRows + shakeY;

  const startCol = Math.max(0, Math.floor(camX) - 1);
  const endCol = Math.min(state.width - 1, Math.ceil(camX + halfCols * 2) + 1);
  const startRow = Math.max(0, Math.floor(camY) - 1);
  const endRow = Math.min(state.height - 1, Math.ceil(camY + halfRows * 2) + 1);

  const isTitleTour = state.phase === 'title';
  const torchFlicker = Math.floor(timeSec * 6) % 2 === 0;

  // 1. Draw Tiles
  for (let y = startRow; y <= endRow; y++) {
    for (let x = startCol; x <= endCol; x++) {
      const vis = isTitleTour || state.visible[y][x];
      const exp = isTitleTour || state.explored[y][x];
      if (!exp) continue;

      const tile = state.tiles[y][x];
      if (tile === TileType.VOID) continue;

      const sx = Math.round((x - camX) * tilePx);
      const sy = Math.round((y - camY) * tilePx);
      const p = Math.max(2, Math.floor(tilePx / 8));

      if (
        tile === TileType.WALL ||
        tile === TileType.WALL_MOSS ||
        tile === TileType.WALL_TORCH
      ) {
        // Classic C64 brick wall
        ctx.fillStyle = vis ? C64.BLUE : C64.DARK_GREY;
        ctx.fillRect(sx, sy, tilePx, tilePx);
        ctx.fillStyle = vis ? C64.LIGHT_BLUE : C64.BLACK;
        ctx.fillRect(sx + p, sy + p, tilePx - p * 2, Math.floor(tilePx / 2) - p);
        ctx.fillRect(
          sx + p,
          sy + Math.floor(tilePx / 2) + p,
          Math.floor(tilePx / 2) - p,
          Math.floor(tilePx / 2) - p * 2
        );
        ctx.fillRect(
          sx + Math.floor(tilePx / 2) + p,
          sy + Math.floor(tilePx / 2) + p,
          Math.floor(tilePx / 2) - p * 2,
          Math.floor(tilePx / 2) - p * 2
        );

        if (vis && tile === TileType.WALL_MOSS) {
          ctx.fillStyle = C64.GREEN;
          ctx.fillRect(sx + p * 2, sy + p, p * 2, p * 2);
          ctx.fillRect(sx + p * 3, sy + p * 3, p * 2, p);
        } else if (vis && tile === TileType.WALL_TORCH) {
          ctx.fillStyle = C64.BROWN;
          ctx.fillRect(sx + Math.floor(tilePx / 2) - p / 2, sy + p * 3, p, p * 3);
          ctx.fillStyle = torchFlicker ? C64.YELLOW : C64.ORANGE;
          ctx.fillRect(
            sx + Math.floor(tilePx / 2) - p,
            sy + p,
            p * 2,
            p * 2
          );
        }
      } else {
        // Floor / Corridor base
        ctx.fillStyle = vis ? '#121124' : '#080810';
        ctx.fillRect(sx, sy, tilePx, tilePx);

        // Speckled stone tile dots
        ctx.fillStyle = vis ? C64.DARK_GREY : '#1C1C29';
        ctx.fillRect(sx + p, sy + p, p, p);
        ctx.fillRect(sx + tilePx - p * 2, sy + tilePx - p * 2, p, p);

        if (tile === TileType.DOOR_CLOSED || tile === TileType.DOOR_LOCKED) {
          ctx.fillStyle = tile === TileType.DOOR_LOCKED ? C64.ORANGE : C64.BROWN;
          ctx.fillRect(sx + p, sy + p, tilePx - p * 2, tilePx - p * 2);
          ctx.fillStyle = tile === TileType.DOOR_LOCKED ? C64.YELLOW : C64.LIGHT_GREY;
          ctx.fillRect(
            sx + Math.floor(tilePx / 2) - p,
            sy + Math.floor(tilePx / 2) - p,
            p * 2,
            p * 2
          );
        } else if (tile === TileType.DOOR_OPEN) {
          ctx.fillStyle = C64.BROWN;
          ctx.fillRect(sx, sy, p * 2, tilePx);
          ctx.fillRect(sx + tilePx - p * 2, sy, p * 2, tilePx);
        } else if (tile === TileType.STAIRS_DOWN) {
          ctx.fillStyle = C64.CYAN;
          for (let step = 1; step <= 4; step++) {
            ctx.fillRect(
              sx + step * p,
              sy + step * p * 1.5,
              tilePx - step * p * 2,
              p
            );
          }
        } else if (tile === TileType.AMULET_PEDESTAL) {
          ctx.fillStyle = C64.PURPLE;
          ctx.fillRect(sx + p, sy + p, tilePx - p * 2, tilePx - p * 2);
          const amuletSpr = spriteCache.getSprite('AMULET');
          if (amuletSpr) {
            ctx.drawImage(amuletSpr, sx, sy, tilePx, tilePx);
          }
        } else if (tile === TileType.TRAP_SPIKE && vis) {
          ctx.fillStyle = C64.MEDIUM_GREY;
          ctx.fillRect(sx + p * 2, sy + p * 5, p, p * 2);
          ctx.fillRect(sx + p * 5, sy + p * 5, p, p * 2);
        } else if (tile === TileType.TRAP_TRIGGERED) {
          ctx.fillStyle = C64.LIGHT_RED;
          ctx.fillRect(sx + p * 2, sy + p * 3, p, p * 4);
          ctx.fillRect(sx + p * 4, sy + p * 2, p, p * 5);
          ctx.fillRect(sx + p * 6, sy + p * 3, p, p * 4);
        }
      }
    }
  }

  // 2. Draw World Items
  for (const item of state.items) {
    if (item.collected && item.type !== ItemType.CHEST_OPEN) continue;
    const vis = isTitleTour || state.visible[item.y]?.[item.x];
    if (!vis) continue;

    const sx = Math.round((item.x - camX) * tilePx);
    const sy = Math.round((item.y - camY) * tilePx);

    let sprKey = 'GOLD';
    if (item.type === ItemType.CHEST_CLOSED) sprKey = 'CHEST_CLOSED';
    else if (item.type === ItemType.CHEST_OPEN) sprKey = 'CHEST_OPEN';
    else if (item.type === ItemType.POTION_HEAL) sprKey = 'POTION_HEAL';
    else if (item.type === ItemType.KEY) sprKey = 'KEY';
    else if (item.type === ItemType.WEAPON_UPGRADE) sprKey = 'WEAPON_UPGRADE';
    else if (item.type === ItemType.SHIELD_UPGRADE) sprKey = 'SHIELD_UPGRADE';
    else if (
      item.type === ItemType.SCROLL_MAP ||
      item.type === ItemType.SCROLL_SMITE
    ) {
      sprKey = 'SCROLL';
    }

    const spr = spriteCache.getSprite(sprKey);
    if (spr) {
      const bob =
        item.type === ItemType.CHEST_OPEN
          ? 0
          : Math.round(Math.sin(timeSec * 4 + item.x) * 2);
      ctx.drawImage(spr, sx, sy + bob, tilePx, tilePx);
    }
  }

  // 3. Draw Enemies & Windup Telegraphs
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0 && enemy.koTimer <= 0) continue;
    const vis = isTitleTour || state.visible[enemy.y]?.[enemy.x];
    if (!vis) continue;

    // Draw telegraph target indicator if enemy is winding up an attack!
    if (
      enemy.isTelegraphing &&
      enemy.telegraphTargetX !== undefined &&
      enemy.telegraphTargetY !== undefined
    ) {
      const tx = Math.round((enemy.telegraphTargetX - camX) * tilePx);
      const ty = Math.round((enemy.telegraphTargetY - camY) * tilePx);
      ctx.strokeStyle = torchFlicker ? C64.LIGHT_RED : C64.YELLOW;
      ctx.lineWidth = 3;
      ctx.strokeRect(tx + 3, ty + 3, tilePx - 6, tilePx - 6);
    }

    const sx = Math.round((enemy.visualX - camX) * tilePx);
    const sy = Math.round((enemy.visualY - camY) * tilePx);

    const spr = spriteCache.getSprite(enemy.type);
    if (spr) {
      ctx.save();
      const cx = sx + tilePx / 2;
      const cy = sy + tilePx / 2;
      ctx.translate(cx, cy);
      if (enemy.hp <= 0 && enemy.koTimer > 0) {
        ctx.rotate((1 - enemy.koTimer / 0.35) * 1.4);
        ctx.globalAlpha = Math.max(0, enemy.koTimer / 0.35);
      } else {
        ctx.scale(enemy.scaleX, enemy.scaleY);
      }

      if (enemy.hitFlashTimer > 0) {
        ctx.fillStyle = C64.WHITE;
        ctx.fillRect(-tilePx / 2 + 4, -tilePx / 2 + 4, tilePx - 8, tilePx - 8);
      } else {
        ctx.drawImage(spr, -tilePx / 2, -tilePx / 2, tilePx, tilePx);
      }
      ctx.restore();

      // Draw compact enemy HP bar if damaged or telegraphing
      if (enemy.hp > 0 && (enemy.hp < enemy.maxHp || enemy.isTelegraphing)) {
        const barW = tilePx - 6;
        const barH = 4;
        ctx.fillStyle = C64.BLACK;
        ctx.fillRect(sx + 3, sy - 6, barW, barH);
        ctx.fillStyle = enemy.isTelegraphing ? C64.YELLOW : C64.LIGHT_RED;
        ctx.fillRect(
          sx + 3,
          sy - 6,
          Math.max(2, Math.round((enemy.hp / enemy.maxHp) * barW)),
          barH
        );
      }
    }
  }

  // 4. Draw Player Hero
  if (!isTitleTour) {
    const { player } = state;
    const px = Math.round((player.visualX - camX) * tilePx);
    const py = Math.round((player.visualY - camY) * tilePx);
    const heroSpr = spriteCache.getSprite('HERO');
    if (heroSpr) {
      ctx.save();
      ctx.translate(px + tilePx / 2, py + tilePx / 2);
      ctx.scale(player.scaleX, player.scaleY);
      if (player.hitFlashTimer > 0) {
        ctx.fillStyle = C64.LIGHT_RED;
        ctx.fillRect(-tilePx / 2 + 4, -tilePx / 2 + 4, tilePx - 8, tilePx - 8);
      } else {
        ctx.drawImage(heroSpr, -tilePx / 2, -tilePx / 2, tilePx, tilePx);
      }
      ctx.restore();
    }
  }

  // 5. Render Pooled Particles & Floating Text
  effects.render(ctx, camX, camY, tilePx);
}
