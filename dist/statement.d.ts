import { B as BindingUses } from './uses-BXJXI3if.js';
export { a as BindingUse } from './uses-BXJXI3if.js';
import { F as FloatOrDecimalOf } from './arithmetic-Dgz4kWW5.js';
export { A as ArithmeticCodec, N as Numeric, a as NumericOperand, b as add, d as div, m as mul, s as sub } from './arithmetic-Dgz4kWW5.js';
import { Schema } from 'effect';
import { P as Params, C as Codec, S as Statement, c as Simplify, E as Expr, A as AnyStatement, N as NoParams, O as OrNone, R as Result, a as Primitive, b as ParamsOfAll, L as LiteralCodec, d as OperandEncoded, e as Comparable, f as CodecOf, g as ParamsOf, h as Path, I as ItemOf, i as OperandParams, j as Operand } from './expr-Bt9oR1pC.js';
export { k as CallArguments, l as CastKind, m as CheckedInput, n as Collection, o as ElementOf, p as ExprTypeId, q as Input, r as PureFunction, s as Reader, t as StatementTypeId, T as ThrowSite, u as Thrown, v as and, w as at, x as call, y as cast, z as codecOf, B as contains, D as eq, F as gt, G as gte, H as inside, J as isExpr, K as isNone, M as isNotNone, Q as isPath, U as isStatement, V as literal, W as lt, X as lte, Y as make, Z as ne, _ as not, $ as or, a0 as param, a1 as paramsOf, a2 as parent, a3 as sqlOf, a4 as unsafeExpr } from './expr-Bt9oR1pC.js';
import { R as RowCodecIn, F as FieldsOf$1, C as Condition, P as ProjectedCodec, a as PureTable, S as StoredRow, b as RowExprs, c as CheckedProjection, d as RowCodec, I as IdOf, e as RowOf, U as Unwrapped$2, f as IsOptional$2, N as NestedFields } from './live-n0zkmyK9.js';
export { g as FieldExpr, h as Fields, L as Live, i as LiveStatement, j as LiveStatementTypeId, O as OpenStructCodec, k as ProjectedFields, l as Projection, m as ReadAs, n as ReadableStore, o as StructCodec, V as VisibleStore, p as VisibleTable, W as WithVisible, q as live, r as readAs, s as rowOf } from './live-n0zkmyK9.js';
import { S as SurrealValue, i as SurrealString, f as Int, I as Int64, F as Float, l as SurrealNumber, m as Uuid, b as Decimal$1 } from './value-Dzlmtd6Q.js';
import { T as Text, d as TextHoleScopes, c as TextHoleScope } from './text-L6LzniE5.js';
import { Decimal, RecordId, DateTime as DateTime$1 } from 'surrealdb';
import { c as DateTime, e as Duration } from './temporal-6pYMjhGw.js';
import './table-iF6L7xrW.js';
import './row-CLBe1uWx.js';
import 'effect/Cause';
import 'effect/Types';
import './lexer-VCZFEQjh.js';

/**
 * Blocks: a multi-step script (named locals, guards that `THROW`, branches
 * that return) written in TypeScript and built into an ordinary
 * {@link Statement}.
 *
 * A block renders to static SurrealQL: every value still enters as a named
 * binding, and a local is a `LET` whose value is an expression or a built
 * statement. The whole block is one SurrealQL statement, `{ … }`, whose
 * value is its last expression: a value, or one `IF … ELSE IF … ELSE` whose
 * branches end with theirs. SurrealDB 3.3 and 4.0 agree on what that buys
 * (`test/conformance.test.ts`):
 *
 * - a guard's `THROW` stops the rest of the block and undoes what the block
 *   wrote, even outside a transaction, where a `THROW` in a statement of its
 *   own would let the statements after it run;
 * - its locals are local to it, so it defines nothing in the scope the
 *   statements of a transaction share;
 * - it never writes `RETURN`, which inside an `IF` ends a transaction on
 *   SurrealDB 3 without the SDK seeing it.
 *
 * Like the other builders, this module does not import the analyzer; the
 * test suite checks every block it builds against the analyzer instead.
 */

/** The codec of each local a block has defined, by name. */
type Locals = {
    readonly [name: string]: Codec;
};
/** No locals. */
type NoLocals = Record<never, never>;
/** The codec `S` without its NONE member, when it has one. */
type NoneMember<S> = S extends {
    readonly members: readonly [infer X extends Codec, Schema.Undefined];
} ? X : never;
/** `S` without NONE: what a local holds once a guard has refused NONE. */
type SomeOf<S extends Codec> = [NoneMember<S>] extends [never] ? S : NoneMember<S>;
/**
 * The row schema behind `S`: a struct, or the struct a stored-row or
 * projected-row codec wraps (which decodes to the same type).
 */
type RowIn<S> = S extends RowCodecIn ? S : S extends {
    readonly '~type.parameters': readonly [
        infer I extends RowCodecIn
    ];
    readonly Type: infer T;
} ? [T] extends [I['Type']] ? I : never : never;
type IsOptional$1<S> = S extends {
    readonly '~type.optionality': 'optional';
} ? true : false;
type Unwrapped$1<S> = S extends {
    readonly schema: infer I extends Codec;
} ? S extends {
    readonly '~type.optionality': 'optional';
} ? I : S : S;
type FieldsIn<S, Optional extends boolean> = [RowIn<S>] extends [never] ? unknown : LocalRow<FieldsOf$1<RowIn<S>>, Optional>;
type FieldsOfValue<S, Optional extends boolean> = [NoneMember<S>] extends [
    never
] ? FieldsIn<S, Optional> : FieldsIn<NoneMember<S>, true>;
/** A field of a local row: `$name.field`, NONE when the row may be. */
type LocalField<S extends Codec, Optional extends boolean> = Expr<Optional extends true ? OrNone<S> : S, NoParams> & FieldsOfValue<S, Optional>;
type LocalRow<F, Optional extends boolean> = {
    readonly [K in keyof F & string]: LocalField<Unwrapped$1<F[K]> & Codec, Optional extends true ? true : IsOptional$1<F[K]>>;
};
/**
 * A local as an expression: `$name`, and, when it holds a row (a struct, a
 * stored row or a projection), one expression per field, NONE wherever the
 * row may be NONE.
 */
type Local<S extends Codec> = Expr<S, NoParams> & FieldsOfValue<S, false>;
/** One expression per local: what a step's callback receives. */
type Scope<L extends Locals> = {
    readonly [K in keyof L]: Local<L[K]>;
};
/** The locals `L`, with `N` holding {@link SomeOf} its value. */
type Narrowed<L extends Locals, N extends keyof L> = {
    readonly [K in keyof L]: K extends N ? SomeOf<L[K]> : L[K];
};
/** The fields of an object expression: expressions, or primitives to inline. */
type ObjectFields = {
    readonly [key: string]: Expr | Primitive;
};
/** An expression, or a primitive as its {@link literal}. */
type Lifted<V> = V extends Expr ? V : Expr<LiteralCodec<V>, NoParams>;
/** The codec of an object expression: a struct of its fields' codecs. */
type ObjectCodec<F> = ProjectedCodec<{
    readonly [K in keyof F]: Lifted<F[K]>;
}>;
/**
 * `{ key: value, … }`: an object of expressions (a primitive is inlined as
 * its {@link literal}), decoding as a struct of their codecs. NONE in a
 * field reads as `undefined`. Keys are identifiers.
 *
 * @example
 * create(PaymentTable).content(
 *   object({ wallet: $.wallet.id, amount: param('amount', Int), key: $.key }),
 * )
 */
declare const object: <const F extends ObjectFields>(fields: F) => Expr<ObjectCodec<F>, ParamsOfAll<Extract<F[keyof F], Expr>>>;
/** The facts a finished part of a block carries, for its parent. */
interface Facts<P extends Params, Throws extends string, R> {
    readonly params: P;
    readonly throws: Throws;
    readonly result: R;
}
declare const BlockTypeId = "~effect-surrealkit/Block";
/**
 * What a branch ends with, as a parent reads it: an open block (its result
 * is NONE), a block that returned or threw, or branches.
 */
interface Arm {
    readonly [BlockTypeId]: Facts<Params, string, unknown>;
}
type ArmParams<A extends Arm> = A[typeof BlockTypeId]['params'];
type ArmThrows<A extends Arm> = A[typeof BlockTypeId]['throws'];
type ArmResult<A extends Arm> = A[typeof BlockTypeId]['result'];
/**
 * Names SurrealDB sets: protected everywhere (`$auth`, …), or inside blocks
 * and clauses (`$this`, `$value`, …), where SurrealDB 4 refuses a `LET` of
 * them and SurrealDB 3 shadows the engine's value.
 */
type EngineName = 'auth' | 'access' | 'session' | 'token' | 'this' | 'self' | 'parent' | 'value' | 'input' | 'before' | 'after' | 'event';
/**
 * `N`, when a block may define a local of that name here; otherwise a
 * message saying why not: it is already a local, a binding the block has
 * read so far, or a name SurrealDB sets.
 */
type LocalName<N extends string, P, L> = N extends keyof L ? `local \`$${N}\` is already defined in this block` : N extends keyof P ? `\`$${N}\` is a binding of this block, and a local of that name would shadow it` : N extends EngineName ? `\`$${N}\` is set by SurrealDB, so a block cannot define it` : N;
/** What a local's value is: an expression or a built statement. */
type LetValue = Expr | AnyStatement;
type ValueCodec<V> = V extends Statement<Params, infer R, string> ? R : V extends Expr<infer S, Params> ? S : never;
type ValueParams<V> = V extends Statement<infer P, Codec, string> ? P : V extends Expr<Codec, infer P> ? P : never;
type ValueThrows<V> = V extends Statement<Params, Codec, infer T> ? T : never;
/**
 * What a block or branch can return: an expression, or an object of
 * expressions and primitives. A constant on its own is a `literal`, whose
 * type stays the constant (a callback's own return type would widen it).
 */
type Returned = Expr | ObjectFields;
type ReturnedCodec<V> = V extends Expr<infer S, Params> ? S : ObjectCodec<V>;
type ReturnedParams<V> = V extends Expr<Codec, infer P> ? P : ParamsOfAll<Extract<V[keyof V], Expr>>;
/**
 * `S`, a statement run for its effect, when its result is NONE; otherwise a
 * message saying to bind its result.
 */
type ForEffect<S extends AnyStatement> = [Result<S>] extends [undefined] ? S : 'a step run for its effect returns NONE (a write by id with `.returning("none")`); bind a result with `let`';
/** The result codec of a block whose branches yield the codecs `R`. */
type BlockResult<R> = [R] extends [never] ? Schema.Never : Schema.Codec<TypeOf<R>, EncodedOf$1<R>, never, never>;
type TypeOf<R> = R extends {
    readonly Type: infer T;
} ? T : never;
type EncodedOf$1<R> = R extends {
    readonly Encoded: infer E;
} ? E : never;
/**
 * A finished block or branch. `P` is the bindings it reads, `Throws` the
 * messages it can raise and `R` the codecs of what it can yield, a union.
 */
interface Ended<P extends Params, Throws extends string, R> {
    readonly [BlockTypeId]: Facts<P, Throws, R>;
    /**
     * The statement, one result: it decodes with the union of what the
     * block can yield, its `throws` are every message it can raise, and it
     * defines nothing (its locals stay inside it). It certainly writes when a
     * statement it runs does; otherwise what it writes is unknown, unless
     * `options.writes` declares it (`false` is refused when it writes).
     *
     * @throws RangeError when a local is named like one of its bindings.
     */
    readonly build: (name?: string, options?: {
        readonly writes?: boolean;
    }) => Statement<Simplify<P>, BlockResult<R>, Throws>;
}
/**
 * An `IF … ELSE IF …` under construction. Without `else`, a block whose
 * conditions all fail yields NONE, so its result includes `undefined`.
 */
interface Branches<P extends Params, L extends Locals, Throws extends string, R> extends Ended<P, Throws, R | Schema.Undefined> {
    /** `ELSE IF condition { … }`. */
    readonly elseIf: <P2 extends Params, A extends Arm>(condition: ($: Scope<L>) => Condition<P2>, then: (arm: Block<P & P2, L, never>) => A) => Branches<P & P2 & ArmParams<A>, L, Throws | ArmThrows<A>, R | ArmResult<A>>;
    /** `ELSE { … }`. */
    readonly else: <A extends Arm>(then: (arm: Block<P, L, never>) => A) => Ended<P & ArmParams<A>, Throws | ArmThrows<A>, R | ArmResult<A>>;
}
/**
 * A block under construction: `P` is the bindings it reads so far, `L` its
 * locals, `Throws` the messages it can raise. Each step's callback receives
 * the locals as expressions (`$.invite`, `$.invite.status`). Left open, a
 * block (or branch) yields NONE.
 */
interface Block<P extends Params, L extends Locals, Throws extends string> extends Ended<P, Throws, Schema.Undefined> {
    /**
     * `LET $name = value`: an expression, or a built statement of one result
     * (a select, a write), whose result later steps read as `$[name]`. The
     * name must not be a local already, a binding of the block or a name
     * SurrealDB sets. A local of a branch is visible only in that branch.
     */
    readonly let: <const N extends string, V extends LetValue>(name: LocalName<N, P, L>, value: ($: Scope<L>) => V) => Block<P & ValueParams<V>, L & {
        readonly [K in N]: ValueCodec<V>;
    }, Throws | ValueThrows<V>>;
    /** `IF condition { THROW message }`: the message joins `throws`. */
    readonly throwIf: <P2 extends Params, const M extends string>(condition: ($: Scope<L>) => Condition<P2>, message: M) => Block<P & P2, L, Throws | M>;
    /**
     * `IF $name = NONE { THROW message }`: later steps read the local
     * without NONE (`$.invite.team` is the team, not the team or NONE).
     */
    readonly throwIfNone: <const N extends keyof L & string, const M extends string>(name: N, message: M) => Block<P, Narrowed<L, N>, Throws | M>;
    /** A statement run for its effect, whose result is NONE. */
    readonly do: <S extends AnyStatement>(step: ($: Scope<L>) => ForEffect<S>) => Block<P & S['params'], L, Throws | (S extends Statement<Params, Codec, infer T> ? T : never)>;
    /**
     * Ends the block or branch with a value: an expression, or an object of
     * expressions and primitives (each inlined as its `literal`), which
     * decodes as a struct (`{ kind: 'joined', id: $.created.id }`).
     */
    readonly return: <const V extends Returned>(value: ($: Scope<L>) => V) => Ended<P & ReturnedParams<V>, Throws, ReturnedCodec<V>>;
    /** Ends the block or branch with `THROW message`. */
    readonly throw: <const M extends string>(message: M) => Ended<P, Throws | M, never>;
    /** `IF condition { … }`, which ends the block or branch. */
    readonly if: <P2 extends Params, A extends Arm>(condition: ($: Scope<L>) => Condition<P2>, then: (arm: Block<P & P2, L, never>) => A) => Branches<P & P2 & ArmParams<A>, L, Throws | ArmThrows<A>, ArmResult<A>>;
    /**
     * `IF $name != NONE { … }`, which ends the block or branch; inside, the
     * local is read without NONE.
     */
    readonly ifNotNone: <const N extends keyof L & string, A extends Arm>(name: N, then: (arm: Block<P, Narrowed<L, N>, never>) => A) => Branches<P & ArmParams<A>, L, Throws | ArmThrows<A>, ArmResult<A>>;
}
/**
 * A new block: a script of named locals, guards and branches, built into one
 * statement.
 *
 * @example
 * const pay = block()
 *   .let('wallet', () =>
 *     select(WalletTable, param('wallet_id', WalletId)).forUpdate().only().build())
 *   .throwIfNone('wallet', 'Wallet not found')
 *   .throwIf(($) => ne($.wallet.owner, param('payer', AccountId)), 'Not your wallet')
 *   .if(($) => lt($.wallet.balance, param('amount', Int)), (arm) =>
 *     arm.return(($) => ({ kind: 'declined', balance: $.wallet.balance })))
 *   .else((arm) => arm.return(() => ({ kind: 'paid' })))
 *   .build('pay');
 */
declare const block: () => Block<NoParams, NoLocals, never>;

/**
 * `CREATE`, `UPDATE`, `UPSERT`, `DELETE`, `RELATE`, `INSERT` and
 * `INSERT RELATION` from generated table descriptors.
 *
 * Data is bound, never inlined, and must fit the schema the descriptor
 * declares for the operation (`create`, `merge`, `content`). The result
 * codec follows from the target and the `RETURN` clause:
 *
 * - one record that the statement makes (`CREATE ONLY`, `RELATE ONLY`,
 *   `UPSERT ONLY $id`): the row;
 * - one record by id (`UPDATE ONLY $id`, `DELETE ONLY $id`): the row, or
 *   NONE when the record does not exist or the condition does not hold;
 * - a table, and every `INSERT`: an array of rows.
 *
 * `RETURN BEFORE` is NONE for a record the statement made (an `UPSERT` or
 * `INSERT` that created it), `RETURN AFTER` NONE for a deleted one, and
 * `RETURN DIFF` each record's JSON Patch ({@link Diff}).
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
type IsUnion$2<A, Whole = A> = A extends unknown ? [Whole] extends [A] ? false : true : never;
/**
 * The fields `S` sends below `Path` that `Target` does not have, as paths
 * (`settings.notify.x`, `phones[*].x`), when both are objects or arrays.
 * It descends only where the two types differ and `Target` is not a union,
 * so it follows the target schema's own nesting and stops with it: at a
 * type `S` shares, at an open record (whose keys are all accepted), and at
 * a union (whose member is not known).
 */
type ExtraBelow<S, Target, Path extends string> = [Target] extends [S] ? never : true extends IsUnion$2<Target> ? never : Target extends ReadonlyArray<infer TargetItem> ? S extends ReadonlyArray<infer Item> ? ExtraBelow<NonNullable<Item>, NonNullable<TargetItem>, `${Path}[*]`> : never : [Target] extends [object] ? S extends object ? `${Path}.${Exclude<keyof S, keyof Target> & string}` | NestedExtra<S, Target, `${Path}.`> : never : never;
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
/**
 * One operation of a JSON Patch, as SurrealDB writes them for `RETURN DIFF`:
 * `add`, `remove`, `replace` (the path `""` and the whole record for a
 * created one, NONE for a deleted one) and `change`, whose value is a text
 * patch of a string. SurrealDB 3.3 and 4.0 write these four and no other
 * (`test/conformance.test.ts` pins them). Values are native SDK values.
 */
declare const PatchOperation: Schema.Union<readonly [Schema.Struct<{
    readonly op: Schema.Literal<"add">;
    readonly path: Schema.String;
    readonly value: Schema.Codec<SurrealValue, SurrealValue, never, never>;
}>, Schema.Struct<{
    readonly op: Schema.Literal<"remove">;
    readonly path: Schema.String;
}>, Schema.Struct<{
    readonly op: Schema.Literal<"replace">;
    readonly path: Schema.String;
    readonly value: Schema.optional<Schema.Codec<SurrealValue, SurrealValue, never, never>>;
}>, Schema.Struct<{
    readonly op: Schema.Literal<"change">;
    readonly path: Schema.String;
    readonly value: Schema.String;
}>]>;
type PatchOperation = typeof PatchOperation.Type;
/** What `RETURN DIFF` yields for one record: its JSON Patch. */
declare const Diff: Schema.$Array<Schema.Union<readonly [Schema.Struct<{
    readonly op: Schema.Literal<"add">;
    readonly path: Schema.String;
    readonly value: Schema.Codec<SurrealValue, SurrealValue, never, never>;
}>, Schema.Struct<{
    readonly op: Schema.Literal<"remove">;
    readonly path: Schema.String;
}>, Schema.Struct<{
    readonly op: Schema.Literal<"replace">;
    readonly path: Schema.String;
    readonly value: Schema.optional<Schema.Codec<SurrealValue, SurrealValue, never, never>>;
}>, Schema.Struct<{
    readonly op: Schema.Literal<"change">;
    readonly path: Schema.String;
    readonly value: Schema.String;
}>]>>;
type Diff = typeof Diff.Type;
/** The codec of {@link Diff}. */
type DiffCodec = typeof Diff;
/**
 * `M`, the `RETURN` mode a caller wrote, when the statement has it;
 * otherwise a message saying why not.
 */
