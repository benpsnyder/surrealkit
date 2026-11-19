import { Schema } from 'effect';
import { DateTime, Decimal, Duration, Uuid } from 'surrealdb';
import { F as FunctionDescriptor, a as Float, S as SurrealNumber, D as Decimal$1, I as Int64 } from './value-Zktp5N5S.js';
import { C as Codec, P as Params, N as NoParams } from './statement-DsQDMl9Y.js';

/**
 * Expressions: SurrealQL fragments as plain values.
 *
 * An expression carries its static text, the codec of the value it yields
 * (in the native world, so a returned value decodes with it) and the codec of
 * every binding it reads. Combining expressions combines their bindings, so
 * a statement cannot read a binding it did not declare.
 */

declare const ExprTypeId = "~effect-surrealkit/Expr";
interface ExprData<S extends Codec, P extends Params> {
    readonly codec: S;
    readonly sql: string;
    readonly params: P;
    /** How loosely the text binds, which decides where it needs parentheses. */
    readonly level: Level;
    /** Set when the text is a field path of the row. */
    readonly path?: PathData;
    /** What the text reads besides its bindings; absent when nothing. */
    readonly context?: Context;
}
/**
 * The row a row object's field paths read: a select's or a write's row, the
 * edge a step's `where` reads, the record a destructuring reads, or the node
 * a recursive path repeats its step from. A path's text is relative, so it
 * reads whichever row is current where it is placed; the scope says which
 * row it was written for.
 *
 * @internal
 */
declare class RowScope {
    readonly kind: 'select' | 'write' | 'edge' | 'target' | 'reached' | 'node';
    readonly table: string;
    constructor(kind: 'select' | 'write' | 'edge' | 'target' | 'reached' | 'node', table: string);
}
/**
 * Which row of each table a statement reads: the generated `select` row of
 * a privileged reader, or the `visible` row of a session whose field
 * permissions may hide fields (`readAs`).
 */
type Reader = 'privileged' | 'restricted';
/**
 * What an expression reads besides its bindings, merged wherever expressions
 * are combined ({@link derive}) and checked where a callback's result is
 * placed ({@link admit}) and where a statement is built.
 *
 * @internal
 */
interface Context {
    /** Each row whose field paths the text reads, with the first field read. */
    readonly reads?: ReadonlyMap<RowScope, string>;
    /** `parent(row.field)` reads not yet inside a step's `where`. */
    readonly loose?: ReadonlyMap<RowScope, string>;
    /** `parent(row.field)` reads inside a step's `where`, awaiting their select. */
    readonly placed?: ReadonlyMap<RowScope, string>;
    /** The readers of the store views the text reads records through. */
    readonly readers?: ReadonlySet<Reader>;
}
/**
 * Where a field path starts: the top-level field it reads, as the row
 * schema names it and as the text spells it.
 *
 * @internal
 */
interface PathData {
    readonly root: string;
    readonly rootSql: string;
}
/**
 * Binding strength, loosest last: a field, binding, literal or call; a
 * comparison; a conjunction; a disjunction; raw text of unknown shape.
 *
 * @internal
 */
declare const Level: {
    readonly atom: 0;
    readonly comparison: 1;
    readonly and: 2;
    readonly or: 3;
    readonly raw: 4;
};
/** @internal */
type Level = (typeof Level)[keyof typeof Level];
/**
 * A SurrealQL expression yielding a value of codec `S`, reading the bindings
 * `P`. Its data sits under one key so that a row's nested fields can be
 * plain properties without ever colliding with it.
 */
interface Expr<S extends Codec = Codec, P extends Params = Params> {
    readonly [ExprTypeId]: ExprData<S, P>;
}
/**
 * A field path of the row (`name`, `address.city`, `phones[0]`): what
 * `ORDER BY` accepts. The row's field expressions are paths, and so is an
 * element of one ({@link at}); nothing else is.
 */
