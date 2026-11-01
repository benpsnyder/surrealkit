import * as effect_Cause from 'effect/Cause';
import * as effect_Types from 'effect/Types';
import { Schema, Effect } from 'effect';

/**
 * semanticDigest (schema document v2, section 13): SHA-256 over the RFC 8785
 * canonical JSON of the document's semantic projection.
 *
 * The digest itself needs a SHA-256 implementation, which the caller passes
 * in (`node:crypto` in the CLI), so this module stays host-neutral.
 */
/**
 * RFC 8785 canonical JSON for the value shapes a schema document contains:
 * objects (keys sorted by UTF-16 code units, which equals byte order for the
 * document's ASCII keys), arrays, strings, booleans, null and integers.
 *
 * @throws TypeError for a non-integer number, `-0`, or any other value.
 */
declare const canonicalJson: (value: unknown) => string;
/**
 * The semantic projection: removes `semanticDigest`, `provenance`,
 * `diagnostics`, every table and field `define`, and the derived
 * `value.readsInput` and `assert.recognized`.
 */
declare const semanticProjection: (document: Record<string, unknown>) => Record<string, unknown>;
/** `sha256:<hex>` of the canonical semantic projection. */
declare const semanticDigest: (document: Record<string, unknown>, sha256Hex: (text: string) => string) => string;

