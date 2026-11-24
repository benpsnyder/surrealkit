import { Effect, Context, Layer, Scope } from 'effect';
import { o as StatementError, x as SurrealClient, C as Client, v as StatementUnsupported, Q as Queryable } from './bulk-C5a4VYnE.js';
import { Surreal, SurrealSession } from 'surrealdb';
import * as effect_Cause from 'effect/Cause';
import * as effect_Types from 'effect/Types';
import { P as Params, C as Codec, S as Statement, q as Input } from './expr-CPMgbj5K.js';
import { H as HoleDelimiters } from './lexer-VCZFEQjh.js';
import './live-DwTMzZp0.js';
import './row-CLBe1uWx.js';
import './table-iF6L7xrW.js';
import './uses-BXJXI3if.js';

interface LiveHandle {
    readonly messages: AsyncIterable<{
        readonly action: 'CREATE' | 'UPDATE' | 'DELETE' | 'KILLED';
        readonly id?: unknown;
        readonly value?: unknown;
    }>;
    readonly kill: () => PromiseLike<void>;
}

/**
 * Whether the client still reads an engine's constraint errors: a check to
 * run against a new SurrealDB version before relying on
 * `StatementIndexConflict` and `StatementRecordExists` with it.
 */

/**
 * Whether the client still classifies the engine's constraint errors: it
 * defines the table `effect_surrealkit_constraint_check` with a unique
 * index in the client's database, writes a duplicate value and an id that
 * exists, and removes the table. `indexConflict` and `recordExists` are
 * true when they fail as `StatementIndexConflict` and
 * `StatementRecordExists`; `got` holds what each failed with otherwise
 * (`StatementRequestError` on an engine whose message the client does not
 * read). Run it against a disposable database, such as `memoryLayer`.
 */
declare const checkConstraintErrors: Effect.Effect<{
    readonly indexConflict: boolean;
    readonly recordExists: boolean;
    readonly got: {
        readonly duplicate: string;
        readonly existing: string;
    };
}, StatementError<never, string>, SurrealClient>;

declare const TestingError_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "TestingError";
} & Readonly<A>;
/**
 * A test database could not be started or prepared: `@surrealdb/node` is
 * not installed or did not start, schema text failed, or a record user could
 * not sign up. `cause` is the SDK's or the engine's error.
 */
declare class TestingError extends TestingError_base<{
    readonly message: string;
    readonly cause?: unknown;
}> {
}
declare const IndexExpectationError_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "IndexExpectationError";
} & Readonly<A>;
/**
 * The engine's plan for a statement did not read the index as expected:
 * `expected` says whether it should have, `used` lists the indexes the plan
 * does read, and `plan` is the plan as `EXPLAIN` returned it.
 */
declare class IndexExpectationError extends IndexExpectationError_base<{
    readonly statement: string;
    readonly index: string;
    readonly expected: 'used' | 'unused';
    readonly used: ReadonlyArray<string>;
    readonly plan: unknown;
    readonly message: string;
}> {
}

/**
 * A database for tests: an in-memory engine (`@surrealdb/node`, imported only
 * when one is started), or any connection a test already has, with schema
 * text to load and record users to sign up.
 */

/**
 * What the helpers need from an SDK connection: queries, and new sessions
 * for record users.
 */
type Connection = Pick<Surreal, 'query' | 'transaction' | 'newSession'>;
/** A database a test owns: its connection, scope and client. */
interface Database {
    readonly connection: Connection;
    readonly namespace: string;
    readonly database: string;
    /** A client with the connection's own (root) authentication. */
    readonly client: Client;
    /** Runs SurrealQL schema text (`DEFINE …`) in the database. */
    readonly load: (schema: string) => Effect.Effect<void, TestingError>;
}
declare const TestDatabase_base: Context.ServiceClass<TestDatabase, "effect-surrealkit/testing/TestDatabase", Database>;
/** The test database in context. */
declare class TestDatabase extends TestDatabase_base {
}
/**
 * A {@link Database} over a connection that is already in `namespace` and
 * `database` with the authentication its statements should run with.
 */
