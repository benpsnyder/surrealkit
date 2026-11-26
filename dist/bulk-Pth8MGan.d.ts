import { Effect, Schedule, Result, Duration, Stream, Schema, Scope, Context, Layer } from 'effect';
import { Surreal, SurrealSession } from 'surrealdb';
import { P as Params, C as Codec, q as Input, S as Statement, o as ElementOf, m as CheckedInput } from './expr-99eIx780.js';
import { i as LiveStatement } from './live-DS7CDSd5.js';
import * as effect_Cause from 'effect/Cause';
import * as effect_Types from 'effect/Types';

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
    toJSON(): unknown;
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
    toJSON(): unknown;
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
    /** The raw thrown text, available for deliberate inspection. */
    readonly reason: string;
    readonly cause: unknown;
}> {
    get message(): string;
    toJSON(): unknown;
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
    toJSON(): unknown;
}
declare const StatementIndexConflict_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "StatementIndexConflict";
} & Readonly<A>;
/**
 * A write would duplicate a value of a unique index the statement declares
 * (`uniqueIndexes`; a write builder declares its table's). Nothing was
 * written by the statement that failed. SurrealDB reports the index by name
 * only, so a write that calls a function writing to another table with an
 * index of the same name reports that index under this name.
 *
 * The message names the statement and the index. The duplicated value and
 * the record that holds it are only in the engine's error, `cause`.
 *
 * `UPSERT`, `INSERT IGNORE` and `INSERT … ON DUPLICATE KEY UPDATE` are
 * SurrealDB's own ways to write a row whose value may be taken; this error
 * is for a write that expects the value to be free.
 */
declare class StatementIndexConflict<Index extends string = string> extends StatementIndexConflict_base<{
    /** The statement that declares the index; in a transaction, `one of …` when several do. */
    readonly statement: string;
    readonly index: string;
    readonly cause: unknown;
}> {
    readonly index: Index;
    get message(): string;
    toJSON(): unknown;
}
declare const StatementRecordExists_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "StatementRecordExists";
} & Readonly<A>;
/**
 * A write tried to create a record whose id already exists (`CREATE` or
 * `INSERT` of an id that is taken). The id is only in the engine's error,
 * `cause`. `UPSERT`, `INSERT IGNORE` and `INSERT … ON DUPLICATE KEY UPDATE`
 * write such a record without this error.
 */
declare class StatementRecordExists extends StatementRecordExists_base<{
    /** The statement, or the transaction, that was sent. */
    readonly statement: string;
    readonly message: string;
    readonly cause: unknown;
}> {
    toJSON(): unknown;
}
declare const StatementDecodeError_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "StatementDecodeError";
} & Readonly<A>;
/**
 * The engine answered, and the answer is not what the statement declares:
 * a different number of results, a value where NONE was required, or a
 * final result its codec refuses. For a write, the client reports the failure
 * inside a {@link StatementWriteOutcomeError} and records whether the engine
 * acknowledged the write before decoding failed.
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
 * A write or a statement that may write returned data its result codec refused.
 * `cause.committed` is true after the engine acknowledged the request. A
 * stream can fail while decoding provisional rows, before the write is
 * acknowledged. Read back the data before replaying the request.
 */
declare class StatementWriteOutcomeError extends StatementWriteOutcomeError_base<{
    /** The statement, or the transaction, that was sent. */
    readonly request: string;
    readonly cause: StatementDecodeError;
}> {
    get message(): string;
}
/**
 * Every error of running a statement that can `THROW` the messages `Throws`
 * and duplicate a value of the unique indexes `Unique`. As for
 * `Statement`, leaving `Unique` out means any index.
 */
