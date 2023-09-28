#!/usr/bin/env node

/**
 * @license
 * Copyright 2023 Stephen Hicks
 * SPDX-License-Identifier: MIT
 */

// Build script to extract the function signatures from src/asm.ts
// Writes the wrapper files dist/wasm.js and dist/wasm.d.ts so that
// the main src/minifloat.ts can keep decent type checking.
// TODO: this is a pretty big nonstandard mess, we should clean it.

import * as fs from 'fs';

const src = fs.readFileSync('src/asm.ts');
const functions = new Map();
for (const [, name, sig] of
     String(src).matchAll(/^export function\s+([a-z0-9_]+)(\([^{]*?)\s*{/imsg)) {
  functions.set(name, sig);
}

let out = `import wasm from 'minifloat.wasm';
const {exports: m} = await WebAssembly.instantiate(await WebAssembly.compile(wasm), {env: {abort: () => {throw ''}}})
`;
for (const name of functions.keys()) {
  out += `export const ${name} = m.${name};\n`;
}
fs.writeFileSync('dist/wasm.js', out);

out = `type u8 = number;
type u16 = number;
type u32 = number;
type i8 = number;
type i16 = number;
type i32 = number;
type f32 = number;
type f64 = number;
type RoundingRule = u8;
`;
for (const [name, sig] of functions) {
  out += `export function ${name}${sig};\n`;
}
fs.writeFileSync('dist/wasm.d.ts', out);
