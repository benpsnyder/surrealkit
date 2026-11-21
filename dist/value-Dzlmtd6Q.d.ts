import { Schema, Brand } from 'effect';
import { Decimal as Decimal$1, Uuid as Uuid$1, DateTime, RecordId, Duration, Geometry, Range, Table, FileRef } from 'surrealdb';

/**
 * `decimal` and the `number` kind.
 *
 * SurrealDB decimals are 96-bit-mantissa decimals with at most 28 fractional
 * digits (measured on 3.2.4): a larger mantissa is a server error the SDK
 * never resolves (the query hangs), and extra fractional digits are rounded
 * away silently (`0.00000000000000000000000000001` reads back as `0`). The
 * codec rejects both before a value reaches the wire.
 *
 * The SDK's `Decimal` string constructor is permissive (`new Decimal("abc")`
 * is zero, and `new Decimal("+1.5")` is 0.5), so text is never handed to it:
 * {@link decimalFromString} parses the sign, digits and exponent itself and
 * builds the SDK value from exact integers. A decimal never passes through a
 * JS number.
 */

/** Largest decimal mantissa: `2^96 - 1`. */
declare const DECIMAL_MAX_MANTISSA: bigint;
/** Most fractional digits a decimal keeps. */
declare const DECIMAL_MAX_SCALE = 28;
/**
 * Parses decimal text (`-1.50`, `+2`, `1e10`, `.5e1`) into an SDK `Decimal`.
 * The sign, digits and exponent are read here and the value is built from
 * exact integers (`new Decimal([int, frac, scale])`), never from the SDK's
 * permissive string parser; then the SurrealDB range is checked.
 *
 * @throws RangeError for malformed or out-of-range text.
 */
declare const decimalFromString: (text: string) => Decimal$1;
/** `decimal`: the SDK `Decimal` class, range-checked; never a JS number. */
declare const Decimal: Schema.declareConstructor<Decimal$1, Decimal$1, readonly [], Decimal$1>;
/** A `decimal` literal kind such as `10dec`: exactly that value. */
declare const DecimalLiteral: <const V extends string>(value: V) => Schema.declareConstructor<Decimal$1, Decimal$1, readonly [], Decimal$1>;
/**
 * The `number` kind: any SurrealQL number. The SDK returns ints as
 * `number | bigint`, floats as `number` and decimals as `Decimal`; the
 * original numeric tag of an integral value is not recoverable, so none is
 * claimed.
 */
declare const SurrealNumber: Schema.declareConstructor<number | bigint | Decimal$1, number | bigint | Decimal$1, readonly [], number | bigint | Decimal$1>;

/**
 * SurrealQL `int` is a signed 64-bit integer. The SDK's CBOR decoder hands it
 * back as a JS `number` when it fits and as a `bigint` otherwise, with one
 * lossy edge (measured against surrealdb.js 2.1.1 and SurrealDB 3.2.4):
 *
 * - `0 … 2^53` decode as exact numbers; `2^53 + 1 … 2^63 - 1` as bigints.
 * - `-1 … -2^53` decode as exact numbers; `-(2^53 + 2) … -2^63` as bigints.
 * - `-(2^53 + 1)` decodes as the number `-2^53`: already rounded.
 * - Encoding a bigint outside int64 is not rejected by the SDK; the server
 *   wraps it (`2^63` arrives as `-2^63`).
 *
 * Two profiles follow from that:
 *
 * - `Int` (`int: "safe-number"`, the default): a `number` that is a safe
 *   integer. Anything beyond `±(2^53 - 1)` fails loudly in both directions.
 * - `Int64` (`int: "bigint"`): a branded `bigint` checked against the int64
 *   range in both directions. Numbers are accepted only where the decoder is
 *   exact, so `-2^53` (ambiguous with a rounded `-(2^53 + 1)`) fails loudly.
 */

declare const INT64_MIN: bigint;
declare const INT64_MAX: bigint;
/** The integer profile of a generated module or field. */
type IntProfile = 'safe-number' | 'bigint';
/**
 * `int`, `int: "safe-number"` profile: a JS `number` that must be a safe
 * integer. Values beyond `±(2^53 - 1)` fail instead of losing precision.
 */
declare const Int: Schema.declareConstructor<number, number, readonly [], number>;
type Int = typeof Int.Type;
/**
 * Checks a bigint against the int64 range and brands it.
 *
 * @throws RangeError when the value is outside int64.
 */
