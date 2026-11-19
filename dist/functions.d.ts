import { E as Expr, a as Primitive, F as FloatOrDecimalOf, O as OrNone, b as ParamsOfAll } from './arithmetic-Cl3Mmdmr.js';
import { Schema } from 'effect';
import * as surrealdb from 'surrealdb';
import { Decimal, DateTime, Duration, Uuid, RecordId, Geometry, Range } from 'surrealdb';
import { P as Params, C as Codec, N as NoParams } from './statement-C2GeTaZ5.js';
import { y as SurrealValue, I as Int64 } from './value-Zktp5N5S.js';

/**
 * What the generated built-in functions share: the argument types each
 * argument kind accepts, the codecs of the open kinds, and the one builder
 * every generated function calls.
 *
 * An argument is an expression whose stored (encoded) type fits the kind,
 * or a primitive (or an array of primitives) inlined with `literal`, so every
 * value still enters as a typed binding or a validated constant.
 */

/** `any`: any value, or NONE. */
declare const AnyCodec: Schema.UndefinedOr<Schema.Codec<SurrealValue, SurrealValue, never, never>>;
/** `object`: an open object. */
declare const ObjectCodec: Schema.$Record<Schema.String, Schema.Codec<SurrealValue, SurrealValue, never, never>>;
/** `array`: an array of any values. */
declare const ArrayCodec: Schema.$Array<Schema.UndefinedOr<Schema.Codec<SurrealValue, SurrealValue, never, never>>>;
/**
 * The stored type an argument of each kind accepts. `int` and `number`
 * accept a `bigint` too: the engine reads an int64 as an int.
 */
interface In {
    readonly any: unknown;
    readonly string: string;
    readonly int: number | bigint;
    readonly int64: number | bigint;
    readonly float: number;
    readonly number: number | bigint | Decimal;
    readonly decimal: Decimal;
    readonly bool: boolean;
    readonly datetime: DateTime;
    readonly duration: Duration;
    readonly uuid: Uuid;
    readonly bytes: Uint8Array | ArrayBuffer;
    readonly record: RecordId;
    readonly object: {
        readonly [key: string]: unknown;
    };
    readonly geometry: Geometry;
    readonly range: Range<unknown, unknown>;
    readonly array: ReadonlyArray<unknown>;
}
type InlineItem<I> = unknown extends I ? Primitive : Extract<I, Primitive>;
/** The constants an argument of stored type `E` may be written as. */
type Inline<E> = unknown extends E ? Primitive | ReadonlyArray<Primitive> : Extract<E, Primitive> | (E extends ReadonlyArray<infer I> ? ReadonlyArray<InlineItem<I>> : never);
/**
 * An argument whose stored type is `E`: an expression whose codec encodes
 * to it, or a constant to inline.
 */
type Arg<E> = Expr<Schema.Codec<unknown, E, never, never>, Params> | Inline<E>;
/** The codec of argument `A`, or `D` when it is inlined. */
type CodecOfArg<A, D extends Codec> = A extends Expr<infer S, Params> ? S : D;
/** The codec of an element of an array codec, or NONE; `any` if unknown. */
type ItemCodec<S extends Codec> = S['Encoded'] extends ReadonlyArray<unknown> ? S extends {
    readonly value: infer I extends Codec;
} ? OrNone<I> : typeof AnyCodec : typeof AnyCodec;
/** The stored type argument `A` holds: its codec's, or the constant's own. */
type EncodedOfArg<A> = A extends Expr<infer S, Params> ? S['Encoded'] : A;
/**
 * The codec of a `float|decimal:N` result over the arguments it names, `A`
 * (a union of their types): a float, or a float or a decimal when one of
 * them may hold a decimal.
 */
type FloatOrDecimalCodec<A> = FloatOrDecimalOf<EncodedOfArg<A>>;

/** `bool` */
declare const BoolCodec: Schema.Boolean;
/** `bytes` */
declare const BytesCodec: Schema.declareConstructor<Uint8Array<ArrayBufferLike>, ArrayBuffer | Uint8Array<ArrayBufferLike>, readonly [], Uint8Array<ArrayBufferLike>>;
/** `datetime` */
declare const DateTimeCodec: Schema.declareConstructor<surrealdb.DateTime, surrealdb.DateTime, readonly [], surrealdb.DateTime>;
/** `decimal` */
declare const DecimalCodec: Schema.declareConstructor<surrealdb.Decimal, surrealdb.Decimal, readonly [], surrealdb.Decimal>;
/** `duration` */
declare const DurationCodec: Schema.declareConstructor<surrealdb.Duration, surrealdb.Duration, readonly [], surrealdb.Duration>;
/** `float` */
declare const FloatCodec: Schema.declareConstructor<number, number, readonly [], number>;
/** `geometry` */
declare const GeometryCodec: Schema.declareConstructor<surrealdb.Geometry, surrealdb.Geometry, readonly [], surrealdb.Geometry>;
/** `int64` */
declare const Int64Codec: Schema.declareConstructor<Int64, number | bigint, readonly [], Int64>;
/** `int` */
declare const IntCodec: Schema.declareConstructor<number, number, readonly [], number>;
/** `number` */
declare const NumberCodec: Schema.declareConstructor<number | bigint | surrealdb.Decimal, number | bigint | surrealdb.Decimal, readonly [], number | bigint | surrealdb.Decimal>;
/** `range` */
declare const RangeCodec: Schema.declareConstructor<surrealdb.Range<unknown, unknown>, surrealdb.Range<unknown, unknown>, readonly [], surrealdb.Range<unknown, unknown>>;
/** `record` */
declare const RecordCodec: Schema.declareConstructor<surrealdb.RecordId, surrealdb.RecordId, readonly [], surrealdb.RecordId>;
/** `string` */
declare const StringCodec: Schema.declareConstructor<string, string, readonly [], string>;
/** `uuid` */
declare const UuidCodec: Schema.declareConstructor<surrealdb.Uuid, surrealdb.Uuid, readonly [], surrealdb.Uuid>;
/** `array<array>` */
declare const ArrayOfArrayCodec: Schema.$Array<Schema.$Array<Schema.UndefinedOr<Schema.Codec<SurrealValue, SurrealValue, never, never>>>>;
/** `array<bool>` */
declare const ArrayOfBoolCodec: Schema.$Array<Schema.Boolean>;
/** `array<datetime>` */
declare const ArrayOfDateTimeCodec: Schema.$Array<Schema.declareConstructor<surrealdb.DateTime, surrealdb.DateTime, readonly [], surrealdb.DateTime>>;
/** `array<int>` */
declare const ArrayOfIntCodec: Schema.$Array<Schema.declareConstructor<number, number, readonly [], number>>;
/** `array<number>` */
declare const ArrayOfNumberCodec: Schema.$Array<Schema.declareConstructor<number | bigint | surrealdb.Decimal, number | bigint | surrealdb.Decimal, readonly [], number | bigint | surrealdb.Decimal>>;
/** `array<object>` */
declare const ArrayOfObjectCodec: Schema.$Array<Schema.$Record<Schema.String, Schema.Codec<SurrealValue, SurrealValue, never, never>>>;
/** `array<string>` */
declare const ArrayOfStringCodec: Schema.$Array<Schema.declareConstructor<string, string, readonly [], string>>;
/** `option<int>` */
declare const OptionOfIntCodec: Schema.UndefinedOr<Schema.declareConstructor<number, number, readonly [], number>>;
/** `option<number>` */
declare const OptionOfNumberCodec: Schema.UndefinedOr<Schema.declareConstructor<number | bigint | surrealdb.Decimal, number | bigint | surrealdb.Decimal, readonly [], number | bigint | surrealdb.Decimal>>;
/** `option<string>` */
declare const OptionOfStringCodec: Schema.UndefinedOr<Schema.declareConstructor<string, string, readonly [], string>>;
/** `option<array<number>>` */
declare const OptionOfArrayOfNumberCodec: Schema.UndefinedOr<Schema.$Array<Schema.declareConstructor<number | bigint | surrealdb.Decimal, number | bigint | surrealdb.Decimal, readonly [], number | bigint | surrealdb.Decimal>>>;

/**
 * `array::add(array: array, value: any) -> array`
 *
 * SurrealDB 3 and 4.
 */
