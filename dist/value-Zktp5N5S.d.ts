import { Schema, Brand } from 'effect';
import { Decimal as Decimal$1, Uuid as Uuid$1, DateTime, RecordId, Duration, Geometry, Range, Table, FileRef } from 'surrealdb';

/**
 * Descriptors that generated modules build their tables, edges and functions
 * with, and the refinement hooks applied to them.
 *
 * A table descriptor carries one schema per operation (`select`, `create`,
 * `merge`, `content`), derived from schema document v2's field-presence
 * matrix, together with the shared field schemas and each field's presence
 * per operation, so refinements can rebuild every variant consistently.
 */

/** An operation with its own generated schema. */
type Operation = 'select' | 'create' | 'merge' | 'content';
/**
 * How a field takes part in one operation (schema document v2, section 7):
 *
 * - `required` — the key must be present.
 * - `optional` — the key may be omitted (`Schema.optionalKey`).
 * - `removable` — omission leaves the value; `undefined` (NONE) removes it.
 * - `resettable` — omission leaves the value; `undefined` re-applies the
 *   default (`DEFAULT ALWAYS`).
 * - `excluded` — the key is not part of the operation's schema.
 */
type Presence = 'required' | 'optional' | 'removable' | 'resettable' | 'excluded';
type FieldPresence = {
    readonly [O in Operation]: Presence;
};
/** `true` (FULL), `false` (NONE) or a `WHERE` expression. */
type Permission = boolean | string;
interface TablePermissions {
    readonly select: Permission;
    readonly create: Permission;
    readonly update: Permission;
    readonly delete: Permission;
}
/** A closed row schema, or an open one (schemaless table). */
type RowSchema = Schema.Struct<Schema.Struct.Fields> | Schema.StructWithRest<Schema.Struct<Schema.Struct.Fields>, Schema.StructWithRest.Records>;
/** A relation table's endpoints, for compile-time `relate(from, to)` checks. */
interface EdgeDescriptor {
    readonly table: string;
    readonly in: ReadonlyArray<Schema.Top>;
    readonly out: ReadonlyArray<Schema.Top>;
    readonly enforced: boolean;
    readonly lightweight: boolean;
}
/** The record ids a relation accepts as its `in` endpoint. */
type EdgeIn<E extends EdgeDescriptor> = E['in'][number]['Type'];
/** The record ids a relation accepts as its `out` endpoint. */
type EdgeOut<E extends EdgeDescriptor> = E['out'][number]['Type'];
/** What a `DEFINE INDEX` builds (schema document v2, section 9). */
type IndexType = 'standard' | 'unique' | 'fulltext' | 'hnsw' | 'diskann' | 'count';
/**
 * One `DEFINE INDEX`: its kind and the field paths it covers, in order
 * (`[["owner"], ["status"]]`; a `COUNT` index covers none). The generated
 * descriptors keep the paths as literal types.
 */
interface IndexDescriptor {
    readonly type: IndexType;
    readonly columns: ReadonlyArray<ReadonlyArray<string>>;
    /** A `FULLTEXT` index's analyzer, and whether it keeps highlights. */
    readonly fulltext?: {
        readonly analyzer: string;
        readonly highlights: boolean;
    };
    /** An `HNSW` or `DISKANN` index's vector shape. */
    readonly vector?: {
        readonly dimension: number;
        readonly distance: string;
        readonly elementType: string;
    };
    /** A `COUNT … WHERE` index's condition. */
    readonly where?: string;
}
/**
 * A field's `PERMISSIONS`: `true` (FULL), `false` (NONE) or a `WHERE`
 * expression, for `select`, `create` and `update`; `fields` holds those of
 * its declared children (`*` for an array or set element).
 */
