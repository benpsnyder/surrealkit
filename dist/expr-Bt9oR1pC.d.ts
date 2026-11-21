import { Schema } from 'effect';
import { DateTime, Decimal, Duration, Uuid } from 'surrealdb';
import { e as FunctionDescriptor } from './table-iF6L7xrW.js';
import { B as BindingUses } from './uses-BXJXI3if.js';

/**
 * A statement: one request to SurrealDB, described as a value.
 *
 * The SurrealQL text is static. Every value enters through a named binding
 * that carries its own codec, so the text never depends on input, and the
 * final result is decoded by a codec the statement names. Nothing here talks
 * to a database: `effect-surrealkit/client` runs statements.
 */

/** A codec that needs no services, so a statement needs only a client. */
type Codec = Schema.Codec<unknown, unknown, never, never>;
/** The codec of each named binding of a statement or expression. */
type Params = {
    readonly [name: string]: Codec;
};
/** No bindings. */
type NoParams = Record<never, never>;
/** Flattens an intersection so hovers and errors show one object. */
type Simplify<A> = {
    readonly [K in keyof A]: A[K];
} & {};
type OptionalNames<P extends Params> = {
    [K in keyof P]: undefined extends P[K]['Type'] ? K : never;
}[keyof P];
/**
 * The values a caller supplies: one per binding, as the codec's decoded type,
 * in the order the statement reads them. A binding whose codec accepts
 * `undefined` (NONE) may be omitted.
 */
type Input<P extends Params> = Simplify<{
    readonly [K in keyof P as undefined extends P[K]['Type'] ? never : K]: P[K]['Type'];
} & {
    readonly [K in keyof P as undefined extends P[K]['Type'] ? K : never]?: P[K]['Type'];
}>;
type RequiredNames<P extends Params> = Exclude<keyof P, OptionalNames<P>>;
/**
 * The expected type of the input of a statement reading `P`, given the
 * input as the caller wrote it, `I`: `Input<P>`, unless `I` leaves a
 * binding without a value and names nothing else, when it is a message
 * naming each such binding. The compiler reports an unknown or misspelt
 * name and a wrong value against `Input<P>` as it always does.
 *
 * The first branch is never taken (no statement reads `never`); it is where
 * the compiler infers `I` from the argument. It tests `P`, not `I`, because
 * the compiler narrows `I` to `never` inside a branch that tests `I`
 * against `never`. The second tests `I` against `Input<P>` itself, so
 * generic code that forwards an `Input<P>` passes.
 */
type CheckedInput<P extends Params, I> = [P] extends [never] ? I : [I] extends [Input<P>] ? Input<P> : [Exclude<keyof I, keyof P>] extends [never] ? [Exclude<RequiredNames<P>, keyof I>] extends [never] ? Input<P> : `binding \`${Exclude<RequiredNames<P>, keyof I> & string}\` has no value` : Input<P>;
declare const StatementTypeId = "~effect-surrealkit/Statement";
/**
 * - `sql`: the SurrealQL text, one or more statements.
 * - `params`: the codec of every binding the text reads. Values are encoded
 *   through them before anything is sent.
 * - `result`: decodes the result at `valueSlot`.
 * - `slots`: how many results the text returns, one per top-level statement.
 *   Every one but the one at `valueSlot` must be NONE (`LET`, guards,
 *   `BEGIN`, `COMMIT`).
 * - `valueSlot`: the 1-based position of the result `result` decodes,
 *   `slots` unless the text ends with transaction control (`sequence`
 *   derives it; `make` takes it as declared).
 * - `throws`: the `THROW` messages the text can raise, which a client
 *   surfaces as a typed error rather than a request failure.
 * - `defines`: the names the text `LET`s at the top level. Statements in one
 *   transaction share one variable scope, so a client refuses to bind a name
 *   another statement of the same transaction defines.
 * - `transactional`: the text writes its own `BEGIN`, `COMMIT` or `CANCEL`,
 *   so it cannot run inside a client's `transaction`.
 * - `writes`: whether the text changes data or schema, in three states.
 *   `true`: it certainly does, so a client that cannot decode its result
 *   says its writes are committed. `false`: it certainly does not, so a
 *   result that does not decode is a plain `StatementDecodeError`. Absent:
 *   unknown (authored text can call a function that writes), so a client
 *   says any writes it made are committed. Write builders set `true`, a
 *   `select` of stored fields `false`; `sequence` derives it from its
 *   parts; `make` takes it as declared.
 * - `nonEmpty`: the last result is a row, or a non-empty list, whenever
 *   the statement applies (`create` and `relate` returning rows), so a
 *   client reports NONE or an empty list as an empty result, which
 *   permissions cause.
 * - `sources`: where the text came from (the `source` of each part), for
 *   messages and tracing.
 * - `variant`: for a variant of a statement family, the key that selected
 *   it (`axis=value, …`). The statement's name is the family's, so its
 *   metrics are the family's; a run records the key on its span.
 * - `throwSites`: for a `THROW` message, the source and lines of the
 *   first part that declares it with both.
 * - `tables`, `functions` and `openTargets`: the static tables the text
 *   reads and writes, the custom functions it calls, and whether some
 *   target is not a static name, so the lists may be incomplete.
 *   `sequence` sets them, the union over its parts; builders leave them
 *   out; `make` takes them as declared.
 */
