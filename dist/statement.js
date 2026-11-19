import {
  DateTime,
  Decimal,
  Duration,
  Int,
  NoneAsAbsent,
  SurrealNumber,
  SurrealString,
  Uuid,
  dateTimeToString,
  int64,
  isPlainObject,
  runtimeCode,
  stripNone,
  wrap
} from "./chunk-AHJIPVVB.js";
import {
  analyzeSync
} from "./chunk-XG4BS7R5.js";

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
var scanTopLevelLets = (sql) => {
  const names2 = [];
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
      if (depth === 0 && atStart && sql.slice(index, end).toUpperCase() === "LET") {
        let at2 = skipBlank(sql, end);
        if (sql[at2] === "$") at2 += 1;
        let close = at2;
        while (close < sql.length && wordChar.test(sql[close] ?? ""))
          close += 1;
        if (close > at2) names2.push(sql.slice(at2, close));
      }
      index = end;
      atStart = false;
    } else {
      index += 1;
      atStart = false;
    }
  }
  return names2;
};
var make = (options) => {
  const statement = {
    [StatementTypeId]: StatementTypeId,
    name: options.name ?? "statement",
    sql: terminated(options.sql),
    params: options.params,
    result: options.result,
    slots: options.slots ?? 1,
    throws: options.throws ?? [],
    defines: options.defines ?? [],
    transactional: options.transactional ?? false,
    ...options.writes !== void 0 && { writes: options.writes },
    nonEmpty: options.nonEmpty ?? false,
    ...options.sources !== void 0 && options.sources.length > 0 && { sources: options.sources },
    ...options.throwSites !== void 0 && {
      throwSites: options.throwSites
    }
  };
  assertStatement(statement);
  if (options.defines === void 0) {
    const lets = scanTopLevelLets(statement.sql);
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
var ExprTypeId = "~effect-surrealkit/Expr";
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
var makeExpr = (codec, sql, params, level) => ({ [ExprTypeId]: { codec, sql, params, level } });
var makePath = (codec, sql, path) => ({
  [ExprTypeId]: { codec, sql, params: {}, level: Level.atom, path }
});
var pathOf = (expr) => expr[ExprTypeId].path;
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
  return merged;
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
      for (const [key, item] of Object.entries(value)) {
        stringLiteral(key);
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
        ([key, item]) => `${stringLiteral(key)}: ${inline(item, seen)}`
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
  return makeExpr(
    Schema.Boolean,
    `${operand(left)} ${operator} ${operand(other)}`,
    mergeParams(paramsOf(left), paramsOf(other)),
    Level.comparison
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
  return makeExpr(
    Schema.Boolean,
    operands.map((item) => conjunct(item, level)).join(` ${operator} `),
    mergeParams(...operands.map(paramsOf)),
    operands.length === 1 ? operands[0][ExprTypeId].level : level
  );
};
var and = logical("AND");
var or = logical("OR");
var not = (value) => makeExpr(Schema.Boolean, `!${operand(value)}`, paramsOf(value), Level.atom);
var isNone = (value) => makeExpr(
  Schema.Boolean,
  `${operand(value)} = NONE`,
  paramsOf(value),
  Level.comparison
);
var isNotNone = (value) => makeExpr(
  Schema.Boolean,
  `${operand(value)} != NONE`,
  paramsOf(value),
  Level.comparison
);
var liftCollection = (value) => isExpr(value) ? value : makeExpr(
  Schema.Array(Schema.Unknown),
  `[ ${value.map((item) => sqlOf(literal(item))).join(", ")} ]`,
  {},
  Level.atom
);
var inside = (needle, haystack) => {
  const collection = liftCollection(haystack);
  return makeExpr(
    Schema.Boolean,
    `${operand(needle)} INSIDE ${operand(collection)}`,
    mergeParams(paramsOf(needle), paramsOf(collection)),
    Level.comparison
  );
};
var contains = (haystack, needle) => {
  const value = lift(needle);
  return makeExpr(
    Schema.Boolean,
    `${operand(haystack)} CONTAINS ${operand(value)}`,
    mergeParams(paramsOf(haystack), paramsOf(value)),
    Level.comparison
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
  return path === void 0 ? makeExpr(element, sql, paramsOf(array), Level.atom) : makePath(element, sql, path);
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
var cast = (kind, value) => makeExpr(
  casts[kind],
  `<${kind}>${operand(value)}`,
  paramsOf(value),
  Level.atom
);
var call = (fn, ...args) => {
  const values = args.map(lift);
  const target = fn;
  return makeExpr(
    target.returns,
    `${target.name}(${values.map(sqlOf).join(", ")})`,
    mergeParams(...values.map(paramsOf)),
    Level.atom
  );
};

// src/statement/part.ts
var checked = /* @__PURE__ */ new WeakMap();
var names = (values) => values.map((name) => `$${name}`).join(", ");
var messages = (values) => values.map((message) => `'${message}'`).join(", ");
var missingFrom = (values, other) => [...new Set(values)].filter((value) => !other.includes(value)).sort();
var isWordChar = (c) => c !== void 0 && (c >= "A" && c <= "Z" || c >= "a" && c <= "z" || c >= "0" && c <= "9" || c === "_");
var reads = (sql, name) => {
  const needle = `$${name}`;
  for (let at2 = sql.indexOf(needle); at2 !== -1; at2 = sql.indexOf(needle, at2 + 1)) {
    if (!isWordChar(sql[at2 + needle.length])) return true;
  }
  return false;
};
var verify = (item, label) => {
  const known = checked.get(item);
  if (known !== void 0) return known;
  const text = item.sql.trim();
  if (!text.endsWith(";")) {
    throw new RangeError(
      `${label} does not end with \`;\`, so the next part would run into it`
    );
  }
  if (!Number.isInteger(item.slots) || item.slots < 0) {
    throw new RangeError(`${label} returns ${item.slots} results`);
  }
  for (const name of [...item.free, ...item.defines]) {
    assertIdentifier(name);
    if (!reads(text, name)) {
      throw new RangeError(
        `${label} lists \`$${name}\`, which its text never mentions`
      );
    }
  }
  const analysis = analyzeSync(item.sql);
  if (analysis.holes.length > 0) {
    throw new RangeError(
      `${label} has holes (${analysis.holes.join(", ")}): a template is not a part; fill its holes and declare the filled text`
    );
  }
  const differences = [];
  const undeclaredFree = missingFrom(analysis.free, item.free);
  if (undeclaredFree.length > 0) {
    differences.push(
      `free: the text reads ${names(undeclaredFree)}, which is not declared`
    );
  }
  const unreadFree = missingFrom(item.free, analysis.free);
  if (unreadFree.length > 0) {
    differences.push(
      `free: declared ${names(unreadFree)}, which the text does not read before defining`
    );
  }
  const undeclaredDefines = missingFrom(analysis.defines, item.defines);
  if (undeclaredDefines.length > 0) {
    differences.push(
      `defines: the text LETs ${names(undeclaredDefines)} at the top level, which is not declared`
    );
  }
  const unletDefines = missingFrom(item.defines, analysis.defines);
  if (unletDefines.length > 0) {
    differences.push(
      `defines: declared ${names(unletDefines)}, which the text does not LET at the top level`
    );
  }
  if (item.slots !== analysis.slots) {
    differences.push(
      `slots: declared ${item.slots}, the text returns ${analysis.slots}`
    );
  }
  const undeclaredThrows = missingFrom(analysis.throws, item.throws);
  if (undeclaredThrows.length > 0) {
    differences.push(
      `throws: the text can THROW ${messages(undeclaredThrows)}, which is not declared`
    );
  }
  const unthrown = missingFrom(item.throws, analysis.throws);
  if (unthrown.length > 0) {
    differences.push(
      `throws: declared ${messages(unthrown)}, which the text never THROWs`
    );
  }
  if (item.writes !== void 0 && item.writes !== analysis.writes) {
    differences.push(
      analysis.writes ? "writes: declared false, the text writes" : "writes: declared true, the text does not write"
    );
  }
  if (differences.length > 0) {
    throw new RangeError(
      `${label} does not declare what its text does: ${differences.join("; ")}`
    );
  }
  checked.set(item, analysis);
  return analysis;
};
var nameOf = (name, fallback) => name === void 0 ? fallback : `part \`${name}\``;
var part = (options) => {
  const declared = {
    ...options.name !== void 0 && { name: options.name },
    ...options.source !== void 0 && { source: options.source },
    sql: options.sql,
    free: options.free ?? [],
    defines: options.defines ?? [],
    slots: options.slots ?? 1,
    throws: options.throws ?? [],
    ...options.throwsAt !== void 0 && { throwsAt: options.throwsAt },
    ...options.writes !== void 0 && { writes: options.writes }
  };
  const analysis = verify(declared, nameOf(options.name, "part"));
  const result = analysis.writes ? { ...declared, writes: true } : declared;
  checked.set(result, analysis);
  return result;
};
var throwSitesOf = (parts) => {
  const sites = {};
  for (const item of parts) {
    if (item.source === void 0 || item.throwsAt === void 0) continue;
    for (const message of item.throws) {
      const lines = item.throwsAt[message];
      if (lines === void 0 || Object.hasOwn(sites, message)) continue;
      sites[message] = { source: item.source, lines };
    }
  }
  return Object.keys(sites).length > 0 ? sites : void 0;
};
var writesOf = (parts, analyses) => (
  // `verify` has refused a declared `writes` the text contradicts.
  analyses.some((analysis) => analysis.writes) ? true : parts.every((item) => item.writes === false) ? false : void 0
);
var unboundOf = (parts) => {
  const defined = /* @__PURE__ */ new Set();
  const unbound = /* @__PURE__ */ new Set();
  for (const item of parts) {
    for (const name of item.free) {
      if (!defined.has(name)) unbound.add(name);
    }
    for (const name of item.defines) defined.add(name);
  }
  return [...unbound];
};
var sequence = (...parts) => ({
  define: (contract) => {
    const analyses = parts.map(
      (item, index) => verify(
        item,
        nameOf(item.name, `part ${index + 1} of the sequence`)
      )
    );
    const label = contract.name ?? "sequence";
    const throwSites = throwSitesOf(parts);
    const expected = unboundOf(parts);
    const declared = Object.keys(contract.params);
    const missing = expected.filter((name) => !declared.includes(name));
    const extra = declared.filter((name) => !expected.includes(name));
    if (missing.length > 0 || extra.length > 0) {
      throw new RangeError(
        [
          `the bindings of sequence \`${label}\` do not match the names it reads`,
          ...missing.length > 0 ? [`missing: ${names(missing)}`] : [],
          ...extra.length > 0 ? [`not read by any part: ${names(extra)}`] : []
        ].join("; ")
      );
    }
    const derived = writesOf(parts, analyses);
    if (contract.writes !== void 0 && derived !== void 0 && contract.writes !== derived) {
      throw new RangeError(
        contract.writes ? `sequence \`${label}\` is declared to write, but every part is declared not to` : `sequence \`${label}\` is declared not to write, but it writes`
      );
    }
    const writes = contract.writes ?? derived;
    return make({
      name: label,
      sql: parts.map((item) => item.sql.trim()).join("\n"),
      params: contract.params,
      result: contract.result,
      slots: parts.reduce((total, item) => total + item.slots, 0),
      throws: [
        ...new Set(parts.flatMap((item) => item.throws))
      ],
      defines: [...new Set(parts.flatMap((item) => item.defines))].sort(),
      transactional: analyses.some((analysis) => analysis.transactional),
      ...writes !== void 0 && { writes },
      sources: [
        ...new Set(
          parts.flatMap(
            (item) => item.source === void 0 ? [] : [item.source]
          )
        )
      ],
      ...throwSites !== void 0 && { throwSites }
    });
  }
});

// src/statement/row.ts
import { Schema as Schema2 } from "effect";
import { escapeIdent } from "surrealdb";
var isOptional = (codec) => codec.ast.context?.isOptional === true;
var unwrap = (codec) => isOptional(codec) && "schema" in codec && Schema2.isSchema(codec.schema) ? codec.schema : codec;
var fieldsOf = (codec) => {
  if ("schema" in codec && "records" in codec && Schema2.isSchema(codec.schema) && "fields" in codec.schema) {
    return codec.schema.fields;
  }
  if ("fields" in codec && isPlainObject(codec.fields)) {
    return codec.fields;
  }
  return void 0;
};
var build = (fields, prefix, optional, root) => {
  const row = {};
  for (const [key, declared] of Object.entries(fields)) {
    const mayBeNone = optional || isOptional(declared);
    const codec = unwrap(declared);
    const path = `${prefix}${escapeIdent(key)}`;
    const start2 = root ?? { root: key, rootSql: path };
    const nested = fieldsOf(codec);
    row[key] = Object.assign(
      nested === void 0 ? {} : build(nested, `${path}.`, mayBeNone, start2),
      makePath(mayBeNone ? orNone(codec) : codec, path, start2)
    );
  }
  return row;
};
var rowOf = (schema) => {
  const fields = fieldsOf(schema);
  if (fields === void 0) {
    throw new TypeError("rowOf takes a generated row schema (a struct)");
  }
  return build(fields, "", false, void 0);
};
var rowCodec = (schema) => NoneAsAbsent(schema);
var projectedCodec = (fields) => {
  const keys = Object.keys(fields);
  return wrap(Schema2.Struct(fields), {
    id: "effect-surrealkit/ProjectedRow",
    expected: "a projected SurrealDB row",
    preprocess: (input) => {
      if (!isPlainObject(input)) return input;
      const next = {};
      for (const [key, value] of Object.entries(input)) {
        next[key] = stripNone(value);
      }
      for (const key of keys) {
        if (!(key in next)) next[key] = void 0;
      }
      return next;
    },
    code: ([inner]) => runtimeCode(
      `NoneAsAbsent(${inner?.runtime ?? ""})`,
      inner?.Type ?? "unknown"
    )
  });
};

// src/statement/select.ts
import { Schema as Schema3 } from "effect";

// src/statement/table.ts
import { escapeIdent as escapeIdent2 } from "surrealdb";
var readAs = (table, select2) => {
  if (table.schemafull) {
    const stored = fieldsOf(table.select);
    const view = fieldsOf(select2);
    if (!stored || !view)
      throw new TypeError(
        "readAs requires row schemas with declared fields"
      );
    for (const key of Object.keys(view)) {
      if (!Object.hasOwn(stored, key))
        throw new TypeError(
          `readAs: ${table.name} has no declared field ${key}`
        );
    }
  }
  return { ...table, select: select2 };
};
var tableName = (table) => /[⟩\\]/u.test(table.name) ? `\`${table.name.replace(/[\\`]/gu, (char) => `\\${char}`)}\`` : `\u27E8${table.name}\u27E9`;
var storedRow = (table) => rowCodec(table.select);
var rowExprs = (table) => rowOf(table.select);
var project = (fields) => {
  const entries = Object.entries(fields);
  if (entries.length === 0) {
    throw new RangeError("a projection needs at least one field");
  }
  const codecs = {};
  for (const [alias, value] of entries) {
    codecs[alias] = codecOf(value);
  }
  return {
    sql: entries.map(([alias, value]) => `${sqlOf(value)} AS ${escapeIdent2(alias)}`).join(", "),
    codec: projectedCodec(
      codecs
    ),
    params: mergeParams(
      ...entries.map(([, value]) => paramsOf(value))
    ),
    aliases: new Map(
      entries.map(([alias, value]) => [alias, sqlOf(value)])
    )
  };
};
var andAll = (conditions) => conditions.map((condition) => conjunct(condition, Level.and)).join(" AND ");
var subquery = (codec, sql, params) => makeExpr(codec, `(${sql})`, params, Level.atom);

// src/statement/select.ts
var assertOrder = (state) => {
  for (const { path, sql } of state.order) {
    const source = state.aliases.get(path.root);
    if (source !== void 0 && source !== path.rootSql) {
      throw new RangeError(
        `the projection alias \`${path.root}\` stands for \`${source}\` and shadows the stored field \`${path.root}\` that ORDER BY ${sql} reads, so SurrealDB would order by the alias; rename the alias`
      );
    }
  }
};
var count = (value, clause) => {
  if (isExpr(value)) return sqlOf(value);
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(
      `${clause} takes a non-negative integer, not ${value}`
    );
  }
  return String(value);
};
var render = (state) => {
  assertOrder(state);
  const limit = state.only && state.source === void 0 ? "1" : state.limit;
  return [
    `SELECT ${state.fields} FROM ${state.only ? "ONLY " : ""}${state.source === void 0 ? tableName(state.table) : sqlOf(state.source)}`,
    ...state.where.length > 0 ? [`WHERE ${andAll(state.where)}`] : [],
    ...state.order.length > 0 ? [
      `ORDER BY ${state.order.map(({ direction, sql }) => `${sql} ${direction}`).join(", ")}`
    ] : [],
    ...limit === void 0 ? [] : [`LIMIT ${limit}`],
    ...state.start === void 0 ? [] : [`START ${state.start}`]
  ].join(" ");
};
var resultOf = (state) => state.only ? Schema3.UndefinedOr(state.out) : Schema3.Array(state.out);
var builder = (state) => {
  const row = state.row;
  const bounded = (rows) => isExpr(rows) ? mergeParams(state.params, paramsOf(rows)) : state.params;
  return {
    where: (predicate) => {
      const condition = predicate(row);
      return builder({
        ...state,
        where: [...state.where, condition],
        pure: false,
        params: mergeParams(state.params, paramsOf(condition))
      });
    },
    orderBy: (key, direction = "ASC") => {
      const by = key(row);
      const path = isPath(by) ? pathOf(by) : void 0;
      if (path === void 0) {
        throw new TypeError(
          "ORDER BY takes a field path of the row (`row.name`, `row.address.city`, `at(row.pins, 0)`); SurrealDB parses nothing else there"
        );
      }
      return builder({
        ...state,
        order: [
          ...state.order,
          { sql: sqlOf(by), direction, path }
        ]
      });
    },
    limit: (rows) => {
      if (state.only && state.source === void 0) {
        throw new RangeError(
          "a SELECT \u2026 FROM ONLY a table already reads at most one row"
        );
      }
      return builder({
        ...state,
        limit: count(rows, "LIMIT"),
        params: bounded(rows),
        pure: state.pure && !isExpr(rows)
      });
    },
    start: (rows) => builder({
      ...state,
      start: count(rows, "START"),
      params: bounded(rows),
      pure: state.pure && !isExpr(rows)
    }),
    project: (fields) => {
      const projection = fields(row);
      const projected = project(projection);
      return builder({
        ...state,
        fields: projected.sql,
        aliases: projected.aliases,
        pure: state.pure && Object.values(projection).every(isPath),
        out: projected.codec,
        params: mergeParams(state.params, projected.params)
      });
    },
    value: (pick) => {
      const picked = pick(row);
      return builder({
        ...state,
        fields: `VALUE ${sqlOf(picked)}`,
        aliases: /* @__PURE__ */ new Map(),
        pure: state.pure && isPath(picked),
        out: rowCodec(codecOf(picked)),
        params: mergeParams(state.params, paramsOf(picked))
      });
    },
    only: () => {
      if (state.source === void 0 && state.limit !== void 0) {
        throw new RangeError(
          "a SELECT \u2026 FROM ONLY a table reads at most one row; drop the LIMIT"
        );
      }
      return builder({ ...state, only: true });
    },
    toExpr: () => subquery(
      resultOf(state),
      render(state),
      state.params
    ),
    build: (name, options) => {
      const writes = options?.writes ?? (state.pure ? false : void 0);
      return make({
        ...writes !== void 0 && { writes },
        name: name ?? `select ${state.table.name}`,
        sql: `${render(state)};`,
        params: state.params,
        result: resultOf(state)
      });
    }
  };
};
var select = (table, id) => builder({
  table,
  row: rowExprs(table),
  source: id,
  out: storedRow(table),
  fields: "*",
  where: [],
  pure: id === void 0,
  order: [],
  aliases: /* @__PURE__ */ new Map(),
  limit: void 0,
  start: void 0,
  only: false,
  params: id === void 0 ? {} : paramsOf(id)
});

// src/statement/write.ts
import { Schema as Schema4 } from "effect";
var render2 = (state) => [
  `${state.verb} ${state.shape === "many" ? "" : "ONLY "}${state.target}`,
  ...state.data === void 0 ? [] : [state.data],
  ...state.where.length > 0 ? [`WHERE ${andAll(state.where)}`] : [],
  `RETURN ${state.returning?.sql ?? "NONE"}`
].join(" ");
var resultOf2 = (state) => {
  const { returning, shape } = state;
  if (returning === void 0) {
    return shape === "many" ? Schema4.Tuple([]) : Schema4.Undefined;
  }
  if (shape === "one") return returning.codec;
  return shape === "maybe" ? Schema4.UndefinedOr(returning.codec) : Schema4.Array(returning.codec);
};
var finish = (state, name) => make({
  name: name ?? `${state.verb.toLowerCase()} ${state.table.name}`,
  sql: `${render2(state)};`,
  params: state.params,
  result: resultOf2(state),
  writes: true,
  // CREATE ONLY and RELATE ONLY make one record whenever they apply;
  // a denied one returns NONE without an error.
  nonEmpty: (state.verb === "CREATE" || state.verb === "RELATE") && state.returning !== void 0 && state.returning.sql !== "BEFORE"
});
var start = (verb, table, options) => ({
  verb,
  table,
  row: rowExprs(table),
  target: options.target,
  shape: options.shape,
  data: void 0,
  where: [],
  returning: options.returning === "NONE" ? void 0 : { sql: "AFTER", codec: storedRow(table) },
  params: options.params
});
var withData = (state, keyword, data) => ({
  ...state,
  data: `${keyword} ${operand(data)}`,
  params: mergeParams(state.params, paramsOf(data))
});
var withWhere = (state, predicate) => {
  const condition = predicate(state.row);
  return {
    ...state,
    where: [...state.where, condition],
    params: mergeParams(state.params, paramsOf(condition))
  };
};
var withReturning = (state, returning) => {
  if (returning === "none") return { ...state, returning: void 0 };
  if (typeof returning === "string") {
    return {
      ...state,
      returning: {
        sql: returning.toUpperCase(),
        codec: storedRow(state.table)
      }
    };
  }
  const projected = project(
    returning(state.row)
  );
  return {
    ...state,
    returning: { sql: projected.sql, codec: projected.codec },
    params: mergeParams(state.params, projected.params)
  };
};
var creating = (state) => ({
  content: (data) => creating(withData(state, "CONTENT", data)),
  returning: ((returning) => creating(withReturning(state, returning))),
  build: (name) => finish(state, name)
});
var create = (table, id) => creating(
  start("CREATE", table, {
    target: id === void 0 ? tableName(table) : operand(id),
    shape: "one",
    params: id === void 0 ? {} : paramsOf(id),
    returning: "AFTER"
  })
);
var updating = (state) => ({
  where: (predicate) => updating(
    withWhere(state, predicate)
  ),
  returning: ((returning) => updating(withReturning(state, returning))),
  build: (name) => finish(state, name)
});
var update = (table, id) => {
  const state = start("UPDATE", table, {
    target: id === void 0 ? tableName(table) : operand(id),
    shape: id === void 0 ? "many" : "maybe",
    params: id === void 0 ? {} : paramsOf(id),
    returning: "AFTER"
  });
  return {
    merge: (data) => updating(withData(state, "MERGE", data)),
    content: (data) => updating(withData(state, "CONTENT", data))
  };
};
var deleting = (state) => ({
  where: (predicate) => deleting(
    withWhere(state, predicate)
  ),
  returning: ((returning) => deleting(withReturning(state, returning))),
  build: (name) => finish(state, name)
});
var deleteFrom = (table, id) => deleting(
  start("DELETE", table, {
    target: id === void 0 ? tableName(table) : operand(id),
    shape: id === void 0 ? "many" : "maybe",
    params: id === void 0 ? {} : paramsOf(id),
    returning: "NONE"
  })
);
var relating = (state) => ({
  content: (data) => relating(withData(state, "CONTENT", data)),
  returning: ((returning) => relating(withReturning(state, returning))),
  build: (name) => finish(state, name)
});
var relate = (table, from, to) => {
  const source = from;
  const target = to;
  return relating(
    start("RELATE", table, {
      target: `${operand(source)}->${tableName(table)}->${operand(target)}`,
      shape: "one",
      params: mergeParams(paramsOf(source), paramsOf(target)),
      returning: "AFTER"
    })
  );
};
export {
  ExprTypeId,
  StatementTypeId,
  and,
  at,
  call,
  cast,
  codecOf,
  contains,
  create,
  deleteFrom,
  eq,
  gt,
  gte,
  inside,
  isExpr,
  isNone,
  isNotNone,
  isPath,
  isStatement,
  literal,
  lt,
  lte,
  make,
  ne,
  not,
  or,
  param,
  paramsOf,
  part,
  readAs,
  relate,
  rowOf,
  select,
  sequence,
  sqlOf,
  unsafeExpr,
  update
};
//# sourceMappingURL=statement.js.map