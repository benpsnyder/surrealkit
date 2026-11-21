// src/statement/refs.ts
var key = /* @__PURE__ */ Symbol.for("effect-surrealkit/SearchRefs");
var empty = {
  matches: /* @__PURE__ */ new Map(),
  reads: /* @__PURE__ */ new Set(),
  knn: /* @__PURE__ */ new Set(),
  distance: false
};
var refsOf = (params) => params[key];
var define = (params, refs) => {
  Object.defineProperty(params, key, {
    value: refs,
    enumerable: false,
    configurable: true
  });
};
var withRefs = (params, refs) => {
  if (refs === void 0) return params;
  const extra = {};
  define(extra, { ...empty, ...refs });
  const joined = joinRefs([params, extra]);
  if (joined !== void 0) define(params, joined);
  return params;
};
var joinRefs = (sets) => {
  let joined;
  for (const set of sets) {
    const refs = refsOf(set);
    if (refs === void 0) continue;
    if (joined === void 0) {
      joined = refs;
      continue;
    }
    const matches = new Map(joined.matches);
    for (const [ref, field] of refs.matches) {
      const existing = matches.get(ref);
      if (existing !== void 0 && existing !== field) {
        throw new RangeError(
          `match reference ${ref} is defined on both \`${existing}\` and \`${field}\`; give each match its own reference number`
        );
      }
      matches.set(ref, field);
    }
    const knn = /* @__PURE__ */ new Set([...joined.knn, ...refs.knn]);
    if (knn.size > 1) {
      throw new RangeError(
        `a SELECT takes one nearest-neighbour search, and this one has ${knn.size}: ${[...knn].map((text) => `\`${text}\``).join(", ")} (SurrealDB 4 refuses a second <|k, \u2026|> in a WHERE clause)`
      );
    }
    joined = {
      matches,
      reads: /* @__PURE__ */ new Set([...joined.reads, ...refs.reads]),
      knn,
      distance: joined.distance || refs.distance
    };
  }
  return joined;
};
var assertNotNested = (sets, operator) => {
  for (const set of sets) {
    const text = [...refsOf(set)?.knn ?? []][0];
    if (text !== void 0) {
      throw new RangeError(
        `the nearest-neighbour search \`${text}\` is under ${operator}; SurrealDB takes one only at the top level of WHERE, joined with AND`
      );
    }
  }
};
var assertResolved = (params, what) => {
  const refs = refsOf(params);
  if (refs === void 0) return;
  for (const ref of [...refs.reads].sort((a, b) => a - b)) {
    if (!refs.matches.has(ref)) {
      throw new RangeError(
        `${what} reads the score of match reference ${ref}, which no match in it defines${refs.matches.size === 0 ? "" : ` (it defines ${[...refs.matches.keys()].join(", ")})`}`
      );
    }
  }
  if (refs.distance && refs.knn.size === 0) {
    throw new RangeError(
      `${what} reads the nearest-neighbour distance (\`vector::distance::knn()\`) but makes no nearest-neighbour search`
    );
  }
};
var withoutRefs = (params) => refsOf(params) === void 0 ? params : { ...params };

