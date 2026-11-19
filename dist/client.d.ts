import { Schedule, Effect, Context, Layer, Metric, Duration } from 'effect';
import { SurrealSession } from 'surrealdb';
import { C as Codec, S as Statement, P as Params, I as Input, b as CheckedInput } from './statement-CkM3Zd8F.js';
import * as effect_Cause from 'effect/Cause';
import * as effect_Types from 'effect/Types';
import './uses-BXJXI3if.js';

declare const StatementEncodeError_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "StatementEncodeError";
} & Readonly<A>;
/**
 * A binding's value failed its codec, or its encoded value is not one the
 * SDK sends without loss (`path` says where inside it). Nothing was sent:
 * an out-of-range decimal or datetime, for instance, would otherwise hang
 * the request, and a lone surrogate or a class instance would be altered.
 */
declare class StatementEncodeError extends StatementEncodeError_base<{
    readonly statement: string;
    readonly binding: string;
    /** Where inside the encoded value the problem is; empty for the value. */
    readonly path?: ReadonlyArray<string | number>;
    readonly message: string;
}> {
}
declare const StatementScopeError_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "StatementScopeError";
} & Readonly<A>;
/**
 * `transaction` refused its statements before sending anything, because
 * they cannot share one variable scope or one transaction: a binding
 * another statement `LET`s, one name bound to two different values, or a
 * statement that writes its own `BEGIN`, `COMMIT` or `CANCEL`.
 */
declare class StatementScopeError extends StatementScopeError_base<{
    readonly statement: string;
    /** The binding at issue; absent for a statement's own transaction. */
    readonly binding?: string;
    readonly message: string;
}> {
}
declare const StatementRequestError_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "StatementRequestError";
} & Readonly<A>;
/** The request failed: transport, permissions, a SurrealQL error. */
declare class StatementRequestError extends StatementRequestError_base<{
    readonly statement: string;
    readonly message: string;
    readonly cause: unknown;
}> {
}
declare const StatementThrown_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "StatementThrown";
} & Readonly<A>;
/**
 * The statement raised one of the `THROW` messages it declares. A message
 * it does not declare is a {@link StatementUnexpectedThrow}. When the part
 * that declares the message carries `source` and `throwsAt`, so does this.
 */
declare class StatementThrown<Reason extends string = string> extends StatementThrown_base<{
    readonly statement: string;
    readonly reason: string;
    /** Where the declaring part came from, such as its `.surql` file. */
    readonly source?: string;
    /** The lines of `source` that throw this message. */
    readonly lines?: ReadonlyArray<number>;
}> {
    readonly reason: Reason;
    get message(): string;
}
declare const StatementUnexpectedThrow_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "StatementUnexpectedThrow";
} & Readonly<A>;
/**
 * The statement raised a `THROW` whose message it does not declare: a
 * dynamic message, or text that changed without its declaration.
 */
declare class StatementUnexpectedThrow extends StatementUnexpectedThrow_base<{
    readonly statement: string;
    /** The thrown text. */
    readonly reason: string;
    readonly cause: unknown;
}> {
    get message(): string;
}
declare const StatementConflict_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "StatementConflict";
} & Readonly<A>;
/**
 * The engine reported a transaction conflict with a concurrent write. The
 * request changed nothing and can be sent again.
 */
declare class StatementConflict extends StatementConflict_base<{
    readonly statement: string;
    readonly message: string;
    readonly cause: unknown;
}> {
}
declare const StatementDecodeError_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "StatementDecodeError";
} & Readonly<A>;
/**
 * The engine answered, and the answer is not what the statement declares:
 * a different number of results, a value where NONE was required, or a
 * final result its codec refuses. The request itself succeeded, so unless
 * the statement is known not to write (`committed` is false), whatever it
 * wrote is committed; the client then reports it inside a
 * {@link StatementWriteOutcomeError}.
 */
declare class StatementDecodeError extends StatementDecodeError_base<{
    readonly statement: string;
    /** The 1-based result that failed, or 0 for the count of results. */
    readonly slot: number;
    /**
     * The request succeeded and the statement is not known to be
     * read-only, so whatever it wrote is committed although the result
     * could not be decoded. The message says whether it certainly wrote or
     * may have.
     */
    readonly committed: boolean;
    readonly message: string;
}> {
}
declare const StatementEmptyResult_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "StatementEmptyResult";
} & Readonly<A>;
/**
 * A statement that always returns a row when it applies (a `create` or
 * `relate` that returns rows) returned NONE or an empty list. SurrealDB
 * reports a write the session's permissions deny as an empty result,
 * without an error, so the session may lack permission; nothing was
 * written by that statement.
 */
