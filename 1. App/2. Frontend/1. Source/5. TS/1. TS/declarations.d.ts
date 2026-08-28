declare module '*.css';

// Minimal tinycolor2 ambient declaration.
// Uses named exports so `import * as tinycolor from 'tinycolor2'` produces a
// namespace where tinycolor.ColorInput and tinycolor.Instance resolve correctly
// (required by tinygradient/types.d.ts).
declare module 'tinycolor2' {
  export type ColorInput = string | { [key: string]: any };
  export interface Instance {
    isDark(): boolean;
    isLight(): boolean;
    isValid(): boolean;
    getAlpha(): number;
    setAlpha(alpha: number): Instance;
    toHsvString(): string;
    toHslString(): string;
    toHex(): string;
    toHexString(): string;
    toHex8String(): string;
    toRgb(): { r: number; g: number; b: number; a: number };
    toRgbString(): string;
    toString(format?: string): string;
    clone(): Instance;
    [key: string]: any;
  }
  export interface Constructor {
    new (color?: ColorInput): Instance;
    (color?: ColorInput): Instance;
    [key: string]: any;
  }
  const tinycolor: Constructor;
  export default tinycolor;
}