interface FieldPermissions {
    readonly select: Permission;
    readonly create: Permission;
    readonly update: Permission;
    readonly fields?: {
        readonly [key: string]: FieldPermissions;
    };
}
interface TableDescriptor {
    readonly name: string;
    readonly type: 'normal' | 'any' | 'relation';
    readonly schemafull: boolean;
    readonly drop: boolean;
    readonly id: Schema.Top;
    readonly select: RowSchema;
    /**
     * The stored row as a session reads it when field permissions may hide
     * fields: every field whose `select` permission is not FULL is optional,
     * because SurrealDB returns such a field as NONE without an error.
     */
    readonly visible?: RowSchema;
    /** Absent for lightweight relations, which take no content. */
    readonly create?: RowSchema;
    readonly merge?: RowSchema;
    readonly content?: RowSchema;
    /** Field schemas identical in every operation: the ones `refine` accepts. */
    readonly fields: {
        readonly [key: string]: Schema.Top;
    };
    readonly presence: {
        readonly [key: string]: FieldPresence;
    };
    /** Relation tables that use this table as an endpoint. */
    readonly relations: {
        readonly in: ReadonlyArray<string>;
        readonly out: ReadonlyArray<string>;
    };
    readonly permissions: TablePermissions;
    /** Each top-level field's permissions (not `id`, `in` or `out`). */
    readonly fieldPermissions?: {
        readonly [key: string]: FieldPermissions;
    };
    /** Every `DEFINE INDEX` of the table, by name. */
    readonly indexes?: {
        readonly [name: string]: IndexDescriptor;
    };
    readonly edge?: EdgeDescriptor;
}
/** A view: an id and its query; its row shape is not derived. */
interface ViewDescriptor {
    readonly name: string;
    readonly type: 'view';
    readonly id: Schema.Top;
    readonly view: string;
    readonly permissions: TablePermissions;
}
interface FunctionDescriptor {
    readonly name: `fn::${string}`;
    /** A `Schema.Tuple`; omittable trailing arguments are optional elements. */
    readonly args: Schema.Top;
    /** `Schema.Unknown` when the function declares no return kind. */
    readonly returns: Schema.Top;
}
/** The argument tuple a function accepts. */
type FunctionArgs<F extends FunctionDescriptor> = F['args']['Type'];
/** What a function call decodes to. */
type FunctionResult<F extends FunctionDescriptor> = F['returns']['Type'];
/** Declares a generated table descriptor (identity at runtime). */
declare const table: <const T extends TableDescriptor>(descriptor: T) => T;
/** Declares a generated view descriptor (identity at runtime). */
declare const view: <const T extends ViewDescriptor>(descriptor: T) => T;
/** Declares a generated relation endpoint descriptor (identity at runtime). */
declare const edge: <const E extends EdgeDescriptor>(descriptor: E) => E;
/** Declares a generated function descriptor (identity at runtime). */
declare const fn: <const F extends FunctionDescriptor>(descriptor: F) => F;
/**
 * Every table, view, relation endpoint and function of one store, by its
 * SurrealDB name, so a record link (`RecordId<"person">`) or a graph step
 * (`->member_of->`) resolves to the descriptor of its target.
 */
interface StoreDescriptor {
    /** The logical store name (the emitter's `store` option). */
    readonly name: string;
    readonly tables: {
        readonly [name: string]: TableDescriptor;
    };
    readonly views: {
        readonly [name: string]: ViewDescriptor;
    };
    /** The endpoints of every relation table, by the relation's name. */
    readonly edges: {
        readonly [name: string]: EdgeDescriptor;
    };
    readonly functions: {
        readonly [name: string]: FunctionDescriptor;
    };
}
/** Declares a generated store registry (identity at runtime). */
declare const store: <const S extends StoreDescriptor>(descriptor: S) => S;
/** Applies a presence to a field schema, as the generated variants do. */
declare const withPresence: (schema: Schema.Top, presence: Presence) => Schema.Top;
/**
 * A schema a field may be replaced with: no services, and no presence of its
 * own (`Schema.optionalKey` / `Schema.optional`), because each variant's
 * presence comes from the table.
 */
