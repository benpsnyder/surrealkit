/**
 * What each free binding of an authored SurrealQL text is used as, in three
 * patterns a lexer can read with certainty: an argument of a custom
 * function, the key of a `type::record`, and a comparison with (or an
 * assignment to) a field of the one table a query targets. Anything else
 * records nothing: refuse rather than guess.
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

export type { BindingUses as B, BindingUse as a };
