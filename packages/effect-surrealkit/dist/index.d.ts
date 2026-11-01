import { Schema, Brand, DateTime as DateTime$2 } from 'effect';
import * as surrealdb from 'surrealdb';
import { Range as Range$1, Bound, Decimal as Decimal$1, Geometry as Geometry$1, GeometryCollection as GeometryCollection$1, GeometryLine as GeometryLine$1, GeometryMultiLine as GeometryMultiLine$1, GeometryMultiPoint as GeometryMultiPoint$1, GeometryMultiPolygon as GeometryMultiPolygon$1, GeometryPoint as GeometryPoint$1, GeometryPolygon as GeometryPolygon$1, Duration as Duration$1, RecordId, Table, Uuid as Uuid$1, FileRef, RecordIdValue, DateTime as DateTime$1 } from 'surrealdb';
import * as effect_DateTime from 'effect/DateTime';

/** `set<T>` / `set<T, N>` and `range`. */

/** How set elements are compared for uniqueness. */
type SetEquality = 'surreal' | 'reference';
interface SetOptions {
    /** `set<T, N>`: the exact number of distinct elements. */
    readonly length?: number;
    /**
     * `"surreal"` (default) compares elements with SurrealDB value equality
     * (the SDK's `equals`), so two equal record ids are duplicates;
     * `"reference"` uses JS `Set` identity.
     */
    readonly equality?: SetEquality;
}
/**
 * `set<T>`: a `ReadonlySet` whose elements decode through `item`. The SDK
 * decodes SurrealQL sets as JS `Set`s and encodes `Set`s as SurrealQL sets.
 *
 * Both directions require distinct elements (under `equality`) and, with
 * `length`, exactly that many: SurrealDB 3.3.0 aborts the server on a
 * duplicate-bearing write to an `option<set<T, N>>` field, so sets are only
 * ever sent deduplicated and of the exact length. Distinctness is checked on
 * the input of each direction, so a lossy item codec (`DateTimeEffect`, at
 * millisecond precision) decodes a stored set whose elements differ below a
 * millisecond, and refuses to encode two elements that would be stored as one.
 */
declare const SetOf: <S extends Schema.Top>(item: S, options?: SetOptions) => Schema.declareConstructor<ReadonlySet<S["Type"]>, ReadonlySet<S["Encoded"]>, readonly [S], ReadonlySet<S["Type"]>>;
/** A range bound as the SDK models it. */
type RangeBound<T> = Bound<T>;
/**
 * `range`: an SDK `Range` with any bound values (schema document v2 does not
 * parameterise ranges).
 */
declare const Range: Schema.declareConstructor<Range$1<unknown, unknown>, Range$1<unknown, unknown>, readonly [], Range$1<unknown, unknown>>;

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

/** `geometry` / `geometry<point | polygon | …>`: the SDK geometry classes. */

/** The seven geometry kinds of schema document v2. */
type GeometryKind = 'collection' | 'line' | 'multiline' | 'multipoint' | 'multipolygon' | 'point' | 'polygon';
interface GeometryKinds {
    readonly collection: GeometryCollection$1;
    readonly line: GeometryLine$1;
    readonly multiline: GeometryMultiLine$1;
    readonly multipoint: GeometryMultiPoint$1;
    readonly multipolygon: GeometryMultiPolygon$1;
    readonly point: GeometryPoint$1;
    readonly polygon: GeometryPolygon$1;
}
/**
 * `geometry<…>`: an SDK geometry of one of `kinds`; any of the seven when
 * `kinds` is empty.
 */
