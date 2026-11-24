// src/mapper/layout.ts
import { readdirSync } from "fs";
import { isAbsolute, join, relative, resolve as resolve2, sep } from "path";

// src/analyze/render.ts
import { Data as Data2, Effect as Effect2 } from "effect";

// src/analyze/analyze.ts
import { Effect } from "effect";

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
  const quoted2 = (open2, close, what, from = open2) => {
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
      const { value, end } = quoted2(i, c, "string");
      push("string", i, end, value);
      i = end;
      continue;
    }
    if (c === "`") {
      const { value, end } = quoted2(i, "`", "identifier");
      push("ident", i, end, value);
      i = end;
      continue;
    }
    if (c === "\u27E8") {
      const { value, end } = quoted2(i, "\u27E9", "identifier");
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
        const { value, end } = quoted2(
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
        const { value, end: close } = quoted2(end, quote, "string", i);
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

// src/analyze/lexer.ts
var DEFAULT_HOLE_DELIMITERS = {
  open: "__",
  close: "__"
};
var isCapital = (c) => c !== void 0 && c >= "A" && c <= "Z";
var isHoleNameChar = (c) => isCapital(c) || c !== void 0 && c >= "0" && c <= "9" || c === "_";
var isBlank = (c) => c.trim().length === 0;
var holeDelimiters = (holes) => {
  if (holes === void 0) return DEFAULT_HOLE_DELIMITERS;
  for (const [which, text] of [
    ["open", holes.open],
    ["close", holes.close]
  ]) {
    if (typeof text !== "string" || text.length === 0 || [...text].some(isBlank)) {
      throw new AnalyzeError({
        code: "invalidHoleDelimiters",
        message: `the ${which} delimiter of a hole must be non-empty text without whitespace`,
        line: 1,
        column: 1,
        offset: 0
      });
    }
  }
  return { open: holes.open, close: holes.close };
};
var holeEnd = (sql, at, holes) => {
  if (!sql.startsWith(holes.open, at)) return -1;
  const name = at + holes.open.length;
  if (!isCapital(sql[name])) return -1;
  let run = name + 1;
  while (run < sql.length && isHoleNameChar(sql[run])) run++;
  for (let end = run; end > name; end--) {
    if (sql.startsWith(holes.close, end)) return end + holes.close.length;
  }
  return -1;
};
var lex2 = (sql, holes) => lex(sql, (start) => holeEnd(sql, start, holes));

// src/analyze/locals.ts
var upper = (token) => token?.kind === "word" ? token.value.toUpperCase() : "";
var isPunct = (token, char) => token?.kind === "punct" && token.value === char;
var isOpen = (token) => isPunct(token, "(") || isPunct(token, "[") || isPunct(token, "{");
var isClose = (token) => isPunct(token, ")") || isPunct(token, "]") || isPunct(token, "}");
var adjacent = (a, b) => a !== void 0 && b !== void 0 && a.end === b.start;
var isPlainString = (token) => token?.kind === "string" && (token.prefix === void 0 || token.prefix === "s");
var ENGINE_NAMES = /* @__PURE__ */ new Set([
  "auth",
  "access",
  "session",
  "token",
  "this",
  "self",
  "parent",
  "value",
  "input",
  "before",
  "after",
  "event"
]);
var recordLocals = (tokens) => {
  const out = /* @__PURE__ */ new Map();
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.kind === "hole") return out;
    if (isPunct(token, "|") && tokens[i + 1]?.kind === "param") return out;
    if (upper(token) === "DEFINE" && !isPunct(tokens[i - 1], ".") && !isPunct(tokens[i - 1], ":") && !isPunct(tokens[i + 1], ":"))
      return out;
  }
  const lets = /* @__PURE__ */ new Map();
  const loops = /* @__PURE__ */ new Set();
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.kind !== "param") continue;
    const before = upper(tokens[i - 1]);
    if (before === "LET")
      lets.set(token.value, [...lets.get(token.value) ?? [], i]);
    else if (before === "FOR") loops.add(token.value);
  }
  const depth = [];
  let level = 0;
  for (const token of tokens) {
    if (isClose(token)) level--;
    depth.push(level);
    if (isOpen(token)) level++;
  }
  const closing = (at) => {
    let d = 0;
    for (let j = at; j < tokens.length; j++) {
      if (isOpen(tokens[j])) d++;
      else if (isClose(tokens[j]) && --d === 0) return j;
    }
    return tokens.length;
  };
  for (const [name, sites] of lets) {
    if (sites.length !== 1 || loops.has(name) || ENGINE_NAMES.has(name))
      continue;
    const at = sites[0];
    const let_ = at - 1;
    if (depth[let_] !== 0 || let_ > 0 && !isPunct(tokens[let_ - 1], ";"))
      continue;
    const fn = tokens[at + 5];
    if (!isPunct(tokens[at + 1], "=") || isPunct(tokens[at + 2], "=") || tokens[at + 2]?.kind !== "word" || tokens[at + 2]?.value.toLowerCase() !== "type" || !isPunct(tokens[at + 3], ":") || !isPunct(tokens[at + 4], ":") || !adjacent(tokens[at + 3], tokens[at + 4]) || fn?.kind !== "word" || !["record", "thing"].includes(fn.value.toLowerCase()) || !isPunct(tokens[at + 6], "(") || !isPlainString(tokens[at + 7]) || !isPunct(tokens[at + 8], ","))
      continue;
    const end = closing(at + 6) + 1;
    if (!isPunct(tokens[end], ";")) continue;
    const table = tokens[at + 7].value;
    for (let j = end + 1; j < tokens.length; j++) {
      const read = tokens[j];
      if (read.kind === "param" && read.value === name)
        out.set(read, table);
    }
  }
  return out;
};

// src/analyze/lock.ts
var upper2 = (token) => token?.kind === "word" ? token.value.toUpperCase() : "";
var isPunct2 = (token, char) => token?.kind === "punct" && token.value === char;
var isOpen2 = (token) => isPunct2(token, "(") || isPunct2(token, "[") || isPunct2(token, "{");
var isClose2 = (token) => isPunct2(token, ")") || isPunct2(token, "]") || isPunct2(token, "}");
var EXCLUDED = /* @__PURE__ */ new Set([
  "GROUP",
  "SPLIT",
  "VERSION",
  "TEMPFILES",
  "EXPLAIN"
]);
var AFTER = /* @__PURE__ */ new Set(["TEMPFILES", "EXPLAIN", "FULL"]);
var lockOf = (tokens, from, end) => {
  const level = [];
  for (let j = from; j < end; j++) {
    if (isOpen2(tokens[j])) {
      let depth = 0;
      for (; j < end; j++) {
        if (isOpen2(tokens[j])) depth++;
        else if (isClose2(tokens[j]) && --depth === 0) break;
      }
      continue;
    }
    if (!isPunct2(tokens[j - 1], ".") && !isPunct2(tokens[j - 1], ":"))
      level.push(j);
  }
  const at = level.findIndex(
    (j, k) => upper2(tokens[j]) === "FOR" && level[k + 1] === j + 1 && upper2(tokens[j + 1]) === "UPDATE"
  );
  if (at === -1) return { kind: "none" };
  const index = level[at];
  for (const j of level.slice(at + 2))
    if (!AFTER.has(upper2(tokens[j]))) return { kind: "refused" };
  for (const j of level.slice(0, at))
    if (EXCLUDED.has(upper2(tokens[j]))) return { kind: "refused" };
  return { kind: "locked", at: index };
};

// src/analyze/statements.ts
var upper3 = (token) => token?.kind === "word" ? token.value.toUpperCase() : "";
var isPunct3 = (token, char) => token?.kind === "punct" && token.value === char;
var isOpen3 = (token) => isPunct3(token, "(") || isPunct3(token, "[") || isPunct3(token, "{");
var isClose3 = (token) => isPunct3(token, ")") || isPunct3(token, "]") || isPunct3(token, "}");
var closingOf = (tokens, at) => {
  let depth = 0;
  for (let j = at; j < tokens.length; j++) {
    if (isOpen3(tokens[j])) depth++;
    else if (isClose3(tokens[j])) {
      depth--;
      if (depth === 0) return j;
    }
  }
  return tokens.length;
};
var statementsIn = (tokens, start, stop) => {
  const out = [];
  let from = start;
  for (let i = start; i <= stop; i++) {
    const token = tokens[i];
    if (i < stop && isOpen3(token)) {
      i = closingOf(tokens, i);
      continue;
    }
    if (i < stop && !isPunct3(token, ";")) continue;
    let first = from;
    if (upper3(tokens[first]) === "LET" && tokens[first + 1]?.kind === "param" && isPunct3(tokens[first + 2], "=") && !isPunct3(tokens[first + 3], "="))
      first += 3;
    else if (upper3(tokens[first]) === "RETURN") first += 1;
    if (from < i) out.push({ start: from, first, end: i });
    from = i + 1;
  }
  return out;
};
var queryAt = (tokens, statement, words) => statement.first < statement.end && words.has(upper3(tokens[statement.first]));

// src/analyze/projections.ts
var upper4 = (token) => token?.kind === "word" ? token.value.toUpperCase() : "";
var isPunct4 = (token, char) => token?.kind === "punct" && token.value === char;
var isOpen4 = (token) => isPunct4(token, "(") || isPunct4(token, "[") || isPunct4(token, "{");
var isClose4 = (token) => isPunct4(token, ")") || isPunct4(token, "]") || isPunct4(token, "}");
var isPlainString2 = (token) => token?.kind === "string" && (token.prefix === void 0 || token.prefix === "s");
var AFTER_TARGET = /* @__PURE__ */ new Set([
  "WHERE",
  "SPLIT",
  "GROUP",
  "ORDER",
  "LIMIT",
  "START",
  "FETCH",
  "TIMEOUT",
  "EXPLAIN",
  "WITH",
  "VERSION",
  "TEMPFILES"
]);
var VALUES = /* @__PURE__ */ new Set(["NONE", "NULL", "TRUE", "FALSE"]);
var EXACT_VALUES = /* @__PURE__ */ new Set(["NaN", "Infinity"]);
var analyzeProjections = (tokens, locals = /* @__PURE__ */ new Map()) => {
  const found = /* @__PURE__ */ new Map();
  const closing = (at) => {
    let depth = 0;
    for (let j = at; j < tokens.length; j++) {
      if (isOpen4(tokens[j])) depth++;
      else if (isClose4(tokens[j])) {
        depth--;
        if (depth === 0) return j;
      }
    }
    return tokens.length;
  };
  const bareName = (at) => {
    const token = tokens[at];
    if (token?.kind === "ident") return token.value;
    if (token?.kind !== "word") return void 0;
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/u.test(token.value)) return void 0;
    return VALUES.has(token.value.toUpperCase()) || EXACT_VALUES.has(token.value) ? void 0 : token.value;
  };
  const targetTable = (at, end, lock) => {
    let j = at;
    if (upper4(tokens[j]) === "ONLY") j++;
    const token = tokens[j];
    let table;
    let record2 = false;
    const local = token === void 0 ? void 0 : locals.get(token);
    if (local !== void 0) {
      table = local;
      record2 = true;
      j++;
    } else if (token?.kind === "word" && token.value.toLowerCase() === "type" && isPunct4(tokens[j + 1], ":")) {
      const fn = tokens[j + 3];
      const name = fn?.kind === "word" ? fn.value.toLowerCase() : "";
      if (!isPunct4(tokens[j + 2], ":") || !["record", "thing", "table"].includes(name) || !isPunct4(tokens[j + 4], "(") || !isPlainString2(tokens[j + 5]) || !isPunct4(tokens[j + 6], name === "table" ? ")" : ","))
        return void 0;
      table = tokens[j + 5].value;
      record2 = name !== "table";
      j = closing(j + 4) + 1;
    } else {
      table = bareName(j);
      if (table === void 0 || AFTER_TARGET.has(upper4(token)))
        return void 0;
      j++;
      if (isPunct4(tokens[j], ":")) {
        const key = tokens[j + 1];
        if (key === void 0 || key.kind === "punct" && !isOpen4(key))
          return void 0;
        j = isOpen4(key) ? closing(j + 1) + 1 : j + 2;
        record2 = true;
      }
    }
    if (lock !== void 0 && !record2) return void 0;
    const next = tokens[j];
    return j >= end || j === lock || isPunct4(next, ";") || AFTER_TARGET.has(upper4(next)) ? table : void 0;
  };
  const record = (table, field, line) => {
    found.set(JSON.stringify([line, table, field]), { table, field, line });
  };
  const nested = (start, stop) => {
    for (let i = start; i < stop; i++) {
      if (!isOpen4(tokens[i])) continue;
      const close = closing(i);
      if (isPunct4(tokens[i], "(") && upper4(tokens[i + 1]) === "SELECT")
        select(i + 1, close);
      else if (isPunct4(tokens[i], "{")) statements(i + 1, close);
      else nested(i + 1, close);
      i = close;
    }
  };
  const SELECT = /* @__PURE__ */ new Set(["SELECT"]);
  const statements = (start, stop) => {
    for (const statement of statementsIn(tokens, start, stop)) {
      if (queryAt(tokens, statement, SELECT))
        select(statement.first, statement.end);
      else nested(statement.start, statement.end);
    }
  };
  const select = (from, end) => {
    nested(from + 1, end);
    const froms = [];
    for (let j = from + 1; j < end; j++) {
      if (isOpen4(tokens[j])) {
        j = closing(j);
        continue;
      }
      if (upper4(tokens[j]) === "FROM" && !isPunct4(tokens[j - 1], ".") && !isPunct4(tokens[j - 1], ":"))
        froms.push(j);
    }
    if (froms.length !== 1) return;
    const at = froms[0];
    const lock = lockOf(tokens, from, end);
    if (lock.kind === "refused") return;
    for (let j = at + 1; j < end; j++) {
      if (isOpen4(tokens[j])) j = closing(j);
      else if (upper4(tokens[j]) === "PARALLEL" && !isPunct4(tokens[j - 1], ".") && !isPunct4(tokens[j - 1], ":"))
        return;
    }
    const table = targetTable(
      at + 1,
      end,
      lock.kind === "locked" ? lock.at : void 0
    );
    if (table === void 0) return;
    const fields = [];
    if (upper4(tokens[from + 1]) === "VALUE") {
      const name = at === from + 3 ? bareName(from + 2) : void 0;
      if (name !== void 0)
        record(table, name, tokens[from + 2].line);
      return;
    }
    let start = from + 1;
    for (let k = from + 1; k <= at; k++) {
      if (k < at && isOpen4(tokens[k])) {
        k = closing(k);
        continue;
      }
      if (k < at && upper4(tokens[k]) === "OMIT") return;
      if (k !== at && !isPunct4(tokens[k], ",")) continue;
      const item = tokens[start];
      const name = k - start === 1 ? isPunct4(item, "*") ? "*" : bareName(start) : k - start === 3 && upper4(tokens[start + 1]) === "AS" && bareName(start + 2) !== void 0 ? bareName(start) : void 0;
      if (name !== void 0)
        fields.push({ field: name, line: item.line });
      start = k + 1;
    }
    for (const { field, line } of fields) record(table, field, line);
  };
  statements(0, tokens.length);
  return [...found.values()].sort(
    (a, b) => a.line !== b.line ? a.line - b.line : a.table !== b.table ? a.table < b.table ? -1 : 1 : a.field < b.field ? -1 : a.field > b.field ? 1 : 0
  );
};