type StatementError<Throws extends string = never, Unique extends string = string> = StatementEncodeError | StatementScopeError | StatementRequestError | StatementUnexpectedThrow | StatementConflict | StatementRecordExists | StatementDecodeError | StatementEmptyResult | StatementWriteOutcomeError | ([Throws] extends [never] ? never : StatementThrown<Throws>) | ([Unique] extends [never] ? never : StatementIndexConflict<Unique>);
declare const StatementUnsupported_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "StatementUnsupported";
} & Readonly<A>;
/** The transport or engine lacks a required feature. No write request was sent. */
declare class StatementUnsupported extends StatementUnsupported_base<{
    readonly feature: 'interactive transaction' | 'live query' | 'stream';
    readonly statement?: string;
    readonly message: string;
    readonly cause?: unknown;
}> {
    toJSON(): unknown;
}
declare const TransactionOutcomeUnknown_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "TransactionOutcomeUnknown";
} & Readonly<A>;
/** The commit was sent and no answer arrived. Read back before retrying. */
declare class TransactionOutcomeUnknown extends TransactionOutcomeUnknown_base<{
    readonly message: string;
    readonly cause: unknown;
}> {
    toJSON(): unknown;
}
declare const BulkWriteError_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "BulkWriteError";
} & Readonly<A>;
/** A non-atomic bulk write failed after committing any preceding chunks. */
declare class BulkWriteError<Throws extends string = never, Unique extends string = string> extends BulkWriteError_base<{
    readonly statement: string;
    /** Zero-based index of the failed chunk. */
    readonly chunk: number;
    readonly chunksCommitted: number;
    readonly rowsCommitted: number;
    readonly cause: StatementError<Throws, Unique>;
}> {
}
declare const LiveQueryClosed_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "LiveQueryClosed";
} & Readonly<A>;
/** The live query ended without the caller closing it. */
declare class LiveQueryClosed extends LiveQueryClosed_base<{
    readonly statement: string;
    readonly reason: 'killed' | 'disconnected';
    readonly message: string;
}> {
}
declare const WatchQueryClosed_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "WatchQueryClosed";
} & Readonly<A>;
/** The observer's connection, authority or notification feed was lost. */
declare class WatchQueryClosed extends WatchQueryClosed_base<{
    readonly statement: string;
    readonly reason: 'disconnected' | 'session-closed' | 'identity-changed' | 'authentication' | 'source-overflow';
    readonly message: string;
}> {
}

interface TransactionOptions {
    /** Retry the whole transaction body on a statement or commit conflict. */
    readonly retry?: Schedule.Schedule<unknown, StatementConflict>;
}
type TransactionRunOptions = Omit<RunOptions, 'retry'>;
interface TransactionClient {
    readonly run: <P extends Params, R extends Codec, T extends string, U extends string = never, I = Input<P>>(statement: Statement<P, R, T, U>, ...args: RunArgsWithOptions<P, I, TransactionRunOptions>) => Effect.Effect<R['Type'], StatementError<T, U>>;
    readonly transaction: <const S extends ReadonlyArray<unknown>>(statements: BoundStatements<S>, options?: TransactionRunOptions) => Effect.Effect<Results<S>, StatementError<ThrownByAny<S>, UniqueIndexesOfAny<S>>>;
    readonly bulk: <P extends Params, R extends Codec, T extends string, K extends ListBindingsOf<P>, E = never, C = never, U extends string = never>(statement: Statement<P, R, T, U>, input: BulkInput<P, K, E, C>, options: Omit<BulkOptions<K, ElementOf<P[K]['Type']>, E, C>, 'retry' | 'atomic'>) => Effect.Effect<BulkSummary<R['Type']>, StatementError<T, U> | BulkWriteError<T, U> | StatementUnsupported | E, C>;
}
type TransactionError = StatementConflict | StatementRequestError | StatementScopeError | StatementUnsupported | TransactionOutcomeUnknown;

interface LiveEvent<Row, Id> {
    readonly action: 'CREATE' | 'UPDATE' | 'DELETE';
    readonly id: Id;
    /** The record after the change, or the deleted record for DELETE. */
    readonly value: Row;
}
type LiveError = StatementEncodeError | StatementRequestError | StatementScopeError | StatementDecodeError | StatementUnsupported | LiveQueryClosed;

interface PipelineOptions {
    /** Wrap each statement in its own transaction, or run its text as it is (default). */
    readonly each?: 'statement' | 'transaction';
    readonly unsafeSkipValueCheck?: boolean;
}
/** One result for each bound statement, in request order. */
type PipelineResults<S extends ReadonlyArray<unknown>> = {
    readonly [I in keyof S]: S[I] extends Bound<infer R, infer T, infer U> ? Result.Result<R['Type'], StatementError<T, U>> : never;
};

