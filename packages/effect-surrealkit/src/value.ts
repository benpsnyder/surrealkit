import { Effect, Schema, SchemaIssue, SchemaParser } from 'effect';
import {
	FileRef,
	type RecordId,
	type DateTime as SdkDateTime,
	type Decimal as SdkDecimal,
	type Duration as SdkDuration,
	type Geometry as SdkGeometry,
	type Range as SdkRange,
	type Uuid as SdkUuid,
	Table,
} from 'surrealdb';

import { Range } from './collections.js';
import { Decimal } from './decimal.js';
import { Geometry } from './geometry.js';
import { isPlainObject } from './internal/declare.js';
import { RecordIdAny } from './record-id.js';
import { Uuid } from './scalars.js';
import { DateTime, Duration } from './temporal.js';

// Check the input prototype before the record codec copies its properties,
// in both directions. Otherwise encoding can erase a class instance.
const plainRecord = <T>(value: Schema.Codec<T>) =>
	Schema.declareConstructor<{ readonly [key: string]: T }>()(
		[Schema.Record(Schema.String, value)],
		([record]) =>
			(input, ast, options) => {
				if (Array.isArray(input) || !isPlainObject(input)) {
					return Effect.fail(
						new SchemaIssue.InvalidType(ast, input, options),
					);
				}
				return SchemaParser.decodeUnknownEffect(record)(input, options);
			},
		{ expected: 'a plain object' },
	);

/**
 * An open native value for FLEXIBLE objects and SCHEMALESS fields.
 * The SDK also accepts a JS `Date` on writes.
 */
export type SurrealValue =
	| null
	| boolean
	| number
	| bigint
	| string
	| SdkDateTime
	| RecordId
	| SdkDuration
	| SdkDecimal
	| SdkUuid
	| SdkGeometry
	| SdkRange<unknown, unknown>
	| Date
	| Table
	| FileRef
	| Uint8Array
	| ReadonlySet<SurrealValue>
	| ReadonlyArray<SurrealValue>
	| { readonly [key: string]: SurrealValue };

const NativeElement = Schema.suspend(() => SurrealValue);

/** The native values that hold no other value. */
const nativeLeaves = [
	Schema.Null,
	Schema.Boolean,
	Schema.Number,
	Schema.BigInt,
	Schema.String,
	DateTime,
	RecordIdAny,
	Duration,
	Decimal,
	Uuid,
	Geometry,
	Range,
	Schema.Date,
	Schema.instanceOf(Table),
	Schema.instanceOf(FileRef),
	Schema.instanceOf(Uint8Array),
] as const;

const nativeNonRecord = [
	...nativeLeaves,
	Schema.ReadonlySet(NativeElement),
	Schema.Array(NativeElement),
] as const;

export const SurrealValue: Schema.Codec<SurrealValue> = Schema.Union([
	...nativeNonRecord,
	plainRecord(NativeElement),
]).annotate({ identifier: 'SurrealValue' });

/** A member of a MERGE object: NONE removes a key, including in a nested patch. */
export type SurrealMergeValue =
	| SurrealValue
	| undefined
	| { readonly [key: string]: SurrealMergeValue };
export const SurrealMergeValue: Schema.Codec<SurrealMergeValue> = Schema.Union([
	Schema.Undefined,
	...nativeNonRecord,
	plainRecord(Schema.suspend(() => SurrealMergeValue)),
]).annotate({ identifier: 'SurrealMergeValue' });

/**
 * Any value a native query result can contain: every {@link SurrealValue},
 * plus NONE (`undefined`, as the SDK decodes it) at any depth, at the top
 * level, as a record property's value, and as an array or set element.
 *
 * Use it where a value is carried before its own decoder runs (a raw row, a
 * statement's result, the answer of a function that may be NONE), instead of
 * `Schema.Unknown`. `SurrealValue` refuses NONE at every depth, because it
 * describes what a binding or a stored open value holds, and
 * `SurrealMergeValue` allows it in records but not in arrays; this one
 * describes what the SDK hands back. Everything else `SurrealValue` refuses
 * is refused here too, at any depth: functions, symbols, class instances
 * that are not SDK values, and objects that are not plain.
 *
 * Decoding and encoding are the identity: nothing is coerced or stripped, and
 * an `undefined` property or element comes out where it went in. Decode with
 * `NoneAsAbsent` and the table's own schema to read NONE as an absent key.
 * NONE has no JSON form, so {@link SurrealJsonValue} stays without it.
 */
export type SurrealResultValue =
	| SurrealValue
	| undefined
	| ReadonlySet<SurrealResultValue>
	| ReadonlyArray<SurrealResultValue>
	| { readonly [key: string]: SurrealResultValue };

const ResultElement = Schema.suspend(() => SurrealResultValue);

export const SurrealResultValue: Schema.Codec<SurrealResultValue> =
	Schema.Union([
		Schema.Undefined,
		...nativeLeaves,
		Schema.ReadonlySet(ResultElement),
		Schema.Array(ResultElement),
		plainRecord(ResultElement),
	]).annotate({ identifier: 'SurrealResultValue' });

/**
 * An open object of {@link SurrealResultValue}s: a result row (or any object
 * in a result) before its table's decoder runs. A property may hold NONE, and
 * so may anything nested in it. Refuses arrays, class instances (SDK values
 * included: a `RecordId` is not an object here) and every value that is not a
 * plain object. Decoding and encoding are the identity.
 */
export type SurrealResultObject = {
	readonly [key: string]: SurrealResultValue;
};
export const SurrealResultObject: Schema.Codec<SurrealResultObject> =
	plainRecord(ResultElement).annotate({ identifier: 'SurrealResultObject' });

/**
 * An array of {@link SurrealResultValue}s: a statement's result set before
 * its rows are decoded. An element may be NONE (`SELECT VALUE` of an absent
 * field, a compare-and-swap that answers `[NONE, 5, NULL]`). Refuses a set
 * and every value that is not an array. Decoding and encoding are the
 * identity.
 */
export type SurrealResultArray = ReadonlyArray<SurrealResultValue>;
export const SurrealResultArray: Schema.Codec<SurrealResultArray> =
	Schema.Array(ResultElement).annotate({ identifier: 'SurrealResultArray' });

/** An open value in SurrealDB's JSON world (HTTP `/sql`). */
export type SurrealJsonValue =
	| null
	| boolean
	| number
	| string
	| ReadonlyArray<SurrealJsonValue>
	| { readonly [key: string]: SurrealJsonValue };

const JsonElement = Schema.suspend(() => SurrealJsonValue);

export const SurrealJsonValue: Schema.Codec<SurrealJsonValue> = Schema.Union([
	Schema.Null,
	Schema.Boolean,
	Schema.Finite,
	Schema.String,
	Schema.Array(JsonElement),
	plainRecord(JsonElement),
]).annotate({ identifier: 'SurrealJsonValue' });
