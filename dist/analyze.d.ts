import { Effect } from 'effect';
import { H as HoleDelimiters, A as AnalyzeError } from './lexer-BEI0-7pQ.js';
export { D as DEFAULT_HOLE_DELIMITERS } from './lexer-BEI0-7pQ.js';
import { B as BindingUses } from './uses-BXJXI3if.js';
export { a as BindingUse } from './uses-BXJXI3if.js';
import * as effect_Cause from 'effect/Cause';
import * as effect_Types from 'effect/Types';
import { S as StatementModule } from './render-CvQvIZRb.js';
export { D as DeclaredDetail, a as DeclaredNames, b as DeclaredTable, R as RenderStatementModulesInput, c as STATEMENTS_MARK, d as StatementModules, e as StatementModulesError, f as StatementProblem, g as StatementScope, h as StatementSourceFile, i as StatementWarning, r as renderStatementModules, j as renderStatementModulesSync } from './render-CvQvIZRb.js';
export { F as FillError, a as FillOptions, b as Fills, T as Text, c as TextHoleScope, d as TextHoleScopes, f as fill, t as text } from './text-Dh74bkFB.js';

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
    /**
     * For each hole, what the text around it does with names (empty for a
     * text without holes): `bound`, the names visible at every occurrence of
     * the hole (a `LET` before it in an enclosing block, a closure, `FOR` or
     * function parameter), so a fill that reads one of them does not read a
     * binding; and `binds`, the free names of this text that a `LET` placed
     * at the hole would define for every read of them, so a fill of
     * statements that `LET`s one of them takes it out of the free names
     * (empty unless the hole starts a statement).
     */
    readonly holeScopes: Readonly<Record<string, HoleScope>>;
    readonly diagnostics: ReadonlyArray<Diagnostic>;
}
/** What the text around one hole does with names; see {@link Analysis}. */
interface HoleScope {
    readonly bound: ReadonlyArray<string>;
    readonly binds: ReadonlyArray<string>;
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

export { type Analysis, AnalyzeError, type AnalyzeOptions, BindingUses, type Diagnostic, HoleDelimiters, type HoleScope, type PinnableStatement, type PinnedStatementDrift, type PinnedStatementProblem, PinnedStatementsError, StatementModule, analyze, analyzeSync, pinnedStatementProblems, renderPinnedStatements };
