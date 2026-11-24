import { Effect } from 'effect';
import { H as HoleDelimiters } from './lexer-VCZFEQjh.js';
export { D as DEFAULT_HOLE_DELIMITERS } from './lexer-VCZFEQjh.js';
import { B as BindingUses, F as FieldReference } from './uses-D--Wj5lt.js';
export { a as BindingUse } from './uses-D--Wj5lt.js';
import * as effect_Cause from 'effect/Cause';
import * as effect_Types from 'effect/Types';
import { D as DeclaredNames } from './check-BzUPD3DO.js';
export { a as DeclaredDetail, b as DeclaredTable, S as SchemaProblem, c as SchemaProblemsOptions, d as SchemaText, s as schemaProblems } from './check-BzUPD3DO.js';
export { F as FillError, a as FillOptions, b as Fills, T as Text, c as TextHoleScope, d as TextHoleScopes, f as fill, t as text } from './text-L6LzniE5.js';

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
 * The fields a `SELECT` projects from the one static table it reads: each
 * bare field name and `*`, in the patterns a lexer can read with certainty.
 * Anything else records nothing: refuse rather than guess.
 */

/** One projected field (`*` for all of them), at the 1-based line of its name. */
interface ProjectedField {
    readonly table: string;
    readonly field: string;
    readonly line: number;
}

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
    /**
     * The comments before the first token, as prose: each line without its
     * `--`, `//` or `#` and one space after it, a block comment without
     * `/*`, `*\/` and a leading `*` margin, a blank line between paragraphs.
     * Empty when the text opens with a token.
     */
    readonly comment: string;
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
     * assignment to) a field of the one static table a query targets (never
     * a `SELECT` with a subquery in its `FROM`, whose rows are the
     * subquery's results). Only these patterns are recognised, and nothing
     * is recorded where the lexer is not certain; a binding with no such use
     * is absent. A comparison or assignment in a statement in a block is not
     * a use (the statement may not run for every value), and its field name
     * is in `fields`. Nor is an assignment in a parenthesised query unless
     * that query is the whole value of a top-level statement (`(UPDATE …);`,
     * `LET $r = (UPDATE …);`, `RETURN (UPDATE …);`): a condition around it
     * (`IF … THEN`, `AND`, `OR`, an outer `WHERE`, a closure) can keep NONE
     * from reaching the field; nor in a query with a `WHERE` of its own,
     * which can skip every record (`UPDATE t SET f = $x WHERE $x != NONE`).
     */
    readonly uses: BindingUses;
    /**
     * The fields each `SELECT` projects from the one static table it reads
     * (a table name, a record id, `type::record`, `type::thing` or
     * `type::table` with a literal table, or a local the text fixes to one
     * table with `LET $x = type::record('t', …)`, after an optional `ONLY`, and
     * nothing after it but the query's clauses): each projected item that
     * is a bare field name, or `*`, sorted by line, table and field, without
     * duplicates. A
     * `SELECT VALUE`, an `OMIT`, two targets, an open target and any item
     * that is not a bare name or `*` (a call, a path, an expression, an
     * alias, a graph step, a subquery) record nothing; a parenthesised
     * subquery is a query of its own, and a statement in a block (the body
     * of `IF`, `ELSE`, `FOR`, a function or a bare `{ … }`) is read like a
     * top-level one.
     */
    readonly projected: ReadonlyArray<ProjectedField>;
    /**
     * The field names each query compares in its `WHERE` (role `compare`)
     * or assigns in its `SET` (role `assign`), where that is not a binding
     * use in `uses`: a bare field of the one static table the query
     * targets (never in a `SELECT` with a subquery in its `FROM`, which is
     * read as a query of its own), read as `uses` reads one, on either side
     * of `=`, `==`, `!=`, `<`, `<=`, `>` or `>=` whatever the other operand,
     * or the target of
     * `field = <literal>` in `UPDATE`, `UPSERT` or `CREATE` when the
     * literal is never NONE; in top-level statements, statements in blocks
     * and parenthesised subqueries; a local the text fixes to one table is
     * a target of that table here. `UNSET` is not read. Sorted by line,
     * table, field and role, without duplicates.
     */
    readonly fields: ReadonlyArray<FieldReference>;
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

/** First line of every module {@link renderStatementModules} renders. */
declare const STATEMENTS_MARK = "// Generated by effect-surrealkit from SurrealQL files. Do not edit.";
/** One authored text: `<scope>/<name>.surql`, `name` without `.surql`. */
interface StatementSourceFile {
    readonly name: string;
    readonly sql: string;
}
/** One scope: a directory of texts that becomes `<name>/statements.ts`. */
interface StatementScope {
    readonly name: string;
    readonly files: ReadonlyArray<StatementSourceFile>;
    /**
     * The tables and custom functions the schema declares. When given, a
     * table or function a file of this scope names that is not declared, and
     * that the same text does not create with `DEFINE TABLE` or `DEFINE
     * FUNCTION`, is a problem. Names behind an open target are not checked.
     */
    readonly declared?: DeclaredNames;
}
interface RenderStatementModulesInput {
    readonly scopes: ReadonlyArray<StatementScope>;
    /** Extension of the index module's imports; default `.js`. */
    readonly importExtension?: '.js' | '.ts';
    /** The literal delimiters of a hole; default `__` and `__`. */
    readonly holes?: HoleDelimiters;
}
/** A rendered module, at a path relative to the output directory. */
interface StatementModule {
    readonly path: string;
    readonly content: string;
}
/** An analyzer warning on one file. */
interface StatementWarning {
    readonly scope: string;
    readonly file: string;
    readonly line: number;
    readonly column: number;
    readonly code: string;
    readonly message: string;
    /** `<scope>/<file>.surql:<line>:<column>: <message> (<code>)`. */
    readonly text: string;
}
/**
 * Why a module could not be rendered. `analysis`: the analyzer rejected the
 * file (`line`, `column` and `code` set). `name`: the file name is not an
 * identifier, is a reserved word, or differs only in case from another in
 * its scope. `scope`: the same for the scope name (`file` absent).
 * `undeclared`: the file names a table or function its scope's `declared`
 * names do not include (`line` of the first use set), or, with `declared`
 * detail, a binding used as a field the table does not declare or accept,
 * or as an argument beyond the function's arguments (`line` of the use).
 */
interface StatementProblem {
    readonly kind: 'analysis' | 'name' | 'scope' | 'undeclared';
    readonly scope: string;
    readonly file?: string;
    readonly line?: number;
    readonly column?: number;
    readonly code?: string;
    readonly message: string;
    /** The problem as the `statements` command prints it. */
    readonly text: string;
}
declare const StatementModulesError_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "StatementModulesError";
} & Readonly<A>;
/** Every problem with the input; `message` holds one `text` per line. */
declare class StatementModulesError extends StatementModulesError_base<{
    readonly problems: ReadonlyArray<StatementProblem>;
    readonly message: string;
}> {
}
interface StatementModules {
    readonly files: ReadonlyArray<StatementModule>;
    readonly warnings: ReadonlyArray<StatementWarning>;
}
/**
 * {@link renderStatementModules}, throwing its
 * {@link StatementModulesError}.
 */
