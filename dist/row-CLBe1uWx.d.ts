import { Schema } from 'effect';

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

export { NoneAsAbsent as N, stripNone as s };