declare const int64: (value: bigint) => Int64;
/** A signed 64-bit integer. */
type Int64 = bigint & Brand.Brand<'Int64'>;
/**
 * `int`, `int: "bigint"` profile: a branded signed 64-bit `bigint`. Decodes
 * the SDK's `number | bigint`, always encodes a `bigint` within int64.
 */
declare const Int64: Schema.declareConstructor<Int64, number | bigint, readonly [], Int64>;
/**
 * An `int` literal kind under the `bigint` profile, e.g. `-5` in
 * `-5 | 0 | 1`. Accepts the SDK's `number | bigint` spelling of exactly that
 * value. (Under the `safe-number` profile, use `Schema.Literal(-5)`.)
 */
declare const Int64Literal: <const V extends string>(value: V) => Schema.declareConstructor<Int64, number | bigint, readonly [], Int64>;
/** Picks the integer codec for a profile. */
declare const intFor: (profile: IntProfile) => Schema.declareConstructor<number, number, readonly [], number> | Schema.declareConstructor<Int64, number | bigint, readonly [], Int64>;

/** `float`, `uuid`, `bytes`, and kinds with no SDK value representation. */

/** Replaces lone surrogates with U+FFFD, as UTF-8 transport would. */
declare const toWellFormed: (text: string) => string;
/**
 * `string`: a JS string SurrealDB can store. SurrealDB strings are UTF-8, so
 * a JS string containing a lone surrogate cannot be represented: the SDK's
 * CBOR encoder would silently replace it with U+FFFD. Such strings fail here
 * instead.
 */
declare const SurrealString: Schema.declareConstructor<string, string, readonly [], string>;
/** A native IEEE-754 float, including NaN, infinities, signed zero and subnormals. */
declare const Float: Schema.declareConstructor<number, number, readonly [], number>;
/** `uuid`: the SDK `Uuid` class (any version). */
declare const Uuid: Schema.declareConstructor<Uuid$1, Uuid$1, readonly [], Uuid$1>;
/**
 * `bytes`: a `Uint8Array`. The SDK decodes bytes as an `ArrayBuffer`, which
 * is accepted and copied into a `Uint8Array`; encoding sends the
 * `Uint8Array`, which the SDK writes as CBOR bytes.
 */
declare const Bytes: Schema.declareConstructor<Uint8Array<ArrayBufferLike>, ArrayBuffer | Uint8Array<ArrayBufferLike>, readonly [], Uint8Array<ArrayBufferLike>>;
/**
 * A kind no SDK value can represent (`regex`, `function`). Always fails, with
 * the reason, in both directions.
 */
declare const Unsupported: <const K extends string>(kind: K) => Schema.declareConstructor<never, never, readonly [], never>;

/**
 * An open native value for FLEXIBLE objects and SCHEMALESS fields.
 * The SDK also accepts a JS `Date` on writes.
 */
type SurrealValue = null | boolean | number | bigint | string | DateTime | RecordId | Duration | Decimal$1 | Uuid$1 | Geometry | Range<unknown, unknown> | Date | Table | FileRef | Uint8Array | ReadonlySet<SurrealValue> | ReadonlyArray<SurrealValue> | {
    readonly [key: string]: SurrealValue;
};
declare const SurrealValue: Schema.Codec<SurrealValue>;
/** A member of a MERGE object: NONE removes a key, including in a nested patch. */
type SurrealMergeValue = SurrealValue | undefined | {
    readonly [key: string]: SurrealMergeValue;
};
declare const SurrealMergeValue: Schema.Codec<SurrealMergeValue>;
/** An open value in SurrealDB's JSON world (HTTP `/sql`). */
type SurrealJsonValue = null | boolean | number | string | ReadonlyArray<SurrealJsonValue> | {
    readonly [key: string]: SurrealJsonValue;
};
declare const SurrealJsonValue: Schema.Codec<SurrealJsonValue>;

export { Bytes as B, DECIMAL_MAX_MANTISSA as D, Float as F, Int64 as I, SurrealValue as S, Unsupported as U, DECIMAL_MAX_SCALE as a, Decimal as b, DecimalLiteral as c, INT64_MAX as d, INT64_MIN as e, Int as f, Int64Literal as g, type IntProfile as h, SurrealString as i, SurrealJsonValue as j, SurrealMergeValue as k, SurrealNumber as l, Uuid as m, decimalFromString as n, int64 as o, intFor as p, toWellFormed as t };
