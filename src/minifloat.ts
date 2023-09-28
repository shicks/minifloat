/**
 * @license
 * Copyright 2023 Stephen Hicks
 * SPDX-License-Identifier: MIT
 */

import * as wasm from '../dist/wasm';

export enum RoundingRule {
  NearestEven = 0,
  NearestAway = 1,
  Truncate = 2,
  Ceiling = 3,
  Floor = 4,
}

type u32 = number;
type f64 = number;

export class Minifloat {
  private readonly size: number;
  private readonly signBits: number;
  private readonly exponentBits: number;
  private readonly significandBits: number;
  private readonly exponentDelta: number;
  private readonly maxExponent: number;
  private readonly defaultRounding: RoundingRule;

  constructor(signBits: number,
              exponentBits: number,
              significandBits: number,
              exponentBias?: number,
              defaultRounding: RoundingRule = RoundingRule.NearestEven) {
    // TODO - check parameters
    signBits = signBits >>> 0;
    exponentBits = exponentBits >>> 0;
    significandBits = significandBits >>> 0;
    defaultRounding = defaultRounding >>> 0;
    if (signBits > 1) {
      throw new Error(`sign bits must be 0 or 1: got ${signBits}`);
    } else if (exponentBits < 1) {
      throw new Error(`exponent bits must be at least 1: got ${exponentBits}`);
    } else if (exponentBits > 8) {
      throw new Error(`exponent bits must be at most 8: got ${exponentBits}`);
    } else if (significandBits < 1) {
      throw new Error(`significand bits must be at least 1: got ${significandBits}`);
    } else if (significandBits > 23) {
      throw new Error('significand bits must be at most 23: got ${significandBits}');
    } else if (defaultRounding < 0 || defaultRounding > 4) {
      throw new Error('unknown default rounding mode');
    }
    const exponentRange = 1 << exponentBits;
    // TODO - check sign here
    if (exponentBias == undefined) exponentBias = (1 << (exponentBits - 1)) - 1;
    const exponentMin = -exponentBias;
    const exponentMax = exponentRange - exponentBias;
    if (exponentMin < -1023) {
      throw new Error(`exponent bias too positive: got ${exponentBias} => ${exponentMin}`);
    } else if (exponentMax > 1024) {
      throw new Error(`exponent bias too negative: got ${exponentBias} => ${exponentMax}`);
    }

    this.signBits = signBits && 1;
    this.exponentBits = exponentBits;
    this.significandBits = significandBits;
    this.defaultRounding = defaultRounding;

    this.exponentDelta = exponentBias - 1023;
    this.maxExponent = ((1 << exponentBits) - 1) >>> 0;
    this.size = (this.signBits + exponentBits + significandBits) >>> 0;
    Object.freeze(this);
  }

  get SIGNED(): boolean {
    return this.signBits > 0;
  }

  get BITS(): number {
    return this.size;
  }

  get CARDINALITY(): number {
    return 1 << this.size;
  }

  get MAX_VALUE(): number {
    return this.fromBits(this.toBits(Infinity) - 1);
  }

  get MIN_VALUE(): number {
    return this.fromBits(1);
  }

  get EPSILON(): number {
    let oneBits = this.toBits(1);
    let one = this.fromBits(oneBits);
    if (one > 1) {
      // Exponent shift is such that all numbers are smaller than 1.
      // One will always round to infinity in that case.
      one = this.fromBits(oneBits -= 2);
    } else if (one < 1) {
      oneBits = one = 0;
    }
    return this.fromBits(oneBits + 1) - one;
  }

  get LABEL(): string {
    const terms = [this.signBits, this.exponentBits, this.significandBits];
    if (this.exponentDelta !== (1 << (this.exponentBits - 1)) - 1024) {
      terms.push(this.exponentDelta + 1023);      
    }
    return terms.join('.');
  }

  fromBits(bits: u32): f64 {
    return wasm.fromBits(
        bits >>> 0, this.size, this.signBits,
        this.significandBits, this.exponentDelta, this.maxExponent);
  }

  toBits(float: f64, roundingRule = this.defaultRounding): u32 {
    return wasm.toBits(
        float, this.size, this.signBits, this.exponentBits,
        this.significandBits, this.exponentDelta, this.maxExponent,
        roundingRule) >>> 0;
  }

  round(float: f64, roundingRule = this.defaultRounding): f64 {
    return this.fromBits(this.toBits(float, roundingRule));
  }
}