type ReturnMode<M, Allowed extends string, Verb extends string> = [
    M
] extends [Allowed] ? M : M extends 'before' ? `${Verb} has no RETURN BEFORE: a record it makes had no state before` : `\`${M & string}\` is not a RETURN mode of ${Verb}`;
/** A `CREATE ONLY` under construction; `R` is the codec of its result. */
interface Create<T extends PureTable, P extends Params, R extends Codec> {
    /** `CONTENT`: the new record's data, as the table's create schema. */
    readonly content: <S extends Codec, P2 extends Params>(data: Fits<OperationOf<T, 'create'>, S, Expr<S, P2>, T['name'], 'CREATE'>) => Create<T, P & P2, R>;
    /**
     * `RETURN NONE`, `RETURN AFTER` (the default), `RETURN DIFF` (the
     * record's JSON Patch) or chosen expressions. `RETURN BEFORE` is refused:
     * a created record had no state before.
     */
    readonly returning: {
        <const M extends string>(mode: ReturnMode<M, 'none' | 'after' | 'diff', 'CREATE'>): Create<T, P, M extends 'none' ? Schema.Undefined : M extends 'after' ? StoredRow<T> : DiffCodec>;
        <const F>(fields: (row: RowExprs<T>) => CheckedProjection<F>): Create<T, P & ParamsOfAll<F[keyof F]>, ProjectedCodec<F>>;
    };
    /** `RETURN VALUE`: one expression of the created record. */
    readonly returningValue: <S extends Codec, P2 extends Params>(pick: (row: RowExprs<T>) => Expr<S, P2>) => Create<T, P & P2, RowCodec<S>>;
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
    /**
     * `RETURN NONE`, `AFTER` (the default), `BEFORE`, `DIFF` (each record's
     * JSON Patch) or chosen expressions.
     */
    readonly returning: {
        <const M extends string>(mode: ReturnMode<M, 'none' | 'after' | 'before' | 'diff', 'UPDATE'>): Update<T, P, M extends 'none' ? NoResult<S> : M extends 'diff' ? WriteResult<DiffCodec, S> : WriteResult<StoredRow<T>, S>, S>;
        <const F>(fields: (row: RowExprs<T>) => CheckedProjection<F>): Update<T, P & ParamsOfAll<F[keyof F]>, WriteResult<ProjectedCodec<F>, S>, S>;
    };
    /** `RETURN VALUE`: one expression of each changed record. */
    readonly returningValue: <V extends Codec, P2 extends Params>(pick: (row: RowExprs<T>) => Expr<V, P2>) => Update<T, P & P2, WriteResult<RowCodec<V>, S>, S>;
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
/**
 * `V`, the data expression of codec `S`, when `S` fits both `First` and
 * `Second`: an `UPSERT` creates the record when it is missing and changes
 * it when it is there, so its data must be what both accept. Otherwise the
 * message of the first that refuses it.
 */
type FitsBoth<First extends Codec, Second extends Codec, S extends Codec, V, Table extends string, Clause extends string> = Fits<First, S, V, Table, Clause> extends V ? Fits<Second, S, V, Table, Clause> : Fits<First, S, V, Table, Clause>;
/** An `UPSERT` under construction; `R` is the codec of its result. */
interface Upsert<T extends PureTable, P extends Params, R extends Codec, S extends 'one' | 'many'> {
    /**
     * Adds a condition (an `UPSERT` of a table only): the records it holds
     * for are changed, and one is created when none does.
     */
    readonly where: S extends 'many' ? <P2 extends Params>(predicate: (row: RowExprs<T>) => Condition<P2>) => Upsert<T, P & P2, R, S> : (predicate: 'an UPSERT of one record creates or changes that record; it takes no condition') => never;
    /**
     * `RETURN NONE`, `AFTER` (the default), `BEFORE` (NONE for a record the
     * statement created), `DIFF` or chosen expressions.
     */
    readonly returning: {
        <const M extends string>(mode: ReturnMode<M, 'none' | 'after' | 'before' | 'diff', 'UPSERT'>): Upsert<T, P, M extends 'none' ? NoResult<S> : M extends 'diff' ? WriteResult<DiffCodec, S> : M extends 'before' ? WriteResult<Schema.UndefinedOr<StoredRow<T>>, S> : WriteResult<StoredRow<T>, S>, S>;
        <const F>(fields: (row: RowExprs<T>) => CheckedProjection<F>): Upsert<T, P & ParamsOfAll<F[keyof F]>, WriteResult<ProjectedCodec<F>, S>, S>;
    };
    /** `RETURN VALUE`: one expression of each record. */
    readonly returningValue: <V extends Codec, P2 extends Params>(pick: (row: RowExprs<T>) => Expr<V, P2>) => Upsert<T, P & P2, WriteResult<RowCodec<V>, S>, S>;
    /** The finished statement. */
    readonly build: (name?: string) => Statement<Simplify<P>, R>;
}
/** An `UPSERT` that still needs its data. */
interface UpsertTarget<T extends PureTable, P extends Params, S extends 'one' | 'many'> {
    /**
     * `MERGE`: the record's fields to set. The data must fit the table's
     * create schema (the record may be created) and its merge schema (it
     * may be changed).
     */
    readonly merge: <D extends Codec, P2 extends Params>(data: FitsBoth<OperationOf<T, 'create'>, OperationOf<T, 'merge'>, D, Expr<D, P2>, T['name'], 'UPSERT … MERGE'>) => Upsert<T, P & P2, WriteResult<StoredRow<T>, S>, S>;
    /**
     * `CONTENT`: the record's writable fields, replacing them when it
     * exists. The data must fit the table's create and content schemas.
     */
    readonly content: <D extends Codec, P2 extends Params>(data: FitsBoth<OperationOf<T, 'create'>, OperationOf<T, 'content'>, D, Expr<D, P2>, T['name'], 'UPSERT … CONTENT'>) => Upsert<T, P & P2, WriteResult<StoredRow<T>, S>, S>;
}
/**
 * `UPSERT ONLY $id`: creates the record when it is missing and changes it
 * when it is there, returning it; or `UPSERT table … WHERE`, changing every
 * record the condition holds for, or creating one when none does, and
 * returning them all. Without a condition, `UPSERT table` creates a record.
 *
 * @example
 * const touch = upsert(CounterTable, recordId(CounterTable, param('key', SurrealSchema.String)))
 *   .merge(param('changes', CounterMerge))
 *   .build();
 */
declare const upsert: {
    <T extends PureTable>(table: T): UpsertTarget<T, NoParams, 'many'>;
    <T extends PureTable, P extends Params>(table: T, id: IdOf<T, P>): UpsertTarget<T, P, 'one'>;
};
/** A `DELETE` under construction; `R` is the codec of its result. */
interface Delete<T extends PureTable, P extends Params, R extends Codec, S extends Shape> {
    /** Adds a condition. Several `where` calls must all hold. */
    readonly where: <P2 extends Params>(predicate: (row: RowExprs<T>) => Condition<P2>) => Delete<T, P & P2, R, S>;
    /**
     * `RETURN NONE` (the default), `BEFORE` (the deleted rows), `AFTER` (NONE
     * for each deleted record), `DIFF` (each record's JSON Patch) or chosen
     * expressions of each record as it was (`$before.…`).
     */
    readonly returning: {
        <const M extends string>(mode: ReturnMode<M, 'none' | 'after' | 'before' | 'diff', 'DELETE'>): Delete<T, P, M extends 'none' ? NoResult<S> : M extends 'diff' ? WriteResult<DiffCodec, S> : M extends 'after' ? WriteResult<Schema.Undefined, S> : WriteResult<StoredRow<T>, S>, S>;
        <const F>(fields: (row: RowExprs<T>) => CheckedProjection<F>): Delete<T, P & ParamsOfAll<F[keyof F]>, WriteResult<ProjectedCodec<F>, S>, S>;
    };
    /** `RETURN VALUE`: one expression of each deleted record as it was. */
    readonly returningValue: <V extends Codec, P2 extends Params>(pick: (row: RowExprs<T>) => Expr<V, P2>) => Delete<T, P & P2, WriteResult<RowCodec<V>, S>, S>;
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
    /**
     * `RETURN NONE`, `RETURN AFTER` (the default), `RETURN DIFF` or chosen
     * expressions. `RETURN BEFORE` is refused: a new edge had no state
     * before.
     */
    readonly returning: {
        <const M extends string>(mode: ReturnMode<M, 'none' | 'after' | 'diff', 'RELATE'>): Relate<T, P, M extends 'none' ? Schema.Undefined : M extends 'after' ? StoredRow<T> : DiffCodec>;
        <const F>(fields: (row: RowExprs<T>) => CheckedProjection<F>): Relate<T, P & ParamsOfAll<F[keyof F]>, ProjectedCodec<F>>;
    };
    /** `RETURN VALUE`: one expression of the new edge. */
    readonly returningValue: <S extends Codec, P2 extends Params>(pick: (row: RowExprs<T>) => Expr<S, P2>) => Relate<T, P & P2, RowCodec<S>>;
    /** The finished statement. */
    readonly build: (name?: string) => Statement<Simplify<P>, R>;
}
/**
 * `RELATE ONLY $from->table->$to`: one edge between two records. Each
 * endpoint must be a record id the relation declares for that side.
 */
declare const relate: <T extends RelationTable, From extends Codec, PF extends Params, To extends Codec, PT extends Params>(table: T, from: Endpoint<T["edge"]["in"], From, Expr<From, PF>, `this record id is not an \`in\` endpoint of \`${T["name"]}\``>, to: Endpoint<T["edge"]["out"], To, Expr<To, PT>, `this record id is not an \`out\` endpoint of \`${T["name"]}\``>) => Relate<T, PF & PT, StoredRow<T>>;
/** The encoded create row of `T`, or none for a table that takes no data. */
type CreateEncoded<T extends PureTable> = [OperationOf<T, 'create'>] extends [
    never
] ? Record<never, never> : OperationOf<T, 'create'>['Encoded'];
/** What one row of `INSERT INTO table` may hold: the create row and an `id`. */
type InsertRow<T extends PureTable> = CreateEncoded<T> & {
    readonly id?: T['id']['Encoded'];
};
/** What one row of `INSERT RELATION INTO table` holds: its endpoints too. */
type InsertRelationRow<T extends RelationTable> = InsertRow<T> & {
    readonly in: T['edge']['in'][number]['Encoded'];
    readonly out: T['edge']['out'][number]['Encoded'];
};
/**
 * `V`, the data expression of codec `S`, when `S` is one row `Row` or an
 * array of them; otherwise a message naming what does not fit.
 */
type FitsRows<Row, S extends Codec, V, Table extends string, Clause extends string> = S['Encoded'] extends ReadonlyArray<infer Item> ? FitsEncoded<Item, Row, V, Table, Clause> : FitsEncoded<S['Encoded'], Row, V, Table, Clause>;
/** The fields of the table's merge schema an assignment may set. */
type MergeFieldsOf<T extends PureTable> = FieldsOf$1<OperationOf<T, 'merge'>>;
/**
 * Assignments of `ON DUPLICATE KEY UPDATE` as the callback returned them,
 * `F`, checked: each key a field the table's merge schema has, each value an
 * expression or constant whose stored type is what that field holds.
 */
type CheckedAssignments<T extends PureTable, F> = {
    readonly [K in keyof F]: K extends keyof MergeFieldsOf<T> ? F[K] extends Expr | Primitive ? [OperandEncoded<F[K]>] extends [
        (MergeFieldsOf<T>[K] & Codec)['Encoded']
    ] ? F[K] : `\`${K & string}\` does not hold this value` : 'an assignment is an expression: inline a constant with `literal`' : `\`${K & string}\` is not a field \`${T['name']}\` accepts in ON DUPLICATE KEY UPDATE`;
};
/** An `INSERT` under construction; `R` is the codec of its result. */
interface Insert<T extends PureTable, P extends Params, R extends Codec> {
    /**
     * `ON DUPLICATE KEY UPDATE`: when a row's id or a unique index already
     * holds its values, set these fields of the existing record instead.
     * `input` is the row the statement tried to insert (`$input.…`); a value
     * may also be a binding or a constant. The stored record's own fields
     * are not offered: SurrealDB 3.3 reads them as NONE there and 4.0 reads
     * the record, so a statement reading them would mean two things.
     */
    readonly onDuplicate: <const F>(set: (input: RowExprs<T>) => CheckedAssignments<T, F>) => Insert<T, P & ParamsOfAll<F[keyof F]>, R>;
    /**
     * `RETURN NONE`, `AFTER` (the default), `BEFORE` (NONE for each row the
     * statement inserted, the record for one it updated), `DIFF` or chosen
     * expressions.
     */
    readonly returning: {
        (mode: 'none'): Insert<T, P, NoResult<'many'>>;
        (mode: 'after'): Insert<T, P, WriteResult<StoredRow<T>, 'many'>>;
        (mode: 'before'): Insert<T, P, WriteResult<Schema.UndefinedOr<StoredRow<T>>, 'many'>>;
        (mode: 'diff'): Insert<T, P, WriteResult<DiffCodec, 'many'>>;
        <const F>(fields: (row: RowExprs<T>) => CheckedProjection<F>): Insert<T, P & ParamsOfAll<F[keyof F]>, WriteResult<ProjectedCodec<F>, 'many'>>;
    };
    /** `RETURN VALUE`: one expression of each record. */
    readonly returningValue: <V extends Codec, P2 extends Params>(pick: (row: RowExprs<T>) => Expr<V, P2>) => Insert<T, P & P2, WriteResult<RowCodec<V>, 'many'>>;
    /** The finished statement. */
    readonly build: (name?: string) => Statement<Simplify<P>, R>;
}
/**
 * `INSERT INTO table $data`: one row, or an array of rows, each the table's
 * create row with an optional `id`. Returns every inserted row (an `INSERT`
 * always returns a list). A row whose id or unique index values are taken
 * fails the statement, unless `.onDuplicate(…)` says what to update.
 *
 * @example
 * const add = insert(PersonTable, param('people', Schema.Array(PersonCreate)))
 *   .onDuplicate((input) => ({ name: input.name }))
 *   .build();
 */
declare const insert: <T extends PureTable, D extends Codec, P extends Params>(table: T, data: FitsRows<InsertRow<T>, D, Expr<D, P>, T["name"], "INSERT">) => Insert<T, P, WriteResult<StoredRow<T>, "many">>;
/**
 * `INSERT RELATION INTO table $data`: one edge, or an array of edges, each
 * with its `in` and `out` endpoints (ids the relation declares) and the
 * table's create row. Returns every inserted edge.
 */
declare const insertRelation: <T extends RelationTable, D extends Codec, P extends Params>(table: T, data: FitsRows<InsertRelationRow<T>, D, Expr<D, P>, T["name"], "INSERT RELATION">) => Insert<T, P, WriteResult<StoredRow<T>, "many">>;

/** One record id and the fields to merge into its row. */
type UpdateRow<T extends PureTable> = {
    readonly id: T['id']['Encoded'];
    readonly set: OperationOf<T, 'merge'>['Encoded'];
};
type FitsUpdateRows<T extends PureTable, D extends Codec, V> = D['Encoded'] extends ReadonlyArray<unknown> ? FitsRows<UpdateRow<T>, D, V, T['name'], 'UPDATE EACH'> : 'UPDATE EACH needs a list of rows';
type Missing = 'error' | 'ignore';
interface UpdateEach<_T extends PureTable, P extends Params, M extends Missing = 'error'> {
    readonly build: (name?: string) => Statement<Simplify<P>, NoResult<'many'>, M extends 'ignore' ? never : 'Record not found'>;
}
/** Merges each row's fields into its record, throwing on a missing record by default. */
declare function updateEach<T extends PureTable, D extends Codec, P extends Params>(table: T, rows: FitsUpdateRows<T, D, Expr<D, P>>, options: {
    readonly missing: 'ignore';
}): UpdateEach<T, P, 'ignore'>;
declare function updateEach<T extends PureTable, D extends Codec, P extends Params>(table: T, rows: FitsUpdateRows<T, D, Expr<D, P>>, options?: {
    readonly missing?: Missing;
}): UpdateEach<T, P>;

/**
 * Authored SurrealQL as statements: a `part` is one text with what it reads,
 * defines, returns and throws, checked against the text by the package's own
 * analyzer; a `sequence` runs parts in one scope as one statement.
 *
 * This is the only module of `effect-surrealkit/statement` that imports the
 * analyzer, so code that only uses the builders does not carry it.
 */

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
 * - `tables`, `functions` and `openTargets`: the static tables the text
 *   reads and writes, the custom functions it calls, and whether some
 *   target is not a static name (so the lists may be incomplete). Optional
 *   in a declaration and checked against the text when given; {@link part}
 *   always sets them to what the analyzer derives.
 * - `uses`: what each free binding is used as, where the analyzer can tell
 *   (see `Analysis.uses` in `effect-surrealkit/analyze`). Checked against
 *   the text when given; {@link part} always sets it.
 * - `binds`: for a binding whose every use resolves, in the schema, to the
 *   same simple kind, that kind's text (`string`, `int`, `record<t>`, …),
 *   as `option<K>` when every use accepts NONE.
 *   `effect-surrealkit statements` writes it when given the schema;
 *   `sequence(...).define` then refuses, at compile time, a codec whose
 *   stored type cannot hold it.
 * - `rejectsNone`: for a binding the text assigns (`SET field = $name`) to
 *   a field the engine never accepts NONE in (its kind excludes NONE and
 *   no `DEFAULT`, `VALUE` or `COMPUTED` supplies a value), that field's
 *   table, name and kind text. `effect-surrealkit statements` writes it
 *   when given the schema; `sequence(...).define` then refuses, at compile
 *   time, a codec that can hold NONE (`undefined`) for the binding. Each
 *   entry must be an assignment the text makes.
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
    /**
     * The 1-based position of the last result that is not `BEGIN`, `COMMIT`
     * or `CANCEL`, 0 when there is none. Optional: derived from the text
     * when absent, checked against it when declared.
     */
    readonly valueSlot?: number;
    readonly throws: ReadonlyArray<Throws>;
    readonly throwsAt?: Readonly<Record<string, ReadonlyArray<number>>>;
    readonly writes?: boolean;
    readonly tables?: Tables;
    readonly functions?: ReadonlyArray<string>;
    readonly openTargets?: boolean;
    readonly uses?: BindingUses;
    readonly binds?: Binds;
    readonly rejectsNone?: RejectsNone;
}
/** The kind text each binding's every use resolves to; see {@link Part}. */
type Binds = Readonly<Record<string, string>>;
/** The field each binding is assigned to that rejects NONE; see {@link Part}. */
type RejectsNone = Readonly<Record<string, {
    readonly table: string;
    readonly field: string;
    readonly kind: string;
}>>;
/** The static tables a text reads and writes. */
interface Tables {
    readonly read: ReadonlyArray<string>;
    readonly written: ReadonlyArray<string>;
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
declare const part: <const Free extends string = never, const Defines extends string = never, const Throws extends string = never, const U extends BindingUses = Record<never, never>, const B extends Binds = Record<never, never>, const N extends RejectsNone = Record<never, never>>(options: {
    readonly name?: string;
    readonly source?: string;
    readonly sql: string;
    readonly free?: ReadonlyArray<Free>;
    readonly defines?: ReadonlyArray<Defines>;
    readonly slots?: number;
    /** Checked against the text when given; see {@link Part}. */
    readonly valueSlot?: number;
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
    /** Checked against the text when given; see {@link Part}. */
    readonly tables?: Tables;
    /** Checked against the text when given; see {@link Part}. */
    readonly functions?: ReadonlyArray<string>;
    /** Checked against the text when given; see {@link Part}. */
    readonly openTargets?: boolean;
    /** Checked against the text when given; see {@link Part}. */
    readonly uses?: U;
    /**
     * The kind each binding's uses resolve to in the schema; see
     * {@link Part}. Each name must be a binding the text uses.
     */
    readonly binds?: B;
    /**
     * The fields that reject NONE each binding is assigned to; see
     * {@link Part}. Each must be an assignment the text makes.
     */
    readonly rejectsNone?: N;
}) => Part<Free, Defines, Throws> & Fitting<U, B, N>;
/**
 * The bindings a sequence still needs from its caller: each part's free
 * names, minus what earlier parts define.
 */
type Unbound<Parts extends ReadonlyArray<Part>, Defined extends string = never> = Parts extends readonly [
    infer Head extends Part,
    ...infer Tail extends ReadonlyArray<Part>
] ? Exclude<Head['free'][number], Defined> | Unbound<Tail, Defined | Head['defines'][number]> : never;
/**
 * What a part declared with `binds` or `rejectsNone` carries at the type
 * level: its uses and binds, and the fields that reject NONE, as literal
 * types, which {@link Contract} checks codecs against. Nothing for a part
 * without either.
 */
type Fitting<U, B, N = Record<never, never>> = ([keyof B] extends [never] ? unknown : {
    readonly uses: U;
    readonly binds: B;
}) & ([keyof N] extends [never] ? unknown : {
    readonly rejectsNone: N;
});
/**
 * The stored type of each simple kind, as the package's own codec for it
 * encodes it: the representation comparisons check (see `Comparable` in
 * the builders). `int` is either profile's.
 */
interface KindStorage {
    readonly string: (typeof SurrealString)['Encoded'];
    readonly bool: boolean;
    readonly int: (typeof Int)['Encoded'] | (typeof Int64)['Encoded'];
    readonly float: (typeof Float)['Encoded'];
    readonly number: (typeof SurrealNumber)['Encoded'];
    readonly decimal: Decimal;
    readonly datetime: (typeof DateTime)['Encoded'];
    readonly duration: (typeof Duration)['Encoded'];
    readonly uuid: (typeof Uuid)['Encoded'];
}
/** The stored type of a simple kind's text. */
type KindStored<K> = K extends keyof KindStorage ? KindStorage[K] : K extends `record<${infer T}>` ? RecordId<T> : never;
/** One binding a part's `binds` states, with the uses it came from. */
interface BindEntry {
    readonly name: string;
    readonly kind: string;
    readonly use: unknown;
}
/**
 * The entries of one part's `binds`, without the index signature `Part`
 * declares and without the names in `Defined`.
 */
type Entries<B, U, Defined extends string> = {
    [K in keyof B as string extends K ? never : K extends Defined ? never : K]: {
        readonly name: K;
        readonly kind: B[K];
        readonly use: K extends keyof U ? U[K] extends readonly [infer First, ...unknown[]] ? First : never : never;
    };
} extends infer M ? M[keyof M] : never;
/**
 * The `binds` entries of a sequence's parts, for the names that remain
 * bindings: a name an earlier part defines is not one.
 */
type BindsOf<Parts extends ReadonlyArray<Part>, Defined extends string = never> = Parts extends readonly [
    infer Head extends Part,
    ...infer Tail extends ReadonlyArray<Part>
] ? (Head extends {
    readonly binds: infer B;
    readonly uses: infer U;
} ? Entries<B, U, Defined> : never) | BindsOf<Tail, Defined | Head['defines'][number]> : never;
/** One binding a part's `rejectsNone` states. */
interface NoneEntry {
    readonly name: string;
    readonly table: string;
    readonly field: string;
    readonly kind: string;
}
/**
 * The entries of one part's `rejectsNone`, without the index signature
 * and without the names in `Defined`.
 */
type NoneEntries<N, Defined extends string> = {
    [K in keyof N as string extends K ? never : K extends Defined ? never : K]: N[K] extends {
        readonly table: infer T extends string;
        readonly field: infer F extends string;
        readonly kind: infer I extends string;
    } ? {
        readonly name: K;
        readonly table: T;
        readonly field: F;
        readonly kind: I;
    } : never;
} extends infer M ? M[keyof M] : never;
/**
 * The `rejectsNone` entries of a sequence's parts, for the names that
 * remain bindings: a name an earlier part defines is not one.
 */
type RejectsNoneOf<Parts extends ReadonlyArray<Part>, Defined extends string = never> = Parts extends readonly [
    infer Head extends Part,
    ...infer Tail extends ReadonlyArray<Part>
] ? (Head extends {
    readonly rejectsNone: infer N;
} ? NoneEntries<N, Defined> : never) | RejectsNoneOf<Tail, Defined | Head['defines'][number]> : never;
/** How a message names a use. */
type UseText<U> = U extends {
    readonly kind: 'field';
    readonly table: infer T extends string;
    readonly field: infer F extends string;
} ? U extends {
    readonly role: 'assign';
} ? `is assigned to \`${T}.${F}\`` : `is compared with \`${T}.${F}\`` : U extends {
    readonly kind: 'argument';
    readonly function: infer F extends string;
    readonly index: infer I extends number;
} ? `is passed to \`${F}\` at index ${I}` : U extends {
    readonly kind: 'key';
    readonly table: infer T extends string;
} ? `is the key of a \`${T}\` record` : 'is used';
/**
 * A message for each entry whose kind the codec `C` cannot hold: their
 * stored types do not overlap, exactly as {@link Comparable} decides for
 * two operands. For `option<K>` the codec's `undefined` (NONE) is set
 * aside first. `never` when every entry fits.
 */
type Misfits<E, C> = E extends BindEntry ? C extends Codec ? (E['kind'] extends `option<${infer K}>` ? Comparable<KindStored<K>, Exclude<C['Encoded'], undefined>, true> : Comparable<KindStored<E['kind']>, C['Encoded'], true>) extends true ? never : `binding \`${E['name']}\` ${UseText<E['use']>} (${E['kind']}), which its codec cannot hold` : never : never;
/**
 * A message for each entry whose codec `C` can hold NONE: `undefined` is a
 * member of its encoded type (`unknown` and `any`, which hold everything,
 * are not refused). `never` otherwise.
 */
type HoldsNone<E, C> = E extends NoneEntry ? C extends Codec ? unknown extends C['Encoded'] ? never : undefined extends C['Encoded'] ? `binding \`${E['name']}\` is assigned to \`${E['table']}.${E['field']}\` (${E['kind']}), which rejects NONE, and its codec can hold NONE` : never : never : never;
/**
 * The message of each binding in `P` whose codec cannot hold its kind, or
 * can hold NONE where it is assigned to a field that rejects NONE.
 */
type MisfitsIn<P, E extends BindEntry, N extends NoneEntry> = {
    readonly [K in keyof P]: (K extends E['name'] ? Misfits<Extract<E, {
        readonly name: K;
    }>, P[K]> : never) | (K extends N['name'] ? HoldsNone<Extract<N, {
        readonly name: K;
    }>, P[K]> : never);
}[keyof P];
/** One member of a union, so a message names one binding. */
type OneOf<U> = ((U extends unknown ? (member: () => U) => void : never) extends (member: infer I) => void ? I : never) extends () => infer M ? M & string : never;
/**
 * `P`, when each codec can hold its binding's kind and none that can hold
 * NONE is assigned to a field that rejects it. Otherwise the message for
 * one binding whose codec does not fit, so the compiler's first line names
 * it.
 */
type Fitted<P, E extends BindEntry, N extends NoneEntry = never> = [
    MisfitsIn<P, E, N>
] extends [never] ? P : OneOf<MisfitsIn<P, E, N>>;
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
type Contract<Parts extends ReadonlyArray<Part>, P> = number extends Parts['length'] ? P : string extends Unbound<Parts> ? P : [
    Extract<Parts[number], {
        readonly binds: object;
    } | {
        readonly rejectsNone: object;
    }>
] extends [never] ? Exactly<Unbound<Parts>, P> : [Exactly<Unbound<Parts>, P>] extends [P] ? Fitted<P, BindsOf<Parts>, RejectsNoneOf<Parts>> : Exactly<Unbound<Parts>, P>;
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

declare const TextNodeTypeId = "~effect-surrealkit/TextNode";
type AnyText = Text<string, string, string, string, TextHoleScopes>;
/** Fills a hole with nothing: an absent clause is left out of the text. */
interface Empty {
    readonly [TextNodeTypeId]: 'empty';
}
/** A template with every hole filled. */
interface Composite<T extends AnyText = AnyText, F extends CompositeFills = CompositeFills> {
    readonly [TextNodeTypeId]: 'compose';
    readonly template: T;
    readonly fills: F;
}
/** One of several texts, by the value of one axis of the key. */
interface Choice<A extends string = string, O extends ChoiceOptions = ChoiceOptions> {
    readonly [TextNodeTypeId]: 'choose';
    readonly axis: A;
    readonly options: O;
}
/** What fills a hole: a part (statements) fills one that starts a statement. */
type TextNode = AnyText | Part<string, string, string> | Composite | Choice | Empty | Expr<Codec, NoParams>;
type CompositeFills = {
    readonly [hole: string]: TextNode;
};
type ChoiceOptions = {
    readonly [option: string]: TextNode;
};
/** The value an axis may take. */
type AxisValue = string | number | boolean;
/** The axes of a family: each a list of the values it may take. */
type Axes = {
    readonly [axis: string]: ReadonlyArray<AxisValue>;
};
/** A key: one value per axis. Union-valued properties select any of them. */
type KeyOf<A extends Axes> = {
    readonly [X in keyof A]: A[X][number];
};
declare const empty: Empty;
type OptionKey<V> = V extends AxisValue ? `${V}` : never;
type ScopeAt<T, H> = T extends {
    readonly scopes?: infer S;
} ? H extends keyof NonNullable<S> ? NonNullable<S>[H] : never : never;
type BoundAt<T, H> = ScopeAt<T, H> extends TextHoleScope<infer B, string> ? B : never;
type BindsAt<T, H> = ScopeAt<T, H> extends TextHoleScope<string, infer B> ? B : never;
type Selected<O, A extends string, K> = A extends keyof K ? O[OptionKey<K[A]> & keyof O] : never;
/**
 * The bindings node `N` reads when the key is `K`. For a key whose axes are
 * unions, every name some selectable variant reads.
 */
type FreeOf<N, K> = N extends Empty ? never : N extends Choice<infer A, infer O> ? string extends keyof O ? string : FreeOf<Selected<O, A, K>, K> : N extends Composite<infer T, infer F> ? string extends keyof F ? string : Exclude<T['free'][number], {
    [H in keyof F]: DefinesOf<F[H], K> & BindsAt<T, H>;
}[keyof F]> | {
    [H in keyof F]: Exclude<FreeOf<F[H], K>, BoundAt<T, H>>;
}[keyof F] : N extends Text<string, infer Free, string, string, TextHoleScopes> ? Free : N extends Part<infer Free, string, string> ? Free : never;
/** Whether `Name` is missing from the defines of some selectable option. */
type MissingFrom<Name, O, Keys, K> = Keys extends keyof O ? Name extends DefinesOf<O[Keys], K> ? never : Keys : never;
/** The names every selectable option of a choice defines. */
type DefinesOfChoice<O, Keys, K, All = Keys extends keyof O ? DefinesOf<O[Keys], K> : never> = All extends string ? [MissingFrom<All, O, Keys, K>] extends [never] ? All : never : never;
/**
 * The names node `N` `LET`s at its top level when the key is `K`: for a key
 * whose axes are unions, those every selectable variant defines.
 */
type DefinesOf<N, K> = N extends Choice<infer A, infer O> ? string extends keyof O ? string : A extends keyof K ? DefinesOfChoice<O, OptionKey<K[A]> & keyof O, K> : never : N extends Composite<infer T, CompositeFills> ? T['defines'][number] : N extends Text<string, string, infer D, string, TextHoleScopes> ? D : N extends Part<string, infer D, string> ? D : never;
/** The messages node `N` can `THROW` when the key is `K`. */
type ThrowsOf<N, K> = N extends Choice<infer A, infer O> ? string extends keyof O ? string : ThrowsOf<Selected<O, A, K>, K> : N extends Composite<infer T, infer F> ? string extends keyof F ? string : T['throws'][number] | {
    [H in keyof F]: ThrowsOf<F[H], K>;
}[keyof F] : N extends Text<string, string, string, infer T, TextHoleScopes> ? T : N extends Part<string, string, infer T> ? T : never;
type IsUnion$1<T, U = T> = T extends unknown ? [U] extends [T] ? false : true : never;
/**
 * Why `V` cannot fill a hole, or `never`. A fill typed as a union of texts
 * is refused: the compiler could not tell which one a variant holds, so
 * what it reads would not be exact; `choose` between them instead.
 */
type FillProblem<V> = true extends IsUnion$1<V> ? 'this fill is typed as one of several texts, so the compiler cannot tell which a variant holds: choose between them with `choose(…)`' : SingleFillProblem<V>;
type SingleFillProblem<V> = V extends Expr<Codec, infer P> ? [keyof P] extends [never] ? never : 'a constant fill binds nothing: put the binding in a `.surql` fragment' : V extends Text<infer Holes, string, string, string, TextHoleScopes> ? [Holes] extends [never] ? never : `this fill is a template with holes (${Holes}): compose it first` : V extends TextNode ? never : 'a hole takes a generated text or part, `compose(…)`, `choose(…)`, `literal(…)` or `empty`, not raw SurrealQL';
/**
 * `F`, when it fills exactly the holes of `T`. Otherwise a fill for a hole
 * the template does not have, or a template given as a fill, is typed as a
 * message naming it, and when nothing is extra, the fills' expected type is
 * a message naming each hole left without one.
 */
type CheckedFills<T extends AnyText, F> = [F] extends [never] ? F : string extends T['holes'][number] ? F : [
    Exclude<keyof F, T['holes'][number]> | {
        [H in keyof F]: FillProblem<F[H]>;
    }[keyof F]
] extends [never] ? [Exclude<T['holes'][number], keyof F>] extends [never] ? F : `hole \`${Exclude<T['holes'][number], keyof F>}\` has no fill` : {
    readonly [H in keyof F]: H extends T['holes'][number] ? [FillProblem<F[H]>] extends [never] ? F[H] : FillProblem<F[H]> : `\`${H & string}\` is not a hole of this template`;
};
type AxesUsed<N> = N extends Choice<infer A, infer O> ? string extends keyof O ? string : A | AxesUsed<O[keyof O]> : N extends Composite<AnyText, infer F> ? string extends keyof F ? string : AxesUsed<F[keyof F]> : never;
type ChoiceProblems<A extends Axes, X extends string, O> = X extends keyof A ? ([Exclude<OptionKey<A[X][number]>, keyof O>] extends [never] ? never : `choose('${X}', …) has no text for \`${Exclude<OptionKey<A[X][number]>, keyof O>}\``) | ([Exclude<keyof O & string, OptionKey<A[X][number]>>] extends [
    never
] ? never : `choose('${X}', …) has a text for \`${Exclude<keyof O & string, OptionKey<A[X][number]>>}\`, which is not a value of the axis`) : `choose('${X}', …) names an axis this family does not declare`;
type TreeProblems<A extends Axes, N> = N extends Choice<infer X, infer O> ? string extends keyof O ? never : ChoiceProblems<A, X, O> | TreeProblems<A, O[keyof O]> : N extends Composite<AnyText, infer F> ? string extends keyof F ? never : TreeProblems<A, F[keyof F]> : never;
type AxisProblems<A extends Axes, N> = TreeProblems<A, N> | ([Exclude<keyof A & string, AxesUsed<N>>] extends [never] ? never : `axis \`${Exclude<keyof A & string, AxesUsed<N>>}\` is never chosen on, so every value of it gives the same text`);
/**
 * `A`, or a message naming each problem between the axes and the texts that
 * choose on them: a choice on an axis `A` does not declare, a value of an
 * axis a choice has no text for, a text for no value, an axis nothing
 * chooses on. Checked on the axes, whose type is short, so the first line of
 * the diagnostic is the message.
 */
type CheckedAxes<A extends Axes, N> = [A] extends [never] ? A : [AxisProblems<A, N>] extends [never] ? A : AxisProblems<A, N> & string;
/**
 * `P`, the codecs of a family, when they name exactly what its variants
 * read; otherwise as `Exactly` does for a sequence.
 */
type FamilyContract<Names extends string, P> = string extends Names ? P : [Exclude<keyof P, Names>] extends [never] ? [Exclude<Names, keyof P>] extends [never] ? P : `binding \`$${Exclude<Names, keyof P> & string}\` is read by a variant of this family and has no codec` : {
    readonly [X in keyof P]: X extends Names ? P[X] : `binding \`$${X & string}\` is not read by any variant of this family`;
};
/** The key `K`, or a message naming a property that is not an axis. */
type CheckedVariantKey<A extends Axes, K> = [K] extends [never] ? K : [Exclude<keyof K, keyof A>] extends [never] ? K : {
    readonly [X in keyof K]: X extends keyof A ? K[X] : `\`${X & string}\` is not an axis of this family`;
};
/** The codecs of `P` a variant reading `Names` binds. */
type ParamsAt<P, Names> = {
    readonly [X in keyof P as X extends Names ? X : never]: P[X];
};
/** A family: every variant its axes span, each a statement. */
interface Family<A extends Axes, N, P extends Params, R extends Codec> {
    readonly name: string;
    readonly axes: A;
    /**
     * The statement of the variant `key` selects. A key known only at run
     * time (an axis typed as a union) is typed as the statement that reads
     * every name some variant it can select reads: an input must give each
     * of them that is required, and the selected variant sends only what it
     * reads.
     */
    readonly select: <const K extends KeyOf<A>>(key: CheckedVariantKey<A, K>) => Statement<ParamsAt<P, FreeOf<N, K>>, R, ThrowsOf<N, K> & string>;
    /**
     * Every variant, built, with its key: for a build step, tests and
     * pinning. Each entry is a pinnable statement: `name` is the family's
     * name and one `axis-value` segment per axis (`listings.price-true.…`),
     * and `sql` the variant's text, so `renderPinnedStatements` and
     * `pinnedStatementProblems` take the list as it is.
     */
    readonly variants: () => ReadonlyArray<{
        readonly key: KeyOf<A>;
        readonly name: string;
        readonly sql: string;
        readonly statement: Statement<Params, R, ThrowsOf<N, KeyOf<A>> & string>;
    }>;
}
/**
 * Fills every hole of `template`. Each fill is a text without holes (a
 * generated fragment or part), another composite, a {@link choose}, a
 * constant (`literal(…)`) or {@link empty}. A hole without a fill, a fill for
 * a hole the template does not have, and a template given as a fill are
 * compile errors, and are refused here.
 */
declare const compose: <const T extends AnyText, const F extends {
    readonly [hole: string]: unknown;
}>(template: T, fills: CheckedFills<T, F>) => F extends CompositeFills ? Composite<T, F> : never;
/**
 * `O` with its keys as strings: `{ 1: … }` is keyed by the number 1, and a
 * key's axis value is looked up as text.
 */
type StringKeyed<O> = [Extract<keyof O, number>] extends [never] ? O : {
    readonly [X in keyof O as `${X & (string | number)}`]: O[X];
};
/** `O`, or each option that cannot be a fill typed as a message saying why. */
type CheckedOptions<O> = [O] extends [never] ? O : [{
    [X in keyof O]: FillProblem<O[X]>;
}[keyof O]] extends [never] ? O : {
    readonly [X in keyof O]: [FillProblem<O[X]>] extends [never] ? O[X] : FillProblem<O[X]>;
};
/** One of `options`, by the value of `axis` in the key a family selects with. */
declare const choose: <const A extends string, const O extends {
    readonly [option: string]: unknown;
}>(axis: A, options: CheckedOptions<O>) => O extends ChoiceOptions ? Choice<A, StringKeyed<O>> : never;
/**
 * Every variant the axes span of the text `root`, as statements.
 *
 * `define` takes one codec for each name any variant reads, and the result
 * codec every variant decodes with. It checks at once that every text
 * declares what its SQL does, that the axes are the ones the texts choose
 * on, and that the codecs are exactly the names the variants read by the
 * compiler's rule. A variant is built on its first selection (or by
 * `variants()`, or by `define` with `build: 'eager'`): its text is
 * rendered and analysed, and refused unless the analyzer reads exactly the
 * names the rule says (so the types of `select` are what is sent), throws
 * what it says, and the text has no holes and no errors.
 *
 * Every variant's statement is named after the family, so its metrics and
 * span are the family's; its `variant` is the key that selected it, which a
 * run records on its span.
 */
declare const family: <const A extends Axes, const N extends TextNode>(checkedAxes: CheckedAxes<A, N>, root: N) => {
    define: <const P extends Params, R extends Codec>(contract: {
        readonly name?: string;
        readonly params: FamilyContract<FreeOf<N, KeyOf<A>> & string, P>;
        readonly result: R;
        readonly writes?: boolean;
        readonly build?: "eager" | "lazy";
    }) => Family<A, N, P, R>;
};

/**
 * Record links and graph traversal, typed from the generated descriptors
 * and the store registry.
 *
 * A record link (`record<person>`) is followed to its target's fields with
 * {@link follow}, materialised with {@link rows} and destructured with
 * {@link destructure}; the target is found by name in the store's `tables`.
 * A graph step ({@link outgoing}, {@link incoming}, {@link both}) is typed
 * from the store's `edges`: it is legal only from a table the relation
 * accepts on that side, and yields the records on the other side, always as
 * a list. Recursive paths repeat a step ({@link recurse}, {@link collect},
 * {@link shortest}).
 *
 * Everything here is an expression, so it goes wherever expressions go: a
 * condition, a projection, `SELECT VALUE`.
 */

/** A relation's endpoints, as a store registry holds them. */
interface GraphEdge {
    readonly table: string;
    readonly in: ReadonlyArray<Codec>;
    readonly out: ReadonlyArray<Codec>;
    readonly enforced: boolean;
}
/**
 * What the graph functions read from a generated store registry
 * (`_store.ts`): every table and every relation's endpoints, by name.
 */
interface GraphStore {
    readonly tables: {
        readonly [name: string]: PureTable;
    };
    readonly edges: {
        readonly [name: string]: GraphEdge;
    };
}
/** The tables a record id type, or a list of them, names. */
type LinkTables<E> = E extends RecordId<infer Tb> ? Tb : E extends ReadonlyArray<infer I> ? LinkTables<I> : never;
type EncodedOf<R> = CodecOf<R>['Encoded'];
type TableNames$1<S> = S extends {
    readonly tables: infer M;
} ? keyof M : never;
/** The descriptor of each table in `Tb`, as a union. */
type TableIn<S, Tb> = S extends {
    readonly tables: infer M;
} ? Tb extends keyof M ? M[Tb] : never : never;
type SelectOf<T> = T extends {
    readonly select: infer R extends RowCodecIn;
} ? R : never;
/** The select schema of every table a link of type `E` can point at. */
type TargetSelect<S, E> = SelectOf<TableIn<S, LinkTables<E>>>;
/** The field schemas of every target, as a union: its keys are the common ones. */
type TargetFields<S, E> = FieldsOf<TargetSelect<S, E>>;
type FieldsOf<R> = R extends {
    readonly schema: {
        readonly fields: infer F;
    };
} ? F : R extends {
    readonly fields: infer F;
} ? F : never;
declare const traversalMarker = "~effect-surrealkit/Traversal";
/** Marks the expressions graph steps and recursive paths yield. */
declare const TraversalTypeId: typeof traversalMarker;
/** @internal */
interface TraversalData<Present extends boolean = boolean, Edge extends Codec = Codec> {
    /**
     * Every record the list holds exists and is readable: the engine drops
     * an edge whose endpoint the session may not read, and an `ENFORCED`
     * relation has no edge to a missing record. A relation that is not
     * enforced can point at a missing record, which reads as NONE.
     */
    readonly present: Present;
    /** The codec of one record of the list. */
    readonly item: Codec;
    /**
     * The `ENFORCED` relation `present` relies on, named when a record it
     * reaches decodes as NONE: only schema drift can leave one dangling.
     */
    readonly relation?: string;
    /** The edges a step walks (`id->member_of`), for {@link edges}. */
    readonly edges?: {
        readonly sql: string;
        readonly codec: Edge;
        readonly item: Codec;
        /**
         * The step filters the records it reaches, which its edges do not:
         * they would include the edges to the records it leaves out.
         */
        readonly filtered?: boolean;
    };
}
/**
 * The list of records a graph step or a recursive path yields. It is an
 * expression like any other (its codec decodes the record ids), and the
 * link functions read it as a list of links.
 */
interface Traversal<S extends Codec = Codec, P extends Params = Params, Present extends boolean = boolean, Edge extends Codec = never> extends Expr<S, P> {
    readonly [TraversalTypeId]: TraversalData<Present, Edge>;
}
type PresentOf<R> = R extends {
    readonly [TraversalTypeId]: TraversalData<infer B, Codec>;
} ? B : false;
type AsCodec<C> = Extract<C, Codec>;
/**
 * The codec of what reading `Leaf` through a link of type `E` yields: a
 * list for each list, NONE where the link may be NONE, and NONE for a
 * target that may be missing or unreadable (`Present` false), which is
 * what SurrealDB 3.3 and 4.0 answer for one.
 */
type Lift<E, Present extends boolean, Leaf extends Codec> = [
    undefined
] extends [E] ? OrNone<AsCodec<LiftDefined<Exclude<E, undefined>, Present, Leaf>>> : LiftDefined<E, Present, Leaf>;
type LiftDefined<E, Present extends boolean, Leaf extends Codec> = [E] extends [
    ReadonlyArray<infer I>
] ? Schema.$Array<AsCodec<LiftDefined<I, Present, Leaf>>> : Present extends true ? Leaf : OrNone<Leaf>;
/** Why `E` cannot be followed through store `S`, or `never`. */
type LinkProblem<S, E> = [LinkTables<E>] extends [never] ? 'this expression is not a record link: follow a field typed `record<table>`, a list of them, or a graph step' : string extends LinkTables<E> ? 'this link can point at any table (`record`), so its target has no known fields; declare it `record<table>`' : [Exclude<LinkTables<E>, TableNames$1<S>>] extends [never] ? never : `this link points at \`${Exclude<LinkTables<E>, TableNames$1<S>> & string}\`, which is not a table of this store`;
/** `R`, when it is a link store `S` can follow, or else a message saying why not. */
type Followable<S, R> = [LinkProblem<S, EncodedOf<R>>] extends [never] ? R : LinkProblem<S, EncodedOf<R>>;
type Keys<F> = Extract<keyof F, string>;
type Unwrapped<C> = C extends {
    readonly schema: infer I extends Codec;
} ? C extends {
    readonly '~type.optionality': 'optional';
} ? I : C : C;
type IsOptional<C> = C extends {
    readonly '~type.optionality': 'optional';
} ? true : false;
type Base<C> = AsCodec<Unwrapped<C>>;
/**
 * The fields of a link's target(s), one expression each: every field the
 * targets have in common, with the codecs of all of them. A field read
 * through a link may be NONE (the target may be missing or unreadable, or
 * the field optional); through a list of links it is a list. Each field
 * reads the bindings `P` the link reads.
 */
type Linked<F, E, Present extends boolean, Optional extends boolean = false, P extends Params = NoParams> = {
    readonly [K in Keys<F>]: LinkedField<F[K], E, Present, Optional extends true ? true : true extends IsOptional<F[K]> ? true : false, P>;
};
type LinkedField<C, E, Present extends boolean, Optional extends boolean, P extends Params> = Expr<AsCodec<Lift<E, Present, Optional extends true ? OrNone<Base<C>> : Base<C>>>, P> & ([Base<C>] extends [RowCodecIn] ? Linked<FieldsOf<Base<C>>, E, Present, Optional, P> : unknown);
/** The fields {@link follow} yields for the link `R`. */
type FollowedOf<S, R> = Linked<TargetFields<S, EncodedOf<R>>, EncodedOf<R>, PresentOf<R>, false, ParamsOf<R>>;
/** Whether `value` is the list a graph step or recursive path yields. */
declare const isTraversal: (value: unknown) => value is Traversal<Codec>;
/**
 * The fields of the record(s) `records` links to: `manager.name`,
 * `watchers.name`, `id->member_of->?.name`. The target is the store's
 * table of that name; a link to several tables (`record<org | team>`)
 * exposes the fields all of them have, and a link to any table (`record`)
 * exposes none.
 *
 * A field read through a link may be NONE, because SurrealDB answers NONE
 * for a link whose record is missing or the session may not read (3.3 and
 * 4.0 alike); read through a list of links it is a list, with NONE for each
 * such record. The records a graph step over an `ENFORCED` relation yields
 * always exist and are readable, so their fields are NONE only where the
 * field itself may be.
 *
 * @example
 * select(DocTable).where((row) =>
 *   eq(follow(store, row.owner).name, param('owner', SurrealSchema.String)),
 * );
 * // SELECT * FROM ⟨doc⟩ WHERE owner.name = $owner
 */
declare const follow: <S extends GraphStore, const R extends Expr>(store: S, records: Followable<S, R>) => FollowedOf<S, R>;
/** What {@link rows} yields for the link `R`: the target rows. */
type RowsOf<S, R> = AsCodec<Lift<EncodedOf<R>, PresentOf<R>, RowCodec<TargetSelect<S, EncodedOf<R>>>>>;
/**
 * The record(s) `records` links to, materialised (`x.*`): each decodes
 * with its table's select schema, so a list of ids becomes a list of rows.
 * A missing or unreadable record is NONE, as for {@link follow}.
 *
 * @example
 * select(PersonTable).project((row) => ({
 *   friends: rows(store, outgoing(store, row.id, 'knows')),
 * }));
 * // SELECT id->knows->?.* AS friends FROM ⟨person⟩
 */
declare const rows: <S extends GraphStore, const R extends Expr>(store: S, records: Followable<S, R>) => Expr<RowsOf<S, R>, ParamsOf<R>>;
/** The row object a destructuring callback receives for the link `R`. */
type TargetRow<S, R> = RowOf<TargetFields<S, EncodedOf<R>>>;
/** The projection a destructuring callback returned, checked. */
type CheckedShape<F> = {
    readonly [K in keyof F]: F[K] extends Expr ? F[K] : 'a destructured field is an expression: inline a constant with `literal`';
};
/** What {@link destructure} yields: one projected object per target. */
type DestructuredOf<R, F> = AsCodec<Lift<EncodedOf<R>, PresentOf<R>, ProjectedCodec<F>>>;
/**
 * Picks fields of the record(s) `records` links to, as SurrealQL
 * destructuring (`x.{ alias: field, … }`): a list of links yields a list of
 * projected objects, and one link one object, or NONE when its record is
 * missing or unreadable. The callback receives the target's fields, as
 * paths relative to it; any expression may be projected, a step from the
 * target included.
 *
 * Inside the callback, a field path always reads the target, so a field of
 * the outer row (which would read the target's field of that name) is
 * refused when the destructuring is built: project it beside the
 * destructured object, or bind the value with `param`. `parent(row.field)`
 * is refused here too, because SurrealDB 3.3 binds `$parent` inside a
 * destructuring to the outer row and 4.0 to the destructured record.
 *
 * @example
 * select(PersonTable).project((row) => ({
 *   teams: destructure(store, outgoing(store, row.id, 'member_of'), (team) => ({
 *     id: team.id,
 *     title: team.name,
 *   })),
 * }));
 * // SELECT id->member_of->?.{ id: id, title: name } AS teams FROM ⟨person⟩
 */
declare const destructure: <S extends GraphStore, const R extends Expr, const F>(store: S, records: Followable<S, R>, shape: (target: TargetRow<S, R>) => CheckedShape<F>) => Expr<DestructuredOf<R, F>, ParamsOf<R> & ParamsOfAll<F[keyof F]>>;
/** A direction of a graph step: `->`, `<-` or `<->`. */
type Direction = 'out' | 'in' | 'both';
type EdgeOf<S, N> = S extends {
    readonly edges: infer M;
} ? N extends keyof M ? M[N] : never : never;
type EndpointsOf<S, N, Side extends 'in' | 'out'> = EdgeOf<S, N> extends {
    readonly [K in Side]: ReadonlyArray<infer C extends Codec>;
} ? C : never;
/** The record ids a step in direction `D` along `N` starts from. */
type StepStarts<S, N, D extends Direction> = D extends 'out' ? EndpointsOf<S, N, 'in'> : D extends 'in' ? EndpointsOf<S, N, 'out'> : EndpointsOf<S, N, 'in'> | EndpointsOf<S, N, 'out'>;
/**
 * The record ids a step in direction `D` along `N` yields. `<->` yields
 * both endpoints of every edge it walks, so the record it starts from too.
 */
type StepEnds<S, N, D extends Direction> = D extends 'out' ? EndpointsOf<S, N, 'out'> : D extends 'in' ? EndpointsOf<S, N, 'in'> : EndpointsOf<S, N, 'in'> | EndpointsOf<S, N, 'out'>;
type EncodedOfCodec<C> = C extends Codec ? C['Encoded'] : never;
type Accepts<S, N, D extends Direction> = LinkTables<EncodedOfCodec<StepStarts<S, N, D>>>;
type Enforced<S, N> = EdgeOf<S, N> extends {
    readonly enforced: infer B extends boolean;
} ? B : false;
type Phrase<D extends Direction> = D extends 'out' ? 'out of' : D extends 'in' ? 'into' : 'at';
type IsList<E> = [Exclude<E, undefined>] extends [never] ? false : [Exclude<E, undefined>] extends [ReadonlyArray<unknown>] ? true : false;
/** Why a step along `N` cannot start from `R`, or `never`. */
type StepProblem<S, R, N, D extends Direction> = IsList<EncodedOf<R>> extends true ? R extends Traversal<Codec, Params, boolean, infer Edge> ? [Edge] extends [never] ? 'a graph step chains only from another step: from the records of a recursive path or the edges of a step SurrealDB yields one list per record' : StartProblem<S, EncodedOf<R>, N, D> : 'a graph step starts from one record or from another step: from a list of record links SurrealDB yields one list per link' : StartProblem<S, EncodedOf<R>, N, D>;
type StartProblem<S, E, N, D extends Direction> = [LinkTables<E>] extends [
    never
] ? 'a graph step starts from a record id: `row.id`, a record link, a binding of a record id, or another step' : string extends Accepts<S, N, D> ? never : string extends LinkTables<E> ? `this record can be of any table, and \`${N & string}\` has edges only ${Phrase<D>} \`${Accepts<S, N, D> & string}\`` : [Exclude<LinkTables<E>, Accepts<S, N, D>>] extends [never] ? never : `\`${N & string}\` has no edges ${Phrase<D>} \`${Exclude<LinkTables<E>, Accepts<S, N, D>> & string}\``;
/** `R`, when a step along `N` may start from it, or else a message saying why not. */
type StepFrom<S, R, N, D extends Direction> = [
    StepProblem<S, R, N, D>
] extends [never] ? R : StepProblem<S, R, N, D>;
type ListOf<E, Item extends Codec> = [undefined] extends [E] ? Schema.UndefinedOr<Schema.$Array<Item>> : Schema.$Array<Item>;
/** The codec of the list a step along `N` from `R` yields. */
type StepCodec<S, R, N, D extends Direction> = ListOf<EncodedOf<R>, StepEnds<S, N, D>>;
type EdgeTable<S, N> = TableIn<S, N>;
type EdgeIdOf<S, N> = EdgeTable<S, N> extends {
    readonly id: infer C extends Codec;
} ? C : never;
/** What a step along `N` from `R` yields. */
type Step<S, R, N, D extends Direction, P extends Params> = Traversal<StepCodec<S, R, N, D>, ParamsOf<R> & P, Enforced<S, N>, ListOf<EncodedOf<R>, EdgeIdOf<S, N>>>;
/** A step's options. */
interface StepOptions<T extends PureTable, P extends Params, Target = never, Q extends Params = NoParams> {
    /**
     * Walks only the edges that satisfy this condition, which reads the
     * edge's fields: `->(member_of WHERE role = $role)->?`. A field path of
     * another row would read the edge's field of that name, so it is
     * refused when the step is built; read the row of the select the step
     * sits directly under with `parent(row.field)`, or bind the value.
     */
    readonly where?: (edge: RowExprs<T>) => Condition<P>;
    /**
     * Keeps only the records reached that satisfy this condition, which
     * reads their fields (those every table on that side has):
     * `->member_of->(? WHERE name = $name)`. A field path of another row is
     * refused, as in `where`, and so is `parent(row.field)`. The step's
     * `edges` would include the edges to the records it leaves out, so
     * {@link edges} refuses a step with this filter.
     */
    readonly whereTarget?: (record: Target) => Condition<Q>;
}
/** The row object a step's `whereTarget` receives: the records it reaches. */
type ReachedRow<S, N, D extends Direction> = RowOf<TargetFields<S, EncodedOfCodec<StepEnds<S, N, D>>>>;
type EdgeRowTable<S, N> = Extract<EdgeTable<S, N>, PureTable>;
type StepFunction<D extends Direction> = <S extends GraphStore, const R extends Expr, const N extends keyof S['edges'] & string, P extends Params = NoParams, Q extends Params = NoParams>(store: S, from: StepFrom<S, R, N, D>, edge: N, options?: StepOptions<EdgeRowTable<S, N>, P, ReachedRow<S, N, D>, Q>) => Step<S, R, N, D, P & Q>;
/**
 * `from->edge->?`: the records the relation `edge` leads to from `from`,
 * as a list of their ids. `from` is a record id (`row.id`, a record link, a
 * binding) of a table the relation accepts as its `in`, or another step,
 * whose records the engine walks one after another into one flat list.
 * The records are those on the relation's `out` side; read them with
 * {@link follow}, {@link rows} or {@link destructure}, and the edges
 * themselves with {@link edges}.
 *
 * @example
 * select(PersonTable).project((row) => ({
 *   teams: outgoing(store, row.id, 'member_of', {
 *     where: (edge) => eq(edge.role, 'lead'),
 *   }),
 * }));
 * // SELECT id->(member_of WHERE role = s"lead")->? AS teams FROM ⟨person⟩
 */
declare const outgoing: StepFunction<'out'>;
/**
 * `from<-edge<-?`: the records on the relation's `in` side whose edges
 * lead to `from`, a record of a table the relation accepts as its `out`.
 *
 * @example
 * select(TeamTable).value((row) => incoming(store, row.id, 'member_of'));
 * // SELECT VALUE id<-member_of<-? FROM ⟨team⟩
 */
declare const incoming: StepFunction<'in'>;
/**
 * `from<->edge<->?`: both endpoints of every edge of `edge` at `from`, in
 * either direction. SurrealDB yields both endpoints of each edge it walks,
 * so `from` itself is in the list once per edge.
 *
 * @example
 * select(PersonTable).value((row) => both(store, row.id, 'knows'));
 * // SELECT VALUE id<->knows<->? FROM ⟨person⟩
 */
declare const both: StepFunction<'both'>;
type EdgesCodec<R> = R extends Traversal<Codec, Params, boolean, infer E> ? E : never;
/**
 * The edges a step walks (`from->member_of`), as a list of their ids,
 * honouring the step's filter: read their fields with {@link follow}
 * (`id->member_of.role`) or {@link rows}.
 *
 * @example
 * select(PersonTable).project((row) => ({
 *   roles: follow(store, edges(outgoing(store, row.id, 'member_of'))).role,
 * }));
 * // SELECT id->member_of.role AS roles FROM ⟨person⟩
 */
declare const edges: <const R extends Traversal<Codec, Params, boolean, Codec>>(traversal: [EdgesCodec<R>] extends [never] ? "only a graph step walks edges; a recursive path has none to read" : R) => Traversal<EdgesCodec<R>, ParamsOf<R>, true>;
type Element<V> = Exclude<V, undefined> extends ReadonlyArray<infer I> ? Exclude<I, undefined> : Exclude<V, undefined>;
type NodeCodec<R> = Schema.Codec<Element<CodecOf<R>['Type']>, Element<EncodedOf<R>>, never, never>;
/** The record a recursive step starts from, each time it is repeated. */
type Node<R> = Expr<NodeCodec<R>, NoParams>;
type ItemOfTraversal<T> = CodecOf<T>['Encoded'] extends infer E ? Exclude<E, undefined> extends ReadonlyArray<unknown> ? CodecOf<T> extends Schema.$Array<infer I> ? I : CodecOf<T> extends Schema.UndefinedOr<Schema.$Array<infer I>> ? I : never : never : never;
/** Why recursion cannot start from `R`, or `never`. */
type RecursionStart<R> = IsList<EncodedOf<R>> extends true ? 'a recursive path starts from one record: `row.id`, a record link or a binding' : [LinkTables<EncodedOf<R>>] extends [never] ? 'a recursive path starts from a record id: `row.id`, a record link or a binding' : R;
/** The step a recursive path repeats, when it leads back to the table it starts from. */
type RecursionStep<R, T> = T extends Traversal<Codec, Params, boolean, Codec> ? [
    Exclude<LinkTables<EncodedOfCodec<ItemOfTraversal<T>>>, LinkTables<EncodedOf<R>>>
] extends [never] ? T : 'a recursive path repeats a step that leads back to the table it starts from' : 'a recursive path repeats a graph step from the node it is given, like `(node) => outgoing(store, node, "knows")`';
/** What a recursive path from `R` repeating `T` yields. */
type RecursionResult<R, T, Optional extends boolean = false, Extra extends Params = NoParams> = Traversal<Optional extends true ? Schema.UndefinedOr<Schema.$Array<AsCodec<ItemOfTraversal<T>>>> : ListOf<EncodedOf<R>, AsCodec<ItemOfTraversal<T>>>, ParamsOf<R> & ParamsOf<T> & Extra, PresentOf<T>>;
/** A bounded depth range: at least `min` steps and at most `max`. */
interface Depth {
    readonly min: number;
    readonly max: number;
}
/**
 * `from.{min..max}(step)`: repeats `step` from `from`, at least `min` and at
 * most `max` times, and yields the records the last repetition reached, as
 * one flat list (duplicates kept). SurrealDB stops early where a
 * repetition reaches no record, keeping the records of the last one that
 * did, and yields an empty list when fewer than `min` repetitions reach
 * any. `step` must lead back to the table `from` is of.
 *
 * @example
 * select(PersonTable).value((row) =>
 *   recurse(row.id, { min: 1, max: 3 }, (node) => outgoing(store, node, 'knows')),
 * );
 * // SELECT VALUE id.{1..3}(->knows->?) FROM ⟨person⟩
 */
declare const recurse: <const R extends Expr, const T>(from: RecursionStart<R>, depth: Depth, repeat: (node: Node<R>) => RecursionStep<R, T>) => RecursionResult<R, T>;
/** Options of {@link collect}. */
interface CollectOptions {
    /** The least number of steps before records are collected (default 1). */
    readonly min?: number;
    /** The greatest number of steps (default: until no record is reached, at most 256). */
    readonly max?: number;
    /** Collect `from` too (`+inclusive`). */
    readonly inclusive?: boolean;
}
/**
 * `from.{..+collect}(step)`: every distinct record `step` reaches when
 * repeated from `from`, once each, as one flat list (`+inclusive` adds
 * `from`). `step` must lead back to the table `from` is of.
 *
 * @example
 * select(PersonTable).value((row) =>
 *   collect(row.id, (node) => outgoing(store, node, 'knows')),
 * );
 * // SELECT VALUE id.{..+collect}(->knows->?) FROM ⟨person⟩
 */
declare const collect: <const R extends Expr, const T>(from: RecursionStart<R>, repeat: (node: Node<R>) => RecursionStep<R, T>, options?: CollectOptions) => RecursionResult<R, T>;
/** Why `to` cannot be the target of a shortest path from `R` along `T`, or `never`. */
type ShortestTarget<R, To> = [LinkTables<EncodedOf<To>>] extends [never] ? 'a shortest path leads to a record id: a binding or a constant' : IsList<EncodedOf<To>> extends true ? 'a shortest path leads to one record' : [
    Exclude<LinkTables<EncodedOf<To>>, LinkTables<EncodedOf<R>>>
] extends [never] ? To : 'a shortest path leads to a record of the table it starts from';
/**
 * `from.{..+shortest=to}(step)`: the records of a shortest path from `from`
 * to `to` repeating `step`, `to` last and `from` left out unless
 * `inclusive`, or NONE when `to` cannot be reached.
 *
 * @example
 * select(PersonTable, param('from', PersonId)).only().value((row) =>
 *   shortest(row.id, param('to', PersonId), (node) => outgoing(store, node, 'knows')),
 * );
 * // SELECT VALUE id.{..+shortest=$to}(->knows->?) FROM ONLY $from
 */
declare const shortest: <const R extends Expr, const To extends Expr, const T>(from: RecursionStart<R>, to: ShortestTarget<R, To>, repeat: (node: Node<R>) => RecursionStep<R, T>, options?: {
    readonly inclusive?: boolean;
}) => RecursionResult<R, T, true, ParamsOf<To>>;

/**
 * `FETCH`: a select's record links replaced by the records they point at.
 *
 * A path names a field of what the select returns (the stored row, or the
 * projection's aliases), dot-separated through objects and fetched records
 * (`manager`, `manager.team`). Its type changes from a record id to the
 * target's row; through a list of links to a list of rows. SurrealDB 3.3
 * and 4.0 answer NONE for a link whose record is missing or the session
 * may not read, so a fetched link may be absent and each record in a
 * fetched list may be NONE.
 */

type Split$1<P extends string> = P extends `${infer H}.${infer R}` ? readonly [H, ...Split$1<R>] : readonly [P];
type Defined<V> = Exclude<V, undefined>;
/** The link type at a value: one id, or the id of each element of a list. */
type LinkOf<V> = [Defined<V>] extends [never] ? never : [Defined<V>] extends [RecordId] ? Defined<V> : Defined<V> extends ReadonlyArray<infer I> ? [Defined<I>] extends [never] ? never : [Defined<I>] extends [RecordId] ? Defined<I> : never : never;
type TableNames<S> = S extends {
    readonly tables: infer M;
} ? keyof M : never;
/** The row type of every table a link of type `V` can point at. */
type FetchTarget<S, V> = TableIn<S, LinkTables<V>> extends infer T ? T extends {
    readonly select: {
        readonly Type: infer X;
    };
} ? X : never : never;
/** The object a path walks into: through lists of objects too. */
type Container<V> = Defined<V> extends ReadonlyArray<infer I> ? Container<I> : Defined<V>;
type Problem<V, Segs, Path extends string, S> = Segs extends readonly [
    infer H extends string,
    ...infer R extends ReadonlyArray<string>
] ? Container<V> extends infer O ? [O] extends [object] ? H extends keyof O ? ProblemAt<O[H], R, Path, S> : NoField<Path, H> : NoField<Path, H> : never : never;
type NoField<Path extends string, H extends string> = Path extends H ? `\`${H}\` is not a field of what the select returns` : `\`${Path}\`: \`${H}\` is not a field of what the select returns`;
type ProblemAt<X, R, Path extends string, S> = [LinkOf<X>] extends [never] ? R extends readonly [] ? `\`${Path}\` is not a record link, so FETCH has nothing to replace` : Problem<X, R, Path, S> : string extends LinkTables<LinkOf<X>> ? `\`${Path}\` can point at any table (\`record\`), so FETCH has no row type for it` : [Exclude<LinkTables<LinkOf<X>>, TableNames<S>>] extends [never] ? R extends readonly [] ? never : Problem<FetchTarget<S, LinkOf<X>>, R, Path, S> : `\`${Path}\` points at \`${Exclude<LinkTables<LinkOf<X>>, TableNames<S>> & string}\`, which is not a table of this store`;
/** Why `Path` cannot be fetched from rows of type `T`, or `never`. */
type FetchProblem<T, Path extends string, S> = Problem<T, Split$1<Path>, Path, S>;
/** The paths as the caller wrote them, each checked: a wrong one is a message. */
type CheckedFetch<T, S, Paths extends ReadonlyArray<string>> = {
    readonly [I in keyof Paths]: Paths[I] extends string ? [FetchProblem<T, Paths[I], S>] extends [never] ? Paths[I] : FetchProblem<T, Paths[I], S> : Paths[I];
};
type FetchIn<T, Segs, S> = Segs extends readonly [
    infer H extends string,
    ...infer R extends ReadonlyArray<string>
] ? T extends ReadonlyArray<infer I> ? ReadonlyArray<FetchIn<I, Segs, S>> : T extends RecordId ? T : T extends object ? H extends keyof T ? FetchKey<T, H, R, S> : T : T : T;
type IsLink<V> = [Defined<V>] extends [never] ? false : [Defined<V>] extends [RecordId] ? true : false;
type FetchKey<T, H extends keyof T, R, S> = IsLink<T[H]> extends true ? Simplify<{
    readonly [K in keyof T as K extends H ? never : K]: T[K];
} & {
    readonly [K in H]?: FetchLink<Defined<T[H]>, R, S> | undefined;
}> : {
    readonly [K in keyof T]: K extends H ? FetchValue<T[K], R, S> : T[K];
};
type FetchValue<V, R, S> = V extends undefined ? V : V extends ReadonlyArray<infer I> ? IsLink<I> extends true ? ReadonlyArray<FetchLink<Defined<I>, R, S> | undefined> : ReadonlyArray<FetchIn<I, R, S>> : FetchIn<V, R, S>;
type FetchLink<V, R, S> = R extends readonly [] ? FetchTarget<S, V> : FetchIn<FetchTarget<S, V>, R, S>;
type FetchAll<T, Paths, S> = Paths extends readonly [
    infer P extends string,
    ...infer Rest
] ? FetchAll<FetchIn<T, Split$1<P>, S>, Rest, S> : T;
/** The row codec of a select after `FETCH` of `Paths`. */
type Fetched<Row extends Codec, S, Paths> = Schema.Codec<FetchAll<Row['Type'], Paths, S>, unknown, never, never>;

/**
 * `GROUP BY` and `GROUP ALL` with typed aggregates.
 *
 * In a grouped `SELECT` a stored field yields one value per record of the
 * group, so SurrealDB answers a field that is neither grouped nor
 * aggregated with the array of the group's values (3.3 and 4.0), and
 * refuses a group key the projection leaves out. Here the group keys are
 * always projected, and the aggregate callback gets the stored row as
 * {@link RowValue}s: values only aggregates take, so projecting a field
 * that is neither grouped nor aggregated is a compile error.
 *
 * Each aggregate's codec follows what SurrealDB 3.3 and 4.0 return,
 * including for a group with no value (every value NONE, or `GROUP ALL`
 * over no record): `math::min` and `math::max` are then ±Infinity,
 * `math::mean`, `math::stddev` and `math::variance` NaN, `math::sum` the
 * int 0, and `math::median`, `time::min` and `time::max` NONE. Over a field
 * that may hold a decimal, `math::stddev` and `math::variance` are a decimal
 * or a number (one record spreads by the int 0) and `math::median` the
 * middle decimal or a float of the two middle values; `math::mean` is a
 * float whatever the field (`test/conformance.test.ts` and
 * `test/aggregates-engine.test.ts` pin every case).
 */

declare const RowValueTypeId = "~effect-surrealkit/RowValue";
/**
 * A stored field of a grouped row: what an aggregate reads. It is not an
 * expression, so it cannot be projected or compared, only aggregated. `S` is
 * the field's codec, `O` whether a record may hold NONE there, and `A`
 * whether the group may be empty (`GROUP ALL`).
 */
interface RowValue<S extends Codec = Codec, O extends boolean = boolean, A extends boolean = boolean> {
    readonly [RowValueTypeId]: {
        readonly codec: S;
        readonly sql: string;
        readonly optional: O;
        readonly all: A;
    };
}
/** One {@link RowValue} per field of a row schema, with its children. */
type GroupRowOf<F, O extends boolean, A extends boolean> = {
    readonly [K in keyof F & string]: RowValue<Unwrapped$2<F[K]> & Codec, O extends true ? true : IsOptional$2<F[K]>, A> & ([NestedFields<Unwrapped$2<F[K]>>] extends [never] ? unknown : GroupRowOf<NestedFields<Unwrapped$2<F[K]>>, O extends true ? true : IsOptional$2<F[K]>, A>);
};
/** The grouped row of table `T`: its stored fields as aggregates read them. */
type GroupRow<T extends PureTable, A extends boolean> = GroupRowOf<FieldsOf$1<T['select']>, false, A>;
/** The codec of a field's value, from its row value. */
type CodecOfValue<V> = V extends RowValue<infer S, boolean, boolean> ? S : never;
/** The group may have no value of `V`: it may be NONE, or the group empty. */
type MayBeEmpty<V> = V extends RowValue<Codec, infer O, infer A> ? O extends true ? true : A : never;
/** `V` when its stored type is `Ok`; otherwise `Message`. */
type Taking<V, Ok, Message extends string> = V extends RowValue ? [CodecOfValue<V>['Encoded']] extends [Ok] ? V : Message : 'an aggregate takes a field of the grouped row';
type Aggregate<S extends Codec> = Expr<S, NoParams>;
/** `count()`: the records of the group; `count(field)`: those where a bool field holds. */
declare function count(): Aggregate<typeof Int>;
declare function count<V extends RowValue>(value: Taking<V, boolean, '`count` takes a bool field, or nothing'>): Aggregate<typeof Int>;
/** What `math::sum` returns for values of codec `S`. */
type SumCodec<S extends Codec, E> = [S['Encoded']] extends [number] ? typeof Float : [S['Encoded']] extends [number | bigint] ? typeof Int64 : [S['Encoded']] extends [Decimal] ? E extends true ? Schema.Union<readonly [typeof Decimal$1, typeof Int]> : typeof Decimal$1 : typeof SurrealNumber;
type NumberField = number | bigint | Decimal;
/** `math::sum(field)`: the sum of a number field over the group (0 for none). */
declare const sum: <V extends RowValue>(value: Taking<V, NumberField, "`math::sum` takes a number field">) => Aggregate<SumCodec<CodecOfValue<V>, MayBeEmpty<V>>>;
/** `math::mean(field)`: a float whatever the field, NaN for a group with no value. */
declare const mean: <V extends RowValue>(value: Taking<V, NumberField, "`math::mean` takes a number field">) => Aggregate<typeof Float>;
/**
 * What `math::stddev` and `math::variance` return over values of codec `S`:
 * a float, or a float or a decimal when `S` may hold a decimal.
 */
type SpreadCodec<S extends Codec> = FloatOrDecimalOf<S['Encoded']>;
/**
 * `math::stddev(field)`: a float, or for a field that may hold a decimal a
 * decimal or a number; NaN for a group with no value.
 */
declare const stddev: <V extends RowValue>(value: Taking<V, NumberField, "`math::stddev` takes a number field">) => Aggregate<FloatOrDecimalOf<CodecOfValue<V>["Encoded"]>>;
/** `math::variance(field)`: as {@link stddev}. */
declare const variance: <V extends RowValue>(value: Taking<V, NumberField, "`math::variance` takes a number field">) => Aggregate<FloatOrDecimalOf<CodecOfValue<V>["Encoded"]>>;
/**
 * What `math::median` returns over values of codec `S`: as
 * {@link SpreadCodec}, or NONE for a group with no value when `E`.
 */
type MedianCodec<S extends Codec, E> = E extends true ? Schema.UndefinedOr<SpreadCodec<S>> : SpreadCodec<S>;
/**
 * `math::median(field)`: the middle value, or the mean of the two middle
 * ones (a float); for a field that may hold a decimal a decimal or a
 * number. NONE for a group with no value.
 */
declare const median: <V extends RowValue>(value: Taking<V, NumberField, "`math::median` takes a number field">) => Aggregate<MedianCodec<CodecOfValue<V>, MayBeEmpty<V>>>;
/** What `math::min` and `math::max` return: the field's value, or ±Infinity for none. */
type ExtremeCodec<S extends Codec, E> = E extends true ? Schema.Union<readonly [S, typeof Float]> : S;
/** `math::min(field)`: the least value, Infinity for a group with no value. */
declare const min: <V extends RowValue>(value: Taking<V, NumberField, "`math::min` takes a number field">) => Aggregate<ExtremeCodec<CodecOfValue<V>, MayBeEmpty<V>>>;
/** `math::max(field)`: the greatest value, -Infinity for a group with no value. */
declare const max: <V extends RowValue>(value: Taking<V, NumberField, "`math::max` takes a number field">) => Aggregate<ExtremeCodec<CodecOfValue<V>, MayBeEmpty<V>>>;
/** What `time::min` and `time::max` return: the field's value, or NONE for none. */
type TimeCodec<S extends Codec, E> = E extends true ? Schema.UndefinedOr<S> : S;
/** `time::min(field)`: the earliest datetime, NONE for a group with no value. */
declare const timeMin: <V extends RowValue>(value: Taking<V, DateTime$1, "`time::min` takes a datetime field">) => Aggregate<TimeCodec<CodecOfValue<V>, MayBeEmpty<V>>>;
/** `time::max(field)`: the latest datetime, NONE for a group with no value. */
declare const timeMax: <V extends RowValue>(value: Taking<V, DateTime$1, "`time::max` takes a datetime field">) => Aggregate<TimeCodec<CodecOfValue<V>, MayBeEmpty<V>>>;
/** What `array::group` and `array::distinct` return: the distinct values. */
type DistinctCodec<V> = Schema.$Array<V extends RowValue<infer S, infer O, boolean> ? O extends true ? OrNone<S> : S : never>;
type ScalarValue<V> = V extends RowValue ? [CodecOfValue<V>['Encoded']] extends [
    ReadonlyArray<unknown> | ReadonlySet<unknown>
] ? 'this aggregate takes a field that is not an array: SurrealDB 4 flattens the arrays of a group and 3.3 does not' : V : 'an aggregate takes a field of the grouped row';
/**
 * `array::group(field)`: the distinct values of a field that is not an
 * array. A record that holds NONE contributes NONE (once on SurrealDB 4, once
 * per record on 3.3).
 */
declare const arrayGroup: <V extends RowValue>(value: ScalarValue<V>) => Aggregate<DistinctCodec<V>>;
/** `array::distinct(field)`: the distinct values, as {@link arrayGroup}. */
declare const arrayDistinct: <V extends RowValue>(value: ScalarValue<V>) => Aggregate<DistinctCodec<V>>;
/** A group key as its callback returned it: a field path, or a message. */
type CheckedKeys<K> = {
    readonly [A in keyof K]: K[A] extends Path ? K[A] : 'GROUP BY takes a field path of the row, like `row.role` or `row.address.city`';
};
/**
 * Aggregates as their callback returned them, `F`, checked against the group
 * keys `K`: each an expression (an aggregate, or a constant), with an alias
 * no key has. A field of the grouped row is neither grouped nor aggregated.
 */
type CheckedAggregates<F, K> = {
    readonly [A in keyof F]: A extends keyof K ? `\`${A & string}\` is already a key of this GROUP BY` : F[A] extends Expr ? F[A] : F[A] extends RowValue ? `\`${A & string}\` is a field that is neither grouped nor aggregated: group by it, or aggregate it (count, sum, …)` : 'an aggregate is an expression: inline a constant with `literal`';
};
/** What a grouped `SELECT` returns: a row per group, or one for `GROUP ALL`. */
type GroupResult<Row extends Codec, All extends boolean> = All extends true ? Schema.Tuple<readonly [Row]> : Schema.$Array<Row>;
/** A grouped `SELECT` with its output row `O` decided. */
interface GroupedSelect<T extends PureTable, P extends Params, O, All extends boolean> {
    /**
     * `ORDER BY` an alias of the output: a group key or an aggregate (the
     * stored row is gone once records are grouped).
     */
    readonly orderBy: <const A extends string>(alias: A extends keyof O ? A : `\`${A}\` is not a group key or an aggregate of this SELECT`, direction?: 'ASC' | 'DESC') => GroupedSelect<T, P, O, All>;
    /** `LIMIT`: at most this many groups. */
    readonly limit: (rows: number) => GroupedSelect<T, P, O, All>;
    /** `START`: skip this many groups. */
    readonly start: (rows: number) => GroupedSelect<T, P, O, All>;
    /** The finished statement. */
    readonly build: (name?: string, options?: {
        readonly writes?: boolean;
    }) => Statement<Simplify<P>, GroupResult<ProjectedCodec<O>, All>>;
}
/** A `SELECT … GROUP BY` whose keys are set; add aggregates, or build. */
interface Grouped<T extends PureTable, P extends Params, K> extends GroupedSelect<T, P, K, false> {
    /** The aggregates of each group, beside its keys. */
    readonly aggregate: <const F>(fields: (row: GroupRow<T, false>) => CheckedAggregates<F, K>) => GroupedSelect<T, P & ParamsOfAll<F[keyof F]>, K & F, false>;
}
/** A `SELECT … GROUP ALL`: one group of every record; add its aggregates. */
interface GroupAll<T extends PureTable, P extends Params> {
    /** The aggregates of the one group. */
    readonly aggregate: <const F>(fields: (row: GroupRow<T, true>) => CheckedAggregates<F, NoParams>) => GroupedSelect<T, P & ParamsOfAll<F[keyof F]>, F, true>;
}

/**
 * Record ids and id ranges built from their key parts.
 *
 * `recordId(table, key)` is `type::record("table", key)`, the key a single
 * part, an array of parts (an array key) or an object of parts (an object
 * key), every part a binding or a constant. `idRange(table, bounds)` is
 * `type::record("table", from..=to)`: the rows whose ids fall between two
 * keys, either of which may be left open. SurrealDB 3.3 and 4.0 parse no
 * binding as a scalar key in a record id or range literal (`t:$k`,
 * `t:$a..$b`), and address the records by key through `type::record`
 * (`test/conformance.test.ts` pins both). Parts are checked against the
 * key the table's id codec declares, so a returned id decodes with it.
 */

/** The codec of the key a table's id codec declares (`RecordIdFor(t, { key })`). */
type KeyCodecOf<T extends PureTable> = T['id'] extends {
    readonly '~type.parameters': readonly [infer K extends Codec];
} ? K : Codec;
/** The stored (encoded) key of a record of `T`. */
type RecordKeyOf<T extends PureTable> = KeyCodecOf<T>['Encoded'];
/** One part of a key: an expression, or a constant to inline. */
type KeyPart = Expr | Primitive;
/** A key as its parts: one part, an array of parts or an object of parts. */
type KeyParts = KeyPart | readonly [KeyPart, ...ReadonlyArray<KeyPart>] | {
    readonly [part: string]: KeyPart;
};
type IsPart<V> = V extends Expr ? true : V extends Primitive ? true : false;
type PartFits<V, K> = [OperandEncoded<V>] extends [K] ? true : false;
type ElementAt<KA, I> = I extends keyof KA ? KA[I] : KA extends ReadonlyArray<infer E> ? E : never;
/** The positions of `V` whose part is not what the array key holds there. */
type BadPositions<V extends ReadonlyArray<unknown>, KA> = {
    [I in keyof V]: I extends `${number}` ? IsPart<V[I]> extends true ? PartFits<V[I], ElementAt<KA, I>> extends true ? never : I : I : never;
}[number];
type CheckArray<KA, V extends ReadonlyArray<unknown>, Table extends string> = [
    KA
] extends [never] ? `the key of \`${Table}\` is not an array` : KA extends ReadonlyArray<unknown> ? number extends KA['length'] ? [BadPositions<V, KA>] extends [never] ? V : `the part at index ${BadPositions<V, KA> & string} of this key is not what a key of \`${Table}\` holds there` : V['length'] extends KA['length'] ? [BadPositions<V, KA>] extends [never] ? V : `the part at index ${BadPositions<V, KA> & string} of this key is not what a key of \`${Table}\` holds there` : `a key of \`${Table}\` has ${KA['length']} parts, not ${V['length']}` : never;
type RequiredKeys<A> = {
    [K in keyof A]-?: Record<never, never> extends Pick<A, K> ? never : K;
}[keyof A];
type CheckObject<KO, V, Table extends string> = [KO] extends [never] ? `the key of \`${Table}\` is not an object` : string extends keyof KO ? [
    {
        [P in keyof V]-?: PartFits<V[P], KO[keyof KO]> extends true ? never : P;
    }[keyof V]
] extends [never] ? V : `this key holds a part a key of \`${Table}\` does not` : [Exclude<RequiredKeys<KO>, keyof V>] extends [never] ? [Exclude<keyof V, keyof KO>] extends [never] ? [
    {
        [P in keyof V & keyof KO]-?: IsPart<V[P]> extends true ? PartFits<V[P], KO[P]> extends true ? never : P : P;
    }[keyof V & keyof KO]
] extends [never] ? V : `\`${{
    [P in keyof V & keyof KO]-?: IsPart<V[P]> extends true ? PartFits<V[P], KO[P]> extends true ? never : P : P;
}[keyof V & keyof KO] & string}\` is not what a key of \`${Table}\` holds there` : `\`${Exclude<keyof V, keyof KO> & string}\` is not part of a key of \`${Table}\`` : `a key of \`${Table}\` also needs \`${Exclude<RequiredKeys<KO>, keyof V> & string}\``;
/**
 * `V`, the key of a record of `T` as its parts, when every part is what the
 * table's key holds there; otherwise a message naming what does not fit.
 */
type CheckedKey<T extends PureTable, V> = IsPart<V> extends true ? PartFits<V, RecordKeyOf<T>> extends true ? V : `this is not a key of \`${T['name']}\`` : V extends ReadonlyArray<unknown> ? CheckArray<Extract<RecordKeyOf<T>, ReadonlyArray<unknown>>, V, T['name']> : CheckObject<Extract<RecordKeyOf<T>, Record<string, unknown>>, V, T['name']>;
/** The bindings the parts of a key read. */
type KeyParams<V> = [V] extends [never] ? Record<never, never> : V extends Expr ? ParamsOfAll<V> : V extends ReadonlyArray<unknown> ? ParamsOfAll<V[number]> : V extends Primitive ? Record<never, never> : ParamsOfAll<V[keyof V]>;
/**
 * A record id of `table` built from its key: one part, an array of parts
 * (an array key, `[param('city', String), param('at', DateTime)]`) or an
 * object of parts (an object key), each a binding or a constant. Every part
 * must be what the table's id codec declares for that position, and the id
 * decodes with that codec. It is a record id expression of the table, so it
 * is the subject `select`, `create`, `update` and `deleteFrom` take, and a
 * `relate` endpoint.
 *
 * @example
 * const reading = select(ReadingTable, recordId(ReadingTable, [
 *   param('city', SurrealSchema.String),
 *   param('at', SurrealSchema.DateTime),
 * ])).only().build();
 * // SELECT * FROM ONLY type::record(s"reading", [$city, $at]);
 */
declare const recordId: <T extends PureTable, const V extends KeyParts>(table: T, key: CheckedKey<T, V>) => Expr<T["id"], KeyParams<V>>;
declare const IdRangeTypeId = "~effect-surrealkit/IdRange";
/**
 * The records of table `Name` whose ids fall between two keys, reading the
 * bindings `P`: a `select` subject.
 */
interface IdRange<Name extends string = string, P extends Params = Params> {
    readonly [IdRangeTypeId]: {
        readonly table: Name;
        readonly sql: string;
        readonly params: P;
        /** The expressions its bounds are built from. @internal */
        readonly parts?: ReadonlyArray<Expr>;
    };
}
/** Whether `value` is an id range. */
declare const isIdRange: (value: unknown) => value is IdRange;
/**
 * The bounds of an id range: a start (`from`, included, or `after`,
 * excluded) and an end (`to`, excluded as SurrealQL's `..` excludes it, or
 * `through`, included), each optional; a range with neither is every record.
 */
interface RangeBounds {
    readonly from?: KeyParts;
    readonly after?: KeyParts;
    readonly to?: KeyParts;
    readonly through?: KeyParts;
}
type BoundOf<R, K extends keyof RangeBounds> = K extends keyof R ? R[K] : never;
/** What is wrong with the bound `K` of `R`, or `never`. */
type BoundProblem<T extends PureTable, R, K extends keyof RangeBounds> = [
    BoundOf<R, K>
] extends [never] ? never : [BoundOf<R, K>] extends [CheckedKey<T, BoundOf<R, K>>] ? never : `\`${K}\`: ${CheckedKey<T, BoundOf<R, K>> & string}`;
/**
 * `R` when it is the bounds of a range of `T`: at most one start and one
 * end, each a key of the table as its parts; otherwise a message.
 */
type CheckedRange<T extends PureTable, R> = 'from' extends keyof R ? 'after' extends keyof R ? 'a range starts `from` a key (included) or `after` one (excluded), not both' : CheckedEnd<T, R> : CheckedEnd<T, R>;
type CheckedEnd<T extends PureTable, R> = 'to' extends keyof R ? 'through' extends keyof R ? 'a range ends `to` a key (excluded) or `through` one (included), not both' : CheckedBounds<T, R> : CheckedBounds<T, R>;
type CheckedBounds<T extends PureTable, R> = [
    BoundProblem<T, R, 'from'>
] extends [never] ? [BoundProblem<T, R, 'after'>] extends [never] ? [BoundProblem<T, R, 'to'>] extends [never] ? [BoundProblem<T, R, 'through'>] extends [never] ? R : BoundProblem<T, R, 'through'> : BoundProblem<T, R, 'to'> : BoundProblem<T, R, 'after'> : BoundProblem<T, R, 'from'>;
/** The bindings the bounds of a range read. */
type RangeParams<R> = KeyParams<BoundOf<R, 'from'>> & KeyParams<BoundOf<R, 'after'>> & KeyParams<BoundOf<R, 'to'>> & KeyParams<BoundOf<R, 'through'>>;
/**
 * The records of `table` whose ids fall between two keys, as a `select`
 * subject that reads many rows: `{ from, through }` is `from..=through`,
 * `{ from, to }` is `from..to`, `{ after }` is `after>..`, and a side left
 * out is open. Each bound is a key of the table as its parts, as
 * {@link recordId} takes it.
 *
 * @example
 * const week = select(ReadingTable, idRange(ReadingTable, {
 *   from: [param('city', SurrealSchema.String), param('start', SurrealSchema.DateTime)],
 *   to: [param('city', SurrealSchema.String), param('end', SurrealSchema.DateTime)],
 * })).build();
 * // SELECT * FROM type::record(s"reading", [$city, $start]..[$city, $end]);
 */
declare const idRange: <T extends PureTable, const R extends RangeBounds>(table: T, bounds: CheckedRange<T, R>) => IdRange<T["name"], RangeParams<R>>;

/** Renames variables outside strings, comments and quoted identifiers when safe. */
declare const renameNames: (sql: string, names: Readonly<Record<string, string>>) => string | undefined;

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
/** The names a row of `Row` holds, which ORDER BY can name as aliases. */
type OrderAlias<Row extends Codec> = Row extends SelectValueRow ? never : Row['Type'] extends ReadonlyArray<unknown> | RecordIdLike ? never : Row['Type'] extends object ? keyof Row['Type'] & string : never;
type RecordIdLike = {
    readonly table: unknown;
    readonly id: unknown;
};
/**
 * Marks, for the compiler only, the row codec of a `SELECT VALUE`: its value
 * may be an object, but it has no names `orderByAlias` could sort by.
 */
interface SelectValueRow {
    readonly '~effect-surrealkit/SelectValue': true;
}
/** The indexes a descriptor lists, by name. */
type IndexesOf$1<T> = T extends {
    readonly indexes: infer I;
} ? I : Record<never, never>;
/** A column path as a lookup key: its segments joined by `.`. */
type ColumnKey<C> = C extends readonly [infer H extends string] ? H : C extends readonly [
    infer H extends string,
    ...infer R extends ReadonlyArray<string>
] ? `${H}.${ColumnKey<R>}` : never;
/** Each column of an index, by its lookup key. */
type ColumnsOf<I> = I extends {
    readonly columns: infer C extends ReadonlyArray<ReadonlyArray<string>>;
} ? {
    readonly [P in C[number] as ColumnKey<P>]: P;
} : never;
/** The expression at a column path of the row. */
type ExprAt<R, P> = P extends readonly [
    infer H extends string,
    ...infer Rest extends ReadonlyArray<string>
] ? H extends keyof R ? Rest extends readonly [] ? R[H] : ExprAt<R[H], Rest> : never : never;
/**
 * The index fields whose path the row of `T` does not expose: a segment
 * under a field that is not one object (a union of objects, a nullable
 * object), which the run-time lookup cannot resolve either.
 */
type Unaddressable<T extends PureTable, C> = {
    [K in keyof C]-?: [ExprAt<RowExprs<T>, C[K]>] extends [never] ? K : never;
}[keyof C] & string;
/**
 * `N`, when it names a unique index of `T` over field paths; otherwise a
 * message saying why it cannot be looked up by.
 */
type UniqueIndex<T extends PureTable, N> = N extends keyof IndexesOf$1<T> ? IndexesOf$1<T>[N] extends {
    readonly type: 'unique';
} ? [
    Extract<keyof ColumnsOf<IndexesOf$1<T>[N]>, `${string}*${string}`>
] extends [never] ? [Unaddressable<T, ColumnsOf<IndexesOf$1<T>[N]>>] extends [never] ? N : `\`${Unaddressable<T, ColumnsOf<IndexesOf$1<T>[N]>>}\` of the unique index \`${N & string}\` is no field path of \`${T['name']}\` a lookup can read: a field on it is not one object (a union or a nullable object has no fields to address)` : `\`${N & string}\` indexes array elements, which a unique lookup cannot address` : `\`${N & string}\` is a ${IndexesOf$1<T>[N] extends {
    readonly type: infer K extends string;
} ? K : 'non-unique'} index of \`${T['name']}\`, not a unique one` : `\`${T['name']}\` has no index \`${N & string}\``;
/** The index fields whose value never compares with what `V` gives. */
type Mismatched<T extends PureTable, C, V> = {
    [K in keyof C & keyof V]-?: Comparable<CodecOf<ExprAt<RowExprs<T>, C[K]>>['Encoded'], OperandEncoded<V[K]>, true> extends true ? never : K;
}[keyof C & keyof V] & string;
/**
 * Whether a value of stored type `E` may be an array (`true`), may be
 * another kind (`false`), or either (`boolean`); NONE and NULL count as
 * neither. A set is not an array.
 */
type MayBeArray<E> = unknown extends E ? boolean : Exclude<E, undefined | null> extends infer X ? [X] extends [never] ? never : [X] extends [ReadonlyArray<unknown>] ? true : [Extract<X, ReadonlyArray<unknown>>] extends [never] ? false : boolean : never;
/**
 * The index fields that may hold an array or another kind and are looked up
 * by a value that may be an array: SurrealDB 3.3 finds no array through a
 * unique index on such a field, and 4.0 does.
 */
type AmbiguousArray<T extends PureTable, C, V> = {
    [K in keyof C & keyof V]-?: boolean extends MayBeArray<CodecOf<ExprAt<RowExprs<T>, C[K]>>['Encoded']> ? true extends MayBeArray<OperandEncoded<V[K]>> ? K : never : never;
}[keyof C & keyof V] & string;
/**
 * The values `V` of a lookup by the unique index `N`, when they are exactly
 * one operand per field of the index (its path joined by `.`, like
 * `profile.bio`) and each compares with its field; otherwise a message
 * naming the first field that does not fit. An unknown index is reported
 * on the index itself.
 */
type UniqueValues<T extends PureTable, N, V> = N extends keyof IndexesOf$1<T> ? [Exclude<keyof ColumnsOf<IndexesOf$1<T>[N]>, keyof V>] extends [never] ? [Exclude<keyof V, keyof ColumnsOf<IndexesOf$1<T>[N]>>] extends [never] ? [Mismatched<T, ColumnsOf<IndexesOf$1<T>[N]>, V>] extends [never] ? [AmbiguousArray<T, ColumnsOf<IndexesOf$1<T>[N]>, V>] extends [
    never
] ? V : `\`${AmbiguousArray<T, ColumnsOf<IndexesOf$1<T>[N]>, V>}\` may hold an array or another kind, and SurrealDB 3.3 finds no array through its unique index (4.0 does): look it up by a value that is not an array, or declare it an array kind only` : `\`${Mismatched<T, ColumnsOf<IndexesOf$1<T>[N]>, V>}\` never compares with this value: their stored types do not overlap` : `\`${Exclude<keyof V, keyof ColumnsOf<IndexesOf$1<T>[N]>> & string}\` is not a field of the unique index \`${N & string}\`` : `the unique index \`${N & string}\` also needs \`${Exclude<keyof ColumnsOf<IndexesOf$1<T>[N]>, keyof V> & string}\`` : V;
/** The fields of the stored row of `T`. */
type SelectFields<T extends PureTable> = FieldsOf$1<T['select']>;
type AsFields<F> = F extends Schema.Struct.Fields ? F : never;
/** A row schema like `S` (closed or open) over the fields `F`. */
type RebuiltRow<S, F> = S extends Schema.StructWithRest<Schema.Struct<Schema.Struct.Fields>, infer R> ? Schema.StructWithRest<Schema.Struct<AsFields<F>>, R> : Schema.Struct<AsFields<F>>;
/** Field names as the caller wrote them, `K`, each a field of `T`, or a message. */
type CheckedOmit<T extends PureTable, K extends ReadonlyArray<string>> = {
    readonly [I in keyof K]: K[I] extends keyof SelectFields<T> ? K[I] : `\`${K[I] & string}\` is not a field of \`${T['name']}\``;
};
/** The row schema `S` without the top-level fields `K`. */
type OmittedRow<S extends RowCodecIn, K extends PropertyKey> = RebuiltRow<S, Omit<FieldsOf$1<S>, K>>;
/** The array fields of the stored row of `T`: what SPLIT takes. */
type ArrayFields<T extends PureTable> = {
    [K in keyof SelectFields<T>]: [
        ItemOf<Unwrapped$2<SelectFields<T>[K]> & Codec>
    ] extends [never] ? never : K;
}[keyof SelectFields<T>] & string;
/** `K` when it is an array field of `T`; otherwise a message. */
type SplitField<T extends PureTable, K> = K extends ArrayFields<T> ? K : `\`${K & string}\` is not an array field of \`${T['name']}\`: SPLIT takes one`;
/**
 * A split field: one element per row, or the array itself when it is empty
 * (SurrealDB 3.3 and 4.0 keep a record whose array is empty, unsplit).
 */
type SplitCodec<F> = Schema.Union<readonly [ItemOf<Unwrapped$2<F> & Codec>, Unwrapped$2<F> & Codec]>;
/** The row schema `S` with the array field `K` split. */
type SplitRow<S extends RowCodecIn, K extends string> = RebuiltRow<S, {
    readonly [F in keyof FieldsOf$1<S>]: F extends K ? IsOptional$2<FieldsOf$1<S>[F]> extends true ? Schema.optionalKey<SplitCodec<FieldsOf$1<S>[F]>> : SplitCodec<FieldsOf$1<S>[F]> : FieldsOf$1<S>[F];
}>;
/** `T` read with its array field `K` split. */
type SplitTable<T extends PureTable, K extends string> = AsTable<Omit<T, 'select'> & {
    readonly select: SplitRow<T['select'], K>;
}>;
/** `X` as a table descriptor, which it is once `T` is known. */
type AsTable<X> = X extends PureTable ? X : never;
/** A projection after SPLIT must hold the split field under its own name. */
type KeepsSplit<F, K extends string> = K extends keyof F ? unknown : {
    readonly [P in K]: `the SPLIT field \`${K}\` must be projected under its own name`;
};
/**
 * A `SELECT … SPLIT field` under construction: one row per element of the
 * array field `K`. Conditions come before SPLIT, so there is no `where`.
 */
interface Split<T extends PureTable, P extends Params, Row extends Codec, K extends string> {
    /** `OMIT`: top-level fields `SELECT *` leaves out. */
    readonly omit: <const O extends ReadonlyArray<string>>(...fields: CheckedOmit<T, O>) => Split<T, P, RowCodec<OmittedRow<T['select'], O[number]>>, K>;
    /** Adds a sort key, a field path of the split row. */
    readonly orderBy: <O>(key: (row: RowExprs<T>) => OrderKey<O>, direction?: 'ASC' | 'DESC') => Split<T, P, Row, K>;
    /** `LIMIT`: at most this many rows. */
    readonly limit: <const L extends Count>(rows: L) => Split<T, P & OperandParams<L>, Row, K>;
    /** `START`: skip this many rows. */
    readonly start: <const L extends Count>(rows: L) => Split<T, P & OperandParams<L>, Row, K>;
    /** Selects named expressions; the split field among them, under its name. */
    readonly project: <const F>(fields: (row: RowExprs<T>) => CheckedProjection<F> & KeepsSplit<F, K>) => Split<T, P & ParamsOfAll<F[keyof F]>, ProjectedCodec<F>, K>;
    /** The finished statement. */
    readonly build: (name?: string, options?: {
        readonly writes?: boolean;
    }) => Statement<Simplify<P>, Schema.$Array<Row>>;
}
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
    /**
     * Adds a sort key that is a name the result row holds: an alias of the
     * projection, such as a full-text `score(…)` or a nearest-neighbour
     * `knnDistance(…)` (`.orderByAlias('score', 'DESC')`), or a field of
     * `SELECT *`. SurrealDB 3.3 parses no function call after ORDER BY, so
     * a computed value is sorted by its alias. The name is checked again
     * when the statement is built, against what it then returns: a later
     * `project`, `value` or `omit` that drops it is refused, because
     * SurrealDB would sort by a stored field or by NONE instead.
     */
    readonly orderByAlias: <const A extends string>(alias: A extends OrderAlias<Row> ? A : `\`${A}\` is not a name the result row holds`, direction?: 'ASC' | 'DESC') => Select<T, P, Row, Only>;
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
    /**
     * `SELECT VALUE`: one expression per row instead of an object. Its rows
     * hold no names, so `orderByAlias` after it is a compile error.
     */
    readonly value: <S extends Codec, P2 extends Params>(pick: (row: RowExprs<T>) => Expr<S, P2>) => Select<T, P & P2, RowCodec<S> & SelectValueRow, Only>;
    /**
     * `FROM ONLY`: one row, or NONE when there is none. Reading from a table
     * adds `LIMIT 1`, because the engine fails `ONLY` on a second row.
     */
    readonly only: () => Select<T, P, Row, true>;
    /**
     * `OMIT`: top-level fields `SELECT *` leaves out of each row (conditions
     * and sort keys still read them).
     */
    readonly omit: <const K extends ReadonlyArray<string>>(...fields: CheckedOmit<T, K>) => Select<T, P, RowCodec<OmittedRow<T['select'], K[number]>>, Only>;
    /**
     * `SPLIT`: one row per element of an array field, which holds that
     * element in the row (the array itself when it is empty). Add conditions
     * before it.
     */
    readonly split: <const K extends string>(field: SplitField<T, K>) => Split<SplitTable<T, K>, P, StoredRow<SplitTable<T, K>>, K>;
    /**
     * `GROUP BY`: one row per distinct combination of the keys, named field
     * paths of the row (`{ role: row.role, city: row.address.city }`), which
     * every row of the result holds. Add aggregates with `.aggregate(…)`.
     */
    readonly groupBy: <const K>(keys: (row: RowExprs<T>) => CheckedKeys<K>) => Grouped<T, P, K>;
    /** `GROUP ALL`: one row of aggregates over every record. */
    readonly groupAll: () => GroupAll<T, P>;
    /**
     * `FETCH`: replaces each record link `paths` names with the record it
     * points at, found in `store` by its table. A path names a field of
     * what the select returns (the stored row, or the projection's
     * aliases), dot-separated through objects and fetched records
     * (`manager.team`). A fetched link may be absent (SurrealDB answers
     * NONE for a missing or unreadable record), and so may each record of
     * a fetched list. Call it after `project`.
     */
    readonly fetch: <S extends GraphStore, const Paths extends readonly [string, ...ReadonlyArray<string>]>(store: S, ...paths: CheckedFetch<Row['Type'], S, Paths>) => FetchedSelect<T, P, Fetched<Row, S, Paths>, Only>;
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
/** Why a method that changes what a select returns cannot follow `fetch`. */
type AfterFetch<M extends string> = `call \`${M}\` before \`fetch\`: FETCH names fields of what the select returns`;
/**
 * A `SELECT … FETCH` under construction. FETCH paths name fields of what the
 * select returns, so what changes that (a projection, `SELECT VALUE`, OMIT,
 * SPLIT, grouping) comes before `fetch`: here each is a compile error whose
 * message says so.
 */
interface FetchedSelect<T extends PureTable, P extends Params, Row extends Codec, Only extends boolean> {
    /** Adds a condition. Several `where` calls must all hold. */
    readonly where: <P2 extends Params>(predicate: (row: RowExprs<T>) => Condition<P2>) => FetchedSelect<T, P & P2, Row, Only>;
    /** Adds a sort key, a field path of the stored row. */
    readonly orderBy: <K>(key: (row: RowExprs<T>) => OrderKey<K>, direction?: 'ASC' | 'DESC') => FetchedSelect<T, P, Row, Only>;
    /** Adds a sort key that is a name the result row holds. */
    readonly orderByAlias: <const A extends string>(alias: A extends OrderAlias<Row> ? A : `\`${A}\` is not a name the result row holds`, direction?: 'ASC' | 'DESC') => FetchedSelect<T, P, Row, Only>;
    /** `LIMIT`: at most this many rows. */
    readonly limit: <const L extends Count>(rows: L) => FetchedSelect<T, P & OperandParams<L>, Row, Only>;
    /** `START`: skip this many rows. */
    readonly start: <const L extends Count>(rows: L) => FetchedSelect<T, P & OperandParams<L>, Row, Only>;
    /** `FROM ONLY`: one row, or NONE when there is none. */
    readonly only: () => FetchedSelect<T, P, Row, true>;
    /** `FETCH` more paths. */
    readonly fetch: <S extends GraphStore, const Paths extends readonly [string, ...ReadonlyArray<string>]>(store: S, ...paths: CheckedFetch<Row['Type'], S, Paths>) => FetchedSelect<T, P, Fetched<Row, S, Paths>, Only>;
    /** Refused: a projection comes before `fetch`. */
    readonly project: (fields: AfterFetch<'project'>) => never;
    /** Refused: `SELECT VALUE` takes no FETCH. */
    readonly value: (pick: AfterFetch<'value'>) => never;
    /** Refused: OMIT comes before `fetch`. */
    readonly omit: (field: AfterFetch<'omit'>) => never;
    /** Refused: SPLIT comes before `fetch`. */
    readonly split: (field: AfterFetch<'split'>) => never;
    /** Refused: grouping comes before `fetch`. */
    readonly groupBy: (keys: AfterFetch<'groupBy'>) => never;
    /** Refused: grouping comes before `fetch`. */
    readonly groupAll: (this: AfterFetch<'groupAll'>) => never;
    /** This query as a parenthesised subquery of another expression. */
    readonly toExpr: () => Expr<SelectResult<Row, Only>, P>;
    /** The finished statement, as {@link Select.build}. */
    readonly build: (name?: string, options?: {
        readonly writes?: boolean;
    }) => Statement<Simplify<P>, SelectResult<Row, Only>>;
}
/**
 * A `SELECT` of one record by id (or of an id range), before any other
 * method is called: it can also read the record `FOR UPDATE`.
 */
interface RecordSelect<T extends PureTable, P extends Params> extends Select<T, P, StoredRow<T>, false> {
    /**
     * `FOR UPDATE`: a transaction that reads the record this way fails with
     * a conflict (`StatementConflict`) when a concurrent write changes the
     * record before it commits; no lock is held (SurrealDB 3.3 and 4.0). The
     * id must be a binding or a block's local (`$name`), a literal record id
     * or a {@link recordId} expression (`type::record(…)`): SurrealDB refuses
     * a table, a field path, a subquery or any other expression as the
     * target, so those and an {@link idRange} are refused here.
     */
    readonly forUpdate: () => Select<T, P, StoredRow<T>, false>;
}
/**
 * `SELECT * FROM table`; `SELECT * FROM $id` with a record id expression of
 * that table (a binding, or {@link recordId}); or the records an
 * {@link idRange} of that table spans. Rows decode with the descriptor's
 * select schema.
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
    <T extends PureTable, P extends Params>(table: T, subject: IdOf<T, P> | IdRange<T['name'], P>): RecordSelect<T, P>;
    /**
     * `SELECT * FROM ONLY table WITH INDEX index WHERE … LIMIT 1` by a
     * unique index: one operand per field of the index (`{ email:
     * param('email', String) }`; a nested field by its path,
     * `'profile.bio'`), so the result is the row or NONE. `WITH INDEX`
     * makes the engine read that index: with `LIMIT 1` it otherwise reads
     * any index on a prefix of the fields whose name sorts first. An index
     * that is not unique, a missing or extra field, a value that never
     * compares with its field and a path through a field that is not one
     * object (a union of objects, a nullable object) are compile errors, as
     * is a value that may be
     * an array on a field that may hold an array or another kind: SurrealDB
     * 3.3 finds no array through such an index, and 4.0 does.
     */
    <T extends PureTable, const N extends string, const V extends {
        readonly [field: string]: Operand;
    }>(table: T, index: UniqueIndex<T, N>, values: UniqueValues<T, N, V>): Select<T, ParamsOfAll<V[keyof V]>, StoredRow<T>, true>;
};
type IsUnion<U, All = U> = U extends unknown ? [All] extends [U] ? false : true : never;
/**
 * The table whose records the traversal `R` of store `S` yields, when it
 * is one table of the store; otherwise a message saying why `R` is no
 * subject.
 */
