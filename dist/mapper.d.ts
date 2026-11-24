/**
 * What a template hole looks like: a name of capitals, digits and
 * underscores, starting with a capital, between two literal delimiters
 * (`__NAME__` by default). Delimiters are matched as text, never compiled.
 */
interface HoleDelimiters {
    readonly open: string;
    readonly close: string;
}

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

/**
 * The module one `.surql` file yields when it is imported: what
 * `renderStatementModules` renders for a scope that holds only that file.
 * The scope is the file's parent directory and the constant is named after
 * the file, as with `effect-surrealkit statements`. Pure: the host reads the
 * file and passes its text.
 */

/** Where a `.surql` file sits: its scope (parent directory) and name. */
interface SurqlFile {
    /** The name of the file's parent directory. */
    readonly scope: string;
    /** The file name without `.surql`. */
    readonly name: string;
    readonly sql: string;
}
interface SurqlModuleOptions {
    /** The schema the file is checked against; see `StatementScope`. */
    readonly declared?: DeclaredNames;
    /** The literal delimiters of a hole; default `__` and `__`. */
    readonly holes?: HoleDelimiters;
}
/** A problem with the file, at a 1-based line and column of its text. */
interface SurqlDiagnostic {
    readonly kind: StatementProblem['kind'] | 'schema' | 'config' | 'layout';
    readonly line: number;
    readonly column: number;
    /** The UTF-16 offset of `line` and `column` in the text. */
    readonly offset: number;
    /** The analyzer's code, when it gives one. */
    readonly code?: string;
    readonly message: string;
    /** `<scope>/<name>.surql:<line>:<column>: <message>`. */
    readonly text: string;
}
/**
 * The module, or why there is none. With problems, `text` is a module that
 * exports nothing, so an import of the constant fails where it is written,
 * as the command writes nothing for such a file.
 */
interface SurqlModule {
    readonly text: string;
    readonly problems: ReadonlyArray<SurqlDiagnostic>;
}
/** The module text of a file that has problems: it exports nothing. */
declare const EMPTY_SURQL_MODULE = "// Generated by effect-surrealkit from SurrealQL files. Do not edit.\n\nexport {};\n";
/**
 * Renders the module of one `.surql` file through
 * `renderStatementModulesSync`: the content of `<scope>/statements.ts` for a
 * scope that holds only this file, byte for byte. The analyzer's warnings
 * are not returned: the type check has no warning category.
 */
declare const renderSurqlModule: (file: SurqlFile, options?: SurqlModuleOptions) => SurqlModule;

/** The `options` of the `contentMappers` entry, as written. */
interface SurqlMapperOptions {
    /** The directory, or directories, of scope directories: `--input`. */
    readonly input?: string | ReadonlyArray<string>;
    readonly schema?: string;
    readonly schemas?: Readonly<Record<string, string>>;
    readonly holes?: HoleDelimiters;
}
/** An option that cannot be used, at its path inside `options`. */
interface SurqlOptionProblem {
    readonly path: ReadonlyArray<string>;
    readonly message: string;
}
/** What a file in one directory is rendered with. */
interface SurqlSettings {
    readonly declared?: DeclaredNames;
    readonly holes?: HoleDelimiters;
    /** Why the directory's schema document could not be read. */
    readonly schemaProblem?: string;
}
/** A project: its options, read once, and what each directory takes. */
interface SurqlProject {
    /** The directory paths are relative to. */
    readonly root: string;
    /** The `tsconfig.json` the options were read from, when there is one. */
    readonly config?: string;
    /** Why every file of the project is refused, when one is. */
    readonly refusal?: string;
    /** The input roots, absolute, in the order written. */
    readonly inputs: ReadonlyArray<string>;
    readonly problems: ReadonlyArray<SurqlOptionProblem>;
    /** The schema documents read, by absolute path. */
    readonly documents: ReadonlyArray<string>;
    /**
     * A digest of everything a module depends on besides its own text: the
     * options and the content of each schema document.
     */
    readonly identity: string;
    /** The settings for a `.surql` file at this absolute path. */
    readonly settingsFor: (file: string) => SurqlSettings;
}
/** Reads `options` as written, with a problem for each it cannot use. */
declare const decodeSurqlOptions: (raw: unknown) => {
    readonly options: SurqlMapperOptions;
    readonly problems: ReadonlyArray<SurqlOptionProblem>;
};
/**
 * Opens a project: decodes `raw` and reads each schema document it names,
 * relative to `root`. Never throws; what cannot be used is in `problems`,
 * and a directory whose document cannot be read carries `schemaProblem`.
 * `about` names the `tsconfig.json` read and a reason to refuse every file.
 */