declare const fromConnection: (connection: Connection, scope: {
    readonly namespace: string;
    readonly database: string;
}) => Database;
/** {@link TestDatabase} and {@link SurrealClient} over an existing connection. */
declare const layerFrom: (connection: Connection, scope: {
    readonly namespace: string;
    readonly database: string;
}) => Layer.Layer<TestDatabase | SurrealClient>;
interface MemoryOptions {
    /** SurrealQL schema text to load once the database is up. */
    readonly schema?: string;
    /** Default `test`. */
    readonly namespace?: string;
    /** Default `test`. */
    readonly database?: string;
}
/**
 * Starts an in-memory SurrealDB engine in this process and closes it when the
 * scope closes. Each call is a database of its own.
 */
declare const memory: (options?: MemoryOptions) => Effect.Effect<Database, TestingError, Scope.Scope>;
/**
 * {@link TestDatabase} and its {@link SurrealClient} over a fresh in-memory
 * engine, with `options.schema` loaded.
 *
 * @example
 * it.effect('finds an adult', () =>
 *   run(adults, { minimum: 18 }).pipe(
 *     Effect.provide(memoryLayer({ schema: 'DEFINE TABLE person …;' })),
 *   ),
 * );
 */
declare const memoryLayer: (options?: MemoryOptions) => Layer.Layer<TestDatabase | SurrealClient, TestingError>;
/** Loads schema text into the {@link TestDatabase} in context. */
declare const loadSchema: (schema: string) => Effect.Effect<void, TestingError, TestDatabase>;
interface RecordUserOptions {
    /** The `DEFINE ACCESS … TYPE RECORD` to sign up through. */
    readonly access: string;
    /** The variables its `SIGNUP` reads (`$name`, `$pass`, …). */
    readonly variables?: Readonly<Record<string, unknown>>;
}
/** A record user's session and a client that runs statements as it. */
interface RecordUser {
    readonly session: SurrealSession;
    readonly client: Client;
}
/**
 * Signs a new record user up through an access method of the
 * {@link TestDatabase} and returns a client for that session, so a test can
 * prove what a restricted session sees. The session closes with the scope.
 *
 * @example
 * const ann = yield* recordUser({ access: 'user', variables: { name: 'ann' } });
 * const rows = yield* ann.client.run(visible);
 */
declare const recordUser: (options: RecordUserOptions) => Effect.Effect<RecordUser, TestingError, TestDatabase | Scope.Scope>;

/**
 * Schema drift: what a store registry declares, compared with what a live
 * database defines.
 *
 * The statements trust the generated descriptors: an `ENFORCED` relation's
 * endpoints are typed as present, a lookup names a unique index, a search a
 * FULLTEXT or vector index. A database whose schema moved on from the one
 * the descriptors were generated from breaks those promises at run time,
 * so a test can ask for the differences first.
 *
 * It reads `INFO FOR DB STRUCTURE` and `INFO FOR TABLE … STRUCTURE`, which
 * SurrealDB 3.3 and 4.0 answer alike for what is compared here
 * (`test/conformance.test.ts` pins both): each table's `kind` (`NORMAL`,
 * `ANY`, which a table defined without `TYPE` is too, or `RELATION` with its
 * `in` and `out` tables, as the SDK's `Table` values and absent for any
 * table, and `enforced`), and each index's `cols` (field paths as SurrealQL spells
 * them, `tags.*`, `` `odd.name` ``) and `index` (empty for a standard index,
 * otherwise its definition, starting with its kind: `UNIQUE`, `COUNT`,
 * `FULLTEXT`, `HNSW`, `DISKANN`).
 */

