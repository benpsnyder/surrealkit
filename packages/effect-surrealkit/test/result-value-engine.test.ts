/**
 * NONE as a real engine hands it back, read through the SDK and decoded with
 * the query result codecs (see `engine.ts` for how the engine is provided).
 *
 * The engine keeps a NONE array element but removes an object key that is
 * set to NONE when it stores a record, so a NONE property reaches a client
 * through a projection: a selected field the record does not hold, or a
 * destructured key of a nested object. SurrealDB 3.3 and 4.0 answer alike.
 */
import { Schema } from 'effect';
import { RecordId } from 'surrealdb';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import * as S from '../src/index.js';
import {
	type Engine,
	engineConfigured,
	engineSkipReason,
	startEngine,
	within,
} from './engine.js';

if (!engineConfigured) {
	console.warn(
		`[effect-surrealkit] query result value engine suite skipped: ${engineSkipReason}`,
	);
}

describe.skipIf(!engineConfigured)('query result values on the engine', () => {
	let engine: Engine;
	const id = new RecordId('rv_row', 'r');

	beforeAll(async () => {
		engine = await startEngine();
		await within(
			engine.db.query(
				`CREATE $id CONTENT {
					top: NONE,
					keep: 1,
					nested: { x: 1, gone: NONE, deep: { y: NONE, z: [NONE] } },
					list: [NONE, 1, NULL, { w: NONE }]
				}`,
				{ id },
			),
		);
	});
	afterAll(async () => {
		await engine?.stop();
	});

	/** Decodes and encodes, and requires both to give the row back. */
	const unchanged = <T>(schema: Schema.Codec<T>, value: unknown) => {
		expect(Schema.decodeUnknownSync(schema)(value)).toStrictEqual(value);
		expect(Schema.encodeUnknownSync(schema)(value)).toStrictEqual(value);
	};

	it('decodes a row holding NONE at the top level, in an object and in arrays unchanged', async () => {
		const [row] = await within(
			engine.db.query<[unknown]>(
				'SELECT top, keep, nested.{ x, gone, deep } AS nested, list FROM ONLY $id',
				{ id },
			),
		);
		// toStrictEqual tells an `undefined` property from an absent key.
		expect(row).toStrictEqual({
			top: undefined,
			keep: 1,
			nested: { x: 1, gone: undefined, deep: { z: [undefined] } },
			list: [undefined, 1, null, {}],
		});
		unchanged(S.SurrealResultObject, row);
		unchanged(S.SurrealResultValue, row);
		// The stored-value codec refuses the same row.
		expect(() => Schema.decodeUnknownSync(S.SurrealValue)(row)).toThrow();
	});

	it('decodes a stored row and every result of a query unchanged', async () => {
		const results = await within(
			engine.db.query<unknown[]>(
				`SELECT * FROM ONLY $id;
				SELECT VALUE list FROM rv_row;
				RETURN [NONE, 5, NULL];`,
				{ id },
			),
		);
		expect(results).toStrictEqual([
			{
				id,
				keep: 1,
				nested: { x: 1, deep: { z: [undefined] } },
				list: [undefined, 1, null, {}],
			},
			[[undefined, 1, null, {}]],
			[undefined, 5, null],
		]);
		unchanged(S.SurrealResultObject, results[0]);
		unchanged(S.SurrealResultArray, results[1]);
		unchanged(S.SurrealResultArray, results[2]);
		unchanged(S.SurrealResultArray, results);
	});
});
