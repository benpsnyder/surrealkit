import { Schema, DateTime as DateTime$2 } from 'effect';
import * as surrealdb from 'surrealdb';
import { Range as Range$1, Bound, Geometry as Geometry$1, GeometryCollection as GeometryCollection$1, GeometryLine as GeometryLine$1, GeometryMultiLine as GeometryMultiLine$1, GeometryMultiPoint as GeometryMultiPoint$1, GeometryMultiPolygon as GeometryMultiPolygon$1, GeometryPoint as GeometryPoint$1, GeometryPolygon as GeometryPolygon$1, Decimal, Duration as Duration$1, RecordId, Table, Uuid, FileRef, RecordIdValue, DateTime as DateTime$1 } from 'surrealdb';
import { I as Int64 } from './value-Zktp5N5S.js';
export { B as Bytes, b as DECIMAL_MAX_MANTISSA, c as DECIMAL_MAX_SCALE, D as Decimal, d as DecimalLiteral, E as EdgeDescriptor, e as EdgeIn, f as EdgeOut, g as FieldPermissions, h as FieldPresence, a as Float, i as FunctionArgs, F as FunctionDescriptor, j as FunctionResult, k as INT64_MAX, l as INT64_MIN, m as IndexDescriptor, n as IndexType, o as Int, p as Int64Literal, q as IntProfile, N as Narrowing, O as Operation, P as Permission, r as Presence, R as Refinements, s as Replaced, t as RowSchema, u as StoreDescriptor, v as String, w as SurrealJsonValue, x as SurrealMergeValue, S as SurrealNumber, y as SurrealValue, T as TableDescriptor, z as TablePermissions, U as Unsupported, A as Uuid, V as ViewDescriptor, C as decimalFromString, G as edge, H as fn, J as int64, K as intFor, L as refine, M as replaceField, Q as store, W as table, X as toWellFormed, Y as view, Z as withPresence } from './value-Zktp5N5S.js';
import * as effect_DateTime from 'effect/DateTime';
export { N as NoneAsAbsent, s as stripNone } from './row-CLBe1uWx.js';

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

/** `datetime` as RFC 3339 text, nanosecond-preserving. */
declare const DateTimeFromJson: Schema.declareConstructor<surrealdb.DateTime, string, readonly [Schema.decodeTo<Schema.Codec<surrealdb.DateTime, surrealdb.DateTime, never, never>, Schema.String, never, never>], surrealdb.DateTime>;
type DateTimeJsonEncoded = typeof DateTimeFromJson.Encoded;
/** `decimal` as decimal text (`"1.5"`), never through a JS number. */
declare const DecimalFromJson: Schema.declareConstructor<Decimal, string, readonly [Schema.decodeTo<Schema.Codec<Decimal, Decimal, never, never>, Schema.String, never, never>], Decimal>;
type DecimalJsonEncoded = typeof DecimalFromJson.Encoded;
/** `duration` as SurrealQL duration text (`"1h30m"`). */
declare const DurationFromJson: Schema.declareConstructor<Duration$1, string, readonly [Schema.decodeTo<Schema.Codec<Duration$1, Duration$1, never, never>, Schema.String, never, never>], Duration$1>;
type DurationJsonEncoded = typeof DurationFromJson.Encoded;
/** `uuid` as canonical text. */
declare const UuidFromJson: Schema.declareConstructor<Uuid, string, readonly [Schema.decodeTo<Schema.Codec<Uuid, Uuid, never, never>, Schema.String, never, never>], Uuid>;
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
declare const SurrealNumberFromJson: Schema.declareConstructor<number | bigint | Decimal, string | number, readonly [Schema.decodeTo<Schema.declareConstructor<number | bigint | Decimal, number | bigint | Decimal, readonly [], number | bigint | Decimal>, Schema.Union<readonly [Schema.Finite, Schema.String]>, never, never>], number | bigint | Decimal>;
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

export { BytesFromJson, type BytesJsonEncoded, DATETIME_MAX_SECONDS, DATETIME_MIN_SECONDS, DURATION_MAX_SECONDS, DateTime, DateTimeEffect, DateTimeEffectFromJson, DateTimeFromJson, type DateTimeJsonEncoded, DecimalFromJson, type DecimalJsonEncoded, Duration, DurationFromJson, type DurationJsonEncoded, DurationLiteral, FileRefFor, FileRefFromJson, Geometry, GeometryCollection, GeometryFromJson, type GeometryKind, GeometryLine, GeometryMultiLine, GeometryMultiPoint, GeometryMultiPolygon, GeometryOf, GeometryPoint, GeometryPolygon, Int64, Int64FromJson, type Int64JsonEncoded, Range, type RangeBound, RangeFromJson, RecordIdAny, RecordIdAnyFromJson, RecordIdFor, RecordIdFromJson, RecordIdFromJsonAs, type RecordIdOf, RecordKey, type SetEquality, SetFromJson, SetOf, type SetOptions, SurrealNumberFromJson, TableFor, TableFromJson, type TaggedRecordId, UuidFromJson, type UuidJsonEncoded, dateTimeFromString, dateTimeToString, taggedRecordId };
