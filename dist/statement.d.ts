import { Schema } from 'effect';
import { DateTime, Decimal, Duration, Uuid, RecordId } from 'surrealdb';
import { F as FunctionDescriptor, N as NoneAsAbsent } from './table-BcXWGUXd.js';
import { C as Codec, P as Params, N as NoParams, S as Statement, a as Simplify } from './statement-C1ml4dGf.js';
export { A as AnyStatement, b as CheckedInput, I as Input, R as Result, c as StatementTypeId, T as ThrowSite, d as Thrown, i as isStatement, m as make } from './statement-C1ml4dGf.js';

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
 * One authored SurrealQL text and what it does with variables:
 *
 * - `free`: the `$names` it reads and does not define itself;
 * - `defines`: the names it `LET`s at the top level, which later parts of a
 *   sequence can read;
 * - `slots`: how many results it returns (one per top-level statement);
 * - `throws`: the messages it can `THROW`;
 * - optionally `name` and `source` (where the text came from) and `throwsAt`
 *   (the lines each message is thrown on), for messages and tooling;
 * - `writes`: `true` when the text certainly changes data or schema,
 *   `false` when it certainly does not, absent when that is unknown (text
 *   can call a function that writes). {@link part} sets `true` when the
 *   analyzer finds a write; only a declaration makes it `false`, and a
 *   declared value is checked against the text.
 *
 * `effect-surrealkit statements` derives these from `.surql` files
 * (`effect-surrealkit/analyze`). Written by hand they are checked against
 * the text by {@link part}, and again by {@link sequence} for a part that
 * was not declared with `part`.
 */
interface Part<Free extends string = string, Defines extends string = string, Throws extends string = string> {
    readonly name?: string;
    readonly source?: string;
    readonly sql: string;
    readonly free: ReadonlyArray<Free>;
    readonly defines: ReadonlyArray<Defines>;
    readonly slots: number;
    readonly throws: ReadonlyArray<Throws>;
    readonly throwsAt?: Readonly<Record<string, ReadonlyArray<number>>>;
    readonly writes?: boolean;
}
/**
 * Declares a {@link Part}, keeping its names as literal types, and checks it
 * against its text: a `free`, `defines`, `slots` or `throws` that differs
 * from what the analyzer derives from `sql` is refused, naming the
 * difference, and so is a text with holes (a template).
 *
 * @throws RangeError for a part its text contradicts, or `AnalyzeError`
 *   (from `effect-surrealkit/analyze`) for a text it cannot analyse.
 */
declare const part: <const Free extends string = never, const Defines extends string = never, const Throws extends string = never>(options: {
    readonly name?: string;
    readonly source?: string;
    readonly sql: string;
    readonly free?: ReadonlyArray<Free>;
    readonly defines?: ReadonlyArray<Defines>;
    readonly slots?: number;
    readonly throws?: ReadonlyArray<Throws>;
    readonly throwsAt?: Readonly<Record<string, ReadonlyArray<number>>>;
    /**
     * `false` declares that the text certainly does not write, which the
     * analyzer cannot prove (a function it calls may write); refused when
     * the analyzer finds a write. `true` is refused when it finds none.
     * Left out, it is `true` when the analyzer finds a write and unknown
     * otherwise.
     */
    readonly writes?: boolean;
}) => Part<Free, Defines, Throws>;
/**
 * The bindings a sequence still needs from its caller: each part's free
 * names, minus what earlier parts define.
 */
type Unbound<Parts extends ReadonlyArray<Part>, Defined extends string = never> = Parts extends readonly [
    infer Head extends Part,
    ...infer Tail extends ReadonlyArray<Part>
] ? Exclude<Head['free'][number], Defined> | Unbound<Tail, Defined | Head['defines'][number]> : never;
/** The messages any part of a sequence can `THROW`. */
type ThrownBy<Parts extends ReadonlyArray<Part>> = Parts[number]['throws'][number];
/**
 * `P`, the codecs a contract declares, when they name exactly `Names`.
 * Otherwise a binding nothing reads is typed as a message naming it, and
 * when none is extra, the contract's expected type is a message naming each
 * binding it leaves without a codec.
 */