/** What the drift check reads of a generated table descriptor. */
interface DeclaredTable {
    readonly name: string;
    /** `normal`, `any` or `relation`, as the emitter writes it. */
    readonly type?: string;
    readonly edge?: {
        readonly in: ReadonlyArray<unknown>;
        readonly out: ReadonlyArray<unknown>;
        readonly enforced: boolean;
    };
    readonly indexes?: {
        readonly [name: string]: {
            readonly type: string;
            readonly columns: ReadonlyArray<ReadonlyArray<string>>;
        };
    };
}
/** What the drift check reads of a generated store registry. */
interface DeclaredStore {
    readonly tables: {
        readonly [name: string]: DeclaredTable;
    };
}
/** One way the live database differs from the store's declarations. */
interface SchemaDifference {
    readonly kind: 'missing-table' | 'table-kind' | 'relation-enforced' | 'relation-endpoints' | 'missing-index' | 'index-kind' | 'index-fields';
    readonly table: string;
    readonly index?: string;
    /** What the descriptors declare, and what the database defines. */
    readonly declared: string;
    readonly live: string;
    readonly message: string;
}
/**
 * The differences between what `store` declares and what the
 * {@link TestDatabase} in context defines, in the store's table order: a
 * declared table the database lacks, a table of another kind, a relation
 * whose `ENFORCED` flag or endpoint tables differ, and a declared index
 * that is missing, of another kind or over other fields. Definitions the
 * store does not declare are not differences. An empty list is a match.
 *
 * @example
 * const differences = yield* schemaDrift(store);
 * expect(differences).toEqual([]);
 */
declare const schemaDrift: (store: DeclaredStore) => Effect.Effect<ReadonlyArray<SchemaDifference>, TestingError, TestDatabase>;

/**
 * Whether the engine plans a `SELECT` through an index, read from its own
 * plan: the statement runs with `EXPLAIN` appended, through the client in
 * context, and nothing it would read is returned.
 *
 * SurrealDB 3.3 and 4.0 answer `SELECT … EXPLAIN` with the same plan
 * format: one root of a tree of `{ operator, attributes, children }` nodes
 * (`SelectProject`, `ProjectValue`, `UnwrapExactlyOne` for `ONLY`), where a node
 * that reads an index (`IndexScan` for `=` and ranges, `ORDER BY` and
 * `LIMIT` pushed into it) names it as `attributes.index`, and a table scan
 * names none. The prefix form `EXPLAIN SELECT …` returns text instead, so
 * it is not used. The plan of each builder shape (projection, `VALUE`,
 * `ONLY`, a condition with an indexed and an unindexed side) is pinned in
 * `test/testing.test.ts` on both engines.
 */

/**
 * The names of the indexes a plan reads: every `attributes.index` in the
 * tree, and `detail.plan.index` of an older planner's
 * `{ operation, detail }` rows, in the order the plan lists them.
 */
declare const indexesOf: (plan: unknown) => ReadonlyArray<string>;
/** The plan of `statement` for `input`, and the indexes it reads. */
declare const explain: <P extends Params, R extends Codec, T extends string, U extends string = never>(statement: Statement<P, R, T, U>, input: Input<P>) => Effect.Effect<{
    readonly plan: unknown;
    readonly indexes: ReadonlyArray<string>;
}, StatementError<T, U>, SurrealClient>;
/**
 * Succeeds when the engine plans `statement` with `input` through the index
 * `index`; fails with an {@link IndexExpectationError} naming the indexes
 * it does read. The statement must be one `SELECT`.
 */
declare const expectIndex: <P extends Params, R extends Codec, T extends string, U extends string = never>(statement: Statement<P, R, T, U>, input: Input<P>, index: string) => Effect.Effect<void, IndexExpectationError | StatementError<T, U>, SurrealClient>;
/** Succeeds when the engine's plan of `statement` does not read `index`. */
declare const expectNoIndex: <P extends Params, R extends Codec, T extends string, U extends string = never>(statement: Statement<P, R, T, U>, input: Input<P>, index: string) => Effect.Effect<void, IndexExpectationError | StatementError<T, U>, SurrealClient>;