declare const BoundLiveTypeId: unique symbol;
/** A typed live statement and its bindings, paired by {@link bindLive}. */
interface BoundLive {
    readonly [BoundLiveTypeId]: 'made by bindLive';
    readonly statement: LiveStatement;
    readonly input: Readonly<Record<string, unknown>>;
}
/** Pair a live statement with the values of its bindings. */
declare const bindLive: <P extends Params, Row extends Codec, Id extends Codec, I = Input<P>>(statement: LiveStatement<P, Row, Id>, ...input: InputOf<P, I>) => BoundLive;
interface WatchQueryOptions {
    /** Explicit notification sources covering changes to the query's result. */
    readonly sources: readonly [BoundLive, ...BoundLive[]];
    /** Re-read even without a notification. Positive and finite, default 30 seconds. */
    readonly reconcileEvery?: Duration.Input;
}
type WatchQueryState<A> = {
    readonly _tag: 'Loading';
} | {
    readonly _tag: 'Stale';
} | {
    readonly _tag: 'Current';
    readonly value: A;
};
type WatchQueryError<T extends string = never, U extends string = never> = StatementError<T, U> | LiveError | WatchQueryClosed;
type WatchQuery = <P extends Params, R extends Codec, T extends string, U extends string = never, I = Input<P>>(statement: Statement<P, R, T, U>, options: WatchQueryOptions, ...input: InputOf<P, I>) => Stream.Stream<WatchQueryState<R['Type']>, WatchQueryError<T, U>>;

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
 * What a client needs from a connection or session. Interactive transactions
 * and live queries also require the corresponding optional SDK methods.
 */
type Queryable = Pick<SurrealSession, 'query' | 'transaction'> & Partial<Pick<SurrealSession, 'beginTransaction' | 'liveOf'>>;
interface ClientOptions {
    /** The owning connection when observing queries on a child SDK session. */
    readonly connection?: Surreal;
}
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
type RunArgs<P extends Params, I = Input<P>> = RunArgsWithOptions<P, I, RunOptions>;
type RunArgsWithOptions<P extends Params, I, Options> = Record<never, never> extends Input<P> ? readonly [input?: CheckedInput<P, I>, options?: Options] : readonly [input: CheckedInput<P, I>, options?: Options];
/** Only {@link bind} makes a {@link Bound}: no other code can name this. */
declare const BoundTypeId: unique symbol;
/**
 * A statement together with the values of its bindings, made by
 * {@link bind}, which checks the input against the statement's bindings.
 */
interface Bound<R extends Codec = Codec, Throws extends string = string, Unique extends string = string> {
    readonly [BoundTypeId]: 'made by bind';
    readonly statement: Statement<Params, R, Throws, Unique>;
    readonly input: Readonly<Record<string, unknown>>;
}
/** Pairs a statement with its input, to run it inside {@link Client.transaction}. */
declare const bind: <P extends Params, R extends Codec, Throws extends string, Unique extends string = never, I = Input<P>>(statement: Statement<P, R, Throws, Unique>, ...input: InputOf<P, I>) => Bound<R, Throws, Unique>;
/**
 * The statements sent together as the caller wrote them, `S`: each one
 * not made by {@link bind} is typed as a message saying so.
 */
