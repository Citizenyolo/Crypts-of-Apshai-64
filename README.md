# Crypts of Apshai 64

Welcome to **Crypts of Apshai 64**, a browser-based procedural dungeon crawler inspired by the legendary 1980s Commodore 64 games! Descend into the depths, slay ancient guardians, and reclaim the Amulet of Apshai!

## 🌟 Key Features

*   **Commodore 64 VIC-II Visuals & CRT Emulation:**
    *   Experience the authentic 16-color C64 palette.
    *   Procedural 16×16 pixel-art sprites rendered on an HTML5 `<canvas>`.
    *   Custom `<svg>` pixel-art title emblem displayed over a live panning dungeon backdrop.
    *   An optional CRT scanline/vignette toggle to enhance the retro feel (click the CRT button or press the `C` key).

*   **Procedural Dungeon Generator:**
    *   Explores 5 progressively harder dungeon levels.
    *   Each floor generates 12 interconnected rooms.
    *   BFS-verified reachable exits (STAIRS_DOWN and the AMULET OF APSHAI on Floor 5).
    *   Navigate through doors, unlocked locked grates (guaranteed reachable keys), spike traps, and loot treasure chests.

*   **Four Distinct Enemy Archetypes & Turn-Based Combat:**
    *   💀 **Crypt Skeleton:** A relentless melee pursuer that telegraphs heavy bone-cleave strikes.
    *   🟢 **Venom Slime:** An erratic acid hopper that moves on alternating turns.
    *   👁️ **Void Cultist:** A ranged kiter that retreats when approached and telegraphs dark bolt incantations from a distance.
    *   🦇 **Stone Gargoyle:** A line-of-sight charger that swoops across aligned corridors.

*   **Inventory, Progression & SID Web Audio:**
    *   Collect items like Gold Ducats, Brass Crypt Keys, Weapon/Shield upgrades, and Crimson Elixirs.
    *   Utilize powerful scrolls (Scroll of SID Bolt, Scroll of Clairvoyance).
    *   Enjoy synthesized C64 SID-style Web Audio sound effects bringing the dungeon to life.


## 🚀 Quick Start (Local Development)

Adventurer, if you wish to host your own descent into the Crypts, follow these ancient rituals:

### Prerequisites
*   **Node.js & npm:** Ensure you have Node.js (v18+) installed on your machine.

### Installation

1.  **Clone the Tome:**
    ```bash
    git clone https://github.com/Citizenyolo/Crypts-of-Apshai-64.git
    cd Crypts-of-Apshai-64
    ```

2.  **Gather Provisions (Install Dependencies):**
    *Note: Due to some ancient artifact conflicts, use the legacy peer dependencies flag.*
    ```bash
    npm install --legacy-peer-deps
    ```

3.  **Awaken the Dungeon (Start Local Server):**
    ```bash
    npm run dev
    ```

4.  **Enter the Crypt:**
    Open your favorite web browser and navigate to the portal at:
    **`http://localhost:3000`**

## ✅ Verification Summary

*   **Unit Tests:** Procedural generation is verified (>= 10 rooms and BFS exit reachability across 10 seeds). We also verify wall/locked door collision, key unlocking, combat damage & enemy telegraphs, distinct AI movement policies, inventory potion healing, chest looting, and level progression via `node:test`.
*   **Browser & Visual Verification:** Verified at 1440×900 in headless Chromium. Tested functionality across the Title Screen, active Gameplay HUD (`?autostart=1` and `Enter` to start), WASD movement, Space for combat, E for interaction, I for the Inventory modal, and Escape for the Pause modal. Addressed issues like two-line header wrapping in the inventory dialog and brightened HUD vitality heart contrast for better visibility.