interface Path<S extends Codec = Codec> extends Expr<S, NoParams> {
    readonly [ExprTypeId]: ExprData<S, NoParams> & {
        readonly path: PathData;
    };
}
/** The codec of the value an expression yields. */
type CodecOf<E> = E extends Expr<infer S, Params> ? S : never;
/** The bindings an expression reads. */
type ParamsOf<E> = E extends Expr<Codec, infer P> ? P : never;
type UnionToIntersection<U> = (U extends unknown ? (value: U) => void : never) extends (value: infer I) => void ? I : never;
/** The bindings several expressions read together. */
type ParamsOfAll<E> = [ParamsOf<E>] extends [never] ? NoParams : UnionToIntersection<ParamsOf<E>> extends infer I extends Params ? I : NoParams;
declare const isExpr: (value: unknown) => value is Expr;
/** Whether `value` is a field path of a row. */
declare const isPath: (value: unknown) => value is Path;
/** The codec of the value `expr` yields. */
declare const codecOf: <S extends Codec>(expr: Expr<S, Params>) => S;
/** The SurrealQL text of `expr`. */
declare const sqlOf: (expr: Expr) => string;
/** The codec of each binding `expr` reads. */
declare const paramsOf: <P extends Params>(expr: Expr<Codec, P>) => P;
/**
 * `$parent.field`: a field of the row of the select a step sits directly
 * under, read from the step's `where`, whose own field paths read the edge.
 * `field` is a field path of that select's row.
 *
 * It is accepted only there: SurrealDB 3.3 and 4.0 agree on `$parent` in a
 * step's `where` directly under a select's row (chained steps and a step
 * from a binding included), and disagree inside a destructuring (3.3 binds
 * the outer row, 4.0 the destructured record), under a recursive path and
 * under a bare `RETURN` or a block, so each of those refuses it when the
 * statement is built.
 *
 * @example
 * select(PersonTable).project((row) => ({
 *   peers: outgoing(store, row.id, 'knows', {
 *     where: (edge) => ne(edge.out, parent(row.id)),
 *   }),
 * }));
 * // SELECT id->(knows WHERE out != $parent.id)->? AS peers FROM ⟨person⟩
 */
declare const parent: <const F extends Expr>(field: F extends Path ? F : "`parent` takes a field path of a select\u2019s row, like `parent(row.name)`") => Expr<CodecOf<F>, NoParams>;
/**
 * A named binding. The value is supplied when the statement runs and is
 * encoded through `codec` first, so a value the codec refuses never reaches
 * the engine.
 */
declare const param: <const Name extends string, S extends Codec>(name: Name, codec: S) => Expr<S, { readonly [K in Name]: S; }>;
/** A value SurrealQL can spell as a literal without a codec. */
type Primitive = string | number | boolean | bigint | null | undefined;
/** The codec of an inline primitive. */
type LiteralCodec<V> = [V] extends [null] ? Schema.Null : [V] extends [undefined] ? Schema.Undefined : V extends string | number | boolean | bigint ? Schema.Literal<V> : never;
/**
 * A constant written into the statement text. The constant is part of the
 * statement, not input: it is fixed when the statement is defined, and is
 * spelt as SurrealQL spells it (`s"…"`, `d"…"`, `r"…"`).
 *
 * With a codec, the value is encoded through it first, so SDK values
 * (`DateTime`, `RecordId`, `Duration`, …) and nested data can be inlined.
 * Every part is then checked as a binding of its kind would be: a string
 * must be well-formed and an integer must fit a signed 64-bit int. A
 * datetime is written with `dateTimeToString`. A `Set`, a `Map`, bytes and
 * other values without a faithful literal are refused.
 * Never pass request input here: bind it with {@link param}.
 */
declare function literal<const V extends Primitive>(value: V): Expr<LiteralCodec<V>, NoParams>;
declare function literal<S extends Codec>(value: S['Type'], codec: S): Expr<S, NoParams>;
/** An expression, or a primitive to inline with {@link literal}. */
type Operand = Expr | Primitive;
/** The stored type an operand compares as. */
type OperandEncoded<V> = V extends Expr<infer S, Params> ? S['Encoded'] : V;
/** The bindings an operand reads. */
type OperandParams<V> = V extends Expr<Codec, infer P> ? P : NoParams;
/**
 * Raw SurrealQL with a declared codec and bindings: the escape hatch for
 * what the typed functions do not cover yet. Nothing checks the text, its
 * bindings or its codec, and the text is used as written, so it must never
 * be built from input.
 */