type BoundStatements<S extends ReadonlyArray<unknown>> = {
    readonly [I in keyof S]: S[I] extends {
        readonly [BoundTypeId]: 'made by bind';
    } ? S[I] : 'statements that run together are paired with their input by `bind`';
};
/** The decoded results of the statements of a transaction, in order. */
type Results<S extends ReadonlyArray<unknown>> = {
    readonly [I in keyof S]: S[I] extends Bound<infer R, string, string> ? R['Type'] : never;
};
/** The messages any statement of a transaction can `THROW`. */
type ThrownByAny<S extends ReadonlyArray<unknown>> = S[number] extends Bound<Codec, infer T, string> ? T : never;
/** The unique indexes any statement of a transaction can duplicate a value of. */
type UniqueIndexesOfAny<S extends ReadonlyArray<unknown>> = S[number] extends Bound<Codec, string, infer U> ? U : never;
interface Client {
    /**
     * Runs one statement and decodes its result.
     *
     * The statement is one request. Unless its own text says otherwise
     * (`BEGIN … COMMIT`), each of its SurrealQL statements commits on its
     * own; use {@link Client.transaction} for all-or-nothing.
     */
    readonly run: <P extends Params, R extends Codec, Throws extends string, Unique extends string = never, I = Input<P>>(statement: Statement<P, R, Throws, Unique>, ...args: RunArgs<P, I>) => Effect.Effect<R['Type'], StatementError<Throws, Unique>>;
    /**
     * Runs several statements as one atomic request and decodes each result:
     * all of them take effect, or none does.
     *
     * Shared binding names and top-level locals are renamed per statement.
     * A statement with its own transaction control cannot be nested and
     * fails with a `StatementScopeError` before sending. The SDK refuses a top-level
     * `RETURN` followed by another statement, because some engines end the
     * transaction there. A declared `THROW` names the statement that
     * declares it.
     */
    readonly transaction: <const S extends ReadonlyArray<unknown>>(statements: BoundStatements<S>, options?: RunOptions) => Effect.Effect<Results<S>, StatementError<ThrownByAny<S>, UniqueIndexesOfAny<S>>>;
    /** Sends a list together and returns one outcome per statement. */
    readonly pipeline: <const S extends ReadonlyArray<unknown>>(statements: BoundStatements<S>, options?: PipelineOptions) => Effect.Effect<PipelineResults<S>, StatementEncodeError | StatementScopeError | StatementRequestError>;
    /** Opens a transaction for the body and commits when the body succeeds. */
    readonly withTransaction: <A, E, R>(body: (tx: TransactionClient) => Effect.Effect<A, E, R>, options?: TransactionOptions) => Effect.Effect<A, E | TransactionError, R>;
    /** Runs a statement over chunks of one list binding. */
    readonly bulk: <P extends Params, R extends Codec, T extends string, K extends ListBindingsOf<P>, E = never, C = never, U extends string = never>(statement: Statement<P, R, T, U>, input: BulkInput<P, K, E, C>, options: BulkOptions<K, ElementOf<P[K]['Type']>, E, C>) => Effect.Effect<BulkSummary<R['Type']>, StatementError<T, U> | BulkWriteError<T, U> | StatementUnsupported | TransactionOutcomeUnknown | E, C>;
    /** Decodes an array result one row at a time. */
    readonly stream: <P extends Params, Row extends Codec, T extends string, U extends string = never, I = Input<P>>(statement: Statement<P, Schema.$Array<Row>, T, U>, ...input: InputOf<P, I>) => Stream.Stream<Row['Type'], StatementError<T, U> | StatementUnsupported>;
    /** Acquires a live query in the current scope. */
    readonly liveScoped: <P extends Params, Row extends Codec, Id extends Codec, I = Input<P>>(statement: LiveStatement<P, Row, Id>, ...input: InputOf<P, I>) => Effect.Effect<Stream.Stream<LiveEvent<Row['Type'], Id['Type']>, LiveError>, LiveError, Scope.Scope>;
    /** Streams changes for the lifetime of the subscription. */
    readonly live: <P extends Params, Row extends Codec, Id extends Codec, I = Input<P>>(statement: LiveStatement<P, Row, Id>, ...input: InputOf<P, I>) => Stream.Stream<LiveEvent<Row['Type'], Id['Type']>, LiveError>;
    /** Watch the complete result of a read, refreshed by live sources and a timer. */
    readonly watchQuery: WatchQuery;
}
declare const SurrealClient_base: Context.ServiceClass<SurrealClient, "effect-surrealkit/SurrealClient", Client>;
/** The client statements run through, as a service. */
declare class SurrealClient extends SurrealClient_base {
}
/**
 * A client over an SDK connection or session.
 *
 * @example
 * const db = new Surreal();
 * await db.connect(url, { namespace, database, authentication });
 * const client = make(db);
 */