/**
 * A scripted client: canned results per statement name, with no engine.
 *
 * It is the real client over a scripted transport, so everything the client
 * checks before sending still runs: each binding through its codec, the
 * value check, the scope rules of a transaction, the number of results and
 * NONE in all but the last, and the result codec. What the SDK refuses on
 * its own before sending a transaction is refused the same way, with its
 * message: `BEGIN`, `COMMIT` or `CANCEL` in the text, and a `RETURN`
 * followed by another statement.
 */

declare const ReplyTypeId = "~effect-surrealkit/testing/Reply";
type LiveMessage = LiveHandle['messages'] extends AsyncIterable<infer Message> ? Message : never;
type Feature = StatementUnsupported['feature'];
/** What a scripted statement answers. */
type Reply = {
    readonly [ReplyTypeId]: 'result';
    /** The last result, as the SDK would return it (NONE is `undefined`). */
    readonly value: unknown;
} | {
    readonly [ReplyTypeId]: 'throw';
    readonly message: string;
} | {
    readonly [ReplyTypeId]: 'conflict';
} | {
    readonly [ReplyTypeId]: 'duplicate';
    readonly index: string;
} | {
    readonly [ReplyTypeId]: 'exists';
} | {
    readonly [ReplyTypeId]: 'failure';
    readonly message: string;
} | {
    readonly [ReplyTypeId]: 'events';
    readonly messages: ReadonlyArray<LiveMessage>;
} | {
    readonly [ReplyTypeId]: 'unsupported';
    readonly feature: Feature;
};
/** The statement's last result is `value`; the ones before it are NONE. */
declare const result: (value: unknown) => Reply;
/** The statement raises `THROW message`, as the engine reports it. */
declare const thrown: (message: string) => Reply;
/** The request conflicts with another transaction. */
declare const conflict: () => Reply;
/**
 * The write would duplicate a value of the unique index `index`, as
 * SurrealDB 3.3 and 4.0 report it. A statement that declares the index in
 * `uniqueIndexes` fails with `StatementIndexConflict`; any other with
 * `StatementRequestError`.
 */
declare const indexConflict: (index: string) => Reply;
/** The write creates a record whose id already exists. */
declare const recordExists: () => Reply;
/** The request fails, as a SurrealQL or transport error would. */
declare const failure: (message: string) => Reply;
/** The events a scripted live query delivers, in order. */
declare const events: (messages: ReadonlyArray<LiveMessage>) => Reply;
/** The scripted connection refuses a feature. For begin, use the script entry named begin. */
declare const unsupported: (feature: Feature) => Reply;
/**
 * The script: for each statement name, a reply, a plain value (the same as
 * `result(value)`), or a function of the statement's encoded bindings that
 * returns either. The begin, commit, cancel and kill entries also script
 * their corresponding lifecycle operations when a client uses them.
 */
type Script = Readonly<Record<string, unknown | ((bindings: Readonly<Record<string, unknown>>) => unknown)>>;
/** One request the scripted client answered. */
interface Call {
    /** The statement's name. */
    readonly statement: string;
    /** Its encoded bindings under the statement's own names. */
    readonly bindings: Readonly<Record<string, unknown>>;
    /** The transaction it was sent in, when it was. */
    readonly transaction?: string;
    /** The pipeline it was sent in, when it was. */
    readonly pipeline?: string;
    /** The interactive transaction it was sent in, when it was. */
    readonly interactive?: string;
    /** Lifecycle operations use their name in statement, or the live query's name for kill. */
    readonly operation?: 'begin' | 'commit' | 'cancel' | 'kill';
}
/** A client over a script, and the requests it answered, in order. */
interface FakeClient extends Client {
    readonly calls: ReadonlyArray<Call>;
}
/**
 * A client that answers each statement by its name from the script, and
 * records every request in calls. A missing reply is a request failure.
 */
