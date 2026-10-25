import React, { useEffect, useRef } from 'react';
import { C64 } from '../game/c64Palette';
import { DungeonState, TileType } from '../game/types';

interface HudOverlayProps {
  state: DungeonState;
  crtEnabled: boolean;
  muted: boolean;
  onToggleCrt: () => void;
  onToggleMute: () => void;
  onToggleInventory: () => void;
  onPause: () => void;
  onQuickHeal: () => void;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  state,
  crtEnabled,
  muted,
  onToggleCrt,
  onToggleMute,
  onToggleInventory,
  onPause,
  onQuickHeal,
}) => {
  const minimapRef = useRef<HTMLCanvasElement | null>(null);
  const { player, logs, dungeonLevel, maxDungeonLevel } = state;

  // Render live navigable geometry onto corner minimap
  useEffect(() => {
    const canvas = minimapRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = 2;
    canvas.width = state.width * scale;
    canvas.height = state.height * scale;

    ctx.fillStyle = C64.BLACK;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        if (!state.explored[y][x]) continue;
        const t = state.tiles[y][x];
        if (t === TileType.VOID) continue;

        if (
          t === TileType.WALL ||
          t === TileType.WALL_MOSS ||
          t === TileType.WALL_TORCH
        ) {
          ctx.fillStyle = C64.BLUE;
        } else if (t === TileType.STAIRS_DOWN || t === TileType.AMULET_PEDESTAL) {
          ctx.fillStyle = C64.CYAN;
        } else if (t === TileType.DOOR_LOCKED) {
          ctx.fillStyle = C64.YELLOW;
        } else {
          ctx.fillStyle = state.visible[y][x] ? C64.DARK_GREY : '#191926';
        }
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }

    // Draw visible enemies on minimap
    for (const enemy of state.enemies) {
      if (enemy.hp <= 0 || !state.visible[enemy.y]?.[enemy.x]) continue;
      ctx.fillStyle = C64.LIGHT_RED;
      ctx.fillRect(enemy.x * scale, enemy.y * scale, scale, scale);
    }

    // Draw player position
    ctx.fillStyle = C64.WHITE;
    ctx.fillRect(player.x * scale - 1, player.y * scale - 1, scale + 2, scale + 2);
  }, [state, player.x, player.y, state.turns]);

  // Calculate 7 discrete vitality heart sockets (Full, Cracked, Empty)
  const totalSockets = 7;
  const hpRatio = Math.max(0, Math.min(1, player.hp / player.maxHp));
  const exactSockets = hpRatio * totalSockets;
  const isCriticalHp = hpRatio <= 0.28;

  const potionCount =
    player.inventory.find((i) => i.type === 'POTION_HEAL')?.count ?? 0;
  const totalPackItems = player.inventory.reduce((acc, i) => acc + i.count, 0);
  const recentLogs = logs.slice(-3);

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-4">
      {/* Subtle critical low-HP peripheral screen vignette */}
      {isCriticalHp && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 65px rgba(196, 108, 113, 0.45)',
          }}
        />
      )}

      {/* TOP PERIMETER ROW: Top-Left Vitality/Stats Cluster + Top-Right Utility Buttons */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left Cluster: Vitality Sockets + Primary Tabular Readouts */}
        <div className="c64-box px-3 py-2 flex flex-col gap-1.5 pointer-events-auto">
          {/* Row 1: Discrete Vitality Pips + Integer HP */}
          <div className="flex items-center gap-3">
            <span
              className="font-c64-display text-[10px]"
              style={{ color: C64.LIGHT_RED }}
            >
              HP
            </span>
            <div className="flex items-center gap-1" aria-label="Health sockets">
              {Array.from({ length: totalSockets }).map((_, idx) => {
                const stateType =
                  idx + 0.75 <= exactSockets
                    ? 'full'
                    : idx + 0.15 <= exactSockets
                    ? 'cracked'
                    : 'empty';
                return (
                  <svg
                    key={idx}
                    viewBox="0 0 16 16"
                    className="w-4 h-4 shrink-0"
                  >
                    {/* Dark outer silhouette */}
                    <path
                      d="M2 4h4v2h4V4h4v5l-6 5-6-5V4z"
                      fill={C64.BLACK}
                      stroke={C64.MEDIUM_GREY}
                      strokeWidth="1"
                    />
                    {stateType === 'full' && (
                      <>
                        <path
                          d="M3 5h3v2h4V5h3v4l-5 4-5-4V5z"
                          fill={C64.LIGHT_RED}
                        />
                        <rect x="4" y="5" width="2" height="2" fill={C64.WHITE} />
                      </>
                    )}
                    {stateType === 'cracked' && (
                      <path
                        d="M3 5h3v2l-1 2 2 2-2 2-2-2V5z"
                        fill={C64.YELLOW}
                      />
                    )}
                  </svg>
                );
              })}
            </div>
            <span
              className="font-c64-mono text-sm font-bold tabular-nums"
              style={{ color: isCriticalHp ? C64.LIGHT_RED : C64.WHITE }}
              data-testid="hud-hp"
            >
              {Math.round(player.hp)}/{Math.round(player.maxHp)}
            </span>

            {potionCount > 0 && player.hp < player.maxHp && (
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onQuickHeal();
                }}
                className="font-c64-body text-[11px] px-1.5 py-0.5 cursor-pointer whitespace-nowrap shrink-0"
                style={{
                  backgroundColor: C64.RED,
                  color: C64.WHITE,
                  border: `1px solid ${C64.LIGHT_RED}`,
                }}
                aria-label="Drink Crimson Elixir"
              >
                +HEAL [{potionCount}]
              </button>
            )}
          </div>

          {/* Row 2: Tabular Counters (Score, Gold, Keys, Depth, Rank) */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <div className="flex items-center gap-1.5">
              <span
                className="text-[10px] font-c64-display"
                style={{ color: C64.LIGHT_BLUE }}
              >
                SCR
              </span>
              <span
                className="font-c64-mono font-bold text-sm tabular-nums"
                style={{ color: C64.YELLOW }}
                data-testid="hud-score"
              >
                {Math.round(player.score)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Gold Coin SVG matching in-world gold sprite */}
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0">
                <rect x="3" y="3" width="10" height="10" fill={C64.YELLOW} />
                <rect x="5" y="5" width="4" height="4" fill={C64.WHITE} />
              </svg>
              <span
                className="text-[10px] font-c64-display"
                style={{ color: C64.ORANGE }}
              >
                GLD
              </span>
              <span
                className="font-c64-mono font-bold text-sm tabular-nums"
                style={{ color: C64.WHITE }}
                data-testid="hud-gold"
              >
                {Math.round(player.gold)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Key SVG matching in-world key sprite */}
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0">
                <rect x="2" y="5" width="5" height="5" fill={C64.CYAN} />
                <rect x="7" y="7" width="7" height="2" fill={C64.CYAN} />
                <rect x="11" y="9" width="2" height="3" fill={C64.CYAN} />
              </svg>
              <span
                className="text-[10px] font-c64-display"
                style={{ color: C64.CYAN }}
              >
                KEY
              </span>
              <span
                className="font-c64-mono font-bold text-sm tabular-nums"
                style={{ color: C64.WHITE }}
                data-testid="hud-keys"
              >
                {Math.round(player.keys)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className="text-[10px] font-c64-display"
                style={{ color: C64.LIGHT_GREEN }}
              >
                FLR
              </span>
              <span
                className="font-c64-mono font-bold text-sm tabular-nums"
                style={{ color: C64.LIGHT_GREEN }}
                data-testid="hud-level"
              >
                {dungeonLevel}/{maxDungeonLevel}
              </span>
            </div>

            <div
              className="hidden sm:flex items-center gap-1.5 text-[11px]"
              style={{ color: C64.LIGHT_GREY }}
            >
              <span>ATK:{Math.round(player.attack)}</span>
              <span>·</span>
              <span>DEF:{Math.round(player.defense)}</span>
              <span>·</span>
              <span>LV:{Math.round(player.level)}</span>
            </div>
          </div>
        </div>

        {/* Top-Right Cluster: Compact Clickable Square Utility Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Toggle Inventory [I]"
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleInventory();
            }}
            className="c64-box h-10 px-2.5 flex items-center gap-1.5 cursor-pointer hover:brightness-125 whitespace-nowrap shrink-0"
            style={{
              borderColor: state.inventoryOpen ? C64.YELLOW : C64.LIGHT_BLUE,
              color: state.inventoryOpen ? C64.YELLOW : C64.WHITE,
            }}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M7 4h10v3h3v13H4V7h3V4zm2 3h6V6H9v1zm-3 3v8h12v-8H6z" />
            </svg>
            <span className="font-c64-display text-[10px]">
              PACK [{totalPackItems}]
            </span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Toggle CRT Scanlines [C]"
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleCrt();
            }}
            className="c64-box w-10 h-10 flex items-center justify-center cursor-pointer hover:brightness-125 shrink-0"
            style={{
              borderColor: crtEnabled ? C64.LIGHT_GREEN : C64.MEDIUM_GREY,
              color: crtEnabled ? C64.LIGHT_GREEN : C64.LIGHT_GREY,
            }}
            title="Toggle CRT Monitor Effect [C]"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M3 4h18v13H3V4zm2 2v9h14V6H5zm3 13h8v2H8v-2z" />
            </svg>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label={muted ? 'Unmute Audio [M]' : 'Mute Audio [M]'}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            className="c64-box w-10 h-10 flex items-center justify-center cursor-pointer hover:brightness-125 shrink-0"
            style={{
              borderColor: muted ? C64.LIGHT_RED : C64.CYAN,
              color: muted ? C64.LIGHT_RED : C64.CYAN,
            }}
            title="Mute / Unmute SID Audio [M]"
          >
            {muted ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M3 9h4l5-5v16l-5-5H3V9zm13.5 3l2.5 2.5-1.5 1.5L15 13.5 12.5 16 11 14.5 13.5 12 11 9.5 12.5 8 15 10.5 17.5 8 19 9.5 16.5 12z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M3 9h4l5-5v16l-5-5H3V9zm11-2h2v10h-2V7zm4-3h2v16h-2V4z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Pause Game [ESC]"
            onClick={(e) => {
              e.currentTarget.blur();
              onPause();
            }}
            className="c64-box w-10 h-10 flex items-center justify-center cursor-pointer hover:brightness-125 shrink-0"
            style={{
              borderColor: C64.YELLOW,
              color: C64.YELLOW,
            }}
            title="Pause Game [ESC]"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* BOTTOM PERIMETER ROW: Concise Event Log & Control Strip + Corner Minimap */}
      <div className="flex items-end justify-between gap-4">
        {/* Bottom-Left Event Log + Flat Control Reference */}
        <div className="c64-box px-3 py-2 max-w-xl w-full flex flex-col gap-1">
          <div
            className="flex flex-col gap-0.5 text-xs font-c64-body leading-snug"
            aria-live="polite"
            data-testid="event-log"
          >
            {recentLogs.map((entry, idx) => (
              <div
                key={entry.id}
                className="truncate"
                style={{
                  color: entry.color,
                  opacity: idx === recentLogs.length - 1 ? 1 : 0.72,
                }}
              >
                &gt; {entry.text}
              </div>
            ))}
          </div>

          <div
            className="pt-1 border-t border-[#2E2C9B] text-[11px] font-c64-mono flex flex-wrap items-center gap-x-3 gap-y-0.5"
            style={{ color: C64.LIGHT_BLUE }}
          >
            <span>WASD:Move</span>
            <span>·</span>
            <span>SPACE:Attack</span>
            <span>·</span>
            <span>E:Interact/Open</span>
            <span>·</span>
            <span>I:Inventory</span>
            <span>·</span>
            <span>ESC:Pause</span>
          </div>
        </div>

        {/* Bottom-Right Navigable Minimap */}
        <div className="hidden sm:flex flex-col items-end c64-box p-1.5 shrink-0">
          <span
            className="font-c64-display text-[9px] mb-1"
            style={{ color: C64.CYAN }}
          >
            MAP · {state.rooms.length} ROOMS
          </span>
          <canvas
            ref={minimapRef}
            className="pixelated-canvas block border border-[#2E2C9B]"
            style={{ width: 112, height: 76 }}
          />
        </div>
      </div>
    </div>
  );
};