declare const add$1: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["any"]>>(array: A0, value: A1) => Expr<typeof ArrayCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::all(array: array, predicate?: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const all: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["any"]> = never>(array: A0, predicate?: A1) => Expr<typeof BoolCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::any(array: array, predicate?: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const any: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["any"]> = never>(array: A0, predicate?: A1) => Expr<typeof BoolCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::append(array: array, value: any) -> array`
 *
 * SurrealDB 3 and 4.
 */
declare const append: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["any"]>>(array: A0, value: A1) => Expr<typeof ArrayCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::at(array: array, index: int) -> item:0`
 *
 * SurrealDB 3 and 4.
 */
declare const at: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["int"]>>(array: A0, index: A1) => Expr<ItemCodec<CodecOfArg<A0, typeof ArrayCodec>>, ParamsOfAll<A0 | A1>>;
/**
 * `array::boolean_and(left: array, right: array) -> array<bool>`
 *
 * SurrealDB 3 and 4.
 */
declare const booleanAnd: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["array"]>>(left: A0, right: A1) => Expr<typeof ArrayOfBoolCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::boolean_not(array: array) -> array<bool>`
 *
 * SurrealDB 3 and 4.
 */
declare const booleanNot: <const A0 extends Arg<In["array"]>>(array: A0) => Expr<typeof ArrayOfBoolCodec, ParamsOfAll<A0>>;
/**
 * `array::boolean_or(left: array, right: array) -> array<bool>`
 *
 * SurrealDB 3 and 4.
 */
declare const booleanOr: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["array"]>>(left: A0, right: A1) => Expr<typeof ArrayOfBoolCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::boolean_xor(left: array, right: array) -> array<bool>`
 *
 * SurrealDB 3 and 4.
 */
declare const booleanXor: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["array"]>>(left: A0, right: A1) => Expr<typeof ArrayOfBoolCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::clump(array: array, size: int) -> array<array>`
 *
 * SurrealDB 3 and 4.
 */
declare const clump: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["int"]>>(array: A0, size: A1) => Expr<typeof ArrayOfArrayCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::combine(left: array, right: array) -> array<array>`
 *
 * SurrealDB 3 and 4.
 */
declare const combine: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["array"]>>(left: A0, right: A1) => Expr<typeof ArrayOfArrayCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::complement(left: array, right: array) -> same:0`
 *
 * SurrealDB 3 and 4.
 */
declare const complement: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["array"]>>(left: A0, right: A1) => Expr<CodecOfArg<A0, typeof ArrayCodec>, ParamsOfAll<A0 | A1>>;
/**
 * `array::concat(...arrays: array) -> array`
 *
 * SurrealDB 3 and 4.
 */
declare const concat$1: <const A0 extends ReadonlyArray<Arg<In["array"]>>>(...arrays: A0) => Expr<typeof ArrayCodec, ParamsOfAll<A0[number]>>;
/**
 * `array::difference(left: array, right: array) -> array`
 *
 * SurrealDB 3 and 4.
 */
declare const difference: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["array"]>>(left: A0, right: A1) => Expr<typeof ArrayCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::distinct(array: array) -> same:0`
 *
 * SurrealDB 3 and 4.
 */
declare const distinct: <const A0 extends Arg<In["array"]>>(array: A0) => Expr<CodecOfArg<A0, typeof ArrayCodec>, ParamsOfAll<A0>>;
/**
 * `array::every(array: array, predicate?: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const every: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["any"]> = never>(array: A0, predicate?: A1) => Expr<typeof BoolCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::fill(array: array, value: any, start?: int, end?: int) -> array`
 *
 * SurrealDB 3 and 4.
 */
declare const fill: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["any"]>, const A2 extends Arg<In["int"]> = never, const A3 extends Arg<In["int"]> = never>(array: A0, value: A1, start?: A2, end?: A3) => Expr<typeof ArrayCodec, ParamsOfAll<A0 | A1 | A2 | A3>>;
/**
 * `array::filter(array: array, predicate: any) -> same:0`
 *
 * SurrealDB 3 and 4.
 */
declare const filter: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["any"]>>(array: A0, predicate: A1) => Expr<CodecOfArg<A0, typeof ArrayCodec>, ParamsOfAll<A0 | A1>>;
/**
 * `array::filter_index(array: array, predicate: any) -> array<int>`
 *
 * SurrealDB 3 and 4.
 */
declare const filterIndex: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["any"]>>(array: A0, predicate: A1) => Expr<typeof ArrayOfIntCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::find(array: array, predicate: any) -> item:0`
 *
 * SurrealDB 3 and 4.
 */
declare const find: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["any"]>>(array: A0, predicate: A1) => Expr<ItemCodec<CodecOfArg<A0, typeof ArrayCodec>>, ParamsOfAll<A0 | A1>>;
/**
 * `array::find_index(array: array, predicate: any) -> option<int>`
 *
 * SurrealDB 3 and 4.
 */
declare const findIndex: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["any"]>>(array: A0, predicate: A1) => Expr<typeof OptionOfIntCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::first(array: array) -> item:0`
 *
 * SurrealDB 3 and 4.
 */
declare const first: <const A0 extends Arg<In["array"]>>(array: A0) => Expr<ItemCodec<CodecOfArg<A0, typeof ArrayCodec>>, ParamsOfAll<A0>>;
/**
 * `array::flatten(array: array) -> array`
 *
 * SurrealDB 3 and 4.
 */
declare const flatten: <const A0 extends Arg<In["array"]>>(array: A0) => Expr<typeof ArrayCodec, ParamsOfAll<A0>>;
/**
 * `array::group(array: array) -> array`
 *
 * SurrealDB 3 and 4.
 */
declare const group$1: <const A0 extends Arg<In["array"]>>(array: A0) => Expr<typeof ArrayCodec, ParamsOfAll<A0>>;
/**
 * `array::includes(array: array, value?: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const includes: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["any"]> = never>(array: A0, value?: A1) => Expr<typeof BoolCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::index_of(array: array, value: any) -> option<int>`
 *
 * SurrealDB 3 and 4.
 */
declare const indexOf: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["any"]>>(array: A0, value: A1) => Expr<typeof OptionOfIntCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::insert(array: array, value: any, index?: int) -> array`
 *
 * SurrealDB 3 and 4.
 */
declare const insert: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["any"]>, const A2 extends Arg<In["int"]> = never>(array: A0, value: A1, index?: A2) => Expr<typeof ArrayCodec, ParamsOfAll<A0 | A1 | A2>>;
/**
 * `array::intersect(left: array, right: array) -> same:0`
 *
 * SurrealDB 3 and 4.
 */
declare const intersect: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["array"]>>(left: A0, right: A1) => Expr<CodecOfArg<A0, typeof ArrayCodec>, ParamsOfAll<A0 | A1>>;
/**
 * `array::is_empty(array: array) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isEmpty$1: <const A0 extends Arg<In["array"]>>(array: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `array::join(array: array, separator: string) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const join$1: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["string"]>>(array: A0, separator: A1) => Expr<typeof StringCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::last(array: array) -> item:0`
 *
 * SurrealDB 3 and 4.
 */
declare const last: <const A0 extends Arg<In["array"]>>(array: A0) => Expr<ItemCodec<CodecOfArg<A0, typeof ArrayCodec>>, ParamsOfAll<A0>>;
/**
 * `array::len(array: array) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const len$3: <const A0 extends Arg<In["array"]>>(array: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `array::logical_and(left: array, right: array) -> array`
 *
 * SurrealDB 3 and 4.
 */
declare const logicalAnd: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["array"]>>(left: A0, right: A1) => Expr<typeof ArrayCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::logical_or(left: array, right: array) -> array`
 *
 * SurrealDB 3 and 4.
 */
declare const logicalOr: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["array"]>>(left: A0, right: A1) => Expr<typeof ArrayCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::logical_xor(left: array, right: array) -> array`
 *
 * SurrealDB 3 and 4.
 */
declare const logicalXor: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["array"]>>(left: A0, right: A1) => Expr<typeof ArrayCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::matches(array: array, value: any) -> array<bool>`
 *
 * SurrealDB 3 and 4.
 */
declare const matches$1: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["any"]>>(array: A0, value: A1) => Expr<typeof ArrayOfBoolCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::max(array: array) -> item:0`
 *
 * SurrealDB 3 and 4.
 */
declare const max$3: <const A0 extends Arg<In["array"]>>(array: A0) => Expr<ItemCodec<CodecOfArg<A0, typeof ArrayCodec>>, ParamsOfAll<A0>>;
/**
 * `array::min(array: array) -> item:0`
 *
 * SurrealDB 3 and 4.
 */
declare const min$2: <const A0 extends Arg<In["array"]>>(array: A0) => Expr<ItemCodec<CodecOfArg<A0, typeof ArrayCodec>>, ParamsOfAll<A0>>;
/**
 * `array::pop(array: array) -> item:0`
 *
 * SurrealDB 3 and 4.
 */
declare const pop: <const A0 extends Arg<In["array"]>>(array: A0) => Expr<ItemCodec<CodecOfArg<A0, typeof ArrayCodec>>, ParamsOfAll<A0>>;
/**
 * `array::prepend(array: array, value: any) -> array`
 *
 * SurrealDB 3 and 4.
 */
declare const prepend: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["any"]>>(array: A0, value: A1) => Expr<typeof ArrayCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::push(array: array, value: any) -> array`
 *
 * SurrealDB 3 and 4.
 */
declare const push: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["any"]>>(array: A0, value: A1) => Expr<typeof ArrayCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::range(start: int, count?: int) -> array<int>`
 *
 * SurrealDB 3 and 4.
 */
declare const range$1: <const A0 extends Arg<In["int"]>, const A1 extends Arg<In["int"]> = never>(start: A0, count?: A1) => Expr<typeof ArrayOfIntCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::remove(array: array, index: int) -> same:0`
 *
 * SurrealDB 3 and 4.
 */
declare const remove$1: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["int"]>>(array: A0, index: A1) => Expr<CodecOfArg<A0, typeof ArrayCodec>, ParamsOfAll<A0 | A1>>;
/**
 * `array::repeat(value: any, count: int) -> array`
 *
 * SurrealDB 3 and 4.
 */
declare const repeat$1: <const A0 extends Arg<In["any"]>, const A1 extends Arg<In["int"]>>(value: A0, count: A1) => Expr<typeof ArrayCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::reverse(array: array) -> same:0`
 *
 * SurrealDB 3 and 4.
 */
declare const reverse$1: <const A0 extends Arg<In["array"]>>(array: A0) => Expr<CodecOfArg<A0, typeof ArrayCodec>, ParamsOfAll<A0>>;
/**
 * `array::sequence(start: int, count?: int) -> array<int>`
 *
 * SurrealDB 3 and 4.
 */
declare const sequence: <const A0 extends Arg<In["int"]>, const A1 extends Arg<In["int"]> = never>(start: A0, count?: A1) => Expr<typeof ArrayOfIntCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::shuffle(array: array) -> same:0`
 *
 * SurrealDB 3 and 4.
 */
declare const shuffle: <const A0 extends Arg<In["array"]>>(array: A0) => Expr<CodecOfArg<A0, typeof ArrayCodec>, ParamsOfAll<A0>>;
/**
 * `array::slice(array: array, start?: int, length?: int) -> same:0`
 *
 * SurrealDB 3 and 4.
 */
declare const slice$1: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["int"]> = never, const A2 extends Arg<In["int"]> = never>(array: A0, start?: A1, length?: A2) => Expr<CodecOfArg<A0, typeof ArrayCodec>, ParamsOfAll<A0 | A1 | A2>>;
/**
 * `array::some(array: array, predicate?: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const some: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["any"]> = never>(array: A0, predicate?: A1) => Expr<typeof BoolCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::sort(array: array, order?: any) -> same:0`
 *
 * SurrealDB 3 and 4.
 */
declare const sort: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["any"]> = never>(array: A0, order?: A1) => Expr<CodecOfArg<A0, typeof ArrayCodec>, ParamsOfAll<A0 | A1>>;
/**
 * `array::sort::asc(array: array) -> same:0`
 *
 * SurrealDB 3 and 4.
 */
declare const sortAsc: <const A0 extends Arg<In["array"]>>(array: A0) => Expr<CodecOfArg<A0, typeof ArrayCodec>, ParamsOfAll<A0>>;
/**
 * `array::sort::desc(array: array) -> same:0`
 *
 * SurrealDB 3 and 4.
 */
declare const sortDesc: <const A0 extends Arg<In["array"]>>(array: A0) => Expr<CodecOfArg<A0, typeof ArrayCodec>, ParamsOfAll<A0>>;
/**
 * `array::sort_lexical(array: array, order?: any) -> same:0`
 *
 * SurrealDB 3 and 4.
 */
declare const sortLexical: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["any"]> = never>(array: A0, order?: A1) => Expr<CodecOfArg<A0, typeof ArrayCodec>, ParamsOfAll<A0 | A1>>;
/**
 * `array::sort_natural(array: array, order?: any) -> same:0`
 *
 * SurrealDB 3 and 4.
 */
declare const sortNatural: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["any"]> = never>(array: A0, order?: A1) => Expr<CodecOfArg<A0, typeof ArrayCodec>, ParamsOfAll<A0 | A1>>;
/**
 * `array::sort_natural_lexical(array: array, order?: any) -> same:0`
 *
 * SurrealDB 3 and 4.
 */
declare const sortNaturalLexical: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["any"]> = never>(array: A0, order?: A1) => Expr<CodecOfArg<A0, typeof ArrayCodec>, ParamsOfAll<A0 | A1>>;
/**
 * `array::swap(array: array, from: int, to: int) -> same:0`
 *
 * SurrealDB 3 and 4.
 */
declare const swap: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["int"]>, const A2 extends Arg<In["int"]>>(array: A0, from: A1, to: A2) => Expr<CodecOfArg<A0, typeof ArrayCodec>, ParamsOfAll<A0 | A1 | A2>>;
/**
 * `array::transpose(array: array) -> array<array>`
 *
 * SurrealDB 3 and 4.
 */
declare const transpose: <const A0 extends Arg<In["array"]>>(array: A0) => Expr<typeof ArrayOfArrayCodec, ParamsOfAll<A0>>;
/**
 * `array::union(left: array, right: array) -> array`
 *
 * SurrealDB 3 and 4.
 */
declare const union: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["array"]>>(left: A0, right: A1) => Expr<typeof ArrayCodec, ParamsOfAll<A0 | A1>>;
/**
 * `array::windows(array: array, size: int) -> array<array>`
 *
 * SurrealDB 3 and 4.
 */
declare const windows: <const A0 extends Arg<In["array"]>, const A1 extends Arg<In["int"]>>(array: A0, size: A1) => Expr<typeof ArrayOfArrayCodec, ParamsOfAll<A0 | A1>>;

declare const array$1_all: typeof all;
declare const array$1_any: typeof any;
declare const array$1_append: typeof append;
declare const array$1_at: typeof at;
declare const array$1_booleanAnd: typeof booleanAnd;
declare const array$1_booleanNot: typeof booleanNot;
declare const array$1_booleanOr: typeof booleanOr;
declare const array$1_booleanXor: typeof booleanXor;
declare const array$1_clump: typeof clump;
declare const array$1_combine: typeof combine;
declare const array$1_complement: typeof complement;
declare const array$1_difference: typeof difference;
declare const array$1_distinct: typeof distinct;
declare const array$1_every: typeof every;
declare const array$1_fill: typeof fill;
declare const array$1_filter: typeof filter;
declare const array$1_filterIndex: typeof filterIndex;
declare const array$1_find: typeof find;
declare const array$1_findIndex: typeof findIndex;
declare const array$1_first: typeof first;
declare const array$1_flatten: typeof flatten;
declare const array$1_includes: typeof includes;
declare const array$1_indexOf: typeof indexOf;
declare const array$1_insert: typeof insert;
declare const array$1_intersect: typeof intersect;
declare const array$1_last: typeof last;
declare const array$1_logicalAnd: typeof logicalAnd;
declare const array$1_logicalOr: typeof logicalOr;
declare const array$1_logicalXor: typeof logicalXor;
declare const array$1_pop: typeof pop;
declare const array$1_prepend: typeof prepend;
declare const array$1_push: typeof push;
declare const array$1_sequence: typeof sequence;
declare const array$1_shuffle: typeof shuffle;
declare const array$1_some: typeof some;
declare const array$1_sort: typeof sort;
declare const array$1_sortAsc: typeof sortAsc;
declare const array$1_sortDesc: typeof sortDesc;
declare const array$1_sortLexical: typeof sortLexical;
declare const array$1_sortNatural: typeof sortNatural;
declare const array$1_sortNaturalLexical: typeof sortNaturalLexical;
declare const array$1_swap: typeof swap;
declare const array$1_transpose: typeof transpose;
declare const array$1_union: typeof union;
declare const array$1_windows: typeof windows;
declare namespace array$1 {
  export { add$1 as add, array$1_all as all, array$1_any as any, array$1_append as append, array$1_at as at, array$1_booleanAnd as booleanAnd, array$1_booleanNot as booleanNot, array$1_booleanOr as booleanOr, array$1_booleanXor as booleanXor, array$1_clump as clump, array$1_combine as combine, array$1_complement as complement, concat$1 as concat, array$1_difference as difference, array$1_distinct as distinct, array$1_every as every, array$1_fill as fill, array$1_filter as filter, array$1_filterIndex as filterIndex, array$1_find as find, array$1_findIndex as findIndex, array$1_first as first, array$1_flatten as flatten, group$1 as group, array$1_includes as includes, array$1_indexOf as indexOf, array$1_insert as insert, array$1_intersect as intersect, isEmpty$1 as isEmpty, join$1 as join, array$1_last as last, len$3 as len, array$1_logicalAnd as logicalAnd, array$1_logicalOr as logicalOr, array$1_logicalXor as logicalXor, matches$1 as matches, max$3 as max, min$2 as min, array$1_pop as pop, array$1_prepend as prepend, array$1_push as push, range$1 as range, remove$1 as remove, repeat$1 as repeat, reverse$1 as reverse, array$1_sequence as sequence, array$1_shuffle as shuffle, slice$1 as slice, array$1_some as some, array$1_sort as sort, array$1_sortAsc as sortAsc, array$1_sortDesc as sortDesc, array$1_sortLexical as sortLexical, array$1_sortNatural as sortNatural, array$1_sortNaturalLexical as sortNaturalLexical, array$1_swap as swap, array$1_transpose as transpose, array$1_union as union, array$1_windows as windows };
}

/**
 * `bytes::len(bytes: bytes) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const len$2: <const A0 extends Arg<In["bytes"]>>(bytes: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;

declare namespace bytes$1 {
  export { len$2 as len };
}

/**
 * `crypto::argon2::compare(hash: string, password: string) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const argon2Compare: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["string"]>>(hash: A0, password: A1) => Expr<typeof BoolCodec, ParamsOfAll<A0 | A1>>;
/**
 * `crypto::argon2::generate(password: string) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const argon2Generate: <const A0 extends Arg<In["string"]>>(password: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;
/**
 * `crypto::bcrypt::compare(hash: string, password: string) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const bcryptCompare: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["string"]>>(hash: A0, password: A1) => Expr<typeof BoolCodec, ParamsOfAll<A0 | A1>>;
/**
 * `crypto::bcrypt::generate(password: string) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const bcryptGenerate: <const A0 extends Arg<In["string"]>>(password: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;
/**
 * `crypto::blake3(value: string) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const blake3: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;
/**
 * `crypto::joaat(value: string) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const joaat: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `crypto::md5(value: string) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const md5: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;
/**
 * `crypto::pbkdf2::compare(hash: string, password: string) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const pbkdf2Compare: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["string"]>>(hash: A0, password: A1) => Expr<typeof BoolCodec, ParamsOfAll<A0 | A1>>;
/**
 * `crypto::pbkdf2::generate(password: string) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const pbkdf2Generate: <const A0 extends Arg<In["string"]>>(password: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;
/**
 * `crypto::scrypt::compare(hash: string, password: string) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const scryptCompare: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["string"]>>(hash: A0, password: A1) => Expr<typeof BoolCodec, ParamsOfAll<A0 | A1>>;
/**
 * `crypto::scrypt::generate(password: string) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const scryptGenerate: <const A0 extends Arg<In["string"]>>(password: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;
/**
 * `crypto::sha1(value: string) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const sha1: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;
/**
 * `crypto::sha256(value: string) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const sha256: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;
/**
 * `crypto::sha512(value: string) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const sha512: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;

declare const crypto_argon2Compare: typeof argon2Compare;
declare const crypto_argon2Generate: typeof argon2Generate;
declare const crypto_bcryptCompare: typeof bcryptCompare;
declare const crypto_bcryptGenerate: typeof bcryptGenerate;
declare const crypto_blake3: typeof blake3;
declare const crypto_joaat: typeof joaat;
declare const crypto_md5: typeof md5;
declare const crypto_pbkdf2Compare: typeof pbkdf2Compare;
declare const crypto_pbkdf2Generate: typeof pbkdf2Generate;
declare const crypto_scryptCompare: typeof scryptCompare;
declare const crypto_scryptGenerate: typeof scryptGenerate;
declare const crypto_sha1: typeof sha1;
declare const crypto_sha256: typeof sha256;
declare const crypto_sha512: typeof sha512;
declare namespace crypto {
  export { crypto_argon2Compare as argon2Compare, crypto_argon2Generate as argon2Generate, crypto_bcryptCompare as bcryptCompare, crypto_bcryptGenerate as bcryptGenerate, crypto_blake3 as blake3, crypto_joaat as joaat, crypto_md5 as md5, crypto_pbkdf2Compare as pbkdf2Compare, crypto_pbkdf2Generate as pbkdf2Generate, crypto_scryptCompare as scryptCompare, crypto_scryptGenerate as scryptGenerate, crypto_sha1 as sha1, crypto_sha256 as sha256, crypto_sha512 as sha512 };
}

/**
 * `duration::days(duration: duration) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const days: <const A0 extends Arg<In["duration"]>>(duration: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `duration::from_days(days: int) -> duration`
 *
 * SurrealDB 3 and 4.
 */
declare const fromDays: <const A0 extends Arg<In["int"]>>(days: A0) => Expr<typeof DurationCodec, ParamsOfAll<A0>>;
/**
 * `duration::from_hours(hours: int) -> duration`
 *
 * SurrealDB 3 and 4.
 */
declare const fromHours: <const A0 extends Arg<In["int"]>>(hours: A0) => Expr<typeof DurationCodec, ParamsOfAll<A0>>;
/**
 * `duration::from_micros(micros: int) -> duration`
 *
 * SurrealDB 3 and 4.
 */
declare const fromMicros$1: <const A0 extends Arg<In["int"]>>(micros: A0) => Expr<typeof DurationCodec, ParamsOfAll<A0>>;
/**
 * `duration::from_millis(millis: int) -> duration`
 *
 * SurrealDB 3 and 4.
 */
declare const fromMillis$1: <const A0 extends Arg<In["int"]>>(millis: A0) => Expr<typeof DurationCodec, ParamsOfAll<A0>>;
/**
 * `duration::from_mins(mins: int) -> duration`
 *
 * SurrealDB 3 and 4.
 */
declare const fromMins: <const A0 extends Arg<In["int"]>>(mins: A0) => Expr<typeof DurationCodec, ParamsOfAll<A0>>;
/**
 * `duration::from_nanos(nanos: int) -> duration`
 *
 * SurrealDB 3 and 4.
 */
declare const fromNanos$1: <const A0 extends Arg<In["int"]>>(nanos: A0) => Expr<typeof DurationCodec, ParamsOfAll<A0>>;
/**
 * `duration::from_secs(secs: int) -> duration`
 *
 * SurrealDB 3 and 4.
 */
declare const fromSecs$1: <const A0 extends Arg<In["int"]>>(secs: A0) => Expr<typeof DurationCodec, ParamsOfAll<A0>>;
/**
 * `duration::from_weeks(weeks: int) -> duration`
 *
 * SurrealDB 3 and 4.
 */
declare const fromWeeks: <const A0 extends Arg<In["int"]>>(weeks: A0) => Expr<typeof DurationCodec, ParamsOfAll<A0>>;
/**
 * `duration::hours(duration: duration) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const hours: <const A0 extends Arg<In["duration"]>>(duration: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `duration::max -> duration`
 *
 * SurrealDB 3 and 4.
 */
declare const max$2: Expr<typeof DurationCodec, NoParams>;
/**
 * `duration::micros(duration: duration) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const micros$1: <const A0 extends Arg<In["duration"]>>(duration: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `duration::millis(duration: duration) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const millis$1: <const A0 extends Arg<In["duration"]>>(duration: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `duration::mins(duration: duration) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const mins: <const A0 extends Arg<In["duration"]>>(duration: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `duration::nanos(duration: duration) -> int64`
 *
 * SurrealDB 3 and 4.
 */
declare const nanos: <const A0 extends Arg<In["duration"]>>(duration: A0) => Expr<typeof Int64Codec, ParamsOfAll<A0>>;
/**
 * `duration::secs(duration: duration) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const secs: <const A0 extends Arg<In["duration"]>>(duration: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `duration::weeks(duration: duration) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const weeks: <const A0 extends Arg<In["duration"]>>(duration: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `duration::years(duration: duration) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const years: <const A0 extends Arg<In["duration"]>>(duration: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;

declare const duration$2_days: typeof days;
declare const duration$2_fromDays: typeof fromDays;
declare const duration$2_fromHours: typeof fromHours;
declare const duration$2_fromMins: typeof fromMins;
declare const duration$2_fromWeeks: typeof fromWeeks;
declare const duration$2_hours: typeof hours;
declare const duration$2_mins: typeof mins;
declare const duration$2_nanos: typeof nanos;
declare const duration$2_secs: typeof secs;
declare const duration$2_weeks: typeof weeks;
declare const duration$2_years: typeof years;
declare namespace duration$2 {
  export { duration$2_days as days, duration$2_fromDays as fromDays, duration$2_fromHours as fromHours, fromMicros$1 as fromMicros, fromMillis$1 as fromMillis, duration$2_fromMins as fromMins, fromNanos$1 as fromNanos, fromSecs$1 as fromSecs, duration$2_fromWeeks as fromWeeks, duration$2_hours as hours, max$2 as max, micros$1 as micros, millis$1 as millis, duration$2_mins as mins, duration$2_nanos as nanos, duration$2_secs as secs, duration$2_weeks as weeks, duration$2_years as years };
}

/**
 * `encoding::base64::decode(text: string) -> bytes`
 *
 * SurrealDB 3 and 4.
 */
declare const base64Decode: <const A0 extends Arg<In["string"]>>(text: A0) => Expr<typeof BytesCodec, ParamsOfAll<A0>>;
/**
 * `encoding::base64::encode(bytes: bytes, padded?: bool) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const base64Encode: <const A0 extends Arg<In["bytes"]>, const A1 extends Arg<In["bool"]> = never>(bytes: A0, padded?: A1) => Expr<typeof StringCodec, ParamsOfAll<A0 | A1>>;
/**
 * `encoding::cbor::decode(bytes: bytes) -> any`
 *
 * SurrealDB 3 and 4.
 */
declare const cborDecode: <const A0 extends Arg<In["bytes"]>>(bytes: A0) => Expr<typeof AnyCodec, ParamsOfAll<A0>>;
/**
 * `encoding::cbor::encode(value: any) -> bytes`
 *
 * SurrealDB 3 and 4.
 */
declare const cborEncode: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BytesCodec, ParamsOfAll<A0>>;
/**
 * `encoding::json::decode(text: string) -> any`
 *
 * SurrealDB 3 and 4.
 */
declare const jsonDecode: <const A0 extends Arg<In["string"]>>(text: A0) => Expr<typeof AnyCodec, ParamsOfAll<A0>>;
/**
 * `encoding::json::encode(value: any) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const jsonEncode: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;

declare const encoding_base64Decode: typeof base64Decode;
declare const encoding_base64Encode: typeof base64Encode;
declare const encoding_cborDecode: typeof cborDecode;
declare const encoding_cborEncode: typeof cborEncode;
declare const encoding_jsonDecode: typeof jsonDecode;
declare const encoding_jsonEncode: typeof jsonEncode;
declare namespace encoding {
  export { encoding_base64Decode as base64Decode, encoding_base64Encode as base64Encode, encoding_cborDecode as cborDecode, encoding_cborEncode as cborEncode, encoding_jsonDecode as jsonDecode, encoding_jsonEncode as jsonEncode };
}

/**
 * `geo::area(geometry: geometry) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const area: <const A0 extends Arg<In["geometry"]>>(geometry: A0) => Expr<typeof FloatCodec, ParamsOfAll<A0>>;
/**
 * `geo::bearing(from: geometry, to: geometry) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const bearing: <const A0 extends Arg<In["geometry"]>, const A1 extends Arg<In["geometry"]>>(from: A0, to: A1) => Expr<typeof FloatCodec, ParamsOfAll<A0 | A1>>;
/**
 * `geo::centroid(geometry: geometry) -> geometry`
 *
 * SurrealDB 3 and 4.
 */
declare const centroid: <const A0 extends Arg<In["geometry"]>>(geometry: A0) => Expr<typeof GeometryCodec, ParamsOfAll<A0>>;
/**
 * `geo::distance(from: geometry, to: geometry) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const distance: <const A0 extends Arg<In["geometry"]>, const A1 extends Arg<In["geometry"]>>(from: A0, to: A1) => Expr<typeof FloatCodec, ParamsOfAll<A0 | A1>>;
/**
 * `geo::hash::decode(hash: string) -> geometry`
 *
 * SurrealDB 3 and 4.
 */
declare const hashDecode: <const A0 extends Arg<In["string"]>>(hash: A0) => Expr<typeof GeometryCodec, ParamsOfAll<A0>>;
/**
 * `geo::hash::encode(point: geometry, length?: int) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const hashEncode: <const A0 extends Arg<In["geometry"]>, const A1 extends Arg<In["int"]> = never>(point: A0, length?: A1) => Expr<typeof StringCodec, ParamsOfAll<A0 | A1>>;
/**
 * `geo::is_valid(geometry: geometry) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isValid: <const A0 extends Arg<In["geometry"]>>(geometry: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;

declare const geo_area: typeof area;
declare const geo_bearing: typeof bearing;
declare const geo_centroid: typeof centroid;
declare const geo_distance: typeof distance;
declare const geo_hashDecode: typeof hashDecode;
declare const geo_hashEncode: typeof hashEncode;
declare const geo_isValid: typeof isValid;
declare namespace geo {
  export { geo_area as area, geo_bearing as bearing, geo_centroid as centroid, geo_distance as distance, geo_hashDecode as hashDecode, geo_hashEncode as hashEncode, geo_isValid as isValid };
}

/**
 * `math::abs(value: number) -> number`
 *
 * SurrealDB 3 and 4.
 */
declare const abs: <const A0 extends Arg<In["number"]>>(value: A0) => Expr<typeof NumberCodec, ParamsOfAll<A0>>;
/**
 * `math::acos(value: number) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const acos: <const A0 extends Arg<In["number"]>>(value: A0) => Expr<typeof FloatCodec, ParamsOfAll<A0>>;
/**
 * `math::acot(value: number) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const acot: <const A0 extends Arg<In["number"]>>(value: A0) => Expr<typeof FloatCodec, ParamsOfAll<A0>>;
/**
 * `math::asin(value: number) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const asin: <const A0 extends Arg<In["number"]>>(value: A0) => Expr<typeof FloatCodec, ParamsOfAll<A0>>;
/**
 * `math::atan(value: number) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const atan: <const A0 extends Arg<In["number"]>>(value: A0) => Expr<typeof FloatCodec, ParamsOfAll<A0>>;
/**
 * `math::bottom(values: array<number>, count: int) -> array<number>`
 *
 * SurrealDB 3 and 4.
 */
declare const bottom: <const A0 extends Arg<ReadonlyArray<In["number"]>>, const A1 extends Arg<In["int"]>>(values: A0, count: A1) => Expr<typeof ArrayOfNumberCodec, ParamsOfAll<A0 | A1>>;
/**
 * `math::ceil(value: number) -> number`
 *
 * SurrealDB 3 and 4.
 */
declare const ceil$1: <const A0 extends Arg<In["number"]>>(value: A0) => Expr<typeof NumberCodec, ParamsOfAll<A0>>;
/**
 * `math::clamp(value: number, min: number, max: number) -> number`
 *
 * SurrealDB 3 and 4.
 */
declare const clamp: <const A0 extends Arg<In["number"]>, const A1 extends Arg<In["number"]>, const A2 extends Arg<In["number"]>>(value: A0, min: A1, max: A2) => Expr<typeof NumberCodec, ParamsOfAll<A0 | A1 | A2>>;
/**
 * `math::cos(value: number) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const cos: <const A0 extends Arg<In["number"]>>(value: A0) => Expr<typeof FloatCodec, ParamsOfAll<A0>>;
/**
 * `math::cot(value: number) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const cot: <const A0 extends Arg<In["number"]>>(value: A0) => Expr<typeof FloatCodec, ParamsOfAll<A0>>;
/**
 * `math::deg2rad(value: number) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const deg2rad: <const A0 extends Arg<In["number"]>>(value: A0) => Expr<typeof FloatCodec, ParamsOfAll<A0>>;
/**
 * `math::e -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const e: Expr<typeof FloatCodec, NoParams>;
/**
 * `math::fixed(value: number, places: int) -> number`
 *
 * SurrealDB 3 and 4.
 */
declare const fixed: <const A0 extends Arg<In["number"]>, const A1 extends Arg<In["int"]>>(value: A0, places: A1) => Expr<typeof NumberCodec, ParamsOfAll<A0 | A1>>;
/**
 * `math::floor(value: number) -> number`
 *
 * SurrealDB 3 and 4.
 */
declare const floor$1: <const A0 extends Arg<In["number"]>>(value: A0) => Expr<typeof NumberCodec, ParamsOfAll<A0>>;
/**
 * `math::frac_1_pi -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const frac1Pi: Expr<typeof FloatCodec, NoParams>;
/**
 * `math::frac_1_sqrt_2 -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const frac1Sqrt2: Expr<typeof FloatCodec, NoParams>;
/**
 * `math::frac_2_pi -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const frac2Pi: Expr<typeof FloatCodec, NoParams>;
/**
 * `math::frac_2_sqrt_pi -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const frac2SqrtPi: Expr<typeof FloatCodec, NoParams>;
/**
 * `math::frac_pi_2 -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const fracPi2: Expr<typeof FloatCodec, NoParams>;
/**
 * `math::frac_pi_3 -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const fracPi3: Expr<typeof FloatCodec, NoParams>;
/**
 * `math::frac_pi_4 -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const fracPi4: Expr<typeof FloatCodec, NoParams>;
/**
 * `math::frac_pi_6 -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const fracPi6: Expr<typeof FloatCodec, NoParams>;
/**
 * `math::frac_pi_8 -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const fracPi8: Expr<typeof FloatCodec, NoParams>;
/**
 * `math::inf -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const inf: Expr<typeof FloatCodec, NoParams>;
/**
 * `math::interquartile(values: array<number>) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const interquartile: <const A0 extends Arg<ReadonlyArray<In["number"]>>>(values: A0) => Expr<typeof FloatCodec, ParamsOfAll<A0>>;
/**
 * `math::lerp(from: number, to: number, factor: number) -> float|decimal:0,1,2`
 *
 * A float; a float or a decimal when `from`, `to` or `factor` may hold a decimal.
 *
 * SurrealDB 3 and 4.
 */
declare const lerp: <const A0 extends Arg<In["number"]>, const A1 extends Arg<In["number"]>, const A2 extends Arg<In["number"]>>(from: A0, to: A1, factor: A2) => Expr<FloatOrDecimalCodec<A0 | A1 | A2>, ParamsOfAll<A0 | A1 | A2>>;
/**
 * `math::lerpangle(from: number, to: number, factor: number) -> float|decimal:0,1,2`
 *
 * A float; a float or a decimal when `from`, `to` or `factor` may hold a decimal.
 *
 * SurrealDB 3 and 4.
 */
declare const lerpangle: <const A0 extends Arg<In["number"]>, const A1 extends Arg<In["number"]>, const A2 extends Arg<In["number"]>>(from: A0, to: A1, factor: A2) => Expr<FloatOrDecimalCodec<A0 | A1 | A2>, ParamsOfAll<A0 | A1 | A2>>;
/**
 * `math::ln(value: number) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const ln: <const A0 extends Arg<In["number"]>>(value: A0) => Expr<typeof FloatCodec, ParamsOfAll<A0>>;
/**
 * `math::ln_10 -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const ln10: Expr<typeof FloatCodec, NoParams>;
/**
 * `math::ln_2 -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const ln2: Expr<typeof FloatCodec, NoParams>;
/**
 * `math::log(value: number, base: number) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const log: <const A0 extends Arg<In["number"]>, const A1 extends Arg<In["number"]>>(value: A0, base: A1) => Expr<typeof FloatCodec, ParamsOfAll<A0 | A1>>;
/**
 * `math::log10(value: number) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const log10: <const A0 extends Arg<In["number"]>>(value: A0) => Expr<typeof FloatCodec, ParamsOfAll<A0>>;
/**
 * `math::log10_2 -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const log10_2: Expr<typeof FloatCodec, NoParams>;
/**
 * `math::log10_e -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const log10E: Expr<typeof FloatCodec, NoParams>;
/**
 * `math::log2(value: number) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const log2: <const A0 extends Arg<In["number"]>>(value: A0) => Expr<typeof FloatCodec, ParamsOfAll<A0>>;
/**
 * `math::log2_10 -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const log2_10: Expr<typeof FloatCodec, NoParams>;
/**
 * `math::log2_e -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const log2E: Expr<typeof FloatCodec, NoParams>;
/**
 * `math::max(values: array<number>) -> number`
 *
 * SurrealDB 3 and 4.
 */
declare const max$1: <const A0 extends Arg<ReadonlyArray<In["number"]>>>(values: A0) => Expr<typeof NumberCodec, ParamsOfAll<A0>>;
/**
 * `math::mean(values: array<number>) -> float|decimal:0`
 *
 * A float; a float or a decimal when `values` may hold a decimal.
 *
 * SurrealDB 3 and 4.
 */
declare const mean: <const A0 extends Arg<ReadonlyArray<In["number"]>>>(values: A0) => Expr<FloatOrDecimalCodec<A0>, ParamsOfAll<A0>>;
/**
 * `math::median(values: array<number>) -> option<number>`
 *
 * SurrealDB 3 and 4.
 */
declare const median: <const A0 extends Arg<ReadonlyArray<In["number"]>>>(values: A0) => Expr<typeof OptionOfNumberCodec, ParamsOfAll<A0>>;
/**
 * `math::midhinge(values: array<number>) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const midhinge: <const A0 extends Arg<ReadonlyArray<In["number"]>>>(values: A0) => Expr<typeof FloatCodec, ParamsOfAll<A0>>;
/**
 * `math::min(values: array<number>) -> number`
 *
 * SurrealDB 3 and 4.
 */
declare const min$1: <const A0 extends Arg<ReadonlyArray<In["number"]>>>(values: A0) => Expr<typeof NumberCodec, ParamsOfAll<A0>>;
/**
 * `math::mode(values: array<number>) -> number`
 *
 * SurrealDB 3 and 4.
 */
declare const mode: <const A0 extends Arg<ReadonlyArray<In["number"]>>>(values: A0) => Expr<typeof NumberCodec, ParamsOfAll<A0>>;
/**
 * `math::nearestrank(values: array<number>, percentile: number) -> number`
 *
 * SurrealDB 3 and 4.
 */
declare const nearestrank: <const A0 extends Arg<ReadonlyArray<In["number"]>>, const A1 extends Arg<In["number"]>>(values: A0, percentile: A1) => Expr<typeof NumberCodec, ParamsOfAll<A0 | A1>>;
/**
 * `math::neg_inf -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const negInf: Expr<typeof FloatCodec, NoParams>;
/**
 * `math::percentile(values: array<number>, percentile: number) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const percentile: <const A0 extends Arg<ReadonlyArray<In["number"]>>, const A1 extends Arg<In["number"]>>(values: A0, percentile: A1) => Expr<typeof FloatCodec, ParamsOfAll<A0 | A1>>;
/**
 * `math::pi -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const pi: Expr<typeof FloatCodec, NoParams>;
/**
 * `math::pow(base: number, exponent: number) -> number`
 *
 * SurrealDB 3 and 4.
 */
declare const pow: <const A0 extends Arg<In["number"]>, const A1 extends Arg<In["number"]>>(base: A0, exponent: A1) => Expr<typeof NumberCodec, ParamsOfAll<A0 | A1>>;
/**
 * `math::product(values: array<number>) -> number`
 *
 * SurrealDB 3 and 4.
 */
declare const product: <const A0 extends Arg<ReadonlyArray<In["number"]>>>(values: A0) => Expr<typeof NumberCodec, ParamsOfAll<A0>>;
/**
 * `math::rad2deg(value: number) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const rad2deg: <const A0 extends Arg<In["number"]>>(value: A0) => Expr<typeof FloatCodec, ParamsOfAll<A0>>;
/**
 * `math::round(value: number) -> number`
 *
 * SurrealDB 3 and 4.
 */
declare const round$1: <const A0 extends Arg<In["number"]>>(value: A0) => Expr<typeof NumberCodec, ParamsOfAll<A0>>;
/**
 * `math::sign(value: number) -> number`
 *
 * SurrealDB 3 and 4.
 */
declare const sign: <const A0 extends Arg<In["number"]>>(value: A0) => Expr<typeof NumberCodec, ParamsOfAll<A0>>;
/**
 * `math::sin(value: number) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const sin: <const A0 extends Arg<In["number"]>>(value: A0) => Expr<typeof FloatCodec, ParamsOfAll<A0>>;
/**
 * `math::spread(values: array<number>) -> number`
 *
 * SurrealDB 3 and 4.
 */
declare const spread: <const A0 extends Arg<ReadonlyArray<In["number"]>>>(values: A0) => Expr<typeof NumberCodec, ParamsOfAll<A0>>;
/**
 * `math::sqrt(value: number) -> float|decimal:0`
 *
 * A float; a float or a decimal when `value` may hold a decimal.
 *
 * SurrealDB 3 and 4.
 */
declare const sqrt: <const A0 extends Arg<In["number"]>>(value: A0) => Expr<FloatOrDecimalCodec<A0>, ParamsOfAll<A0>>;
/**
 * `math::sqrt_2 -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const sqrt2: Expr<typeof FloatCodec, NoParams>;
/**
 * `math::stddev(values: array<number>) -> float|decimal:0`
 *
 * A float; a float or a decimal when `values` may hold a decimal.
 *
 * SurrealDB 3 and 4.
 */
declare const stddev: <const A0 extends Arg<ReadonlyArray<In["number"]>>>(values: A0) => Expr<FloatOrDecimalCodec<A0>, ParamsOfAll<A0>>;
/**
 * `math::sum(values: array<number>) -> number`
 *
 * SurrealDB 3 and 4.
 */
declare const sum$1: <const A0 extends Arg<ReadonlyArray<In["number"]>>>(values: A0) => Expr<typeof NumberCodec, ParamsOfAll<A0>>;
/**
 * `math::tan(value: number) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const tan: <const A0 extends Arg<In["number"]>>(value: A0) => Expr<typeof FloatCodec, ParamsOfAll<A0>>;
/**
 * `math::tau -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const tau: Expr<typeof FloatCodec, NoParams>;
/**
 * `math::top(values: array<number>, count: int) -> array<number>`
 *
 * SurrealDB 3 and 4.
 */
declare const top: <const A0 extends Arg<ReadonlyArray<In["number"]>>, const A1 extends Arg<In["int"]>>(values: A0, count: A1) => Expr<typeof ArrayOfNumberCodec, ParamsOfAll<A0 | A1>>;
/**
 * `math::trimean(values: array<number>) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const trimean: <const A0 extends Arg<ReadonlyArray<In["number"]>>>(values: A0) => Expr<typeof FloatCodec, ParamsOfAll<A0>>;
/**
 * `math::variance(values: array<number>) -> float|decimal:0`
 *
 * A float; a float or a decimal when `values` may hold a decimal.
 *
 * SurrealDB 3 and 4.
 */
declare const variance: <const A0 extends Arg<ReadonlyArray<In["number"]>>>(values: A0) => Expr<FloatOrDecimalCodec<A0>, ParamsOfAll<A0>>;

declare const math_abs: typeof abs;
declare const math_acos: typeof acos;
declare const math_acot: typeof acot;
declare const math_asin: typeof asin;
declare const math_atan: typeof atan;
declare const math_bottom: typeof bottom;
declare const math_clamp: typeof clamp;
declare const math_cos: typeof cos;
declare const math_cot: typeof cot;
declare const math_deg2rad: typeof deg2rad;
declare const math_e: typeof e;
declare const math_fixed: typeof fixed;
declare const math_frac1Pi: typeof frac1Pi;
declare const math_frac1Sqrt2: typeof frac1Sqrt2;
declare const math_frac2Pi: typeof frac2Pi;
declare const math_frac2SqrtPi: typeof frac2SqrtPi;
declare const math_fracPi2: typeof fracPi2;
declare const math_fracPi3: typeof fracPi3;
declare const math_fracPi4: typeof fracPi4;
declare const math_fracPi6: typeof fracPi6;
declare const math_fracPi8: typeof fracPi8;
declare const math_inf: typeof inf;
declare const math_interquartile: typeof interquartile;
declare const math_lerp: typeof lerp;
declare const math_lerpangle: typeof lerpangle;
declare const math_ln: typeof ln;
declare const math_ln10: typeof ln10;
declare const math_ln2: typeof ln2;
declare const math_log: typeof log;
declare const math_log10: typeof log10;
declare const math_log10E: typeof log10E;
declare const math_log10_2: typeof log10_2;
declare const math_log2: typeof log2;
declare const math_log2E: typeof log2E;
declare const math_log2_10: typeof log2_10;
declare const math_mean: typeof mean;
declare const math_median: typeof median;
declare const math_midhinge: typeof midhinge;
declare const math_mode: typeof mode;
declare const math_nearestrank: typeof nearestrank;
declare const math_negInf: typeof negInf;
declare const math_percentile: typeof percentile;
declare const math_pi: typeof pi;
declare const math_pow: typeof pow;
declare const math_product: typeof product;
declare const math_rad2deg: typeof rad2deg;
declare const math_sign: typeof sign;
declare const math_sin: typeof sin;
declare const math_spread: typeof spread;
declare const math_sqrt: typeof sqrt;
declare const math_sqrt2: typeof sqrt2;
declare const math_stddev: typeof stddev;
declare const math_tan: typeof tan;
declare const math_tau: typeof tau;
declare const math_top: typeof top;
declare const math_trimean: typeof trimean;
declare const math_variance: typeof variance;
declare namespace math {
  export { math_abs as abs, math_acos as acos, math_acot as acot, math_asin as asin, math_atan as atan, math_bottom as bottom, ceil$1 as ceil, math_clamp as clamp, math_cos as cos, math_cot as cot, math_deg2rad as deg2rad, math_e as e, math_fixed as fixed, floor$1 as floor, math_frac1Pi as frac1Pi, math_frac1Sqrt2 as frac1Sqrt2, math_frac2Pi as frac2Pi, math_frac2SqrtPi as frac2SqrtPi, math_fracPi2 as fracPi2, math_fracPi3 as fracPi3, math_fracPi4 as fracPi4, math_fracPi6 as fracPi6, math_fracPi8 as fracPi8, math_inf as inf, math_interquartile as interquartile, math_lerp as lerp, math_lerpangle as lerpangle, math_ln as ln, math_ln10 as ln10, math_ln2 as ln2, math_log as log, math_log10 as log10, math_log10E as log10E, math_log10_2 as log10_2, math_log2 as log2, math_log2E as log2E, math_log2_10 as log2_10, max$1 as max, math_mean as mean, math_median as median, math_midhinge as midhinge, min$1 as min, math_mode as mode, math_nearestrank as nearestrank, math_negInf as negInf, math_percentile as percentile, math_pi as pi, math_pow as pow, math_product as product, math_rad2deg as rad2deg, round$1 as round, math_sign as sign, math_sin as sin, math_spread as spread, math_sqrt as sqrt, math_sqrt2 as sqrt2, math_stddev as stddev, sum$1 as sum, math_tan as tan, math_tau as tau, math_top as top, math_trimean as trimean, math_variance as variance };
}

/**
 * `meta::id(record: record) -> any`
 *
 * SurrealDB 3 and 4.
 */
declare const id$2: <const A0 extends Arg<In["record"]>>(record: A0) => Expr<typeof AnyCodec, ParamsOfAll<A0>>;
/**
 * `meta::tb(record: record) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const tb$1: <const A0 extends Arg<In["record"]>>(record: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;

declare namespace meta {
  export { id$2 as id, tb$1 as tb };
}

/**
 * `object::entries(object: object) -> array<array>`
 *
 * SurrealDB 3 and 4.
 */
declare const entries: <const A0 extends Arg<In["object"]>>(object: A0) => Expr<typeof ArrayOfArrayCodec, ParamsOfAll<A0>>;
/**
 * `object::extend(object: object, other: object) -> object`
 *
 * SurrealDB 3 and 4.
 */
declare const extend: <const A0 extends Arg<In["object"]>, const A1 extends Arg<In["object"]>>(object: A0, other: A1) => Expr<typeof ObjectCodec, ParamsOfAll<A0 | A1>>;
/**
 * `object::from_entries(entries: array) -> object`
 *
 * SurrealDB 3 and 4.
 */
declare const fromEntries: <const A0 extends Arg<In["array"]>>(entries: A0) => Expr<typeof ObjectCodec, ParamsOfAll<A0>>;
/**
 * `object::is_empty(object: object) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isEmpty: <const A0 extends Arg<In["object"]>>(object: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `object::keys(object: object) -> array<string>`
 *
 * SurrealDB 3 and 4.
 */
declare const keys: <const A0 extends Arg<In["object"]>>(object: A0) => Expr<typeof ArrayOfStringCodec, ParamsOfAll<A0>>;
/**
 * `object::len(object: object) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const len$1: <const A0 extends Arg<In["object"]>>(object: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `object::remove(object: object, keys: any) -> object`
 *
 * SurrealDB 3 and 4.
 */
declare const remove: <const A0 extends Arg<In["object"]>, const A1 extends Arg<In["any"]>>(object: A0, keys: A1) => Expr<typeof ObjectCodec, ParamsOfAll<A0 | A1>>;
/**
 * `object::values(object: object) -> array`
 *
 * SurrealDB 3 and 4.
 */
declare const values: <const A0 extends Arg<In["object"]>>(object: A0) => Expr<typeof ArrayCodec, ParamsOfAll<A0>>;

declare const object_entries: typeof entries;
declare const object_extend: typeof extend;
declare const object_fromEntries: typeof fromEntries;
declare const object_isEmpty: typeof isEmpty;
declare const object_keys: typeof keys;
declare const object_remove: typeof remove;
declare const object_values: typeof values;
declare namespace object {
  export { object_entries as entries, object_extend as extend, object_fromEntries as fromEntries, object_isEmpty as isEmpty, object_keys as keys, len$1 as len, object_remove as remove, object_values as values };
}

/**
 * `parse::email::host(email: string) -> option<string>`
 *
 * SurrealDB 3 and 4.
 */
declare const emailHost: <const A0 extends Arg<In["string"]>>(email: A0) => Expr<typeof OptionOfStringCodec, ParamsOfAll<A0>>;
/**
 * `parse::email::user(email: string) -> option<string>`
 *
 * SurrealDB 3 and 4.
 */
declare const emailUser: <const A0 extends Arg<In["string"]>>(email: A0) => Expr<typeof OptionOfStringCodec, ParamsOfAll<A0>>;
/**
 * `parse::url::domain(url: string) -> option<string>`
 *
 * SurrealDB 3 and 4.
 */
declare const urlDomain: <const A0 extends Arg<In["string"]>>(url: A0) => Expr<typeof OptionOfStringCodec, ParamsOfAll<A0>>;
/**
 * `parse::url::fragment(url: string) -> option<string>`
 *
 * SurrealDB 3 and 4.
 */
declare const urlFragment: <const A0 extends Arg<In["string"]>>(url: A0) => Expr<typeof OptionOfStringCodec, ParamsOfAll<A0>>;
/**
 * `parse::url::host(url: string) -> option<string>`
 *
 * SurrealDB 3 and 4.
 */
declare const urlHost: <const A0 extends Arg<In["string"]>>(url: A0) => Expr<typeof OptionOfStringCodec, ParamsOfAll<A0>>;
/**
 * `parse::url::path(url: string) -> option<string>`
 *
 * SurrealDB 3 and 4.
 */
declare const urlPath: <const A0 extends Arg<In["string"]>>(url: A0) => Expr<typeof OptionOfStringCodec, ParamsOfAll<A0>>;
/**
 * `parse::url::port(url: string) -> option<int>`
 *
 * SurrealDB 3 and 4.
 */
declare const urlPort: <const A0 extends Arg<In["string"]>>(url: A0) => Expr<typeof OptionOfIntCodec, ParamsOfAll<A0>>;
/**
 * `parse::url::query(url: string) -> option<string>`
 *
 * SurrealDB 3 and 4.
 */
declare const urlQuery: <const A0 extends Arg<In["string"]>>(url: A0) => Expr<typeof OptionOfStringCodec, ParamsOfAll<A0>>;
/**
 * `parse::url::scheme(url: string) -> option<string>`
 *
 * SurrealDB 3 and 4.
 */
declare const urlScheme: <const A0 extends Arg<In["string"]>>(url: A0) => Expr<typeof OptionOfStringCodec, ParamsOfAll<A0>>;

declare const parse_emailHost: typeof emailHost;
declare const parse_emailUser: typeof emailUser;
declare const parse_urlDomain: typeof urlDomain;
declare const parse_urlFragment: typeof urlFragment;
declare const parse_urlHost: typeof urlHost;
declare const parse_urlPath: typeof urlPath;
declare const parse_urlPort: typeof urlPort;
declare const parse_urlQuery: typeof urlQuery;
declare const parse_urlScheme: typeof urlScheme;
declare namespace parse {
  export { parse_emailHost as emailHost, parse_emailUser as emailUser, parse_urlDomain as urlDomain, parse_urlFragment as urlFragment, parse_urlHost as urlHost, parse_urlPath as urlPath, parse_urlPort as urlPort, parse_urlQuery as urlQuery, parse_urlScheme as urlScheme };
}

/**
 * `rand::bool() -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const bool$1: () => Expr<typeof BoolCodec, NoParams>;
/**
 * `rand::duration(min: duration, max: duration) -> duration`
 *
 * SurrealDB 3 and 4.
 */
declare const duration$1: <const A0 extends Arg<In["duration"]>, const A1 extends Arg<In["duration"]>>(min: A0, max: A1) => Expr<typeof DurationCodec, ParamsOfAll<A0 | A1>>;
/**
 * `rand::enum(...values: any) -> any`
 *
 * SurrealDB 3 and 4.
 */
declare const enum_: <const A0 extends ReadonlyArray<Arg<In["any"]>>>(...values: A0) => Expr<typeof AnyCodec, ParamsOfAll<A0[number]>>;
/**
 * `rand::float(min?: number, max?: number) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const float$1: <const A0 extends Arg<In["number"]> = never, const A1 extends Arg<In["number"]> = never>(min?: A0, max?: A1) => Expr<typeof FloatCodec, ParamsOfAll<A0 | A1>>;
/**
 * `rand::id(length?: int, max?: int) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const id$1: <const A0 extends Arg<In["int"]> = never, const A1 extends Arg<In["int"]> = never>(length?: A0, max?: A1) => Expr<typeof StringCodec, ParamsOfAll<A0 | A1>>;
/**
 * `rand::int(min?: int, max?: int) -> int64`
 *
 * SurrealDB 3 and 4.
 */
declare const int$1: <const A0 extends Arg<In["int"]> = never, const A1 extends Arg<In["int"]> = never>(min?: A0, max?: A1) => Expr<typeof Int64Codec, ParamsOfAll<A0 | A1>>;
/**
 * `rand::string(length?: int, max?: int) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const string$2: <const A0 extends Arg<In["int"]> = never, const A1 extends Arg<In["int"]> = never>(length?: A0, max?: A1) => Expr<typeof StringCodec, ParamsOfAll<A0 | A1>>;
/**
 * `rand::time(min?: any, max?: any) -> datetime`
 *
 * SurrealDB 3 and 4.
 */
declare const time$2: <const A0 extends Arg<In["any"]> = never, const A1 extends Arg<In["any"]> = never>(min?: A0, max?: A1) => Expr<typeof DateTimeCodec, ParamsOfAll<A0 | A1>>;
/**
 * `rand::ulid(time?: datetime) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const ulid: <const A0 extends Arg<In["datetime"]> = never>(time?: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;
/**
 * `rand::uuid(time?: datetime) -> uuid`
 *
 * SurrealDB 3 and 4.
 */
declare const uuid$1: <const A0 extends Arg<In["datetime"]> = never>(time?: A0) => Expr<typeof UuidCodec, ParamsOfAll<A0>>;
/**
 * `rand::uuid::v4() -> uuid`
 *
 * SurrealDB 3 and 4.
 */
declare const uuidV4: () => Expr<typeof UuidCodec, NoParams>;
/**
 * `rand::uuid::v7(time?: datetime) -> uuid`
 *
 * SurrealDB 3 and 4.
 */
declare const uuidV7: <const A0 extends Arg<In["datetime"]> = never>(time?: A0) => Expr<typeof UuidCodec, ParamsOfAll<A0>>;

declare const rand_enum_: typeof enum_;
declare const rand_ulid: typeof ulid;
declare const rand_uuidV4: typeof uuidV4;
declare const rand_uuidV7: typeof uuidV7;
declare namespace rand {
  export { bool$1 as bool, duration$1 as duration, rand_enum_ as enum_, float$1 as float, id$1 as id, int$1 as int, string$2 as string, time$2 as time, rand_ulid as ulid, uuid$1 as uuid, rand_uuidV4 as uuidV4, rand_uuidV7 as uuidV7 };
}

/**
 * `record::exists(record: record) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const exists: <const A0 extends Arg<In["record"]>>(record: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `record::id(record: record) -> any`
 *
 * SurrealDB 3 and 4.
 */
declare const id: <const A0 extends Arg<In["record"]>>(record: A0) => Expr<typeof AnyCodec, ParamsOfAll<A0>>;
/**
 * `record::is_edge(record: record) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isEdge: <const A0 extends Arg<In["record"]>>(record: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `record::table(record: record) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const table$1: <const A0 extends Arg<In["record"]>>(record: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;
/**
 * `record::tb(record: record) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const tb: <const A0 extends Arg<In["record"]>>(record: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;

declare const record$1_exists: typeof exists;
declare const record$1_id: typeof id;
declare const record$1_isEdge: typeof isEdge;
declare const record$1_tb: typeof tb;
declare namespace record$1 {
  export { record$1_exists as exists, record$1_id as id, record$1_isEdge as isEdge, table$1 as table, record$1_tb as tb };
}

/**
 * `search::analyze(analyzer: string, text: string) -> array<string>`
 *
 * SurrealDB 3 and 4.
 */
declare const analyze: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["string"]>>(analyzer: A0, text: A1) => Expr<typeof ArrayOfStringCodec, ParamsOfAll<A0 | A1>>;

declare const search_analyze: typeof analyze;
declare namespace search {
  export { search_analyze as analyze };
}

/**
 * `string::capitalize(value: string) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const capitalize: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;
/**
 * `string::concat(...values: any) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const concat: <const A0 extends ReadonlyArray<Arg<In["any"]>>>(...values: A0) => Expr<typeof StringCodec, ParamsOfAll<A0[number]>>;
/**
 * `string::contains(value: string, search: string) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const contains: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["string"]>>(value: A0, search: A1) => Expr<typeof BoolCodec, ParamsOfAll<A0 | A1>>;
/**
 * `string::distance::damerau_levenshtein(left: string, right: string) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const distanceDamerauLevenshtein: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["string"]>>(left: A0, right: A1) => Expr<typeof IntCodec, ParamsOfAll<A0 | A1>>;
/**
 * `string::distance::hamming(left: string, right: string) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const distanceHamming$1: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["string"]>>(left: A0, right: A1) => Expr<typeof IntCodec, ParamsOfAll<A0 | A1>>;
/**
 * `string::distance::levenshtein(left: string, right: string) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const distanceLevenshtein: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["string"]>>(left: A0, right: A1) => Expr<typeof IntCodec, ParamsOfAll<A0 | A1>>;
/**
 * `string::distance::normalized_damerau_levenshtein(left: string, right: string) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const distanceNormalizedDamerauLevenshtein: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["string"]>>(left: A0, right: A1) => Expr<typeof FloatCodec, ParamsOfAll<A0 | A1>>;
/**
 * `string::distance::normalized_levenshtein(left: string, right: string) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const distanceNormalizedLevenshtein: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["string"]>>(left: A0, right: A1) => Expr<typeof FloatCodec, ParamsOfAll<A0 | A1>>;
/**
 * `string::distance::osa(left: string, right: string) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const distanceOsa: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["string"]>>(left: A0, right: A1) => Expr<typeof IntCodec, ParamsOfAll<A0 | A1>>;
/**
 * `string::ends_with(value: string, suffix: string) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const endsWith: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["string"]>>(value: A0, suffix: A1) => Expr<typeof BoolCodec, ParamsOfAll<A0 | A1>>;
/**
 * `string::html::encode(value: string) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const htmlEncode: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;
/**
 * `string::html::sanitize(value: string) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const htmlSanitize: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;
/**
 * `string::is_alpha(value: string) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isAlpha: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `string::is_alphanum(value: string) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isAlphanum: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `string::is_ascii(value: string) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isAscii: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `string::is_datetime(value: string, format?: string) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isDatetime$1: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["string"]> = never>(value: A0, format?: A1) => Expr<typeof BoolCodec, ParamsOfAll<A0 | A1>>;
/**
 * `string::is_domain(value: string) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isDomain: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `string::is_email(value: string) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isEmail: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `string::is_hexadecimal(value: string) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isHexadecimal: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `string::is_ip(value: string) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isIp: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `string::is_ipv4(value: string) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isIpv4: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `string::is_ipv6(value: string) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isIpv6: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `string::is_latitude(value: string) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isLatitude: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `string::is_longitude(value: string) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isLongitude: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `string::is_numeric(value: string) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isNumeric: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `string::is_record(value: string, table?: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isRecord$1: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["any"]> = never>(value: A0, table?: A1) => Expr<typeof BoolCodec, ParamsOfAll<A0 | A1>>;
/**
 * `string::is_semver(value: string) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isSemver: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `string::is_ulid(value: string) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isUlid: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `string::is_url(value: string) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isUrl: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `string::is_uuid(value: string) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isUuid$1: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `string::join(separator: string, ...values: any) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const join: <const A0 extends Arg<In["string"]>, const A1 extends ReadonlyArray<Arg<In["any"]>>>(separator: A0, ...values: A1) => Expr<typeof StringCodec, ParamsOfAll<A0 | A1[number]>>;
/**
 * `string::len(value: string) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const len: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `string::lowercase(value: string) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const lowercase: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;
/**
 * `string::matches(value: string, pattern: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const matches: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["any"]>>(value: A0, pattern: A1) => Expr<typeof BoolCodec, ParamsOfAll<A0 | A1>>;
/**
 * `string::repeat(value: string, count: int) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const repeat: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["int"]>>(value: A0, count: A1) => Expr<typeof StringCodec, ParamsOfAll<A0 | A1>>;
/**
 * `string::replace(value: string, search: any, replacement: string) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const replace: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["any"]>, const A2 extends Arg<In["string"]>>(value: A0, search: A1, replacement: A2) => Expr<typeof StringCodec, ParamsOfAll<A0 | A1 | A2>>;
/**
 * `string::reverse(value: string) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const reverse: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;
/**
 * `string::semver::compare(left: string, right: string) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const semverCompare: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["string"]>>(left: A0, right: A1) => Expr<typeof IntCodec, ParamsOfAll<A0 | A1>>;
/**
 * `string::semver::inc::major(version: string) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const semverIncMajor: <const A0 extends Arg<In["string"]>>(version: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;
/**
 * `string::semver::inc::minor(version: string) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const semverIncMinor: <const A0 extends Arg<In["string"]>>(version: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;
/**
 * `string::semver::inc::patch(version: string) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const semverIncPatch: <const A0 extends Arg<In["string"]>>(version: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;
/**
 * `string::semver::major(version: string) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const semverMajor: <const A0 extends Arg<In["string"]>>(version: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `string::semver::minor(version: string) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const semverMinor: <const A0 extends Arg<In["string"]>>(version: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `string::semver::patch(version: string) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const semverPatch: <const A0 extends Arg<In["string"]>>(version: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `string::semver::set::major(version: string, value: int) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const semverSetMajor: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["int"]>>(version: A0, value: A1) => Expr<typeof StringCodec, ParamsOfAll<A0 | A1>>;
/**
 * `string::semver::set::minor(version: string, value: int) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const semverSetMinor: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["int"]>>(version: A0, value: A1) => Expr<typeof StringCodec, ParamsOfAll<A0 | A1>>;
/**
 * `string::semver::set::patch(version: string, value: int) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const semverSetPatch: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["int"]>>(version: A0, value: A1) => Expr<typeof StringCodec, ParamsOfAll<A0 | A1>>;
/**
 * `string::similarity::fuzzy(left: string, right: string) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const similarityFuzzy: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["string"]>>(left: A0, right: A1) => Expr<typeof IntCodec, ParamsOfAll<A0 | A1>>;
/**
 * `string::similarity::jaro(left: string, right: string) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const similarityJaro: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["string"]>>(left: A0, right: A1) => Expr<typeof FloatCodec, ParamsOfAll<A0 | A1>>;
/**
 * `string::similarity::jaro_winkler(left: string, right: string) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const similarityJaroWinkler: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["string"]>>(left: A0, right: A1) => Expr<typeof FloatCodec, ParamsOfAll<A0 | A1>>;
/**
 * `string::similarity::smithwaterman(left: string, right: string) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const similaritySmithwaterman: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["string"]>>(left: A0, right: A1) => Expr<typeof IntCodec, ParamsOfAll<A0 | A1>>;
/**
 * `string::similarity::sorensen_dice(left: string, right: string) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const similaritySorensenDice: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["string"]>>(left: A0, right: A1) => Expr<typeof FloatCodec, ParamsOfAll<A0 | A1>>;
/**
 * `string::slice(value: string, start?: int, length?: int) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const slice: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["int"]> = never, const A2 extends Arg<In["int"]> = never>(value: A0, start?: A1, length?: A2) => Expr<typeof StringCodec, ParamsOfAll<A0 | A1 | A2>>;
/**
 * `string::slug(value: string) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const slug: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;
/**
 * `string::split(value: string, separator: string) -> array<string>`
 *
 * SurrealDB 3 and 4.
 */
declare const split: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["string"]>>(value: A0, separator: A1) => Expr<typeof ArrayOfStringCodec, ParamsOfAll<A0 | A1>>;
/**
 * `string::starts_with(value: string, prefix: string) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const startsWith: <const A0 extends Arg<In["string"]>, const A1 extends Arg<In["string"]>>(value: A0, prefix: A1) => Expr<typeof BoolCodec, ParamsOfAll<A0 | A1>>;
/**
 * `string::trim(value: string) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const trim: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;
/**
 * `string::uppercase(value: string) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const uppercase: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;
/**
 * `string::words(value: string) -> array<string>`
 *
 * SurrealDB 3 and 4.
 */
declare const words: <const A0 extends Arg<In["string"]>>(value: A0) => Expr<typeof ArrayOfStringCodec, ParamsOfAll<A0>>;

declare const string$1_capitalize: typeof capitalize;
declare const string$1_concat: typeof concat;
declare const string$1_contains: typeof contains;
declare const string$1_distanceDamerauLevenshtein: typeof distanceDamerauLevenshtein;
declare const string$1_distanceLevenshtein: typeof distanceLevenshtein;
declare const string$1_distanceNormalizedDamerauLevenshtein: typeof distanceNormalizedDamerauLevenshtein;
declare const string$1_distanceNormalizedLevenshtein: typeof distanceNormalizedLevenshtein;
declare const string$1_distanceOsa: typeof distanceOsa;
declare const string$1_endsWith: typeof endsWith;
declare const string$1_htmlEncode: typeof htmlEncode;
declare const string$1_htmlSanitize: typeof htmlSanitize;
declare const string$1_isAlpha: typeof isAlpha;
declare const string$1_isAlphanum: typeof isAlphanum;
declare const string$1_isAscii: typeof isAscii;
declare const string$1_isDomain: typeof isDomain;
declare const string$1_isEmail: typeof isEmail;
declare const string$1_isHexadecimal: typeof isHexadecimal;
declare const string$1_isIp: typeof isIp;
declare const string$1_isIpv4: typeof isIpv4;
declare const string$1_isIpv6: typeof isIpv6;
declare const string$1_isLatitude: typeof isLatitude;
declare const string$1_isLongitude: typeof isLongitude;
declare const string$1_isNumeric: typeof isNumeric;
declare const string$1_isSemver: typeof isSemver;
declare const string$1_isUlid: typeof isUlid;
declare const string$1_isUrl: typeof isUrl;
declare const string$1_join: typeof join;
declare const string$1_len: typeof len;
declare const string$1_lowercase: typeof lowercase;
declare const string$1_matches: typeof matches;
declare const string$1_repeat: typeof repeat;
declare const string$1_replace: typeof replace;
declare const string$1_reverse: typeof reverse;
declare const string$1_semverCompare: typeof semverCompare;
declare const string$1_semverIncMajor: typeof semverIncMajor;
declare const string$1_semverIncMinor: typeof semverIncMinor;
declare const string$1_semverIncPatch: typeof semverIncPatch;
declare const string$1_semverMajor: typeof semverMajor;
declare const string$1_semverMinor: typeof semverMinor;
declare const string$1_semverPatch: typeof semverPatch;
declare const string$1_semverSetMajor: typeof semverSetMajor;
declare const string$1_semverSetMinor: typeof semverSetMinor;
declare const string$1_semverSetPatch: typeof semverSetPatch;
declare const string$1_similarityFuzzy: typeof similarityFuzzy;
declare const string$1_similarityJaro: typeof similarityJaro;
declare const string$1_similarityJaroWinkler: typeof similarityJaroWinkler;
declare const string$1_similaritySmithwaterman: typeof similaritySmithwaterman;
declare const string$1_similaritySorensenDice: typeof similaritySorensenDice;
declare const string$1_slice: typeof slice;
declare const string$1_slug: typeof slug;
declare const string$1_split: typeof split;
declare const string$1_startsWith: typeof startsWith;
declare const string$1_trim: typeof trim;
declare const string$1_uppercase: typeof uppercase;
declare const string$1_words: typeof words;
declare namespace string$1 {
  export { string$1_capitalize as capitalize, string$1_concat as concat, string$1_contains as contains, string$1_distanceDamerauLevenshtein as distanceDamerauLevenshtein, distanceHamming$1 as distanceHamming, string$1_distanceLevenshtein as distanceLevenshtein, string$1_distanceNormalizedDamerauLevenshtein as distanceNormalizedDamerauLevenshtein, string$1_distanceNormalizedLevenshtein as distanceNormalizedLevenshtein, string$1_distanceOsa as distanceOsa, string$1_endsWith as endsWith, string$1_htmlEncode as htmlEncode, string$1_htmlSanitize as htmlSanitize, string$1_isAlpha as isAlpha, string$1_isAlphanum as isAlphanum, string$1_isAscii as isAscii, isDatetime$1 as isDatetime, string$1_isDomain as isDomain, string$1_isEmail as isEmail, string$1_isHexadecimal as isHexadecimal, string$1_isIp as isIp, string$1_isIpv4 as isIpv4, string$1_isIpv6 as isIpv6, string$1_isLatitude as isLatitude, string$1_isLongitude as isLongitude, string$1_isNumeric as isNumeric, isRecord$1 as isRecord, string$1_isSemver as isSemver, string$1_isUlid as isUlid, string$1_isUrl as isUrl, isUuid$1 as isUuid, string$1_join as join, string$1_len as len, string$1_lowercase as lowercase, string$1_matches as matches, string$1_repeat as repeat, string$1_replace as replace, string$1_reverse as reverse, string$1_semverCompare as semverCompare, string$1_semverIncMajor as semverIncMajor, string$1_semverIncMinor as semverIncMinor, string$1_semverIncPatch as semverIncPatch, string$1_semverMajor as semverMajor, string$1_semverMinor as semverMinor, string$1_semverPatch as semverPatch, string$1_semverSetMajor as semverSetMajor, string$1_semverSetMinor as semverSetMinor, string$1_semverSetPatch as semverSetPatch, string$1_similarityFuzzy as similarityFuzzy, string$1_similarityJaro as similarityJaro, string$1_similarityJaroWinkler as similarityJaroWinkler, string$1_similaritySmithwaterman as similaritySmithwaterman, string$1_similaritySorensenDice as similaritySorensenDice, string$1_slice as slice, string$1_slug as slug, string$1_split as split, string$1_startsWith as startsWith, string$1_trim as trim, string$1_uppercase as uppercase, string$1_words as words };
}

/**
 * `time::age(from: datetime, to: datetime) -> string`
 *
 * Only on SurrealDB 4.
 */
declare const age: <const A0 extends Arg<In["datetime"]>, const A1 extends Arg<In["datetime"]>>(from: A0, to: A1) => Expr<typeof StringCodec, ParamsOfAll<A0 | A1>>;
/**
 * `time::ceil(time: datetime, step: duration) -> datetime`
 *
 * SurrealDB 3 and 4.
 */
declare const ceil: <const A0 extends Arg<In["datetime"]>, const A1 extends Arg<In["duration"]>>(time: A0, step: A1) => Expr<typeof DateTimeCodec, ParamsOfAll<A0 | A1>>;
/**
 * `time::day(time?: datetime) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const day: <const A0 extends Arg<In["datetime"]> = never>(time?: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `time::epoch -> datetime`
 *
 * SurrealDB 3 and 4.
 */
declare const epoch: Expr<typeof DateTimeCodec, NoParams>;
/**
 * `time::floor(time: datetime, step: duration) -> datetime`
 *
 * SurrealDB 3 and 4.
 */
declare const floor: <const A0 extends Arg<In["datetime"]>, const A1 extends Arg<In["duration"]>>(time: A0, step: A1) => Expr<typeof DateTimeCodec, ParamsOfAll<A0 | A1>>;
/**
 * `time::format(time: datetime, format: string) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const format: <const A0 extends Arg<In["datetime"]>, const A1 extends Arg<In["string"]>>(time: A0, format: A1) => Expr<typeof StringCodec, ParamsOfAll<A0 | A1>>;
/**
 * `time::from_micros(micros: int) -> datetime`
 *
 * SurrealDB 3 and 4.
 */
declare const fromMicros: <const A0 extends Arg<In["int"]>>(micros: A0) => Expr<typeof DateTimeCodec, ParamsOfAll<A0>>;
/**
 * `time::from_millis(millis: int) -> datetime`
 *
 * SurrealDB 3 and 4.
 */
declare const fromMillis: <const A0 extends Arg<In["int"]>>(millis: A0) => Expr<typeof DateTimeCodec, ParamsOfAll<A0>>;
/**
 * `time::from_nanos(nanos: int) -> datetime`
 *
 * SurrealDB 3 and 4.
 */
declare const fromNanos: <const A0 extends Arg<In["int"]>>(nanos: A0) => Expr<typeof DateTimeCodec, ParamsOfAll<A0>>;
/**
 * `time::from_secs(secs: int) -> datetime`
 *
 * SurrealDB 3 and 4.
 */
declare const fromSecs: <const A0 extends Arg<In["int"]>>(secs: A0) => Expr<typeof DateTimeCodec, ParamsOfAll<A0>>;
/**
 * `time::from_ulid(ulid: string) -> datetime`
 *
 * SurrealDB 3 and 4.
 */
declare const fromUlid: <const A0 extends Arg<In["string"]>>(ulid: A0) => Expr<typeof DateTimeCodec, ParamsOfAll<A0>>;
/**
 * `time::from_unix(secs: int) -> datetime`
 *
 * SurrealDB 3 and 4.
 */
declare const fromUnix: <const A0 extends Arg<In["int"]>>(secs: A0) => Expr<typeof DateTimeCodec, ParamsOfAll<A0>>;
/**
 * `time::from_uuid(uuid: uuid) -> datetime`
 *
 * SurrealDB 3 and 4.
 */
declare const fromUuid: <const A0 extends Arg<In["uuid"]>>(uuid: A0) => Expr<typeof DateTimeCodec, ParamsOfAll<A0>>;
/**
 * `time::group(time: datetime, unit: string) -> datetime`
 *
 * SurrealDB 3 and 4.
 */
declare const group: <const A0 extends Arg<In["datetime"]>, const A1 extends Arg<In["string"]>>(time: A0, unit: A1) => Expr<typeof DateTimeCodec, ParamsOfAll<A0 | A1>>;
/**
 * `time::hour(time?: datetime) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const hour: <const A0 extends Arg<In["datetime"]> = never>(time?: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `time::is_leap_year(time?: datetime) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isLeapYear: <const A0 extends Arg<In["datetime"]> = never>(time?: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `time::make_date(year: int, month: int, day: int) -> datetime`
 *
 * Only on SurrealDB 4.
 */
declare const makeDate: <const A0 extends Arg<In["int"]>, const A1 extends Arg<In["int"]>, const A2 extends Arg<In["int"]>>(year: A0, month: A1, day: A2) => Expr<typeof DateTimeCodec, ParamsOfAll<A0 | A1 | A2>>;
/**
 * `time::make_time(hour: int, minute: int, second: int) -> duration`
 *
 * Only on SurrealDB 4.
 */
declare const makeTime: <const A0 extends Arg<In["int"]>, const A1 extends Arg<In["int"]>, const A2 extends Arg<In["int"]>>(hour: A0, minute: A1, second: A2) => Expr<typeof DurationCodec, ParamsOfAll<A0 | A1 | A2>>;
/**
 * `time::make_timestamp(year: int, month: int, day: int, hour: int, minute: int, second: int) -> datetime`
 *
 * Only on SurrealDB 4.
 */
declare const makeTimestamp: <const A0 extends Arg<In["int"]>, const A1 extends Arg<In["int"]>, const A2 extends Arg<In["int"]>, const A3 extends Arg<In["int"]>, const A4 extends Arg<In["int"]>, const A5 extends Arg<In["int"]>>(year: A0, month: A1, day: A2, hour: A3, minute: A4, second: A5) => Expr<typeof DateTimeCodec, ParamsOfAll<A0 | A1 | A2 | A3 | A4 | A5>>;
/**
 * `time::max(times: array<datetime>) -> item:0`
 *
 * SurrealDB 3 and 4.
 */
declare const max: <const A0 extends Arg<ReadonlyArray<In["datetime"]>>>(times: A0) => Expr<ItemCodec<CodecOfArg<A0, typeof ArrayOfDateTimeCodec>>, ParamsOfAll<A0>>;
/**
 * `time::maximum -> datetime`
 *
 * SurrealDB 3 and 4.
 */
declare const maximum: Expr<typeof DateTimeCodec, NoParams>;
/**
 * `time::micros(time?: datetime) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const micros: <const A0 extends Arg<In["datetime"]> = never>(time?: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `time::millis(time?: datetime) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const millis: <const A0 extends Arg<In["datetime"]> = never>(time?: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `time::min(times: array<datetime>) -> item:0`
 *
 * SurrealDB 3 and 4.
 */
declare const min: <const A0 extends Arg<ReadonlyArray<In["datetime"]>>>(times: A0) => Expr<ItemCodec<CodecOfArg<A0, typeof ArrayOfDateTimeCodec>>, ParamsOfAll<A0>>;
/**
 * `time::minimum -> datetime`
 *
 * SurrealDB 3 and 4.
 */
declare const minimum: Expr<typeof DateTimeCodec, NoParams>;
/**
 * `time::minute(time?: datetime) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const minute: <const A0 extends Arg<In["datetime"]> = never>(time?: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `time::month(time?: datetime) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const month: <const A0 extends Arg<In["datetime"]> = never>(time?: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `time::nano(time?: datetime) -> int64`
 *
 * SurrealDB 3 and 4.
 */
declare const nano: <const A0 extends Arg<In["datetime"]> = never>(time?: A0) => Expr<typeof Int64Codec, ParamsOfAll<A0>>;
/**
 * `time::now() -> datetime`
 *
 * SurrealDB 3 and 4.
 */
declare const now: () => Expr<typeof DateTimeCodec, NoParams>;
/**
 * `time::round(time: datetime, step: duration) -> datetime`
 *
 * SurrealDB 3 and 4.
 */
declare const round: <const A0 extends Arg<In["datetime"]>, const A1 extends Arg<In["duration"]>>(time: A0, step: A1) => Expr<typeof DateTimeCodec, ParamsOfAll<A0 | A1>>;
/**
 * `time::second(time?: datetime) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const second: <const A0 extends Arg<In["datetime"]> = never>(time?: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `time::set_day(time: datetime, day: int) -> datetime`
 *
 * SurrealDB 3 and 4.
 */
declare const setDay: <const A0 extends Arg<In["datetime"]>, const A1 extends Arg<In["int"]>>(time: A0, day: A1) => Expr<typeof DateTimeCodec, ParamsOfAll<A0 | A1>>;
/**
 * `time::set_hour(time: datetime, hour: int) -> datetime`
 *
 * SurrealDB 3 and 4.
 */
declare const setHour: <const A0 extends Arg<In["datetime"]>, const A1 extends Arg<In["int"]>>(time: A0, hour: A1) => Expr<typeof DateTimeCodec, ParamsOfAll<A0 | A1>>;
/**
 * `time::set_minute(time: datetime, minute: int) -> datetime`
 *
 * SurrealDB 3 and 4.
 */
declare const setMinute: <const A0 extends Arg<In["datetime"]>, const A1 extends Arg<In["int"]>>(time: A0, minute: A1) => Expr<typeof DateTimeCodec, ParamsOfAll<A0 | A1>>;
/**
 * `time::set_month(time: datetime, month: int) -> datetime`
 *
 * SurrealDB 3 and 4.
 */
declare const setMonth: <const A0 extends Arg<In["datetime"]>, const A1 extends Arg<In["int"]>>(time: A0, month: A1) => Expr<typeof DateTimeCodec, ParamsOfAll<A0 | A1>>;
/**
 * `time::set_nanosecond(time: datetime, nanosecond: int) -> datetime`
 *
 * SurrealDB 3 and 4.
 */
declare const setNanosecond: <const A0 extends Arg<In["datetime"]>, const A1 extends Arg<In["int"]>>(time: A0, nanosecond: A1) => Expr<typeof DateTimeCodec, ParamsOfAll<A0 | A1>>;
/**
 * `time::set_second(time: datetime, second: int) -> datetime`
 *
 * SurrealDB 3 and 4.
 */
declare const setSecond: <const A0 extends Arg<In["datetime"]>, const A1 extends Arg<In["int"]>>(time: A0, second: A1) => Expr<typeof DateTimeCodec, ParamsOfAll<A0 | A1>>;
/**
 * `time::set_year(time: datetime, year: int) -> datetime`
 *
 * SurrealDB 3 and 4.
 */
declare const setYear: <const A0 extends Arg<In["datetime"]>, const A1 extends Arg<In["int"]>>(time: A0, year: A1) => Expr<typeof DateTimeCodec, ParamsOfAll<A0 | A1>>;
/**
 * `time::timezone() -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const timezone: () => Expr<typeof StringCodec, NoParams>;
/**
 * `time::trunc(time: datetime, unit: string) -> datetime`
 *
 * Only on SurrealDB 4.
 */
declare const trunc: <const A0 extends Arg<In["datetime"]>, const A1 extends Arg<In["string"]>>(time: A0, unit: A1) => Expr<typeof DateTimeCodec, ParamsOfAll<A0 | A1>>;
/**
 * `time::unix(time?: datetime) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const unix: <const A0 extends Arg<In["datetime"]> = never>(time?: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `time::wday(time?: datetime) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const wday: <const A0 extends Arg<In["datetime"]> = never>(time?: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `time::week(time?: datetime) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const week: <const A0 extends Arg<In["datetime"]> = never>(time?: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `time::yday(time?: datetime) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const yday: <const A0 extends Arg<In["datetime"]> = never>(time?: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `time::year(time?: datetime) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const year: <const A0 extends Arg<In["datetime"]> = never>(time?: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;

declare const time$1_age: typeof age;
declare const time$1_ceil: typeof ceil;
declare const time$1_day: typeof day;
declare const time$1_epoch: typeof epoch;
declare const time$1_floor: typeof floor;
declare const time$1_format: typeof format;
declare const time$1_fromMicros: typeof fromMicros;
declare const time$1_fromMillis: typeof fromMillis;
declare const time$1_fromNanos: typeof fromNanos;
declare const time$1_fromSecs: typeof fromSecs;
declare const time$1_fromUlid: typeof fromUlid;
declare const time$1_fromUnix: typeof fromUnix;
declare const time$1_fromUuid: typeof fromUuid;
declare const time$1_group: typeof group;
declare const time$1_hour: typeof hour;
declare const time$1_isLeapYear: typeof isLeapYear;
declare const time$1_makeDate: typeof makeDate;
declare const time$1_makeTime: typeof makeTime;
declare const time$1_makeTimestamp: typeof makeTimestamp;
declare const time$1_max: typeof max;
declare const time$1_maximum: typeof maximum;
declare const time$1_micros: typeof micros;
declare const time$1_millis: typeof millis;
declare const time$1_min: typeof min;
declare const time$1_minimum: typeof minimum;
declare const time$1_minute: typeof minute;
declare const time$1_month: typeof month;
declare const time$1_nano: typeof nano;
declare const time$1_now: typeof now;
declare const time$1_round: typeof round;
declare const time$1_second: typeof second;
declare const time$1_setDay: typeof setDay;
declare const time$1_setHour: typeof setHour;
declare const time$1_setMinute: typeof setMinute;
declare const time$1_setMonth: typeof setMonth;
declare const time$1_setNanosecond: typeof setNanosecond;
declare const time$1_setSecond: typeof setSecond;
declare const time$1_setYear: typeof setYear;
declare const time$1_timezone: typeof timezone;
declare const time$1_trunc: typeof trunc;
declare const time$1_unix: typeof unix;
declare const time$1_wday: typeof wday;
declare const time$1_week: typeof week;
declare const time$1_yday: typeof yday;
declare const time$1_year: typeof year;
declare namespace time$1 {
  export { time$1_age as age, time$1_ceil as ceil, time$1_day as day, time$1_epoch as epoch, time$1_floor as floor, time$1_format as format, time$1_fromMicros as fromMicros, time$1_fromMillis as fromMillis, time$1_fromNanos as fromNanos, time$1_fromSecs as fromSecs, time$1_fromUlid as fromUlid, time$1_fromUnix as fromUnix, time$1_fromUuid as fromUuid, time$1_group as group, time$1_hour as hour, time$1_isLeapYear as isLeapYear, time$1_makeDate as makeDate, time$1_makeTime as makeTime, time$1_makeTimestamp as makeTimestamp, time$1_max as max, time$1_maximum as maximum, time$1_micros as micros, time$1_millis as millis, time$1_min as min, time$1_minimum as minimum, time$1_minute as minute, time$1_month as month, time$1_nano as nano, time$1_now as now, time$1_round as round, time$1_second as second, time$1_setDay as setDay, time$1_setHour as setHour, time$1_setMinute as setMinute, time$1_setMonth as setMonth, time$1_setNanosecond as setNanosecond, time$1_setSecond as setSecond, time$1_setYear as setYear, time$1_timezone as timezone, time$1_trunc as trunc, time$1_unix as unix, time$1_wday as wday, time$1_week as week, time$1_yday as yday, time$1_year as year };
}

/**
 * `type::array(value: any) -> array`
 *
 * SurrealDB 3 and 4.
 */
declare const array: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof ArrayCodec, ParamsOfAll<A0>>;
/**
 * `type::bool(value: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const bool: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::bytes(value: any) -> bytes`
 *
 * SurrealDB 3 and 4.
 */
declare const bytes: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BytesCodec, ParamsOfAll<A0>>;
/**
 * `type::date(value: any) -> datetime`
 *
 * Only on SurrealDB 4.
 */
declare const date: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof DateTimeCodec, ParamsOfAll<A0>>;
/**
 * `type::datetime(value: any) -> datetime`
 *
 * SurrealDB 3 and 4.
 */
declare const datetime: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof DateTimeCodec, ParamsOfAll<A0>>;
/**
 * `type::decimal(value: any) -> decimal`
 *
 * SurrealDB 3 and 4.
 */
declare const decimal: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof DecimalCodec, ParamsOfAll<A0>>;
/**
 * `type::duration(value: any) -> duration`
 *
 * SurrealDB 3 and 4.
 */
declare const duration: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof DurationCodec, ParamsOfAll<A0>>;
/**
 * `type::f16(value: any) -> float`
 *
 * Only on SurrealDB 4.
 */
declare const f16: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof FloatCodec, ParamsOfAll<A0>>;
/**
 * `type::f32(value: any) -> float`
 *
 * Only on SurrealDB 4.
 */
declare const f32: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof FloatCodec, ParamsOfAll<A0>>;
/**
 * `type::field(field: string) -> any`
 *
 * SurrealDB 3 and 4.
 */
declare const field: <const A0 extends Arg<In["string"]>>(field: A0) => Expr<typeof AnyCodec, ParamsOfAll<A0>>;
/**
 * `type::fields(fields: array<string>) -> array`
 *
 * SurrealDB 3 and 4.
 */
declare const fields: <const A0 extends Arg<ReadonlyArray<In["string"]>>>(fields: A0) => Expr<typeof ArrayCodec, ParamsOfAll<A0>>;
/**
 * `type::float(value: any) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const float: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof FloatCodec, ParamsOfAll<A0>>;
/**
 * `type::geometry(value: any) -> geometry`
 *
 * SurrealDB 3 and 4.
 */
declare const geometry: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof GeometryCodec, ParamsOfAll<A0>>;
/**
 * `type::i16(value: any) -> int`
 *
 * Only on SurrealDB 4.
 */
declare const i16: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `type::i32(value: any) -> int`
 *
 * Only on SurrealDB 4.
 */
declare const i32: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `type::i8(value: any) -> int`
 *
 * Only on SurrealDB 4.
 */
declare const i8: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `type::int(value: any) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const int: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `type::interval(value: any) -> string`
 *
 * Only on SurrealDB 4.
 */
declare const interval: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;
/**
 * `type::is_array(value: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isArray: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_bool(value: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isBool: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_bytes(value: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isBytes: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_collection(value: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isCollection: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_date(value: any) -> bool`
 *
 * Only on SurrealDB 4.
 */
declare const isDate: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_datetime(value: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isDatetime: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_decimal(value: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isDecimal: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_duration(value: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isDuration: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_f16(value: any) -> bool`
 *
 * Only on SurrealDB 4.
 */
declare const isF16: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_f32(value: any) -> bool`
 *
 * Only on SurrealDB 4.
 */
declare const isF32: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_float(value: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isFloat: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_geometry(value: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isGeometry: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_i16(value: any) -> bool`
 *
 * Only on SurrealDB 4.
 */
declare const isI16: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_i32(value: any) -> bool`
 *
 * Only on SurrealDB 4.
 */
declare const isI32: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_i8(value: any) -> bool`
 *
 * Only on SurrealDB 4.
 */
declare const isI8: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_int(value: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isInt: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_interval(value: any) -> bool`
 *
 * Only on SurrealDB 4.
 */
declare const isInterval: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_line(value: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isLine: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_multiline(value: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isMultiline: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_multipoint(value: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isMultipoint: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_multipolygon(value: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isMultipolygon: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_none(value: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isNone: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_null(value: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isNull: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_number(value: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isNumber: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_object(value: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isObject: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_point(value: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isPoint: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_polygon(value: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isPolygon: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_range(value: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isRange: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_record(value: any, table?: string) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isRecord: <const A0 extends Arg<In["any"]>, const A1 extends Arg<In["string"]> = never>(value: A0, table?: A1) => Expr<typeof BoolCodec, ParamsOfAll<A0 | A1>>;
/**
 * `type::is_set(value: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isSet: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_string(value: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isString: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_time(value: any) -> bool`
 *
 * Only on SurrealDB 4.
 */
declare const isTime: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_timestamp(value: any) -> bool`
 *
 * Only on SurrealDB 4.
 */
declare const isTimestamp: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_u16(value: any) -> bool`
 *
 * Only on SurrealDB 4.
 */
declare const isU16: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_u32(value: any) -> bool`
 *
 * Only on SurrealDB 4.
 */
declare const isU32: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_u64(value: any) -> bool`
 *
 * Only on SurrealDB 4.
 */
declare const isU64: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_u8(value: any) -> bool`
 *
 * Only on SurrealDB 4.
 */
declare const isU8: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::is_uuid(value: any) -> bool`
 *
 * SurrealDB 3 and 4.
 */
declare const isUuid: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof BoolCodec, ParamsOfAll<A0>>;
/**
 * `type::number(value: any) -> number`
 *
 * SurrealDB 3 and 4.
 */
declare const number: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof NumberCodec, ParamsOfAll<A0>>;
/**
 * `type::of(value: any) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const of: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;
/**
 * `type::point(value: any) -> geometry`
 *
 * SurrealDB 3 and 4.
 */
declare const point: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof GeometryCodec, ParamsOfAll<A0>>;
/**
 * `type::range(value: any) -> range`
 *
 * SurrealDB 3 and 4.
 */
declare const range: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof RangeCodec, ParamsOfAll<A0>>;
/**
 * `type::record(value: any, key?: any) -> record`
 *
 * SurrealDB 3 and 4.
 */
declare const record: <const A0 extends Arg<In["any"]>, const A1 extends Arg<In["any"]> = never>(value: A0, key?: A1) => Expr<typeof RecordCodec, ParamsOfAll<A0 | A1>>;
/**
 * `type::set(value: any) -> any`
 *
 * SurrealDB 3 and 4.
 */
declare const set: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof AnyCodec, ParamsOfAll<A0>>;
/**
 * `type::string(value: any) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const string: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;
/**
 * `type::string_lossy(value: bytes) -> string`
 *
 * SurrealDB 3 and 4.
 */
declare const stringLossy: <const A0 extends Arg<In["bytes"]>>(value: A0) => Expr<typeof StringCodec, ParamsOfAll<A0>>;
/**
 * `type::table(value: any) -> any`
 *
 * SurrealDB 3 and 4.
 */
declare const table: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof AnyCodec, ParamsOfAll<A0>>;
/**
 * `type::time(value: any) -> duration`
 *
 * Only on SurrealDB 4.
 */
declare const time: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof DurationCodec, ParamsOfAll<A0>>;
/**
 * `type::timestamp(value: any) -> datetime`
 *
 * Only on SurrealDB 4.
 */
declare const timestamp: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof DateTimeCodec, ParamsOfAll<A0>>;
/**
 * `type::u16(value: any) -> int`
 *
 * Only on SurrealDB 4.
 */
declare const u16: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `type::u32(value: any) -> int`
 *
 * Only on SurrealDB 4.
 */
declare const u32: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `type::u64(value: any) -> int`
 *
 * Only on SurrealDB 4.
 */
declare const u64: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `type::u8(value: any) -> int`
 *
 * Only on SurrealDB 4.
 */
declare const u8: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof IntCodec, ParamsOfAll<A0>>;
/**
 * `type::uuid(value: any) -> uuid`
 *
 * SurrealDB 3 and 4.
 */
declare const uuid: <const A0 extends Arg<In["any"]>>(value: A0) => Expr<typeof UuidCodec, ParamsOfAll<A0>>;

declare const type_array: typeof array;
declare const type_bool: typeof bool;
declare const type_bytes: typeof bytes;
declare const type_date: typeof date;
declare const type_datetime: typeof datetime;
declare const type_decimal: typeof decimal;
declare const type_duration: typeof duration;
declare const type_f16: typeof f16;
declare const type_f32: typeof f32;
declare const type_field: typeof field;
declare const type_fields: typeof fields;
declare const type_float: typeof float;
declare const type_geometry: typeof geometry;
declare const type_i16: typeof i16;
declare const type_i32: typeof i32;
declare const type_i8: typeof i8;
declare const type_int: typeof int;
declare const type_interval: typeof interval;
declare const type_isArray: typeof isArray;
declare const type_isBool: typeof isBool;
declare const type_isBytes: typeof isBytes;
declare const type_isCollection: typeof isCollection;
declare const type_isDate: typeof isDate;
declare const type_isDatetime: typeof isDatetime;
declare const type_isDecimal: typeof isDecimal;
declare const type_isDuration: typeof isDuration;
declare const type_isF16: typeof isF16;
declare const type_isF32: typeof isF32;
declare const type_isFloat: typeof isFloat;
declare const type_isGeometry: typeof isGeometry;
declare const type_isI16: typeof isI16;
declare const type_isI32: typeof isI32;
declare const type_isI8: typeof isI8;
declare const type_isInt: typeof isInt;
declare const type_isInterval: typeof isInterval;
declare const type_isLine: typeof isLine;
declare const type_isMultiline: typeof isMultiline;
declare const type_isMultipoint: typeof isMultipoint;
declare const type_isMultipolygon: typeof isMultipolygon;
declare const type_isNone: typeof isNone;
declare const type_isNull: typeof isNull;
declare const type_isNumber: typeof isNumber;
declare const type_isObject: typeof isObject;
declare const type_isPoint: typeof isPoint;
declare const type_isPolygon: typeof isPolygon;
declare const type_isRange: typeof isRange;
declare const type_isRecord: typeof isRecord;
declare const type_isSet: typeof isSet;
declare const type_isString: typeof isString;
declare const type_isTime: typeof isTime;
declare const type_isTimestamp: typeof isTimestamp;
declare const type_isU16: typeof isU16;
declare const type_isU32: typeof isU32;
declare const type_isU64: typeof isU64;
declare const type_isU8: typeof isU8;
declare const type_isUuid: typeof isUuid;
declare const type_number: typeof number;
declare const type_of: typeof of;
declare const type_point: typeof point;
declare const type_range: typeof range;
declare const type_record: typeof record;
declare const type_set: typeof set;
declare const type_string: typeof string;
declare const type_stringLossy: typeof stringLossy;
declare const type_table: typeof table;
declare const type_time: typeof time;
declare const type_timestamp: typeof timestamp;
declare const type_u16: typeof u16;
declare const type_u32: typeof u32;
declare const type_u64: typeof u64;
declare const type_u8: typeof u8;
declare const type_uuid: typeof uuid;
declare namespace type {
  export { type_array as array, type_bool as bool, type_bytes as bytes, type_date as date, type_datetime as datetime, type_decimal as decimal, type_duration as duration, type_f16 as f16, type_f32 as f32, type_field as field, type_fields as fields, type_float as float, type_geometry as geometry, type_i16 as i16, type_i32 as i32, type_i8 as i8, type_int as int, type_interval as interval, type_isArray as isArray, type_isBool as isBool, type_isBytes as isBytes, type_isCollection as isCollection, type_isDate as isDate, type_isDatetime as isDatetime, type_isDecimal as isDecimal, type_isDuration as isDuration, type_isF16 as isF16, type_isF32 as isF32, type_isFloat as isFloat, type_isGeometry as isGeometry, type_isI16 as isI16, type_isI32 as isI32, type_isI8 as isI8, type_isInt as isInt, type_isInterval as isInterval, type_isLine as isLine, type_isMultiline as isMultiline, type_isMultipoint as isMultipoint, type_isMultipolygon as isMultipolygon, type_isNone as isNone, type_isNull as isNull, type_isNumber as isNumber, type_isObject as isObject, type_isPoint as isPoint, type_isPolygon as isPolygon, type_isRange as isRange, type_isRecord as isRecord, type_isSet as isSet, type_isString as isString, type_isTime as isTime, type_isTimestamp as isTimestamp, type_isU16 as isU16, type_isU32 as isU32, type_isU64 as isU64, type_isU8 as isU8, type_isUuid as isUuid, type_number as number, type_of as of, type_point as point, type_range as range, type_record as record, type_set as set, type_string as string, type_stringLossy as stringLossy, type_table as table, type_time as time, type_timestamp as timestamp, type_u16 as u16, type_u32 as u32, type_u64 as u64, type_u8 as u8, type_uuid as uuid };
}

/**
 * `value::diff(from: any, to: any) -> array<object>`
 *
 * SurrealDB 3 and 4.
 */
declare const diff: <const A0 extends Arg<In["any"]>, const A1 extends Arg<In["any"]>>(from: A0, to: A1) => Expr<typeof ArrayOfObjectCodec, ParamsOfAll<A0 | A1>>;
/**
 * `value::patch(value: any, patch: array<object>) -> any`
 *
 * SurrealDB 3 and 4.
 */
declare const patch: <const A0 extends Arg<In["any"]>, const A1 extends Arg<ReadonlyArray<In["object"]>>>(value: A0, patch: A1) => Expr<typeof AnyCodec, ParamsOfAll<A0 | A1>>;

declare const value_diff: typeof diff;
declare const value_patch: typeof patch;
declare namespace value {
  export { value_diff as diff, value_patch as patch };
}

/**
 * `vector::add(left: array<number>, right: array<number>) -> array<number>`
 *
 * SurrealDB 3 and 4.
 */
declare const add: <const A0 extends Arg<ReadonlyArray<In["number"]>>, const A1 extends Arg<ReadonlyArray<In["number"]>>>(left: A0, right: A1) => Expr<typeof ArrayOfNumberCodec, ParamsOfAll<A0 | A1>>;
/**
 * `vector::angle(left: array<number>, right: array<number>) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const angle: <const A0 extends Arg<ReadonlyArray<In["number"]>>, const A1 extends Arg<ReadonlyArray<In["number"]>>>(left: A0, right: A1) => Expr<typeof FloatCodec, ParamsOfAll<A0 | A1>>;
/**
 * `vector::cross(left: array<number>, right: array<number>) -> array<number>`
 *
 * SurrealDB 3 and 4.
 */
declare const cross: <const A0 extends Arg<ReadonlyArray<In["number"]>>, const A1 extends Arg<ReadonlyArray<In["number"]>>>(left: A0, right: A1) => Expr<typeof ArrayOfNumberCodec, ParamsOfAll<A0 | A1>>;
/**
 * `vector::distance::chebyshev(left: array<number>, right: array<number>) -> number`
 *
 * SurrealDB 3 and 4.
 */
declare const distanceChebyshev: <const A0 extends Arg<ReadonlyArray<In["number"]>>, const A1 extends Arg<ReadonlyArray<In["number"]>>>(left: A0, right: A1) => Expr<typeof NumberCodec, ParamsOfAll<A0 | A1>>;
/**
 * `vector::distance::cosine(left: array<number>, right: array<number>) -> float|decimal:0,1`
 *
 * A float; a float or a decimal when `left` or `right` may hold a decimal.
 *
 * Only on SurrealDB 4.
 */
declare const distanceCosine: <const A0 extends Arg<ReadonlyArray<In["number"]>>, const A1 extends Arg<ReadonlyArray<In["number"]>>>(left: A0, right: A1) => Expr<FloatOrDecimalCodec<A0 | A1>, ParamsOfAll<A0 | A1>>;
/**
 * `vector::distance::euclidean(left: array<number>, right: array<number>) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const distanceEuclidean: <const A0 extends Arg<ReadonlyArray<In["number"]>>, const A1 extends Arg<ReadonlyArray<In["number"]>>>(left: A0, right: A1) => Expr<typeof FloatCodec, ParamsOfAll<A0 | A1>>;
/**
 * `vector::distance::hamming(left: array<number>, right: array<number>) -> int`
 *
 * SurrealDB 3 and 4.
 */
declare const distanceHamming: <const A0 extends Arg<ReadonlyArray<In["number"]>>, const A1 extends Arg<ReadonlyArray<In["number"]>>>(left: A0, right: A1) => Expr<typeof IntCodec, ParamsOfAll<A0 | A1>>;
/**
 * `vector::distance::mahalanobis(left: array<number>, right: array<number>, covariance: array<array<number>>) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const distanceMahalanobis: <const A0 extends Arg<ReadonlyArray<In["number"]>>, const A1 extends Arg<ReadonlyArray<In["number"]>>, const A2 extends Arg<ReadonlyArray<ReadonlyArray<In["number"]>>>>(left: A0, right: A1, covariance: A2) => Expr<typeof FloatCodec, ParamsOfAll<A0 | A1 | A2>>;
/**
 * `vector::distance::manhattan(left: array<number>, right: array<number>) -> number`
 *
 * SurrealDB 3 and 4.
 */
declare const distanceManhattan: <const A0 extends Arg<ReadonlyArray<In["number"]>>, const A1 extends Arg<ReadonlyArray<In["number"]>>>(left: A0, right: A1) => Expr<typeof NumberCodec, ParamsOfAll<A0 | A1>>;
/**
 * `vector::distance::minkowski(left: array<number>, right: array<number>, order: number) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const distanceMinkowski: <const A0 extends Arg<ReadonlyArray<In["number"]>>, const A1 extends Arg<ReadonlyArray<In["number"]>>, const A2 extends Arg<In["number"]>>(left: A0, right: A1, order: A2) => Expr<typeof FloatCodec, ParamsOfAll<A0 | A1 | A2>>;
/**
 * `vector::divide(left: array<number>, right: array<number>) -> array<number>`
 *
 * SurrealDB 3 and 4.
 */
declare const divide: <const A0 extends Arg<ReadonlyArray<In["number"]>>, const A1 extends Arg<ReadonlyArray<In["number"]>>>(left: A0, right: A1) => Expr<typeof ArrayOfNumberCodec, ParamsOfAll<A0 | A1>>;
/**
 * `vector::dot(left: array<number>, right: array<number>) -> number`
 *
 * SurrealDB 3 and 4.
 */
declare const dot: <const A0 extends Arg<ReadonlyArray<In["number"]>>, const A1 extends Arg<ReadonlyArray<In["number"]>>>(left: A0, right: A1) => Expr<typeof NumberCodec, ParamsOfAll<A0 | A1>>;
/**
 * `vector::magnitude(vector: array<number>) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const magnitude: <const A0 extends Arg<ReadonlyArray<In["number"]>>>(vector: A0) => Expr<typeof FloatCodec, ParamsOfAll<A0>>;
/**
 * `vector::multiply(left: array<number>, right: array<number>) -> array<number>`
 *
 * SurrealDB 3 and 4.
 */
declare const multiply: <const A0 extends Arg<ReadonlyArray<In["number"]>>, const A1 extends Arg<ReadonlyArray<In["number"]>>>(left: A0, right: A1) => Expr<typeof ArrayOfNumberCodec, ParamsOfAll<A0 | A1>>;
/**
 * `vector::normalize(vector: array<number>) -> array<number>`
 *
 * SurrealDB 3 and 4.
 */
declare const normalize: <const A0 extends Arg<ReadonlyArray<In["number"]>>>(vector: A0) => Expr<typeof ArrayOfNumberCodec, ParamsOfAll<A0>>;
/**
 * `vector::project(left: array<number>, right: array<number>) -> array<number>`
 *
 * SurrealDB 3 and 4.
 */
declare const project: <const A0 extends Arg<ReadonlyArray<In["number"]>>, const A1 extends Arg<ReadonlyArray<In["number"]>>>(left: A0, right: A1) => Expr<typeof ArrayOfNumberCodec, ParamsOfAll<A0 | A1>>;
/**
 * `vector::scale(vector: array<number>, factor: number) -> array<number>`
 *
 * SurrealDB 3 and 4.
 */
declare const scale: <const A0 extends Arg<ReadonlyArray<In["number"]>>, const A1 extends Arg<In["number"]>>(vector: A0, factor: A1) => Expr<typeof ArrayOfNumberCodec, ParamsOfAll<A0 | A1>>;
/**
 * `vector::similarity::cosine(left: array<number>, right: array<number>) -> float|decimal:0,1`
 *
 * A float; a float or a decimal when `left` or `right` may hold a decimal.
 *
 * SurrealDB 3 and 4.
 */
declare const similarityCosine: <const A0 extends Arg<ReadonlyArray<In["number"]>>, const A1 extends Arg<ReadonlyArray<In["number"]>>>(left: A0, right: A1) => Expr<FloatOrDecimalCodec<A0 | A1>, ParamsOfAll<A0 | A1>>;
/**
 * `vector::similarity::jaccard(left: array<number>, right: array<number>) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const similarityJaccard: <const A0 extends Arg<ReadonlyArray<In["number"]>>, const A1 extends Arg<ReadonlyArray<In["number"]>>>(left: A0, right: A1) => Expr<typeof FloatCodec, ParamsOfAll<A0 | A1>>;
/**
 * `vector::similarity::pearson(left: array<number>, right: array<number>) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const similarityPearson: <const A0 extends Arg<ReadonlyArray<In["number"]>>, const A1 extends Arg<ReadonlyArray<In["number"]>>>(left: A0, right: A1) => Expr<typeof FloatCodec, ParamsOfAll<A0 | A1>>;
/**
 * `vector::similarity::spearman(left: array<number>, right: array<number>) -> float`
 *
 * SurrealDB 3 and 4.
 */
declare const similaritySpearman: <const A0 extends Arg<ReadonlyArray<In["number"]>>, const A1 extends Arg<ReadonlyArray<In["number"]>>>(left: A0, right: A1) => Expr<typeof FloatCodec, ParamsOfAll<A0 | A1>>;
/**
 * `vector::subtract(left: array<number>, right: array<number>) -> array<number>`
 *
 * SurrealDB 3 and 4.
 */
declare const subtract: <const A0 extends Arg<ReadonlyArray<In["number"]>>, const A1 extends Arg<ReadonlyArray<In["number"]>>>(left: A0, right: A1) => Expr<typeof ArrayOfNumberCodec, ParamsOfAll<A0 | A1>>;
/**
 * `vector::sum(vectors: array<array<number>>) -> option<array<number>>`
 *
 * SurrealDB 3 and 4.
 */
declare const sum: <const A0 extends Arg<ReadonlyArray<ReadonlyArray<In["number"]>>>>(vectors: A0) => Expr<typeof OptionOfArrayOfNumberCodec, ParamsOfAll<A0>>;

declare const vector_add: typeof add;
declare const vector_angle: typeof angle;
declare const vector_cross: typeof cross;
declare const vector_distanceChebyshev: typeof distanceChebyshev;
declare const vector_distanceCosine: typeof distanceCosine;
declare const vector_distanceEuclidean: typeof distanceEuclidean;
declare const vector_distanceHamming: typeof distanceHamming;
declare const vector_distanceMahalanobis: typeof distanceMahalanobis;
declare const vector_distanceManhattan: typeof distanceManhattan;
declare const vector_distanceMinkowski: typeof distanceMinkowski;
declare const vector_divide: typeof divide;
declare const vector_dot: typeof dot;
declare const vector_magnitude: typeof magnitude;
declare const vector_multiply: typeof multiply;
declare const vector_normalize: typeof normalize;
declare const vector_project: typeof project;
declare const vector_scale: typeof scale;
declare const vector_similarityCosine: typeof similarityCosine;
declare const vector_similarityJaccard: typeof similarityJaccard;
declare const vector_similarityPearson: typeof similarityPearson;
declare const vector_similaritySpearman: typeof similaritySpearman;
declare const vector_subtract: typeof subtract;
declare const vector_sum: typeof sum;
declare namespace vector {
  export { vector_add as add, vector_angle as angle, vector_cross as cross, vector_distanceChebyshev as distanceChebyshev, vector_distanceCosine as distanceCosine, vector_distanceEuclidean as distanceEuclidean, vector_distanceHamming as distanceHamming, vector_distanceMahalanobis as distanceMahalanobis, vector_distanceManhattan as distanceManhattan, vector_distanceMinkowski as distanceMinkowski, vector_divide as divide, vector_dot as dot, vector_magnitude as magnitude, vector_multiply as multiply, vector_normalize as normalize, vector_project as project, vector_scale as scale, vector_similarityCosine as similarityCosine, vector_similarityJaccard as similarityJaccard, vector_similarityPearson as similarityPearson, vector_similaritySpearman as similaritySpearman, vector_subtract as subtract, vector_sum as sum };
}

export { type Arg, type CodecOfArg, type FloatOrDecimalCodec, type In, type Inline, type ItemCodec, array$1 as array, bytes$1 as bytes, crypto, duration$2 as duration, encoding, geo, math, meta, object, parse, rand, record$1 as record, search, string$1 as string, time$1 as time, type, value, vector };
