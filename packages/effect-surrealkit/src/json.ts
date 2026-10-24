/**
 * The JSON codec world, kept apart from the native (SDK value) world.
 *
 * Ordinary SurrealDB JSON (HTTP `/sql`, `JSON` exports) is lossy: NONE and
 * NULL collapse, decimals become strings, sets become arrays, bytes become
 * arrays of numbers, record ids become `table:key` text, and an int beyond
 * `±(2^53 - 1)` cannot survive `JSON.parse`. These codecs read and write that
 * representation explicitly; they are never the default, and their names
 * (`<Name>FromJson`, `<Name>JsonEncoded`) say so.
 */
import { Effect, Schema, SchemaIssue, SchemaTransformation } from 'effect';
import {
	equals,
	Duration as SdkDuration,
	type RecordId as SdkRecordId,
	Uuid as SdkUuid,
	TextCodec,
} from 'surrealdb';

import { SetOf } from './collections.js';
import { Decimal, decimalFromString } from './decimal.js';
import { INT64_MAX, INT64_MIN, Int64 } from './int.js';
import { codeOf, quote, runtimeCode } from './internal/code.js';
import { wrap } from './internal/declare.js';
import { RecordIdFor } from './record-id.js';
import { Bytes, Uuid } from './scalars.js';
import {
	DateTime,
	Duration,
	dateTimeFromString,
	dateTimeToString,
} from './temporal.js';

const failWith = (message: string) =>
	Effect.fail(new SchemaIssue.InvalidValue({ message }));

const attempt = <T>(f: () => T): Effect.Effect<T, SchemaIssue.Issue> =>
	Effect.suspend(() => {
		try {
			return Effect.succeed(f());
		} catch (error) {
			return failWith(
				error instanceof Error ? error.message : String(error),
			);
		}
	});

const fromString = <T>(
	target: Schema.Codec<T, T>,
	name: string,
	options: {
		readonly decode: (text: string) => T;
		readonly encode: (value: T) => string;
		readonly expected: string;
		readonly Type: string;
	},
) =>
	wrap(
		Schema.String.pipe(
			Schema.decodeTo(
				target,
				SchemaTransformation.transformEffect({
					decode: (text: string) =>
						attempt(() => options.decode(text)),
					encode: (value: T) => Effect.succeed(options.encode(value)),
				}),
			),
		),
		{
			id: `effect-surrealkit/${name}`,
			expected: options.expected,
			code: () => runtimeCode(name, options.Type),
		},
	);

/** `datetime` as RFC 3339 text, nanosecond-preserving. */
export const DateTimeFromJson = fromString(DateTime, 'DateTimeFromJson', {
	expected: 'an RFC 3339 datetime string',
	Type: 'Surreal.DateTime',
	decode: dateTimeFromString,
	encode: dateTimeToString,
});
export type DateTimeJsonEncoded = typeof DateTimeFromJson.Encoded;

/** `decimal` as decimal text (`"1.5"`), never through a JS number. */
export const DecimalFromJson = fromString(Decimal, 'DecimalFromJson', {
	expected: 'a decimal string',
	Type: 'Surreal.Decimal',
	decode: decimalFromString,
	encode: (value) => value.toString(),
});
export type DecimalJsonEncoded = typeof DecimalFromJson.Encoded;

const DURATION_TEXT = /^(?:\d+(?:y|w|d|h|m|s|ms|us|µs|ns))+$/;

/** `duration` as SurrealQL duration text (`"1h30m"`). */
export const DurationFromJson = fromString(Duration, 'DurationFromJson', {
	expected: 'a duration string',
	Type: 'Surreal.Duration',
	decode: (text) => {
		if (!DURATION_TEXT.test(text))
			throw new RangeError(`${quote(text)} is not a duration`);
		return new SdkDuration(text);
	},
	encode: (value) => value.toString(),
});
export type DurationJsonEncoded = typeof DurationFromJson.Encoded;

const UUID_TEXT =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** `uuid` as canonical text. */
export const UuidFromJson = fromString(Uuid, 'UuidFromJson', {
	expected: 'a UUID string',
	Type: 'Surreal.Uuid',
	decode: (text) => {
		if (!UUID_TEXT.test(text))
			throw new RangeError(`${quote(text)} is not a UUID`);
		return new SdkUuid(text);
	},
	encode: (value) => value.toString(),
});
export type UuidJsonEncoded = typeof UuidFromJson.Encoded;

/**
 * `record<table>` as SurrealQL record-id text (`person:⟨a b⟩`), parsed with
 * the SDK's SurrealQL value grammar, never by splitting on `:`.
 */
