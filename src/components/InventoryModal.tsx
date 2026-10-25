import React from 'react';
import { C64 } from '../game/c64Palette';
import { ItemType, PlayerState } from '../game/types';

interface InventoryModalProps {
  player: PlayerState;
  onUseItem: (type: ItemType) => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  player,
  onUseItem,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.72)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Adventurer Inventory"
    >
      <div className="c64-box-gold w-full max-w-md p-5 flex flex-col gap-4 pointer-events-auto">
        <div className="flex items-center justify-between gap-4 border-b-2 border-[#2E2C9B] pb-2.5">
          <h2
            className="font-c64-display text-xs sm:text-sm whitespace-nowrap shrink-0"
            style={{ color: C64.YELLOW }}
          >
            ADVENTURER PACK
          </h2>
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onClose();
            }}
            className="font-c64-display text-[10px] px-2.5 py-1.5 cursor-pointer whitespace-nowrap shrink-0"
            style={{
              backgroundColor: C64.RED,
              color: C64.WHITE,
              border: `1px solid ${C64.WHITE}`,
            }}
          >
            CLOSE [I]
          </button>
        </div>

        {/* Equipped Gear Summary */}
        <div
          className="p-3 border border-[#2E2C9B] grid grid-cols-2 gap-3 text-xs"
          style={{ backgroundColor: '#0D0C1D' }}
        >
          <div>
            <div
              className="font-c64-display text-[10px] mb-1"
              style={{ color: C64.LIGHT_BLUE }}
            >
              WEAPON
            </div>
            <div className="font-c64-body" style={{ color: C64.WHITE }}>
              {player.weaponName}
            </div>
            <div className="font-c64-mono" style={{ color: C64.YELLOW }}>
              ATK POWER: {Math.round(player.attack)}
            </div>
          </div>

          <div>
            <div
              className="font-c64-display text-[10px] mb-1"
              style={{ color: C64.LIGHT_BLUE }}
            >
              SHIELD
            </div>
            <div className="font-c64-body" style={{ color: C64.WHITE }}>
              {player.shieldName}
            </div>
            <div className="font-c64-mono" style={{ color: C64.CYAN }}>
              DEFENSE: {Math.round(player.defense)}
            </div>
          </div>
        </div>

        {/* Usable Pack Items */}
        <div className="flex flex-col gap-2">
          <div
            className="font-c64-display text-[10px] whitespace-nowrap"
            style={{ color: C64.CYAN }}
          >
            SUPPLIES &amp; RELICS (KEYS 1-3 OR CLICK)
          </div>

          {player.inventory.length === 0 ? (
            <div
              className="py-6 text-center font-c64-body text-xs border border-dashed border-[#4A4A4A]"
              style={{ color: C64.MEDIUM_GREY }}
            >
              YOUR BACKPACK IS EMPTY. SEARCH CHESTS FOR ELIXIRS!
            </div>
          ) : (
            player.inventory.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-2.5 border border-[#4A4A4A]"
                style={{ backgroundColor: '#111118' }}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-c64-mono text-xs font-bold"
                      style={{ color: C64.YELLOW }}
                    >
                      [{idx + 1}]
                    </span>
                    <span
                      className="font-c64-body text-xs font-bold"
                      style={{ color: C64.WHITE }}
                    >
                      {item.name}
                    </span>
                    <span
                      className="font-c64-mono text-xs"
                      style={{ color: C64.LIGHT_GREEN }}
                    >
                      x{item.count}
                    </span>
                  </div>
                  <span
                    className="font-c64-body text-[11px]"
                    style={{ color: C64.LIGHT_GREY }}
                  >
                    {item.description}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onUseItem(item.type);
                  }}
                  className="font-c64-display text-[10px] px-3 py-2 cursor-pointer whitespace-nowrap shrink-0"
                  style={{
                    backgroundColor: C64.GREEN,
                    color: C64.BLACK,
                    border: `2px solid ${C64.LIGHT_GREEN}`,
                  }}
                >
                  USE
                </button>
              </div>
            ))
          )}
        </div>

        <div
          className="text-center font-c64-mono text-xs pt-1"
          style={{ color: C64.LIGHT_GREY }}
        >
          BRASS CRYPT KEYS CARRIED: {Math.round(player.keys)} · GOLD DUCATS:{' '}
          {Math.round(player.gold)}
        </div>
      </div>
    </div>
  );
};
