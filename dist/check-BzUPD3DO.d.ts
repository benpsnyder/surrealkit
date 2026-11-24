import { H as HoleDelimiters } from './lexer-VCZFEQjh.js';

/**
 * The checks that compare an authored text with a schema's declared names:
 * a table or custom function the schema does not declare, a projected,
 * compared or assigned field a `SCHEMAFULL` table does not declare, and a
 * binding use that does not resolve. {@link checkText} is the one
 * implementation: `renderStatementModules` calls it for each file of a scope
 * with `declared`, and {@link schemaProblems} calls it for named texts
 * without rendering anything. Pure and host-neutral.
 */

/** The tables and custom functions (`fn::…`) a schema declares. */
interface DeclaredNames {
    readonly tables: ReadonlyArray<string>;
    readonly functions: ReadonlyArray<string>;
    /**
     * What the schema says about each table and function, as
     * `declaredNames(document)` (`effect-surrealkit/emitter`) reads it. When
     * given, every use of a binding the analyzer finds must resolve (a field
     * the table declares or accepts, an argument the function takes), and
     * each part states, in `binds`, the simple kind of each binding whose
     * every use resolves to the same one (`option<K>` when every use accepts
     * NONE).
     */
    readonly detail?: DeclaredDetail;
}
/** The schema detail of {@link DeclaredNames}: kinds as SurrealQL text. */
interface DeclaredDetail {
    readonly tables: Readonly<Record<string, DeclaredTable>>;
    /** The kind text of each argument of each function, in order. */
    readonly functions: Readonly<Record<string, ReadonlyArray<string>>>;
}
interface DeclaredTable {
    /**
     * Each declared field (its path joined with `.`): its kind text, and
     * `rejectsNone` when the engine rejects NONE assigned to it in every
     * statement that can assign it (`CREATE`, `UPDATE` and `UPSERT`): a
     * top-level field whose kind excludes NONE, without `DEFAULT`, `VALUE`
     * or `COMPUTED`. Left out, nothing is refused for the field.
     */
    readonly fields: Readonly<Record<string, {
        readonly kind?: string;
        readonly rejectsNone?: boolean;
    }>>;
    /**
     * The table accepts fields it does not declare: it is schemaless, or a
     * view, whose fields come from its SELECT.
     */
    readonly acceptsUndeclared: boolean;
    /** The kind text of the id key, when the schema declares one. */
    readonly idKey?: string;
}
/** One named text for {@link schemaProblems}. */
interface SchemaText {
    /** Any non-empty string; it only labels the text's problems. */
    readonly name: string;
    readonly sql: string;
}
/**
 * A problem {@link schemaProblems} found in one text. `code` is
 * `undeclaredTable`, `undeclaredFunction`, `undeclaredField` or
 * `extraArgument` for the schema checks (`line` of the use, no `column`),
 * the analyzer's code with `line` and `column` for a text it refuses or an
 * error it diagnoses, or `unnamed` for a text whose name is empty.
 */
interface SchemaProblem {
    readonly name: string;
    readonly line: number;
    readonly column?: number;
    readonly code: string;
    readonly message: string;
    /** `<name>:<line>[:<column>]: <message> (<code>)`. */
    readonly text: string;
}
interface SchemaProblemsOptions {
    /** The literal delimiters of a hole; default `__` and `__`. */
    readonly holes?: HoleDelimiters;
}
/**
 * The problems `renderStatementModules` reports for a scope with these
 * `declared` names, for named texts, rendering nothing: a table or custom
 * function the schema does not declare and the text does not define, and,
 * with `declared.detail`, a projected, compared or assigned field a
 * `SCHEMAFULL` table does not declare and a binding used as a field or
 * argument that does not resolve; also a text the analyzer refuses and an
 * error it diagnoses, so one bad text never hides the others. A name is any
 * non-empty string. A template is checked as written, never filled; see
 * {@link checkText}. Sorted by name, line and column, without duplicates.
 * Reads and writes nothing.
 */
declare const schemaProblems: (texts: Iterable<SchemaText>, declared: DeclaredNames, options?: SchemaProblemsOptions) => ReadonlyArray<SchemaProblem>;

export { type DeclaredNames as D, type SchemaProblem as S, type DeclaredDetail as a, type DeclaredTable as b, type SchemaProblemsOptions as c, type SchemaText as d, schemaProblems as s };