declare const GeometryOf: <const Ks extends ReadonlyArray<GeometryKind>>(kinds: Ks) => Schema.declareConstructor<Ks extends readonly [] ? Geometry$1 : GeometryKinds[Ks[number]], Ks extends readonly [] ? Geometry$1 : GeometryKinds[Ks[number]], readonly [], Ks extends readonly [] ? Geometry$1 : GeometryKinds[Ks[number]]>;
/** `geometry<point>`. */
declare const GeometryPoint: Schema.declareConstructor<GeometryPoint$1, GeometryPoint$1, readonly [], GeometryPoint$1>;
/** `geometry<line>`. */
declare const GeometryLine: Schema.declareConstructor<GeometryLine$1, GeometryLine$1, readonly [], GeometryLine$1>;
/** `geometry<polygon>`. */
declare const GeometryPolygon: Schema.declareConstructor<GeometryPolygon$1, GeometryPolygon$1, readonly [], GeometryPolygon$1>;
/** `geometry<multipoint>`. */
declare const GeometryMultiPoint: Schema.declareConstructor<GeometryMultiPoint$1, GeometryMultiPoint$1, readonly [], GeometryMultiPoint$1>;
/** `geometry<multiline>`. */
declare const GeometryMultiLine: Schema.declareConstructor<GeometryMultiLine$1, GeometryMultiLine$1, readonly [], GeometryMultiLine$1>;
/** `geometry<multipolygon>`. */
declare const GeometryMultiPolygon: Schema.declareConstructor<GeometryMultiPolygon$1, GeometryMultiPolygon$1, readonly [], GeometryMultiPolygon$1>;
/** `geometry<collection>`. */
declare const GeometryCollection: Schema.declareConstructor<GeometryCollection$1, GeometryCollection$1, readonly [], GeometryCollection$1>;
/** Bare `geometry`: any of the seven kinds. */
declare const Geometry: Schema.declareConstructor<Geometry$1, Geometry$1, readonly [], Geometry$1>;

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

/** `datetime` as RFC 3339 text, nanosecond-preserving. */
declare const DateTimeFromJson: Schema.declareConstructor<surrealdb.DateTime, string, readonly [Schema.decodeTo<Schema.Codec<surrealdb.DateTime, surrealdb.DateTime, never, never>, Schema.String, never, never>], surrealdb.DateTime>;
type DateTimeJsonEncoded = typeof DateTimeFromJson.Encoded;
/** `decimal` as decimal text (`"1.5"`), never through a JS number. */
declare const DecimalFromJson: Schema.declareConstructor<Decimal$1, string, readonly [Schema.decodeTo<Schema.Codec<Decimal$1, Decimal$1, never, never>, Schema.String, never, never>], Decimal$1>;
type DecimalJsonEncoded = typeof DecimalFromJson.Encoded;
/** `duration` as SurrealQL duration text (`"1h30m"`). */
declare const DurationFromJson: Schema.declareConstructor<Duration$1, string, readonly [Schema.decodeTo<Schema.Codec<Duration$1, Duration$1, never, never>, Schema.String, never, never>], Duration$1>;
type DurationJsonEncoded = typeof DurationFromJson.Encoded;
/** `uuid` as canonical text. */
declare const UuidFromJson: Schema.declareConstructor<Uuid$1, string, readonly [Schema.decodeTo<Schema.Codec<Uuid$1, Uuid$1, never, never>, Schema.String, never, never>], Uuid$1>;
type UuidJsonEncoded = typeof UuidFromJson.Encoded;
/**
 * `record<table>` as the record-id text SurrealDB JSON renders
 * (`person:ann`, `` person:`a b` ``), parsed with the SDK's SurrealQL value
 * grammar after the bare-key rule of {@link recordIdFromText}, never by
 * splitting on `:`.
 */
declare const RecordIdFromJson: <const Tb extends string>(table: Tb) => Schema.declareConstructor<RecordId<Tb>, string, readonly [Schema.decodeTo<Schema.declareConstructor<RecordId<Tb>, RecordId<Tb>, readonly [Schema.declareConstructor<surrealdb.RecordIdValue, surrealdb.RecordIdValue, readonly [], surrealdb.RecordIdValue>], RecordId<Tb>>, Schema.String, never, never>], RecordId<Tb>>;
/**
 * `int` (bigint profile) from JSON: a safe-integer JSON number or decimal
 * integer text. A JSON number beyond `±(2^53 - 1)` was already rounded by
 * `JSON.parse` and fails. Encodes safe values as numbers, others as text.
 */
