import { C as Codec, f as CodecOf, h as Path, O as OrNone, E as Expr, P as Params, b as ParamsOfAll, c as Simplify, N as NoParams } from './expr-99eIx780.js';
import { Schema } from 'effect';
import { N as NoneAsAbsent } from './row-CLBe1uWx.js';
import { RecordId } from 'surrealdb';

/**
 * Rows as expressions, and the codecs rows come back through.
 *
 * A row object has one expression per field of a generated row schema, built
 * once from the schema's own fields. A nested object field carries its
 * children as properties (`row.address.city`); an optional field, and every
 * field below one, yields a value that may be NONE.
 */

/** A row schema's own fields: codecs, possibly optional keys. */
type Fields = {
    readonly [field: string]: Codec;
};
/** A closed row schema. */
type StructCodec = Codec & {
    readonly fields: Fields;
};
/** An open row schema (a schemaless table, a `FLEXIBLE` object). */
type OpenStructCodec = Codec & {
    readonly schema: StructCodec;
    readonly records: unknown;
};
/** A row schema as generated modules declare it. */
type RowCodecIn = StructCodec | OpenStructCodec;
/** The declared fields of a row schema. */
type FieldsOf<R> = R extends {
    readonly schema: {
        readonly fields: infer F;
    };
} ? F : R extends {
    readonly fields: infer F;
} ? F : never;
/** @internal */
type Unwrapped<S> = S extends {
    readonly schema: infer I extends Codec;
} ? S extends {
    readonly '~type.optionality': 'optional';
} ? I : S : S;
/** @internal */
type IsOptional<S> = S extends {
    readonly '~type.optionality': 'optional';
} ? true : false;
/** @internal */
type NestedFields<S> = S extends RowCodecIn ? FieldsOf<S> : never;
/**
 * The expression of one field, a field path, with its children when it is
 * an object.
 */
type FieldExpr<S, Optional extends boolean> = Path<Optional extends true ? OrNone<Unwrapped<S> & Codec> : Unwrapped<S> & Codec> & ([NestedFields<Unwrapped<S>>] extends [never] ? unknown : RowOf<NestedFields<Unwrapped<S>>, Optional>);
/** One expression per field of a row schema. */
type RowOf<F, Optional extends boolean = false> = {
    readonly [K in keyof F & string]: FieldExpr<F[K], Optional extends true ? true : IsOptional<F[K]>>;
};
/**
 * The row object of a generated row schema: one expression per field, the
 * path quoted where SurrealQL needs it. Its paths read whichever row is
 * current where they are placed; the builders' own row objects say which
 * row they were written for, and refuse a path of another.
 */
declare const rowOf: <R extends RowCodecIn>(schema: R) => RowOf<FieldsOf<R>>;
/** The codec stored rows decode with: NONE reads as an absent key. */
type RowCodec<S extends Codec> = ReturnType<typeof NoneAsAbsent<S>>;
/** The row a projection yields: one key per alias. */
type Projection = {
    readonly [alias: string]: Expr;
};
/**
 * A projection as its callback returned it, `F`, checked: a value that is
 * not an expression is typed as a message saying so.
 */
type CheckedProjection<F> = {
    readonly [K in keyof F]: F[K] extends Expr ? F[K] : 'a projected field is an expression: inline a constant with `literal`';
};
/** The struct a projection decodes with. */
type ProjectedFields<F> = {
    readonly [K in keyof F]: CodecOf<F[K]>;
};
/** The codec of a projected row. */
type ProjectedCodec<F> = Schema.declareConstructor<Schema.Struct<ProjectedFields<F>>['Type'], Schema.Struct<ProjectedFields<F>>['Encoded'], readonly [Schema.Struct<ProjectedFields<F>>]>;

/**
 * What the builders need from a generated table descriptor: its name and
 * row schemas, with codecs that need no services. Every table the emitter
 * generates fits.
 */

/** A generated table descriptor, as far as the builders read it. */
interface PureTable {
    readonly name: string;
    readonly schemafull?: boolean;
    readonly id: Codec;
    readonly select: RowCodecIn;
    /** The row as a session reads it when field permissions may hide fields. */
    readonly visible?: RowCodecIn;
    readonly create?: RowCodecIn;
    readonly merge?: RowCodecIn;
    readonly content?: RowCodecIn;
    readonly edge?: {
        readonly table: string;
        readonly in: ReadonlyArray<Codec>;
        readonly out: ReadonlyArray<Codec>;
    };
    /** Every `DEFINE INDEX` of the table, by name. */
    readonly indexes?: {
        readonly [name: string]: {
            readonly type: string;
            readonly columns: ReadonlyArray<ReadonlyArray<string>>;
        };
    };
}
/** The row object a table's callbacks receive. */
type RowExprs<T extends PureTable> = RowOf<FieldsOf<T['select']>>;
/** The codec a table's stored rows decode with. */
type StoredRow<T extends PureTable> = RowCodec<T['select']>;
/** A boolean expression. */
type Condition<P extends Params = Params> = Expr<Schema.Codec<unknown, boolean, never, never>, P>;
/** A record id expression of table `T`. */
type IdOf<T extends PureTable, P extends Params = Params> = Expr<Schema.Codec<unknown, T['id']['Encoded'], never, never>, P>;
type ExtraReadFields<T extends PureTable, S extends RowCodecIn> = Exclude<keyof FieldsOf<S>, keyof FieldsOf<T['select']>>;
type Encoded<F> = F extends Codec ? F['Encoded'] : never;
type IncompatibleReadLinks<Stored, View> = {
    [K in keyof Stored & keyof View]: [
        NonNullable<Encoded<Stored[K]>>
    ] extends [never] ? never : [NonNullable<Encoded<Stored[K]>>] extends [RecordId] ? [Exclude<Encoded<View[K]>, undefined>] extends [
        Exclude<Encoded<Stored[K]>, undefined>
    ] ? never : K : never;
}[keyof Stored & keyof View];
type KnownReadFields<T extends PureTable, S extends RowCodecIn> = T extends {
    readonly schemafull: true;
} ? [ExtraReadFields<T, S>] extends [never] ? [IncompatibleReadLinks<FieldsOf<T['select']>, FieldsOf<S>>] extends [
    never
] ? unknown : {
    readonly incompatibleRecordLinks: IncompatibleReadLinks<FieldsOf<T['select']>, FieldsOf<S>>;
} : {
    readonly unknownReadFields: ExtraReadFields<T, S>;
} : unknown;
/**
 * `T`, when it is a descriptor with a generated `visible` row; otherwise a
 * message saying what `readAs(table)` needs.
 */
