import {
  AnalyzeError,
  lex
} from "./chunk-FBUMKT7I.js";

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

// src/analyze/analyze.ts
import { Effect } from "effect";

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
          if (next?.kind === "string" && (next.prefix === void 0 || next.prefix === "s") && (after === void 0 || isPunct7(after, ";") || isPunct7(after, "}") || isPunct7(after, ")"))) {
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
      ([, list]) => own.some(
        (site) => site.statement && // A LET can stand there: in a block, or at the top of a part.
        (site.frame.open === "{" || kind === "part") && list.every(
          (read) => read.index > site.index && read.frames.includes(site.frame)
        )
      )
    ).map(([free]) => free);
    out[name] = { bound: sorted(bound), binds: sorted(binds) };
  }
  return out;
};
var dedent = (lines) => {
  const indents = lines.filter((line) => line.trim() !== "").map((line) => line.length - line.trimStart().length);
  const indent = indents.length === 0 ? 0 : Math.min(...indents);
  return lines.map((line) => line.slice(indent));
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
      const lines2 = body.split("\n").map((line2) => line2.replace(/^\s*\*(?!\/) ?/u, ""));
      prose.push(...dedent(lines2));
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
  const lines = prose.map((line) => line.trimEnd());
  const from = lines.findIndex((line) => line !== "");
  if (from === -1) return "";
  let to = lines.length;
  while (lines[to - 1] === "") to--;
  return lines.slice(from, to).filter((line, n, all) => line !== "" || all[n - 1] !== "").join("\n");
};
var analyzeSync = (sql, options = {}) => analyzeLexed(sql, lex2(sql, holeDelimiters(options.holes)));
var analyze = (sql, options = {}) => Effect.suspend(() => {
  try {
    return Effect.succeed(analyzeSync(sql, options));
  } catch (error) {
    if (error instanceof AnalyzeError) return Effect.fail(error);
    throw error;
  }
});

export {
  DEFAULT_HOLE_DELIMITERS,
  holeDelimiters,
  lex2 as lex,
  analyzeTargets,
  analyzeSync,
  analyze
};
//# sourceMappingURL=chunk-5WCP2KPG.js.map