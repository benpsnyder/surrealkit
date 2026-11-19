import { Effect } from 'effect';
import * as effect_Cause from 'effect/Cause';
import * as effect_Types from 'effect/Types';

declare const AnalyzeError_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "AnalyzeError";
} & Readonly<A>;
/** Why a text could not be analysed, and where (1-based line and column). */
declare class AnalyzeError extends AnalyzeError_base<{
    readonly code: string;
    readonly message: string;
    readonly line: number;
    readonly column: number;
    readonly offset: number;
}> {
}
/**
 * What a template hole looks like: a name of capitals, digits and
 * underscores, starting with a capital, between two literal delimiters
 * (`__NAME__` by default). Delimiters are matched as text, never compiled.
 */
interface HoleDelimiters {
    readonly open: string;
    readonly close: string;
}
/** The default delimiters: `__NAME__`. */
declare const DEFAULT_HOLE_DELIMITERS: HoleDelimiters;

/**
 * What an authored SurrealQL text does with variables, results and `THROW`s,
 * derived from its tokens: the facts a {@link Part} declares.
 */

interface Diagnostic {
    readonly severity: 'error' | 'warning';
    readonly code: string;
    readonly message: string;
    readonly line: number;
    readonly column: number;
    readonly offset: number;
}
interface AnalyzeOptions {
    /**
     * The literal delimiters of a hole, outside strings and comments, around
     * a name matching `[A-Z][A-Z0-9_]*`. Default `__` and `__`.
     */
    readonly holes?: HoleDelimiters;
}
interface Analysis {
    /**
     * `part`: every statement ends with `;`. `fragment`: a single
     * unterminated expression or block, which returns nothing on its own and
     * may only fill a hole.
     */
    readonly kind: 'part' | 'fragment';
    /** The text without whitespace and comments after its last token. */
    readonly sql: string;
    /** `$names` read and not defined earlier in scope, sorted, without `$`. */
    readonly free: ReadonlyArray<string>;
    /** Names a top-level `LET` defines, sorted. */
    readonly defines: ReadonlyArray<string>;
    /** Results: one per terminated top-level statement. */
    readonly slots: number;
    /** String-literal `THROW` messages, sorted. */
    readonly throws: ReadonlyArray<string>;
    /** The lines each message is thrown on. */
    readonly throwsAt: Readonly<Record<string, ReadonlyArray<number>>>;
    /** Hole names, sorted. A text with holes is a template. */
    readonly holes: ReadonlyArray<string>;
    /**
     * True when the text has holes: what fills them can read or define
     * variables, so `free` and `defines` hold only for the text as written.
     */
    readonly provisional: boolean;
    /** The text writes its own `BEGIN`, `COMMIT` or `CANCEL`. */
    readonly transactional: boolean;
    /**
     * The text can change data or schema: `CREATE`, `INSERT`, `UPDATE`,
     * `UPSERT`, `DELETE`, `RELATE`, `DEFINE`, `REMOVE` or `ALTER` starts a
     * statement or a subquery somewhere in it, outside strings and comments.
     */
    readonly writes: boolean;
    readonly diagnostics: ReadonlyArray<Diagnostic>;
}
/** {@link analyze}, throwing its {@link AnalyzeError}. */
declare const analyzeSync: (sql: string, options?: AnalyzeOptions) => Analysis;
/**
 * Analyses one SurrealQL text: the `$names` it reads and does not define,
 * the names it `LET`s, how many results it returns, what it can `THROW` and
 * which holes it leaves. Fails with the line and column of anything it
 * cannot classify. Errors in `diagnostics` (a `LET $auth`, a `RETURN` inside
 * `BEGIN … COMMIT` followed by another statement) do not fail the analysis;
 * the `statements` command refuses them.
 */
declare const analyze: (sql: string, options?: AnalyzeOptions) => Effect.Effect<Analysis, AnalyzeError>;

/** A fragment or template, as the `statements` command writes it. */
interface Text<Holes extends string = string> {
    readonly kind: 'part' | 'fragment';
    readonly name?: string;
    readonly source?: string;
    readonly sql: string;
    readonly holes: ReadonlyArray<Holes>;
    /** As written; provisional while the text has holes. */
    readonly free: ReadonlyArray<string>;
    /** As written; provisional while the text has holes. */
    readonly defines: ReadonlyArray<string>;
    readonly provisional: boolean;
    readonly slots: number;
    readonly throws: ReadonlyArray<string>;
    readonly throwsAt?: Readonly<Record<string, ReadonlyArray<number>>>;
}
/** Declares a {@link Text}, keeping its hole names as literal types. */
declare const text: <const Holes extends string = never>(options: Text<Holes>) => Text<Holes>;
declare const FillError_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "FillError";
} & Readonly<A>;
/** Why holes could not be filled. */
declare class FillError extends FillError_base<{
    readonly code: string;
    readonly message: string;
    readonly hole?: string;
}> {
}
interface FillOptions {
    /** The literal delimiters of a hole; default `__` and `__`. */
    readonly holes?: HoleDelimiters;
    /** Accept fills that still have holes of their own. Default false. */
    readonly allowHoles?: boolean;
}
/** The fills a template takes: one per hole when its holes are known. */
type Fills<T> = T extends Text<infer Holes> ? string extends Holes ? Readonly<Record<string, string | Text>> : {
    readonly [K in Holes]: string | Text;
} : Readonly<Record<string, string | Text>>;
/**
 * Substitutes every hole of `template` and returns the new text. Holes are
 * only recognised outside strings and comments. Each fill must lex on its
 * own with balanced brackets, so it cannot close or open anything around
 * its hole; leading and trailing whitespace and comments of a fill are
 * dropped, so a trailing line comment cannot swallow the rest of the line.
 *
 * Fails on a fill for a hole the template does not have, a hole without a
 * fill, or a fill that still has holes (unless `allowHoles`). The result is
 * a new text: analyse it to know what it reads, defines and returns.
 */
declare const fill: <const T extends string | Text>(template: T, fills: Fills<T>, options?: FillOptions) => Effect.Effect<string, FillError>;

export { type Analysis, AnalyzeError, type AnalyzeOptions, DEFAULT_HOLE_DELIMITERS, type Diagnostic, FillError, type FillOptions, type Fills, type HoleDelimiters, type Text, analyze, analyzeSync, fill, text };
