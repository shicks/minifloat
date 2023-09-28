/**
 * @license
 * Copyright 2023 Stephen Hicks
 * SPDX-License-Identifier: MIT
 */

type RoundingRule = u8;

const implicitOneF64: u64 = 0x0010_0000_0000_0000;
const signF64: u64 = 0x8000_0000_0000_0000;
const significandF64: u64 = 0x000f_ffff_ffff_ffff;

const RoundTrunc: u8 = 2;
const RoundCeil: u8 = 3;
const RoundFloor: u8 = 4;

export function toBits(float: f64, size: u8, signBits: u8, exponentBits: u8, significandBits: u8, exponentDelta: i16, maxExponent: i16, rounding: RoundingRule): u32 {
  const bits = reinterpret<u64>(float);
  const s0 = (bits >>> 63) as u8;
  const e0 = (((bits >>> 52) & 0x7ff) as i16); 
  const m0 = bits & significandF64;
  if (e0 === 2047 && m0) {
    // Preserve NaN
    return ((1 as u64 << size) - 1) as u32;
  }
  let e = e0 + exponentDelta;
  let m = m0;
  if (e <= 0) {
    // Subnormal: shift
    const shift = min(1 - e, 53); // shifts > 64 are meaningless.
    // See if we're dropping any nonzero digits with the shift
    //  => if so, then OR in a 1 in the LSB so we know it's nonzero
    //     (this bit is never significant for "half-way" rounding)
    const dropped = m & ((1 << shift) - 1);
    m = ((m | (e0 ? implicitOneF64 : 0)) >>> shift) | (dropped ? 1 : 0);
    e = 0;
  }
  m = roundingModes[rounding](m, 52 - significandBits, s0);
  if (m >>> significandBits) {
    // Check if we rounded up to a higher exponent
    e = e + 1;
    m = 0;
  }
  if (e >= maxExponent) {
    // Result will be infinity: drop the significand
    m = 0;
    e = maxExponent;
    // If we should round to zero and didn't start with Infinity, then
    // return the largest-magnitude finite number instead.
    if (e0 < 2047 &&
        (rounding === RoundTrunc ||
            (s0 && rounding === RoundCeil) ||
            (!s0 && rounding === RoundFloor))) {
      e = e - 1;
      m = (1 << significandBits) - 1;
    }
  }
  if (!signBits && s0) {
    // When unsigned, round negative numbers to zero for truncate and
    // ceiling, or if the result would have been -0.  Otherwise, round
    // to NaN.
    if (rounding === RoundTrunc || rounding === RoundCeil) return 0;
    if (!e && !m) return 0;
    return (1 << size) - 1; // NaN
  }

  // NOTE: e is i16, (so s0<<eb | e) would sign-extend from i16 to u32, which
  // is bad when it's 0x8000, since it extends to -0x8000.
  return (((s0 as u32) << exponentBits) | (e as u32)) << significandBits | (m as u32);
}

export function fromBits(bits: u32, size: u8, signBits: u8, significandBits: u8, exponentDelta: i16, maxExponent: i16): f64 {
  if (size < 32) bits = bits & ((1 as u32 << size) - 1);
  const s: u64 = signBits && bits >>> (size - 1) ? signF64 : 0;
  let e0 = ((bits >>> significandBits) & maxExponent) as i64;
  let m0 = (bits << (32 - significandBits)) as u64;
  if (!e0) {
    // subnormal, but not subnormal for f64
    if (m0) {
      const shift = clz(m0) - 31;
      m0 = (m0 << shift) & 0xffff_ffff;
      e0 = e0 - shift + 1;
    } else {
      e0 = exponentDelta;
    }
  } else if (e0 === maxExponent) {
    // infinity/NaN
    return reinterpret<f64>(s | 0x7ff0_0000_0000_0000 | m0);
  }
  const e = (e0 === maxExponent ? 0x7ff : e0 - exponentDelta) << 52;
  const m = m0 << 20;
  return reinterpret<f64>(s | e | m);
}

// TODO - more efficient direct rounding.

function roundNearestEven(mantissa: u64, shift: u8, _sign: u8): u64 {
  const z = ctz(mantissa);
  mantissa = mantissa >>> (shift - 1);
  const incr: u8 = (mantissa & 1) && (z < shift - 1 || (mantissa & 2)) ? 1 : 0;
  return (mantissa >>> 1) + incr;
}
function roundNearestAway(mantissa: u64, shift: u8, _sign: u8): u64 {
  mantissa = mantissa >>> (shift - 1);
  return (mantissa >>> 1) + (mantissa & 1);
}
function roundTrunc(mantissa: u64, shift: u8, _sign: u8): u64 {
  return mantissa >>> shift;
}
function roundCeil(mantissa: u64, shift: u8, sign: u8): u64 {
  const incr = !sign && ctz(mantissa) < shift ? 1 : 0;
  return (mantissa >>> shift) + incr;
}
function roundFloor(mantissa: u64, shift: u8, sign: u8): u64 {
  const incr = sign && ctz(mantissa) < shift ? 1 : 0;
  return (mantissa >>> shift) + incr;
}

const roundingModes = [
  roundNearestEven,
  roundNearestAway,
  roundTrunc,
  roundCeil,
  roundFloor,
];