declare const unsafeExpr: <S extends Codec, P extends Params = NoParams>(options: {
    readonly sql: string;
    readonly codec: S;
    readonly params?: P;
    /** Set when the text needs no parentheses as an operand. */
    readonly atomic?: boolean;
}) => Expr<S, P>;
/**
 * The right operand `V`, when its stored type `B` compares with the left
 * operand's stored type `A`: one is assignable to the other. Refinements
 * and brands sit on the decoded type, so a branded or narrowed binding
 * still compares with its column, while a string never compares with an
 * int. Otherwise the operand's expected type is a message saying so.
 */
type Comparable<A, B, V> = [A] extends [B] ? V : [B] extends [A] ? V : 'these operands never compare: their stored types do not overlap';
type BooleanCodec = Schema.Codec<unknown, boolean, never, never>;
/** `left = right` */
declare const eq: <A extends Codec, PA extends Params, const B extends Operand>(left: Expr<A, PA>, right: Comparable<A["Encoded"], OperandEncoded<B>, B>) => Expr<Schema.Boolean, PA & OperandParams<B>>;
/** `left != right` */
declare const ne: <A extends Codec, PA extends Params, const B extends Operand>(left: Expr<A, PA>, right: Comparable<A["Encoded"], OperandEncoded<B>, B>) => Expr<Schema.Boolean, PA & OperandParams<B>>;
/** `left < right` */
declare const lt: <A extends Codec, PA extends Params, const B extends Operand>(left: Expr<A, PA>, right: Comparable<A["Encoded"], OperandEncoded<B>, B>) => Expr<Schema.Boolean, PA & OperandParams<B>>;
/** `left <= right` */
declare const lte: <A extends Codec, PA extends Params, const B extends Operand>(left: Expr<A, PA>, right: Comparable<A["Encoded"], OperandEncoded<B>, B>) => Expr<Schema.Boolean, PA & OperandParams<B>>;
/** `left > right` */
declare const gt: <A extends Codec, PA extends Params, const B extends Operand>(left: Expr<A, PA>, right: Comparable<A["Encoded"], OperandEncoded<B>, B>) => Expr<Schema.Boolean, PA & OperandParams<B>>;
/** `left >= right` */
declare const gte: <A extends Codec, PA extends Params, const B extends Operand>(left: Expr<A, PA>, right: Comparable<A["Encoded"], OperandEncoded<B>, B>) => Expr<Schema.Boolean, PA & OperandParams<B>>;
/** Every operand holds. */
declare const and: <const A extends readonly [Expr<BooleanCodec, Params>, ...ReadonlyArray<Expr<BooleanCodec, Params>>]>(...operands: A) => Expr<Schema.Boolean, ParamsOfAll<A[number]>>;
/** At least one operand holds. */
declare const or: <const A extends readonly [Expr<BooleanCodec, Params>, ...ReadonlyArray<Expr<BooleanCodec, Params>>]>(...operands: A) => Expr<Schema.Boolean, ParamsOfAll<A[number]>>;
/** `!value` */
declare const not: <P extends Params>(value: Expr<BooleanCodec, P>) => Expr<Schema.Boolean, P>;
/** `value = NONE`: the field is absent, or the expression yields nothing. */
declare const isNone: <P extends Params>(value: Expr<Codec, P>) => Expr<Schema.Boolean, P>;
/** `value != NONE` */
declare const isNotNone: <P extends Params>(value: Expr<Codec, P>) => Expr<Schema.Boolean, P>;
/** The element type of a stored array or set. */
type ElementOf<E> = E extends ReadonlyArray<infer I> ? I : E extends ReadonlySet<infer I> ? I : never;
type ListItem = string | number | boolean | bigint | null;
/** An array or set expression, or primitives to inline as an array. */
type Collection = Expr | ReadonlyArray<ListItem>;
type CollectionEncoded<V> = V extends Expr<infer S, Params> ? S['Encoded'] : V;
/** `needle INSIDE haystack`: the value is an element of the array or set. */
declare const inside: <A extends Codec, PA extends Params, const B extends Collection>(needle: Expr<A, PA>, haystack: Comparable<A["Encoded"], ElementOf<CollectionEncoded<B>>, B>) => Expr<Schema.Boolean, PA & OperandParams<B>>;
/** `haystack CONTAINS needle`: the array or set holds the value. */
declare const contains: <A extends Codec, PA extends Params, const B extends Operand>(haystack: Expr<A, PA>, needle: Comparable<ElementOf<A["Encoded"]>, OperandEncoded<B>, B>) => Expr<Schema.Boolean, PA & OperandParams<B>>;
/** The codec an array's element decodes with. */
type ItemOf<S extends Codec> = S['Encoded'] extends ReadonlyArray<unknown> ? S extends {
    readonly value: infer I extends Codec;
} ? I : never : never;
/** A codec that also accepts NONE, unless it already does. */
type OrNone<S extends Codec> = undefined extends S['Type'] ? S : Schema.UndefinedOr<S>;
type ArrayOnly<S extends Codec> = [ItemOf<S>] extends [never] ? {
    readonly 'this expression is not an array, so it has no elements to index': S['Encoded'];
} : unknown;
/**
 * `array[index]`: one element, or NONE past the end. A negative index is
 * not an offset from the end in SurrealQL, so it is refused. An element of
 * a field path is a field path.
 */