interface Statement<P extends Params = Params, R extends Codec = Codec, Throws extends string = never> {
    readonly [StatementTypeId]: typeof StatementTypeId;
    readonly name: string;
    readonly sql: string;
    readonly params: P;
    readonly result: R;
    readonly slots: number;
    readonly valueSlot: number;
    readonly throws: ReadonlyArray<Throws>;
    readonly defines: ReadonlyArray<string>;
    readonly transactional: boolean;
    readonly writes?: boolean;
    readonly nonEmpty?: boolean;
    readonly sources?: ReadonlyArray<string>;
    readonly variant?: string;
    readonly throwSites?: Readonly<Record<string, ThrowSite>>;
    readonly tables?: {
        readonly read: ReadonlyArray<string>;
        readonly written: ReadonlyArray<string>;
    };
    readonly functions?: ReadonlyArray<string>;
    readonly openTargets?: boolean;
    /**
     * What each binding is used as, where the analyzer could tell: an
     * argument of a custom function, the key of a `type::record`, or a
     * field of the one table a query targets. `sequence` sets it, merged
     * over its parts for the names that remain bindings, when there is any;
     * `make` takes it as declared.
     */
    readonly uses?: BindingUses;
}
/** Where a declared `THROW` message comes from. */
interface ThrowSite {
    readonly source: string;
    readonly lines: ReadonlyArray<number>;
}
/** Any statement, whatever it binds, returns and throws. */
type AnyStatement = Statement<Params, Codec, string>;
/** The decoded result of a statement. */
type Result<S> = S extends Statement<Params, infer R, string> ? R['Type'] : never;
/** The messages a statement declares it can `THROW`. */
type Thrown<S> = S extends Statement<Params, Codec, infer T> ? T : never;
declare const isStatement: (value: unknown) => value is AnyStatement;
/**
 * Declares a statement from its parts. The text is stored with exactly one
 * final `;`. Nothing checks that `params` are the
 * names `sql` reads, nor that `defines` and `transactional` say what the text
 * does, so prefer a builder (`select`, `create`, …) or, for authored
 * SurrealQL, `part` and `sequence`, which derive all of it from the text.
 *
 * One cheap check runs: text that appears to `LET` a name at the top level
 * must declare `defines`, since a transaction relies on it to refuse a
 * binding that the `LET` would shadow.
 */
declare const make: <const P extends Params, R extends Codec, const Throws extends string = never>(options: {
    readonly name?: string;
    readonly sql: string;
    readonly params: P;
    readonly result: R;
    readonly slots?: number;
    /** The 1-based result `result` decodes, in `1..slots`. Default `slots`. */
    readonly valueSlot?: number;
    readonly throws?: ReadonlyArray<Throws>;
    /** The names the text `LET`s at the top level. Default none. */
    readonly defines?: ReadonlyArray<string>;
    /** The text writes its own `BEGIN`, `COMMIT` or `CANCEL`. Default false. */
    readonly transactional?: boolean;
    /** The text can change data or schema. Default false. */
    readonly writes?: boolean;
    /**
     * The last result is a row or a non-empty list whenever the statement
     * applies. Default false.
     */
    readonly nonEmpty?: boolean;
    /** Where the text came from. */
    readonly sources?: ReadonlyArray<string>;
    /** The source and lines of each declared `THROW` message. */
    readonly throwSites?: Readonly<Record<string, ThrowSite>>;
    /** The static tables the text reads and writes. Default unknown. */
    readonly tables?: {
        readonly read: ReadonlyArray<string>;
        readonly written: ReadonlyArray<string>;
    };
    /** The custom functions the text calls. Default unknown. */
    readonly functions?: ReadonlyArray<string>;
    /** Some target is not a static table name. Default unknown. */
    readonly openTargets?: boolean;
    /** What each binding is used as, where known. Default unknown. */
    readonly uses?: BindingUses;
}) => Statement<P, R, Throws>;

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

export { or as $, type AnyStatement as A, contains as B, type Codec as C, eq as D, type Expr as E, gt as F, gte as G, inside as H, type ItemOf as I, isExpr as J, isNone as K, type LiteralCodec as L, isNotNone as M, type NoParams as N, type OrNone as O, type Params as P, isPath as Q, type Result as R, type Statement as S, type ThrowSite as T, isStatement as U, literal as V, lt as W, lte as X, make as Y, ne as Z, not as _, type Primitive as a, param as a0, paramsOf as a1, parent as a2, sqlOf as a3, unsafeExpr as a4, type ParamsOfAll as b, type Simplify as c, type OperandEncoded as d, type Comparable as e, type CodecOf as f, type ParamsOf as g, type Path as h, type OperandParams as i, type Operand as j, type CallArguments as k, type CastKind as l, type CheckedInput as m, type Collection as n, type ElementOf as o, ExprTypeId as p, type Input as q, type PureFunction as r, type Reader as s, StatementTypeId as t, type Thrown as u, and as v, at as w, call as x, cast as y, codecOf as z };