type Exactly<Names extends string, P> = [
    Exclude<keyof P, Names>
] extends [never] ? [Exclude<Names, keyof P>] extends [never] ? P : `binding \`$${Exclude<Names, keyof P>}\` is read by this sequence and has no codec` : {
    readonly [K in keyof P]: K extends Names ? P[K] : `binding \`$${K & string}\` is not read by this sequence`;
};
/**
 * The contract of a sequence: `P`, checked by {@link Exactly} against the
 * names the parts leave unbound. Parts that are not typed as literals (a
 * widened list, names typed `string`) cannot be checked by the compiler, so
 * they are left to the check `define` makes when it runs.
 */
type Contract<Parts extends ReadonlyArray<Part>, P> = number extends Parts['length'] ? P : string extends Unbound<Parts> ? P : Exactly<Unbound<Parts>, P>;
/**
 * Authored SurrealQL texts run one after another in a single request, sharing
 * one variable scope, as a statement.
 *
 * `define` takes a codec for exactly the names the sequence still needs:
 * leaving one out, or declaring one no part reads, is a compile error, and
 * the same check runs again when the statement is defined, in case the parts
 * were not typed as literals. A part that was not declared with {@link part}
 * is checked against its text here.
 *
 * @example
 * const guarded = sequence(bindWrite, requireOwner, readCutover).define({
 *   params: { boundProducer: Producer },
 *   result: Cutover,
 * });
 */
declare const sequence: <const Parts extends ReadonlyArray<Part>>(...parts: Parts) => {
    define: <const P extends Params, R extends Codec>(contract: {
        readonly name?: string;
        /**
         * What the sequence writes, when its parts leave it unknown: `false`
         * declares that it certainly does not write, `true` that it does.
         * Refused when it contradicts what the parts say. Default derived
         * from the parts.
         */
        readonly writes?: boolean;
        readonly params: Contract<Parts, P>;
        readonly result: R;
    }) => Statement<P, R, ThrownBy<Parts>>;
};

/**
 * Rows as expressions, and the codecs rows come back through.
 *
 * A row object has one expression per field of a generated row schema, built
 * once from the schema's own fields. A nested object field carries its
 * children as properties (`row.address.city`); an optional field, and every
 * field below one, yields a value that may be NONE.
 */

/** A row schema's own fields: codecs, possibly optional keys. */
type Fields = {
    readonly [field: string]: Codec;
};
/** A closed row schema. */
type StructCodec = Codec & {
    readonly fields: Fields;
};
/** An open row schema (a schemaless table, a `FLEXIBLE` object). */
type OpenStructCodec = Codec & {
    readonly schema: StructCodec;
    readonly records: unknown;
};
/** A row schema as generated modules declare it. */
type RowCodecIn = StructCodec | OpenStructCodec;
/** The declared fields of a row schema. */
type FieldsOf<R> = R extends {
    readonly schema: {
        readonly fields: infer F;
    };
} ? F : R extends {
    readonly fields: infer F;
} ? F : never;
type Unwrapped<S> = S extends {
    readonly schema: infer I extends Codec;
} ? S extends {
    readonly '~type.optionality': 'optional';
} ? I : S : S;
type IsOptional<S> = S extends {
    readonly '~type.optionality': 'optional';
} ? true : false;
type NestedFields<S> = S extends RowCodecIn ? FieldsOf<S> : never;
/**
 * The expression of one field, a field path, with its children when it is
 * an object.
 */