declare const fake: (script: Script) => FakeClient;
/** Provides {@link SurrealClient} as a scripted client. */
declare const fakeLayer: (script: Script) => Layer.Layer<SurrealClient>;

/**
 * Injects the SDK's transaction conflict into the first matching requests.
 * None of an injected request reaches the engine. For slot responses, the
 * first matching statement receives the conflict and all other slots report
 * that they did not execute. The count includes matching requests passed
 * through after the injections are exhausted.
 */
declare const conflictingSession: <S extends Queryable>(session: S, options: {
    readonly marker: string;
    readonly times: number;
}) => {
    readonly session: S;
    readonly matched: {
        readonly count: number;
    };
};

/** A file by the name its problems carry, and its text. */
interface VerifyFile {
    readonly name: string;
    readonly sql: string;
}
interface VerifyInput {
    /**
     * The scopes as `renderStatementModules` takes them: each file is named
     * `<scope>/<name>.surql` in what is reported.
     */
    readonly scopes: ReadonlyArray<{
        readonly name: string;
        readonly files: ReadonlyArray<VerifyFile>;
    }>;
    /**
     * SurrealQL schema files, run first in this order, each named as given.
     * Optional: the parse and the result count do not depend on it.
     */
    readonly schema?: ReadonlyArray<VerifyFile>;
    /** The literal delimiters of a hole; default `__` and `__`. */
    readonly holes?: HoleDelimiters;
    /** How long one text or schema file may run; default 10. */
    readonly timeoutSeconds?: number;
}
/** One problem: where it is, when the engine says, and what it is. */
interface VerifyProblem {
    readonly file: string;
    readonly line?: number;
    readonly column?: number;
    readonly text: string;
    /** `<file>[:<line>:<column>]: <text>`. */
    readonly message: string;
}
/** What a passing check sent, and the engine it ran on. */
interface Verification {
    /** As `@surrealdb/node` reports it, e.g. `4.0.1`. */
    readonly engine: string;
    /** The complete texts sent, by file name. */
    readonly sent: ReadonlyArray<string>;
    /** The fragments and templates, which cannot be sent as they stand. */
    readonly notSent: ReadonlyArray<string>;
}
declare const StatementVerificationError_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "StatementVerificationError";
} & Readonly<A>;
/** The engine refused or miscounted a text, or a schema file failed. */
declare class StatementVerificationError extends StatementVerificationError_base<{
    readonly engine: string;
    readonly problems: ReadonlyArray<VerifyProblem>;
    readonly message: string;
}> {
}
/**
 * Checks authored texts on a discarded in-memory engine (`@surrealdb/node`,
 * an optional peer, imported only here): loads `schema`, then sends each
 * complete text once with no bindings, in scope and file order, on one
 * database. Fails with {@link StatementVerificationError} on a parse error,
 * a result count other than the analyzer's `slots`, a text that does not
 * finish within `timeoutSeconds`, or a schema file that does not apply;
 * with `TestingError` when the engine is not installed or does not start.
 *
 * The texts run: writes land in the discarded database, and the engine
 * denies `http::` functions, network targets and scripting, so nothing a
 * text does reaches outside it.
 */
declare const verifyStatements: (input: VerifyInput) => Effect.Effect<Verification, StatementVerificationError | TestingError>;

export { type Call, type Connection, type Database, type DeclaredStore, type DeclaredTable, type FakeClient, IndexExpectationError, type MemoryOptions, type RecordUser, type RecordUserOptions, type Reply, type SchemaDifference, type Script, StatementVerificationError, TestDatabase, TestingError, type Verification, type VerifyFile, type VerifyInput, type VerifyProblem, checkConstraintErrors, conflict, conflictingSession, events, expectIndex, expectNoIndex, explain, failure, fake, fakeLayer, fromConnection, indexConflict, indexesOf, layerFrom, loadSchema, memory, memoryLayer, recordExists, recordUser, result, schemaDrift, thrown, unsupported, verifyStatements };
