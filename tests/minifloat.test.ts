import {assert, assertEquals} from 'https://deno.land/std@0.202.0/assert/mod.ts';
import {Minifloat, RoundingRule} from '../dist/minifloat.js';
import {describe, it} from 'https://deno.land/std@0.202.0/testing/bdd.ts';

describe('1.4.3', () => {
  const mf = new Minifloat(1, 4, 3);
  standardTests(mf, {label: '1.4.3'});
  it('should round to infinity appropriately', () => {
    assertEquals(mf.round(240.1, RoundingRule.Ceiling), Infinity);
    assertEquals(mf.round(247.99, RoundingRule.NearestEven), 240);
    assertEquals(mf.round(248, RoundingRule.NearestEven), Infinity);
    // Floor should never produce a new infinity...?
    assertEquals(mf.round(256, RoundingRule.Floor), 240);
    assertEquals(mf.round(1e100, RoundingRule.Floor), 240);
    assertEquals(mf.round(1e100, RoundingRule.Truncate), 240);
    // But it will maintain an existing infinity.
    assertEquals(mf.round(Infinity, RoundingRule.Floor), Infinity);
  });
  it('shoud handle negative zero', () => {
    assertEquals(mf.toBits(-0), 0x80);
    assertEquals(mf.toBits(-1e-8), 0x80);
    assert(Object.is(mf.fromBits(0x80), -0));
  });
  it('should have correct values for properties', () => {
    assertEquals(mf.BITS, 8);
    assertEquals(mf.CARDINALITY, 256);
    assertEquals(mf.MAX_VALUE, 240);
    assertEquals(mf.MIN_VALUE, 1 / 512);
    assertEquals(mf.EPSILON, 0.125);
  });
});

describe('1.4.3.-2', () => {
  const mf = new Minifloat(1, 4, 3, -2);
  standardTests(mf, {label: '1.4.3.-2'});
  it('should map to natural numbers from 0 to 16', () => {
    for (let i = 0; i <= 16; i++) {
      assertEquals(mf.fromBits(i), i, `fromBits(${i})`);
    }
  });
  it('should have correct values for properties', () => {
    assertEquals(mf.BITS, 8);
    assertEquals(mf.CARDINALITY, 256);
    assertEquals(mf.MAX_VALUE, 122880);
    assertEquals(mf.MIN_VALUE, 1);
    assertEquals(mf.EPSILON, 1);
  });
});

describe('1.4.3.-4', () => {
  // This system has 4 as its minimum value.
  const mf = new Minifloat(1, 4, 3, -4);
  standardTests(mf, {label: '1.4.3.-4'});
  it('should have correct values for properties', () => {
    assertEquals(mf.BITS, 8);
    assertEquals(mf.CARDINALITY, 256);
    assertEquals(mf.MAX_VALUE, 491520);
    assertEquals(mf.MIN_VALUE, 4);
    assertEquals(mf.EPSILON, 4);
  });
});

describe('1.4.3.15', () => {
  // This system maps from 0 to (almost) 1, which is the first
  // number that rounds up to Infinity.
  const mf = new Minifloat(1, 4, 3, 15);
  standardTests(mf, {label: '1.4.3.15'});
  it('should have correct values for properties', () => {
    assertEquals(mf.BITS, 8);
    assertEquals(mf.CARDINALITY, 256);
    assertEquals(mf.MAX_VALUE, 0.9375);
    assertEquals(mf.MIN_VALUE, 2 ** -17);
    assertEquals(mf.EPSILON, 1 / 16);
  });
});

describe('1.4.3.16', () => {
  // This system maps from 0 to (almost) 0.5.
  const mf = new Minifloat(1, 4, 3, 16);
  standardTests(mf, {label: '1.4.3.16'});
  it('should have correct values for properties', () => {
    assertEquals(mf.BITS, 8);
    assertEquals(mf.CARDINALITY, 256);
    assertEquals(mf.MAX_VALUE, 0.46875);
    assertEquals(mf.MIN_VALUE, 2 ** -18);
    assertEquals(mf.EPSILON, 1 / 32);
  });
});