type FieldExpr<S, Optional extends boolean> = Path<Optional extends true ? OrNone<Unwrapped<S> & Codec> : Unwrapped<S> & Codec> & ([NestedFields<Unwrapped<S>>] extends [never] ? unknown : RowOf<NestedFields<Unwrapped<S>>, Optional>);
/** One expression per field of a row schema. */
type RowOf<F, Optional extends boolean = false> = {
    readonly [K in keyof F & string]: FieldExpr<F[K], Optional extends true ? true : IsOptional<F[K]>>;
};
/**
 * The row object of a generated row schema: one expression per field, the
 * path quoted where SurrealQL needs it.
 */
declare const rowOf: <R extends RowCodecIn>(schema: R) => RowOf<FieldsOf<R>>;
/** The codec stored rows decode with: NONE reads as an absent key. */
type RowCodec<S extends Codec> = ReturnType<typeof NoneAsAbsent<S>>;
/** The row a projection yields: one key per alias. */
type Projection = {
    readonly [alias: string]: Expr;
};
/**
 * A projection as its callback returned it, `F`, checked: a value that is
 * not an expression is typed as a message saying so.
 */
type CheckedProjection<F> = {
    readonly [K in keyof F]: F[K] extends Expr ? F[K] : 'a projected field is an expression: inline a constant with `literal`';
};
/** The struct a projection decodes with. */
type ProjectedFields<F> = {
    readonly [K in keyof F]: CodecOf<F[K]>;
};
/** The codec of a projected row. */
type ProjectedCodec<F> = Schema.declareConstructor<Schema.Struct<ProjectedFields<F>>['Type'], Schema.Struct<ProjectedFields<F>>['Encoded'], readonly [Schema.Struct<ProjectedFields<F>>]>;

/**
 * What the builders need from a generated table descriptor: its name and
 * row schemas, with codecs that need no services. Every table the emitter
 * generates fits.
 */

/** A generated table descriptor, as far as the builders read it. */
interface PureTable {
    readonly name: string;
    readonly schemafull?: boolean;
    readonly id: Codec;
    readonly select: RowCodecIn;
    readonly create?: RowCodecIn;
    readonly merge?: RowCodecIn;
    readonly content?: RowCodecIn;
    readonly edge?: {
        readonly table: string;
        readonly in: ReadonlyArray<Codec>;
        readonly out: ReadonlyArray<Codec>;
    };
}
/** The row object a table's callbacks receive. */
type RowExprs<T extends PureTable> = RowOf<FieldsOf<T['select']>>;
/** The codec a table's stored rows decode with. */
type StoredRow<T extends PureTable> = RowCodec<T['select']>;
/** A boolean expression. */
type Condition<P extends Params = Params> = Expr<Schema.Codec<unknown, boolean, never, never>, P>;
/** A record id expression of table `T`. */
type IdOf<T extends PureTable, P extends Params = Params> = Expr<Schema.Codec<unknown, T['id']['Encoded'], never, never>, P>;
type ExtraReadFields<T extends PureTable, S extends RowCodecIn> = Exclude<keyof FieldsOf<S>, keyof FieldsOf<T['select']>>;
type Encoded<F> = F extends Codec ? F['Encoded'] : never;
type IncompatibleReadLinks<Stored, View> = {
    [K in keyof Stored & keyof View]: [
        NonNullable<Encoded<Stored[K]>>
    ] extends [never] ? never : [NonNullable<Encoded<Stored[K]>>] extends [RecordId] ? [Exclude<Encoded<View[K]>, undefined>] extends [
        Exclude<Encoded<Stored[K]>, undefined>
    ] ? never : K : never;
}[keyof Stored & keyof View];
type KnownReadFields<T extends PureTable, S extends RowCodecIn> = T extends {
    readonly schemafull: true;
} ? [ExtraReadFields<T, S>] extends [never] ? [IncompatibleReadLinks<FieldsOf<T['select']>, FieldsOf<S>>] extends [
    never
] ? unknown : {
    readonly incompatibleRecordLinks: IncompatibleReadLinks<FieldsOf<T['select']>, FieldsOf<S>>;
} : {
    readonly unknownReadFields: ExtraReadFields<T, S>;
} : unknown;
/**
 * `table` as a session with narrower permissions reads it.
 *
 * A generated `select` schema describes a privileged reader. SurrealDB does
 * not report what permissions hide: a field the session may not read comes
 * back as NONE, and a row it may not read is simply absent. Declare the row
 * such a session really gets (usually the same fields, optional where a
 * permission can hide them) and build statements from the result, so the
 * rows decode instead of failing on the missing fields.
 */
