import { Schema, DateTime as DateTime$2 } from 'effect';
import { DateTime as DateTime$1, Duration as Duration$1 } from 'surrealdb';

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

export { DATETIME_MAX_SECONDS as D, DATETIME_MIN_SECONDS as a, DURATION_MAX_SECONDS as b, DateTime as c, DateTimeEffect as d, Duration as e, DurationLiteral as f, dateTimeFromString as g, dateTimeToString as h };