type WithVisible<T> = T extends {
    readonly visible: RowCodecIn;
} ? T : 'this descriptor has no generated `visible` row: regenerate it, or pass the row the session reads as the second argument';
/** What `readAs` needs of a store registry: its tables, by name. */
interface ReadableStore {
    readonly tables: {
        readonly [name: string]: PureTable;
    };
    readonly edges: object;
}
/** A table as a restricted session reads it: its `visible` row, when it has one. */
type VisibleTable<T> = T extends {
    readonly visible: infer V extends RowCodecIn;
} ? Omit<T, 'select'> & {
    readonly select: V;
} : T;
/** A store as a restricted session reads it: every table through {@link VisibleTable}. */
type VisibleStore<S extends ReadableStore> = Omit<S, 'tables'> & {
    readonly tables: {
        readonly [K in keyof S['tables']]: VisibleTable<S['tables'][K]>;
    };
};
/** What `readAs` returns for a table with a `visible` row, or a whole store. */
type ReadAs<T> = T extends ReadableStore ? VisibleStore<T> : T extends PureTable ? Omit<T, 'select'> & {
    readonly select: NonNullable<T['visible']>;
} : never;
/**
 * `table` as a session with narrower permissions reads it, or a whole
 * `store`.
 *
 * A generated `select` schema describes a privileged reader. SurrealDB does
 * not report what permissions hide: a field the session may not read comes
 * back as NONE, and a row it may not read is simply absent.
 *
 * With one argument the statements read the generated `visible` row, in
 * which every field whose `select` permission is not FULL may be absent.
 * With two, they read the row given: declare the row such a session really
 * gets (usually the same fields, optional where a permission can hide them),
 * so the rows decode instead of failing on the missing fields.
 *
 * Given a store registry, it returns the store as such a session reads it:
 * every table that has a `visible` row reads through it, so a record reached
 * through a link, a step or FETCH of that store (`follow`, `rows`,
 * `destructure`, the steps, recursive paths and `fetch` take the store)
 * decodes with its `visible` row. A statement that reads its own table as
 * one reader and records through a store view of the other is refused when
 * it is built.
 *
 * @example
 * const visible = select(readAs(MemberTable)).build();
 * // ReadonlyArray<{ …; email?: string; salary?: number }>
 * const session = readAs(store);
 * select(readAs(DocTable)).project((row) => ({ owner: rows(session, row.owner) }));
 */
declare function readAs<T extends PureTable | ReadableStore>(table: T extends ReadableStore ? T : WithVisible<T>): ReadAs<T>;
declare function readAs<T extends PureTable, S extends RowCodecIn>(table: T, select: S & KnownReadFields<NoInfer<T>, NoInfer<S>>): Omit<T, 'select'> & {
    readonly select: S;
};

declare const LiveStatementTypeId = "~effect-surrealkit/LiveStatement";
interface LiveStatement<P extends Params = Params, Row extends Codec = Codec, Id extends Codec = Codec> {
    readonly [LiveStatementTypeId]: typeof LiveStatementTypeId;
    readonly name: string;
    /** Static LIVE SELECT text. */
    readonly sql: string;
    readonly params: P;
    readonly row: Row;
    readonly id: Id;
}
interface Live<T extends PureTable, P extends Params, Row extends Codec> {
    readonly where: <P2 extends Params>(predicate: (row: RowExprs<T>) => Condition<P2>) => Live<T, P & P2, Row>;
    readonly project: <const F>(fields: (row: RowExprs<T>) => CheckedProjection<F>) => Live<T, P & ParamsOfAll<F[keyof F]>, ProjectedCodec<F>>;
    readonly build: (name: string) => LiveStatement<Simplify<P>, Row, T['id']>;
}
/** Starts a live query over the table or its readAs view. */
declare const live: <T extends PureTable>(table: T) => Live<T, NoParams, StoredRow<T>>;

export { type Condition as C, type FieldsOf as F, type IdOf as I, type Live as L, type NestedFields as N, type OpenStructCodec as O, type ProjectedCodec as P, type RowCodecIn as R, type StoredRow as S, type Unwrapped as U, type VisibleStore as V, type WithVisible as W, type PureTable as a, type RowExprs as b, type CheckedProjection as c, type RowCodec as d, type RowOf as e, type IsOptional as f, type FieldExpr as g, type Fields as h, type LiveStatement as i, LiveStatementTypeId as j, type ProjectedFields as k, type Projection as l, type ReadAs as m, type ReadableStore as n, type StructCodec as o, type VisibleTable as p, live as q, readAs as r, rowOf as s };