declare const PrimitiveKindName: Schema.Literals<readonly ["any", "none", "null", "bool", "int", "float", "decimal", "number", "string", "datetime", "duration", "uuid", "bytes", "regex", "range", "function", "object"]>;
type PrimitiveKindName = typeof PrimitiveKindName.Type;
declare const GeometryType: Schema.Literals<readonly ["collection", "line", "multiline", "multipoint", "multipolygon", "point", "polygon"]>;
declare const LiteralType: Schema.Literals<readonly ["string", "int", "float", "decimal", "bool", "duration"]>;
interface LiteralKind {
    readonly kind: 'literal';
    readonly type: typeof LiteralType.Type;
    readonly value: string | boolean;
}
type Kind = {
    readonly kind: PrimitiveKindName;
} | {
    readonly kind: 'record';
    readonly tables: ReadonlyArray<string>;
} | {
    readonly kind: 'table';
    readonly tables: ReadonlyArray<string>;
} | {
    readonly kind: 'file';
    readonly buckets: ReadonlyArray<string>;
} | {
    readonly kind: 'geometry';
    readonly types: ReadonlyArray<typeof GeometryType.Type>;
} | {
    readonly kind: 'array';
    readonly item: Kind;
    readonly length?: number;
} | {
    readonly kind: 'set';
    readonly item: Kind;
    readonly length?: number;
} | {
    readonly kind: 'tuple';
    readonly items: ReadonlyArray<Kind>;
} | {
    readonly kind: 'objectLiteral';
    readonly fields: ReadonlyArray<{
        readonly name: string;
        readonly kind: Kind;
        readonly optional: boolean;
    }>;
} | LiteralKind | {
    readonly kind: 'option';
    readonly item: Kind;
} | {
    readonly kind: 'union';
    readonly variants: ReadonlyArray<Kind>;
} | {
    readonly kind: 'unknown';
    readonly source: string;
};
declare const Field: Schema.Struct<{
    readonly path: Schema.$Array<Schema.String>;
    readonly kind: Schema.optionalKey<Schema.Codec<Kind, Kind, never, never>>;
    readonly optional: Schema.Boolean;
    readonly flexible: Schema.Boolean;
    readonly readonly: Schema.Boolean;
    readonly inline: Schema.Boolean;
    readonly default: Schema.optionalKey<Schema.Struct<{
        readonly mode: Schema.Literals<readonly ["create", "always"]>;
        readonly expr: Schema.String;
    }>>;
    readonly value: Schema.optionalKey<Schema.Struct<{
        readonly expr: Schema.String;
        readonly readsInput: Schema.Boolean;
    }>>;
    readonly computed: Schema.optionalKey<Schema.Struct<{
        readonly expr: Schema.String;
    }>>;
    readonly assert: Schema.optionalKey<Schema.Struct<{
        readonly expr: Schema.String;
        readonly recognized: Schema.optionalKey<Schema.$Array<Schema.Union<readonly [Schema.Struct<{
            readonly type: Schema.Literal<"literals">;
            readonly values: Schema.$Array<Schema.Struct<{
                readonly kind: Schema.Literal<"literal">;
                readonly type: Schema.Literals<readonly ["string", "int", "float", "decimal", "bool", "duration"]>;
                readonly value: Schema.Union<readonly [Schema.String, Schema.Boolean]>;
            }>>;
        }>, Schema.Struct<{
            readonly type: Schema.Literal<"range">;
            readonly valueKind: Schema.Literals<readonly ["int", "float", "decimal", "duration"]>;
            readonly min: Schema.optionalKey<Schema.Struct<{
                readonly value: Schema.String;
                readonly inclusive: Schema.Boolean;
            }>>;
            readonly max: Schema.optionalKey<Schema.Struct<{
                readonly value: Schema.String;
                readonly inclusive: Schema.Boolean;
            }>>;
        }>, Schema.Struct<{
            readonly type: Schema.Literal<"length">;
            readonly target: Schema.Literals<readonly ["string", "array"]>;
            readonly min: Schema.optionalKey<Schema.Number>;
            readonly max: Schema.optionalKey<Schema.Number>;
        }>, Schema.Struct<{
            readonly type: Schema.Literal<"email">;
        }>]>>>;
    }>>;
    readonly reference: Schema.optionalKey<Schema.Union<readonly [Schema.Struct<{
        readonly onDelete: Schema.Literals<readonly ["reject", "ignore", "cascade", "unset"]>;
    }>, Schema.Struct<{
        readonly onDelete: Schema.Literal<"then">;
        readonly expr: Schema.String;
    }>]>>;
    readonly permissions: Schema.Struct<{
        readonly select: Schema.Union<readonly [Schema.Boolean, Schema.String]>;
        readonly create: Schema.Union<readonly [Schema.Boolean, Schema.String]>;
        readonly update: Schema.Union<readonly [Schema.Boolean, Schema.String]>;
    }>;
    readonly comment: Schema.optionalKey<Schema.String>;
    readonly define: Schema.optionalKey<Schema.String>;
}>;
type Field = typeof Field.Type;
declare const Table: Schema.Struct<{
    readonly name: Schema.String;
    readonly type: Schema.Union<readonly [Schema.Struct<{
        readonly kind: Schema.Literals<readonly ["normal", "any"]>;
    }>, Schema.Struct<{
        readonly kind: Schema.Literal<"relation">;
        readonly in: Schema.$Array<Schema.String>;
        readonly out: Schema.$Array<Schema.String>;
        readonly enforced: Schema.Boolean;
        readonly lightweight: Schema.Boolean;
    }>]>;
    readonly schemafull: Schema.Boolean;
    readonly drop: Schema.Boolean;
    readonly view: Schema.optionalKey<Schema.Struct<{
        readonly select: Schema.String;
    }>>;
    readonly changefeed: Schema.optionalKey<Schema.Struct<{
        readonly expiry: Schema.String;
        readonly includeOriginal: Schema.Boolean;
    }>>;
    readonly permissions: Schema.Struct<{
        readonly select: Schema.Union<readonly [Schema.Boolean, Schema.String]>;
        readonly create: Schema.Union<readonly [Schema.Boolean, Schema.String]>;
        readonly update: Schema.Union<readonly [Schema.Boolean, Schema.String]>;
        readonly delete: Schema.Union<readonly [Schema.Boolean, Schema.String]>;
    }>;
    readonly idKey: Schema.optionalKey<Schema.Codec<Kind, Kind, never, never>>;
    readonly comment: Schema.optionalKey<Schema.String>;
    readonly fields: Schema.$Array<Schema.Struct<{
        readonly path: Schema.$Array<Schema.String>;
        readonly kind: Schema.optionalKey<Schema.Codec<Kind, Kind, never, never>>;
        readonly optional: Schema.Boolean;
        readonly flexible: Schema.Boolean;
        readonly readonly: Schema.Boolean;
        readonly inline: Schema.Boolean;
        readonly default: Schema.optionalKey<Schema.Struct<{
            readonly mode: Schema.Literals<readonly ["create", "always"]>;
            readonly expr: Schema.String;
        }>>;
        readonly value: Schema.optionalKey<Schema.Struct<{
            readonly expr: Schema.String;
            readonly readsInput: Schema.Boolean;
        }>>;
        readonly computed: Schema.optionalKey<Schema.Struct<{
            readonly expr: Schema.String;
        }>>;
        readonly assert: Schema.optionalKey<Schema.Struct<{
            readonly expr: Schema.String;
            readonly recognized: Schema.optionalKey<Schema.$Array<Schema.Union<readonly [Schema.Struct<{
                readonly type: Schema.Literal<"literals">;
                readonly values: Schema.$Array<Schema.Struct<{
                    readonly kind: Schema.Literal<"literal">;
                    readonly type: Schema.Literals<readonly ["string", "int", "float", "decimal", "bool", "duration"]>;
                    readonly value: Schema.Union<readonly [Schema.String, Schema.Boolean]>;
                }>>;
            }>, Schema.Struct<{
                readonly type: Schema.Literal<"range">;
                readonly valueKind: Schema.Literals<readonly ["int", "float", "decimal", "duration"]>;
                readonly min: Schema.optionalKey<Schema.Struct<{
                    readonly value: Schema.String;
                    readonly inclusive: Schema.Boolean;
                }>>;
                readonly max: Schema.optionalKey<Schema.Struct<{
                    readonly value: Schema.String;
                    readonly inclusive: Schema.Boolean;
                }>>;
            }>, Schema.Struct<{
                readonly type: Schema.Literal<"length">;
                readonly target: Schema.Literals<readonly ["string", "array"]>;
                readonly min: Schema.optionalKey<Schema.Number>;
                readonly max: Schema.optionalKey<Schema.Number>;
            }>, Schema.Struct<{
                readonly type: Schema.Literal<"email">;
            }>]>>>;
        }>>;
        readonly reference: Schema.optionalKey<Schema.Union<readonly [Schema.Struct<{
            readonly onDelete: Schema.Literals<readonly ["reject", "ignore", "cascade", "unset"]>;
        }>, Schema.Struct<{
            readonly onDelete: Schema.Literal<"then">;
            readonly expr: Schema.String;
        }>]>>;
        readonly permissions: Schema.Struct<{
            readonly select: Schema.Union<readonly [Schema.Boolean, Schema.String]>;
            readonly create: Schema.Union<readonly [Schema.Boolean, Schema.String]>;
            readonly update: Schema.Union<readonly [Schema.Boolean, Schema.String]>;
        }>;
        readonly comment: Schema.optionalKey<Schema.String>;
        readonly define: Schema.optionalKey<Schema.String>;
    }>>;
    readonly indexes: Schema.$Array<Schema.Struct<{
        readonly name: Schema.String;
        readonly columns: Schema.$Array<Schema.$Array<Schema.String>>;
        readonly type: Schema.Literals<readonly ["standard", "unique", "fulltext", "hnsw", "diskann", "count"]>;
        readonly clause: Schema.String;
        readonly fulltext: Schema.optionalKey<Schema.Struct<{
            readonly analyzer: Schema.String;
            readonly highlights: Schema.Boolean;
        }>>;
        readonly vector: Schema.optionalKey<Schema.Struct<{
            readonly dimension: Schema.Number;
            readonly distance: Schema.String;
            readonly elementType: Schema.String;
        }>>;
        readonly where: Schema.optionalKey<Schema.String>;
        readonly comment: Schema.optionalKey<Schema.String>;
    }>>;
    readonly events: Schema.$Array<Schema.Struct<{
        readonly name: Schema.String;
        readonly when: Schema.String;
        readonly then: Schema.$Array<Schema.String>;
        readonly async: Schema.Boolean;
        readonly retry: Schema.optionalKey<Schema.Number>;
        readonly maxDepth: Schema.optionalKey<Schema.Number>;
        readonly comment: Schema.optionalKey<Schema.String>;
    }>>;
    readonly define: Schema.optionalKey<Schema.String>;
}>;
type Table = typeof Table.Type;
declare const SchemaDocument: Schema.Struct<{
    readonly version: Schema.Literal<2>;
    readonly semanticDigest: Schema.String;
    readonly provenance: Schema.Struct<{
        readonly generator: Schema.Struct<{
            readonly name: Schema.Literal<"surrealkit">;
            readonly version: Schema.String;
            readonly commit: Schema.optionalKey<Schema.String>;
        }>;
        readonly engine: Schema.Struct<{
            readonly version: Schema.String;
            readonly build: Schema.optionalKey<Schema.String>;
            readonly mode: Schema.Literals<readonly ["embedded", "remote"]>;
        }>;
        readonly adapter: Schema.Literals<readonly ["structure-3.2", "structure-3.3"]>;
        readonly source: Schema.Union<readonly [Schema.Struct<{
            readonly kind: Schema.Literal<"compile">;
            readonly modules: Schema.$Array<Schema.String>;
            readonly files: Schema.$Array<Schema.Struct<{
                readonly path: Schema.String;
                readonly sha256: Schema.String;
            }>>;
        }>, Schema.Struct<{
            readonly kind: Schema.Literal<"introspect">;
            readonly namespace: Schema.String;
            readonly database: Schema.String;
        }>]>;
        readonly capabilities: Schema.optionalKey<Schema.Struct<{
            readonly experimental: Schema.$Array<Schema.String>;
            readonly network: Schema.Boolean;
        }>>;
    }>;
    readonly tables: Schema.$Array<Schema.Struct<{
        readonly name: Schema.String;
        readonly type: Schema.Union<readonly [Schema.Struct<{
            readonly kind: Schema.Literals<readonly ["normal", "any"]>;
        }>, Schema.Struct<{
            readonly kind: Schema.Literal<"relation">;
            readonly in: Schema.$Array<Schema.String>;
            readonly out: Schema.$Array<Schema.String>;
            readonly enforced: Schema.Boolean;
            readonly lightweight: Schema.Boolean;
        }>]>;
        readonly schemafull: Schema.Boolean;
        readonly drop: Schema.Boolean;
        readonly view: Schema.optionalKey<Schema.Struct<{
            readonly select: Schema.String;
        }>>;
        readonly changefeed: Schema.optionalKey<Schema.Struct<{
            readonly expiry: Schema.String;
            readonly includeOriginal: Schema.Boolean;
        }>>;
        readonly permissions: Schema.Struct<{
            readonly select: Schema.Union<readonly [Schema.Boolean, Schema.String]>;
            readonly create: Schema.Union<readonly [Schema.Boolean, Schema.String]>;
            readonly update: Schema.Union<readonly [Schema.Boolean, Schema.String]>;
            readonly delete: Schema.Union<readonly [Schema.Boolean, Schema.String]>;
        }>;
        readonly idKey: Schema.optionalKey<Schema.Codec<Kind, Kind, never, never>>;
        readonly comment: Schema.optionalKey<Schema.String>;
        readonly fields: Schema.$Array<Schema.Struct<{
            readonly path: Schema.$Array<Schema.String>;
            readonly kind: Schema.optionalKey<Schema.Codec<Kind, Kind, never, never>>;
            readonly optional: Schema.Boolean;
            readonly flexible: Schema.Boolean;
            readonly readonly: Schema.Boolean;
            readonly inline: Schema.Boolean;
            readonly default: Schema.optionalKey<Schema.Struct<{
                readonly mode: Schema.Literals<readonly ["create", "always"]>;
                readonly expr: Schema.String;
            }>>;
            readonly value: Schema.optionalKey<Schema.Struct<{
                readonly expr: Schema.String;
                readonly readsInput: Schema.Boolean;
            }>>;
            readonly computed: Schema.optionalKey<Schema.Struct<{
                readonly expr: Schema.String;
            }>>;
            readonly assert: Schema.optionalKey<Schema.Struct<{
                readonly expr: Schema.String;
                readonly recognized: Schema.optionalKey<Schema.$Array<Schema.Union<readonly [Schema.Struct<{
                    readonly type: Schema.Literal<"literals">;
                    readonly values: Schema.$Array<Schema.Struct<{
                        readonly kind: Schema.Literal<"literal">;
                        readonly type: Schema.Literals<readonly ["string", "int", "float", "decimal", "bool", "duration"]>;
                        readonly value: Schema.Union<readonly [Schema.String, Schema.Boolean]>;
                    }>>;
                }>, Schema.Struct<{
                    readonly type: Schema.Literal<"range">;
                    readonly valueKind: Schema.Literals<readonly ["int", "float", "decimal", "duration"]>;
                    readonly min: Schema.optionalKey<Schema.Struct<{
                        readonly value: Schema.String;
                        readonly inclusive: Schema.Boolean;
                    }>>;
                    readonly max: Schema.optionalKey<Schema.Struct<{
                        readonly value: Schema.String;
                        readonly inclusive: Schema.Boolean;
                    }>>;
                }>, Schema.Struct<{
                    readonly type: Schema.Literal<"length">;
                    readonly target: Schema.Literals<readonly ["string", "array"]>;
                    readonly min: Schema.optionalKey<Schema.Number>;
                    readonly max: Schema.optionalKey<Schema.Number>;
                }>, Schema.Struct<{
                    readonly type: Schema.Literal<"email">;
                }>]>>>;
            }>>;
            readonly reference: Schema.optionalKey<Schema.Union<readonly [Schema.Struct<{
                readonly onDelete: Schema.Literals<readonly ["reject", "ignore", "cascade", "unset"]>;
            }>, Schema.Struct<{
                readonly onDelete: Schema.Literal<"then">;
                readonly expr: Schema.String;
            }>]>>;
            readonly permissions: Schema.Struct<{
                readonly select: Schema.Union<readonly [Schema.Boolean, Schema.String]>;
                readonly create: Schema.Union<readonly [Schema.Boolean, Schema.String]>;
                readonly update: Schema.Union<readonly [Schema.Boolean, Schema.String]>;
            }>;
            readonly comment: Schema.optionalKey<Schema.String>;
            readonly define: Schema.optionalKey<Schema.String>;
        }>>;
        readonly indexes: Schema.$Array<Schema.Struct<{
            readonly name: Schema.String;
            readonly columns: Schema.$Array<Schema.$Array<Schema.String>>;
            readonly type: Schema.Literals<readonly ["standard", "unique", "fulltext", "hnsw", "diskann", "count"]>;
            readonly clause: Schema.String;
            readonly fulltext: Schema.optionalKey<Schema.Struct<{
                readonly analyzer: Schema.String;
                readonly highlights: Schema.Boolean;
            }>>;
            readonly vector: Schema.optionalKey<Schema.Struct<{
                readonly dimension: Schema.Number;
                readonly distance: Schema.String;
                readonly elementType: Schema.String;
            }>>;
            readonly where: Schema.optionalKey<Schema.String>;
            readonly comment: Schema.optionalKey<Schema.String>;
        }>>;
        readonly events: Schema.$Array<Schema.Struct<{
            readonly name: Schema.String;
            readonly when: Schema.String;
            readonly then: Schema.$Array<Schema.String>;
            readonly async: Schema.Boolean;
            readonly retry: Schema.optionalKey<Schema.Number>;
            readonly maxDepth: Schema.optionalKey<Schema.Number>;
            readonly comment: Schema.optionalKey<Schema.String>;
        }>>;
        readonly define: Schema.optionalKey<Schema.String>;
    }>>;
    readonly functions: Schema.$Array<Schema.Struct<{
        readonly name: Schema.String;
        readonly args: Schema.$Array<Schema.Struct<{
            readonly name: Schema.String;
            readonly kind: Schema.Codec<Kind, Kind, never, never>;
            readonly optional: Schema.Boolean;
            readonly omittable: Schema.Boolean;
        }>>;
        readonly returns: Schema.optionalKey<Schema.Codec<Kind, Kind, never, never>>;
        readonly block: Schema.String;
        readonly permissions: Schema.Union<readonly [Schema.Boolean, Schema.String]>;
        readonly comment: Schema.optionalKey<Schema.String>;
    }>>;
    readonly params: Schema.$Array<Schema.Struct<{
        readonly name: Schema.String;
        readonly value: Schema.String;
        readonly permissions: Schema.Union<readonly [Schema.Boolean, Schema.String]>;
        readonly comment: Schema.optionalKey<Schema.String>;
    }>>;
    readonly accesses: Schema.$Array<Schema.Struct<{
        readonly name: Schema.String;
        readonly method: Schema.Literals<readonly ["record", "jwt", "bearer"]>;
        readonly signup: Schema.optionalKey<Schema.String>;
        readonly signin: Schema.optionalKey<Schema.String>;
        readonly authenticate: Schema.optionalKey<Schema.String>;
        readonly refresh: Schema.optionalKey<Schema.Boolean>;
        readonly verify: Schema.optionalKey<Schema.Union<readonly [Schema.Struct<{
            readonly alg: Schema.String;
        }>, Schema.Struct<{
            readonly url: Schema.String;
        }>]>>;
        readonly subject: Schema.optionalKey<Schema.Literals<readonly ["record", "user"]>>;
        readonly durations: Schema.Struct<{
            readonly grant: Schema.optionalKey<Schema.String>;
            readonly token: Schema.optionalKey<Schema.String>;
            readonly session: Schema.optionalKey<Schema.String>;
        }>;
        readonly comment: Schema.optionalKey<Schema.String>;
    }>>;
    readonly analyzers: Schema.$Array<Schema.Struct<{
        readonly name: Schema.String;
        readonly function: Schema.optionalKey<Schema.String>;
        readonly tokenizers: Schema.$Array<Schema.String>;
        readonly filters: Schema.$Array<Schema.String>;
        readonly comment: Schema.optionalKey<Schema.String>;
    }>>;
    readonly sequences: Schema.$Array<Schema.Struct<{
        readonly name: Schema.String;
        readonly batch: Schema.String;
        readonly start: Schema.String;
        readonly timeout: Schema.optionalKey<Schema.String>;
    }>>;
    readonly buckets: Schema.$Array<Schema.Struct<{
        readonly name: Schema.String;
        readonly backend: Schema.String;
        readonly readonly: Schema.Boolean;
        readonly permissions: Schema.Union<readonly [Schema.Boolean, Schema.String]>;
        readonly comment: Schema.optionalKey<Schema.String>;
    }>>;
    readonly apis: Schema.$Array<Schema.Struct<{
        readonly path: Schema.String;
        readonly actions: Schema.$Array<Schema.Struct<{
            readonly methods: Schema.$Array<Schema.Literals<readonly ["delete", "get", "patch", "post", "put", "trace"]>>;
            readonly middleware: Schema.$Array<Schema.Struct<{
                readonly name: Schema.String;
                readonly args: Schema.$Array<Schema.String>;
            }>>;
            readonly permissions: Schema.Union<readonly [Schema.Boolean, Schema.String]>;
            readonly action: Schema.String;
        }>>;
        readonly middleware: Schema.$Array<Schema.Struct<{
            readonly name: Schema.String;
            readonly args: Schema.$Array<Schema.String>;
        }>>;
        readonly permissions: Schema.Union<readonly [Schema.Boolean, Schema.String]>;
        readonly comment: Schema.optionalKey<Schema.String>;
    }>>;
    readonly modules: Schema.$Array<Schema.Struct<{
        readonly name: Schema.String;
        readonly executable: Schema.Struct<{
            readonly type: Schema.String;
            readonly bucket: Schema.optionalKey<Schema.String>;
            readonly key: Schema.optionalKey<Schema.String>;
        }>;
        readonly permissions: Schema.Union<readonly [Schema.Boolean, Schema.String]>;
        readonly comment: Schema.optionalKey<Schema.String>;
    }>>;
    readonly configs: Schema.$Array<Schema.Union<readonly [Schema.Struct<{
        readonly type: Schema.Literal<"graphql">;
        readonly tables: Schema.String;
        readonly functions: Schema.String;
    }>, Schema.Struct<{
        readonly type: Schema.Literal<"api">;
        readonly middleware: Schema.$Array<Schema.Struct<{
            readonly name: Schema.String;
            readonly args: Schema.$Array<Schema.String>;
        }>>;
        readonly permissions: Schema.Union<readonly [Schema.Boolean, Schema.String]>;
    }>]>>;
    readonly users: Schema.$Array<Schema.Struct<{
        readonly name: Schema.String;
        readonly roles: Schema.$Array<Schema.String>;
        readonly durations: Schema.Struct<{
            readonly grant: Schema.optionalKey<Schema.String>;
            readonly token: Schema.optionalKey<Schema.String>;
            readonly session: Schema.optionalKey<Schema.String>;
        }>;
        readonly comment: Schema.optionalKey<Schema.String>;
    }>>;
    readonly diagnostics: Schema.$Array<Schema.Struct<{
        readonly severity: Schema.Literals<readonly ["error", "warning", "info"]>;
        readonly code: Schema.String;
        readonly table: Schema.optionalKey<Schema.String>;
        readonly field: Schema.optionalKey<Schema.$Array<Schema.String>>;
        readonly function: Schema.optionalKey<Schema.String>;
        readonly source: Schema.String;
        readonly span: Schema.optionalKey<Schema.Struct<{
            readonly start: Schema.Number;
            readonly end: Schema.Number;
        }>>;
        readonly reason: Schema.String;
    }>>;
}>;
type SchemaDocument = typeof SchemaDocument.Type;
declare const DocumentError_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "DocumentError";
} & Readonly<A>;
/** A document that failed strict decoding. */
declare class DocumentError extends DocumentError_base<{
    readonly message: string;
}> {
}
/**
 * Decodes an unknown value (parsed JSON) as a schema document v2, rejecting
 * unknown properties anywhere in the tree.
 */
