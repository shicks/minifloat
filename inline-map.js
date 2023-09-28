#!/usr/bin/env node

/**
 * @license
 * Copyright 2023 Stephen Hicks
 * SPDX-License-Identifier: MIT
 */

// Tiny build script to inline the debug WASM source map.
// Ideally this would be done by asc, but sadly it's not.

import * as fs from 'fs';
import wasmap from 'wasm-sourcemap';

const wasm = fs.readFileSync('./dist/debug.wasm');
const map = fs.readFileSync('./dist/debug.wasm.map');
const url = `data:application/json;base64,${map.toString('base64')}`;
const inlined = wasmap.SetSourceMapURL(wasm, url);
fs.writeFileSync('./dist/debug.inlined.wasm', inlined);