type ReachedTable<S, R> = R extends {
    readonly [TraversalTypeId]: unknown;
} ? LinkTables<CodecOf<R>['Encoded']> extends infer Tb ? [Tb] extends [never] ? 'a select reads the records of a graph step or a recursive path' : string extends Tb ? 'the records of this step can be of any table, so a select has no row to read them with' : true extends IsUnion<Tb> ? 'the records of this step are of several tables, and a select reads the rows of one' : Extract<TableIn<S, Tb>, PureTable> : never : "a select reads the records of a graph step or a recursive path, like `outgoing(store, param('who', PersonId), 'knows')`";
/** `R`, when it is a subject {@link selectFrom} takes; otherwise the message. */
type ReachedSubject<S, R> = ReachedTable<S, R> extends PureTable ? R : ReachedTable<S, R>;
/**
 * `SELECT * FROM <records>`: the records a graph step (`outgoing`,
 * `incoming`, `both`), the edges of one (`edges`) or a recursive path
 * reaches, read as rows of their table, so a condition, a sort key, a
 * limit, a projection, FETCH and grouping apply to them as to any select.
 * The records must be of one table of `store`, and decode with its select
 * row (its `visible` row through `readAs(store)`). SurrealDB 3.3 and 4.0
 * read a step from a record that does not exist as no rows, keep the
 * duplicates of chained steps, and read a step from the row of an outer
 * select in a subquery from that row.
 *
 * @example
 * selectFrom(store, outgoing(store, param('who', PersonId), 'knows'))
 *   .where((peer) => gte(peer.age, 18))
 *   .orderBy((peer) => peer.name)
 *   .limit(10)
 *   .build();
 * // SELECT * FROM $who->knows->? WHERE age >= 18 ORDER BY name ASC LIMIT 10;
 */
