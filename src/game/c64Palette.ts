/**
 * Authentic Commodore 64 VIC-II (Colodore/Pepto) 16-Color Palette
 */
export const C64 = {
  BLACK: '#000000',
  WHITE: '#FFFFFF',
  RED: '#813338',
  CYAN: '#75CEC8',
  PURPLE: '#8E3C97',
  GREEN: '#56AC4D',
  BLUE: '#2E2C9B',
  YELLOW: '#EDF171',
  ORANGE: '#8E5029',
  BROWN: '#553800',
  LIGHT_RED: '#C46C71',
  DARK_GREY: '#4A4A4A',
  MEDIUM_GREY: '#7B7B7B',
  LIGHT_GREEN: '#A9FF9F',
  LIGHT_BLUE: '#706DEB',
  LIGHT_GREY: '#B2B2B2',
} as const;

export type C64ColorKey = keyof typeof C64;

/**
 * Single-character mapping for 16x16 procedural pixel-art sprite matrices:
 * '.' = transparent
 * '0' = BLACK
 * '1' = WHITE
 * '2' = RED
 * '3' = CYAN
 * '4' = PURPLE
 * '5' = GREEN
 * '6' = BLUE
 * '7' = YELLOW
 * '8' = ORANGE
 * '9' = BROWN
 * 'A' = LIGHT_RED
 * 'B' = DARK_GREY
 * 'C' = MEDIUM_GREY
 * 'D' = LIGHT_GREEN
 * 'E' = LIGHT_BLUE
 * 'F' = LIGHT_GREY
 */
export const CHAR_TO_C64: Record<string, string | null> = {
  '.': null,
  '0': C64.BLACK,
  '1': C64.WHITE,
  '2': C64.RED,
  '3': C64.CYAN,
  '4': C64.PURPLE,
  '5': C64.GREEN,
  '6': C64.BLUE,
  '7': C64.YELLOW,
  '8': C64.ORANGE,
  '9': C64.BROWN,
  'A': C64.LIGHT_RED,
  'B': C64.DARK_GREY,
  'C': C64.MEDIUM_GREY,
  'D': C64.LIGHT_GREEN,
  'E': C64.LIGHT_BLUE,
  'F': C64.LIGHT_GREY,
};