declare const Int64FromJson: Schema.declareConstructor<Int64, string | number, readonly [Schema.decodeTo<Schema.declareConstructor<Int64, number | bigint, readonly [], Int64>, Schema.Union<readonly [Schema.Number, Schema.String]>, never, never>], Int64>;
type Int64JsonEncoded = typeof Int64FromJson.Encoded;
/** `bytes` as SurrealDB JSON renders them: an array of byte numbers. */
declare const BytesFromJson: Schema.declareConstructor<Uint8Array<ArrayBufferLike>, readonly number[], readonly [Schema.decodeTo<Schema.declareConstructor<Uint8Array<ArrayBufferLike>, ArrayBuffer | Uint8Array<ArrayBufferLike>, readonly [], Uint8Array<ArrayBufferLike>>, Schema.$Array<Schema.Number>, never, never>], Uint8Array<ArrayBufferLike>>;
type BytesJsonEncoded = typeof BytesFromJson.Encoded;
/** Any `record` as the SurrealQL record-id text SurrealDB JSON renders. */
declare const RecordIdAnyFromJson: Schema.declareConstructor<RecordId, string, readonly [Schema.decodeTo<Schema.declareConstructor<RecordId, RecordId, readonly [], RecordId>, Schema.String, never, never>], RecordId>;
/**
 * A record-id schema (a generated `PersonId`, a union of them, or
 * `RecordIdAny`) read from SurrealQL record-id text. The result is that
 * schema's type, brand included.
 */
declare const RecordIdFromJsonAs: <S extends Schema.Codec<unknown, RecordId>>(id: S) => Schema.declareConstructor<S["Type"], string, readonly [Schema.compose<S, Schema.declareConstructor<RecordId, string, readonly [Schema.decodeTo<Schema.declareConstructor<RecordId, RecordId, readonly [], RecordId>, Schema.String, never, never>], RecordId>>], S["Type"]>;
/** `table` / `table<a | b>` from the bare table name SurrealDB JSON renders. */
declare const TableFromJson: <const Tbs extends ReadonlyArray<string>>(tables: Tbs) => Schema.declareConstructor<Table<Tbs extends readonly [] ? string : Tbs[number]>, string, readonly [Schema.decodeTo<Schema.declareConstructor<Table<Tbs extends readonly [] ? string : Tbs[number]>, Table<Tbs extends readonly [] ? string : Tbs[number]>, readonly [], Table<Tbs extends readonly [] ? string : Tbs[number]>>, Schema.String, never, never>], Table<Tbs extends readonly [] ? string : Tbs[number]>>;
/** `file` / `file<a | b>` from the `f"bucket:/key"` text SurrealDB JSON renders. */
declare const FileRefFromJson: <const Bs extends ReadonlyArray<string>>(buckets: Bs) => Schema.declareConstructor<surrealdb.FileRef, string, readonly [Schema.decodeTo<Schema.declareConstructor<surrealdb.FileRef, surrealdb.FileRef, readonly [], surrealdb.FileRef>, Schema.String, never, never>], surrealdb.FileRef>;
/**
 * `range` from the SurrealQL range text SurrealDB JSON renders (`1..5`,
 * `'a'..'z'`). Encoding prints SurrealQL through the SDK, which does not
 * quote string bounds.
 */
declare const RangeFromJson: Schema.declareConstructor<surrealdb.Range<unknown, unknown>, string, readonly [Schema.decodeTo<Schema.declareConstructor<surrealdb.Range<unknown, unknown>, surrealdb.Range<unknown, unknown>, readonly [], surrealdb.Range<unknown, unknown>>, Schema.String, never, never>], surrealdb.Range<unknown, unknown>>;
/**
 * A geometry schema (`GeometryPoint`, `GeometryOf([...])`, `Geometry`) read
 * from the GeoJSON object SurrealDB JSON renders.
 */
declare const GeometryFromJson: <S extends Schema.Codec<unknown, Geometry$1>>(geometry: S) => Schema.declareConstructor<S["Type"], {
    readonly [x: string]: unknown;
}, readonly [Schema.decodeTo<S, Schema.$Record<Schema.String, Schema.Unknown>, never, never>], S["Type"]>;
/**
 * `number` from JSON: a JSON number, or the decimal text SurrealDB JSON
 * renders for a decimal. An int beyond `±(2^53 - 1)` was already rounded by
 * `JSON.parse`.
 */