declare const selectFrom: <S extends GraphStore, const R extends Expr>(store: S, records: ReachedSubject<S, R>) => Select<Extract<ReachedTable<S, R>, PureTable>, ParamsOf<R>, StoredRow<Extract<ReachedTable<S, R>, PureTable>>, false>;

/**
 * Full-text and nearest-neighbour search, and fused rankings of their
 * results, typed from the generated descriptors' indexes.
 *
 * A match or a nearest-neighbour search names its table and field, so the
 * compiler can check the index the engine needs: a full-text match needs a
 * `FULLTEXT` index on the field (SurrealDB 3.3 and 4.0 fail the query
 * without one) and the indexed nearest-neighbour form an `HNSW` or `DISKANN`
 * index (4.0.1 fails without one, 3.3 answers no rows). What the engine
 * accepts only as a literal (the match reference, the neighbour count, the
 * search effort, the distance) is a validated literal; the search terms and
 * the query vector are bindings.
 */

/** A table descriptor with the indexes the emitter generates. */
type SearchTable = PureTable & {
    readonly indexes?: {
        readonly [name: string]: {
            readonly type: string;
            readonly columns: ReadonlyArray<ReadonlyArray<string>>;
            readonly fulltext?: {
                readonly highlights: boolean;
            };
            readonly vector?: {
                readonly dimension: number;
            };
        };
    };
};
type IndexesOf<T> = T extends {
    readonly indexes?: infer I;
} ? NonNullable<I> : never;
/** An index's field path, as `a.b`. */
type Joined<C> = C extends readonly [infer H extends string] ? H : C extends readonly [infer H extends string, ...infer Rest] ? `${H}.${Joined<Rest>}` : never;
/** The indexes of `T` of kind `Kind` on exactly the field `F`. */
type IndexOn<T, F extends string, Kind> = {
    readonly [K in keyof IndexesOf<T>]: IndexesOf<T>[K] extends {
        readonly type: Kind;
        readonly columns: readonly [infer C];
    } ? [Joined<C>] extends [F] ? [F] extends [Joined<C>] ? IndexesOf<T>[K] : never : never : never;
}[keyof IndexesOf<T>];
type NameOf<T> = T extends {
    readonly name: infer N extends string;
} ? N : string;
/** The expression of the field path `F` of a row object. */
type At<R, F extends string> = F extends `${infer H}.${infer Rest}` ? H extends keyof R ? At<R[H], Rest> : never : F extends keyof R ? R[F] : never;
/** The codec of the field path `F` of `T`'s stored row. */
type FieldCodec<T extends PureTable, F extends string> = CodecOf<At<RowExprs<T>, F>>;
type Enumerate<N extends number, Acc extends ReadonlyArray<number> = []> = Acc['length'] extends N ? Acc[number] : Enumerate<N, [...Acc, Acc['length']]>;
/** A match reference number: SurrealDB parses an integer from 0 to 255. */
type MatchRef = Enumerate<256>;
/** `R`, or a message when it is not a match reference literal. */
type CheckedRef<R> = [R] extends [undefined] ? R : number extends R ? 'a match reference is an integer literal from 0 to 255, written in the code: SurrealDB parses no binding there' : R extends MatchRef ? R : 'a match reference is an integer from 0 to 255';
/**
 * `K`, or a message when it is not a positive integer literal: the
 * neighbour count and the search effort of `<|k, ef|>`, which SurrealDB
 * parses only as literals.
 */