// src/analyze/targets.ts
var IGNORED = /* @__PURE__ */ new Set([
  "DEFINE",
  "REMOVE",
  "ALTER",
  "INFO",
  "USE",
  "SHOW",
  "REBUILD"
]);
var WRITES = /* @__PURE__ */ new Set([
  "CREATE",
  "UPDATE",
  "UPSERT",
  "DELETE",
  "INSERT",
  "RELATE"
]);
var SUBQUERY = /* @__PURE__ */ new Set([
  "SELECT",
  "CREATE",
  "UPDATE",
  "UPSERT",
  "DELETE",
  "INSERT",
  "RELATE"
]);
var CLAUSES = /* @__PURE__ */ new Set([
  "SET",
  "UNSET",
  "CONTENT",
  "MERGE",
  "PATCH",
  "REPLACE",
  "WHERE",
  "RETURN",
  "TIMEOUT",
  "PARALLEL",
  "VERSION",
  "WITH",
  "SPLIT",
  "GROUP",
  "ORDER",
  "LIMIT",
  "START",
  "FETCH",
  "EXPLAIN",
  "TEMPFILES",
  // The end of a statement inside `IF … THEN … ELSE … END`.
  "ELSE",
  "END"
]);
var VALUE_WORDS = /* @__PURE__ */ new Set(["RETURN", "THEN", "ELSE"]);
var upper5 = (token) => token?.kind === "word" ? token.value.toUpperCase() : "";
var isPunct5 = (token, char) => token?.kind === "punct" && token.value === char;
var isOpen5 = (token) => isPunct5(token, "(") || isPunct5(token, "[") || isPunct5(token, "{");
var isClose5 = (token) => isPunct5(token, ")") || isPunct5(token, "]") || isPunct5(token, "}");
var isName = (token) => token?.kind === "word" && /^[A-Za-z_]/u.test(token.value) || token?.kind === "ident";
var isPlainString3 = (token) => token?.kind === "string" && (token.prefix === void 0 || token.prefix === "s");
var adjacent2 = (a, b) => a !== void 0 && b !== void 0 && a.end === b.start;
var analyzeTargets = (tokens, locals) => {
  const readAt = /* @__PURE__ */ new Map();
  const writtenAt = /* @__PURE__ */ new Map();
  const functionsAt = /* @__PURE__ */ new Map();
  const definedTables = /* @__PURE__ */ new Set();
  const definedFunctions = /* @__PURE__ */ new Set();
  let open = false;
  const consumed = /* @__PURE__ */ new Set();
  const add = (into, name, token) => {
    if (!into.has(name)) into.set(name, token.line);
  };
  const pastGroup = (at) => {
    let depth = 0;
    for (let j = at; j < tokens.length; j++) {
      if (isOpen5(tokens[j])) depth++;
      else if (isClose5(tokens[j])) {
        depth--;
        if (depth === 0) return j + 1;
      }
    }
    return tokens.length;
  };
  const pathAt = (at) => isPunct5(tokens[at], ":") && isPunct5(tokens[at + 1], ":") && adjacent2(tokens[at], tokens[at + 1]);
  const member = (at) => isPunct5(tokens[at - 1], ".") || isPunct5(tokens[at - 1], ":");
  const statementPosition = (at) => {
    const previous = tokens[at - 1];
    if (previous === void 0) return true;
    if (isPunct5(previous, ";") || isPunct5(previous, "{") || isPunct5(previous, "("))
      return true;
    if (VALUE_WORDS.has(upper5(previous))) return true;
    return isPunct5(previous, "=") && tokens[at - 2]?.kind === "param" && upper5(tokens[at - 3]) === "LET";
  };
  const statementEnd = (at) => {
    for (let j = at; j < tokens.length; j++) {
      const token = tokens[j];
      if (isPunct5(token, ";") || isClose5(token)) return j;
      if (isOpen5(token)) j = pastGroup(j) - 1;
    }
    return tokens.length;
  };
  const typeCall = (at, fn) => tokens[at]?.kind === "word" && tokens[at]?.value.toLowerCase() === "type" && pathAt(at + 1) && tokens[at + 3]?.kind === "word" && tokens[at + 3]?.value.toLowerCase() === fn && isPunct5(tokens[at + 4], "(") ? at + 4 : -1;
  const typeTarget = (at, fns) => {
    for (const fn of fns) {
      const paren = typeCall(at, fn);
      if (paren === -1) continue;
      const literal = tokens[paren + 1];
      const after = tokens[paren + 2];
      const next = pastGroup(paren);
      const certain = isPlainString3(literal) && (fn === "table" ? isPunct5(after, ")") : isPunct5(after, ","));
      return certain ? {
        kind: "table",
        name: literal.value,
        next,
        record: fn !== "table"
      } : { kind: "open" };
    }
    return void 0;
  };
  const target = (at, subqueries) => {
    const token = tokens[at];
    const local = token === void 0 ? void 0 : locals?.get(token);
    if (local !== void 0)
      return { kind: "table", name: local, next: at + 1, record: true };
    const typed = typeTarget(at, ["record", "thing"]);
    if (typed !== void 0) return typed;
    const table = typeTarget(at, ["table"]);
    if (table !== void 0) {
      if (!subqueries) {
        const paren = typeCall(at, "table");
        for (let k = at; k < pastGroup(paren); k++) consumed.add(k);
        return { kind: "open" };
      }
      return table;
    }
    if (isPunct5(token, "(")) {
      return subqueries && SUBQUERY.has(upper5(tokens[at + 1])) ? { kind: "subquery", next: pastGroup(at) } : { kind: "open" };
    }
    if (!isName(token)) return { kind: "open" };
    if (token.kind === "word" && CLAUSES.has(upper5(token)))
      return { kind: "open" };
    const colon = tokens[at + 1];
    if (isPunct5(colon, ":") && !isPunct5(tokens[at + 2], ":")) {
      const key = at + 2;
      const keyToken = tokens[key];
      if (keyToken === void 0) return { kind: "open" };
      const next = isOpen5(keyToken) ? pastGroup(key) : key + 1;
      if (!isOpen5(keyToken) && keyToken.kind === "punct")
        return { kind: "open" };
      return { kind: "table", name: token.value, next, record: true };
    }
    return {
      kind: "table",
      name: token.value,
      next: at + 1,
      record: false
    };
  };
  const ends = (at, extra = []) => {
    const token = tokens[at];
    return token === void 0 || isPunct5(token, ";") || isClose5(token) || CLAUSES.has(upper5(token)) || extra.includes(upper5(token));
  };
  const targetList = (at, into, subqueries, lock) => {
    let j = at;
    if (upper5(tokens[j]) === "ONLY") j++;
    const found = [];
    for (; ; ) {
      const item = target(j, subqueries);
      if (item.kind === "open" || lock !== void 0 && !(item.kind === "table" && item.record)) {
        open = true;
        return;
      }
      if (item.kind === "table") {
        found.push({ name: item.name, token: tokens[j] });
        for (let k = j; k < item.next; k++) consumed.add(k);
      }
      j = item.next;
      if (isPunct5(tokens[j], ",")) {
        j++;
        continue;
      }
      if (!ends(j) && j !== lock) {
        open = true;
        return;
      }
      break;
    }
    for (const { name, token } of found) add(into, name, token);
  };
  const select = (at) => {
    const end = statementEnd(at + 1);
    const froms = [];
    for (let j = at + 1; j < end; j++) {
      if (isOpen5(tokens[j])) {
        j = pastGroup(j) - 1;
        continue;
      }
      if (upper5(tokens[j]) === "FROM" && !member(j)) froms.push(j);
    }
    if (froms.length !== 1) {
      open = true;
      return;
    }
    const lock = lockOf(tokens, at, end);
    if (lock.kind === "refused") {
      open = true;
      return;
    }
    targetList(
      froms[0] + 1,
      readAt,
      true,
      lock.kind === "locked" ? lock.at : void 0
    );
  };
  const write = (at, word) => {
    let j = at + 1;
    if (word === "INSERT") {
      while (upper5(tokens[j]) === "IGNORE" || upper5(tokens[j]) === "RELATION")
        j++;
      if (upper5(tokens[j]) !== "INTO") {
        open = true;
        return;
      }
      j++;
      const token = tokens[j];
      const typed = typeTarget(j, ["table"]);
      if (typed !== void 0) {
        if (typed.kind === "table") {
          for (let k = j; k < typed.next; k++) consumed.add(k);
          add(writtenAt, typed.name, token);
        } else open = true;
        return;
      }
      if (isName(token) && !isPunct5(tokens[j + 1], ".") && !isPunct5(tokens[j + 1], ":")) {
        consumed.add(j);
        add(writtenAt, token.value, token);
      } else open = true;
      return;
    }
    if (word === "RELATE") {
      if (upper5(tokens[j]) === "ONLY") j++;
      const end = statementEnd(j);
      let arrow = -1;
      for (let k = j; k < end; k++) {
        if (isOpen5(tokens[k])) {
          k = pastGroup(k) - 1;
          continue;
        }
        if (isPunct5(tokens[k], "-") && isPunct5(tokens[k + 1], ">") && adjacent2(tokens[k], tokens[k + 1])) {
          arrow = k;
          break;
        }
      }
      if (arrow === -1) {
        open = true;
        return;
      }
      consumed.add(arrow);
      consumed.add(arrow + 1);
      const edge = target(arrow + 2, false);
      const after = edge.kind === "table" ? edge.next : -1;
      if (edge.kind === "table" && isPunct5(tokens[after], "-") && isPunct5(tokens[after + 1], ">") && adjacent2(tokens[after], tokens[after + 1])) {
        for (let k = arrow + 2; k < after + 2; k++) consumed.add(k);
        add(writtenAt, edge.name, tokens[arrow + 2]);
      } else open = true;
      return;
    }
    if (word === "DELETE" && upper5(tokens[j]) === "FROM") j++;
    targetList(j, writtenAt, false);
  };
  const definition = (at) => {
    const kind = upper5(tokens[at + 1]);
    let j = at + 2;
    if (upper5(tokens[j]) === "OVERWRITE") j++;
    if (upper5(tokens[j]) === "IF" && upper5(tokens[j + 1]) === "NOT" && upper5(tokens[j + 2]) === "EXISTS")
      j += 3;
    if (kind === "TABLE" && isName(tokens[j]))
      definedTables.add(tokens[j].value);
    if (kind === "FUNCTION") {
      const name = functionName(j);
      if (name !== void 0) definedFunctions.add(name.name);
    }
  };
  const functionName = (at) => {
    const token = tokens[at];
    if (token?.kind !== "word" || token.value.toLowerCase() !== "fn")
      return void 0;
    let name = token.value;
    let j = at + 1;
    while (pathAt(j) && isName(tokens[j + 2])) {
      name += `::${tokens[j + 2].value}`;
      j += 3;
    }
    return j === at + 1 ? void 0 : { name, next: j };
  };
  const arrowEnd = (at) => {
    const a = tokens[at];
    const b = tokens[at + 1];
    const c = tokens[at + 2];
    if (isPunct5(a, "-") && isPunct5(b, ">") && adjacent2(a, b)) return at + 2;
    if (isPunct5(a, "<") && isPunct5(b, "-") && adjacent2(a, b)) {
      return isPunct5(c, ">") && adjacent2(b, c) ? at + 3 : at + 2;
    }
    return -1;
  };
  const graphStep = (at) => {
    const token = tokens[at];
    if (isName(token)) {
      add(readAt, token.value, token);
      return;
    }
    if (!isPunct5(token, "(")) {
      open = true;
      return;
    }
    if (SUBQUERY.has(upper5(tokens[at + 1]))) return;
    let j = at + 1;
    const names = [];
    for (; ; ) {
      const name = tokens[j];
      if (!isName(name)) {
        open = true;
        return;
      }
      names.push(name);
      j++;
      if (isPunct5(tokens[j], ",")) {
        j++;
        continue;
      }
      break;
    }
    if (!ends(j, ["AS"])) {
      open = true;
      return;
    }
    for (const name of names) add(readAt, name.value, name);
  };
  for (let i = 0; i < tokens.length; i++) {
    if (consumed.has(i)) continue;
    const token = tokens[i];
    if (token.kind === "word") {
      const word = token.value.toUpperCase();
      if (IGNORED.has(word) && statementPosition(i) && !isPunct5(tokens[i + 1], ":")) {
        if (word === "DEFINE") definition(i);
        i = statementEnd(i) - 1;
        continue;
      }
      const fn = functionName(i);
      if (fn !== void 0 && !member(i)) {
        add(functionsAt, fn.name, token);
        i = fn.next - 1;
        continue;
      }
      if (member(i) || isPunct5(tokens[i + 1], ":")) {
        const typed = typeTarget(i, ["record", "thing", "table"]);
        if (typed?.kind === "table") {
          add(readAt, typed.name, token);
        } else if (typed?.kind === "open") open = true;
        continue;
      }
      if (word === "SELECT") {
        select(i);
        continue;
      }
      if (word === "UPDATE" && upper5(tokens[i - 1]) === "FOR") continue;
      if (WRITES.has(word)) {
        if (statementPosition(i) || isPunct5(tokens[i - 1], "[")) {
          write(i, word);
        } else if (!(tokens[i + 1]?.kind === "punct" || upper5(tokens[i + 1]) === "FROM" || upper5(tokens[i + 1]) === "AS")) {
          open = true;
        }
      }
      continue;
    }
    if (token.kind === "punct") {
      const past = arrowEnd(i);
      if (past !== -1 && !isPunct5(tokens[i - 1], "|")) {
        graphStep(past);
        i = past - 1;
      }
    }
  }
  const sortedKeys = (map) => [...map.keys()].sort();
  return {
    read: sortedKeys(readAt),
    written: sortedKeys(writtenAt),
    functions: sortedKeys(functionsAt),
    openTargets: open,
    readAt,
    writtenAt,
    functionsAt,
    definedTables,
    definedFunctions
  };
};