declare class StatementEmptyResult extends StatementEmptyResult_base<{
    readonly statement: string;
    /** The 1-based result that was empty. */
    readonly slot: number;
    readonly message: string;
}> {
}
declare const StatementWriteOutcomeError_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "StatementWriteOutcomeError";
} & Readonly<A>;
/**
 * The request succeeded but its result failed validation, and the
 * statement or batch is not known to be read-only: whatever it wrote is
 * committed. The message says which: its writes are committed (a statement
 * with `writes: true`), or it may have written (one with `writes` unknown).
 * `cause` is the {@link StatementDecodeError}, naming the statement and the
 * result. Reconcile (read the data back) before replaying. A request whose
 * every statement has `writes: false` fails with the decode error itself.
 */
declare class StatementWriteOutcomeError extends StatementWriteOutcomeError_base<{
    /** The statement, or the transaction, that was sent. */
    readonly request: string;
    readonly cause: StatementDecodeError;
}> {
    get message(): string;
}
/** Every error of running a statement that can `THROW` the messages `T`. */
type StatementError<Throws extends string = never> = StatementEncodeError | StatementScopeError | StatementRequestError | StatementUnexpectedThrow | StatementConflict | StatementDecodeError | StatementEmptyResult | StatementWriteOutcomeError | ([Throws] extends [never] ? never : StatementThrown<Throws>);

/**
 * Runs statements against SurrealDB through the JavaScript SDK.
 *
 * One request per statement: bindings are encoded through their codecs
 * first, and each encoded value is checked to be one the SDK sends without
 * loss, so a refused value is never sent; the answer must have the
 * declared number of results, NONE in all but the last, and a last result
 * the statement's codec accepts. Interrupting the effect aborts the request.
 */

/**
 * What a client needs from the SDK: a connection or a session. Statements
 * run with that session's authentication, namespace and database.
 */
type Queryable = Pick<SurrealSession, 'query' | 'transaction'>;
interface RunOptions {
    /**
     * Sends the same, already encoded request again while the engine
     * reports a transaction conflict ({@link StatementConflict}), as the
     * schedule allows; any other failure is never retried. Safe for one
     * statement and for `transaction`, which are single atomic requests.
     * SurrealDB 4 already retries a single conflicting statement on the
     * server. Off by default.
     *
     * @example
     * client.run(bump, {}, { retry: Schedule.recurs(3) })
     */
    readonly retry?: Schedule.Schedule<unknown, StatementConflict>;
    /**
     * Skips the check that every encoded binding is a value the SDK sends
     * without loss (a `SurrealValue`, or `undefined` for NONE, with
     * well-formed strings). Codecs still run. Default false.
     */
    readonly unsafeSkipValueCheck?: boolean;
}
/**
 * The input argument: optional when no binding needs a value. `I` is the
 * input as the caller wrote it, checked by {@link CheckedInput}.
 */
type InputOf<P extends Params, I = Input<P>> = Record<never, never> extends Input<P> ? readonly [input?: CheckedInput<P, I>] : readonly [input: CheckedInput<P, I>];
/** The arguments after the statement: its input, then the options. */
type RunArgs<P extends Params, I = Input<P>> = Record<never, never> extends Input<P> ? readonly [input?: CheckedInput<P, I>, options?: RunOptions] : readonly [input: CheckedInput<P, I>, options?: RunOptions];
/** Only {@link bind} makes a {@link Bound}: no other code can name this. */
declare const BoundTypeId: unique symbol;
/**
 * A statement together with the values of its bindings, made by
 * {@link bind}, which checks the input against the statement's bindings.
 */
interface Bound<R extends Codec = Codec, Throws extends string = string> {
    readonly [BoundTypeId]: 'made by bind';
    readonly statement: Statement<Params, R, Throws>;
    readonly input: Readonly<Record<string, unknown>>;
}
/** Pairs a statement with its input, to run it inside {@link Client.transaction}. */
declare const bind: <P extends Params, R extends Codec, Throws extends string, I = Input<P>>(statement: Statement<P, R, Throws>, ...input: InputOf<P, I>) => Bound<R, Throws>;
/**
 * The statements of a transaction as the caller wrote them, `S`: each one
 * not made by {@link bind} is typed as a message saying so.
 */