type CheckedCount<K, What extends string> = number extends K ? `${What} is an integer literal written in the code: SurrealDB parses no binding there` : `${K & number}` extends `${string}.${string}` | `-${string}` | '0' ? `${What} is a positive integer` : K;
declare const MatchTypeId = "~effect-surrealkit/Match";
/**
 * A full-text match, `field @ref@ terms`: a condition, carrying its
 * reference number, the codec of the field it matches and whether its index
 * keeps highlights, for {@link score}, {@link highlight} and
 * {@link offsets}.
 */
interface Match<R extends number | undefined, F extends Codec, H extends boolean, P extends Params> extends Expr<Schema.Boolean, P> {
    readonly [MatchTypeId]: {
        readonly ref: R;
        readonly field: F;
        readonly highlights: H;
        readonly sql: string;
    };
}
type AnyMatch = Match<number | undefined, Codec, boolean, Params>;
/** The field `F`, or a message when no `FULLTEXT` index of `T` covers it. */
type FulltextField<T, F extends string> = [
    IndexOn<T, F, 'fulltext'>
] extends [never] ? `\`${NameOf<T>}\` has no FULLTEXT index on \`${F}\`` : F;
type HighlightsOf<T, F extends string> = IndexOn<T, F, 'fulltext'> extends {
    readonly fulltext: {
        readonly highlights: infer H extends boolean;
    };
} ? H : false;
/** The search terms: a string expression, or a string to inline. */
type Terms = Expr<Schema.Codec<unknown, string, never, never>, Params> | string;
/**
 * `field @ref@ terms`: the rows whose `field` matches the search terms,
 * through the `FULLTEXT` index on it. The field is a path of `table`'s
 * stored row (`"body"`, `"address.city"`) that a `FULLTEXT` index covers,
 * or the call is a compile error. `ref` (0 to 255) names the match for
 * {@link score}, {@link highlight} and {@link offsets}; `operator` makes
 * every term required (`AND`, `@1,AND@`) or any one enough (`OR`).
 *
 * @example
 * const hit = match(DocTable, 'body', param('terms', SurrealSchema.String), { ref: 1 });
 * select(DocTable)
 *   .where(() => hit)
 *   .project((row) => ({ id: row.id, score: score(hit) }));
 * // SELECT id AS id, search::score(1) AS score FROM ⟨doc⟩ WHERE body @1@ $terms
 */
