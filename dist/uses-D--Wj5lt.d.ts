/**
 * What each free binding of an authored SurrealQL text is used as, in three
 * patterns a lexer can read with certainty: an argument of a custom
 * function, the key of a `type::record`, and a comparison with (or an
 * assignment to) a field of the one table a query targets. Alongside, the
 * field names a query compares whatever the other operand, where that
 * comparison is not a binding use. Anything else records nothing: refuse
 * rather than guess.
 */

/** One use of a binding, at the 1-based line of the parameter. */
type BindingUse = {
    readonly kind: 'argument';
    readonly function: string;
    readonly index: number;
    readonly line: number;
} | {
    readonly kind: 'key';
    readonly table: string;
    readonly line: number;
} | {
    readonly kind: 'field';
    readonly table: string;
    readonly field: string;
    /**
     * A `WHERE` comparison or a `SET` assignment; the analyzer always
     * says which, and a declared use may leave it out.
     */
    readonly role?: 'compare' | 'assign';
    readonly line: number;
};
/** The uses of each binding, keyed by name without `$`. */
type BindingUses = Readonly<Record<string, ReadonlyArray<BindingUse>>>;
/**
 * A field name a query compares in its `WHERE` (`compare`) or assigns in
 * its `SET` (`assign`), at the 1-based line of the name: a bare field of
 * the one static table the query targets (never in a `SELECT` with a
 * subquery in its `FROM`), on either side of a comparison whatever the
 * other operand, or the target of `field = <literal>` where the literal is
 * never NONE.
 */
interface FieldReference {
    readonly table: string;
    readonly field: string;
    readonly role: 'compare' | 'assign';
    readonly line: number;
}

export type { BindingUses as B, FieldReference as F, BindingUse as a };
