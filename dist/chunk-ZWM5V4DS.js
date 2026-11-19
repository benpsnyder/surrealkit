import {
  DateTime,
  Decimal,
  Duration,
  Int,
  SurrealNumber,
  SurrealString,
  Uuid,
  dateTimeToString,
  int64,
  isPlainObject
} from "./chunk-PHSAVORF.js";

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
var skipComment = (sql, at2) => {
  const two = sql.slice(at2, at2 + 2);
  if (two === "/*") {
    const end = sql.indexOf("*/", at2 + 2);
    return end === -1 ? sql.length : end + 2;
  }
  if (two === "--" || two === "//" || sql[at2] === "#") {
    const end = sql.indexOf("\n", at2);
    return end === -1 ? sql.length : end + 1;
  }
  return at2;
};
var skipBlank = (sql, at2) => {
  let index = at2;
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
        let at2 = skipBlank(sql, end);
        if (sql[at2] === "$") at2 += 1;
        let close = at2;
        while (close < sql.length && wordChar.test(sql[close] ?? ""))
          close += 1;
        if (close > at2) names.push(sql.slice(at2, close));
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

// src/statement/expr.ts
import { Schema } from "effect";
import {
  FileRef,
  Future,
  Geometry,
  Range,
  RecordId,
  RecordIdRange,
  DateTime as SdkDateTime,
  Decimal as SdkDecimal,
  Duration as SdkDuration,
  Uuid as SdkUuid,
  StringRecordId,
  Table,
  toSurqlString
} from "surrealdb";
var ExprTypeId = "~effect-surrealkit/Expr";
var RowScope = class {
  constructor(kind, table) {
    this.kind = kind;
    this.table = table;
  }
  kind;
  table;
};
var Level = {
  atom: 0,
  comparison: 1,
  and: 2,
  or: 3,
  raw: 4
};
var isExpr = (value) => typeof value === "object" && value !== null && ExprTypeId in value;
var isPath = (value) => isExpr(value) && value[ExprTypeId].path !== void 0;
var codecOf = (expr) => expr[ExprTypeId].codec;
var sqlOf = (expr) => expr[ExprTypeId].sql;
var paramsOf = (expr) => expr[ExprTypeId].params;
var makeExpr = (codec, sql, params, level, context) => ({
  [ExprTypeId]: {
    codec,
    sql,
    params,
    level,
    ...context !== void 0 && { context }
  }
});
var contextOf = (expr) => expr[ExprTypeId].context;
var joinMaps = (maps) => {
  let joined;
  let only;
  for (const map of maps) {
    if (map === void 0 || map.size === 0) continue;
    if (only === void 0 && joined === void 0) {
      only = map;
      continue;
    }
    joined ??= new Map(only);
    for (const [key2, value] of map) {
      if (!joined.has(key2)) joined.set(key2, value);
    }
  }
  return joined ?? only;
};
var joinSets = (sets) => {
  const present = sets.filter(
    (set) => set !== void 0 && set.size > 0
  );
  if (present.length <= 1) return present[0];
  return new Set(present.flatMap((set) => [...set]));
};
var joinContexts = (contexts) => {
  const present = contexts.filter(
    (context) => context !== void 0
  );
  if (present.length <= 1) return present[0];
  const reads = joinMaps(present.map((context) => context.reads));
  const loose = joinMaps(present.map((context) => context.loose));
  const placed = joinMaps(present.map((context) => context.placed));
  const readers = joinSets(present.map((context) => context.readers));
  return reads === void 0 && loose === void 0 && placed === void 0 && readers === void 0 ? void 0 : {
    ...reads !== void 0 && { reads },
    ...loose !== void 0 && { loose },
    ...placed !== void 0 && { placed },
    ...readers !== void 0 && { readers }
  };
};
var derive = (codec, sql, level, operands, params) => makeExpr(
  codec,
  sql,
  params ?? mergeParams(...operands.map(paramsOf)),
  level,
  joinContexts(operands.map(contextOf))
);
var withContext = (expr, context) => {
  const { context: _, ...data } = expr[ExprTypeId];
  return {
    ...expr,
    [ExprTypeId]: { ...data, ...context !== void 0 && { context } }
  };
};
var makePath = (codec, sql, path, scope) => ({
  [ExprTypeId]: {
    codec,
    sql,
    params: {},
    level: Level.atom,
    path,
    ...scope !== void 0 && {
      context: { reads: /* @__PURE__ */ new Map([[scope, path.root]]) }
    }
  }
});
var pathOf = (expr) => expr[ExprTypeId].path;
var ownRow = (scope) => {
  switch (scope.kind) {
    case "edge":
      return `the edge (\`${scope.table}\`)`;
    case "target":
      return `the record it destructures (\`${scope.table}\`)`;
    case "reached":
      return `the record the step reaches (\`${scope.table}\`)`;
    case "node":
      return "each record the path reaches";
    default:
      return `the row of \`${scope.table}\``;
  }
};
var otherRow = (scope) => {
  switch (scope.kind) {
    case "edge":
      return `the edge \`${scope.table}\` of a step`;
    case "target":
      return `the record of \`${scope.table}\` a destructuring reads`;
    case "reached":
      return `the record of \`${scope.table}\` a step's \`whereTarget\` reads`;
    case "node":
      return "the node of a recursive path";
    case "select":
      return `the row of a select of \`${scope.table}\``;
    default:
      return `the row of a write to \`${scope.table}\``;
  }
};
var outerAdvice = (site, field, from) => {
  const via = from.kind === "select" ? ` To read the select's row from a step's \`where\` directly under it, use \`parent(row.${field})\`; anywhere else, bind` : " Bind";
  switch (site.own?.kind) {
    case "target":
      return `${via} the value with \`param\`, or project the outer field beside the destructured object.`;
    default:
      return `${via} the value with \`param\`.`;
  }
};
var admit = (site, exprs) => {
  const context = joinContexts(exprs.map(contextOf));
  if (context === void 0) return void 0;
  for (const [scope, field] of context.reads ?? []) {
    if (scope === site.own) continue;
    throw new RangeError(
      site.own === void 0 ? `\`${field}\` is a field of ${otherRow(scope)}, and ${site.what} has no row to read it from.${outerAdvice(site, field, scope)}` : `\`${field}\` is a field of ${otherRow(scope)}, but in ${site.what} a field path reads ${ownRow(site.own)}, so it would read that row's \`${field}\` instead.${outerAdvice(site, field, scope)}`
    );
  }
  const loose = context.loose ?? /* @__PURE__ */ new Map();
  const placed = context.placed ?? /* @__PURE__ */ new Map();
  if (site.parents === "place") {
    const [nested] = placed.values();
    if (nested !== void 0) {
      throw new RangeError(
        `\`parent(row.${nested})\` is in a step inside ${site.what}; \`parent\` reads the select's row only from a step directly under it`
      );
    }
  } else {
    const [field] = loose.values();
    if (field !== void 0) {
      throw new RangeError(
        site.parents === "select" ? `\`parent(row.${field})\` reads the select's row from inside a step's \`where\` (\`outgoing(store, row.id, 'edge', { where: (edge) => eq(edge.${field}, parent(row.${field})) })\`); in ${site.what}, read \`row.${field}\` itself` : `\`parent(row.${field})\` is refused in ${site.what}: ${site.refused ?? "it reads the row of a select only from a step directly under it"}`
      );
    }
    for (const [scope, field2] of placed) {
      if (site.parents === "select" && scope === site.own) continue;
      throw new RangeError(
        site.parents === "select" ? `\`parent(row.${field2})\` reads ${otherRow(scope)}, and this step is in ${site.what}; place the step directly under that select` : `\`parent(row.${field2})\` is refused in ${site.what}: ${site.refused ?? "it reads the row of a select only from a step directly under it"}`
      );
    }
  }
  const reads = new Map(context.reads);
  if (site.own !== void 0) reads.delete(site.own);
  const kept = new Map(placed);
  if (site.parents === "place") for (const entry of loose) kept.set(...entry);
  if (site.parents === "select" && site.own !== void 0) {
    kept.delete(site.own);
  }
  return reads.size === 0 && kept.size === 0 && context.readers === void 0 ? void 0 : {
    ...reads.size > 0 && { reads },
    ...kept.size > 0 && { placed: kept },
    ...context.readers !== void 0 && {
      readers: context.readers
    }
  };
};
var settle = (context, what) => {
  if (context === void 0) return void 0;
  admit({ own: void 0, what, parents: "refuse" }, [
    makeExpr(Schema.Unknown, "", {}, Level.atom, context)
  ]);
  return context.readers;
};
var assertReader = (subject, readers, what) => {
  for (const reader of readers ?? []) {
    if (reader === subject) continue;
    throw new RangeError(
      subject === "privileged" ? `${what} reads its table as a privileged reader, but a link, step or FETCH in it reads records through a restricted store view (\`readAs(store)\`); read both as one reader: the table through \`readAs(table)\` too, or the store without \`readAs\`` : `${what} reads its table through \`readAs\`, but a link, step or FETCH in it reads records through the privileged store; read those through \`readAs(store)\` too, so every record decodes with its \`visible\` row`
    );
  }
};
var parent = (field) => {
  const data = isExpr(field) ? field[ExprTypeId] : void 0;
  const [scope] = data?.context?.reads?.keys() ?? [];
  if (data?.path === void 0 || scope === void 0) {
    throw new TypeError(
      "`parent` takes a field path of a select\u2019s row, like `parent(row.name)`"
    );
  }
  if (scope.kind !== "select") {
    throw new TypeError(
      `\`parent(${data.sql})\` reads a field of ${otherRow(scope)}; \`parent\` reads only a select's row`
    );
  }
  return makeExpr(
    data.codec,
    `$parent.${data.sql}`,
    {},
    Level.atom,
    { loose: /* @__PURE__ */ new Map([[scope, data.path.root]]) }
  );
};
var operand = (expr) => {
  const { level, sql } = expr[ExprTypeId];
  return level === Level.atom ? sql : `(${sql})`;
};
var conjunct = (expr, within) => {
  const { level, sql } = expr[ExprTypeId];
  return level <= Level.comparison || level === within ? sql : `(${sql})`;
};
var mergeParams = (...sets) => {
  const merged = {};
  for (const set of sets) {
    for (const [name, codec] of Object.entries(set)) {
      const existing = merged[name];
      if (existing !== void 0 && existing !== codec) {
        throw new RangeError(
          `binding \`$${name}\` is declared with two different codecs; declare it once and reuse the expression`
        );
      }
      merged[name] = codec;
    }
  }
  return withRefs(merged, joinRefs(sets));
};
var param = (name, codec) => {
  assertBindingName(name);
  return makeExpr(
    codec,
    `$${name}`,
    { [name]: codec },
    Level.atom
  );
};
var noLiteral = (what) => new RangeError(`${what} has no SurrealQL literal; bind it with \`param\``);
var describe = (value) => {
  const name = value.constructor?.name;
  return typeof name === "string" && name.length > 0 ? `a ${name}` : "this value";
};
var stringLiteral = (value) => JSON.stringify(Schema.encodeUnknownSync(SurrealString)(value));
var assertKey = (value, seen) => {
  if (typeof value === "string") {
    stringLiteral(value);
  } else if (typeof value === "bigint") {
    int64(value);
  } else if (typeof value === "object" && value !== null) {
    if (seen.has(value)) throw noLiteral("a cyclic value");
    seen.add(value);
    if (value instanceof SdkDateTime) {
      throw new RangeError(
        "a record id or range whose key holds a datetime has no faithful literal (the SDK spells the datetime); bind it with `param`"
      );
    }
    if (value instanceof RecordId) assertKey(value.id, seen);
    else if (value instanceof Range || value instanceof RecordIdRange) {
      assertKey(value.begin?.value, seen);
      assertKey(value.end?.value, seen);
    } else if (Array.isArray(value)) {
      for (const item of value) assertKey(item, seen);
    } else if (isPlainObject(value)) {
      for (const [key2, item] of Object.entries(value)) {
        stringLiteral(key2);
        assertKey(item, seen);
      }
    }
    seen.delete(value);
  }
};
var inline = (value, seen) => {
  switch (typeof value) {
    case "string":
      return `s${stringLiteral(value)}`;
    case "number":
      if (!Number.isFinite(value)) {
        throw new RangeError(
          `${String(value)} has no portable SurrealQL literal; bind it with \`param\``
        );
      }
      return toSurqlString(value);
    case "bigint":
      return String(int64(value));
    case "boolean":
      return String(value);
    case "undefined":
      return "NONE";
    case "object":
      break;
    default:
      throw noLiteral(`a ${typeof value}`);
  }
  if (value === null) return "NULL";
  if (value instanceof Set || value instanceof Map) {
    throw new RangeError(
      "a Set or Map has no SurrealQL literal; bind it with `param`"
    );
  }
  if (seen.has(value)) throw noLiteral("a cyclic value");
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      return `[ ${value.map((item) => inline(item, seen)).join(", ")} ]`;
    }
    if (isPlainObject(value)) {
      const entries = Object.entries(value).map(
        ([key2, item]) => `${stringLiteral(key2)}: ${inline(item, seen)}`
      );
      return `{ ${entries.join(", ")} }`;
    }
    if (value instanceof SdkDateTime) {
      return `d${JSON.stringify(dateTimeToString(value))}`;
    }
    if (value instanceof RecordId || value instanceof StringRecordId || value instanceof RecordIdRange || value instanceof Range) {
      if (value instanceof StringRecordId)
        stringLiteral(value.toString());
      else assertKey(value, /* @__PURE__ */ new Set());
      return toSurqlString(value);
    }
    if (value instanceof SdkUuid || value instanceof SdkDecimal || value instanceof SdkDuration || value instanceof Table || value instanceof FileRef || value instanceof Future || value instanceof Geometry || value instanceof Date) {
      return toSurqlString(value);
    }
    throw noLiteral(describe(value));
  } finally {
    seen.delete(value);
  }
};
var primitiveCodec = (value) => {
  if (value === null) return Schema.Null;
  if (value === void 0) return Schema.Undefined;
  return Schema.Literal(value);
};
function literal(value, codec) {
  if (codec === void 0 && typeof value === "object" && value !== null) {
    throw new TypeError(
      "only a primitive can be inlined without a codec; pass the codec, or bind the value with `param`"
    );
  }
  const encoded = codec === void 0 ? value : Schema.encodeUnknownSync(codec)(value);
  const sql = inline(encoded, /* @__PURE__ */ new Set());
  return makeExpr(
    codec ?? primitiveCodec(value),
    sql,
    {},
    Level.atom
  );
}
var lift = (value) => isExpr(value) ? value : literal(value);
var unsafeExpr = (options) => {
  const params = options.params ?? {};
  for (const name of Object.keys(params)) assertBindingName(name);
  return makeExpr(
    options.codec,
    options.sql,
    params,
    options.atomic === true ? Level.atom : Level.raw
  );
};
var binary = (operator) => (left, right) => {
  const other = lift(right);
  return derive(
    Schema.Boolean,
    `${operand(left)} ${operator} ${operand(other)}`,
    Level.comparison,
    [left, other]
  );
};
var eq = binary("=");
var ne = binary("!=");
var lt = binary("<");
var lte = binary("<=");
var gt = binary(">");
var gte = binary(">=");
var logical = (operator) => (...operands) => {
  const level = operator === "AND" ? Level.and : Level.or;
  if (operator === "OR") assertNotNested(operands.map(paramsOf), "OR");
  return derive(
    Schema.Boolean,
    operands.map((item) => conjunct(item, level)).join(` ${operator} `),
    operands.length === 1 ? operands[0][ExprTypeId].level : level,
    operands
  );
};
var and = logical("AND");
var or = logical("OR");
var not = (value) => {
  assertNotNested([paramsOf(value)], "NOT");
  return derive(Schema.Boolean, `!${operand(value)}`, Level.atom, [value]);
};
var isNone = (value) => derive(Schema.Boolean, `${operand(value)} = NONE`, Level.comparison, [
  value
]);
var isNotNone = (value) => derive(Schema.Boolean, `${operand(value)} != NONE`, Level.comparison, [
  value
]);
var liftCollection = (value) => isExpr(value) ? value : makeExpr(
  Schema.Array(Schema.Unknown),
  `[ ${value.map((item) => sqlOf(literal(item))).join(", ")} ]`,
  {},
  Level.atom
);
var inside = (needle, haystack) => {
  const collection = liftCollection(haystack);
  return derive(
    Schema.Boolean,
    `${operand(needle)} INSIDE ${operand(collection)}`,
    Level.comparison,
    [needle, collection]
  );
};
var contains = (haystack, needle) => {
  const value = lift(needle);
  return derive(
    Schema.Boolean,
    `${operand(haystack)} CONTAINS ${operand(value)}`,
    Level.comparison,
    [haystack, value]
  );
};
var orNone = (codec) => Schema.is(codec)(void 0) ? codec : Schema.UndefinedOr(codec);
function at(array, index) {
  if (!Number.isInteger(index) || index < 0) {
    throw new RangeError(
      `${index} is not an array index: use a non-negative integer`
    );
  }
  const codec = codecOf(array);
  if (!("value" in codec) || !Schema.isSchema(codec.value)) {
    throw new TypeError(
      `\`${sqlOf(array)}\` is not an array expression, so it has no elements to index`
    );
  }
  const element = orNone(codec.value);
  const sql = `${operand(array)}[${index}]`;
  const path = pathOf(array);
  return path === void 0 ? derive(element, sql, Level.atom, [array]) : withContext(makePath(element, sql, path), contextOf(array));
}
var casts = {
  bool: Schema.Boolean,
  datetime: DateTime,
  decimal: Decimal,
  duration: Duration,
  float: Schema.Number,
  int: Int,
  number: SurrealNumber,
  string: SurrealString,
  uuid: Uuid
};
var cast = (kind, value) => derive(casts[kind], `<${kind}>${operand(value)}`, Level.atom, [value]);
var call = (fn, ...args) => {
  const values = args.map(lift);
  const target = fn;
  return derive(
    target.returns,
    `${target.name}(${values.map(sqlOf).join(", ")})`,
    Level.atom,
    values
  );
};

export {
  withRefs,
  assertResolved,
  withoutRefs,
  StatementTypeId,
  isStatement,
  assertIdentifier,
  assertBindingName,
  scanTopLevel,
  make,
  ExprTypeId,
  RowScope,
  Level,
  isExpr,
  isPath,
  codecOf,
  sqlOf,
  paramsOf,
  makeExpr,
  contextOf,
  joinContexts,
  derive,
  makePath,
  pathOf,
  admit,
  settle,
  assertReader,
  parent,
  operand,
  conjunct,
  mergeParams,
  param,
  literal,
  unsafeExpr,
  eq,
  ne,
  lt,
  lte,
  gt,
  gte,
  and,
  or,
  not,
  isNone,
  isNotNone,
  inside,
  contains,
  orNone,
  at,
  cast,
  call
};
//# sourceMappingURL=chunk-ZWM5V4DS.js.map