declare const match: <T extends SearchTable, const F extends string, const Q extends Terms, const R extends number | undefined = undefined>(table: T, field: FulltextField<T, F>, terms: Q, options?: {
    readonly ref?: CheckedRef<R>;
    readonly operator?: "AND" | "OR";
}) => Match<R, FieldCodec<T, F>, HighlightsOf<T, F>, OperandParams<Q>>;
/** `M`, or a message when the match has no reference number. */
type Referenced<M, What extends string> = M extends Match<infer R, Codec, boolean, Params> ? [R] extends [number] ? M : `this match has no reference number, so ${What} cannot name it: give it one, as in \`match(table, field, terms, { ref: 1 })\`` : never;
/**
 * `search::score(ref)`: the relevance of the row to the match (BM25). On
 * SurrealDB 4 every matching row scores above 0; SurrealDB 3 scores 0 for a
 * term in at least half the rows. A row the condition admits through
 * another branch (`OR`) scores 0.
 */
declare const score: <M extends AnyMatch>(target: Referenced<M, "search::score">) => Expr<typeof Float, NoParams>;
/** `M`, or a message when it has no reference or its index no highlights. */
type Highlighted<M> = M extends Match<infer R, Codec, infer H, Params> ? [R] extends [number] ? [H] extends [true] ? M : 'the FULLTEXT index of this match keeps no HIGHLIGHTS, so `search::highlight` would return the text unmarked: define the index with HIGHLIGHTS' : 'this match has no reference number, so search::highlight cannot name it: give it one, as in `match(table, field, terms, { ref: 1 })`' : never;
/** Marked text: the highlight of a field that always holds text. */
declare const MarkedText: Schema.declareConstructor<string, string, readonly [], string>;
/**
 * Marked text, or NONE: the highlight of a text field that may hold none.
 * SurrealDB answers NONE for a field that is NONE, and for one that is NULL.
 */