declare const decodeDocument: (input: unknown) => Effect.Effect<SchemaDocument, DocumentError>;

declare const EmitterOptions: Schema.Struct<{
    /**
     * The logical store the schema belongs to. Record-id brands are
     * `<store>/<table>`, so ids of same-named tables in different stores are
     * different types.
     */
    readonly store: Schema.String;
    /** Integer profile. Default `"safe-number"`. */
    readonly int: Schema.optionalKey<Schema.Literals<readonly ["safe-number", "bigint"]>>;
    /** Datetime profile. Default `"sdk"`. */
    readonly datetime: Schema.optionalKey<Schema.Literals<readonly ["sdk", "effect-datetime"]>>;
    /** Emit `<Table>Patch` JSON Patch unions (not yet qualified). Default false. */
    readonly patch: Schema.optionalKey<Schema.Boolean>;
    /**
     * Extension of the generated modules' imports of each other. Default
     * `".js"`, which compilers and bundlers map to the `.ts` sources; `".ts"`
     * lets the sources load directly where nothing maps them, such as Node's
     * own type stripping (the consumer then compiles with
     * `allowImportingTsExtensions` or `rewriteRelativeImportExtensions`).
     */
    readonly importExtension: Schema.optionalKey<Schema.Literals<readonly [".js", ".ts"]>>;
    /**
     * Error diagnostic codes generation may proceed past, each with the reason
     * it is acceptable. Generation fails on any other error diagnostic.
     */
    readonly acknowledge: Schema.optionalKey<Schema.$Record<Schema.String, Schema.String>>;
    readonly fields: Schema.optionalKey<Schema.$Record<Schema.String, Schema.Struct<{
        readonly int: Schema.optionalKey<Schema.Literals<readonly ["safe-number", "bigint"]>>;
        readonly datetime: Schema.optionalKey<Schema.Literals<readonly ["sdk", "effect-datetime"]>>;
        readonly select: Schema.optionalKey<Schema.Literals<readonly ["required", "optional", "removable", "resettable", "excluded"]>>;
        readonly create: Schema.optionalKey<Schema.Literals<readonly ["required", "optional", "removable", "resettable", "excluded"]>>;
        readonly merge: Schema.optionalKey<Schema.Literals<readonly ["required", "optional", "removable", "resettable", "excluded"]>>;
        readonly content: Schema.optionalKey<Schema.Literals<readonly ["required", "optional", "removable", "resettable", "excluded"]>>;
    }>>>;
    /** PascalCase names for tables whose default names collide. */
    readonly names: Schema.optionalKey<Schema.$Record<Schema.String, Schema.String>>;
}>;
type EmitterOptions = typeof EmitterOptions.Type;
declare const OptionsError_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "OptionsError";
} & Readonly<A>;
/** Emitter options that failed strict decoding. */
declare class OptionsError extends OptionsError_base<{
    readonly message: string;
}> {
}
/** Decodes emitter options strictly (unknown keys are errors). */
declare const decodeOptions: (input: unknown) => Effect.Effect<EmitterOptions, OptionsError>;

