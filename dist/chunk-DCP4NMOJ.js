// src/analyze/lexer.ts
import { Data } from "effect";
var AnalyzeError = class extends Data.TaggedError("AnalyzeError") {
};
var DEFAULT_HOLE_DELIMITERS = {
  open: "__",
  close: "__"
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
var isWordChar = (c) => c !== void 0 && /[A-Za-z0-9_]/u.test(c);
var isNameStart = (c) => c !== void 0 && /[A-Za-z_]/u.test(c);
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
var lex = (sql, holes) => {
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
  const operandBefore = () => {
    const last = tokens[tokens.length - 1];
    if (last === void 0) return false;
    switch (last.kind) {
      case "param":
      case "string":
      case "ident":
      case "regex":
      case "hole":
        return true;
      case "word":
        return !EXPRESSION_WORDS.has(last.value.toUpperCase());
      case "punct":
        return CLOSE.has(last.value);
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
      i = end === -1 ? sql.length : end + 1;
      continue;
    }
    if (c === "/" && next === "*") {
      const end = sql.indexOf("*/", i + 2);
      if (end === -1) fail("unterminated", "unterminated comment", i);
      i = end + 2;
      continue;
    }
    const holeAt = holeEnd(sql, i, holes);
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
      if (operandBefore()) {
        push("punct", i, i + 1, c);
        i++;
        continue;
      }
      let end = i + 1;
      while (end < sql.length && sql[end] !== "/") {
        if (sql[end] === "\n") break;
        end += sql[end] === "\\" ? 2 : 1;
      }
      if (sql[end] !== "/") {
        fail("unterminated", "unterminated regex literal", i);
      }
      push("regex", i, end + 1, sql.slice(i + 1, end));
      i = end + 1;
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

// src/analyze/analyze.ts
import { Effect } from "effect";

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
var upper = (token) => token?.kind === "word" ? token.value.toUpperCase() : "";
var isPunct = (token, char) => token?.kind === "punct" && token.value === char;
var isOpen = (token) => isPunct(token, "(") || isPunct(token, "[") || isPunct(token, "{");
var isClose = (token) => isPunct(token, ")") || isPunct(token, "]") || isPunct(token, "}");
var isName = (token) => token?.kind === "word" && /^[A-Za-z_]/u.test(token.value) || token?.kind === "ident";
var isPlainString = (token) => token?.kind === "string" && (token.prefix === void 0 || token.prefix === "s");
var adjacent = (a, b) => a !== void 0 && b !== void 0 && a.end === b.start;
var analyzeTargets = (tokens) => {
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
      if (isOpen(tokens[j])) depth++;
      else if (isClose(tokens[j])) {
        depth--;
        if (depth === 0) return j + 1;
      }
    }
    return tokens.length;
  };
  const pathAt = (at) => isPunct(tokens[at], ":") && isPunct(tokens[at + 1], ":") && adjacent(tokens[at], tokens[at + 1]);
  const member = (at) => isPunct(tokens[at - 1], ".") || isPunct(tokens[at - 1], ":");
  const statementPosition = (at) => {
    const previous = tokens[at - 1];
    if (previous === void 0) return true;
    if (isPunct(previous, ";") || isPunct(previous, "{") || isPunct(previous, "("))
      return true;
    if (VALUE_WORDS.has(upper(previous))) return true;
    return isPunct(previous, "=") && tokens[at - 2]?.kind === "param" && upper(tokens[at - 3]) === "LET";
  };
  const statementEnd = (at) => {
    for (let j = at; j < tokens.length; j++) {
      const token = tokens[j];
      if (isPunct(token, ";") || isClose(token)) return j;
      if (isOpen(token)) j = pastGroup(j) - 1;
    }
    return tokens.length;
  };
  const typeCall = (at, fn) => tokens[at]?.kind === "word" && tokens[at]?.value.toLowerCase() === "type" && pathAt(at + 1) && tokens[at + 3]?.kind === "word" && tokens[at + 3]?.value.toLowerCase() === fn && isPunct(tokens[at + 4], "(") ? at + 4 : -1;
  const typeTarget = (at, fns) => {
    for (const fn of fns) {
      const paren = typeCall(at, fn);
      if (paren === -1) continue;
      const literal = tokens[paren + 1];
      const after = tokens[paren + 2];
      const next = pastGroup(paren);
      const certain = isPlainString(literal) && (fn === "table" ? isPunct(after, ")") : isPunct(after, ","));
      return certain ? { kind: "table", name: literal.value, next } : { kind: "open" };
    }
    return void 0;
  };
  const target = (at, subqueries) => {
    const token = tokens[at];
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
    if (isPunct(token, "(")) {
      return subqueries && SUBQUERY.has(upper(tokens[at + 1])) ? { kind: "subquery", next: pastGroup(at) } : { kind: "open" };
    }
    if (!isName(token)) return { kind: "open" };
    if (token.kind === "word" && CLAUSES.has(upper(token)))
      return { kind: "open" };
    const colon = tokens[at + 1];
    if (isPunct(colon, ":") && !isPunct(tokens[at + 2], ":")) {
      const key = at + 2;
      const keyToken = tokens[key];
      if (keyToken === void 0) return { kind: "open" };
      const next = isOpen(keyToken) ? pastGroup(key) : key + 1;
      if (!isOpen(keyToken) && keyToken.kind === "punct")
        return { kind: "open" };
      return { kind: "table", name: token.value, next };
    }
    return { kind: "table", name: token.value, next: at + 1 };
  };
  const ends = (at, extra = []) => {
    const token = tokens[at];
    return token === void 0 || isPunct(token, ";") || isClose(token) || CLAUSES.has(upper(token)) || extra.includes(upper(token));
  };
  const targetList = (at, into, subqueries) => {
    let j = at;
    if (upper(tokens[j]) === "ONLY") j++;
    const found = [];
    for (; ; ) {
      const item = target(j, subqueries);
      if (item.kind === "open") {
        open = true;
        return;
      }
      if (item.kind === "table") {
        found.push({ name: item.name, token: tokens[j] });
        for (let k = j; k < item.next; k++) consumed.add(k);
      }
      j = item.next;
      if (isPunct(tokens[j], ",")) {
        j++;
        continue;
      }
      if (!ends(j)) {
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
      if (isOpen(tokens[j])) {
        j = pastGroup(j) - 1;
        continue;
      }
      if (upper(tokens[j]) === "FROM" && !member(j)) froms.push(j);
    }
    if (froms.length !== 1) {
      open = true;
      return;
    }
    targetList(froms[0] + 1, readAt, true);
  };
  const write = (at, word) => {
    let j = at + 1;
    if (word === "INSERT") {
      while (upper(tokens[j]) === "IGNORE" || upper(tokens[j]) === "RELATION")
        j++;
      if (upper(tokens[j]) !== "INTO") {
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
      if (isName(token) && !isPunct(tokens[j + 1], ".") && !isPunct(tokens[j + 1], ":")) {
        consumed.add(j);
        add(writtenAt, token.value, token);
      } else open = true;
      return;
    }
    if (word === "RELATE") {
      if (upper(tokens[j]) === "ONLY") j++;
      const end = statementEnd(j);
      let arrow = -1;
      for (let k = j; k < end; k++) {
        if (isOpen(tokens[k])) {
          k = pastGroup(k) - 1;
          continue;
        }
        if (isPunct(tokens[k], "-") && isPunct(tokens[k + 1], ">") && adjacent(tokens[k], tokens[k + 1])) {
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
      if (edge.kind === "table" && isPunct(tokens[after], "-") && isPunct(tokens[after + 1], ">") && adjacent(tokens[after], tokens[after + 1])) {
        for (let k = arrow + 2; k < after + 2; k++) consumed.add(k);
        add(writtenAt, edge.name, tokens[arrow + 2]);
      } else open = true;
      return;
    }
    if (word === "DELETE" && upper(tokens[j]) === "FROM") j++;
    targetList(j, writtenAt, false);
  };
  const definition = (at) => {
    const kind = upper(tokens[at + 1]);
    let j = at + 2;
    if (upper(tokens[j]) === "OVERWRITE") j++;
    if (upper(tokens[j]) === "IF" && upper(tokens[j + 1]) === "NOT" && upper(tokens[j + 2]) === "EXISTS")
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
    if (isPunct(a, "-") && isPunct(b, ">") && adjacent(a, b)) return at + 2;
    if (isPunct(a, "<") && isPunct(b, "-") && adjacent(a, b)) {
      return isPunct(c, ">") && adjacent(b, c) ? at + 3 : at + 2;
    }
    return -1;
  };
  const graphStep = (at) => {
    const token = tokens[at];
    if (isName(token)) {
      add(readAt, token.value, token);
      return;
    }
    if (!isPunct(token, "(")) {
      open = true;
      return;
    }
    if (SUBQUERY.has(upper(tokens[at + 1]))) return;
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
      if (isPunct(tokens[j], ",")) {
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
      if (IGNORED.has(word) && statementPosition(i) && !isPunct(tokens[i + 1], ":")) {
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
      if (member(i) || isPunct(tokens[i + 1], ":")) {
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
      if (WRITES.has(word)) {
        if (statementPosition(i) || isPunct(tokens[i - 1], "[")) {
          write(i, word);
        } else if (!(tokens[i + 1]?.kind === "punct" || upper(tokens[i + 1]) === "FROM" || upper(tokens[i + 1]) === "AS")) {
          open = true;
        }
      }
      continue;
    }
    if (token.kind === "punct") {
      const past = arrowEnd(i);
      if (past !== -1 && !isPunct(tokens[i - 1], "|")) {
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
var isPunct2 = (token, char) => token?.kind === "punct" && token.value === char;
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
  const checkName = (name, token) => {
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
    if (!isPunct2(token, ";")) {
      starting = current === root ? statementFirst === void 0 : current.statementStart;
      if (starting) startStatement(token, current);
      current.statementStart = false;
    }
    switch (token.kind) {
      case "hole":
        holes.add(token.value);
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
        if (!free.has(name)) {
          free.add(name);
          checkName(name, token);
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
        const member = isPunct2(previous, ".") || isPunct2(previous, ":") || isPunct2(next, ":");
        if (member) break;
        if (WRITE_WORDS.has(word) && (starting || isPunct2(previous, "(") || previous?.kind === "word" && VALUE_WORDS2.has(previous.value.toUpperCase()) || isPunct2(previous, "=") && tokens[i - 2]?.kind === "param" && isWord(tokens[i - 3], "LET"))) {
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
            if (current === root) checkName(next.value, next);
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
          if (next?.kind === "string" && (next.prefix === void 0 || next.prefix === "s") && (after === void 0 || isPunct2(after, ";") || isPunct2(after, "}") || isPunct2(after, ")"))) {
            const lines = throwsAt.get(next.value) ?? /* @__PURE__ */ new Set();
            lines.add(token.line);
            throwsAt.set(next.value, lines);
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
            if (isPunct2(tokens[j], ":")) {
              let angle = 0;
              j++;
              while (j < tokens.length) {
                const t = tokens[j];
                if (isPunct2(t, "<")) angle++;
                else if (isPunct2(t, ">")) angle--;
                else if (angle === 0 && (isPunct2(t, ",") || isPunct2(t, "|")))
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
            if (isPunct2(tokens[j], ",")) {
              j++;
              continue;
            }
            if (isPunct2(tokens[j], "|")) break;
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
          if (isPunct2(after, "{") || isPunct2(after, "-")) {
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
    if (statementFirst.kind === "word" && STATEMENT_WORDS.has(statementFirst.value.toUpperCase()) && !isPunct2(tokens[1], ":")) {
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
  return {
    kind,
    sql: sql.slice(0, last.end),
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
    diagnostics
  };
};
var analyzeSync = (sql, options = {}) => analyzeLexed(sql, lex(sql, holeDelimiters(options.holes)));
var analyze = (sql, options = {}) => Effect.suspend(() => {
  try {
    return Effect.succeed(analyzeSync(sql, options));
  } catch (error) {
    if (error instanceof AnalyzeError) return Effect.fail(error);
    throw error;
  }
});

export {
  AnalyzeError,
  DEFAULT_HOLE_DELIMITERS,
  holeDelimiters,
  lex,
  analyzeTargets,
  analyzeSync,
  analyze
};
//# sourceMappingURL=chunk-DCP4NMOJ.js.map