type FieldSchema = Schema.Top & {
    readonly DecodingServices: never;
    readonly EncodingServices: never;
    readonly '~type.optionality': 'required';
    readonly '~encoded.optionality': 'required';
};
/** A schema that narrows `S` without changing its runtime representation. */
type Narrowing<S extends Schema.Top> = FieldSchema & {
    readonly Type: S['Type'];
    readonly Encoded: S['Encoded'];
};
type Fields<T extends TableDescriptor> = T['fields'];
/** One callback per shared field; unknown keys are rejected. */
type Refinements<T extends TableDescriptor> = {
    readonly [K in keyof Fields<T>]?: (schema: Fields<T>[K]) => Narrowing<Fields<T>[K]>;
};
type NoExtraKeys<R, Allowed> = R & {
    readonly [K in Exclude<keyof R, keyof Allowed>]: never;
};
type Rewrap<Old, New> = New extends Schema.Top ? Old extends Schema.optional<Schema.Top> ? Schema.optional<New> : Old extends Schema.optionalKey<Schema.Top> ? Schema.optionalKey<New> : New : never;
type AsFields<F> = F extends Schema.Struct.Fields ? F : never;
type ReplaceFields<F, Replacements> = AsFields<{
    readonly [K in keyof F]: K extends keyof Replacements ? Rewrap<F[K], Replacements[K]> : F[K];
}>;
type ReplaceVariant<V, Replacements> = V extends Schema.StructWithRest<Schema.Struct<infer F>, infer R> ? Schema.StructWithRest<Schema.Struct<ReplaceFields<F, Replacements>>, R> : V extends Schema.Struct<infer F> ? Schema.Struct<ReplaceFields<F, Replacements>> : V;
/** A table descriptor with some shared field schemas replaced. */
type Replaced<T extends TableDescriptor, Replacements> = {
    readonly [K in keyof T]: K extends 'fields' ? {
        readonly [F in keyof T['fields']]: F extends keyof Replacements ? Replacements[F] : T['fields'][F];
    } : K extends Operation | 'visible' ? ReplaceVariant<T[K], Replacements> : T[K];
};
type Returned<R> = {
    readonly [K in keyof R]: R[K] extends (schema: never) => infer S ? S : never;
};
/**
 * Refines shared fields of a generated table. Each callback receives the
 * field's base schema — before operation presence is applied — and its result
 * replaces that field in every variant (select, create, merge and content),
 * re-wrapped with the field's presence in each. A refinement may narrow the
 * type (checks, brands) but not change its representation; use
 * {@link replaceField} for that. Keys that are not shared fields of the table
 * are type errors, for every variant alike.
 *
 * @example
 * const People = refine(PersonTable, {
 *   name: (s) => s.check(Schema.isMinLength(1)),
 * });
 */
declare const refine: <T extends TableDescriptor, const R extends Refinements<T>>(descriptor: T, refinements: NoExtraKeys<R, Fields<T>>) => Replaced<T, Returned<R>>;
/**
 * Replaces one shared field of a generated table outright, in every variant.
 * Unlike {@link refine}, the new schema may change the field's type entirely,
 * which is why this is a separate, conspicuous call.
 */
declare const replaceField: <T extends TableDescriptor, K extends keyof Fields<T> & string, S extends FieldSchema>(descriptor: T, key: K, schema: S) => Replaced<T, { readonly [P in K]: S; }>;

/**
 * `decimal` and the `number` kind.
 *
 * SurrealDB decimals are 96-bit-mantissa decimals with at most 28 fractional
 * digits (measured on 3.2.4): a larger mantissa is a server error the SDK
 * never resolves (the query hangs), and extra fractional digits are rounded
 * away silently (`0.00000000000000000000000000001` reads back as `0`). The
 * codec rejects both before a value reaches the wire.
 *
 * The SDK's `Decimal` string constructor is permissive (`new Decimal("abc")`
 * is zero, and `new Decimal("+1.5")` is 0.5), so text is never handed to it:
 * {@link decimalFromString} parses the sign, digits and exponent itself and
 * builds the SDK value from exact integers. A decimal never passes through a
 * JS number.
 */

