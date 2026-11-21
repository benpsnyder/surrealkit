export { B as Bound, a as BoundStatements, b as BulkOptions, c as BulkProgress, d as BulkSummary, e as BulkWriteError, C as Client, I as InputOf, L as ListBindingsOf, f as LiveError, g as LiveEvent, h as LiveQueryClosed, P as PipelineOptions, i as PipelineResults, Q as Queryable, R as Results, j as RunArgs, k as RunOptions, S as StatementConflict, l as StatementDecodeError, m as StatementEmptyResult, n as StatementEncodeError, o as StatementError, p as StatementRequestError, q as StatementScopeError, r as StatementThrown, s as StatementUnexpectedThrow, t as StatementUnsupported, u as StatementWriteOutcomeError, v as SurrealClient, T as ThrownByAny, w as TransactionClient, x as TransactionError, y as TransactionOptions, z as TransactionOutcomeUnknown, A as bind, D as layer, E as make, F as pipeline, G as run, H as stream, J as transaction, K as withTransaction } from './bulk-CRnalAeb.js';
import { Metric, Duration, Effect } from 'effect';
import 'surrealdb';
import './expr-Bt9oR1pC.js';
import './table-iF6L7xrW.js';
import './uses-BXJXI3if.js';
import './live-n0zkmyK9.js';
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