declare const readAs: <T extends PureTable, S extends RowCodecIn>(table: T, select: S & KnownReadFields<NoInfer<T>, NoInfer<S>>) => Omit<T, "select"> & {
    readonly select: S;
};

/**
 * `SELECT` from a generated table descriptor.
 *
 * The builder is immutable: every method returns a new builder, so a base
 * query can be shared. The result codec is derived from the descriptor's
 * select schema, or from the projection's own expressions.
 */

/** A row count: a constant, or an expression yielding a number. */
type Count = number | Expr<Schema.Codec<unknown, number, never, never>, Params>;
/**
 * A sort key as its callback returned it, `K`: a field path, or else a
 * message saying that only a field path can be one.
 */
type OrderKey<K> = K extends Path ? K : 'ORDER BY takes a field path of the row, like `row.name` or `at(row.pins, 0)`';
/** What a `SELECT` returns: every row, or with `ONLY` one row or NONE. */
type SelectResult<Row extends Codec, Only extends boolean> = Only extends true ? Schema.UndefinedOr<Row> : Schema.$Array<Row>;
/**
 * A `SELECT` under construction. `T` is the table, `P` the bindings read so
 * far, `Row` the codec of one result row and `Only` whether it reads a
 * single record.
 */
interface Select<T extends PureTable, P extends Params, Row extends Codec, Only extends boolean> {
    /** Adds a condition. Several `where` calls must all hold. */
    readonly where: <P2 extends Params>(predicate: (row: RowExprs<T>) => Condition<P2>) => Select<T, P & P2, Row, Only>;
    /**
     * Adds a sort key, after the ones already given: a field path of the
     * stored row (`row.name`, `row.address.city`, `at(row.pins, 0)`), the
     * only thing SurrealDB parses there. A projection alias named like the
     * field the path starts from must be that field (`.project((row) =>
     * ({ age: row.age }))`), or the statement is refused when it is built.
     */
    readonly orderBy: <K>(key: (row: RowExprs<T>) => OrderKey<K>, direction?: 'ASC' | 'DESC') => Select<T, P, Row, Only>;
    /** `LIMIT`: at most this many rows. */
    readonly limit: <const L extends Count>(rows: L) => Select<T, P & OperandParams<L>, Row, Only>;
    /** `START`: skip this many rows. */
    readonly start: <const L extends Count>(rows: L) => Select<T, P & OperandParams<L>, Row, Only>;
    /**
     * Selects named expressions instead of the stored row. Each key of the
     * returned object is a field of the result, decoded by its expression's
     * codec.
     */
    readonly project: <const F>(fields: (row: RowExprs<T>) => CheckedProjection<F>) => Select<T, P & ParamsOfAll<F[keyof F]>, ProjectedCodec<F>, Only>;
    /** `SELECT VALUE`: one expression per row instead of an object. */
    readonly value: <S extends Codec, P2 extends Params>(pick: (row: RowExprs<T>) => Expr<S, P2>) => Select<T, P & P2, RowCodec<S>, Only>;
    /**
     * `FROM ONLY`: one row, or NONE when there is none. Reading from a table
     * adds `LIMIT 1`, because the engine fails `ONLY` on a second row.
     */
    readonly only: () => Select<T, P, Row, true>;
    /** This query as a parenthesised subquery of another expression. */
    readonly toExpr: () => Expr<SelectResult<Row, Only>, P>;
    /**
     * The finished statement. It is known not to write (`writes: false`)
     * when it reads only stored fields and constants; with a condition, a
     * projected expression or a bound count it may call a function that
     * writes, so what it writes is unknown unless `options.writes` says.
     */
    readonly build: (name?: string, options?: {
        readonly writes?: boolean;
    }) => Statement<Simplify<P>, SelectResult<Row, Only>>;
}
/**
 * `SELECT * FROM table`, or `SELECT * FROM $id` with a record id expression
 * of that table. Rows decode with the descriptor's select schema.
 *
 * @example
 * const recent = select(PersonTable)
 *   .where((row) => gte(row.age, param('minimum', Int)))
 *   .orderBy((row) => row.name)
 *   .project((row) => ({ name: row.name, city: row.address.city }))
 *   .build('recent adults');
 */
