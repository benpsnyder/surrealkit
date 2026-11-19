import * as effect_Cause from 'effect/Cause';
import * as effect_Types from 'effect/Types';
import { Effect } from 'effect';
import { H as HoleDelimiters } from './lexer-BEI0-7pQ.js';

/** What the text around one hole does with names; see `Analysis.holeScopes`. */
interface TextHoleScope<Bound extends string = string, Binds extends string = string> {
    readonly bound: ReadonlyArray<Bound>;
    readonly binds: ReadonlyArray<Binds>;
}
/** The scope of each hole of a template, by hole. */
type TextHoleScopes = {
    readonly [hole: string]: TextHoleScope;
};
/**
 * A fragment or template, as the `statements` command writes it. The names
 * it reads, defines and throws, and the scope of each hole, are kept as
 * literal types, so `compose` (in `effect-surrealkit/statement`) can work
 * out what a filled text reads.
 */
interface Text<Holes extends string = string, Free extends string = string, Defines extends string = string, Throws extends string = string, Scopes extends TextHoleScopes = TextHoleScopes> {
    readonly kind: 'part' | 'fragment';
    readonly name?: string;
    readonly source?: string;
    readonly sql: string;
    readonly holes: ReadonlyArray<Holes>;
    /** As written; provisional while the text has holes. */
    readonly free: ReadonlyArray<Free>;
    /** As written; provisional while the text has holes. */
    readonly defines: ReadonlyArray<Defines>;
    readonly provisional: boolean;
    readonly slots: number;
    readonly throws: ReadonlyArray<Throws>;
    readonly throwsAt?: Readonly<Record<string, ReadonlyArray<number>>>;
    /** Per hole: see `Analysis.holeScopes`. Written for every template. */
    readonly scopes?: Scopes;
}
/** Declares a {@link Text}, keeping its names as literal types. */
declare const text: <const Holes extends string = never, const Free extends string = never, const Defines extends string = never, const Throws extends string = never, const Scopes extends TextHoleScopes = Record<never, never>>(options: Text<Holes, Free, Defines, Throws, Scopes>) => Text<Holes, Free, Defines, Throws, Scopes>;
declare const FillError_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "FillError";
} & Readonly<A>;
/** Why holes could not be filled. */
declare class FillError extends FillError_base<{
    readonly code: string;
    readonly message: string;
    readonly hole?: string;
}> {
}
interface FillOptions {
    /** The literal delimiters of a hole; default `__` and `__`. */
    readonly holes?: HoleDelimiters;
    /** Accept fills that still have holes of their own. Default false. */
    readonly allowHoles?: boolean;
}
/** The fills a template takes: one per hole when its holes are known. */
type Fills<T> = T extends Text<infer Holes, string, string, string, TextHoleScopes> ? string extends Holes ? Readonly<Record<string, string | Text>> : {
    readonly [K in Holes]: string | Text;
} : Readonly<Record<string, string | Text>>;
/**
 * Substitutes every hole of `template` and returns the new text. Holes are
 * only recognised outside strings and comments. Each fill must lex on its
 * own with balanced brackets, so it cannot close or open anything around
 * its hole; leading and trailing whitespace and comments of a fill are
 * dropped, so a trailing line comment cannot swallow the rest of the line.
 *
 * Fails on a fill for a hole the template does not have, a hole without a
 * fill, or a fill that still has holes (unless `allowHoles`). The result is
 * a new text: analyse it to know what it reads, defines and returns.
 */
declare const fill: <const T extends string | Text>(template: T, fills: Fills<T>, options?: FillOptions) => Effect.Effect<string, FillError>;

export { FillError as F, type Text as T, type FillOptions as a, type Fills as b, type TextHoleScope as c, type TextHoleScopes as d, fill as f, text as t };