declare function at<S extends Codec>(array: Path<S> & ArrayOnly<S>, index: number): Path<OrNone<ItemOf<S>>>;
declare function at<S extends Codec, P extends Params>(array: Expr<S, P> & ArrayOnly<S>, index: number): Expr<OrNone<ItemOf<S>>, P>;
declare const casts: {
    readonly bool: Schema.Boolean;
    readonly datetime: Schema.declareConstructor<DateTime, DateTime, readonly [], DateTime>;
    readonly decimal: Schema.declareConstructor<Decimal, Decimal, readonly [], Decimal>;
    readonly duration: Schema.declareConstructor<Duration, Duration, readonly [], Duration>;
    readonly float: Schema.Number;
    readonly int: Schema.declareConstructor<number, number, readonly [], number>;
    readonly number: Schema.declareConstructor<number | bigint | Decimal, number | bigint | Decimal, readonly [], number | bigint | Decimal>;
    readonly string: Schema.declareConstructor<string, string, readonly [], string>;
    readonly uuid: Schema.declareConstructor<Uuid, Uuid, readonly [], Uuid>;
};
/** The kinds {@link cast} converts to, and the codec each yields. */
type CastKind = keyof typeof casts;
/**
 * `<kind>value`: SurrealQL's cast. The engine fails the statement when the
 * value cannot be converted.
 */
declare const cast: <K extends CastKind, P extends Params>(kind: K, value: Expr<Codec, P>) => Expr<(typeof casts)[K], P>;
/** A function descriptor whose codecs need no services. */
type PureFunction = FunctionDescriptor & {
    readonly args: Codec;
    readonly returns: Codec;
};
type ArgumentOf<E> = Expr<Schema.Codec<unknown, E, never, never>, Params> | Extract<E, Primitive>;
type ArgumentsOf<T extends ReadonlyArray<unknown>> = {
    readonly [I in keyof T]: ArgumentOf<T[I]>;
};
/** The arguments a generated function accepts, as expressions. */
type CallArguments<F extends PureFunction> = F['args']['Encoded'] extends infer T extends ReadonlyArray<unknown> ? ArgumentsOf<T> : never;
type Ordinals = readonly [
    'first',
    'second',
    'third',
    'fourth',
    'fifth',
    'sixth',
    'seventh',
    'eighth',
    'ninth',
    'tenth'
];
type OrdinalOf<I> = I extends keyof Ordinals ? Ordinals[I] : 'next';
/**
 * The function `F`, or a message when `A` leaves out an argument it needs.
 * An argument past the last is refused where it is ({@link CheckedArguments}).
 */
type CallTarget<F extends PureFunction, A extends ReadonlyArray<unknown>> = A['length'] extends CallArguments<F>['length'] ? F : [Exclude<keyof A & `${number}`, keyof CallArguments<F>>] extends [never] ? `\`${F['name']}\` needs more than ${A['length']} ${A['length'] extends 1 ? 'argument' : 'arguments'}` : F;
/**
 * The arguments `A` as the caller wrote them, each checked against the
 * parameter in its position: one that does not fit, or one past the last
 * parameter, is typed as a message naming the position.
 */