declare const select: {
    <T extends PureTable>(table: T): Select<T, NoParams, StoredRow<T>, false>;
    <T extends PureTable, P extends Params>(table: T, id: IdOf<T, P>): Select<T, P, StoredRow<T>, false>;
};

/**
 * `CREATE`, `UPDATE`, `DELETE` and `RELATE` from generated table descriptors.
 *
 * Data is bound, never inlined, and must fit the schema the descriptor
 * declares for the operation (`create`, `merge`, `content`). The result
 * codec follows from the target and the `RETURN` clause:
 *
 * - one record that the statement makes (`CREATE ONLY`, `RELATE ONLY`): the
 *   row;
 * - one record by id (`UPDATE ONLY $id`, `DELETE ONLY $id`): the row, or
 *   NONE when the record does not exist or the condition does not hold;
 * - a table: an array of rows.
 */

/** How many records a write addresses. */
type Shape = 'one' | 'maybe' | 'many';
/** The result of a write returning rows of codec `Row`. */
type WriteResult<Row extends Codec, S extends Shape> = S extends 'one' ? Row : S extends 'maybe' ? Schema.UndefinedOr<Row> : Schema.$Array<Row>;
/** The result of a write with `RETURN NONE`. */
type NoResult<S extends Shape> = S extends 'many' ? Schema.Tuple<readonly []> : Schema.Undefined;
/** The schema a table declares for an operation, or `never` without one. */
type OperationOf<T extends PureTable, O extends 'create' | 'merge' | 'content'> = T extends {
    readonly [K in O]: infer C extends Codec;
} ? C : never;
/** The top-level fields `S` sends that `Target` does not have. */
type ExtraFields<S, Target> = S extends object ? Exclude<keyof S, keyof Target> & string : never;
/** The top-level fields an object of type `A` always has. */
type RequiredFields<A> = {
    [K in keyof A]-?: Record<never, never> extends Pick<A, K> ? never : K;
}[keyof A];
/** The top-level fields both send, where `S` sends what `Target` refuses. */
type WrongFields<S, Target> = {
    [K in keyof S & keyof Target]-?: [S[K]] extends [Target[K]] ? never : K;
}[keyof S & keyof Target] & string;
/**
 * Data of encoded type `S` for a schema of encoded type `Target`: `V` when
 * it fits, otherwise a message naming what does not, read in this order: a
 * value that is not an object, a field `Target` requires that `S` may leave
 * out, a field whose value `Target` refuses, any other mismatch, and a field
 * `Target` does not have.
 */
/** Whether `A` is a union. */
type IsUnion<A, Whole = A> = A extends unknown ? [Whole] extends [A] ? false : true : never;
/**
 * The fields `S` sends below `Path` that `Target` does not have, as paths
 * (`settings.notify.x`, `phones[*].x`), when both are objects or arrays.
 * It descends only where the two types differ and `Target` is not a union,
 * so it follows the target schema's own nesting and stops with it: at a
 * type `S` shares, at an open record (whose keys are all accepted), and at
 * a union (whose member is not known).
 */