declare const MarkedOptionalText: Schema.UndefinedOr<Schema.declareConstructor<string, string, readonly [], string>>;
/**
 * The marked elements of a list field. SurrealDB answers a list of one
 * element as that element alone, and a list of none, like a field that is
 * NONE, as NONE; each is read as the list it stands for.
 */
declare const MarkedList: Schema.decodeTo<Schema.$Array<Schema.declareConstructor<string, string, readonly [], string>>, Schema.Union<readonly [Schema.$Array<Schema.declareConstructor<string, string, readonly [], string>>, Schema.declareConstructor<string, string, readonly [], string>, Schema.Undefined]>, never, never>;
/**
 * Marked text, a list of it, or NONE: the highlight of a field that may
 * hold text or a list (`any`, `string | array<string>`), as SurrealDB
 * answers it.
 */
declare const MarkedAny: Schema.UndefinedOr<Schema.Union<readonly [Schema.declareConstructor<string, string, readonly [], string>, Schema.$Array<Schema.declareConstructor<string, string, readonly [], string>>]>>;
type Held<F extends Codec> = Exclude<F['Encoded'], undefined | null>;
/**
 * What `search::highlight` answers for a matched field of codec `F`: text
 * with the marks in it, which is not the field's own type any more (it need
 * not be one of the field's literals, nor within its length).
 */
