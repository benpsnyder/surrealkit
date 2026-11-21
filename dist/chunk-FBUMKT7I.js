// src/internal/surql-lexer.ts
import { Data } from "effect";
var AnalyzeError = class extends Data.TaggedError("AnalyzeError") {
};
var STRING_PREFIXES = /* @__PURE__ */ new Set([
  "r",
  "d",
  "u",
  "s",
  "f",
  "b"
]);
var OPERATOR_CHARS = /* @__PURE__ */ new Set([
  ",",
  ".",
  ":",
  "|",
  "<",
  ">",
  "=",
  "!",
  "+",
  "-",
  "*",
  "?",
  "@",
  "~",
  "&",
  "^",
  "%",
  // The Unicode operators SurrealQL accepts.
  "\xD7",
  "\xF7",
  "\u2264",
  "\u2265",
  "\u220B",
  "\u220C",
  "\u2287",
  "\u2283",
  "\u2285",
  "\u2208",
  "\u2209",
  "\u2286",
  "\u2282",
  "\u2284"
]);
var OPEN = /* @__PURE__ */ new Map([
  ["(", ")"],
  ["[", "]"],
  ["{", "}"]
]);
var CLOSE = /* @__PURE__ */ new Set([")", "]", "}"]);
var EXPRESSION_WORDS = /* @__PURE__ */ new Set([
  "AND",
  "OR",
  "NOT",
  "IS",
  "IN",
  "INSIDE",
  "OUTSIDE",
  "INTERSECTS",
  "CONTAINS",
  "CONTAINSALL",
  "CONTAINSANY",
  "CONTAINSNONE",
  "CONTAINSNOT",
  "ALLINSIDE",
  "ANYINSIDE",
  "NONEINSIDE",
  "NOTINSIDE",
  "RETURN",
  "WHERE",
  "THEN",
  "ELSE",
  "IF",
  "VALUE",
  "SET",
  "WHEN",
  "THROW",
  "SELECT",
  "MATCHES",
  "LIKE",
  "ASSERT",
  "DEFAULT"
]);
var EXPRESSION_STATEMENTS = /* @__PURE__ */ new Set([
  "IF",
  "RETURN",
  "SELECT",
  "THROW"
]);
var WORD_LITERALS = /* @__PURE__ */ new Set([
  "NONE",
  "NULL",
  "TRUE",
  "FALSE",
  "NAN"
]);
var isWordChar = (c) => c !== void 0 && /[A-Za-z0-9_]/u.test(c);
var isNameStart = (c) => c !== void 0 && /[A-Za-z_]/u.test(c);
var lex = (sql, holeEndingAt, options) => {
  const lineStarts = [0];
  for (let i2 = 0; i2 < sql.length; i2++) {
    if (sql[i2] === "\n") lineStarts.push(i2 + 1);
  }
  const locate = (offset) => {
    let low = 0;
    let high = lineStarts.length - 1;
    while (low < high) {
      const mid = low + high + 1 >> 1;
      if ((lineStarts[mid] ?? 0) <= offset) low = mid;
      else high = mid - 1;
    }
    return { line: low + 1, column: offset - (lineStarts[low] ?? 0) + 1 };
  };
  const fail = (code, message, offset) => {
    throw new AnalyzeError({ code, message, offset, ...locate(offset) });
  };
  const tokens = [];
  const brackets = [];
  const push = (kind, start, end, value, prefix) => {
    tokens.push({
      kind,
      text: sql.slice(start, end),
      value,
      ...prefix !== void 0 && { prefix },
      start,
      end,
      ...locate(start)
    });
  };
  const quoted = (open2, close, what, from = open2) => {
    let value = "";
    let i2 = open2 + 1;
    while (i2 < sql.length) {
      const c = sql[i2];
      if (c === close) return { value, end: i2 + 1 };
      if (c === "\\") {
        const next = sql[i2 + 1];
        const simple = {
          "\\": "\\",
          "'": "'",
          '"': '"',
          "`": "`",
          [close]: close,
          "0": "\0",
          b: "\b",
          f: "\f",
          n: "\n",
          r: "\r",
          t: "	"
        };
        if (next !== void 0 && next in simple) {
          value += simple[next];
          i2 += 2;
          continue;
        }
        if (next === "u") {
          const braced = /^\{([0-9A-Fa-f]{1,6})\}/u.exec(
            sql.slice(i2 + 2, i2 + 12)
          );
          const plain = /^[0-9A-Fa-f]{4}/u.exec(
            sql.slice(i2 + 2, i2 + 6)
          );
          const hex = braced?.[1] ?? plain?.[0];
          const point = hex === void 0 ? void 0 : Number.parseInt(hex, 16);
          if (point !== void 0 && point <= 1114111) {
            value += String.fromCodePoint(point);
            i2 += 2 + (braced?.[0].length ?? 4);
            continue;
          }
        }
        fail(
          "invalidEscape",
          `invalid escape sequence \`\\${next ?? ""}\` in ${what}`,
          i2
        );
      }
      value += c;
      i2++;
    }
    return fail("unterminated", `unterminated ${what}`, from);
  };
  const startsStatement = (index) => {
    const before = tokens[index - 1];
    return before === void 0 || before.kind === "punct" && (before.value === ";" || before.value === "{");
  };
  const slashRole = () => {
    const index = tokens.length - 1;
    const last = tokens[index];
    if (last === void 0) return "regex";
    switch (last.kind) {
      case "param":
      case "string":
      case "ident":
      case "regex":
      case "hole":
        return "division";
      case "word": {
        const word = last.value.toUpperCase();
        const before = tokens[index - 1];
        if (before?.kind === "punct" && before.value === "." && tokens[index - 2]?.value !== ".") {
          return "division";
        }
        if (!options?.unambiguousSlashes) {
          return EXPRESSION_WORDS.has(word) ? "regex" : "division";
        }
        if (WORD_LITERALS.has(word) || /^[0-9]/u.test(word)) {
          return "division";
        }
        const introducesExpression = EXPRESSION_STATEMENTS.has(word) && startsStatement(index) || word === "VALUE" && before?.kind === "word" && before.value.toUpperCase() === "SELECT" && startsStatement(index - 1);
        return introducesExpression ? "regex" : "uncertain";
      }
      case "punct":
        return CLOSE.has(last.value) ? "division" : "regex";
    }
  };
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    const next = sql[i + 1];
    if (/\s/u.test(c)) {
      i++;
      continue;
    }
    if (c === "-" && next === "-" || c === "/" && next === "/" || c === "#") {
      const end = sql.indexOf("\n", i);
      const nextLine = end === -1 ? sql.length : end + 1;
      if (options?.unambiguousLineComments) {
        const text = sql.slice(i, nextLine);
        const separator = text.search(/[\r\u0085\u2028\u2029]/u);
        if (separator !== -1 && text.slice(separator + 1).trim() !== "") {
          fail(
            "ambiguousComment",
            "ambiguous line comment ending",
            i + separator
          );
        }
      }
      i = nextLine;
      continue;
    }
    if (c === "/" && next === "*") {
      const end = sql.indexOf("*/", i + 2);
      if (end === -1) fail("unterminated", "unterminated comment", i);
      i = end + 2;
      continue;
    }
    const holeAt = holeEndingAt?.(i) ?? -1;
    if (holeAt > i && !(isWordChar(sql[holeAt - 1]) && isWordChar(sql[holeAt])) && !(isWordChar(c) && isWordChar(sql[i - 1]))) {
      push("hole", i, holeAt, sql.slice(i, holeAt));
      i = holeAt;
      continue;
    }
    if (c === "'" || c === '"') {
      const { value, end } = quoted(i, c, "string");
      push("string", i, end, value);
      i = end;
      continue;
    }
    if (c === "`") {
      const { value, end } = quoted(i, "`", "identifier");
      push("ident", i, end, value);
      i = end;
      continue;
    }
    if (c === "\u27E8") {
      const { value, end } = quoted(i, "\u27E9", "identifier");
      push("ident", i, end, value);
      i = end;
      continue;
    }
    if (c === "$") {
      if (isNameStart(next)) {
        let end = i + 1;
        while (isWordChar(sql[end])) end++;
        push("param", i, end, sql.slice(i + 1, end));
        i = end;
        continue;
      }
      if (next === "`" || next === "\u27E8") {
        const { value, end } = quoted(
          i + 1,
          next === "`" ? "`" : "\u27E9",
          "parameter name",
          i
        );
        push("param", i, end, value);
        i = end;
        continue;
      }
      fail(
        "invalidParameter",
        "`$` is not followed by a parameter name",
        i
      );
    }
    if (isWordChar(c)) {
      let end = i;
      while (isWordChar(sql[end])) end++;
      const word = sql.slice(i, end);
      const quote = sql[end];
      if (STRING_PREFIXES.has(word) && (quote === "'" || quote === '"')) {
        const { value, end: close } = quoted(end, quote, "string", i);
        push("string", i, close, value, word);
        i = close;
        continue;
      }
      push("word", i, end, word);
      i = end;
      continue;
    }
    if (OPEN.has(c)) {
      brackets.push({ char: c, offset: i });
      push("punct", i, i + 1, c);
      i++;
      continue;
    }
    if (CLOSE.has(c)) {
      const open2 = brackets.pop();
      if (open2 === void 0) {
        fail("unbalanced", `\`${c}\` closes nothing`, i);
      } else if (OPEN.get(open2.char) !== c) {
        fail(
          "unbalanced",
          `\`${c}\` does not close the \`${open2.char}\` at ${(() => {
            const at = locate(open2.offset);
            return `${at.line}:${at.column}`;
          })()}`,
          i
        );
      }
      push("punct", i, i + 1, c);
      i++;
      continue;
    }
    if (c === ";") {
      push("punct", i, i + 1, c);
      i++;
      continue;
    }
    if (c === "/") {
      const role = slashRole();
      if (role !== "division") {
        let end = i + 1;
        while (end < sql.length && sql[end] !== "/") {
          if (role === "regex" && sql[end] === "\n") break;
          end += sql[end] === "\\" ? 2 : 1;
        }
        if (role === "regex") {
          if (sql[end] !== "/")
            fail("unterminated", "unterminated regex literal", i);
          push("regex", i, end + 1, sql.slice(i + 1, end));
          i = end + 1;
          continue;
        }
        if (sql[end] === "/") {
          fail(
            "ambiguousSlash",
            "cannot distinguish division from a regex after this word",
            i
          );
        }
      }
      push("punct", i, i + 1, c);
      i++;
      continue;
    }
    if (OPERATOR_CHARS.has(c)) {
      push("punct", i, i + 1, c);
      i++;
      continue;
    }
    fail(
      "unexpectedCharacter",
      `cannot classify ${JSON.stringify(String.fromCodePoint(sql.codePointAt(i) ?? 0))} outside a string, identifier or comment`,
      i
    );
  }
  const open = brackets.pop();
  if (open !== void 0) {
    fail("unbalanced", `\`${open.char}\` is never closed`, open.offset);
  }
  return { tokens, locate };
};

export {
  AnalyzeError,
  lex
};
//# sourceMappingURL=chunk-FBUMKT7I.js.map