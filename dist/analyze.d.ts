import { Effect } from 'effect';
import { H as HoleDelimiters, A as AnalyzeError, S as StatementModule } from './render-Bv-AmrOy.js';
export { D as DEFAULT_HOLE_DELIMITERS, a as DeclaredDetail, b as DeclaredNames, c as DeclaredTable, R as RenderStatementModulesInput, d as STATEMENTS_MARK, e as StatementModules, f as StatementModulesError, g as StatementProblem, h as StatementScope, i as StatementSourceFile, j as StatementWarning, r as renderStatementModules, k as renderStatementModulesSync } from './render-Bv-AmrOy.js';
import { B as BindingUses } from './uses-Dlr8c45N.js';
export { a as BindingUse } from './uses-Dlr8c45N.js';
import * as effect_Cause from 'effect/Cause';
import * as effect_Types from 'effect/Types';

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
    /**
     * The 1-based position, among the results, of the last top-level
     * statement that is not `BEGIN`, `COMMIT` or `CANCEL`: the result a
     * client decodes. Equal to `slots` without transaction control; 0 for a
     * fragment or a text of only control statements.
     */
    readonly valueSlot: number;
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
    /**
     * The static tables the text reads and writes, each sorted and without
     * duplicates; a table both read and written is in both.
     */
    readonly tables: {
        readonly read: ReadonlyArray<string>;
        readonly written: ReadonlyArray<string>;
    };
    /** The custom functions (`fn::…`) the text calls, as written, sorted. */
    readonly functions: ReadonlyArray<string>;
    /**
     * Some statement's target is not a static table name (a parameter, a
     * function call, a construct the lexer cannot read with certainty), so
     * `tables` may be incomplete.
     */
    readonly openTargets: boolean;
    /**
     * What each free binding is used as, keyed by name without `$`, each
     * list sorted and without duplicates: an argument of a custom function,
     * the key of a `type::record`, or a comparison with (or, in `SET`, an
     * assignment to) a field of the one static table a query targets. Only
     * these patterns are recognised, and nothing is recorded where the lexer
     * is not certain; a binding with no such use is absent.
     */
    readonly uses: BindingUses;
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

/** What a pin needs from a statement. */
interface PinnableStatement {
    readonly name: string;
    readonly sql: string;
}
/** Why the pins could not be rendered; `text` is the printed line. */
interface PinnedStatementProblem {
    readonly kind: 'unnamed' | 'duplicate' | 'path' | 'segment';
    readonly name: string;
    readonly path?: string;
    readonly message: string;
    readonly text: string;
}
declare const PinnedStatementsError_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "PinnedStatementsError";
} & Readonly<A>;
/** Every problem with the statements; `message` holds one `text` per line. */
declare class PinnedStatementsError extends PinnedStatementsError_base<{
    readonly problems: ReadonlyArray<PinnedStatementProblem>;
    readonly message: string;
}> {
}
/** A pin that is not current, at a path relative to the pin directory. */
interface PinnedStatementDrift {
    readonly path: string;
    readonly name?: string;
    readonly kind: 'missing' | 'changed' | 'stale';
}
/**
 * One `.surql` file per statement, sorted by path: the name with each `.`
 * a `/`, plus `.surql`, holding the statement's `sql` and one newline.
 * Throws a {@link PinnedStatementsError} with every unnamed, duplicate,
 * colliding or invalid name. Reads and writes nothing.
 */
declare const renderPinnedStatements: (statements: Iterable<PinnableStatement>) => ReadonlyArray<StatementModule>;
/**
 * How the `.surql` files on disk (paths relative to the pin directory,
 * forward slashes) differ from {@link renderPinnedStatements}: `missing`,
 * `changed` (content compared exactly) or `stale` (no statement). Other
 * files are ignored. Empty when the pins are current.
 */
declare const pinnedStatementProblems: (statements: Iterable<PinnableStatement>, files: ReadonlyArray<StatementModule>) => ReadonlyArray<PinnedStatementDrift>;

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

export { type Analysis, AnalyzeError, type AnalyzeOptions, BindingUses, type Diagnostic, FillError, type FillOptions, type Fills, HoleDelimiters, type PinnableStatement, type PinnedStatementDrift, type PinnedStatementProblem, PinnedStatementsError, StatementModule, type Text, analyze, analyzeSync, fill, pinnedStatementProblems, renderPinnedStatements, text };