// src/analyze/uses.ts
var upper6 = (token) => token?.kind === "word" ? token.value.toUpperCase() : "";
var isPunct6 = (token, char) => token?.kind === "punct" && token.value === char;
var isOpen6 = (token) => isPunct6(token, "(") || isPunct6(token, "[") || isPunct6(token, "{");
var isClose6 = (token) => isPunct6(token, ")") || isPunct6(token, "]") || isPunct6(token, "}");
var adjacent3 = (a, b) => a !== void 0 && b !== void 0 && a.end === b.start;
var isPlainString4 = (token) => token?.kind === "string" && (token.prefix === void 0 || token.prefix === "s");
var QUERIES = /* @__PURE__ */ new Set([
  "SELECT",
  "CREATE",
  "UPDATE",
  "UPSERT",
  "DELETE",
  "INSERT",
  "RELATE"
]);
var VALUES2 = /* @__PURE__ */ new Set(["NONE", "NULL", "TRUE", "FALSE"]);
var CLAUSE_ENDS = /* @__PURE__ */ new Set([
  "WHERE",
  "SET",
  "UNSET",
  "CONTENT",
  "MERGE",
  "PATCH",
  "REPLACE",
  "RETURN",
  "TIMEOUT",
  "PARALLEL",
  "VERSION",
  "WITH",
  "SPLIT",
  "GROUP",
  "ORDER",
  "LIMIT",
  "START",
  "FETCH",
  "EXPLAIN",
  "TEMPFILES",
  "OMIT"
]);
var BEFORE = /* @__PURE__ */ new Set(["WHERE", "AND", "OR", "SET"]);
var AFTER2 = /* @__PURE__ */ new Set(["AND", "OR", ...CLAUSE_ENDS]);
var COMPARISONS = /* @__PURE__ */ new Set([
  "=",
  "==",
  "!=",
  "<",
  "<=",
  ">",
  ">="
]);
var OPERATOR = "=!<>?~*@&|+-^%/";
var localNames = (tokens) => {
  const names = /* @__PURE__ */ new Set();
  tokens.forEach((token, i) => {
    if (token.kind !== "param") return;
    const before = tokens[i - 1];
    const after = tokens[i + 1];
    if (upper6(before) === "LET" || upper6(before) === "FOR" || isPunct6(before, "|") || isPunct6(after, "|") || isPunct6(after, ":"))
      names.add(token.value);
  });
  return names;
};
var analyzeUses = (tokens, free, locals = /* @__PURE__ */ new Map()) => {
  const local = localNames(tokens);
  const bindable = new Set(free.filter((name2) => !local.has(name2)));
  const found = /* @__PURE__ */ new Map();
  const record = (token, use) => {
    if (token?.kind !== "param" || !bindable.has(token.value)) return false;
    const uses2 = found.get(token.value) ?? /* @__PURE__ */ new Map();
    uses2.set(JSON.stringify(use), use);
    found.set(token.value, uses2);
    return true;
  };
  const named = /* @__PURE__ */ new Map();
  const used = /* @__PURE__ */ new Set();
  const closing = (at) => {
    let depth = 0;
    for (let j = at; j < tokens.length; j++) {
      if (isOpen6(tokens[j])) depth++;
      else if (isClose6(tokens[j])) {
        depth--;
        if (depth === 0) return j;
      }
    }
    return tokens.length;
  };
  const pathAt = (at) => isPunct6(tokens[at], ":") && isPunct6(tokens[at + 1], ":") && adjacent3(tokens[at], tokens[at + 1]);
  const loneParam = (at) => tokens[at]?.kind === "param" && !isPunct6(tokens[at + 1], ".") && !isPunct6(tokens[at + 1], "[");
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.kind !== "word") continue;
    if (isPunct6(tokens[i - 1], ".") || isPunct6(tokens[i - 1], ":"))
      continue;
    const word = token.value.toLowerCase();
    if (word === "fn" && pathAt(i + 1)) {
      let name2 = token.value;
      let j = i + 1;
      while (pathAt(j) && (tokens[j + 2]?.kind === "word" || tokens[j + 2]?.kind === "ident")) {
        name2 += `::${tokens[j + 2].value}`;
        j += 3;
      }
      if (!isPunct6(tokens[j], "(")) continue;
      const end = closing(j);
      let start = j + 1;
      let index = 0;
      for (let k = j + 1; k <= end; k++) {
        if (isOpen6(tokens[k])) {
          k = closing(k);
          continue;
        }
        if (k === end || isPunct6(tokens[k], ",")) {
          if (k - start === 1 && tokens[start]?.kind === "param")
            record(tokens[start], {
              kind: "argument",
              function: name2,
              index,
              line: tokens[start].line
            });
          index++;
          start = k + 1;
        }
      }
      continue;
    }
    if (word === "type" && pathAt(i + 1) && tokens[i + 3]?.kind === "word" && ["record", "thing"].includes(
      tokens[i + 3].value.toLowerCase()
    ) && isPunct6(tokens[i + 4], "(") && isPlainString4(tokens[i + 5]) && isPunct6(tokens[i + 6], ",") && tokens[i + 7]?.kind === "param" && isPunct6(tokens[i + 8], ")")) {
      record(tokens[i + 7], {
        kind: "key",
        table: tokens[i + 5].value,
        line: tokens[i + 7].line
      });
    }
  }
  const operatorAt = (at) => {
    let text = "";
    let j = at;
    while (tokens[j]?.kind === "punct" && OPERATOR.includes(tokens[j].value) && (j === at || adjacent3(tokens[j - 1], tokens[j]))) {
      text += tokens[j].value;
      j++;
    }
    return COMPARISONS.has(text) ? { text, next: j } : void 0;
  };
  const operatorBefore = (at) => {
    let j = at - 1;
    let text = "";
    while (tokens[j]?.kind === "punct" && OPERATOR.includes(tokens[j].value) && (j === at - 1 || adjacent3(tokens[j], tokens[j + 1]))) {
      text = tokens[j].value + text;
      j--;
    }
    const operand = tokens[j];
    const ends = operand !== void 0 && (operand.kind === "ident" || operand.kind === "param" || operand.kind === "string" || isClose6(operand) || operand.kind === "word" && !startsAfter(j));
    return ends && COMPARISONS.has(text) ? text : void 0;
  };
  const bareField = (at) => {
    const token = tokens[at];
    if (token === void 0) return void 0;
    if (token.kind === "word") {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/u.test(token.value))
        return void 0;
      const word = token.value.toUpperCase();
      if (VALUES2.has(word) || AFTER2.has(word)) return void 0;
      if (token.value === "NaN" || token.value === "Infinity")
        return void 0;
    } else if (token.kind !== "ident") return void 0;
    const after = tokens[at + 1];
    if (isPunct6(after, ".") || isPunct6(after, "(") || isPunct6(after, "[") || isPunct6(after, ":") || isPunct6(after, "-") && isPunct6(tokens[at + 2], ">") || isPunct6(after, "<") && isPunct6(tokens[at + 2], "-"))
      return void 0;
    return token.value;
  };
  const startsAfter = (at) => {
    const token = tokens[at];
    return BEFORE.has(upper6(token)) || isPunct6(token, "(") || isPunct6(token, ",");
  };
  const forUpdateAt = (at) => upper6(tokens[at]) === "FOR" && upper6(tokens[at + 1]) === "UPDATE";
  const endsAt = (at, end) => {
    const token = tokens[at];
    return at >= end || token === void 0 || isPunct6(token, ";") || isPunct6(token, ")") || isPunct6(token, ",") || AFTER2.has(upper6(token)) || forUpdateAt(at);
  };
  const fromSubquery = (from, end) => {
    for (let j = from + 1; j < end; j++) {
      if (isOpen6(tokens[j])) {
        j = closing(j);
        continue;
      }
      if (upper6(tokens[j]) !== "FROM" || isPunct6(tokens[j - 1], ".") || isPunct6(tokens[j - 1], ":"))
        continue;
      let k = j + 1;
      if (upper6(tokens[k]) === "ONLY") k++;
      for (; ; ) {
        if (isPunct6(tokens[k], "(")) return true;
        while (k < end && !isPunct6(tokens[k], ",") && !isPunct6(tokens[k], ";") && !(CLAUSE_ENDS.has(upper6(tokens[k])) && !isPunct6(tokens[k + 1], ":")))
          k = isOpen6(tokens[k]) ? closing(k) + 1 : k + 1;
        if (!isPunct6(tokens[k], ",")) break;
        k++;
      }
    }
    return false;
  };
  const query = (from, end, place) => {
    const word = upper6(tokens[from]);
    let filtered = false;
    for (let j = from + 1; j < end && !filtered; j++) {
      if (isOpen6(tokens[j])) j = closing(j);
      else
        filtered = upper6(tokens[j]) === "WHERE" && !isPunct6(tokens[j - 1], ".") && !isPunct6(tokens[j - 1], ":") && !isPunct6(tokens[j + 1], ":");
    }
    const slice = tokens.slice(from, end);
    const targets = analyzeTargets(slice);
    const tables = /* @__PURE__ */ new Set([...targets.read, ...targets.written]);
    const table = tables.size === 1 ? [...tables][0] : void 0;
    const opaque = word === "SELECT" && fromSubquery(from, end);
    const certain = table !== void 0 && !targets.openTargets && QUERIES.has(word) && !opaque;
    const fixed = certain || locals.size === 0 ? targets : analyzeTargets(slice, locals);
    const fixedTables = /* @__PURE__ */ new Set([...fixed.read, ...fixed.written]);
    const fieldTable = fixedTables.size === 1 && !fixed.openTargets && QUERIES.has(word) && !opaque ? [...fixedTables][0] : void 0;
    let clause = "";
    let clauses = 0;
    const scan = (start, stop, depth) => {
      for (let i = start; i < stop; i++) {
        const token = tokens[i];
        if (isPunct6(token, "(")) {
          const close = closing(i);
          if (QUERIES.has(upper6(tokens[i + 1])))
            query(i + 1, close, "subquery");
          else scan(i + 1, close, depth + 1);
          i = close;
          continue;
        }
        if (isOpen6(token)) {
          const close = closing(i);
          nested(i + 1, close);
          i = close;
          continue;
        }
        if (depth === 0 && token.kind === "word" && CLAUSE_ENDS.has(token.value.toUpperCase()) && !isPunct6(tokens[i - 1], ".") && !isPunct6(tokens[i - 1], ":") && !isPunct6(tokens[i + 1], ":")) {
          clause = token.value.toUpperCase();
          if (clause === "WHERE" || clause === "SET") clauses++;
          continue;
        }
        if (depth === 0 && forUpdateAt(i)) {
          clause = "FOR";
          continue;
        }
        if (fieldTable === void 0 || clauses > 1) continue;
        const inWhere = clause === "WHERE";
        const inSet = clause === "SET" && depth === 0 && (word === "UPDATE" || word === "UPSERT" || word === "CREATE");
        if (!inWhere && !inSet) continue;
        if (certain && table !== void 0 && (inWhere ? place !== "block" : place === "statement" && !filtered))
          bindingUse(i, table, inWhere);
        if (inWhere) compared(i, fieldTable);
        else assigned(i, fieldTable);
      }
    };
    const bindingUse = (i, table2, inWhere) => {
      const token = tokens[i];
      if (!startsAfter(i - 1)) return;
      const field = bareField(i);
      if (field !== void 0) {
        const op = operatorAt(i + 1);
        if (op !== void 0 && (inWhere || op.text === "=") && loneParam(op.next) && endsAt(op.next + 1, end) && record(tokens[op.next], {
          kind: "field",
          table: table2,
          field,
          role: inWhere ? "compare" : "assign",
          line: tokens[op.next].line
        }))
          used.add(i);
        return;
      }
      if (inWhere && loneParam(i)) {
        const op = operatorAt(i + 1);
        if (op === void 0) return;
        const other = bareField(op.next);
        if (other !== void 0 && endsAt(op.next + 1, end) && record(token, {
          kind: "field",
          table: table2,
          field: other,
          role: "compare",
          line: token.line
        }))
          used.add(op.next);
      }
    };
    const compared = (i, table2) => {
      const field = bareField(i);
      if (field === void 0 || used.has(i)) return;
      const left = startsAfter(i - 1) && operatorAt(i + 1) !== void 0;
      const right = operatorBefore(i) !== void 0 && endsAt(i + 1, end);
      if (!left && !right) return;
      name(i, table2, field, "compare");
    };
    const assigned = (i, table2) => {
      const after = upper6(tokens[i - 1]);
      if (after !== "SET" && !isPunct6(tokens[i - 1], ",")) return;
      const field = bareField(i);
      const op = operatorAt(i + 1);
      if (field === void 0 || op?.text !== "=") return;
      const past = neverNone(op.next);
      if (past === void 0 || !assignmentEndsAt(past)) return;
      name(i, table2, field, "assign");
    };
    const assignmentEndsAt = (at) => {
      const token = tokens[at];
      return at >= end || token === void 0 || isPunct6(token, ";") || isPunct6(token, ")") || isPunct6(token, "}") || isPunct6(token, ",") || CLAUSE_ENDS.has(upper6(token)) && !isPunct6(tokens[at + 1], ":");
    };
    scan(from, end, 0);
  };
  const name = (i, table, field, role) => {
    const line = tokens[i].line;
    named.set(JSON.stringify([line, table, field, role]), {
      table,
      field,
      role,
      line
    });
  };
  const numberAt = (at) => tokens[at]?.kind === "word" && /^[0-9]/u.test(tokens[at]?.value ?? "");
  const neverNone = (at) => {
    const token = tokens[at];
    if (token === void 0) return void 0;
    if (token.kind === "string") return at + 1;
    if (isPunct6(token, "[")) return closing(at) + 1;
    let j = at;
    if (isPunct6(token, "-") && adjacent3(token, tokens[at + 1])) j++;
    if (numberAt(j)) {
      if (isPunct6(tokens[j + 1], ".") && numberAt(j + 2) && adjacent3(tokens[j], tokens[j + 1]) && adjacent3(tokens[j + 1], tokens[j + 2]))
        return j + 3;
      return j + 1;
    }
    if (j !== at || token.kind !== "word" && token.kind !== "ident")
      return void 0;
    const word = token.value.toUpperCase();
    if (token.kind === "word" && (word === "TRUE" || word === "FALSE" || word === "NULL") && !isPunct6(tokens[at + 1], ":"))
      return at + 1;
    if (/^[A-Za-z_]/u.test(token.value) && isPunct6(tokens[at + 1], ":") && !isPunct6(tokens[at + 2], ":")) {
      const key = tokens[at + 2];
      if (isPunct6(key, "[")) return closing(at + 2) + 1;
      if (key !== void 0 && (key.kind === "word" || key.kind === "ident" || key.kind === "string"))
        return at + 3;
    }
    return void 0;
  };
  const nested = (start, stop) => {
    for (let i = start; i < stop; i++) {
      if (!isOpen6(tokens[i])) continue;
      const close = closing(i);
      if (isPunct6(tokens[i], "(") && QUERIES.has(upper6(tokens[i + 1])))
        query(i + 1, close, "subquery");
      else if (isPunct6(tokens[i], "{")) statements(i + 1, close, true);
      else nested(i + 1, close);
      i = close;
    }
  };
  const statements = (start, stop, inBlock) => {
    for (const statement of statementsIn(tokens, start, stop)) {
      const { first, end } = statement;
      if (queryAt(tokens, statement, QUERIES))
        query(first, end, inBlock ? "block" : "statement");
      else if (!inBlock && isPunct6(tokens[first], "(") && QUERIES.has(upper6(tokens[first + 1])) && closing(first) === end - 1)
        query(first + 1, end - 1, "statement");
      else nested(statement.start, end);
    }
  };
  statements(0, tokens.length, false);
  const uses = {};
  for (const name2 of [...found.keys()].sort()) {
    uses[name2] = [...found.get(name2).entries()].sort(
      ([a, x], [b, y]) => x.line !== y.line ? x.line - y.line : a < b ? -1 : a > b ? 1 : 0
    ).map(([, use]) => use);
  }
  const fields = [...named.values()].sort(
    (a, b) => a.line !== b.line ? a.line - b.line : a.table !== b.table ? a.table < b.table ? -1 : 1 : a.field !== b.field ? a.field < b.field ? -1 : 1 : a.role < b.role ? -1 : a.role > b.role ? 1 : 0
  );
  return { uses, fields };
};