type Marked<F extends Codec> = unknown extends F['Encoded'] ? typeof MarkedAny : [Held<F>] extends [never] ? typeof MarkedAny : [Held<F>] extends [ReadonlyArray<unknown>] ? typeof MarkedList : [Extract<Held<F>, ReadonlyArray<unknown>>] extends [never] ? [F['Encoded']] extends [Held<F>] ? typeof MarkedText : typeof MarkedOptionalText : typeof MarkedAny;
/**
 * `search::highlight(open, close, ref)`: the matched field with every
 * matched term between `open` and `close`. A text field is marked text, or
 * NONE when the field holds none; a list field is the list of its marked
 * elements. A row the condition admits through another branch is unmarked.
 * The index must keep highlights (`HIGHLIGHTS`).
 */
declare const highlight: <M extends AnyMatch, const O extends Terms, const C extends Terms>(target: Highlighted<M>, open: O, close: C) => Expr<Marked<M[typeof MatchTypeId]["field"]>, OperandParams<O> & OperandParams<C>>;
/**
 * Where each matched term is: its start and end, counted in characters,
 * under the index of the field's element it is in (`"0"` for text).
 */
declare const Offsets: Schema.UndefinedOr<Schema.$Record<Schema.String, Schema.$Array<Schema.Struct<{
    readonly s: Schema.declareConstructor<number, number, readonly [], number>;
    readonly e: Schema.declareConstructor<number, number, readonly [], number>;
}>>>>;
/**
 * `search::offsets(ref)`: for each element of the matched field that holds
 * a match (`"0"` for text), the start (`s`) and end (`e`) of every matched
 * term, in characters; NONE for a row the condition admits through another
 * branch.
 */
declare const offsets: <M extends AnyMatch>(target: Referenced<M, "search::offsets">) => Expr<typeof Offsets, NoParams>;
declare const KnnTypeId = "~effect-surrealkit/Knn";
/** A nearest-neighbour search, `field <|k, ef|> $vector`: a condition. */
interface Knn<P extends Params> extends Expr<Schema.Boolean, P> {
    readonly [KnnTypeId]: {
        readonly sql: string;
    };
}
/**
 * The distances SurrealDB computes without an index (`<|k, DISTANCE|>`), each
 * the same on SurrealDB 3.3 and 4.0 (`test/search-engine.test.ts` checks them
 * against their formulas on both). `JACCARD` and `PEARSON` are not among
 * them: the two majors compute them differently and find other rows.
 */
type Distance = 'CHEBYSHEV' | 'COSINE' | 'COSINE_NORMALIZED' | 'EUCLIDEAN' | 'HAMMING' | 'INNER_PRODUCT' | 'MANHATTAN' | readonly ['MINKOWSKI', number];
/** How the search runs: through the vector index, or by brute force. */
type KnnOptions = {
    readonly k: number;
    readonly ef: number;
} | {
    readonly k: number;
    readonly distance: Distance;
};
/**
 * The options of a search with neighbour count `K` and search effort `EF`
 * (none for a brute-force search), each count checked.
 */
type CheckedKnnOptions<K, EF> = [EF] extends [undefined] ? {
    readonly k: CheckedCount<K, 'the neighbour count'>;
    readonly distance: Distance;
} : {
    readonly k: CheckedCount<K, 'the neighbour count'>;
    readonly ef: CheckedCount<EF, 'the search effort'>;
};
type DimensionOf<T, F extends string> = IndexOn<T, F, 'hnsw' | 'diskann'> extends {
    readonly vector: {
        readonly dimension: infer D extends number;
    };
} ? D : never;
/**
 * The field `F` for a search with options `O`: the indexed form (`ef`)
 * needs an `HNSW` or `DISKANN` index on it; the brute-force form
 * (`distance`) an array of numbers.
 */
type VectorField<T extends PureTable, F extends string, EF> = [
    EF
] extends [number] ? [IndexOn<T, F, 'hnsw' | 'diskann'>] extends [never] ? `\`${NameOf<T>}\` has no HNSW or DISKANN index on \`${F}\`: search without one by naming a distance, as in \`{ k, distance: 'COSINE' }\`` : F : [FieldCodec<T, F>] extends [never] ? `\`${NameOf<T>}\` has no field \`${F}\`` : NonNullable<FieldCodec<T, F>['Encoded']> extends ReadonlyArray<number | bigint> ? F : `\`${NameOf<T>}.${F}\` is not an array of numbers, so it has no nearest neighbours`;
/** A query vector bound by name, as an array of floats. */
type VectorCodec = Schema.$Array<typeof Float>;
/**
 * The query vector: a binding name (its value is an array of floats), or a
 * binding of your own whose stored type is an array of numbers. A tuple
 * codec's length must be the index dimension.
 */
type QueryVector = string | Expr<Codec, Params>;
/** `V`, or a message when it cannot be the query vector of `T.F`. */
type CheckedVector<T, F extends string, V> = V extends string ? V : V extends Expr<infer S, Params> ? S['Encoded'] extends ReadonlyArray<number | bigint> ? number extends S['Encoded']['length'] ? V : [DimensionOf<T, F>] extends [never] ? V : S['Encoded']['length'] extends DimensionOf<T, F> ? V : `the query vector has ${S['Encoded']['length']} elements and the vector index on \`${NameOf<T>}.${F}\` has dimension ${DimensionOf<T, F>}` : 'the query vector is a binding whose stored type is an array of numbers' : never;
type VectorParams<V> = V extends string ? {
    readonly [N in V]: VectorCodec;
} : V extends Expr<Codec, infer P> ? P : never;
/**
 * `field <|k, ef|> $vector` through the field's `HNSW` or `DISKANN` index,
 * or `field <|k, DISTANCE|> $vector` by brute force: the `k` rows nearest to
 * the query vector. `k` and `ef` are positive integer literals and the
 * distance one of {@link Distance}, which SurrealDB parses only as
 * literals; the vector is a binding, its length checked against the index
 * dimension when it is encoded (and by the compiler for a tuple codec).
 * SurrealDB takes one search per `SELECT`, at the top level of its `WHERE`
 * (joined with `AND`): under `OR` or `NOT` it is refused when built.
 *
 * @example
 * const near = knn(DocTable, 'embedding', 'query', { k: 5, ef: 40 });
 * select(DocTable)
 *   .where(() => near)
 *   .project((row) => ({ id: row.id, distance: knnDistance(near) }));
 * // SELECT id AS id, vector::distance::knn() AS distance FROM ⟨doc⟩
 * //   WHERE embedding <|5,40|> $query
 */
declare const knn: <T extends SearchTable, const F extends string, const V extends QueryVector, const K extends number, const EF extends number | undefined = undefined>(table: T, field: VectorField<T, F, EF>, vector: CheckedVector<T, F, V>, options: CheckedKnnOptions<K, EF>) => Knn<VectorParams<V>>;
/**
 * `vector::distance::knn()`: the distance of the row from the query vector
 * of the statement's nearest-neighbour search, in its index's distance (or
 * the one named).
 */
declare const knnDistance: (_search: Knn<Params>) => Expr<typeof Float, NoParams>;
/** A list of rows to fuse: a subquery whose rows have an `id`. */
type RankedList = Expr<Codec, Params>;
type RowOfList<L> = CodecOf<L>['Type'] extends ReadonlyArray<infer R> ? R : never;
/** Each list, or a message when its rows have no `id`. */
type CheckedLists<Ls> = {
    readonly [I in keyof Ls]: RowOfList<Ls[I]> extends {
        readonly id: unknown;
    } ? Ls[I] : 'a fused list is a list of rows with an `id`, such as `select(…).project((row) => ({ id: row.id, … })).toExpr()`';
};
type KeysOf<U> = U extends unknown ? keyof U : never;
type ValueOf<U, K extends PropertyKey> = U extends unknown ? K extends keyof U ? U[K] : never : never;
/**
 * A fused row: the `id` every list has, every other field of any list
 * (absent when the row was not in that list), and the fused score.
 */
type FusedRow<Ls extends ReadonlyArray<unknown>, Score extends string> = RowOfList<Ls[number]> extends infer Rows ? Simplify<{
    readonly id: ValueOf<Rows, 'id'>;
} & {
    readonly [K in Exclude<KeysOf<Rows>, 'id' | Score>]?: Exclude<ValueOf<Rows, K>, undefined>;
} & {
    readonly [S in Score]: number;
}> : never;
/** The codec of a fused ranking. */
type FusedCodec<Ls extends ReadonlyArray<unknown>, Score extends string> = Schema.Codec<ReadonlyArray<FusedRow<Ls, Score>>, unknown, never, never>;
type Lists = readonly [RankedList, RankedList, ...ReadonlyArray<RankedList>];
/**
 * `search::rrf(lists, limit, k)`: reciprocal rank fusion of two or more
 * ranked lists. Rows with the same `id` are merged (fields of every list
 * they appear in), scored `rrf_score` (the sum of `1 / (k + rank)`), and
 * the best `limit` returned, best first. `k` defaults to 60.
 *
 * @example
 * evaluate(rrf([byMeaning.toExpr(), byWords.toExpr()], { limit: 10 }));
 * // RETURN search::rrf([(SELECT …), (SELECT …)], 10, 60);
 */
declare const rrf: <const Ls extends Lists, const L extends Count, const K extends Count = 60>(lists: CheckedLists<Ls>, options: {
    readonly limit: L;
    readonly k?: K;
}) => Expr<FusedCodec<Ls, "rrf_score">, ParamsOfAll<Ls[number]> & OperandParams<L> & OperandParams<K>>;
/** `W`, or a message when a tuple of weights does not match the lists. */
type CheckedWeights<Ls extends ReadonlyArray<unknown>, W> = W extends ReadonlyArray<number> ? number extends W['length'] ? W : W['length'] extends Ls['length'] ? W : `there are ${Ls['length']} lists and ${W['length']} weights; give one weight per list` : W;
/**
 * `search::linear(lists, weights, limit, normalisation)`: a weighted sum of
 * each list's scores (`distance`, else `ft_score`, else `score`, else the
 * rank), normalised per list (`minmax` or `zscore`), as `linear_score`.
 * Rows with the same `id` are merged, as for {@link rrf}.
 */
declare const linear: <const Ls extends Lists, const W extends ReadonlyArray<number> | Expr<Schema.Codec<unknown, ReadonlyArray<number>, never, never>, Params>, const L extends Count>(lists: CheckedLists<Ls>, options: {
    readonly weights: W & CheckedWeights<Ls, W>;
    readonly limit: L;
    readonly normalisation: "minmax" | "zscore";
}) => Expr<FusedCodec<Ls, "linear_score">, ParamsOfAll<Ls[number]> & OperandParams<W> & OperandParams<L>>;
/**
 * `RETURN expr`: a statement whose result is one expression, such as a
 * fused ranking. What it writes is unknown (its subqueries may call
 * functions that write) unless `options.writes` says.
 */
declare const evaluate: <S extends Codec, P extends Params>(expr: Expr<S, P>, name?: string, options?: {
    readonly writes?: boolean;
}) => Statement<Simplify<P>, S>;

export { type AfterFetch, AnyStatement, type Arm, type ArrayFields, type Axes, type AxisValue, BindingUses, type Binds, type BindsOf, type Block, type BlockResult, BlockTypeId, type Branches, type CheckedAggregates, type CheckedAssignments, type CheckedAxes, type CheckedCount, type CheckedFetch, type CheckedFills, type CheckedKey, type CheckedKeys, type CheckedLists, type CheckedOmit, type CheckedOptions, type CheckedRange, type CheckedRef, type CheckedShape, type CheckedVariantKey, type CheckedVector, type CheckedWeights, type Choice, type ChoiceOptions, Codec, CodecOf, type CollectOptions, Comparable, type Composite, type CompositeFills, Condition, type Contract, type Count, type Create, type DefinesOf, type Delete, type Depth, type DestructuredOf, Diff, type DiffCodec, type Direction, type Distance, type DistinctCodec, type Empty, type Ended, type Endpoint, type Exactly, Expr, type ExtremeCodec, type Family, type FamilyContract, type FetchProblem, type FetchTarget, type Fetched, type FetchedSelect, type FieldCodec, FieldsOf$1 as FieldsOf, type Fits, type FitsBoth, type FitsRows, type FitsUpdateRows, type Fitting, type Followable, type FollowedOf, type ForEffect, type FreeOf, type FulltextField, type FusedCodec, type FusedRow, type GraphEdge, type GraphStore, type GroupAll, type GroupResult, type GroupRow, type GroupRowOf, type Grouped, type GroupedSelect, type Highlighted, IdOf, type IdRange, IdRangeTypeId, type Insert, type InsertRelationRow, type InsertRow, ItemOf, type KeyOf, type KeyParams, type KeyPart, type KeyParts, type KindStored, type Knn, type KnnOptions, KnnTypeId, type LetValue, type Lift, type Lifted, type LinkProblem, type LinkTables, type Linked, LiteralCodec, type Local, type LocalField, type LocalName, type Locals, type Marked, MarkedAny, MarkedList, MarkedOptionalText, MarkedText, type Match, type MatchRef, MatchTypeId, type MedianCodec, type Narrowed, type NoLocals, NoParams, type NoResult, type Node, type ObjectCodec, type ObjectFields, Offsets, type OmittedRow, Operand, type OperationOf, OrNone, type OrderAlias, Params, type ParamsAt, ParamsOf, ParamsOfAll, type Part, PatchOperation, Path, Primitive, ProjectedCodec, PureTable, type QueryVector, type RangeBounds, type RangeParams, type RankedList, type ReachedRow, type ReachedSubject, type ReachedTable, type RecordKeyOf, type RecordSelect, type RecursionResult, type RecursionStart, type RecursionStep, type Referenced, type RejectsNone, type RejectsNoneOf, type Relate, type RelationTable, Result, type Returned, RowCodec, RowCodecIn, RowExprs, RowOf, type RowValue, RowValueTypeId, type RowsOf, type Scope, type SearchTable, type Select, type SelectResult, type SelectValueRow, type Shape, type ShortestTarget, type SomeOf, type Split, type SplitCodec, type SplitField, type SplitRow, type SplitTable, type SpreadCodec, Statement, type Step, type StepCodec, type StepEnds, type StepFrom, type StepOptions, type StepProblem, type StepStarts, StoredRow, type StringKeyed, type SumCodec, type TableIn, type Tables, type TargetFields, type TargetRow, type TargetSelect, type Terms, type TextNode, TextNodeTypeId, type ThrownBy, type ThrowsOf, type TimeCodec, type Traversal, TraversalTypeId, type Unbound, type UniqueIndex, type UniqueValues, type Update, type UpdateEach, type UpdateTarget, type Upsert, type UpsertTarget, type VectorCodec, type VectorField, type WriteResult, arrayDistinct, arrayGroup, block, both, choose, collect, compose, count, create, deleteFrom, destructure, edges, empty, evaluate, family, follow, highlight, idRange, incoming, insert, insertRelation, isIdRange, isTraversal, knn, knnDistance, linear, match, max, mean, median, min, object, offsets, outgoing, part, recordId, recurse, relate, renameNames, rows, rrf, score, select, selectFrom, sequence, shortest, stddev, sum, timeMax, timeMin, update, updateEach, upsert, variance };