declare const make: (db: Queryable, options?: ClientOptions) => Client;
/** Provides {@link SurrealClient} from an SDK connection or session. */
declare const layer: (db: Queryable, options?: ClientOptions) => Layer.Layer<SurrealClient>;
/** Runs a statement through the {@link SurrealClient} in context. */
declare const run: <P extends Params, R extends Codec, Throws extends string, Unique extends string = never, I = Input<P>>(statement: Statement<P, R, Throws, Unique>, ...args: RunArgs<P, I>) => Effect.Effect<R["Type"], StatementError<Throws, Unique>, SurrealClient>;
/** Runs statements atomically through the {@link SurrealClient} in context. */
declare const transaction: <const S extends ReadonlyArray<unknown>>(statements: BoundStatements<S>, options?: RunOptions) => Effect.Effect<Results<S>, StatementError<ThrownByAny<S>, UniqueIndexesOfAny<S>>, SurrealClient>;
/** Sends a pipeline through the client in context. */
declare const pipeline: <const S extends ReadonlyArray<unknown>>(statements: BoundStatements<S>, options?: PipelineOptions) => Effect.Effect<PipelineResults<S>, StatementEncodeError | StatementScopeError | StatementRequestError, SurrealClient>;
/** Runs an effect with a transaction-bound client in context. */
declare const withTransaction: <A, E, R>(effect: Effect.Effect<A, E, R>, options?: TransactionOptions) => Effect.Effect<A, E | TransactionError, R | SurrealClient>;
/** Streams rows through the client in context. */
declare const stream: <P extends Params, Row extends Codec, T extends string, U extends string = never, I = Input<P>>(statement: Statement<P, Schema.$Array<Row>, T, U>, ...input: InputOf<P, I>) => Stream.Stream<Row["Type"], StatementError<T, U> | StatementUnsupported, SurrealClient>;
/** Observes a finite read through the {@link SurrealClient} in context. */
declare const watchQuery: <P extends Params, R extends Codec, T extends string, U extends string = never, I = Input<P>>(statement: Statement<P, R, T, U>, options: WatchQueryOptions, ...input: InputOf<P, I>) => Stream.Stream<WatchQueryState<R["Type"]>, WatchQueryError<T, U>, SurrealClient>;

/** The names of the bindings whose decoded values are lists. */
type ListBindingsOf<P extends Params> = {
    [K in keyof P]-?: [P[K]['Type']] extends [never] ? never : [P[K]['Type']] extends [ReadonlyArray<unknown>] ? K : never;
}[keyof P] & string;
type BulkInput<P extends Params, K extends ListBindingsOf<P>, E, R> = Omit<Input<P>, K> & {
    readonly [Key in K]: Iterable<ElementOf<P[Key]['Type']>> | Stream.Stream<ElementOf<P[Key]['Type']>, E, R>;
};
interface BulkProgress {
    /** Chunks finished so far. */
    readonly chunks: number;
    /** Rows finished so far. */
    readonly rows: number;
    /** Total row count when the collection exposes its size. */
    readonly total: number | undefined;
}
interface BulkOptions<K extends string, Row, E = never, R = never> {
    /** The list binding that holds the rows. */
    readonly over: K;
    /** Rows per request. A positive integer; defaults to 500. */
    readonly chunk?: number;
    /** Commit all chunks together (default) or each chunk separately. */
    readonly atomic?: boolean;
    /** Called with the original rows before sending each chunk. Its failure stops the write. */
    readonly beforeChunk?: (chunk: {
        readonly index: number;
        readonly rows: ReadonlyArray<Row>;
    }) => Effect.Effect<void, E, R>;
    /** Called once each chunk is acknowledged. */
    readonly onProgress?: (progress: BulkProgress) => Effect.Effect<void, never, R>;
    /** Retry the whole atomic write or the conflicting non-atomic chunk. */
    readonly retry?: Schedule.Schedule<unknown, StatementConflict>;
    readonly unsafeSkipValueCheck?: boolean;
}
interface BulkSummary<A> {
    readonly rows: number;
    readonly chunks: number;
    /** The decoded result of each chunk, in order. */
    readonly results: ReadonlyArray<A>;
}

export { watchQuery as $, type TransactionClient as A, type Bound as B, type Client as C, type TransactionError as D, type TransactionOptions as E, TransactionOutcomeUnknown as F, WatchQueryClosed as G, type WatchQueryError as H, type InputOf as I, type WatchQueryOptions as J, type WatchQueryState as K, type ListBindingsOf as L, bind as M, bindLive as N, layer as O, type PipelineOptions as P, type Queryable as Q, type Results as R, StatementConflict as S, type ThrownByAny as T, type UniqueIndexesOfAny as U, make as V, type WatchQuery as W, pipeline as X, run as Y, stream as Z, transaction as _, type BoundLive as a, withTransaction as a0, type BoundStatements as b, type BulkOptions as c, type BulkProgress as d, type BulkSummary as e, BulkWriteError as f, type ClientOptions as g, type LiveError as h, type LiveEvent as i, LiveQueryClosed as j, type PipelineResults as k, type RunArgs as l, type RunOptions as m, StatementDecodeError as n, StatementEmptyResult as o, StatementEncodeError as p, type StatementError as q, StatementIndexConflict as r, StatementRecordExists as s, StatementRequestError as t, StatementScopeError as u, StatementThrown as v, StatementUnexpectedThrow as w, StatementUnsupported as x, StatementWriteOutcomeError as y, SurrealClient as z };