declare const renderStatementModulesSync: (input: RenderStatementModulesInput) => StatementModules;
/**
 * Renders the typed statement modules for these scopes: `<scope>/statements.ts`
 * for each scope, then `index.ts`, exactly as `effect-surrealkit statements`
 * writes them, with the analyzer's warnings. Fails with every problem: a
 * file the analyzer rejects, an invalid, reserved or case-colliding file
 * name, an invalid scope name, and, for a scope with `declared` names, a
 * table or function the schema does not declare. Reads and writes nothing.
 */
declare const renderStatementModules: (input: RenderStatementModulesInput) => Effect.Effect<StatementModules, StatementModulesError>;

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

export { type Analysis, AnalyzeError, type AnalyzeOptions, BindingUses, DeclaredNames, type Diagnostic, FieldReference, HoleDelimiters, type HoleScope, type PinnableStatement, type PinnedStatementDrift, type PinnedStatementProblem, PinnedStatementsError, type ProjectedField, type RenderStatementModulesInput, STATEMENTS_MARK, type StatementModule, type StatementModules, StatementModulesError, type StatementProblem, type StatementScope, type StatementSourceFile, type StatementWarning, analyze, analyzeSync, pinnedStatementProblems, renderPinnedStatements, renderStatementModules, renderStatementModulesSync };
