import * as effect_Cause from 'effect/Cause';
import * as effect_Types from 'effect/Types';

declare const AnalyzeError_base: new <A extends Record<string, any> = {}>(args: effect_Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => effect_Cause.YieldableError & {
    readonly _tag: "AnalyzeError";
} & Readonly<A>;
/** Why a text could not be analysed, and where (1-based line and column). */
declare class AnalyzeError extends AnalyzeError_base<{
    readonly code: string;
    readonly message: string;
    readonly line: number;
    readonly column: number;
    readonly offset: number;
}> {
}
/**
 * What a template hole looks like: a name of capitals, digits and
 * underscores, starting with a capital, between two literal delimiters
 * (`__NAME__` by default). Delimiters are matched as text, never compiled.
 */
interface HoleDelimiters {
    readonly open: string;
    readonly close: string;
}
/** The default delimiters: `__NAME__`. */
declare const DEFAULT_HOLE_DELIMITERS: HoleDelimiters;

export { AnalyzeError as A, DEFAULT_HOLE_DELIMITERS as D, type HoleDelimiters as H };