type CheckedArguments<F extends PureFunction, A extends ReadonlyArray<unknown>> = {
    readonly [I in keyof A]: I extends keyof CallArguments<F> ? A[I] extends CallArguments<F>[I] ? A[I] : `\`${F['name']}\` does not accept this as its ${OrdinalOf<I>} argument` : `\`${F['name']}\` takes no ${OrdinalOf<I>} argument`;
};
/**
 * Calls a `DEFINE FUNCTION` through its generated descriptor: the arguments
 * are checked against the declared parameter kinds, trailing optional ones
 * may be left out, and the result decodes with the declared return kind.
 */
declare const call: <F extends PureFunction, const A extends ReadonlyArray<unknown>>(fn: CallTarget<F, A>, ...args: CheckedArguments<F, A>) => Expr<F["returns"], ParamsOfAll<A[number]>>;

/**
 * Arithmetic on numbers: `+`, `-`, `*` and `/`, with the result codec the
 * engine's answer decodes with.
 *
 * SurrealDB 3.3 and 4.0 agree (`test/conformance.test.ts` pins them): two
 * ints give an int, which fails the statement when it overflows a signed
 * 64-bit int ("Cannot perform addition with …"); an int and a float, or two
 * floats, a float (Infinity past the float range); any decimal operand a
 * decimal. Division of two ints truncates toward zero (`7 / 2` is `3`,
 * `-7 / 2` is `-3`), and division by zero, or by NONE, is the float NaN or
 * ±Infinity whatever the operands, so a quotient decodes as its kind or a
 * float. NONE, NULL, strings, booleans and arrays are refused as operands of
 * `+`, `-` and `*` ("Cannot perform addition with 'int' and 'none'"), so an
 * operand here is a number, never possibly NONE.
 *
 * A float binding is cast (`<float>$f`): the SDK sends a whole JS number as
 * an int whatever its codec, so `$f / 2` with `f = 7` would divide as ints
 * (`3`) on both engines. A stored float field is a float already.
 *
 * An operand's kind (int, float, decimal, or any number) is read from its
 * codec: the generated `Int`, `Int64`, `Float`, `Decimal` and
 * `SurrealNumber`, `Schema.Number` as a float, and a numeric literal by its
 * value. The compiler sees ints and floats alike as `number`, so the
 * result's decoded type is `number` for both; the codec is exact.
 */

/** An operand of arithmetic: a numeric expression, or a number to inline. */
type NumericOperand = Expr | number | bigint;
type EncodedOf<V> = V extends Expr<infer S, Params> ? S['Encoded'] : V;
/**
 * `V`, when it is a number SurrealDB computes with; otherwise a message
 * saying what SurrealDB refuses.
 */
type Numeric<V> = [EncodedOf<V>] extends [never] ? V : undefined extends EncodedOf<V> ? 'this operand may be NONE, and SurrealDB refuses NONE in arithmetic (`1 + NONE` fails the statement): read it where it is set' : null extends EncodedOf<V> ? 'this operand may be NULL, and SurrealDB refuses NULL in arithmetic' : [EncodedOf<V>] extends [number | bigint | Decimal] ? V : 'arithmetic takes numbers: SurrealDB refuses a string, a boolean, an array or another value as an operand of + - * /';
/** The kind of number a stored type is, as far as the compiler can tell. */
type KindOf<E> = [E] extends [Decimal] ? 'decimal' : [E] extends [number] ? 'number' : [E] extends [number | bigint] ? 'int64' : 'any';
type Joined<A, B> = 'any' extends A | B ? 'any' : 'decimal' extends A | B ? 'decimal' : 'int64' extends A | B ? 'number' extends A | B ? 'mixed' : 'int64' : 'number';
type ResultOf<K, Quotient extends boolean> = K extends 'any' ? typeof SurrealNumber : K extends 'decimal' ? Quotient extends true ? Schema.Codec<Decimal | number, Decimal | number, never, never> : typeof Decimal$1 : K extends 'int64' ? Quotient extends true ? Schema.Codec<Int64 | number, number | bigint, never, never> : typeof Int64 : K extends 'mixed' ? Schema.Codec<Int64 | number, number | bigint, never, never> : Schema.Codec<number, number, never, never>;
/** The codec of `left op right`: of a quotient, when `Quotient`. */
type ArithmeticCodec<A, B, Quotient extends boolean> = ResultOf<Joined<KindOf<EncodedOf<A>>, KindOf<EncodedOf<B>>>, Quotient>;
/**
 * `true` when a value of stored type `E` may be a decimal, or an array
 * holding one; `false` when it is certainly an int, a float, NONE or NULL
 * (or an array of them). The compiler's answer is never narrower than
 * {@link holdsDecimal}'s.
 */
