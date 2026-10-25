import React from 'react';
import { C64 } from '../game/c64Palette';
import { DungeonState } from '../game/types';

interface StatusModalProps {
  state: DungeonState;
  onResume: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  state,
  onResume,
  onRestart,
  onReturnTitle,
}) => {
  if (state.phase === 'paused') {
    return (
      <div
        className="fixed inset-0 z-30 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.78)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Game Paused"
      >
        <div className="c64-box w-full max-w-md p-6 flex flex-col items-center text-center gap-5 pointer-events-auto">
          <h2
            className="font-c64-display text-lg"
            style={{ color: C64.YELLOW }}
          >
            GAME PAUSED
          </h2>

          {/* 3 Tabular Stat Tiles */}
          <div className="grid grid-cols-3 gap-3 w-full">
            <div
              className="p-2.5 border border-[#2E2C9B]"
              style={{ backgroundColor: '#0D0C1D' }}
            >
              <div
                className="font-c64-display text-[9px] mb-1"
                style={{ color: C64.LIGHT_BLUE }}
              >
                FLOOR
              </div>
              <div
                className="font-c64-mono text-base font-bold tabular-nums"
                style={{ color: C64.CYAN }}
              >
                {state.dungeonLevel}/{state.maxDungeonLevel}
              </div>
            </div>

            <div
              className="p-2.5 border border-[#2E2C9B]"
              style={{ backgroundColor: '#0D0C1D' }}
            >
              <div
                className="font-c64-display text-[9px] mb-1"
                style={{ color: C64.LIGHT_BLUE }}
              >
                SCORE
              </div>
              <div
                className="font-c64-mono text-base font-bold tabular-nums"
                style={{ color: C64.YELLOW }}
              >
                {Math.round(state.player.score)}
              </div>
            </div>

            <div
              className="p-2.5 border border-[#2E2C9B]"
              style={{ backgroundColor: '#0D0C1D' }}
            >
              <div
                className="font-c64-display text-[9px] mb-1"
                style={{ color: C64.LIGHT_BLUE }}
              >
                GOLD
              </div>
              <div
                className="font-c64-mono text-base font-bold tabular-nums"
                style={{ color: C64.WHITE }}
              >
                {Math.round(state.player.gold)}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onResume();
              }}
              className="font-c64-display text-xs px-5 py-3 w-full sm:w-auto cursor-pointer whitespace-nowrap shrink-0"
              style={{
                backgroundColor: C64.LIGHT_GREEN,
                color: C64.BLACK,
                border: `2px solid ${C64.WHITE}`,
              }}
            >
              RESUME [ESC]
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onRestart();
              }}
              className="font-c64-display text-xs px-4 py-3 w-full sm:w-auto cursor-pointer whitespace-nowrap shrink-0"
              style={{
                backgroundColor: C64.YELLOW,
                color: C64.BLACK,
                border: `2px solid ${C64.WHITE}`,
              }}
            >
              RESTART
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onReturnTitle();
              }}
              className="font-c64-display text-xs px-4 py-3 w-full sm:w-auto cursor-pointer whitespace-nowrap shrink-0"
              style={{
                backgroundColor: C64.BLUE,
                color: C64.WHITE,
                border: `2px solid ${C64.LIGHT_BLUE}`,
              }}
            >
              TITLE
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.phase === 'gameover' && state.runSummary) {
    const {
      outcome,
      cause,
      score,
      bestScore,
      dungeonLevel,
      enemiesSlain,
      goldCollected,
    } = state.runSummary;
    const isVictory = outcome === 'victory';

    return (
      <div
        className="fixed inset-0 z-30 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.84)' }}
        role="dialog"
        aria-modal="true"
        aria-label={isVictory ? 'Victory' : 'Game Over'}
      >
        <div
          className={`w-full max-w-md p-6 flex flex-col items-center text-center gap-5 pointer-events-auto ${
            isVictory ? 'c64-box-gold' : 'c64-box'
          }`}
          style={{
            borderColor: isVictory ? C64.YELLOW : C64.LIGHT_RED,
          }}
        >
          <h2
            className="font-c64-display text-xl"
            style={{ color: isVictory ? C64.YELLOW : C64.LIGHT_RED }}
          >
            {isVictory ? 'VICTORY OF APSHAI!' : 'THOU HAST PERISHED'}
          </h2>

          <p
            className="font-c64-body text-xs"
            style={{ color: C64.LIGHT_GREY }}
          >
            {cause}
          </p>

          {/* 3 Tabular Stat Tiles */}
          <div className="grid grid-cols-3 gap-3 w-full">
            <div
              className="p-2.5 border border-[#4A4A4A]"
              style={{ backgroundColor: '#0D0C1D' }}
            >
              <div
                className="font-c64-display text-[9px] mb-1"
                style={{ color: C64.LIGHT_BLUE }}
              >
                SCORE / BEST
              </div>
              <div
                className="font-c64-mono text-sm font-bold tabular-nums"
                style={{ color: C64.YELLOW }}
              >
                {Math.round(score)} / {Math.round(bestScore)}
              </div>
            </div>

            <div
              className="p-2.5 border border-[#4A4A4A]"
              style={{ backgroundColor: '#0D0C1D' }}
            >
              <div
                className="font-c64-display text-[9px] mb-1"
                style={{ color: C64.LIGHT_BLUE }}
              >
                DEPTH REACHED
              </div>
              <div
                className="font-c64-mono text-sm font-bold tabular-nums"
                style={{ color: C64.CYAN }}
              >
                FLR {dungeonLevel}/{state.maxDungeonLevel}
              </div>
            </div>

            <div
              className="p-2.5 border border-[#4A4A4A]"
              style={{ backgroundColor: '#0D0C1D' }}
            >
              <div
                className="font-c64-display text-[9px] mb-1"
                style={{ color: C64.LIGHT_BLUE }}
              >
                SLAIN / GOLD
              </div>
              <div
                className="font-c64-mono text-sm font-bold tabular-nums"
                style={{ color: C64.LIGHT_GREEN }}
              >
                {enemiesSlain} / {Math.round(goldCollected)}G
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 w-full">
            <button
              type="button"
              data-start="true"
              onClick={(e) => {
                e.currentTarget.blur();
                onRestart();
              }}
              className="font-c64-display text-xs px-6 py-3.5 cursor-pointer whitespace-nowrap shrink-0"
              style={{
                backgroundColor: C64.YELLOW,
                color: C64.BLACK,
                border: `2px solid ${C64.WHITE}`,
              }}
            >
              PLAY AGAIN
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onReturnTitle();
              }}
              className="font-c64-display text-xs px-4 py-3.5 cursor-pointer whitespace-nowrap shrink-0"
              style={{
                backgroundColor: C64.BLUE,
                color: C64.WHITE,
                border: `2px solid ${C64.LIGHT_BLUE}`,
              }}
            >
              TITLE
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