// src/analyze/analyze.ts
var PROTECTED = /* @__PURE__ */ new Set([
  "auth",
  "access",
  "session",
  "token"
]);
var IMPLICIT = /* @__PURE__ */ new Set(["this", "self", "parent"]);
var CONTEXTUAL = /* @__PURE__ */ new Set([
  "value",
  "input",
  "before",
  "after",
  "event"
]);
var STATEMENT_WORDS = /* @__PURE__ */ new Set([
  "LET",
  "BEGIN",
  "COMMIT",
  "CANCEL",
  "DEFINE",
  "REMOVE",
  "ALTER",
  "USE",
  "OPTION"
]);
var WRITE_WORDS = /* @__PURE__ */ new Set([
  "CREATE",
  "INSERT",
  "UPDATE",
  "UPSERT",
  "DELETE",
  "RELATE",
  "DEFINE",
  "REMOVE",
  "ALTER"
]);
var VALUE_WORDS2 = /* @__PURE__ */ new Set(["RETURN", "THEN", "ELSE"]);
var identifier = /^[A-Za-z_][A-Za-z0-9_]*$/u;
var frame = (open, role, vars = []) => ({
  open,
  role,
  vars: new Set(vars),
  statementStart: open === "{" || open === "root",
  params: []
});
var isWord = (token, word) => token?.kind === "word" && token.value.toUpperCase() === word;
var isPunct7 = (token, char) => token?.kind === "punct" && token.value === char;
var sorted = (values) => [...new Set(values)].sort();
var analyzeLexed = (sql, lexed) => {
  const { tokens, locate } = lexed;
  const diagnostics = [];
  const diagnose = (severity, code, message, token) => diagnostics.push({
    severity,
    code,
    message,
    line: token.line,
    column: token.column,
    offset: token.start
  });
  const fail = (code, message, token) => {
    throw new AnalyzeError({
      code,
      message,
      line: token.line,
      column: token.column,
      offset: token.start
    });
  };
  const first = tokens[0];
  const last = tokens[tokens.length - 1];
  if (first === void 0 || last === void 0) {
    throw new AnalyzeError({
      code: "empty",
      message: "the text has no statements",
      ...locate(0),
      offset: 0
    });
  }
  const root = frame("root", "root");
  const frames = [root];
  const closures = [];
  const free = /* @__PURE__ */ new Set();
  const warned = /* @__PURE__ */ new Set();
  const holes = /* @__PURE__ */ new Set();
  const throwsAt = /* @__PURE__ */ new Map();
  const skip = /* @__PURE__ */ new Set();
  const holeSites = [];
  const unboundReads = /* @__PURE__ */ new Map();
  const visibleNames = () => {
    const names = /* @__PURE__ */ new Set();
    for (const f of frames) for (const name of f.vars) names.add(name);
    for (const scope of closures)
      for (const name of scope.vars) names.add(name);
    return names;
  };
  let slots = 0;
  let valueSlot = 0;
  let control = false;
  let transactional = false;
  let writes = false;
  let statementFirst;
  let inDefinition = false;
  let inTransaction = false;
  let returnInTransaction;
  const top = () => frames[frames.length - 1];
  const visible = (name) => closures.some((scope) => scope.vars.has(name)) || frames.some((f) => f.vars.has(name));
  const endClosures = (depth) => {
    while (closures.length > 0 && (closures[closures.length - 1]?.depth ?? 0) >= depth)
      closures.pop();
  };
  const checkName2 = (name, token) => {
    if (!identifier.test(name)) {
      diagnose(
        "error",
        "unbindableName",
        `\`$${name}\` is not a name a statement can bind or define: use letters, digits and underscores`,
        token
      );
    }
  };
  const startStatement = (token, current) => {
    if (current === root) {
      statementFirst = token;
      const word = token.kind === "word" ? token.value.toUpperCase() : "";
      if (returnInTransaction !== void 0) {
        if (word !== "COMMIT" && word !== "CANCEL") {
          diagnose(
            "error",
            "returnInTransaction",
            "a RETURN inside BEGIN \u2026 COMMIT is followed by another statement: SurrealDB 3 skips the statements after it and SurrealDB 4 runs them",
            returnInTransaction
          );
        }
        returnInTransaction = void 0;
      }
      control = word === "BEGIN" || word === "COMMIT" || word === "CANCEL";
      if (word === "BEGIN") {
        transactional = true;
        inTransaction = true;
      } else if (word === "COMMIT" || word === "CANCEL") {
        transactional = true;
        inTransaction = false;
      }
      if (word === "DEFINE") {
        const kind2 = tokens[tokens.indexOf(token) + 1];
        inDefinition = !isWord(kind2, "FUNCTION") && !isWord(kind2, "PARAM");
      }
    }
    if (isWord(token, "RETURN") && inTransaction && returnInTransaction === void 0 && frames.every((f) => f.role === "root" || f.role === "block")) {
      returnInTransaction = token;
    }
  };
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const current = top();
    if (skip.has(i)) continue;
    let starting = false;
    if (!isPunct7(token, ";")) {
      starting = current === root ? statementFirst === void 0 : current.statementStart;
      if (starting) startStatement(token, current);
      current.statementStart = false;
    }
    switch (token.kind) {
      case "hole":
        holes.add(token.value);
        holeSites.push({
          name: token.value,
          index: i,
          frame: current,
          visible: visibleNames(),
          statement: starting
        });
        break;
      case "param": {
        const name = token.value;
        if (current.role === "params") {
          current.params.push(name);
          break;
        }
        if (visible(name) || PROTECTED.has(name) || IMPLICIT.has(name))
          break;
        if (inDefinition && CONTEXTUAL.has(name)) break;
        const reads = unboundReads.get(name) ?? [];
        reads.push({ index: i, frames: [...frames] });
        unboundReads.set(name, reads);
        if (!free.has(name)) {
          free.add(name);
          checkName2(name, token);
          if (CONTEXTUAL.has(name) && !warned.has(name)) {
            warned.add(name);
            diagnose(
              "warning",
              "contextualName",
              `\`$${name}\` is read here without a LET; SurrealDB sets it inside definitions and some clauses, and \`sequence\` refuses it as a binding, so LET it in an earlier part`,
              token
            );
          }
        }
        break;
      }
      case "word": {
        const word = token.value.toUpperCase();
        const next = tokens[i + 1];
        const previous = tokens[i - 1];
        const member = isPunct7(previous, ".") || isPunct7(previous, ":") || isPunct7(next, ":");
        if (member) break;
        if (WRITE_WORDS.has(word) && (starting || isPunct7(previous, "(") || previous?.kind === "word" && VALUE_WORDS2.has(previous.value.toUpperCase()) || isPunct7(previous, "=") && tokens[i - 2]?.kind === "param" && isWord(tokens[i - 3], "LET"))) {
          writes = true;
        }
        if (word === "LET" && next?.kind === "param") {
          skip.add(i + 1);
          if (PROTECTED.has(next.value)) {
            diagnose(
              "error",
              "protectedLet",
              `\`$${next.value}\` is set by SurrealDB and cannot be defined`,
              next
            );
          } else {
            if (current === root) checkName2(next.value, next);
            current.pendingLet = next.value;
          }
        } else if (word === "FOR" && next?.kind === "param" && isWord(tokens[i + 2], "IN")) {
          skip.add(i + 1);
          current.pendingBody = { vars: [next.value], role: "block" };
        } else if (word === "DEFINE" && isWord(next, "FUNCTION")) {
          current.awaitParams = true;
        } else if ((word === "DEFINE" || word === "REMOVE") && isWord(next, "PARAM")) {
          const at = tokens.findIndex(
            (t, j) => j > i && t.kind === "param"
          );
          const param = tokens[at];
          if (param !== void 0 && at <= i + 6) {
            skip.add(at);
            if (word === "DEFINE") {
              diagnose(
                "warning",
                "defineParam",
                `DEFINE PARAM \`$${param.value}\` stores a database parameter; a binding of the same name overrides it in this request, and the analysis does not treat later reads as defined`,
                param
              );
            }
          }
        } else if (word === "THROW") {
          const after = tokens[i + 2];
          if (next?.kind === "string" && (next.prefix === void 0 || next.prefix === "s") && (after === void 0 || isPunct7(after, ";") || isPunct7(after, "}") || isPunct7(after, ")"))) {
            const lines2 = throwsAt.get(next.value) ?? /* @__PURE__ */ new Set();
            lines2.add(token.line);
            throwsAt.set(next.value, lines2);
          } else {
            diagnose(
              "warning",
              "dynamicThrow",
              "THROW of something other than a string literal: its message is not declared, so a client reports it as an unexpected throw",
              token
            );
          }
        }
        break;
      }
      case "punct": {
        const char = token.value;
        if (char === ";") {
          if (current === root) {
            if (statementFirst === void 0) {
              fail("emptyStatement", "an empty statement", token);
            }
            slots++;
            if (!control) valueSlot = slots;
            statementFirst = void 0;
            inDefinition = false;
          } else {
            current.statementStart = current.open === "{";
          }
          if (current.pendingLet !== void 0) {
            current.vars.add(current.pendingLet);
            current.pendingLet = void 0;
          }
          current.pendingBody = void 0;
          current.awaitParams = false;
          endClosures(frames.length);
        } else if (char === ",") {
          endClosures(frames.length);
        } else if (char === "(" || char === "[" || char === "{") {
          const body = char === "{" ? current.pendingBody : void 0;
          if (char === "{") current.pendingBody = void 0;
          const params = char === "(" && current.awaitParams === true;
          if (params) current.awaitParams = false;
          frames.push(
            params ? frame(char, "params") : body !== void 0 ? frame(char, body.role, body.vars) : frame(char, char === "{" ? "block" : "other")
          );
        } else if (char === ")" || char === "]" || char === "}") {
          const closed = frames.pop();
          endClosures(frames.length + 1);
          if (closed.role === "params") {
            top().pendingBody = {
              vars: closed.params,
              role: "function"
            };
          }
        } else if (char === "|" && tokens[i + 1]?.kind === "param") {
          const names = [];
          let j = i + 1;
          for (; ; ) {
            const param = tokens[j];
            if (param?.kind !== "param") {
              return fail(
                "unexpectedToken",
                "cannot read this closure parameter list",
                param ?? token
              );
            }
            names.push(param.value);
            j++;
            if (isPunct7(tokens[j], ":")) {
              let angle = 0;
              j++;
              while (j < tokens.length) {
                const t = tokens[j];
                if (isPunct7(t, "<")) angle++;
                else if (isPunct7(t, ">")) angle--;
                else if (angle === 0 && (isPunct7(t, ",") || isPunct7(t, "|")))
                  break;
                else if (t.kind === "punct" && "()[]{};".includes(t.value))
                  return fail(
                    "unexpectedToken",
                    "cannot read this closure parameter type",
                    t
                  );
                j++;
              }
            }
            if (isPunct7(tokens[j], ",")) {
              j++;
              continue;
            }
            if (isPunct7(tokens[j], "|")) break;
            return fail(
              "unexpectedToken",
              "cannot read this closure parameter list",
              tokens[j] ?? token
            );
          }
          closures.push({
            depth: frames.length,
            vars: new Set(names)
          });
          const after = tokens[j + 1];
          if (isPunct7(after, "{") || isPunct7(after, "-")) {
            current.pendingBody = { vars: [], role: "closure" };
          }
          i = j;
        }
        break;
      }
      default:
        break;
    }
  }
  let kind = "part";
  if (statementFirst !== void 0) {
    if (slots > 0) {
      fail(
        "unterminatedStatement",
        "the last statement is not terminated by `;`; only a single expression or block may be left unterminated (a fragment)",
        statementFirst
      );
    }
    if (statementFirst.kind === "word" && STATEMENT_WORDS.has(statementFirst.value.toUpperCase()) && !isPunct7(tokens[1], ":")) {
      fail(
        "notAFragment",
        `an unterminated ${statementFirst.value.toUpperCase()} statement: terminate it with \`;\`, or a fragment must be a single expression or block`,
        statementFirst
      );
    }
    kind = "fragment";
  }
  if (root.pendingLet !== void 0) root.vars.add(root.pendingLet);
  const throwLines = {};
  for (const message of sorted(throwsAt.keys())) {
    throwLines[message] = [...throwsAt.get(message) ?? []].sort(
      (a, b) => a - b
    );
  }
  diagnostics.sort((a, b) => a.offset - b.offset);
  const targets = analyzeTargets(tokens);
  const locals = recordLocals(tokens);
  const { uses, fields } = analyzeUses(tokens, sorted(free), locals);
  return {
    kind,
    sql: sql.slice(0, last.end),
    comment: leadingComment(sql.slice(0, first.start)),
    free: sorted(free),
    defines: sorted(root.vars),
    slots,
    valueSlot: kind === "fragment" ? 0 : valueSlot,
    throws: Object.keys(throwLines),
    throwsAt: throwLines,
    holes: sorted(holes),
    provisional: holes.size > 0,
    transactional,
    writes,
    tables: { read: targets.read, written: targets.written },
    functions: targets.functions,
    openTargets: targets.openTargets,
    uses,
    projected: analyzeProjections(tokens, locals),
    fields,
    holeScopes: holeScopesOf(holeSites, unboundReads, kind),
    diagnostics
  };
};
var holeScopesOf = (sites, reads, kind) => {
  const out = {};
  for (const name of sorted(sites.map((site) => site.name))) {
    const own = sites.filter((site) => site.name === name);
    const [first, ...rest] = own;
    const bound = [...first?.visible ?? []].filter(
      (candidate) => rest.every((site) => site.visible.has(candidate))
    );
    const binds = [...reads.entries()].filter(
      ([, list2]) => own.some(
        (site) => site.statement && // A LET can stand there: in a block, or at the top of a part.
        (site.frame.open === "{" || kind === "part") && list2.every(
          (read) => read.index > site.index && read.frames.includes(site.frame)
        )
      )
    ).map(([free]) => free);
    out[name] = { bound: sorted(bound), binds: sorted(binds) };
  }
  return out;
};
var dedent = (lines2) => {
  const indents = lines2.filter((line) => line.trim() !== "").map((line) => line.length - line.trimStart().length);
  const indent = indents.length === 0 ? 0 : Math.min(...indents);
  return lines2.map((line) => line.slice(indent));
};
var leadingComment = (head) => {
  const prose = [];
  const paragraph = () => {
    if (prose.length > 0 && prose[prose.length - 1] !== "") prose.push("");
  };
  let i = 0;
  let blankLines = 0;
  while (i < head.length) {
    const c = head[i];
    if (/\s/u.test(c)) {
      if (c === "\n" && ++blankLines > 1) paragraph();
      i++;
      continue;
    }
    blankLines = 0;
    if (c === "/" && head[i + 1] === "*") {
      const end2 = head.indexOf("*/", i + 2);
      const body = head.slice(i + 2, end2 === -1 ? head.length : end2);
      const lines3 = body.split("\n").map((line2) => line2.replace(/^\s*\*(?!\/) ?/u, ""));
      prose.push(...dedent(lines3));
      i = end2 === -1 ? head.length : end2 + 2;
      continue;
    }
    const marker = c === "#" ? 1 : 2;
    const end = head.indexOf("\n", i);
    const line = head.slice(i + marker, end === -1 ? head.length : end);
    const text = line.startsWith(" ") ? line.slice(1) : line;
    if (text.trim() === "") paragraph();
    else prose.push(text);
    i = end === -1 ? head.length : end;
  }
  const lines2 = prose.map((line) => line.trimEnd());
  const from = lines2.findIndex((line) => line !== "");
  if (from === -1) return "";
  let to = lines2.length;
  while (lines2[to - 1] === "") to--;
  return lines2.slice(from, to).filter((line, n, all) => line !== "" || all[n - 1] !== "").join("\n");
};
var analyzeSync = (sql, options = {}) => analyzeLexed(sql, lex2(sql, holeDelimiters(options.holes)));

