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

export { type EdgeDescriptor as E, type FunctionDescriptor as F, NoneAsAbsent as N, type Operation as O, type Permission as P, type Refinements as R, type TableDescriptor as T, type ViewDescriptor as V, type EdgeIn as a, type EdgeOut as b, type FieldPresence as c, type FunctionArgs as d, type FunctionResult as e, type Narrowing as f, type Presence as g, type Replaced as h, type RowSchema as i, type TablePermissions as j, edge as k, fn as l, replaceField as m, refine as r, stripNone as s, table as t, view as v, withPresence as w };