declare const SurrealNumberFromJson: Schema.declareConstructor<number | bigint | Decimal$1, string | number, readonly [Schema.decodeTo<Schema.declareConstructor<number | bigint | Decimal$1, number | bigint | Decimal$1, readonly [], number | bigint | Decimal$1>, Schema.Union<readonly [Schema.Number, Schema.String]>, never, never>], number | bigint | Decimal$1>;
/**
 * `datetime` under the effect-datetime profile, from RFC 3339 text:
 * millisecond precision, like {@link DateTimeEffect}.
 */
declare const DateTimeEffectFromJson: Schema.declareConstructor<effect_DateTime.Utc, string, readonly [Schema.compose<Schema.declareConstructor<effect_DateTime.Utc, surrealdb.DateTime, readonly [Schema.decodeTo<Schema.DateTimeUtc, Schema.declareConstructor<surrealdb.DateTime, surrealdb.DateTime, readonly [], surrealdb.DateTime>, never, never>], effect_DateTime.Utc>, Schema.declareConstructor<surrealdb.DateTime, string, readonly [Schema.decodeTo<Schema.Codec<surrealdb.DateTime, surrealdb.DateTime, never, never>, Schema.String, never, never>], surrealdb.DateTime>>], effect_DateTime.Utc>;
/** `set<T>` as SurrealDB JSON renders it: an array of distinct elements. */
declare const SetFromJson: <S extends Schema.Top>(item: S, options?: {
    readonly length?: number;
}) => Schema.declareConstructor<ReadonlySet<S["Type"]>, readonly S["Encoded"][], readonly [Schema.decodeTo<Schema.declareConstructor<ReadonlySet<S["Type"]>, ReadonlySet<S["Type"]>, readonly [Schema.toType<S>], ReadonlySet<S["Type"]>>, Schema.$Array<S>, never, never>], ReadonlySet<S["Type"]>>;

/**
 * `record<…>`, `table<…>` and `file<…>`.
 *
 * Record ids are checked by their SDK structure — `id.table.name` and the
 * key's runtime shape — never by parsing `table:key` text.
 */

/**
 * Any record-id key the SDK produces: string, integer (number or bigint),
 * `Uuid`, array or object. Used when a table declares no `id` kind.
 */
declare const RecordKey: Schema.declareConstructor<RecordIdValue, RecordIdValue, readonly [], RecordIdValue>;
/** A record id of table `Tb` whose key has the decoded type `Key`. */
type RecordIdOf<Tb extends string, Key> = RecordId<Tb> & {
    readonly id: Key;
};
/**
 * `record<table>`: an SDK `RecordId` whose `table.name` is `table`.
 *
 * With `key`, the record's key is decoded and encoded through that schema
 * (for example `Int` for `DEFINE FIELD id ON t TYPE int`, or a `Struct` for
 * an object key); without it, any key the SDK produces is accepted.
 *
 * Brand the result per logical store in generated code:
 * `RecordIdFor("person").pipe(Schema.brand("app/person"))`.
 */
declare function RecordIdFor<const Tb extends string>(table: Tb): Schema.declareConstructor<RecordId<Tb>, RecordId<Tb>, readonly [typeof RecordKey]>;
declare function RecordIdFor<const Tb extends string, K extends Schema.Top>(table: Tb, options: {
    readonly key: K;
}): Schema.declareConstructor<RecordIdOf<Tb, K['Type']>, RecordIdOf<Tb, K['Encoded']>, readonly [K]>;
/** Bare `record`: an SDK `RecordId` of any table. */
declare const RecordIdAny: Schema.declareConstructor<RecordId, RecordId, readonly [], RecordId>;
type Names<Tbs extends ReadonlyArray<string>> = Tbs extends readonly [] ? string : Tbs[number];
/** `table` / `table<a | b>`: an SDK `Table` naming one of `tables` (any when empty). */
declare const TableFor: <const Tbs extends ReadonlyArray<string>>(tables: Tbs) => Schema.declareConstructor<Table<Names<Tbs>>, Table<Names<Tbs>>, readonly [], Table<Names<Tbs>>>;
/** `file` / `file<a | b>`: an SDK `FileRef` in one of `buckets` (any when empty). */
declare const FileRefFor: <const Bs extends ReadonlyArray<string>>(buckets: Bs) => Schema.declareConstructor<FileRef, FileRef, readonly [], FileRef>;
type RecordIdSchemas = {
    readonly [table: string]: Schema.Top;
};
/** The application value of {@link taggedRecordId}: `{ _tag: table, id }`. */
type TaggedRecordId<M extends RecordIdSchemas> = {
    readonly [K in keyof M & string]: {
        readonly _tag: K;
        readonly id: M[K]['Type'];
    };
}[keyof M & string];
/**
 * An application representation of `record<a | b>`: decodes a record id into
 * `{ _tag: "<table>", id }` so the union can be matched on `_tag`, and
 * encodes it back to the bare id. The tag is never stored. Encoding rejects
 * a tag that disagrees with the id's table.
 */