describe('1.3.2', () => {
  const mf = new Minifloat(1, 3, 2);
  standardTests(mf, {label: '1.3.2'});
  it('should have correct values for properties', () => {
    assertEquals(mf.BITS, 6);
    assertEquals(mf.CARDINALITY, 64);
    assertEquals(mf.MAX_VALUE, 14);
    assertEquals(mf.MIN_VALUE, 1 / 16);
    assertEquals(mf.EPSILON, 0.25);
  });
});

describe('1.2.1', () => {
  const mf = new Minifloat(1, 2, 1);
  standardTests(mf, {label: '1.2.1'});
  it('should have correct values for properties', () => {
    assertEquals(mf.BITS, 4);
    assertEquals(mf.CARDINALITY, 16);
    assertEquals(mf.MAX_VALUE, 3);
    assertEquals(mf.MIN_VALUE, 0.5);
    assertEquals(mf.EPSILON, 0.5);
  });
});

describe('0.1.1', () => {
  const mf = new Minifloat(0, 1, 1);
  standardTests(mf, {label: '0.1.1'});
  it('should round to Infinity and NaN appropriately', () => {
    assertEquals(mf.round(-100, RoundingRule.Ceiling), 0);
    assertEquals(mf.round(-1), NaN);
    assertEquals(mf.round(-0.501), NaN);
    assertEquals(mf.round(-0.5, RoundingRule.NearestAway), NaN);
    assertEquals(mf.round(-0.5), 0);
    assertEquals(mf.round(-0.001, RoundingRule.Floor), NaN);
    assertEquals(mf.round(-0), 0);
    assertEquals(mf.round(1), 1);
    assertEquals(mf.round(1.499), 1);
    assertEquals(mf.round(1.5), Infinity);
    assertEquals(mf.round(1000, RoundingRule.Floor), 1);
    assertEquals(mf.round(Infinity, RoundingRule.Floor), Infinity);
  });
  it('should have correct values for properties', () => {
    assertEquals(mf.BITS, 2);
    assertEquals(mf.CARDINALITY, 4);
    assertEquals(mf.MAX_VALUE, 1);
    assertEquals(mf.MIN_VALUE, 1);
    assertEquals(mf.EPSILON, Infinity);
  });
});

describe('0.5.5', () => {
  const mf = new Minifloat(0, 5, 5);
  standardTests(mf, {label: '0.5.5'});
  it('should round negative zero to zero under all rules', () => {
    assertEquals(mf.toBits(-0, RoundingRule.Ceiling), 0);
    assertEquals(mf.toBits(-0, RoundingRule.Truncate), 0);
    assertEquals(mf.toBits(-0, RoundingRule.NearestEven), 0);
    assertEquals(mf.toBits(-0, RoundingRule.NearestAway), 0);
    assertEquals(mf.toBits(-0, RoundingRule.Floor), 0);
  });

  it('should round negatives to zero or NaN', () => {
    const nan = 0x3ff;
    assertEquals(mf.toBits(-1e-100, RoundingRule.NearestEven), 0);
    assertEquals(mf.toBits(-1e-100, RoundingRule.NearestAway), 0);
    assertEquals(mf.toBits(-1e-100, RoundingRule.Truncate), 0);
    assertEquals(mf.toBits(-1e-100, RoundingRule.Ceiling), 0);
    assertEquals(mf.toBits(-1e-100, RoundingRule.Floor), nan);

    assertEquals(mf.toBits(-1, RoundingRule.NearestEven), nan);
    assertEquals(mf.toBits(-1, RoundingRule.NearestAway), nan);
    assertEquals(mf.toBits(-1, RoundingRule.Truncate), 0);
    assertEquals(mf.toBits(-1, RoundingRule.Ceiling), 0);
    assertEquals(mf.toBits(-1, RoundingRule.Floor), nan);

    assertEquals(mf.toBits(-1e100, RoundingRule.NearestEven), nan);
    assertEquals(mf.toBits(-1e100, RoundingRule.NearestAway), nan);
    assertEquals(mf.toBits(-1e100, RoundingRule.Truncate), 0);
    assertEquals(mf.toBits(-1e100, RoundingRule.Ceiling), 0);
    assertEquals(mf.toBits(-1e100, RoundingRule.Floor), nan);

    assertEquals(mf.toBits(-Infinity, RoundingRule.NearestEven), nan);
    assertEquals(mf.toBits(-Infinity, RoundingRule.NearestAway), nan);
    assertEquals(mf.toBits(-Infinity, RoundingRule.Truncate), 0);
    assertEquals(mf.toBits(-Infinity, RoundingRule.Ceiling), 0);
    assertEquals(mf.toBits(-Infinity, RoundingRule.Floor), nan);
  });
});

