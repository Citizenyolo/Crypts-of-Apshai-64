/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { HudOverlay } from './components/HudOverlay';
import { InventoryModal } from './components/InventoryModal';
import { StatusModal } from './components/StatusModal';
import { TitleScreen } from './components/TitleScreen';
import {
  generateDungeon,
  interactAction,
  movePlayer,
  playerAttackAction,
  useInventoryItem,
} from './game/rules';
import { sidAudio } from './game/sound';
import { EffectsPool, renderDungeonCanvas } from './game/sprites';
import {
  ActionFeedbackEvent,
  Direction,
  DungeonState,
  GamePhase,
  ItemType,
} from './game/types';

const BEST_SCORE_STORAGE_KEY = 'crypts_of_apshai_64_best_score';

export default function App() {
  const isAutostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(BEST_SCORE_STORAGE_KEY);
      return saved ? Number(saved) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [crtEnabled, setCrtEnabled] = useState<boolean>(true);
  const [muted, setMuted] = useState<boolean>(false);

  // Mutable authoritative game state in ref so 60fps loop never tears down canvas
  const stateRef = useRef<DungeonState | null>(null);
  if (!stateRef.current) {
    const initial = generateDungeon(1, 1984);
    initial.phase = isAutostart ? 'playing' : 'title';
    stateRef.current = initial;
  }

  // React state version counter triggered only on discrete turn/UI transitions
  const [, setHudTick] = useState<number>(0);
  const syncHud = useCallback(() => {
    const st = stateRef.current;
    if (!st) return;
    document.body.dataset.state = st.phase;
    if (st.player.score > bestScore) {
      setBestScore(st.player.score);
      try {
        localStorage.setItem(BEST_SCORE_STORAGE_KEY, String(st.player.score));
      } catch {
        // ignore storage restrictions
      }
    }
    setHudTick((t) => t + 1);
  }, [bestScore]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const effectsRef = useRef<EffectsPool>(new EffectsPool());
  const cameraPosRef = useRef<{ x: number; y: number }>({
    x: stateRef.current.player.x,
    y: stateRef.current.player.y,
  });
  const heldDirsRef = useRef<Set<Direction>>(new Set());
  const moveRepeatTimerRef = useRef<number>(0);

  // Synchronize document.body.dataset.state on mount
  useEffect(() => {
    if (stateRef.current) {
      document.body.dataset.state = stateRef.current.phase;
    }
  }, []);

  const dispatchFeedback = useCallback(
    (events: ActionFeedbackEvent[]) => {
      for (const ev of events) {
        sidAudio.playEvent(ev);
      }
      effectsRef.current.triggerEvents(events);
      syncHud();
    },
    [syncHud]
  );

  const handleStartNewGame = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 900000) + 1000;
    const nextState = generateDungeon(1, newSeed, undefined, bestScore);
    nextState.phase = 'playing';
    nextState.inventoryOpen = false;
    stateRef.current = nextState;
    cameraPosRef.current = {
      x: nextState.player.x,
      y: nextState.player.y,
    };
    heldDirsRef.current.clear();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    sidAudio.playStartChime();
    syncHud();
  }, [bestScore, syncHud]);

  const handlePhaseChange = useCallback(
    (nextPhase: GamePhase) => {
      const st = stateRef.current;
      if (!st) return;
      st.phase = nextPhase;
      st.inventoryOpen = false;
      heldDirsRef.current.clear();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      syncHud();
    },
    [syncHud]
  );

  const handleToggleInventory = useCallback(() => {
    const st = stateRef.current;
    if (!st || st.phase !== 'playing') return;
    st.inventoryOpen = !st.inventoryOpen;
    heldDirsRef.current.clear();
    syncHud();
  }, [syncHud]);

  const handleUseItem = useCallback(
    (itemType: ItemType) => {
      const st = stateRef.current;
      if (!st || st.phase !== 'playing') return;
      const evs = useInventoryItem(st, itemType, bestScore);
      dispatchFeedback(evs);
    },
    [bestScore, dispatchFeedback]
  );

  const handleStepDirection = useCallback(
    (dir: Direction) => {
      const st = stateRef.current;
      if (!st || st.phase !== 'playing' || st.inventoryOpen) return;
      const evs = movePlayer(st, dir, bestScore);
      dispatchFeedback(evs);
    },
    [bestScore, dispatchFeedback]
  );

  const handleAttack = useCallback(() => {
    const st = stateRef.current;
    if (!st || st.phase !== 'playing' || st.inventoryOpen) return;
    const evs = playerAttackAction(st, bestScore);
    dispatchFeedback(evs);
  }, [bestScore, dispatchFeedback]);

  const handleInteract = useCallback(() => {
    const st = stateRef.current;
    if (!st || st.phase !== 'playing' || st.inventoryOpen) return;
    const evs = interactAction(st, bestScore);
    dispatchFeedback(evs);
  }, [bestScore, dispatchFeedback]);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      sidAudio.muted = next;
      return next;
    });
  }, []);

  const handleToggleCrt = useCallback(() => {
    setCrtEnabled((prev) => !prev);
  }, []);

  // Global keyboard controls on window (works immediately without clicking canvas)
  useEffect(() => {
    const codeToDir = (code: string, key: string): Direction | null => {
      const k = key.toLowerCase();
      if (code === 'KeyW' || code === 'ArrowUp' || k === 'w') return 'UP';
      if (code === 'KeyS' || code === 'ArrowDown' || k === 's') return 'DOWN';
      if (code === 'KeyA' || code === 'ArrowLeft' || k === 'a') return 'LEFT';
      if (code === 'KeyD' || code === 'ArrowRight' || k === 'd') return 'RIGHT';
      return null;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const st = stateRef.current;
      if (!st) return;

      const gameKeys = [
        'KeyW',
        'KeyA',
        'KeyS',
        'KeyD',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Space',
        'KeyE',
        'KeyI',
        'Escape',
        'Enter',
      ];
      if (
        gameKeys.includes(e.code) ||
        ['w', 'a', 's', 'd', ' ', 'e', 'i', 'escape'].includes(
          e.key.toLowerCase()
        )
      ) {
        e.preventDefault();
      }

      // Title or Game Over state: Enter or Space starts/restarts immediately
      if (st.phase === 'title' || st.phase === 'gameover') {
        if (e.code === 'Enter' || e.code === 'Space' || e.key === ' ') {
          if (!e.repeat) {
            handleStartNewGame();
          }
        }
        return;
      }

      // Pause toggle via Escape or P
      if (e.code === 'Escape' || e.key === 'Escape' || e.code === 'KeyP') {
        if (!e.repeat) {
          if (st.inventoryOpen) {
            st.inventoryOpen = false;
            syncHud();
          } else if (st.phase === 'playing') {
            handlePhaseChange('paused');
          } else if (st.phase === 'paused') {
            handlePhaseChange('playing');
          }
        }
        return;
      }

      if (st.phase !== 'playing') return;

      // Toggle Inventory via I
      if (e.code === 'KeyI' || e.key.toLowerCase() === 'i') {
        if (!e.repeat) {
          handleToggleInventory();
        }
        return;
      }

      // Toggle CRT via C, Mute via M
      if (e.code === 'KeyC' && !e.repeat) {
        handleToggleCrt();
        return;
      }
      if (e.code === 'KeyM' && !e.repeat) {
        handleToggleMute();
        return;
      }

      // Number hotkeys 1-3 to use inventory items directly
      if (['Digit1', 'Digit2', 'Digit3'].includes(e.code) && !e.repeat) {
        const idx = Number(e.code.replace('Digit', '')) - 1;
        const item = st.player.inventory[idx];
        if (item) {
          handleUseItem(item.type);
        }
        return;
      }

      if (st.inventoryOpen) return;

      // One-shot Attack via Space
      if (e.code === 'Space' || e.key === ' ') {
        if (!e.repeat) {
          handleAttack();
        }
        return;
      }

      // One-shot Interact via E
      if (e.code === 'KeyE' || e.key.toLowerCase() === 'e') {
        if (!e.repeat) {
          handleInteract();
        }
        return;
      }

      // Movement via W/A/S/D or Arrow keys
      const dir = codeToDir(e.code, e.key);
      if (dir) {
        if (!heldDirsRef.current.has(dir)) {
          heldDirsRef.current.add(dir);
          moveRepeatTimerRef.current = 0.22; // Initial step delay before smooth repeat
          handleStepDirection(dir);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const dir = codeToDir(e.code, e.key);
      if (dir) {
        heldDirsRef.current.delete(dir);
      }
    };

    const onBlur = () => {
      heldDirsRef.current.clear();
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [
    handleAttack,
    handleInteract,
    handlePhaseChange,
    handleStartNewGame,
    handleStepDirection,
    handleToggleCrt,
    handleToggleInventory,
    handleToggleMute,
    handleUseItem,
    syncHud,
  ]);

  // Isolated 60 FPS Canvas Simulation & Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(320, Math.floor(window.innerWidth * dpr));
      canvas.height = Math.max(200, Math.floor(window.innerHeight * dpr));
    };

    updateCanvasSize();
    const resizeObs = new ResizeObserver(updateCanvasSize);
    resizeObs.observe(document.body);

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05); // Clamped dt <= 0.05s
      const timeSec = now / 1000;

      const st = stateRef.current;
      const effects = effectsRef.current;

      if (st) {
        // Update particles, hitstop, and camera trauma in real dt
        effects.update(dt);

        if (st.phase === 'playing' && !st.inventoryOpen) {
          // Handle held movement key auto-repeat
          if (heldDirsRef.current.size > 0) {
            moveRepeatTimerRef.current -= dt;
            if (moveRepeatTimerRef.current <= 0) {
              moveRepeatTimerRef.current = 0.14;
              const dirs = Array.from(heldDirsRef.current);
              const latestDir = dirs[dirs.length - 1];
              if (latestDir) {
                handleStepDirection(latestDir);
              }
            }
          }
        }

        // Advance entity visual interpolations when hitstop is not active
        const simDt = effects.hitstopTimer > 0 ? 0 : dt;
        const interpSpeed = Math.min(1, simDt * 18);

        const p = st.player;
        p.visualX += (p.x - p.visualX) * interpSpeed;
        p.visualY += (p.y - p.visualY) * interpSpeed;
        p.scaleX += (1 - p.scaleX) * Math.min(1, simDt * 14);
        p.scaleY += (1 - p.scaleY) * Math.min(1, simDt * 14);
        p.hitFlashTimer = Math.max(0, p.hitFlashTimer - dt);
        p.attackAnimTimer = Math.max(0, p.attackAnimTimer - dt);

        // Attack lunge visual offset
        if (p.attackAnimTimer > 0) {
          const lunge = Math.sin((p.attackAnimTimer / 0.16) * Math.PI) * 0.28;
          if (p.facing === 'RIGHT') p.visualX = p.x + lunge;
          else if (p.facing === 'LEFT') p.visualX = p.x - lunge;
          else if (p.facing === 'DOWN') p.visualY = p.y + lunge;
          else if (p.facing === 'UP') p.visualY = p.y - lunge;
        }

        for (const enemy of st.enemies) {
          enemy.visualX += (enemy.x - enemy.visualX) * interpSpeed;
          enemy.visualY += (enemy.y - enemy.visualY) * interpSpeed;
          enemy.scaleX += (1 - enemy.scaleX) * Math.min(1, simDt * 14);
          enemy.scaleY += (1 - enemy.scaleY) * Math.min(1, simDt * 14);
          enemy.hitFlashTimer = Math.max(0, enemy.hitFlashTimer - dt);
          if (enemy.hp <= 0 && enemy.koTimer > 0) {
            enemy.koTimer = Math.max(0, enemy.koTimer - dt);
          }
        }

        // Camera target: smooth spline pan across dungeon on Title screen, or damp to player in Playing
        if (st.phase === 'title') {
          const tourAngle = timeSec * 0.22;
          cameraPosRef.current.x =
            st.width / 2 + Math.cos(tourAngle) * (st.width * 0.24);
          cameraPosRef.current.y =
            st.height / 2 + Math.sin(tourAngle * 1.3) * (st.height * 0.22);
        } else {
          const camLerp = Math.min(1, dt * 10);
          cameraPosRef.current.x +=
            (p.visualX - cameraPosRef.current.x) * camLerp;
          cameraPosRef.current.y +=
            (p.visualY - cameraPosRef.current.y) * camLerp;
        }

        renderDungeonCanvas(
          ctx,
          st,
          effects,
          timeSec,
          cameraPosRef.current.x,
          cameraPosRef.current.y
        );
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      resizeObs.disconnect();
    };
  }, [handleStepDirection]);

  const currentState = stateRef.current!;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Isolated Full-Viewport C64 Pixel-Art Canvas */}
      <canvas
        ref={canvasRef}
        data-testid="dungeon-canvas"
        className="pixelated-canvas block w-full h-full"
      />

      {/* Optional C64 CRT Scanline & Phosphor Vignette Overlay */}
      {crtEnabled && (
        <div
          className="fixed inset-0 z-40 pointer-events-none crt-scanlines crt-vignette"
          aria-hidden="true"
        />
      )}

      {/* Title Screen State */}
      {currentState.phase === 'title' && (
        <TitleScreen
          onStartGame={handleStartNewGame}
          crtEnabled={crtEnabled}
          onToggleCrt={handleToggleCrt}
          bestScore={bestScore}
        />
      )}

      {/* Active Gameplay Perimeter HUD */}
      {currentState.phase !== 'title' && (
        <HudOverlay
          state={currentState}
          crtEnabled={crtEnabled}
          muted={muted}
          onToggleCrt={handleToggleCrt}
          onToggleMute={handleToggleMute}
          onToggleInventory={handleToggleInventory}
          onPause={() => handlePhaseChange('paused')}
          onQuickHeal={() => handleUseItem(ItemType.POTION_HEAL)}
        />
      )}

      {/* Inventory Modal Overlay */}
      {currentState.phase === 'playing' && currentState.inventoryOpen && (
        <InventoryModal
          player={currentState.player}
          onUseItem={handleUseItem}
          onClose={handleToggleInventory}
        />
      )}

      {/* Pause / Victory / Game Over Modal */}
      {(currentState.phase === 'paused' ||
        currentState.phase === 'gameover') && (
        <StatusModal
          state={currentState}
          onResume={() => handlePhaseChange('playing')}
          onRestart={handleStartNewGame}
          onReturnTitle={() => handlePhaseChange('title')}
        />
      )}
    </main>
  );
}