export const RecordIdFromJson = <const Tb extends string>(table: Tb) =>
	wrap(
		Schema.String.pipe(
			Schema.decodeTo(
				RecordIdFor(table),
				SchemaTransformation.transformEffect({
					decode: (text: string) =>
						attempt(
							() =>
								TextCodec.parseRecordId(
									text,
								) as SdkRecordId<Tb>,
						),
					encode: (value: SdkRecordId<Tb>) =>
						Effect.succeed(value.toString()),
				}),
			),
		),
		{
			id: 'effect-surrealkit/RecordIdFromJson',
			payload: { table },
			expected: `a record id string of table ${table}`,
			code: () =>
				runtimeCode(
					`RecordIdFromJson(${quote(table)})`,
					`Surreal.RecordId<${quote(table)}>`,
				),
		},
	);

const INT_TEXT = /^-?\d+$/;

/**
 * `int` (bigint profile) from JSON: a safe-integer JSON number or decimal
 * integer text. A JSON number beyond `±(2^53 - 1)` was already rounded by
 * `JSON.parse` and fails. Encodes safe values as numbers, others as text.
 */
export const Int64FromJson = wrap(
	Schema.Union([Schema.Number, Schema.String]).pipe(
		Schema.decodeTo(
			Int64,
			SchemaTransformation.transformEffect({
				decode: (input: number | string) => {
					if (typeof input === 'number') {
						return Number.isSafeInteger(input)
							? Effect.succeed(input)
							: failWith(
									`JSON number ${input} is not a safe integer; send ints beyond ±(2^53 - 1) as text`,
								);
					}
					if (!INT_TEXT.test(input))
						return failWith(`${quote(input)} is not an integer`);
					const value = BigInt(input);
					return value < INT64_MIN || value > INT64_MAX
						? failWith(
								`integer ${input} is outside the SurrealDB int range`,
							)
						: Effect.succeed(value);
				},
				encode: (value: number | bigint) =>
					Effect.succeed(
						typeof value === 'bigint' &&
							value >= BigInt(Number.MIN_SAFE_INTEGER) &&
							value <= BigInt(Number.MAX_SAFE_INTEGER)
							? Number(value)
							: String(value),
					),
			}),
		),
	),
	{
		id: 'effect-surrealkit/Int64FromJson',
		expected: 'an integer (JSON number or text)',
		code: () => runtimeCode('Int64FromJson', 'SurrealSchema.Int64'),
	},
);
export type Int64JsonEncoded = typeof Int64FromJson.Encoded;

const byte = Schema.Number.check(
	Schema.isInt(),
	Schema.isBetween({ minimum: 0, maximum: 255 }),
);

/** `bytes` as SurrealDB JSON renders them: an array of byte numbers. */
export const BytesFromJson = wrap(
	Schema.Array(byte).pipe(
		Schema.decodeTo(
			Bytes,
			SchemaTransformation.transform<
				Uint8Array | ArrayBuffer,
				ReadonlyArray<number>
			>({
				decode: (bytes) => Uint8Array.from(bytes),
				encode: (bytes) => [
					...(bytes instanceof Uint8Array
						? bytes
						: new Uint8Array(bytes)),
				],
			}),
		),
	),
	{
		id: 'effect-surrealkit/BytesFromJson',
		expected: 'an array of bytes',
		code: () => runtimeCode('BytesFromJson', 'Uint8Array'),
	},
);
export type BytesJsonEncoded = typeof BytesFromJson.Encoded;

/** `set<T>` as SurrealDB JSON renders it: an array of distinct elements. */
export const SetFromJson = <S extends Schema.Top>(
	item: S,
	options: { readonly length?: number } = {},
) =>
	wrap(
		Schema.Array(item).pipe(
			Schema.decodeTo(
				SetOf(Schema.toType(item), options),
				SchemaTransformation.transformEffect<
					ReadonlySet<S['Type']>,
					ReadonlyArray<S['Type']>
				>({
					// Check before `new Set` silently drops primitive duplicates.
					decode: (values) => {
						const duplicate = values.findIndex((value, index) =>
							values
								.slice(0, index)
								.some((earlier) => equals(earlier, value)),
						);
						return duplicate === -1
							? Effect.succeed(new Set(values))
							: failWith(
									`set element ${duplicate} duplicates an earlier element; SurrealDB sets hold distinct values`,
								);
					},
					encode: (set) => Effect.succeed([...set]),
				}),
			),
		),
		{
			id: 'effect-surrealkit/SetFromJson',
			expected: 'an array of distinct elements',
			// The wrapped array only shows the encoded side, so print the item.
			code: () => {
				const itemCode = codeOf(item);
				const lengthCode =
					options.length === undefined
						? ''
						: `, { length: ${options.length} }`;
				return runtimeCode(
					`SetFromJson(${itemCode.runtime}${lengthCode})`,
					`ReadonlySet<${itemCode.Type}>`,
				);
			},
		},
	);
