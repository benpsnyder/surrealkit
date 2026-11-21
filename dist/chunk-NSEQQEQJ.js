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
} from "./chunk-MUBWQQFC.js";
import {
  assertBindingName,
  assertNotNested,
  joinRefs,
  withRefs
} from "./chunk-QRSY4HQJ.js";

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
    for (const [key, value] of map) {
      if (!joined.has(key)) joined.set(key, value);
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
//# sourceMappingURL=chunk-NSEQQEQJ.js.map