declare const taggedRecordId: <const M extends RecordIdSchemas>(ids: M) => Schema.declareConstructor<TaggedRecordId<M>, M[keyof M]["Encoded"], readonly [Schema.Codec<unknown, unknown>]>;

/**
 * NONE versus NULL versus absent.
 *
 * The SDK decodes SurrealQL NONE as `undefined`, so an object coming back
 * from a query can carry a key whose value is `undefined` where the stored
 * record simply has no value. Exact `optionalKey` schemas reject such keys.
 * `NoneAsAbsent` removes them first; `null` is kept, because NULL is a value.
 */

/**
 * Removes properties whose value is `undefined` from plain objects, at every
 * depth, including inside arrays and sets. Arrays keep their `undefined`
 * elements (an `array<option<T>>` element is positional). Class instances
 * (SDK values) are left untouched.
 */
declare const stripNone: (value: unknown) => unknown;
/**
 * Decodes through `schema` after {@link stripNone}, so a NONE that the SDK
 * surfaced as an `undefined` property reads as an absent key. Encoding is
 * exactly the wrapped schema's encoding: an `undefined` property is kept, so
 * a `Merge` value still sends NONE to remove a field.
 */
declare const NoneAsAbsent: <S extends Schema.Top>(schema: S) => Schema.declareConstructor<S["Type"], S["Encoded"], readonly [S], S["Type"]>;

/** `uuid`, `bytes`, and kinds with no SDK value representation. */

/** Replaces lone surrogates with U+FFFD, as UTF-8 transport would. */
declare const toWellFormed: (text: string) => string;
/**
 * `string`: a JS string SurrealDB can store. SurrealDB strings are UTF-8, so
 * a JS string containing a lone surrogate cannot be represented: the SDK's
 * CBOR encoder would silently replace it with U+FFFD. Such strings fail here
 * instead.
 */
declare const SurrealString: Schema.declareConstructor<string, string, readonly [], string>;
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
interface TableDescriptor {
    readonly name: string;
    readonly type: 'normal' | 'any' | 'relation';
    readonly schemafull: boolean;
    readonly drop: boolean;
    readonly id: Schema.Top;
    readonly select: RowSchema;
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
    readonly edge?: EdgeDescriptor;
    /** The schema document's semanticDigest. */
    readonly digest: string;
}
/** A view: an id and its query; its row shape is not derived. */
interface ViewDescriptor {
    readonly name: string;
    readonly type: 'view';
    readonly id: Schema.Top;
    readonly view: string;
    readonly permissions: TablePermissions;
    readonly digest: string;
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
    } : K extends Operation ? ReplaceVariant<T[K], Replacements> : T[K];
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
 * `datetime` and `duration`.
 *
 * Out-of-range values are rejected here because the engine does not reject
 * them usefully (measured on SurrealDB 3.2.4 with surrealdb.js 2.1.1): a
 * datetime outside the engine's range makes the server answer with an error
 * the SDK never resolves, so the query hangs; a negative SDK `Duration` is
 * silently sent (and stored) as `0ns`.
 */

/** Earliest datetime the engine stores: `-262143-01-01T00:00:00Z`. */
declare const DATETIME_MIN_SECONDS = -8334601228800n;
/** Latest whole second the engine stores: `+262142-12-31T23:59:59Z`. */
declare const DATETIME_MAX_SECONDS = 8210266876799n;
/**
 * `datetime`, `datetime: "sdk"` profile (default): the SDK `DateTime` class,
 * nanosecond-preserving. Requires the SDK's default `useNativeDates: false`.
 */
