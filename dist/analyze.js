import {
  AnalyzeError,
  DEFAULT_HOLE_DELIMITERS,
  analyze,
  analyzeSync,
  holeDelimiters,
  lex
} from "./chunk-XG4BS7R5.js";
import "./chunk-PZ5AY32C.js";

// src/analyze/text.ts
import { Data, Effect } from "effect";
var text = (options) => options;
var FillError = class extends Data.TaggedError("FillError") {
};
var sqlOf = (value) => typeof value === "string" ? value : value.sql;
var fill = (template, fills, options = {}) => Effect.suspend(() => {
  try {
    return Effect.succeed(fillSync(sqlOf(template), fills, options));
  } catch (error) {
    if (error instanceof FillError) return Effect.fail(error);
    throw error;
  }
});
var lexed = (sql, holes, what, hole) => {
  try {
    return lex(sql, holes).tokens;
  } catch (error) {
    if (error instanceof AnalyzeError) {
      throw new FillError({
        code: error.code,
        message: `${what}: ${error.message} at ${error.line}:${error.column}`,
        ...hole !== void 0 && { hole }
      });
    }
    throw error;
  }
};
var fillSync = (template, fills, options) => {
  let holes;
  try {
    holes = holeDelimiters(options.holes);
  } catch (error) {
    if (error instanceof AnalyzeError) {
      throw new FillError({ code: error.code, message: error.message });
    }
    throw error;
  }
  const tokens = lexed(template, holes, "the template");
  const used = tokens.filter((token) => token.kind === "hole");
  const names = new Set(used.map((token) => token.value));
  for (const name of Object.keys(fills).sort()) {
    if (!names.has(name)) {
      throw new FillError({
        code: "unknownHole",
        message: `the template has no hole ${name}`,
        hole: name
      });
    }
  }
  const texts = /* @__PURE__ */ new Map();
  for (const name of [...names].sort()) {
    const value = fills[name];
    if (value === void 0) {
      throw new FillError({
        code: "missingFill",
        message: `no fill for the hole ${name}`,
        hole: name
      });
    }
    const sql = sqlOf(value);
    const own = lexed(
      sql,
      holes,
      `the fill for ${name}`,
      name
    );
    const first = own[0];
    const last = own[own.length - 1];
    if (first === void 0 || last === void 0) {
      throw new FillError({
        code: "emptyFill",
        message: `the fill for ${name} is empty`,
        hole: name
      });
    }
    const nested = own.find((token) => token.kind === "hole");
    if (nested !== void 0 && options.allowHoles !== true) {
      throw new FillError({
        code: "nestedHole",
        message: `the fill for ${name} still has the hole ${nested.value}`,
        hole: name
      });
    }
    texts.set(name, sql.slice(first.start, last.end));
  }
  let out = "";
  let at = 0;
  for (const token of used) {
    out += template.slice(at, token.start) + (texts.get(token.value) ?? "");
    at = token.end;
  }
  return out + template.slice(at);
};
export {
  AnalyzeError,
  DEFAULT_HOLE_DELIMITERS,
  FillError,
  analyze,
  analyzeSync,
  fill,
  text
};
//# sourceMappingURL=analyze.js.map