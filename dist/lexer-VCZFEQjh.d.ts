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

export { DEFAULT_HOLE_DELIMITERS as D, type HoleDelimiters as H };