type ExtraBelow<S, Target, Path extends string> = [Target] extends [S] ? never : true extends IsUnion<Target> ? never : Target extends ReadonlyArray<infer TargetItem> ? S extends ReadonlyArray<infer Item> ? ExtraBelow<NonNullable<Item>, NonNullable<TargetItem>, `${Path}[*]`> : never : [Target] extends [object] ? S extends object ? `${Path}.${Exclude<keyof S, keyof Target> & string}` | NestedExtra<S, Target, `${Path}.`> : never : never;
/** {@link ExtraBelow} for every field `S` and `Target` share. */
type NestedExtra<S, Target, Prefix extends string> = {
    [K in keyof S & keyof Target & string]-?: ExtraBelow<NonNullable<S[K]>, NonNullable<Target[K]>, `${Prefix}${K}`>;
}[keyof S & keyof Target & string];
/**
 * Data of encoded type `S` for a schema of encoded type `Target`: `V` when
 * it fits, otherwise a message naming what does not, read in this order: a
 * value that is not an object, a field `Target` requires that `S` may leave
 * out, a field whose value `Target` refuses, any other mismatch, a field
 * `Target` does not have, and one inside a nested object or an array
 * element (SurrealDB 3.3 and 4.0 refuse an undeclared key of a declared
 * child object at any depth; 4.0 refuses one in an array element, which 3.3
 * stores and the element's closed schema then cannot read).
 */
type FitsEncoded<S, Target, V, Table extends string, Clause extends string> = [
    S
] extends [Target] ? [ExtraFields<S, Target>] extends [never] ? [NestedExtra<S, Target, ''>] extends [never] ? V : `\`${NestedExtra<S, Target, ''>}\` is not a field \`${Table}\` accepts in ${Clause}` : `\`${ExtraFields<S, Target>}\` is not a field \`${Table}\` accepts in ${Clause}` : [S] extends [object] ? [Exclude<RequiredFields<Target>, RequiredFields<S>>] extends [never] ? [WrongFields<S, Target>] extends [never] ? `this value is not what \`${Table}\` accepts in ${Clause}` : `\`${WrongFields<S, Target>}\` is not a value \`${Table}\` accepts in ${Clause}` : `\`${Exclude<RequiredFields<Target>, RequiredFields<S>> & string}\` is required by \`${Table}\` in ${Clause}` : `this value is not an object, which \`${Table}\` takes in ${Clause}`;
/**
 * `V`, the data expression of codec `S`, when `S` may be bound as the data
 * of an operation whose schema is `Target`: what it sends is what the
 * schema sends, with no field the schema does not have (SurrealDB refuses
 * one, and assignability alone would let it through). An open schema (a
 * `FLEXIBLE` object, a schemaless table) accepts any field. Otherwise the
 * data's expected type is a message naming the first field that does not
 * fit, with the table and the clause (`CREATE`, `MERGE`, …).
 */
type Fits<Target extends Codec, S extends Codec, V, Table extends string, Clause extends string> = [Target] extends [never] ? `\`${Table}\` takes no data in ${Clause}` : FitsEncoded<S['Encoded'], Target['Encoded'], V, Table, Clause>;
/** A table that is a relation with declared endpoints. */
type RelationTable = PureTable & {
    readonly edge: NonNullable<PureTable['edge']>;
};
/**
 * `V`, the endpoint expression of codec `S`, when its decoded id is one of
 * the relation's declared endpoint ids (brands included) or the relation
 * declares none; otherwise the expected type is `Message`.
 */