declare const openSurqlProject: (root: string, raw: unknown, about?: {
    readonly config?: string;
    readonly refusal?: string;
}) => SurqlProject;
/** The package name a `contentMappers` entry names for this mapper. */
declare const MAPPER_PACKAGE = "effect-surrealkit";
/** What a `tsconfig.json` itself says about this mapper. */
interface MapperEntry {
    /** The file has an `effect-surrealkit` entry in `contentMappers`. */
    readonly found: boolean;
    /** The entry's `options`; `{}` when it has none. */
    readonly options: unknown;
    /** The file has `extends`. */
    readonly extends: boolean;
}
/**
 * The `effect-surrealkit` entry of `contentMappers` in this `tsconfig.json`,
 * read from this file only, not from a file it `extends`.
 */
declare const mapperEntryIn: (tsconfig: string) => MapperEntry;
/**
 * Why a project whose type check received `received` from TypeScript,
 * for this `tsconfig.json` (`''` when inferred), must refuse every file:
 * the entry is not written in the file itself, or its options differ from
 * what TypeScript passed. `undefined` when they are the same.
 */
declare const configurationDrift: (tsconfig: string, received: unknown) => string | undefined;
/**
 * The project a run-time loader renders `file` with: the `effect-surrealkit`
 * entry of `tsconfig` when given (relative to the working directory), else
 * of the nearest `tsconfig.json` above the file. A file without one, or
 * whose `tsconfig.json` has `extends` and no entry of its own, is refused,
 * since the type check may apply options the loader cannot read. Read again
 * when the `tsconfig.json` or a schema document changes.
 */
declare const surqlProjectFor: (file: string, tsconfig?: string) => SurqlProject;

/** The scope and name of the `.surql` file at `path`. */
declare const surqlFileAt: (path: string, sql: string) => SurqlFile;
/**
 * The module of the `.surql` file at `path` with text `sql` in `project`.
 * A project refused as a whole, a file outside the layout the command reads,
 * a schema document that cannot be read, and a file that another entry also
 * holds in its input and renders differently are each a problem of the
 * file, which then exports nothing: nothing is rendered that the command or
 * the run time would not render the same way.
 */
declare const surqlModuleIn: (project: SurqlProject, path: string, sql: string) => SurqlModule;
/** A `.surql` file a loader cannot turn into a module. */
declare class SurqlModuleError extends Error {
    readonly file: string;
    readonly problems: ReadonlyArray<string>;
    readonly name = "SurqlModuleError";
    constructor(file: string, problems: ReadonlyArray<string>);
}
interface LoadSurqlOptions {
    /**
     * The `tsconfig.json` whose `effect-surrealkit` content mapper entry holds
     * the options; default the nearest one above the file.
     */
    readonly tsconfig?: string;
}
/**
 * The TypeScript module of the `.surql` file at `path`, exactly as the
 * content mapper describes it to the type check. Throws a
 * {@link SurqlModuleError} on an option that cannot be used or a problem
 * with the file, as the `statements` command refuses to write it.
 */
declare const loadSurqlModule: (path: string, options?: LoadSurqlOptions) => string;

/**
 * A Bun plugin that loads `.surql` imports as the modules the content mapper
 * describes, for `Bun.plugin` at run time (`bun --preload
 * effect-surrealkit/register`) and for `Bun.build`.
 */

/** The part of Bun's plugin interface this plugin uses. */
interface SurqlBunPlugin {
    readonly name: string;
    readonly setup: (build: {
        readonly onLoad: (options: {
            readonly filter: RegExp;
        }, load: (args: {
            readonly path: string;
        }) => {
            readonly contents: string;
            readonly loader: 'ts';
        }) => unknown;
    }) => void;
}
/** `.surql` files as TypeScript modules, read from their project's options. */
declare const surqlBunPlugin: (options?: LoadSurqlOptions) => SurqlBunPlugin;

/** The file's scope and name, or why the command would not accept it. */
type SurqlLayout = {
    readonly scope: string;
    readonly name: string;
} | {
    readonly problems: ReadonlyArray<string>;
};
/**
 * The layout of `file` among `roots`. The names are checked by the renderer
 * itself, over every scope and file the roots hold, so a file is named as
 * the command names it, or refused where the command refuses it.
 */
declare const surqlLayout: (roots: ReadonlyArray<string>, file: string) => SurqlLayout;

export { EMPTY_SURQL_MODULE, type LoadSurqlOptions, MAPPER_PACKAGE, type MapperEntry, type SurqlBunPlugin, type SurqlDiagnostic, type SurqlFile, type SurqlLayout, type SurqlMapperOptions, type SurqlModule, SurqlModuleError, type SurqlModuleOptions, type SurqlOptionProblem, type SurqlProject, type SurqlSettings, configurationDrift, decodeSurqlOptions, loadSurqlModule, mapperEntryIn, openSurqlProject, renderSurqlModule, surqlBunPlugin, surqlFileAt, surqlLayout, surqlModuleIn, surqlProjectFor };