describe('1.7.8', () => {
  standardTests(new Minifloat(1, 7, 8), {label: '1.7.8'});
});

describe('1.8.23', () => {
  const mf = new Minifloat(1, 8, 23);
  standardTests(mf, {label: '1.8.23'});

  it('should round-trip random f32 values', () => {
    const ubuf = Uint32Array.of(0);
    const fbuf = new Float32Array(ubuf.buffer);
    for (let i = 0; i < (1 << 20); i++) {
      const bits = Math.floor(Math.random() * 0xffff_0000);
      ubuf[0] = bits;
      const float = fbuf[0];
      if (isNaN(float)) continue;
      assertEquals(mf.fromBits(bits), float, `fromBits(${bits})`);
      assertEquals(mf.toBits(float), bits, `toBits(${float})`);
    }
  });

  it('should be the same as fround() for random f64 values', () => {
    const ubuf = Uint32Array.of(0, 0);
    const fbuf = new Float64Array(ubuf.buffer);
    for (let i = 0; i < (1 << 20); i++) {
      ubuf[0] = Math.floor(Math.random() * 0x1_0000_0000);
      ubuf[1] = Math.floor(Math.random() * 0x1_0000_0000);
      const float = fbuf[0];
      if (isNaN(float)) continue;
      assertEquals(mf.round(float), Math.fround(float), `round(${float})`);
    }
  });
});