type Endpoint<Accepted extends ReadonlyArray<Codec>, S extends Codec, V, Message extends string> = [Accepted[number]] extends [never] ? V : [S['Type']] extends [Accepted[number]['Type']] ? V : Message;
/** A `CREATE ONLY` under construction; `R` is the codec of its result. */
interface Create<T extends PureTable, P extends Params, R extends Codec> {
    /** `CONTENT`: the new record's data, as the table's create schema. */
    readonly content: <S extends Codec, P2 extends Params>(data: Fits<OperationOf<T, 'create'>, S, Expr<S, P2>, T['name'], 'CREATE'>) => Create<T, P & P2, R>;
    /** `RETURN NONE`, `RETURN AFTER` (the default) or chosen expressions. */
    readonly returning: {
        (mode: 'none'): Create<T, P, Schema.Undefined>;
        (mode: 'after'): Create<T, P, StoredRow<T>>;
        <const F>(fields: (row: RowExprs<T>) => CheckedProjection<F>): Create<T, P & ParamsOfAll<F[keyof F]>, ProjectedCodec<F>>;
    };
    /** The finished statement. */
    readonly build: (name?: string) => Statement<Simplify<P>, R>;
}
/**
 * `CREATE ONLY table`, or `CREATE ONLY $id` with a record id expression of
 * that table. Returns the created row unless told otherwise.
 */
declare const create: {
    <T extends PureTable>(table: T): Create<T, NoParams, StoredRow<T>>;
    <T extends PureTable, P extends Params>(table: T, id: IdOf<T, P>): Create<T, P, StoredRow<T>>;
};
/** An `UPDATE` under construction; `R` is the codec of its result. */
interface Update<T extends PureTable, P extends Params, R extends Codec, S extends Shape> {
    /** Adds a condition. Several `where` calls must all hold. */
    readonly where: <P2 extends Params>(predicate: (row: RowExprs<T>) => Condition<P2>) => Update<T, P & P2, R, S>;
    /** `RETURN NONE`, `AFTER` (the default), `BEFORE` or chosen expressions. */
    readonly returning: {
        (mode: 'none'): Update<T, P, NoResult<S>, S>;
        (mode: 'after' | 'before'): Update<T, P, WriteResult<StoredRow<T>, S>, S>;
        <const F>(fields: (row: RowExprs<T>) => CheckedProjection<F>): Update<T, P & ParamsOfAll<F[keyof F]>, WriteResult<ProjectedCodec<F>, S>, S>;
    };
    /** The finished statement. */
    readonly build: (name?: string) => Statement<Simplify<P>, R>;
}
/** An `UPDATE` that still needs its data. */
interface UpdateTarget<T extends PureTable, P extends Params, S extends Shape> {
    /**
     * `MERGE`: omitted fields keep their value; `undefined` (NONE) removes a
     * removable field. The data is the table's merge schema.
     */
    readonly merge: <D extends Codec, P2 extends Params>(data: Fits<OperationOf<T, 'merge'>, D, Expr<D, P2>, T['name'], 'MERGE'>) => Update<T, P & P2, WriteResult<StoredRow<T>, S>, S>;
    /** `CONTENT`: replaces the writable fields, as the table's content schema. */
    readonly content: <D extends Codec, P2 extends Params>(data: Fits<OperationOf<T, 'content'>, D, Expr<D, P2>, T['name'], 'CONTENT'>) => Update<T, P & P2, WriteResult<StoredRow<T>, S>, S>;
}
/**
 * `UPDATE table … WHERE`, returning every row it changed, or
 * `UPDATE ONLY $id` with a record id expression, returning the row or NONE
 * when the record does not exist. `UPDATE` never creates a record.
 */