// src/analyze/check.ts
var SIMPLE = /^(?:string|bool|int|float|number|decimal|datetime|duration|uuid|record<[^<>|,\s]+>)$/u;
var simpleKind = (kind) => {
  if (kind === void 0) return void 0;
  const inner = /^option<(.*)>$/u.exec(kind)?.[1] ?? kind;
  return SIMPLE.test(inner) ? inner : void 0;
};
var acceptsNone = (use, kind) => use.kind === "field" && use.role !== "assign" ? true : use.kind !== "key" && kind !== void 0 && /^option<.*>$/u.test(kind);
var UNPRINTABLE = new RegExp(
  `[\\x00-\\x1f\\x7f${String.fromCharCode(8232, 8233)}]`,
  "gu"
);
var quoted = (name) => `\`${name.replace(/[\\`]/gu, "\\$&").replace(
  UNPRINTABLE,
  (char) => `\\u{${char.codePointAt(0).toString(16)}}`
)}\``;
var resolve = (use, detail) => {
  if (use.kind === "argument") {
    const args = Object.hasOwn(detail.functions, use.function) ? detail.functions[use.function] : void 0;
    if (args === void 0) return { kind: "unchecked" };
    return use.index < args.length ? { kind: "kind", text: args[use.index] } : {
      kind: "problem",
      code: "extraArgument",
      message: `passes argument ${use.index + 1} to \`${use.function}\`, which takes ${args.length === 1 ? "1 argument" : `${args.length} arguments`}`
    };
  }
  const table = Object.hasOwn(detail.tables, use.table) ? detail.tables[use.table] : void 0;
  if (table === void 0) return { kind: "unchecked" };
  if (use.kind === "key") return { kind: "kind", text: table.idKey };
  if (Object.hasOwn(table.fields, use.field)) {
    const field = table.fields[use.field];
    return {
      kind: "kind",
      text: field?.kind,
      rejectsNone: field?.rejectsNone === true
    };
  }
  if (use.field === "id")
    return { kind: "kind", text: `record<${use.table}>` };
  return table.acceptsUndeclared ? { kind: "kind", text: void 0 } : {
    kind: "problem",
    code: "undeclaredField",
    message: `${use.role === "assign" ? "assigns" : "compares"} ${quoted(use.field)} of ${quoted(use.table)}, which declares no such field`
  };
};
var checkUses = (uses, detail, schemaChanges) => {
  const problems = [];
  const binds = {};
  const rejectsNone2 = {};
  for (const [name, list2] of Object.entries(uses)) {
    const kinds = /* @__PURE__ */ new Set();
    let none = true;
    for (const use of list2) {
      const resolved = resolve(use, detail);
      if (resolved.kind === "problem") {
        problems.push({
          line: use.line,
          code: resolved.code,
          message: resolved.message
        });
        kinds.add(void 0);
      } else if (resolved.kind === "unchecked") kinds.add(void 0);
      else {
        kinds.add(simpleKind(resolved.text));
        if (!acceptsNone(use, resolved.text)) none = false;
        if (!schemaChanges && use.kind === "field" && use.role === "assign" && resolved.rejectsNone === true && resolved.text !== void 0 && !Object.hasOwn(rejectsNone2, name))
          rejectsNone2[name] = {
            table: use.table,
            field: use.field,
            kind: resolved.text
          };
      }
    }
    const [only] = kinds;
    if (kinds.size === 1 && only !== void 0)
      binds[name] = none ? `option<${only}>` : only;
  }
  return { problems, binds, rejectsNone: rejectsNone2 };
};
var declaresField = (table, field) => field === "*" || field === "id" || Object.hasOwn(table.fields, field) || Object.keys(table.fields).some(
  (path) => path.startsWith(`${field}.`) || path.startsWith(`${field}[`)
);
var checkProjected = (projected, detail, schemaChanges) => schemaChanges ? [] : projected.flatMap(({ table, field, line }) => {
  const declared = Object.hasOwn(detail.tables, table) ? detail.tables[table] : void 0;
  return declared === void 0 || declared.acceptsUndeclared || declaresField(declared, field) ? [] : [
    {
      line,
      code: "undeclaredField",
      message: `selects ${quoted(field)} of ${quoted(table)}, which declares no such field`
    }
  ];
});
var checkFields = (fields, detail, schemaChanges) => schemaChanges ? [] : fields.flatMap(({ table, field, role, line }) => {
  const declared = Object.hasOwn(detail.tables, table) ? detail.tables[table] : void 0;
  return declared === void 0 || declared.acceptsUndeclared || declaresField(declared, field) ? [] : [
    {
      line,
      code: "undeclaredField",
      message: `${role === "assign" ? "assigns" : "compares"} ${quoted(field)} of ${quoted(table)}, which declares no such field`
    }
  ];
});
var holeStartsStatement = (sql, holes) => {
  const tokens = lex2(sql, holeDelimiters(holes)).tokens;
  return tokens.some((token, i) => {
    const before = tokens[i - 1];
    return token.kind === "hole" && (before === void 0 || before.kind === "punct" && (before.value === ";" || before.value === "{"));
  });
};
var changesSchema = (sql, holes) => {
  const tokens = lex2(sql, holeDelimiters(holes)).tokens;
  return tokens.some(
    (token, i) => token.kind === "word" && ["DEFINE", "ALTER", "REMOVE"].includes(token.value.toUpperCase()) && tokens[i + 1]?.kind === "word" && ["TABLE", "FIELD"].includes(
      (tokens[i + 1]?.value ?? "").toUpperCase()
    )
  );
};
var undeclared = (sql, declared, holes) => {
  const targets = analyzeTargets(lex2(sql, holeDelimiters(holes)).tokens);
  const tables = /* @__PURE__ */ new Set([...declared.tables, ...targets.definedTables]);
  const functions = /* @__PURE__ */ new Set([
    ...declared.functions,
    ...targets.definedFunctions
  ]);
  const found = [];
  const check = (at, known, what, code) => {
    for (const [name, line] of at)
      if (!known.has(name))
        found.push({
          line,
          code,
          message: `${what} \`${name}\`, which the schema does not declare`
        });
  };
  check(targets.readAt, tables, "reads table", "undeclaredTable");
  check(targets.writtenAt, tables, "writes table", "undeclaredTable");
  check(
    targets.functionsAt,
    functions,
    "calls function",
    "undeclaredFunction"
  );
  return found.sort((a, b) => a.line - b.line);
};
var checkText = (sql, declared, holes) => {
  let analysis;
  try {
    analysis = analyzeSync(sql, { ...holes !== void 0 && { holes } });
  } catch (error) {
    if (error instanceof AnalyzeError) return { kind: "refused", error };
    throw error;
  }
  if (declared === void 0)
    return { kind: "analysed", analysis, problems: [] };
  const detail = declared.detail;
  const schemaChanges = detail !== void 0 && changesSchema(sql, holes);
  const checked = detail === void 0 ? void 0 : checkUses(analysis.uses, detail, schemaChanges);
  const fieldsUnknown = schemaChanges || holeStartsStatement(sql, holes);
  const problems = [
    ...undeclared(sql, declared, holes),
    ...checked?.problems ?? [],
    ...detail === void 0 ? [] : [
      ...checkProjected(
        analysis.projected,
        detail,
        fieldsUnknown
      ),
      ...checkFields(analysis.fields, detail, fieldsUnknown)
    ]
  ].sort((a, b) => a.line - b.line);
  return {
    kind: "analysed",
    analysis,
    problems,
    ...checked !== void 0 && {
      binds: checked.binds,
      rejectsNone: checked.rejectsNone
    }
  };
};