/** Largest decimal mantissa: `2^96 - 1`. */
declare const DECIMAL_MAX_MANTISSA: bigint;
/** Most fractional digits a decimal keeps. */
declare const DECIMAL_MAX_SCALE = 28;
/**
 * Parses decimal text (`-1.50`, `+2`, `1e10`, `.5e1`) into an SDK `Decimal`.
 * The sign, digits and exponent are read here and the value is built from
 * exact integers (`new Decimal([int, frac, scale])`), never from the SDK's
 * permissive string parser; then the SurrealDB range is checked.
 *
 * @throws RangeError for malformed or out-of-range text.
 */
declare const decimalFromString: (text: string) => Decimal$1;
/** `decimal`: the SDK `Decimal` class, range-checked; never a JS number. */
declare const Decimal: Schema.declareConstructor<Decimal$1, Decimal$1, readonly [], Decimal$1>;
/** A `decimal` literal kind such as `10dec`: exactly that value. */
declare const DecimalLiteral: <const V extends string>(value: V) => Schema.declareConstructor<Decimal$1, Decimal$1, readonly [], Decimal$1>;
/**
 * The `number` kind: any SurrealQL number. The SDK returns ints as
 * `number | bigint`, floats as `number` and decimals as `Decimal`; the
 * original numeric tag of an integral value is not recoverable, so none is
 * claimed.
 */
declare const SurrealNumber: Schema.declareConstructor<number | bigint | Decimal$1, number | bigint | Decimal$1, readonly [], number | bigint | Decimal$1>;

/**
 * SurrealQL `int` is a signed 64-bit integer. The SDK's CBOR decoder hands it
 * back as a JS `number` when it fits and as a `bigint` otherwise, with one
 * lossy edge (measured against surrealdb.js 2.1.1 and SurrealDB 3.2.4):
 *
 * - `0 … 2^53` decode as exact numbers; `2^53 + 1 … 2^63 - 1` as bigints.
 * - `-1 … -2^53` decode as exact numbers; `-(2^53 + 2) … -2^63` as bigints.
 * - `-(2^53 + 1)` decodes as the number `-2^53`: already rounded.
 * - Encoding a bigint outside int64 is not rejected by the SDK; the server
 *   wraps it (`2^63` arrives as `-2^63`).
 *
 * Two profiles follow from that:
 *
 * - `Int` (`int: "safe-number"`, the default): a `number` that is a safe
 *   integer. Anything beyond `±(2^53 - 1)` fails loudly in both directions.
 * - `Int64` (`int: "bigint"`): a branded `bigint` checked against the int64
 *   range in both directions. Numbers are accepted only where the decoder is
 *   exact, so `-2^53` (ambiguous with a rounded `-(2^53 + 1)`) fails loudly.
 */

declare const INT64_MIN: bigint;
declare const INT64_MAX: bigint;
/** The integer profile of a generated module or field. */
type IntProfile = 'safe-number' | 'bigint';
/**
 * `int`, `int: "safe-number"` profile: a JS `number` that must be a safe
 * integer. Values beyond `±(2^53 - 1)` fail instead of losing precision.
 */
declare const Int: Schema.declareConstructor<number, number, readonly [], number>;
type Int = typeof Int.Type;
/**
 * Checks a bigint against the int64 range and brands it.
 *
 * @throws RangeError when the value is outside int64.
 */
declare const int64: (value: bigint) => Int64;
/** A signed 64-bit integer. */
type Int64 = bigint & Brand.Brand<'Int64'>;
/**
 * `int`, `int: "bigint"` profile: a branded signed 64-bit `bigint`. Decodes
 * the SDK's `number | bigint`, always encodes a `bigint` within int64.
 */
declare const Int64: Schema.declareConstructor<Int64, number | bigint, readonly [], Int64>;
/**
 * An `int` literal kind under the `bigint` profile, e.g. `-5` in
 * `-5 | 0 | 1`. Accepts the SDK's `number | bigint` spelling of exactly that
 * value. (Under the `safe-number` profile, use `Schema.Literal(-5)`.)
 */
declare const Int64Literal: <const V extends string>(value: V) => Schema.declareConstructor<Int64, number | bigint, readonly [], Int64>;
/** Picks the integer codec for a profile. */
declare const intFor: (profile: IntProfile) => Schema.declareConstructor<number, number, readonly [], number> | Schema.declareConstructor<Int64, number | bigint, readonly [], Int64>;

