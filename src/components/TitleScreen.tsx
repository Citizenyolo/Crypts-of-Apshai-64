import React from 'react';
import { C64 } from '../game/c64Palette';

interface TitleScreenProps {
  onStartGame: () => void;
  crtEnabled: boolean;
  onToggleCrt: () => void;
  bestScore: number;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  crtEnabled,
  onToggleCrt,
  bestScore,
}) => {
  return (
    <div className="fixed inset-0 z-20 flex flex-col items-center justify-between py-10 px-6 pointer-events-none">
      {/* Top negative-space vignette gradient for crisp C64 logo legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 38%, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.68) 48%, rgba(0,0,0,0.88) 100%)',
        }}
      />

      {/* Top C64 RAM / System Banner */}
      <div className="relative z-10 text-center">
        <p
          className="font-c64-display text-xs tracking-widest"
          style={{ color: C64.LIGHT_BLUE }}
        >
          **** COMMODORE 64 VIC-II DUNGEON SYSTEM ****
        </p>
      </div>

      {/* Centerpiece Custom Inline SVG Pixel-Art Emblem & Primary Start CTA */}
      <div className="relative z-10 flex flex-col items-center max-w-2xl w-full text-center my-auto">
        <svg
          viewBox="0 0 360 130"
          className="w-full max-w-[540px] h-auto mb-6 drop-shadow-[4px_4px_0px_#000000]"
          role="img"
          aria-label="Crypts of Apshai 64 pixel art logo"
        >
          {/* C64 Raster Bars Behind Crest */}
          <rect x="20" y="18" width="320" height="4" fill={C64.RED} />
          <rect x="10" y="24" width="340" height="4" fill={C64.ORANGE} />
          <rect x="4" y="30" width="352" height="4" fill={C64.YELLOW} />
          <rect x="10" y="96" width="340" height="4" fill={C64.CYAN} />
          <rect x="20" y="102" width="320" height="4" fill={C64.LIGHT_BLUE} />
          <rect x="34" y="108" width="292" height="4" fill={C64.BLUE} />

          {/* Main Stone Plaque Box */}
          <rect
            x="28"
            y="10"
            width="304"
            height="92"
            fill={C64.BLACK}
            stroke={C64.LIGHT_BLUE}
            strokeWidth="4"
          />
          <rect
            x="34"
            y="16"
            width="292"
            height="80"
            fill="#121129"
            stroke={C64.CYAN}
            strokeWidth="2"
          />

          {/* Left Pixel Sword Icon */}
          <g transform="translate(46, 30)">
            <rect x="10" y="0" width="4" height="28" fill={C64.WHITE} />
            <rect x="12" y="2" width="2" height="24" fill={C64.CYAN} />
            <rect x="4" y="28" width="16" height="4" fill={C64.YELLOW} />
            <rect x="10" y="32" width="4" height="10" fill={C64.ORANGE} />
            <rect x="8" y="42" width="8" height="4" fill={C64.YELLOW} />
          </g>

          {/* Right Pixel Sword Icon */}
          <g transform="translate(290, 30)">
            <rect x="10" y="0" width="4" height="28" fill={C64.WHITE} />
            <rect x="10" y="2" width="2" height="24" fill={C64.CYAN} />
            <rect x="4" y="28" width="16" height="4" fill={C64.YELLOW} />
            <rect x="10" y="32" width="4" height="10" fill={C64.ORANGE} />
            <rect x="8" y="42" width="8" height="4" fill={C64.YELLOW} />
          </g>

          {/* Pixel Art Title Typography */}
          <text
            x="180"
            y="48"
            textAnchor="middle"
            fill={C64.YELLOW}
            fontFamily="'Press Start 2P', monospace"
            fontSize="20"
            fontWeight="bold"
          >
            CRYPTS OF
          </text>
          <text
            x="180"
            y="78"
            textAnchor="middle"
            fill={C64.CYAN}
            fontFamily="'Press Start 2P', monospace"
            fontSize="22"
            fontWeight="bold"
          >
            APSHAI 64
          </text>
        </svg>

        <p
          className="font-c64-body text-sm sm:text-base mb-6 max-w-md tracking-wide"
          style={{ color: C64.LIGHT_GREY }}
        >
          DESCEND FIVE PROCEDURAL DUNGEON LEVELS, SLAY ANCIENT GUARDIANS, AND
          RECLAIM THE AMULET OF APSHAI.
        </p>

        {/* Primary Action CTA + CRT Toggle */}
        <div className="flex flex-wrap items-center justify-center gap-4 pointer-events-auto">
          <button
            type="button"
            data-start="true"
            onClick={(e) => {
              e.currentTarget.blur();
              onStartGame();
            }}
            className="font-c64-display text-sm sm:text-base px-7 py-4 cursor-pointer transition-transform active:translate-y-0.5 whitespace-nowrap shrink-0"
            style={{
              backgroundColor: C64.YELLOW,
              color: C64.BLACK,
              border: `3px solid ${C64.WHITE}`,
              boxShadow: `5px 5px 0px ${C64.BLUE}`,
            }}
          >
            START GAME
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleCrt();
            }}
            className="font-c64-display text-xs px-4 py-4 cursor-pointer transition-colors whitespace-nowrap shrink-0"
            style={{
              backgroundColor: C64.BLACK,
              color: crtEnabled ? C64.LIGHT_GREEN : C64.LIGHT_GREY,
              border: `2px solid ${crtEnabled ? C64.LIGHT_GREEN : C64.MEDIUM_GREY}`,
              boxShadow: '4px 4px 0px #000000',
            }}
          >
            CRT: {crtEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {bestScore > 0 && (
          <div
            className="mt-5 font-c64-mono text-xs tracking-wider"
            style={{ color: C64.LIGHT_GREEN }}
          >
            HIGH SCORE: {Math.round(bestScore)}
          </div>
        )}
      </div>

      {/* Single Flat Borderless Control-Hint Line in Bottom Safe Margin */}
      <div className="relative z-10 text-center">
        <p
          className="font-c64-body text-xs sm:text-sm tracking-wider"
          style={{ color: C64.CYAN }}
        >
          WASD Move · Space Attack · E Interact / Open · I Inventory · Esc Pause
        </p>
      </div>
    </div>
  );
};