// src/statement/statement.ts
var StatementTypeId = "~effect-surrealkit/Statement";
var isStatement = (value) => typeof value === "object" && value !== null && StatementTypeId in value;
var identifier = /^[A-Za-z_][A-Za-z0-9_]*$/u;
var sessionNames = /* @__PURE__ */ new Set([
  "auth",
  "access",
  "session",
  "token"
]);
var scopedNames = /* @__PURE__ */ new Set([
  "this",
  "self",
  "parent",
  "value",
  "input",
  "before",
  "after",
  "event"
]);
var assertIdentifier = (name) => {
  if (!identifier.test(name)) {
    throw new RangeError(
      `\`$${name}\` is not a parameter name: use letters, digits and underscores, not starting with a digit`
    );
  }
  if (sessionNames.has(name)) {
    throw new RangeError(
      `\`$${name}\` is set by SurrealDB and cannot be bound or defined by a statement`
    );
  }
};
var assertBindingName = (name) => {
  assertIdentifier(name);
  if (scopedNames.has(name)) {
    throw new RangeError(
      `\`$${name}\` is set by SurrealDB inside clauses, subqueries and field definitions, so a binding of that name can be shadowed; rename the binding`
    );
  }
};
var terminated = (sql) => {
  let text = sql.trimEnd();
  while (text.endsWith(";")) text = text.slice(0, -1).trimEnd();
  return text.length === 0 ? "" : `${text};`;
};
var assertStatement = (statement) => {
  if (statement.sql.trim().length === 0) {
    throw new RangeError(`statement \`${statement.name}\` has no text`);
  }
  if (!Number.isInteger(statement.slots) || statement.slots < 1) {
    throw new RangeError(
      `statement \`${statement.name}\` returns ${statement.slots} results; a statement returns at least one`
    );
  }
  if (!Number.isInteger(statement.valueSlot) || statement.valueSlot < 1 || statement.valueSlot > statement.slots) {
    throw new RangeError(
      `statement \`${statement.name}\` decodes result ${statement.valueSlot}, outside its ${statement.slots} results`
    );
  }
  for (const name of Object.keys(statement.params)) assertBindingName(name);
  for (const name of statement.defines) assertIdentifier(name);
};
var wordChar = /[A-Za-z0-9_]/u;
var skipComment = (sql, at) => {
  const two = sql.slice(at, at + 2);
  if (two === "/*") {
    const end = sql.indexOf("*/", at + 2);
    return end === -1 ? sql.length : end + 2;
  }
  if (two === "--" || two === "//" || sql[at] === "#") {
    const end = sql.indexOf("\n", at);
    return end === -1 ? sql.length : end + 1;
  }
  return at;
};
var skipBlank = (sql, at) => {
  let index = at;
  for (; ; ) {
    while (index < sql.length && /\s/u.test(sql[index] ?? "")) index += 1;
    const next = skipComment(sql, index);
    if (next === index) return index;
    index = next;
  }
};
var closers = {
  "'": "'",
  '"': '"',
  "`": "`",
  "\u27E8": "\u27E9"
};
var scanTopLevel = (sql) => {
  const names = [];
  const keywords = [];
  let depth = 0;
  let atStart = true;
  let index = 0;
  while (index < sql.length) {
    const blank = skipBlank(sql, index);
    if (blank !== index) {
      index = blank;
      continue;
    }
    const char = sql[index] ?? "";
    const closer = closers[char];
    if (closer !== void 0) {
      index += 1;
      while (index < sql.length && sql[index] !== closer) {
        index += sql[index] === "\\" ? 2 : 1;
      }
      index += 1;
      atStart = false;
    } else if ("([{".includes(char)) {
      depth += 1;
      index += 1;
      atStart = false;
    } else if (")]}".includes(char)) {
      depth = Math.max(0, depth - 1);
      index += 1;
    } else if (char === ";") {
      if (depth === 0) atStart = true;
      index += 1;
    } else if (wordChar.test(char)) {
      let end = index;
      while (end < sql.length && wordChar.test(sql[end] ?? "")) end += 1;
      const word = sql.slice(index, end).toUpperCase();
      if (depth === 0 && atStart) keywords.push(word);
      if (depth === 0 && atStart && word === "LET") {
        let at = skipBlank(sql, end);
        if (sql[at] === "$") at += 1;
        let close = at;
        while (close < sql.length && wordChar.test(sql[close] ?? ""))
          close += 1;
        if (close > at) names.push(sql.slice(at, close));
      }
      index = end;
      atStart = false;
    } else {
      index += 1;
      atStart = false;
    }
  }
  return { keywords, lets: names };
};
var make = (options) => {
  const statement = {
    [StatementTypeId]: StatementTypeId,
    name: options.name ?? "statement",
    sql: terminated(options.sql),
    // A built statement's search references are resolved and its own, so a
    // block or a transaction that takes it in never joins them.
    params: withoutRefs(options.params),
    result: options.result,
    slots: options.slots ?? 1,
    valueSlot: options.valueSlot ?? options.slots ?? 1,
    throws: options.throws ?? [],
    defines: options.defines ?? [],
    transactional: options.transactional ?? false,
    ...options.writes !== void 0 && { writes: options.writes },
    nonEmpty: options.nonEmpty ?? false,
    ...options.sources !== void 0 && options.sources.length > 0 && { sources: options.sources },
    ...options.throwSites !== void 0 && {
      throwSites: options.throwSites
    },
    ...options.tables !== void 0 && { tables: options.tables },
    ...options.functions !== void 0 && {
      functions: options.functions
    },
    ...options.openTargets !== void 0 && {
      openTargets: options.openTargets
    },
    ...options.uses !== void 0 && { uses: options.uses }
  };
  assertStatement(statement);
  assertResolved(options.params, `statement \`${statement.name}\``);
  if (options.defines === void 0) {
    const { lets } = scanTopLevel(statement.sql);
    if (lets.length > 0) {
      throw new RangeError(
        `statement \`${statement.name}\` LETs ${[...new Set(lets)].map((name) => `\`$${name}\``).join(
          ", "
        )} at the top level but declares no \`defines\`, so a transaction could not refuse a binding it shadows; declare \`defines\`, or build it with \`part\` and \`sequence\``
      );
    }
  }
  return statement;
};

export {
  withRefs,
  joinRefs,
  assertNotNested,
  assertResolved,
  withoutRefs,
  StatementTypeId,
  isStatement,
  assertIdentifier,
  assertBindingName,
  scanTopLevel,
  make
};
//# sourceMappingURL=chunk-QRSY4HQJ.js.map