import { Schema, SchemaAST } from 'effect';
import * as surrealdb from 'surrealdb';
import { Range as Range$1, Bound, Geometry as Geometry$1, GeometryCollection as GeometryCollection$1, GeometryLine as GeometryLine$1, GeometryMultiLine as GeometryMultiLine$1, GeometryMultiPoint as GeometryMultiPoint$1, GeometryMultiPolygon as GeometryMultiPolygon$1, GeometryPoint as GeometryPoint$1, GeometryPolygon as GeometryPolygon$1, Decimal, Duration, RecordId, Table, Uuid, FileRef, RecordIdValue } from 'surrealdb';
import { I as Int64 } from './value-Dzlmtd6Q.js';
export { B as Bytes, D as DECIMAL_MAX_MANTISSA, a as DECIMAL_MAX_SCALE, b as Decimal, c as DecimalLiteral, F as Float, d as INT64_MAX, e as INT64_MIN, f as Int, g as Int64Literal, h as IntProfile, i as String, j as SurrealJsonValue, k as SurrealMergeValue, l as SurrealNumber, S as SurrealValue, U as Unsupported, m as Uuid, n as decimalFromString, o as int64, p as intFor, t as toWellFormed } from './value-Dzlmtd6Q.js';
import * as effect_DateTime from 'effect/DateTime';
export { N as NoneAsAbsent, s as stripNone } from './row-CLBe1uWx.js';
export { E as EdgeDescriptor, a as EdgeIn, b as EdgeOut, F as FieldPermissions, c as FieldPresence, d as FunctionArgs, e as FunctionDescriptor, f as FunctionResult, I as IndexDescriptor, g as IndexType, N as Narrowing, h as NoEntries, O as Operation, P as Permission, i as Presence, R as Refinements, j as Replaced, k as RowSchema, S as StoreDescriptor, T as TableDescriptor, l as TablePermissions, V as ViewDescriptor, m as edge, n as fn, r as refine, o as replaceField, s as store, t as table, v as view, w as withPresence } from './table-iF6L7xrW.js';
export { D as DATETIME_MAX_SECONDS, a as DATETIME_MIN_SECONDS, b as DURATION_MAX_SECONDS, c as DateTime, d as DateTimeEffect, e as Duration, f as DurationLiteral, g as dateTimeFromString, h as dateTimeToString } from './temporal-6pYMjhGw.js';

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
 * The exactly empty object.
 *
 * In Effect 4 `Schema.Struct({})` declares no keys and so checks only that
 * the value is not `null` or `undefined`: it accepts any object, string,
 * number or array and passes it through unchanged, even under
 * `onExcessProperty: "error"`. SurrealDB is stricter: a `{}` literal kind,
 * a closed object with no declared fields and the content of a schemafull
 * table with no writable fields all accept exactly `{}`. {@link EmptyObject}
 * is that shape.
 */

/**
 * A check that the value is a plain object without own enumerable keys:
 * `{}` or `Object.create(null)`, not an array or a class instance. Its JSON
 * Schema is `{ "type": "object", "additionalProperties": false }`.
 */
declare const isEmptyObject: (annotations?: Schema.Annotations.Filter) => SchemaAST.Filter<object>;
/**
 * Exactly `{}`: a `Schema.Struct({})` that also refuses every key, every
 * array and every value that is not a plain object, in both directions.
 *
 * Generated modules print it wherever an object has no fields: the create,
 * merge and content inputs of a schemafull table with no writable fields, a
 * closed nested object with no declared fields, and the `{}` literal kind.
 * It stays a `Schema.Struct`, so a table descriptor's operation schemas keep
 * their `fields` (none) and its TypeScript type stays `{}`: a caller that
 * passes `{}` is unaffected, and a stray key fails at run time instead of
 * reaching SurrealDB. The base of an open row (`Schema.StructWithRest` over a
 * record) stays a plain `Schema.Struct({})`, because there the rest holds the
 * keys.
 */
declare const EmptyObject: Schema.Struct<{}>;

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
declare const DurationFromJson: Schema.declareConstructor<Duration, string, readonly [Schema.decodeTo<Schema.Codec<Duration, Duration, never, never>, Schema.String, never, never>], Duration>;
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

export { BytesFromJson, type BytesJsonEncoded, DateTimeEffectFromJson, DateTimeFromJson, type DateTimeJsonEncoded, DecimalFromJson, type DecimalJsonEncoded, DurationFromJson, type DurationJsonEncoded, EmptyObject, FileRefFor, FileRefFromJson, Geometry, GeometryCollection, GeometryFromJson, type GeometryKind, GeometryLine, GeometryMultiLine, GeometryMultiPoint, GeometryMultiPolygon, GeometryOf, GeometryPoint, GeometryPolygon, Int64, Int64FromJson, type Int64JsonEncoded, Range, type RangeBound, RangeFromJson, RecordIdAny, RecordIdAnyFromJson, RecordIdFor, RecordIdFromJson, RecordIdFromJsonAs, type RecordIdOf, RecordKey, type SetEquality, SetFromJson, SetOf, type SetOptions, SurrealNumberFromJson, TableFor, TableFromJson, type TaggedRecordId, UuidFromJson, type UuidJsonEncoded, isEmptyObject, taggedRecordId };