/** `float`, `uuid`, `bytes`, and kinds with no SDK value representation. */

/** Replaces lone surrogates with U+FFFD, as UTF-8 transport would. */
declare const toWellFormed: (text: string) => string;
/**
 * `string`: a JS string SurrealDB can store. SurrealDB strings are UTF-8, so
 * a JS string containing a lone surrogate cannot be represented: the SDK's
 * CBOR encoder would silently replace it with U+FFFD. Such strings fail here
 * instead.
 */
declare const SurrealString: Schema.declareConstructor<string, string, readonly [], string>;
/** A native IEEE-754 float, including NaN, infinities, signed zero and subnormals. */
declare const Float: Schema.declareConstructor<number, number, readonly [], number>;
/** `uuid`: the SDK `Uuid` class (any version). */
declare const Uuid: Schema.declareConstructor<Uuid$1, Uuid$1, readonly [], Uuid$1>;
/**
 * `bytes`: a `Uint8Array`. The SDK decodes bytes as an `ArrayBuffer`, which
 * is accepted and copied into a `Uint8Array`; encoding sends the
 * `Uint8Array`, which the SDK writes as CBOR bytes.
 */
declare const Bytes: Schema.declareConstructor<Uint8Array<ArrayBufferLike>, ArrayBuffer | Uint8Array<ArrayBufferLike>, readonly [], Uint8Array<ArrayBufferLike>>;
/**
 * A kind no SDK value can represent (`regex`, `function`). Always fails, with
 * the reason, in both directions.
 */
declare const Unsupported: <const K extends string>(kind: K) => Schema.declareConstructor<never, never, readonly [], never>;

/**
 * An open native value for FLEXIBLE objects and SCHEMALESS fields.
 * The SDK also accepts a JS `Date` on writes.
 */
type SurrealValue = null | boolean | number | bigint | string | DateTime | RecordId | Duration | Decimal$1 | Uuid$1 | Geometry | Range<unknown, unknown> | Date | Table | FileRef | Uint8Array | ReadonlySet<SurrealValue> | ReadonlyArray<SurrealValue> | {
    readonly [key: string]: SurrealValue;
};
declare const SurrealValue: Schema.Codec<SurrealValue>;
/** A member of a MERGE object: NONE removes a key, including in a nested patch. */
type SurrealMergeValue = SurrealValue | undefined | {
    readonly [key: string]: SurrealMergeValue;
};
declare const SurrealMergeValue: Schema.Codec<SurrealMergeValue>;
/** An open value in SurrealDB's JSON world (HTTP `/sql`). */
type SurrealJsonValue = null | boolean | number | string | ReadonlyArray<SurrealJsonValue> | {
    readonly [key: string]: SurrealJsonValue;
};
declare const SurrealJsonValue: Schema.Codec<SurrealJsonValue>;

export { Uuid as A, Bytes as B, decimalFromString as C, Decimal as D, type EdgeDescriptor as E, type FunctionDescriptor as F, edge as G, fn as H, Int64 as I, int64 as J, intFor as K, refine as L, replaceField as M, type Narrowing as N, type Operation as O, type Permission as P, store as Q, type Refinements as R, SurrealNumber as S, type TableDescriptor as T, Unsupported as U, type ViewDescriptor as V, table as W, toWellFormed as X, view as Y, withPresence as Z, Float as a, DECIMAL_MAX_MANTISSA as b, DECIMAL_MAX_SCALE as c, DecimalLiteral as d, type EdgeIn as e, type EdgeOut as f, type FieldPermissions as g, type FieldPresence as h, type FunctionArgs as i, type FunctionResult as j, INT64_MAX as k, INT64_MIN as l, type IndexDescriptor as m, type IndexType as n, Int as o, Int64Literal as p, type IntProfile as q, type Presence as r, type Replaced as s, type RowSchema as t, type StoreDescriptor as u, SurrealString as v, SurrealJsonValue as w, SurrealMergeValue as x, SurrealValue as y, type TablePermissions as z };
