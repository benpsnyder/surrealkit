/**
 * Round trips through a real, disposable SurrealDB engine with
 * surrealdb.js 2.1.1, including the integer edges the SDK's CBOR decoder
 * treats specially. See `engine.ts` for how the engine is provided.
 */
import { Schema } from 'effect';
import { DateTime, Decimal, RecordId } from 'surrealdb';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import * as S from '../src/index.js';
import {
	type Engine,
	engineConfigured,
	engineSkipReason,
	startEngine,
	within,
} from './engine.js';
import { expectRoundTrip } from './helpers.js';

if (!engineConfigured) {
	console.warn(
		`[effect-surrealkit] engine suite skipped: ${engineSkipReason}`,
	);
}

describe.skipIf(!engineConfigured)('disposable engine round trips', () => {
	let engine: Engine;
	const returnValue = async (value: unknown): Promise<unknown> => {
		const [result] = await within(
			engine.db.query<[unknown]>('RETURN $v', { v: value }),
		);
		return result;
	};

	beforeAll(async () => {
		engine = await startEngine();
		console.info(`[effect-surrealkit] engine ${engine.version}`);
	});
	afterAll(async () => {
		await engine?.stop();
	});

	const native: ReadonlyArray<
		readonly [string, Schema.Codec<unknown, unknown>]
	> = [
		['Int', S.Int],
		['Int64', S.Int64],
		['DateTime', S.DateTime],
		['DateTimeEffect', S.DateTimeEffect],
		['Duration', S.Duration],
		['Decimal', S.Decimal],
		['Uuid', S.Uuid],
		['Bytes', S.Bytes],
		['String', S.String],
		['RecordIdFor', S.RecordIdFor('person')],
		[
			'RecordIdFor (object key)',
			S.RecordIdFor('id_object', {
				key: Schema.Struct({ n: S.Int, region: S.String }),
			}),
		],
		[
			'RecordIdFor (array key)',
			S.RecordIdFor('id_array', {
				key: Schema.Tuple([S.Int64, S.String]),
			}),
		],
		['RecordIdFor (int64 key)', S.RecordIdFor('counter', { key: S.Int64 })],
		['RecordIdFor (uuid key)', S.RecordIdFor('ticket', { key: S.Uuid })],
		['TableFor', S.TableFor(['a', 'b'])],
		['GeometryPoint', S.GeometryPoint],
		['GeometryLine', S.GeometryLine],
		['GeometryPolygon', S.GeometryPolygon],
		['GeometryMultiPoint', S.GeometryMultiPoint],
		['GeometryMultiLine', S.GeometryMultiLine],
		['GeometryMultiPolygon', S.GeometryMultiPolygon],
		['GeometryCollection', S.GeometryCollection],
		['Range', S.Range],
		['SetOf(Int)', S.SetOf(S.Int)],
		['SetOf(String, length 3)', S.SetOf(S.String, { length: 3 })],
	];

	for (const [name, schema] of native) {
		it(`${name} survives RETURN $v`, async () => {
			await expectRoundTrip(schema, returnValue, { runs: 25 });
		});
	}

	describe('integer edges (SDK CBOR number/bigint split)', () => {
		const roundTrip = async (literal: string) => {
			const [value] = await within(
				engine.db.query<[unknown]>(`RETURN ${literal}`),
			);
			return value;
		};

		it('±(2^53 - 1) decode under both profiles', async () => {
			for (const literal of ['9007199254740991', '-9007199254740991']) {
				const value = await roundTrip(literal);
				expect(Schema.decodeUnknownSync(S.Int)(value)).toBe(
					Number(literal),
				);
				expect(Schema.decodeUnknownSync(S.Int64)(value)).toBe(
					BigInt(literal),
				);
			}
		});

		it('2^53 arrives as an exact number: Int fails loudly, Int64 accepts it', async () => {
			const value = await roundTrip('9007199254740992');
			expect(value).toBe(2 ** 53);
			expect(() => Schema.decodeUnknownSync(S.Int)(value)).toThrow(
				/safe JavaScript range/,
			);
			expect(Schema.decodeUnknownSync(S.Int64)(value)).toBe(2n ** 53n);
		});

		it('2^53 + 1 arrives as a bigint: Int fails loudly, Int64 is exact', async () => {
			const value = await roundTrip('9007199254740993');
			expect(value).toBe(9007199254740993n);
			expect(() => Schema.decodeUnknownSync(S.Int)(value)).toThrow(
				/safe JavaScript range/,
			);
			expect(Schema.decodeUnknownSync(S.Int64)(value)).toBe(
				9007199254740993n,
			);
		});

		it('-(2^53 + 1) arrives rounded to -2^53: both profiles fail loudly', async () => {
			const value = await roundTrip('-9007199254740993');
			// The SDK decoder's rounding, recorded so a fix upstream is noticed.
			expect(value).toBe(-(2 ** 53));
			expect(() => Schema.decodeUnknownSync(S.Int)(value)).toThrow(
				/safe JavaScript range/,
			);
			expect(() => Schema.decodeUnknownSync(S.Int64)(value)).toThrow(
				/exact value is unknown/,
			);
		});

		it('int64 extremes are exact under Int64 and loud under Int', async () => {
			for (const literal of [
				'9223372036854775807',
				'-9223372036854775808',
			]) {
				const value = await roundTrip(literal);
				expect(Schema.decodeUnknownSync(S.Int64)(value)).toBe(
					BigInt(literal),
				);
				expect(() => Schema.decodeUnknownSync(S.Int)(value)).toThrow(
					/safe JavaScript range/,
				);
			}
		});

		it('Int64 encodes int64 extremes the engine stores as int', async () => {
			for (const value of [
				S.INT64_MAX,
				S.INT64_MIN,
				S.int64(-(2n ** 53n) - 2n),
			]) {
				const [type, back] = await within(
					engine.db.query<[string, unknown]>(
						'RETURN type::of($v); RETURN $v',
						{
							v: Schema.encodeSync(S.Int64)(S.int64(value)),
						},
					),
				);
				expect(type).toBe('int');
				expect(Schema.decodeUnknownSync(S.Int64)(back)).toBe(value);
			}
		});

		it('a bigint beyond int64 is refused before it can wrap around on the server', () => {
			expect(() => Schema.encodeUnknownSync(S.Int64)(2n ** 63n)).toThrow(
				/int range/,
			);
		});
	});

	describe('stored rows: NONE, NULL and absent', () => {
		beforeAll(async () => {
			await within(
				engine.db.query(`
					DEFINE TABLE presence SCHEMAFULL;
					DEFINE FIELD nickname ON presence TYPE option<string>;
					DEFINE FIELD bio ON presence TYPE string | null;
					DEFINE FIELD born ON presence TYPE datetime;
					DEFINE FIELD balance ON presence TYPE decimal;
					DEFINE FIELD tags ON presence TYPE set<string>;
					DEFINE FIELD meta ON presence TYPE object FLEXIBLE;
					DEFINE FIELD meta.kind ON presence TYPE string;
				`),
			);
		});

		const Row = Schema.Struct({
			id: S.RecordIdFor('presence'),
			nickname: Schema.optionalKey(S.String),
			bio: Schema.NullOr(S.String),
			born: S.DateTime,
			balance: S.Decimal,
			tags: S.SetOf(S.String),
			meta: Schema.StructWithRest(Schema.Struct({ kind: S.String }), [
				Schema.Record(Schema.String, Schema.Unknown),
			]),
		});

		it('create → select keeps nanoseconds, decimals, sets, NULL and FLEXIBLE keys', async () => {
			const id = new RecordId('presence', 'a');
			const content = {
				bio: null,
				born: new DateTime('1969-07-20T20:17:40.123456789Z'),
				balance: new Decimal('79228162514264337593543950335'),
				tags: new Set(['x', 'y']),
				meta: { kind: 'k', extra: 1 },
			};
			await within(
				engine.db.query('CREATE $id CONTENT $content', { id, content }),
			);
			const [rows] = await within(
				engine.db.query<[unknown[]]>('SELECT * FROM $id', { id }),
			);
			const row = Schema.decodeUnknownSync(S.NoneAsAbsent(Row))(rows[0]);
			expect('nickname' in row).toBe(false);
			expect(row.bio).toBeNull();
			expect(row.born.toCompact()).toEqual(content.born.toCompact());
			expect(row.balance.toString()).toBe(
				'79228162514264337593543950335',
			);
			expect([...row.tags].sort()).toEqual(['x', 'y']);
			expect(row.meta).toEqual({ kind: 'k', extra: 1 });
		});

		it('an option field set to NONE reads back absent', async () => {
			const id = new RecordId('presence', 'b');
			await within(
				engine.db.query(
					"CREATE $id CONTENT { nickname: 'n', bio: 'b', born: time::now(), balance: 1dec, tags: <set<string>> [], meta: { kind: 'k' } }",
					{ id },
				),
			);
			await within(
				engine.db.query('UPDATE $id MERGE { nickname: NONE }', { id }),
			);
			const [rows] = await within(
				engine.db.query<[unknown[]]>('SELECT * FROM $id', { id }),
			);
			const row = Schema.decodeUnknownSync(S.NoneAsAbsent(Row))(rows[0]);
			expect('nickname' in row).toBe(false);
		});

		it('a projection that yields NONE needs NoneAsAbsent', async () => {
			const [value] = await within(
				engine.db.query<[unknown]>(
					"RETURN { nickname: NONE, bio: 'b' }",
				),
			);
			const Projection = Schema.Struct({
				nickname: Schema.optionalKey(S.String),
				bio: S.String,
			});
			expect(() => Schema.decodeUnknownSync(Projection)(value)).toThrow();
			expect(
				Schema.decodeUnknownSync(S.NoneAsAbsent(Projection))(value),
			).toEqual({ bio: 'b' });
		});
	});
});