type HoldsDecimal<E> = unknown extends E ? true : [E] extends [number | bigint | undefined | null] ? false : [E] extends [ReadonlyArray<infer I> | undefined | null] ? HoldsDecimal<I> : true;
/**
 * A float, or a decimal: what a function SurrealDB computes in the kind of
 * its input returns when that input may hold a decimal (`math::sqrt`,
 * `math::stddev`); some inputs still give a float (the spread of one value
 * is the int 0, the square root of a negative decimal NaN).
 */
declare const FloatOrDecimal: Schema.Union<readonly [Schema.declareConstructor<number, number, readonly [], number>, Schema.declareConstructor<Decimal, Decimal, readonly [], Decimal>]>;
/** {@link FloatOrDecimal} when `E` may hold a decimal, otherwise a float. */
type FloatOrDecimalOf<E> = HoldsDecimal<E> extends false ? typeof Float : typeof FloatOrDecimal;
/**
 * `left + right`: an int for two ints (an overflow fails the statement), a
 * float with a float, a decimal with a decimal.
 *
 * @example
 * select(PersonTable).value((row) => add(row.score, param('bonus', SurrealSchema.Int)));
 * // SELECT VALUE score + $bonus FROM ⟨person⟩
 */
declare const add: <const A, const B>(left: Numeric<A>, right: Numeric<B>) => Expr<ResultOf<Joined<KindOf<EncodedOf<A>>, KindOf<EncodedOf<B>>>, false>, OperandParams<A> & OperandParams<B>>;
/** `left - right`, of the kinds {@link add} gives. */
declare const sub: <const A, const B>(left: Numeric<A>, right: Numeric<B>) => Expr<ResultOf<Joined<KindOf<EncodedOf<A>>, KindOf<EncodedOf<B>>>, false>, OperandParams<A> & OperandParams<B>>;
/** `left * right`, of the kinds {@link add} gives. */
declare const mul: <const A, const B>(left: Numeric<A>, right: Numeric<B>) => Expr<ResultOf<Joined<KindOf<EncodedOf<A>>, KindOf<EncodedOf<B>>>, false>, OperandParams<A> & OperandParams<B>>;
/**
 * `left / right`: two ints truncate toward zero (`7 / 2` is `3`); a float
 * or a decimal divides exactly; division by zero is a float, NaN or
 * ±Infinity, whatever the operands, so the result decodes as its kind or
 * a float.
 */
declare const div: <const A, const B>(left: Numeric<A>, right: Numeric<B>) => Expr<ResultOf<Joined<KindOf<EncodedOf<A>>, KindOf<EncodedOf<B>>>, true>, OperandParams<A> & OperandParams<B>>;

export { type ArithmeticCodec as A, isExpr as B, type CodecOf as C, isNone as D, type Expr as E, type FloatOrDecimalOf as F, isNotNone as G, isPath as H, type ItemOf as I, literal as J, lt as K, type LiteralCodec as L, lte as M, type Numeric as N, type OrNone as O, type Path as P, mul as Q, type Reader as R, ne as S, not as T, or as U, param as V, paramsOf as W, parent as X, sqlOf as Y, sub as Z, unsafeExpr as _, type Primitive as a, type ParamsOfAll as b, type ParamsOf as c, type OperandEncoded as d, type OperandParams as e, type Comparable as f, type Operand as g, type CallArguments as h, type CastKind as i, type Collection as j, type ElementOf as k, ExprTypeId as l, type NumericOperand as m, type PureFunction as n, add as o, and as p, at as q, call as r, cast as s, codecOf as t, contains as u, div as v, eq as w, gt as x, gte as y, inside as z };
