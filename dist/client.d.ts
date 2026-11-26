export { B as Bound, a as BoundLive, b as BoundStatements, c as BulkOptions, d as BulkProgress, e as BulkSummary, f as BulkWriteError, C as Client, g as ClientOptions, I as InputOf, L as ListBindingsOf, h as LiveError, i as LiveEvent, j as LiveQueryClosed, P as PipelineOptions, k as PipelineResults, Q as Queryable, R as Results, l as RunArgs, m as RunOptions, S as StatementConflict, n as StatementDecodeError, o as StatementEmptyResult, p as StatementEncodeError, q as StatementError, r as StatementIndexConflict, s as StatementRecordExists, t as StatementRequestError, u as StatementScopeError, v as StatementThrown, w as StatementUnexpectedThrow, x as StatementUnsupported, y as StatementWriteOutcomeError, z as SurrealClient, T as ThrownByAny, A as TransactionClient, D as TransactionError, E as TransactionOptions, F as TransactionOutcomeUnknown, U as UniqueIndexesOfAny, W as WatchQuery, G as WatchQueryClosed, H as WatchQueryError, J as WatchQueryOptions, K as WatchQueryState, M as bind, N as bindLive, O as layer, V as make, X as pipeline, Y as run, Z as stream, _ as transaction, $ as watchQuery, a0 as withTransaction } from './bulk-Pth8MGan.js';
import { Metric, Duration, Effect } from 'effect';
import 'surrealdb';
import './expr-99eIx780.js';
import './table-iF6L7xrW.js';
import './uses-D--Wj5lt.js';
import './live-DS7CDSd5.js';
import './row-CLBe1uWx.js';
import 'effect/Cause';
import 'effect/Types';

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
type RequestKind = 'run' | 'transaction' | 'pipeline' | 'stream' | 'bulk' | 'interactive';

interface StatementTiming {
    readonly statement: string;
    /** The engine's duration summed across the statement's slots, when available. */
    readonly server?: Duration.Duration;
    /** Number of rows in a list result. */
    readonly rows?: number;
}
interface RequestTiming {
    readonly kind: RequestKind;
    /** The span name of the request. */
    readonly name: string;
    /** Transport attempts by the client, including its own conflict retries. */
    readonly sends: number;
    readonly encode: Duration.Duration;
    /** Elapsed time of the last transport attempt, including any retries inside the SDK. */
    readonly wait: Duration.Duration;
    /** Sum of the statement durations, when available. */
    readonly server?: Duration.Duration;
    readonly decode: Duration.Duration;
    readonly total: Duration.Duration;
    readonly statements: ReadonlyArray<StatementTiming>;
}
/** Runs an effect and collects its request timings in completion order. */
declare const timed: <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<readonly [A, ReadonlyArray<RequestTiming>], E, R>;

export { type RequestTiming, type StatementTiming, metrics, timed };
