import { Schema } from 'effect';
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

export { type AnyStatement as A, type Codec as C, type Input as I, type NoParams as N, type Params as P, type Result as R, type Statement as S, type ThrowSite as T, type Simplify as a, type CheckedInput as b, StatementTypeId as c, type Thrown as d, isStatement as i, make as m };