declare const DateTime: Schema.declareConstructor<DateTime$1, DateTime$1, readonly [], DateTime$1>;
/**
 * Parses RFC 3339 datetime text (with the `±YYYYYY` extended year SurrealDB
 * prints for years outside 0000–9999) into an SDK `DateTime`, keeping every
 * nanosecond digit.
 *
 * Not delegated to the SDK: surrealdb.js 2.1.1 formats pre-1970 datetimes
 * with a fractional second one second late (`[-522127542, 999999991]` prints
 * as `…20:34:19.999999991Z`; SurrealDB prints `…20:34:18.999999991Z`).
 *
 * @throws RangeError for malformed text or impossible calendar values.
 */
declare const dateTimeFromString: (text: string) => DateTime$1;
/**
 * Formats an SDK `DateTime` as RFC 3339 UTC text with every significant
 * nanosecond digit (see {@link dateTimeFromString} for why the SDK's own
 * `toString` is not used).
 */
declare const dateTimeToString: (value: DateTime$1) => string;
/**
 * `datetime`, `datetime: "effect-datetime"` profile: Effect's `DateTime.Utc`.
 *
 * **Lossy by design**: Effect datetimes have millisecond precision, so
 * decoding truncates sub-millisecond digits (towards negative infinity).
 * Encoding produces an SDK `DateTime` on a whole millisecond.
 */
declare const DateTimeEffect: Schema.declareConstructor<DateTime$2.Utc, DateTime$1, readonly [Schema.decodeTo<Schema.DateTimeUtc, Schema.declareConstructor<DateTime$1, DateTime$1, readonly [], DateTime$1>, never, never>], DateTime$2.Utc>;
/** Largest duration the engine stores: `2^64 - 1` seconds plus 999,999,999ns. */
declare const DURATION_MAX_SECONDS: bigint;
/** `duration`: the SDK `Duration` class, nanosecond-preserving, non-negative. */
declare const Duration: Schema.declareConstructor<Duration$1, Duration$1, readonly [], Duration$1>;
/** A `duration` literal kind such as `1d`: exactly that duration. */
declare const DurationLiteral: <const V extends string>(value: V) => Schema.declareConstructor<Duration$1, Duration$1, readonly [], Duration$1>;

export { Bytes, BytesFromJson, type BytesJsonEncoded, DATETIME_MAX_SECONDS, DATETIME_MIN_SECONDS, DECIMAL_MAX_MANTISSA, DECIMAL_MAX_SCALE, DURATION_MAX_SECONDS, DateTime, DateTimeEffect, DateTimeEffectFromJson, DateTimeFromJson, type DateTimeJsonEncoded, Decimal, DecimalFromJson, type DecimalJsonEncoded, DecimalLiteral, Duration, DurationFromJson, type DurationJsonEncoded, DurationLiteral, type EdgeDescriptor, type EdgeIn, type EdgeOut, type FieldPresence, FileRefFor, FileRefFromJson, type FunctionArgs, type FunctionDescriptor, type FunctionResult, Geometry, GeometryCollection, GeometryFromJson, type GeometryKind, GeometryLine, GeometryMultiLine, GeometryMultiPoint, GeometryMultiPolygon, GeometryOf, GeometryPoint, GeometryPolygon, INT64_MAX, INT64_MIN, Int, Int64, Int64FromJson, type Int64JsonEncoded, Int64Literal, type IntProfile, type Narrowing, NoneAsAbsent, type Operation, type Permission, type Presence, Range, type RangeBound, RangeFromJson, RecordIdAny, RecordIdAnyFromJson, RecordIdFor, RecordIdFromJson, RecordIdFromJsonAs, type RecordIdOf, RecordKey, type Refinements, type Replaced, type RowSchema, type SetEquality, SetFromJson, SetOf, type SetOptions, SurrealString as String, SurrealNumber, SurrealNumberFromJson, type TableDescriptor, TableFor, TableFromJson, type TablePermissions, type TaggedRecordId, Unsupported, Uuid, UuidFromJson, type UuidJsonEncoded, type ViewDescriptor, dateTimeFromString, dateTimeToString, decimalFromString, edge, fn, int64, intFor, refine, replaceField, stripNone, table, taggedRecordId, toWellFormed, view, withPresence };
