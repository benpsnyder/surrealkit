import { Schema } from 'effect';
import { Decimal } from 'surrealdb';
import { F as Float, l as SurrealNumber, b as Decimal$1, I as Int64 } from './value-Dzlmtd6Q.js';
import { E as Expr, P as Params, i as OperandParams } from './expr-Bt9oR1pC.js';

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

export { type ArithmeticCodec as A, type FloatOrDecimalOf as F, type Numeric as N, type NumericOperand as a, add as b, div as d, mul as m, sub as s };
