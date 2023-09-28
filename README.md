# Minifloat

Minifloat is a simple library for dealing with small floating point
numbers, extrapolating from the IEEE 754 standard as much as possible.

See [Minifloat on Wikipedia](https://en.wikipedia.org/wiki/Minifloat)
for more information.

It is capable of working with numbers up to single precision (i.e. 32
bits).

## Usage

To use this library, you must instantiate a `Minifloat` object (see
the API Reference below for details on arguments).

```ts
import {Minifloat} from 'minifloat';
const mf = new Minifloat(1, 4, 3);
console.log(mf.fromBits(48)); // logs 0.5
console.log(mf.toBits(0.5));  // logs 48
```

Note that this library is implemented in WASM.  For now, the compiled
module is inlined directly as a base64 string for maximum ease of use,
but this does exclude it from use in environments where compiling WASM
is not allowed, and it is slightly less efficient than loading the
file directly (though at 1.5k of WASM, it's not likely to matter).

Note also that this library is distributed as an ESM module that makes
use of top-level `await` (to load the WASM).  As a result, it _cannot_
be used synchronously in CommonJS modules (i.e. you cannot
`require('minifloat')` in Node, or else you'll get an error:
`[ERR_PACKAGE_PATH_NOT_EXPORTED]: no "exports" main defined`).
Instead, it must be `import`ed (though note that CommonJS can use
`import('minifloat').then(...)` if necessary).

## API Reference

### Minifloat constructor

`new Minifloat(signBits, exponentBits, significandBits, exponentBias?, defaultRoundingRule?)`

Args:

* `signBits`: must be 0 or 1, determines whether floats are signed or not
* `exponentBits`: must be between 1 and 8, determines the range
* `significandBits`: must be between 1 and 23, determines the precision
* `exponentBias?`: a signed integer used to shift the exponent; must be
  such that the minimum exponent is at least -1023 and the maximum
  exponent is at most 1024; by default, it's half-way between `0` and
  `(1 << exponentBits) - 1`, rounded down
* `defaultRoundingRule?`: an element of the `RoundingRule` enum
  indicating how `toBits` will round by default (defaults to
  `NearestEven`)

Returns:

* a new `Minifloat` instance

Note that instances are returned frozen.

### Minifloat#toBits

`mf.toBits(float, rounding?)`

Args:

* `float`: a floating point number
* `rounding?`: an optional rounding rule, with default set by the instance

Returns:

* an unsigned integer with the bits, applying any necessary rounding to
  get a number representable by this system

### Minifloat#fromBits

`mf.fromBits(bits)`

Args:

* `bits`: an unsigned integer with bits to unpack

Returns:

* a double-precision floating point number

### Minifloat#round

`mf.round(float, rounding?)`

Args:

* `float`: a floating point number
* `rounding?`: an optional rounding rule, with default set by the instance

Returns:

* a rounded approximation of the given float that's representable in this
  system

### Minifloat#LABEL

String property containing the a human-readable label for this system.
The format is just the first 3 (or 4) constructor arguments separated
by decimal points.

### Minifloat#SIGNED

Boolean property indicating whether this minifloat system is signed.

### Minifloat#BITS

Number property indicating the total number of bits in the underlying
binary representation.

### Minifloat#CARDINALITY

Number property indicating the total number of representable numbers
in this minifloat system (counting each individual `NaN`, despite the
fact that we don't actually handle them individually).  Note that this
is always just `2 ** BITS`.

### Minifloat#MAX_VALUE

Number property indicating the maximum representable finite number in
this minifloat system.  This is just `fromBits(toBits(Infinity) - 1)`.

### Minifloat#MIN_VALUE

Number property indicating the minimum representable positive number
in this minifloat system.  This is just `fromBits(1)`.

### Minifloat#EPISLON

**NOTE: This is probably not what you're looking for!  Please see
[this stack overflow](https://stackoverflow.com/questions/51019475/what-are-the-possible-usage-scenarios-for-number-epsilon#answer-56967003)
answer for an explanation of why `EPSILON` is not actually all that
useful.**

Number property indicating the difference between 1 and the
next-larger representable number.  If 1 is not representable, then
either `MIN_VALUE` or `MAX_VALUE` is used instead, depending on which
is closest to 1.

This is included as an analogue to `Number.EPSILON`, but generally
should not be used for anything.

### RoundingRule

An enum representing the five possible rounding rules, which fall into
two categories.

The first two rules round to the nearest representable value.  They
differ only in how ties are broken, when an input is exactly halfway
between two values:

* `NearestEven`: the default rule, breaks ties toward evens (i.e. the
  value whose least significant binary digit is zero)
* `NearestAway`: breaks ties away from zero

The other three rules are directed roundings.  They will always round
in the same direction, and will never return a result in the other
direction.  This can in some cases return results quite far from the
input:

* `Trucate`: rounds toward zero
* `Ceiling`: rounds up, toward +Infinity
* `Floor`: rounds down, toward -Infinity

#### Unsigned floats and negative values

When rounding negative values to an unsigned float, the result will
always be either `NaN` or `+0`.  If the signed result would have been
`-0`, we treat it as `+0`, since IEEE 754 considers these values
equal.

We take a strict approach with the directed rounding rules, since they
must never give a result in the "wrong" direction.  For `Ceiling` and
`Truncate`, we return `+0` for all negative inputs.  For `Floor`, we
return `NaN` for all negative inputs except `-0`, which rounds to `+0`
per the previous paragraph.

For the "nearest" roundings, we treat the rounding as if a sign bit
were available.  If the signed result would round up to `-0` then we
return `+0`.  Otherwise, we return `NaN`.

For use cases where it's desirable to round _all_ negative values to
zero (rather than `NaN`), it's recommended to call `Math.max(0, arg)`
before calling `round` or `toBits`, which transforms all negative
`arg`s to zero ahead of time.  Note that `round(Math.max(0, NaN))`
will still return `NaN`.


## License

Minifloat is Copyright 2023 Stephen Hicks, and is released under the MIT license.