interface GeneratedFile {
    /** Path relative to the output directory, `/`-separated. */
    readonly path: string;
    readonly content: string;
}
interface GenerateResult {
    readonly files: ReadonlyArray<GeneratedFile>;
    readonly warnings: ReadonlyArray<string>;
}
declare const GenerateError_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "GenerateError";
} & Readonly<A>;
/** The document and options decoded, but generation is not possible. */
declare class GenerateError extends GenerateError_base<{
    readonly message: string;
}> {
}
interface GenerateHooks {
    /**
     * Lowercase hex SHA-256 of a UTF-8 string. When given, the document's
     * `semanticDigest` is recomputed and a mismatch (a hand-edited or
     * truncated document) fails generation.
     */
    readonly sha256?: (text: string) => string;
}
/** Generates the module set from an already decoded document and options. */
declare const emit: (document: SchemaDocument, options: EmitterOptions, hooks?: GenerateHooks) => GenerateResult;
/**
 * Decodes `document` (parsed JSON) and `options` strictly, then generates the
 * module set.
 */
declare const generate: (document: unknown, options: unknown, hooks?: GenerateHooks) => Effect.Effect<GenerateResult, DocumentError | OptionsError | GenerateError>;

/** The emitter's own version, recorded in every generated manifest. */
declare const EMITTER_VERSION = "0.1.0";
/** The exact peer versions generated code is written and tested against. */
declare const PEER_VERSIONS: {
    readonly effect: "4.0.6";
    readonly surrealdb: "2.1.1";
};

export { DocumentError, EMITTER_VERSION, EmitterOptions, Field, GenerateError, type GenerateHooks, type GenerateResult, type GeneratedFile, type Kind, OptionsError, PEER_VERSIONS, SchemaDocument, Table, canonicalJson, decodeDocument, decodeOptions, emit, generate, semanticDigest, semanticProjection };