// src/analyze/render.ts
var STATEMENTS_MARK = "// Generated by effect-surrealkit from SurrealQL files. Do not edit.";
var NAME = /^[A-Za-z_][A-Za-z0-9_]*$/u;
var RESERVED = new Set(
  "await break case catch class const continue debugger default delete do else enum export extends false finally for function if implements import in instanceof interface let new null package private protected public return static super switch this throw true try typeof var void while with yield arguments eval".split(" ")
);
var StatementModulesError = class extends Data2.TaggedError(
  "StatementModulesError"
) {
};
var checkName = (name, what, seen) => {
  if (!NAME.test(name)) {
    return `${what} is not a JavaScript identifier of letters, digits and underscores`;
  }
  if (RESERVED.has(name)) return `${what} is a reserved word`;
  const folded = name.toLowerCase();
  const other = seen.get(folded);
  if (other !== void 0) {
    return `${what} differs only in case from ${JSON.stringify(other)}`;
  }
  seen.set(folded, name);
  return void 0;
};
var templateLiteral = (text) => `\`${text.replace(/\\/gu, "\\\\").replace(/`/gu, "\\`").replace(/\$\{/gu, "\\${").replace(/\r/gu, "\\r")}\``;
var list = (values) => `[${values.map((value) => JSON.stringify(value)).join(", ")}]`;
var scopesField = (scopes) => `{ ${Object.entries(scopes).map(
  ([hole, scope]) => `${JSON.stringify(hole)}: { bound: ${list(scope.bound)}, binds: ${list(scope.binds)} }`
).join(", ")} }`;
var lines = (throwsAt) => {
  const entries2 = Object.entries(throwsAt);
  return entries2.length === 0 ? "{}" : `{ ${entries2.map(([message, at]) => `${JSON.stringify(message)}: [${at.join(", ")}]`).join(", ")} }`;
};
var useEntry = (use) => use.kind === "argument" ? `{ kind: "argument", function: ${JSON.stringify(use.function)}, index: ${use.index}, line: ${use.line} }` : use.kind === "key" ? `{ kind: "key", table: ${JSON.stringify(use.table)}, line: ${use.line} }` : `{ kind: "field", table: ${JSON.stringify(use.table)}, field: ${JSON.stringify(use.field)}, ${use.role === void 0 ? "" : `role: ${JSON.stringify(use.role)}, `}line: ${use.line} }`;
var usesField = (uses) => `{ ${Object.entries(uses).map(
  ([name, list2]) => `${JSON.stringify(name)}: [${list2.map(useEntry).join(", ")}]`
).join(", ")} }`;
var rejectsNoneField = (fields) => `{ ${Object.entries(fields).map(
  ([name, at]) => `${JSON.stringify(name)}: { table: ${JSON.stringify(at.table)}, field: ${JSON.stringify(at.field)}, kind: ${JSON.stringify(at.kind)} }`
).join(", ")} }`;
var bindsField = (binds) => `{ ${Object.entries(binds).map(
  ([name, kind]) => `${JSON.stringify(name)}: ${JSON.stringify(kind)}`
).join(", ")} }`;
var linesOf = (text) => text.split(/\r\n|[\n\r\u2028\u2029]/u);
var commentSafe = (line) => line.replaceAll("*/", "*\\/").replace(/(^|\s)@/gu, "$1\\@");
var docComment = (analysis, title, holes) => {
  const first = lex2(analysis.sql, holeDelimiters(holes)).tokens[0];
  const body = analysis.sql.slice(first?.start ?? 0);
  const longest = Math.max(
    0,
    ...[...`${analysis.comment}
${body}
${title}`.matchAll(/`+/gu)].map(
      ([run]) => run.length
    )
  );
  const fence = "`".repeat(Math.max(3, longest + 1));
  const prose = (text) => linesOf(text).map((line) => commentSafe(line).trimEnd());
  const lines2 = [
    ...analysis.comment === "" ? [] : [...prose(analysis.comment), ""],
    `${fence}surql`,
    ...linesOf(body).map(commentSafe),
    fence,
    "",
    ...prose(title)
  ];
  return [
    "/**",
    ...lines2.map((line) => line === "" ? " *" : ` * ${line}`),
    " */"
  ].join("\n");
};
var renderConstant = (scope, name, analysis, binds, rejectsNone2, holes) => {
  const file = `${scope}/${name}.surql`;
  const complete = analysis.kind === "part" && analysis.holes.length === 0;
  const what = complete ? "part" : analysis.holes.length > 0 ? "template" : "fragment";
  const fields = [
    `name: ${JSON.stringify(`${scope}.${name}`)}`,
    `source: ${JSON.stringify(file)}`,
    ...complete ? [] : [`kind: ${JSON.stringify(analysis.kind)}`],
    `sql: ${templateLiteral(analysis.sql)}`,
    ...complete ? [] : [`holes: ${list(analysis.holes)}`],
    `free: ${list(analysis.free)}`,
    `defines: ${list(analysis.defines)}`,
    ...complete ? [] : [`provisional: ${analysis.provisional}`],
    ...analysis.holes.length > 0 ? [`scopes: ${scopesField(analysis.holeScopes)}`] : [],
    `slots: ${analysis.slots}`,
    `throws: ${list(analysis.throws)}`,
    `throwsAt: ${lines(analysis.throwsAt)}`,
    ...complete ? [
      `tables: { read: ${list(analysis.tables.read)}, written: ${list(analysis.tables.written)} }`,
      `functions: ${list(analysis.functions)}`,
      ...analysis.openTargets ? ["openTargets: true"] : [],
      ...Object.keys(analysis.uses).length > 0 ? [`uses: ${usesField(analysis.uses)}`] : [],
      ...binds !== void 0 && Object.keys(binds).length > 0 ? [`binds: ${bindsField(binds)}`] : [],
      ...rejectsNone2 !== void 0 && Object.keys(rejectsNone2).length > 0 ? [`rejectsNone: ${rejectsNoneField(rejectsNone2)}`] : []
    ] : []
  ];
  return [
    docComment(analysis, `\`${file}\`: a ${what}.`, holes),
    `export const ${name} = ${complete ? "$statement.part" : "$analyze.text"}({`,
    ...fields.map((field) => `	${field},`),
    "} as const);"
  ].join("\n");
};
var renderStatementModulesSync = (input) => {
  const problems = [];
  const warnings = [];
  const byScope = /* @__PURE__ */ new Map();
  const imports = /* @__PURE__ */ new Map();
  const scopes = /* @__PURE__ */ new Map();
  const names = /* @__PURE__ */ new Map();
  const sources = input.scopes.flatMap(
    (scope) => scope.files.map((file) => ({
      scope: scope.name,
      declared: scope.declared,
      name: file.name,
      sql: file.sql
    }))
  );
  for (const source of sources.sort(
    (a, b) => a.scope === b.scope ? a.name < b.name ? -1 : 1 : a.scope < b.scope ? -1 : 1
  )) {
    const file = `${source.scope}/${source.name}.surql`;
    if (!byScope.has(source.scope)) {
      const problem2 = checkName(
        source.scope,
        `scope ${JSON.stringify(source.scope)}`,
        scopes
      );
      if (problem2 !== void 0) {
        problems.push({
          kind: "scope",
          scope: source.scope,
          message: problem2,
          text: `${source.scope}: ${problem2}`
        });
        continue;
      }
      byScope.set(source.scope, []);
    }
    const seen = names.get(source.scope) ?? /* @__PURE__ */ new Map();
    names.set(source.scope, seen);
    const problem = checkName(
      source.name,
      `file name ${JSON.stringify(source.name)}`,
      seen
    );
    if (problem !== void 0) {
      problems.push({
        kind: "name",
        scope: source.scope,
        file: source.name,
        message: problem,
        text: `${file}: ${problem}`
      });
      continue;
    }
    const checked = checkText(source.sql, source.declared, input.holes);
    if (checked.kind === "refused") {
      const { error } = checked;
      problems.push({
        kind: "analysis",
        scope: source.scope,
        file: source.name,
        line: error.line,
        column: error.column,
        code: error.code,
        message: error.message,
        text: `${file}:${error.line}:${error.column}: ${error.message}`
      });
      continue;
    }
    const { analysis, binds, rejectsNone: rejectsNone2 } = checked;
    for (const problem2 of checked.problems)
      problems.push({
        kind: "undeclared",
        scope: source.scope,
        file: source.name,
        line: problem2.line,
        message: problem2.message,
        text: `${file}:${problem2.line}: ${problem2.message}`
      });
    for (const diagnostic of analysis.diagnostics) {
      const at = {
        scope: source.scope,
        file: source.name,
        line: diagnostic.line,
        column: diagnostic.column,
        code: diagnostic.code,
        message: diagnostic.message,
        text: `${file}:${diagnostic.line}:${diagnostic.column}: ${diagnostic.message} (${diagnostic.code})`
      };
      if (diagnostic.severity === "error")
        problems.push({ kind: "analysis", ...at });
      else warnings.push(at);
    }
    const used = imports.get(source.scope) ?? /* @__PURE__ */ new Set();
    used.add(
      analysis.kind === "part" && analysis.holes.length === 0 ? "statement" : "analyze"
    );
    imports.set(source.scope, used);
    const constants = byScope.get(source.scope) ?? [];
    constants.push(
      renderConstant(
        source.scope,
        source.name,
        analysis,
        binds,
        rejectsNone2,
        input.holes
      )
    );
    byScope.set(source.scope, constants);
  }
  if (problems.length > 0) {
    const unique = /* @__PURE__ */ new Map();
    for (const problem of problems)
      if (!unique.has(problem.text)) unique.set(problem.text, problem);
    throw new StatementModulesError({
      problems: [...unique.values()],
      message: [...unique.keys()].join("\n")
    });
  }
  const files = [];
  for (const [scope, constants] of byScope) {
    const used = imports.get(scope) ?? /* @__PURE__ */ new Set();
    files.push({
      path: `${scope}/statements.ts`,
      content: [
        STATEMENTS_MARK,
        "",
        ...used.has("analyze") ? ['import * as $analyze from "effect-surrealkit/analyze";'] : [],
        ...used.has("statement") ? [
          'import * as $statement from "effect-surrealkit/statement";'
        ] : [],
        "",
        constants.join("\n\n"),
        ""
      ].join("\n")
    });
  }
  const extension = input.importExtension ?? ".js";
  files.push({
    path: "index.ts",
    content: [
      STATEMENTS_MARK,
      "",
      ...[...byScope.keys()].map(
        (scope) => `export * as ${scope} from "./${scope}/statements${extension}";`
      ),
      ""
    ].join("\n")
  });
  return { files, warnings };
};

// src/mapper/layout.ts
var entries = (directory) => readdirSync(directory, { withFileTypes: true }).filter((entry) => !entry.name.startsWith(".")).sort((a, b) => a.name < b.name ? -1 : 1);
var listRoot = (root) => {
  const problems = [];
  const scopes = [];
  let found;
  try {
    found = entries(root);
  } catch (cause) {
    return {
      problems: [
        `cannot read the input ${root}: ${cause instanceof Error ? cause.message : String(cause)}`
      ],
      scopes
    };
  }
  for (const scope of found) {
    if (!scope.isDirectory()) {
      problems.push(
        `${scope.name}: --input holds only scope directories`
      );
      continue;
    }
    const files = [];
    let other = false;
    for (const entry of entries(join(root, scope.name))) {
      if (!entry.isFile() || !entry.name.endsWith(".surql")) {
        problems.push(
          `${scope.name}/${entry.name}: a scope holds only .surql files`
        );
        other = true;
        continue;
      }
      files.push(entry.name.slice(0, -".surql".length));
    }
    if (files.length === 0 && !other)
      problems.push(`${scope.name}: has no .surql files`);
    scopes.push({ name: scope.name, files });
  }
  if (scopes.length === 0 && problems.length === 0)
    problems.push(`${root} has no scope directories`);
  return { problems, scopes };
};
var PLACEHOLDER = "RETURN NONE;";
var surqlLayout = (roots, file) => {
  if (roots.length === 0)
    return {
      problems: [
        'the content mapper options name no input; set "input" to the directory the statements command reads with --input'
      ]
    };
  const absolute = resolve2(file);
  const containing = roots.filter((root2) => {
    const path = relative(root2, absolute);
    return path !== "" && !isAbsolute(path) && path.split(sep)[0] !== "..";
  });
  if (containing.length === 0)
    return {
      problems: [
        `the file is outside the input (${roots.join(", ")}); the statements command reads only <input>/<scope>/<name>.surql`
      ]
    };
  if (containing.length > 1)
    return {
      problems: [
        `the file is inside more than one input (${containing.join(", ")})`
      ]
    };
  const root = containing[0];
  const segments = relative(root, absolute).split(sep);
  if (segments.length !== 2 || !(segments[1] ?? "").endsWith(".surql"))
    return {
      problems: [
        `${segments.join("/")} is not <scope>/<name>.surql under the input ${root}; the statements command reads only that layout`
      ]
    };
  const [scope, base] = segments;
  if (scope.startsWith(".") || base.startsWith("."))
    return {
      problems: [
        `${scope}/${base}: the statements command ignores dot entries`
      ]
    };
  const name = base.slice(0, -".surql".length);
  const problems = [];
  const seen = /* @__PURE__ */ new Map();
  const scopes = [];
  for (const each of roots) {
    const listing = listRoot(each);
    for (const problem of listing.problems)
      problems.push(
        `the statements command refuses the input ${each}: ${problem}`
      );
    for (const listed of listing.scopes) {
      const other = seen.get(listed.name);
      if (other !== void 0) {
        problems.push(
          `the scope ${JSON.stringify(listed.name)} is in two inputs, ${other} and ${each}`
        );
        continue;
      }
      seen.set(listed.name, each);
      scopes.push({
        name: listed.name,
        files: listed.files.map((file2) => ({
          name: file2,
          sql: PLACEHOLDER
        }))
      });
    }
  }
  try {
    renderStatementModulesSync({ scopes });
  } catch (error) {
    const named = error.problems;
    if (named === void 0) throw error;
    for (const problem of named)
      if (problem.kind === "name" || problem.kind === "scope")
        problems.push(`the statements command refuses ${problem.text}`);
  }
  if (seen.get(scope) !== root)
    problems.push(
      `the scope ${JSON.stringify(scope)} is not read from ${root}`
    );
  return problems.length > 0 ? { problems } : { scope, name };
};

// src/mapper/module.ts
var EMPTY_SURQL_MODULE = `${STATEMENTS_MARK}

export {};
`;
var offsetOf = (sql, line, column) => {
  let start = 0;
  for (let at = 1; at < line; at++) {
    const next = sql.indexOf("\n", start);
    if (next === -1) return sql.length;
    start = next + 1;
  }
  const end = sql.indexOf("\n", start);
  const lineEnd = end === -1 ? sql.length : end;
  return Math.min(start + Math.max(column, 1) - 1, lineEnd);
};
var surqlDiagnostic = (file, kind, message, at = {}) => {
  const line = at.line ?? 1;
  const column = at.column ?? 1;
  return {
    kind,
    line,
    column,
    offset: offsetOf(file.sql, line, column),
    ...at.code !== void 0 && { code: at.code },
    message,
    text: `${file.scope}/${file.name}.surql:${line}:${column}: ${message}`
  };
};
var renderSurqlModule = (file, options = {}) => {
  try {
    const { files } = renderStatementModulesSync({
      scopes: [
        {
          name: file.scope,
          files: [{ name: file.name, sql: file.sql }],
          ...options.declared !== void 0 && {
            declared: options.declared
          }
        }
      ],
      ...options.holes !== void 0 && { holes: options.holes }
    });
    const module = files.find(
      (rendered) => rendered.path === `${file.scope}/statements.ts`
    );
    if (module === void 0)
      throw new Error(`renderStatementModules rendered no ${file.scope}`);
    return { text: module.content, problems: [] };
  } catch (error) {
    if (!(error instanceof StatementModulesError)) throw error;
    return {
      text: EMPTY_SURQL_MODULE,
      problems: error.problems.map(
        (problem) => surqlDiagnostic(file, problem.kind, problem.message, {
          ...problem.line !== void 0 && { line: problem.line },
          ...problem.column !== void 0 && {
            column: problem.column
          },
          ...problem.code !== void 0 && { code: problem.code }
        })
      )
    };
  }
};

// src/mapper/project.ts
import { createHash } from "crypto";
import { readFileSync, statSync } from "fs";
import { dirname, isAbsolute as isAbsolute2, join as join2, resolve as resolve3 } from "path";
import { isDeepStrictEqual } from "util";
import { Effect as Effect4 } from "effect";

// src/emitter/document.ts
import { Data as Data3, Effect as Effect3, Schema, SchemaIssue } from "effect";
var Name = Schema.String.check(Schema.isMinLength(1));
var Expr = Schema.String;
var Path = Schema.Array(Name).check(Schema.isMinLength(1));
var Names = Schema.Array(Name);
var NonNegativeInt = Schema.Number.check(
  Schema.isInt(),
  Schema.isGreaterThanOrEqualTo(0)
);
var Permission = Schema.Union([Schema.Boolean, Expr]);
var TablePermissions = Schema.Struct({
  select: Permission,
  create: Permission,
  update: Permission,
  delete: Permission
});
var FieldPermissions = Schema.Struct({
  select: Permission,
  create: Permission,
  update: Permission
});
var PrimitiveKindName = Schema.Literals([
  "any",
  "none",
  "null",
  "bool",
  "int",
  "float",
  "decimal",
  "number",
  "string",
  "datetime",
  "duration",
  "uuid",
  "bytes",
  "regex",
  "range",
  "function",
  "object"
]);
var GeometryType = Schema.Literals([
  "collection",
  "line",
  "multiline",
  "multipoint",
  "multipolygon",
  "point",
  "polygon"
]);
var LiteralType = Schema.Literals([
  "string",
  "int",
  "float",
  "decimal",
  "bool",
  "duration"
]);
var KindRef = Schema.suspend(() => KindSchema);
var LiteralKindSchema = Schema.Struct({
  kind: Schema.Literal("literal"),
  type: LiteralType,
  value: Schema.Union([Schema.String, Schema.Boolean])
}).check(
  Schema.makeFilter(
    (literal) => literal.type === "bool" === (typeof literal.value === "boolean") || "a bool literal has a boolean value; every other literal a string"
  )
);
var KindSchema = Schema.Union([
  Schema.Struct({ kind: PrimitiveKindName }),
  Schema.Struct({ kind: Schema.Literal("record"), tables: Names }),
  Schema.Struct({ kind: Schema.Literal("table"), tables: Names }),
  Schema.Struct({ kind: Schema.Literal("file"), buckets: Names }),
  Schema.Struct({
    kind: Schema.Literal("geometry"),
    types: Schema.Array(GeometryType)
  }),
  Schema.Struct({
    kind: Schema.Literal("array"),
    item: KindRef,
    length: Schema.optionalKey(NonNegativeInt)
  }),
  Schema.Struct({
    kind: Schema.Literal("set"),
    item: KindRef,
    length: Schema.optionalKey(NonNegativeInt)
  }),
  Schema.Struct({
    kind: Schema.Literal("tuple"),
    items: Schema.Array(KindRef)
  }),
  Schema.Struct({
    kind: Schema.Literal("objectLiteral"),
    fields: Schema.Array(
      Schema.Struct({
        name: Name,
        kind: KindRef,
        optional: Schema.Boolean
      })
    )
  }),
  LiteralKindSchema,
  Schema.Struct({ kind: Schema.Literal("option"), item: KindRef }),
  Schema.Struct({
    kind: Schema.Literal("union"),
    variants: Schema.Array(KindRef).check(Schema.isMinLength(2))
  }),
  Schema.Struct({ kind: Schema.Literal("unknown"), source: Schema.String })
]);
var Bound = Schema.Struct({
  value: Schema.String.check(Schema.isMinLength(1)),
  inclusive: Schema.Boolean
});
var Refinement = Schema.Union([
  Schema.Struct({
    type: Schema.Literal("literals"),
    values: Schema.Array(LiteralKindSchema).check(Schema.isMinLength(1))
  }),
  Schema.Struct({
    type: Schema.Literal("range"),
    valueKind: Schema.Literals(["int", "float", "decimal", "duration"]),
    min: Schema.optionalKey(Bound),
    max: Schema.optionalKey(Bound)
  }),
  Schema.Struct({
    type: Schema.Literal("length"),
    target: Schema.Literals(["string", "array"]),
    min: Schema.optionalKey(NonNegativeInt),
    max: Schema.optionalKey(NonNegativeInt)
  }),
  Schema.Struct({ type: Schema.Literal("email") })
]);
var Field = Schema.Struct({
  path: Path,
  kind: Schema.optionalKey(KindSchema),
  optional: Schema.Boolean,
  flexible: Schema.Boolean,
  readonly: Schema.Boolean,
  inline: Schema.Boolean,
  default: Schema.optionalKey(
    Schema.Struct({
      mode: Schema.Literals(["create", "always"]),
      expr: Expr
    })
  ),
  value: Schema.optionalKey(
    Schema.Struct({ expr: Expr, readsInput: Schema.Boolean })
  ),
  computed: Schema.optionalKey(Schema.Struct({ expr: Expr })),
  assert: Schema.optionalKey(
    Schema.Struct({
      expr: Expr,
      recognized: Schema.optionalKey(
        Schema.Array(Refinement).check(Schema.isMinLength(1))
      )
    })
  ),
  reference: Schema.optionalKey(
    Schema.Union([
      Schema.Struct({
        onDelete: Schema.Literals([
          "reject",
          "ignore",
          "cascade",
          "unset"
        ])
      }),
      Schema.Struct({ onDelete: Schema.Literal("then"), expr: Expr })
    ])
  ),
  permissions: FieldPermissions,
  comment: Schema.optionalKey(Schema.String),
  define: Schema.optionalKey(Schema.String)
});
var Index = Schema.Struct({
  name: Name,
  columns: Schema.Array(Path),
  type: Schema.Literals([
    "standard",
    "unique",
    "fulltext",
    "hnsw",
    "diskann",
    "count"
  ]),
  clause: Schema.String,
  fulltext: Schema.optionalKey(
    Schema.Struct({ analyzer: Name, highlights: Schema.Boolean })
  ),
  vector: Schema.optionalKey(
    Schema.Struct({
      dimension: Schema.Number.check(
        Schema.isInt(),
        Schema.isGreaterThanOrEqualTo(1)
      ),
      distance: Name,
      elementType: Name
    })
  ),
  where: Schema.optionalKey(Expr),
  comment: Schema.optionalKey(Schema.String)
});
var Event = Schema.Struct({
  name: Name,
  when: Expr,
  // biome-ignore lint/suspicious/noThenProperty: the contract names the event body `then`
  then: Schema.Array(Expr).check(Schema.isMinLength(1)),
  async: Schema.Boolean,
  retry: Schema.optionalKey(NonNegativeInt),
  maxDepth: Schema.optionalKey(NonNegativeInt),
  comment: Schema.optionalKey(Schema.String)
});
var TableType = Schema.Union([
  Schema.Struct({ kind: Schema.Literals(["normal", "any"]) }),
  Schema.Struct({
    kind: Schema.Literal("relation"),
    in: Names,
    out: Names,
    enforced: Schema.Boolean,
    lightweight: Schema.Boolean
  })
]);
var Table = Schema.Struct({
  name: Name,
  type: TableType,
  schemafull: Schema.Boolean,
  drop: Schema.Boolean,
  view: Schema.optionalKey(Schema.Struct({ select: Expr })),
  changefeed: Schema.optionalKey(
    Schema.Struct({
      expiry: Schema.String.check(Schema.isMinLength(1)),
      includeOriginal: Schema.Boolean
    })
  ),
  permissions: TablePermissions,
  idKey: Schema.optionalKey(KindSchema),
  comment: Schema.optionalKey(Schema.String),
  fields: Schema.Array(Field),
  indexes: Schema.Array(Index),
  events: Schema.Array(Event),
  define: Schema.optionalKey(Schema.String)
});
var FunctionArg = Schema.Struct({
  name: Name,
  kind: KindSchema,
  optional: Schema.Boolean,
  omittable: Schema.Boolean
});
var SurrealFunction = Schema.Struct({
  name: Schema.String.check(Schema.isPattern(/^fn::/)),
  args: Schema.Array(FunctionArg),
  returns: Schema.optionalKey(KindSchema),
  block: Expr,
  permissions: Permission,
  comment: Schema.optionalKey(Schema.String)
});
var Durations = Schema.Struct({
  grant: Schema.optionalKey(Schema.String),
  token: Schema.optionalKey(Schema.String),
  session: Schema.optionalKey(Schema.String)
});
var Middleware = Schema.Array(
  Schema.Struct({ name: Name, args: Schema.Array(Schema.String) })
);
var Sha256Hex = Schema.String.check(Schema.isPattern(/^[0-9a-f]{64}$/));
var Provenance = Schema.Struct({
  generator: Schema.Struct({
    name: Schema.Literal("surrealkit"),
    version: Schema.String.check(Schema.isMinLength(1)),
    commit: Schema.optionalKey(
      Schema.String.check(Schema.isPattern(/^[0-9a-f]{7,40}$/))
    )
  }),
  engine: Schema.Struct({
    version: Schema.String.check(
      Schema.isPattern(/^[0-9]+\.[0-9]+\.[0-9]+$/)
    ),
    build: Schema.optionalKey(Schema.String.check(Schema.isMinLength(1))),
    mode: Schema.Literals(["embedded", "remote"])
  }),
  adapter: Schema.Literals([
    "structure-3.2",
    "structure-3.3",
    "structure-4.0"
  ]),
  source: Schema.Union([
    Schema.Struct({
      kind: Schema.Literal("compile"),
      modules: Names,
      files: Schema.Array(
        Schema.Struct({
          path: Schema.String.check(Schema.isPattern(/^[^\\]+$/)),
          sha256: Sha256Hex
        })
      )
    }),
    Schema.Struct({
      kind: Schema.Literal("introspect"),
      namespace: Schema.String,
      database: Schema.String
    })
  ]),
  capabilities: Schema.optionalKey(
    Schema.Struct({
      experimental: Names,
      network: Schema.Boolean
    })
  )
});
var Diagnostic = Schema.Struct({
  severity: Schema.Literals(["error", "warning", "info"]),
  code: Schema.String.check(
    Schema.isPattern(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/)
  ),
  table: Schema.optionalKey(Name),
  field: Schema.optionalKey(Path),
  function: Schema.optionalKey(
    Schema.String.check(Schema.isPattern(/^fn::/))
  ),
  source: Schema.String,
  span: Schema.optionalKey(
    Schema.Struct({ start: NonNegativeInt, end: NonNegativeInt })
  ),
  reason: Schema.String.check(Schema.isMinLength(1))
});
var verify = Schema.Struct({ alg: Schema.String });
var verifyUrl = Schema.Struct({ url: Schema.String });
var SchemaDocument = Schema.Struct({
  version: Schema.Literal(2),
  semanticDigest: Schema.String.check(
    Schema.isPattern(/^sha256:[0-9a-f]{64}$/)
  ),
  provenance: Provenance,
  tables: Schema.Array(Table),
  functions: Schema.Array(SurrealFunction),
  params: Schema.Array(
    Schema.Struct({
      name: Schema.String.check(Schema.isPattern(/^[^$]/)),
      value: Schema.String,
      permissions: Permission,
      comment: Schema.optionalKey(Schema.String)
    })
  ),
  accesses: Schema.Array(
    Schema.Struct({
      name: Name,
      method: Schema.Literals(["record", "jwt", "bearer"]),
      signup: Schema.optionalKey(Expr),
      signin: Schema.optionalKey(Expr),
      authenticate: Schema.optionalKey(Expr),
      refresh: Schema.optionalKey(Schema.Boolean),
      verify: Schema.optionalKey(Schema.Union([verify, verifyUrl])),
      subject: Schema.optionalKey(Schema.Literals(["record", "user"])),
      durations: Durations,
      comment: Schema.optionalKey(Schema.String)
    })
  ),
  analyzers: Schema.Array(
    Schema.Struct({
      name: Name,
      function: Schema.optionalKey(
        Schema.String.check(Schema.isPattern(/^fn::/))
      ),
      tokenizers: Schema.Array(Schema.String),
      filters: Schema.Array(Schema.String),
      comment: Schema.optionalKey(Schema.String)
    })
  ),
  sequences: Schema.Array(
    Schema.Struct({
      name: Name,
      batch: Schema.String.check(Schema.isPattern(/^[0-9]+$/)),
      start: Schema.String.check(Schema.isPattern(/^-?[0-9]+$/)),
      timeout: Schema.optionalKey(Schema.String)
    })
  ),
  buckets: Schema.Array(
    Schema.Struct({
      name: Name,
      backend: Schema.String,
      readonly: Schema.Boolean,
      permissions: Permission,
      comment: Schema.optionalKey(Schema.String)
    })
  ),
  apis: Schema.Array(
    Schema.Struct({
      path: Schema.String.check(Schema.isPattern(/^\//)),
      actions: Schema.Array(
        Schema.Struct({
          methods: Schema.Array(
            Schema.Literals([
              "delete",
              "get",
              "patch",
              "post",
              "put",
              "trace"
            ])
          ).check(Schema.isMinLength(1)),
          middleware: Middleware,
          permissions: Permission,
          action: Expr
        })
      ),
      middleware: Middleware,
      permissions: Permission,
      comment: Schema.optionalKey(Schema.String)
    })
  ),
  modules: Schema.Array(
    Schema.Struct({
      name: Schema.String.check(Schema.isPattern(/^mod::/)),
      executable: Schema.Struct({
        type: Schema.String,
        bucket: Schema.optionalKey(Schema.String),
        key: Schema.optionalKey(Schema.String)
      }),
      permissions: Permission,
      comment: Schema.optionalKey(Schema.String)
    })
  ),
  configs: Schema.Array(
    Schema.Union([
      Schema.Struct({
        type: Schema.Literal("graphql"),
        tables: Schema.String,
        functions: Schema.String
      }),
      Schema.Struct({
        type: Schema.Literal("api"),
        middleware: Middleware,
        permissions: Permission
      })
    ])
  ),
  users: Schema.Array(
    Schema.Struct({
      name: Name,
      roles: Schema.Array(Schema.String),
      durations: Durations,
      comment: Schema.optionalKey(Schema.String)
    })
  ),
  diagnostics: Schema.Array(Diagnostic)
});
var kindText = (kind) => {
  const params = (names, word) => names.length === 0 ? word : `${word}<${names.join(" | ")}>`;
  switch (kind.kind) {
    case "record":
    case "table":
      return params(kind.tables, kind.kind);
    case "file":
      return params(kind.buckets, "file");
    case "geometry":
      return params(kind.types, "geometry");
    case "array":
    case "set":
      return kind.length === void 0 ? `${kind.kind}<${kindText(kind.item)}>` : `${kind.kind}<${kindText(kind.item)}, ${kind.length}>`;
    case "tuple":
      return `[${kind.items.map(kindText).join(", ")}]`;
    case "objectLiteral":
      return `{ ${kind.fields.map(
        (field) => `${field.name}${field.optional ? "?" : ""}: ${kindText(field.kind)}`
      ).join(", ")} }`;
    case "literal":
      return kind.type === "string" ? JSON.stringify(kind.value) : String(kind.value);
    case "option":
      return `option<${kindText(kind.item)}>`;
    case "union":
      return kind.variants.map(kindText).join(" | ");
    case "unknown":
      return kind.source;
    default:
      return kind.kind;
  }
};
var optionalKindText = (kind, optional) => optional && kind.kind !== "option" && kind.kind !== "none" ? `option<${kindText(kind)}>` : kindText(kind);
var excludesNone = (kind) => {
  switch (kind.kind) {
    case "any":
    case "none":
    case "option":
    case "unknown":
    case "regex":
    case "function":
    case "file":
    case "table":
      return false;
    case "union":
      return kind.variants.every(excludesNone);
    default:
      return true;
  }
};
var rejectsNone = (table, field) => {
  const [name, ...rest] = field.path;
  return rest.length === 0 && name !== "id" && !(table.type.kind === "relation" && (name === "in" || name === "out")) && !(table.type.kind === "relation" && table.type.lightweight) && table.view === void 0 && !table.drop && field.kind !== void 0 && !field.optional && excludesNone(field.kind) && field.default === void 0 && field.value === void 0 && field.computed === void 0;
};
var declaredNames = (document) => ({
  tables: [...new Set(document.tables.map((table) => table.name))].sort(),
  functions: [...new Set(document.functions.map((fn) => fn.name))].sort(),
  detail: {
    tables: Object.fromEntries(
      [...document.tables].sort(
        (a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0
      ).map((table) => [
        table.name,
        {
          fields: Object.fromEntries(
            table.fields.map((field) => [
              field.path.join("."),
              {
                ...field.kind !== void 0 && {
                  kind: optionalKindText(
                    field.kind,
                    field.optional
                  )
                },
                ...rejectsNone(table, field) && {
                  rejectsNone: true
                }
              }
            ])
          ),
          // A view's fields come from its SELECT, not from
          // declarations, so it accepts any name, SCHEMAFULL or not.
          acceptsUndeclared: !table.schemafull || table.view !== void 0,
          ...table.idKey !== void 0 && {
            idKey: kindText(table.idKey)
          }
        }
      ])
    ),
    functions: Object.fromEntries(
      [...document.functions].sort(
        (a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0
      ).map((fn) => [
        fn.name,
        fn.args.map(
          (arg) => optionalKindText(arg.kind, arg.optional)
        )
      ])
    )
  }
});
var DocumentError = class extends Data3.TaggedError("DocumentError") {
};
var formatter = SchemaIssue.makeFormatterDefault();
var decodeDocument = (input) => Schema.decodeUnknownEffect(SchemaDocument)(input, {
  onExcessProperty: "error",
  errors: "all"
}).pipe(
  Effect3.mapError(
    (error) => new DocumentError({
      message: `not a valid schema document v2:
${formatter(error.issue)}`
    })
  )
);

// src/mapper/project.ts
var isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
var decodeSurqlOptions = (raw) => {
  const problems = [];
  if (raw === void 0 || raw === null) return { options: {}, problems };
  if (!isRecord(raw))
    return {
      options: {},
      problems: [{ path: [], message: "options must be an object" }]
    };
  let input;
  let schema;
  let schemas;
  let holes;
  for (const [key, value] of Object.entries(raw)) {
    if (key === "input") {
      if (typeof value === "string" && value.length > 0 || Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === "string" && v.length > 0))
        input = value;
      else
        problems.push({
          path: ["input"],
          message: "input must be the directory of scope directories, or a list of them"
        });
    } else if (key === "schema") {
      if (typeof value === "string" && value.length > 0) schema = value;
      else
        problems.push({
          path: ["schema"],
          message: "schema must be the path of a schema document"
        });
    } else if (key === "schemas") {
      if (!isRecord(value)) {
        problems.push({
          path: ["schemas"],
          message: "schemas must map a directory to the path of a schema document"
        });
        continue;
      }
      schemas = {};
      for (const [directory, path] of Object.entries(value)) {
        if (typeof path === "string" && path.length > 0)
          schemas[directory] = path;
        else
          problems.push({
            path: ["schemas", directory],
            message: "a directory maps to the path of a schema document"
          });
      }
    } else if (key === "holes") {
      if (isRecord(value) && typeof value.open === "string" && typeof value.close === "string" && Object.keys(value).length === 2)
        holes = { open: value.open, close: value.close };
      else
        problems.push({
          path: ["holes"],
          message: 'holes must be { "open": <text>, "close": <text> }'
        });
    } else
      problems.push({
        path: [key],
        message: `unknown option ${JSON.stringify(key)}; the options are input, schema, schemas and holes`
      });
  }
  return {
    options: {
      ...input !== void 0 && { input },
      ...schema !== void 0 && { schema },
      ...schemas !== void 0 && { schemas },
      ...holes !== void 0 && { holes }
    },
    problems
  };
};
var messageOf = (cause) => cause instanceof Error ? cause.message : String(cause);
var readDocument = (path) => {
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch (cause) {
    return {
      problem: `cannot read ${path}: ${messageOf(cause)}`,
      text: ""
    };
  }
  let json;
  try {
    json = JSON.parse(text);
  } catch (cause) {
    return { problem: `${path}: ${messageOf(cause)}`, text };
  }
  const decoded = Effect4.runSync(Effect4.result(decodeDocument(json)));
  if (decoded._tag === "Failure")
    return { problem: `${path}: ${decoded.failure.message}`, text };
  return { declared: declaredNames(decoded.success), text };
};
var openSurqlProject = (root, raw, about = {}) => {
  const { options, problems: optionProblems } = decodeSurqlOptions(raw);
  const problems = [...optionProblems];
  const documents = /* @__PURE__ */ new Map();
  const document = (path, at) => {
    const absolute = resolve3(root, path);
    let read = documents.get(absolute);
    if (read === void 0) {
      read = readDocument(absolute);
      documents.set(absolute, read);
    }
    if ("problem" in read)
      problems.push({ path: at, message: read.problem });
    return absolute;
  };
  const fallback = options.schema === void 0 ? void 0 : document(options.schema, ["schema"]);
  const byDirectory = /* @__PURE__ */ new Map();
  for (const [directory, path] of Object.entries(options.schemas ?? {}))
    byDirectory.set(
      resolve3(root, directory),
      document(path, ["schemas", directory])
    );
  const identity = createHash("sha256").update(
    JSON.stringify([
      options,
      [...documents].map(([path, read]) => [path, read.text])
    ])
  ).digest("hex");
  const inputs = options.input === void 0 ? [] : (typeof options.input === "string" ? [options.input] : options.input).map((input) => resolve3(root, input));
  return {
    root,
    ...about.config !== void 0 && { config: about.config },
    ...about.refusal !== void 0 && { refusal: about.refusal },
    inputs,
    problems,
    documents: [...documents.keys()].sort(),
    identity,
    settingsFor: (file) => {
      const path = byDirectory.get(dirname(resolve3(file))) ?? fallback;
      const read = path === void 0 ? void 0 : documents.get(path);
      return {
        ...options.holes !== void 0 && { holes: options.holes },
        ...read !== void 0 && ("problem" in read ? { schemaProblem: read.problem } : { declared: read.declared })
      };
    }
  };
};
var stripJsonComments = (source) => {
  const text = source.startsWith("\uFEFF") ? source.slice(1) : source;
  const commentEnd = (at2) => {
    if (text[at2] !== "/") return at2;
    if (text[at2 + 1] === "/") {
      const end = text.indexOf("\n", at2 + 2);
      return end === -1 ? text.length : end;
    }
    if (text[at2 + 1] === "*") {
      const end = text.indexOf("*/", at2 + 2);
      return end === -1 ? text.length : end + 2;
    }
    return at2;
  };
  let out = "";
  let at = 0;
  while (at < text.length) {
    const char = text[at];
    if (char === '"') {
      let end = at + 1;
      while (end < text.length && text[end] !== '"')
        end += text[end] === "\\" ? 2 : 1;
      out += text.slice(at, end + 1);
      at = end + 1;
      continue;
    }
    const comment = commentEnd(at);
    if (comment !== at) {
      at = comment;
      continue;
    }
    if (char === ",") {
      let next = at + 1;
      for (; ; ) {
        const skipped = commentEnd(next);
        if (skipped !== next) next = skipped;
        else if (/\s/u.test(text[next] ?? "")) next++;
        else break;
      }
      if (text[next] === "}" || text[next] === "]") {
        at++;
        continue;
      }
    }
    out += char;
    at++;
  }
  return out;
};
var MAPPER_PACKAGE = "effect-surrealkit";
var mapperEntryIn = (tsconfig) => {
  const json = JSON.parse(
    stripJsonComments(readFileSync(tsconfig, "utf8"))
  );
  const entry = Array.isArray(json.contentMappers) ? json.contentMappers.find(
    (candidate) => isRecord(candidate) && candidate.package === MAPPER_PACKAGE
  ) : void 0;
  return {
    found: entry !== void 0,
    options: entry?.options ?? {},
    extends: json.extends !== void 0
  };
};
var configurationDrift = (tsconfig, received) => {
  if (tsconfig === "")
    return "the project has no tsconfig.json, so the run-time loaders could not read its options; give it one with an effect-surrealkit entry in contentMappers";
  let entry;
  try {
    entry = mapperEntryIn(tsconfig);
  } catch (cause) {
    return `cannot read ${tsconfig}: ${messageOf(cause)}`;
  }
  if (!entry.found)
    return `the effect-surrealkit entry of contentMappers is not written in ${tsconfig} itself${entry.extends ? " (it comes through extends)" : ""}; the run-time loaders read only that file, so move the entry there`;
  if (!isDeepStrictEqual(entry.options, received ?? {}))
    return `the options TypeScript passed differ from those written in ${tsconfig}; the run-time loaders read the file, so the two would render different modules`;
  return void 0;
};
var nearestTsconfig = (directory) => {
  for (let at = resolve3(directory); ; at = dirname(at)) {
    const candidate = join2(at, "tsconfig.json");
    try {
      if (statSync(candidate).isFile()) return candidate;
    } catch {
    }
    if (dirname(at) === at) return void 0;
  }
};
var stamp = (path) => {
  try {
    const info = statSync(path);
    return `${info.size}:${info.mtimeMs}`;
  } catch {
    return "missing";
  }
};
var opened = /* @__PURE__ */ new Map();
var surqlProjectFor = (file, tsconfig) => {
  const config = tsconfig === void 0 ? nearestTsconfig(dirname(resolve3(file))) : isAbsolute2(tsconfig) ? tsconfig : resolve3(tsconfig);
  if (config === void 0)
    return openSurqlProject(dirname(resolve3(file)), void 0, {
      refusal: `no tsconfig.json above ${file} has an effect-surrealkit entry in contentMappers`
    });
  const cached = opened.get(config);
  if (cached !== void 0 && cached.stamps === [config, ...cached.project.documents].map(stamp).join("|"))
    return cached.project;
  let entry;
  try {
    entry = mapperEntryIn(config);
  } catch (cause) {
    return openSurqlProject(dirname(config), void 0, {
      config,
      refusal: `cannot read ${config}: ${messageOf(cause)}`
    });
  }
  const project = entry.found ? openSurqlProject(dirname(config), entry.options, { config }) : openSurqlProject(dirname(config), void 0, {
    config,
    refusal: entry.extends ? `${config} has extends and no effect-surrealkit entry in contentMappers of its own; the loaders read only that file, so write the entry there` : `${config} has no effect-surrealkit entry in contentMappers`
  });
  opened.set(config, {
    stamps: [config, ...project.documents].map(stamp).join("|"),
    project
  });
  return project;
};

// src/mapper/load.ts
import { readFileSync as readFileSync2, statSync as statSync2 } from "fs";
import {
  basename,
  dirname as dirname2,
  isAbsolute as isAbsolute3,
  join as join3,
  relative as relative2,
  resolve as resolve4,
  sep as sep2
} from "path";
var surqlFileAt = (path, sql) => ({
  scope: basename(dirname2(resolve4(path))),
  name: basename(path).replace(/\.surql$/u, ""),
  sql
});
var refusal = (file, kind, message) => ({
  text: EMPTY_SURQL_MODULE,
  problems: [surqlDiagnostic(file, kind, message)]
});
var isFile = (path) => {
  try {
    return statSync2(path).isFile();
  } catch {
    return false;
  }
};
var inInput = (project, file) => project.inputs.some((root) => {
  const at = relative2(root, file);
  return at !== "" && !isAbsolute3(at) && at.split(sep2)[0] !== "..";
});
var otherEntries = (project, file) => {
  const found = [];
  for (let at = dirname2(file); ; at = dirname2(at)) {
    const config = join3(at, "tsconfig.json");
    if (config !== project.config && isFile(config)) {
      const other = surqlProjectFor(file, config);
      if (other.refusal === void 0 && inInput(other, file))
        found.push(other);
    }
    if (dirname2(at) === at) return found;
  }
};
var renderIn = (project, path, file) => {
  if (project.refusal !== void 0)
    return refusal(file, "config", project.refusal);
  const layout = surqlLayout(project.inputs, path);
  if ("problems" in layout)
    return {
      text: EMPTY_SURQL_MODULE,
      problems: layout.problems.map(
        (problem) => surqlDiagnostic(file, "layout", problem)
      )
    };
  const settings = project.settingsFor(path);
  if (settings.schemaProblem !== void 0)
    return refusal(
      file,
      "schema",
      `the schema document of this directory cannot be used: ${settings.schemaProblem}`
    );
  return renderSurqlModule(
    { scope: layout.scope, name: layout.name, sql: file.sql },
    {
      ...settings.declared !== void 0 && {
        declared: settings.declared
      },
      ...settings.holes !== void 0 && { holes: settings.holes }
    }
  );
};
var surqlModuleIn = (project, path, sql) => {
  const absolute = resolve4(path);
  const file = surqlFileAt(absolute, sql);
  const module = renderIn(project, absolute, file);
  if (module.problems.length > 0) return module;
  for (const other of otherEntries(project, absolute)) {
    const theirs = renderIn(other, absolute, file);
    if (theirs.problems.length > 0 || theirs.text !== module.text)
      return refusal(
        file,
        "config",
        `two contentMappers entries hold this file in their input and render it differently: ${project.config ?? `the options of ${project.root}`} and ${other.config}. The type check renders it with the tsconfig.json tsc was started with and the run-time loaders with the nearest one above the file, so the module run could differ from the module checked; take the file out of one entry's input, or write the same options in both`
      );
  }
  return module;
};
var SurqlModuleError = class extends Error {
  constructor(file, problems) {
    super(
      `effect-surrealkit: ${file}:
${problems.map((p) => `  ${p}`).join("\n")}`
    );
    this.file = file;
    this.problems = problems;
  }
  file;
  problems;
  name = "SurqlModuleError";
};
var loadSurqlModule = (path, options = {}) => {
  const project = surqlProjectFor(path, options.tsconfig);
  const sql = readFileSync2(path, "utf8");
  const module = surqlModuleIn(project, path, sql);
  const problems = [
    ...project.problems.map(
      (problem) => `the content mapper option ${problem.path.join(".") || "options"}: ${problem.message}`
    ),
    ...module.problems.map((problem) => problem.text)
  ];
  if (problems.length > 0) throw new SurqlModuleError(path, problems);
  return module.text;
};

export {
  surqlLayout,
  EMPTY_SURQL_MODULE,
  renderSurqlModule,
  decodeSurqlOptions,
  openSurqlProject,
  MAPPER_PACKAGE,
  mapperEntryIn,
  configurationDrift,
  surqlProjectFor,
  surqlFileAt,
  surqlModuleIn,
  SurqlModuleError,
  loadSurqlModule
};
//# sourceMappingURL=chunk-E3KG4LTH.js.map