type BoundStatements<S extends ReadonlyArray<unknown>> = {
    readonly [I in keyof S]: S[I] extends {
        readonly [BoundTypeId]: 'made by bind';
    } ? S[I] : 'a transaction takes statements paired with their input by `bind`';
};
/** The decoded results of the statements of a transaction, in order. */
type Results<S extends ReadonlyArray<unknown>> = {
    readonly [I in keyof S]: S[I] extends Bound<infer R, string> ? R['Type'] : never;
};
/** The messages any statement of a transaction can `THROW`. */
type ThrownByAny<S extends ReadonlyArray<unknown>> = S[number] extends Bound<Codec, infer T> ? T : never;
interface Client {
    /**
     * Runs one statement and decodes its result.
     *
     * The statement is one request. Unless its own text says otherwise
     * (`BEGIN … COMMIT`), each of its SurrealQL statements commits on its
     * own; use {@link Client.transaction} for all-or-nothing.
     */
    readonly run: <P extends Params, R extends Codec, Throws extends string, I = Input<P>>(statement: Statement<P, R, Throws>, ...args: RunArgs<P, I>) => Effect.Effect<R['Type'], StatementError<Throws>>;
    /**
     * Runs several statements as one atomic request and decodes each result:
     * all of them take effect, or none does.
     *
     * The statements share one variable scope, as SurrealQL has it, so
     * before anything is sent a binding name is refused when two
     * statements bind it to values that are not certainly equal, or when
     * one statement binds a name another `LET`s (a `StatementScopeError`
     * naming both). A statement whose own text writes `BEGIN`, `COMMIT` or
     * `CANCEL` cannot be nested in this one and is refused as a
     * `StatementScopeError` too. The SDK refuses a top-level `RETURN` that
     * is followed by another statement, because some engines end the
     * transaction there. A declared `THROW` names the statement that
     * declares it.
     */
    readonly transaction: <const S extends ReadonlyArray<unknown>>(statements: BoundStatements<S>, options?: RunOptions) => Effect.Effect<Results<S>, StatementError<ThrownByAny<S>>>;
}
declare const SurrealClient_base: Context.ServiceClass<SurrealClient, "effect-surrealkit/SurrealClient", Client>;
/** The client statements run through, as a service. */
declare class SurrealClient extends SurrealClient_base {
}
/**
 * The metrics every run updates, through Effect's `Metric`:
 *
 * - `runs`: a counter of runs, by `statement` (its name) and `outcome`
 *   (`success`, the error's tag, or `interrupted`);
 * - `duration`: a timer of each run, from encoding to decoding, by
 *   `statement`;
 * - `retries`: a counter of requests sent again after a transaction
 *   conflict, by `statement`.
 */
declare const metrics: {
    readonly runs: Metric.Counter<number>;
    readonly duration: Metric.Histogram<Duration.Duration>;
    readonly retries: Metric.Counter<number>;
};
/**
 * A client over an SDK connection or session.
 *
 * @example
 * const db = new Surreal();
 * await db.connect(url, { namespace, database, authentication });
 * const client = make(db);
 */
declare const make: (db: Queryable) => Client;
/** Provides {@link SurrealClient} from an SDK connection or session. */
declare const layer: (db: Queryable) => Layer.Layer<SurrealClient>;
/** Runs a statement through the {@link SurrealClient} in context. */
declare const run: <P extends Params, R extends Codec, Throws extends string, I = Input<P>>(statement: Statement<P, R, Throws>, ...args: RunArgs<P, I>) => Effect.Effect<R["Type"], StatementError<Throws>, SurrealClient>;
/** Runs statements atomically through the {@link SurrealClient} in context. */
declare const transaction: <const S extends ReadonlyArray<unknown>>(statements: BoundStatements<S>, options?: RunOptions) => Effect.Effect<Results<S>, StatementError<ThrownByAny<S>>, SurrealClient>;

export { type Bound, type BoundStatements, type Client, type InputOf, type Queryable, type Results, type RunArgs, type RunOptions, StatementConflict, StatementDecodeError, StatementEmptyResult, StatementEncodeError, type StatementError, StatementRequestError, StatementScopeError, StatementThrown, StatementUnexpectedThrow, StatementWriteOutcomeError, SurrealClient, type ThrownByAny, bind, layer, make, metrics, run, transaction };