function standardTests(mf: MinifloatT, spec: TestSpec = {}) {
  if (spec.label) {
    it(`label should be ${spec.label}`, () => {
      assertEquals(mf.LABEL, spec.label);
    });
  }
  it(`should map 0.0 to zero bits`, () => {
    assertEquals(mf.toBits(0), 0);
  });
  it(`should map zero bits to 0.0`, () => {
    assertEquals(mf.fromBits(0), 0);
  });

  it(`SIGNED should be correct`, () => {
    assertEquals(mf.SIGNED, Object.is(mf.round(-0), -0));
  });

  if (mf.BITS <= 16) {
    it(`should round-trip all bit patterns`, () => {
      const seen = new Set<number>();
      for (let i = 0; i < mf.CARDINALITY; i++) {
        const float = mf.fromBits(i);
        if (isNaN(float)) continue;
        assert(!float || !seen.has(float), `duplicate float ${float}`);
        seen.add(float);
        assertEquals(mf.toBits(float), i, `roundtrip ${i} => ${float} => bits`);
      }
    });
  }

  if (mf.BITS <= 10) {
    it(`should round correctly`, () => {
      for (let i = 1; i < mf.CARDINALITY; i++) {
        const f1 = mf.fromBits(i - 1);
        const f2 = mf.fromBits(i);
        if (!Number.isFinite(f1) || !Number.isFinite(f2)) continue;
        const delta = (f2 - f1) / 256;
        for (let j = 1; j < 256; j++) {
          function toBits(r: RoundingRuleT): number {
            const result = mf.toBits(mid, r);
            assertEquals(mf.round(mid, r), mf.fromBits(result),
                         `round(${mid}, ${r}) == fromBits(toBits = ${result})`);
            return result;
          }
          const mid = f1 + delta * j;
          const negative = mid < 0;
          const lower = j < 128;
          const upper = j > 128;
          const label = `${mid} (${j}/256 from #${i - 1} to #${i})`;
          assertEquals(toBits(RoundingRule.Truncate), i - 1, `${label} truncate`);
          if (negative) {
            assertEquals(toBits(RoundingRule.Floor), i, `${label} floor`);
            assertEquals(toBits(RoundingRule.Ceiling), i - 1, `${label} ceiling`);
          } else {
            assertEquals(toBits(RoundingRule.Floor), i - 1, `${label} floor`);
            assertEquals(toBits(RoundingRule.Ceiling), i, `${label} ceiling`);
          }
          if (lower) {
            assertEquals(toBits(RoundingRule.NearestAway), i - 1, `${label} nearest away`);
            assertEquals(toBits(RoundingRule.NearestEven), i - 1, `${label} nearest even`);
          } else if (upper) {
            assertEquals(toBits(RoundingRule.NearestAway), i, `${label} nearest away`);
            assertEquals(toBits(RoundingRule.NearestEven), i, `${label} nearest even`);
          } else {
            assertEquals(toBits(RoundingRule.NearestAway), i, `${label} nearest away`);
            // midpoint
            if (i & 1) { // between 0 (i-1) and 1 (i) => nearest even is 0 (i-1)
              assertEquals(toBits(RoundingRule.NearestEven), i - 1, `${label} nearest even`);
            } else { // between 1 (i-1) and 2 (i) => nearest even is 2 (i)
              assertEquals(toBits(RoundingRule.NearestEven), i, `${label} nearest even`);
            }
          }
        }
      }
    });
  }

  it('should preserve NaN and Infinity when rounding', () => {
    for (let r = 0; r < 5; r++) {
      assertEquals(mf.round(Infinity, r), Infinity, `rounding mode ${r}`);
      assertEquals(mf.round(NaN, r), NaN, `rounding mode ${r}`);
      if (mf.SIGNED) assertEquals(mf.round(-Infinity, r), -Infinity, `rounding mode ${r}`);
    }
  });

  it('should round up to Infinity', () => {
    const inf = mf.toBits(Infinity);
    const max = mf.fromBits(inf - 1);
    const delta = max - mf.fromBits(inf - 2);
    assertEquals(mf.round(max + 0.001 * delta, RoundingRule.Ceiling), Infinity);
    assertEquals(mf.round(max + 0.499 * delta, RoundingRule.NearestEven), max);
    assertEquals(mf.round(max + 0.499 * delta, RoundingRule.NearestAway), max);
    assertEquals(mf.round(max + 0.5 * delta, RoundingRule.NearestEven), Infinity);
    assertEquals(mf.round(max + 0.5 * delta, RoundingRule.NearestAway), Infinity);
    assertEquals(mf.round(2 * max, RoundingRule.Floor), max);
    assertEquals(mf.round(2 * max, RoundingRule.Truncate), max);
  });

  if (mf.SIGNED) {
    it('should round down to -Infinity', () => {
      const inf = mf.toBits(-Infinity);
      const min = mf.fromBits(inf - 1);
      const delta = mf.fromBits(inf - 2) - min;
      assertEquals(mf.round(min - 0.001 * delta, RoundingRule.Floor), -Infinity);
      assertEquals(mf.round(min - 0.499 * delta, RoundingRule.NearestEven), min);
      assertEquals(mf.round(min - 0.499 * delta, RoundingRule.NearestAway), min);
      assertEquals(mf.round(min - 0.5 * delta, RoundingRule.NearestEven), -Infinity);
      assertEquals(mf.round(min - 0.5 * delta, RoundingRule.NearestAway), -Infinity);
      assertEquals(mf.round(2 * min, RoundingRule.Ceiling), min);
      assertEquals(mf.round(2 * min, RoundingRule.Truncate), min);
    });
  }
}

interface TestSpec {
  label?: string;
}

// Why is this type import not working?
type MinifloatT = InstanceType<typeof Minifloat>;
type RoundingRuleT = number;