declare const update: {
    <T extends PureTable>(table: T): UpdateTarget<T, NoParams, 'many'>;
    <T extends PureTable, P extends Params>(table: T, id: IdOf<T, P>): UpdateTarget<T, P, 'maybe'>;
};
/** A `DELETE` under construction; `R` is the codec of its result. */
interface Delete<T extends PureTable, P extends Params, R extends Codec, S extends Shape> {
    /** Adds a condition. Several `where` calls must all hold. */
    readonly where: <P2 extends Params>(predicate: (row: RowExprs<T>) => Condition<P2>) => Delete<T, P & P2, R, S>;
    /** `RETURN NONE` (the default) or `RETURN BEFORE`, the deleted rows. */
    readonly returning: {
        (mode: 'none'): Delete<T, P, NoResult<S>, S>;
        (mode: 'before'): Delete<T, P, WriteResult<StoredRow<T>, S>, S>;
    };
    /** The finished statement. */
    readonly build: (name?: string) => Statement<Simplify<P>, R>;
}
/**
 * `DELETE table … WHERE`, or `DELETE ONLY $id` with a record id expression.
 * Returns nothing unless asked for the rows as they were (`'before'`).
 */
declare const deleteFrom: {
    <T extends PureTable>(table: T): Delete<T, NoParams, NoResult<'many'>, 'many'>;
    <T extends PureTable, P extends Params>(table: T, id: IdOf<T, P>): Delete<T, P, NoResult<'maybe'>, 'maybe'>;
};
/** A `RELATE ONLY` under construction; `R` is the codec of its result. */
interface Relate<T extends PureTable, P extends Params, R extends Codec> {
    /** `CONTENT`: the edge's own fields, as the table's create schema. */
    readonly content: <S extends Codec, P2 extends Params>(data: Fits<OperationOf<T, 'create'>, S, Expr<S, P2>, T['name'], 'RELATE'>) => Relate<T, P & P2, R>;
    /** `RETURN NONE`, `RETURN AFTER` (the default) or chosen expressions. */
    readonly returning: {
        (mode: 'none'): Relate<T, P, Schema.Undefined>;
        (mode: 'after'): Relate<T, P, StoredRow<T>>;
        <const F>(fields: (row: RowExprs<T>) => CheckedProjection<F>): Relate<T, P & ParamsOfAll<F[keyof F]>, ProjectedCodec<F>>;
    };
    /** The finished statement. */
    readonly build: (name?: string) => Statement<Simplify<P>, R>;
}
/**
 * `RELATE ONLY $from->table->$to`: one edge between two records. Each
 * endpoint must be a record id the relation declares for that side.
 */
declare const relate: <T extends RelationTable, From extends Codec, PF extends Params, To extends Codec, PT extends Params>(table: T, from: Endpoint<T["edge"]["in"], From, Expr<From, PF>, `this record id is not an \`in\` endpoint of \`${T["name"]}\``>, to: Endpoint<T["edge"]["out"], To, Expr<To, PT>, `this record id is not an \`out\` endpoint of \`${T["name"]}\``>) => Relate<T, PF & PT, StoredRow<T>>;

export { type CallArguments, type CastKind, Codec, type CodecOf, type Collection, type Comparable, type Condition, type Contract, type Count, type Create, type Delete, type ElementOf, type Endpoint, type Exactly, type Expr, ExprTypeId, type FieldExpr, type Fields, type FieldsOf, type Fits, type IdOf, type ItemOf, type LiteralCodec, NoParams, type NoResult, type OpenStructCodec, type Operand, type OperationOf, type OrNone, Params, type ParamsOf, type ParamsOfAll, type Part, type Path, type Primitive, type ProjectedCodec, type ProjectedFields, type Projection, type PureFunction, type PureTable, type Relate, type RelationTable, type RowCodec, type RowCodecIn, type RowExprs, type RowOf, type Select, type SelectResult, type Shape, Statement, type StoredRow, type StructCodec, type ThrownBy, type Unbound, type Update, type UpdateTarget, type WriteResult, and, at, call, cast, codecOf, contains, create, deleteFrom, eq, gt, gte, inside, isExpr, isNone, isNotNone, isPath, literal, lt, lte, ne, not, or, param, paramsOf, part, readAs, relate, rowOf, select, sequence, sqlOf, unsafeExpr, update };
