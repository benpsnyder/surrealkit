import {
  NoneAsAbsent,
  stripNone
} from "./chunk-ZMDEVTBR.js";
import {
  Level,
  RowScope,
  admit,
  codecOf,
  conjunct,
  contextOf,
  derive,
  joinContexts,
  makeExpr,
  makePath,
  mergeParams,
  operand,
  orNone,
  paramsOf,
  sqlOf
} from "./chunk-DVT5GPYS.js";
import {
  isPlainObject,
  runtimeCode,
  wrap
} from "./chunk-VZONF6WY.js";
import {
  assertResolved,
  withoutRefs
} from "./chunk-QRSY4HQJ.js";

// src/statement/row.ts
import { Schema } from "effect";
import { escapeIdent } from "surrealdb";
var isOptional = (codec) => codec.ast.context?.isOptional === true;
var unwrap = (codec) => isOptional(codec) && "schema" in codec && Schema.isSchema(codec.schema) ? codec.schema : codec;
var fieldsOf = (codec) => {
  if ("schema" in codec && "records" in codec && Schema.isSchema(codec.schema) && "fields" in codec.schema) {
    return codec.schema.fields;
  }
  if ("fields" in codec && isPlainObject(codec.fields)) {
    return codec.fields;
  }
  return void 0;
};
var build = (fields, prefix, optional, root, scope) => {
  const row = {};
  for (const [key, declared] of Object.entries(fields)) {
    const mayBeNone = optional || isOptional(declared);
    const codec = unwrap(declared);
    const path = `${prefix}${escapeIdent(key)}`;
    const start = root ?? { root: key, rootSql: path };
    const nested = fieldsOf(codec);
    row[key] = Object.assign(
      nested === void 0 ? {} : build(nested, `${path}.`, mayBeNone, start, scope),
      makePath(mayBeNone ? orNone(codec) : codec, path, start, scope)
    );
  }
  return row;
};
var rowOf = (schema) => rowIn(schema, void 0);
var rowIn = (schema, scope) => {
  const fields = fieldsOf(schema);
  if (fields === void 0) {
    throw new TypeError("rowOf takes a generated row schema (a struct)");
  }
  return build(fields, "", false, void 0, scope);
};
var rowAt = (schema, prefix) => {
  const fields = fieldsOf(schema);
  if (fields === void 0) {
    throw new TypeError("rowAt takes a generated row schema (a struct)");
  }
  return build(fields, prefix, false, void 0, void 0);
};
var rowCodec = (schema) => NoneAsAbsent(schema);
var projectedCodec = (fields) => {
  const keys = Object.keys(fields);
  return wrap(Schema.Struct(fields), {
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

// src/statement/table.ts
import { escapeIdent as escapeIdent2 } from "surrealdb";
var readerKey = /* @__PURE__ */ Symbol.for("effect-surrealkit/Reader");
var readerOf = (value) => value[readerKey] ?? "privileged";
var restricted = (value) => ({ ...value, [readerKey]: "restricted" });
var isStore = (value) => "tables" in value && "edges" in value && typeof value.tables === "object" && value.tables !== null && !("select" in value);
function readAs(value, declared) {
  if (isStore(value)) {
    const tables = {};
    for (const [name, table2] of Object.entries(value.tables)) {
      tables[name] = restricted(
        table2.visible === void 0 ? table2 : { ...table2, select: table2.visible }
      );
    }
    return restricted({ ...value, tables });
  }
  const table = value;
  if (declared === void 0) {
    if (table.visible === void 0) {
      throw new TypeError(
        `readAs: the descriptor of \`${table.name}\` has no generated \`visible\` row; regenerate it, or pass the row the session reads`
      );
    }
    return restricted({ ...table, select: table.visible });
  }
  const select = declared;
  if (table.schemafull) {
    const stored = fieldsOf(table.select);
    const view = fieldsOf(select);
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
  return restricted({ ...table, select });
}
var tableName = (table) => /[⟩\\]/u.test(table.name) ? `\`${table.name.replace(/[\\`]/gu, (char) => `\\${char}`)}\`` : `\u27E8${table.name}\u27E9`;
var storedRow = (table) => rowCodec(table.select);
var rowExprs = (table, scope) => rowIn(table.select, scope);
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
var subquery = (codec, sql, params, context) => {
  assertResolved(params, `the subquery \`${sql}\``);
  return makeExpr(
    codec,
    `(${sql})`,
    withoutRefs(params),
    Level.atom,
    context
  );
};

// src/statement/graph.ts
import { Schema as Schema2, SchemaAST } from "effect";
import { escapeIdent as escapeIdent3 } from "surrealdb";
var traversalMarker = "~effect-surrealkit/Traversal";
var TraversalTypeId = traversalMarker;
var representation = (ast) => {
  const value = ast.annotations?.representation?.id;
  return typeof value === "string" ? value : void 0;
};
var tableOf = (ast) => {
  const payload = ast.annotations?.representation?.payload;
  return typeof payload === "object" && payload !== null && "table" in payload && typeof payload.table === "string" ? payload.table : void 0;
};
var mergeIds = (shapes) => {
  const tables = /* @__PURE__ */ new Set();
  for (const shape of shapes) {
    if (shape.kind !== "id") return void 0;
    if (shape.tables === "any") return { kind: "id", tables: "any" };
    for (const table of shape.tables) tables.add(table);
  }
  return { kind: "id", tables: [...tables] };
};
var shapeOfAst = (ast) => {
  if (SchemaAST.isDeclaration(ast)) {
    const id = representation(ast);
    const [inner] = ast.typeParameters;
    if (id === "effect-surrealkit/Enforced" && inner !== void 0) {
      return shapeOfAst(inner);
    }
    if (id === "effect-surrealkit/RecordIdAny") {
      return { kind: "id", tables: "any" };
    }
    const table = tableOf(ast);
    return id === "effect-surrealkit/RecordIdFor" && table !== void 0 ? { kind: "id", tables: [table] } : void 0;
  }
  if (SchemaAST.isUnion(ast)) {
    const members = ast.types.filter(
      (type) => !SchemaAST.isUndefined(type)
    );
    const shapes = members.map(shapeOfAst);
    if (shapes.some((shape) => shape === void 0)) return void 0;
    const merged = shapes.length === 1 ? shapes[0] : mergeIds(shapes);
    if (merged === void 0) return void 0;
    return members.length < ast.types.length ? { kind: "optional", of: merged } : merged;
  }
  if (SchemaAST.isArrays(ast) && ast.elements.length === 0 && ast.rest.length === 1) {
    const [item] = ast.rest;
    const of = item === void 0 ? void 0 : shapeOfAst(item);
    return of === void 0 ? void 0 : { kind: "list", of };
  }
  return void 0;
};
var linkShape = (codec) => shapeOfAst(codec.ast);
var shapeTables = (shape) => shape.kind === "id" ? shape.tables : shapeTables(shape.of);
var optionalOf = (shape) => shape.kind === "optional";
var shapeTablesText = (shape) => {
  const tables = shapeTables(shape);
  return tables === "any" ? "any table" : tables.join(" | ");
};
var enforced = (leaf, relation) => wrap(leaf, {
  id: "effect-surrealkit/Enforced",
  payload: { relation },
  expected: `a record the ENFORCED relation \`${relation}\` reaches`,
  code: ([inner]) => runtimeCode(inner?.runtime ?? "", inner?.Type ?? "unknown"),
  refuse: {
    when: (input) => input === void 0,
    message: `a record reached through \`${relation}\` is NONE, but the generated descriptors declare \`${relation}\` ENFORCED, so SurrealDB would refuse to relate to a missing record and delete a record's edges with it: the live schema may differ from the generated descriptors (is \`${relation}\` ENFORCED there, and does it lead to these tables?); regenerate them, or check the database with \`schemaDrift\` from \`effect-surrealkit/testing\``
  }
});
var lift = (shape, present, leaf, relation) => {
  switch (shape.kind) {
    case "id":
      return present ? relation === void 0 || Schema2.is(leaf)(void 0) ? leaf : enforced(leaf, relation) : orNone(leaf);
    case "optional":
      return orNone(lift(shape.of, present, leaf, relation));
    case "list":
      return Schema2.Array(lift(shape.of, present, leaf, relation));
  }
};
var traversalOf = (value) => typeof value === "object" && value !== null && TraversalTypeId in value ? value[TraversalTypeId] : void 0;
var isTraversal = (value) => traversalOf(value) !== void 0;
var union = (codecs) => {
  const distinct = [...new Set(codecs)];
  return distinct.length === 1 ? distinct[0] : Schema2.Union(distinct);
};
var describeLink = (records) => `\`${sqlOf(records) || "(the node)"}\``;
var viewOf = (store) => ({
  readers: /* @__PURE__ */ new Set([readerOf(store)])
});
var targetsOf = (store, records) => {
  const shape = linkShape(codecOf(records));
  if (shape === void 0) {
    throw new TypeError(
      `${describeLink(records)} is not a record link: follow a field typed \`record<table>\`, a list of them, or a graph step`
    );
  }
  const names = shapeTables(shape);
  if (names === "any") {
    throw new TypeError(
      `${describeLink(records)} can point at any table, so its target has no known fields`
    );
  }
  const tables = names.map((name) => {
    const table = store.tables[name];
    if (table === void 0) {
      throw new RangeError(`\`${name}\` is not a table of this store`);
    }
    return table;
  });
  return { shape, tables };
};
var isOptionalField = (codec) => codec.ast.context?.isOptional === true;
var unwrapField = (codec) => isOptionalField(codec) && "schema" in codec && Schema2.isSchema(codec.schema) ? codec.schema : codec;
var commonKeys = (maps) => {
  const [first, ...rest] = maps;
  return first === void 0 ? [] : Object.keys(first).filter(
    (key) => rest.every((map) => Object.hasOwn(map, key))
  );
};
var buildLinked = (maps, prefix, optional, wrap2, params, context) => {
  const linked = {};
  for (const key of commonKeys(maps)) {
    const declared = maps.map((map) => map[key]);
    const mayBeNone = optional || declared.some(isOptionalField);
    const codecs = declared.map(unwrapField);
    const codec = union(codecs);
    const sql = `${prefix}${escapeIdent3(key)}`;
    const nested = codecs.map(fieldsOf);
    const children = nested.every((fields) => fields !== void 0) ? buildLinked(
      nested,
      `${sql}.`,
      mayBeNone,
      wrap2,
      params,
      context
    ) : {};
    linked[key] = Object.assign(
      children,
      makeExpr(
        wrap2(mayBeNone ? orNone(codec) : codec),
        sql,
        params,
        Level.atom,
        context
      )
    );
  }
  return linked;
};
var selectFields = (table) => {
  const fields = fieldsOf(table.select);
  if (fields === void 0) {
    throw new TypeError(
      `table \`${table.name}\` has no row schema with declared fields`
    );
  }
  return fields;
};
var follow = (store, records) => {
  const link = records;
  const { shape, tables } = targetsOf(store, link);
  const present = traversalOf(link)?.present ?? false;
  return buildLinked(
    tables.map(selectFields),
    `${operand(link)}.`,
    false,
    (codec) => lift(shape, present, codec, traversalOf(link)?.relation),
    paramsOf(link),
    joinContexts([contextOf(link), viewOf(store)])
  );
};
var targetRow = (tables) => union(tables.map((table) => rowCodec(table.select)));
var rows = (store, records) => {
  const link = records;
  const { shape, tables } = targetsOf(store, link);
  const present = traversalOf(link)?.present ?? false;
  return makeExpr(
    lift(shape, present, targetRow(tables), traversalOf(link)?.relation),
    `${operand(link)}.*`,
    paramsOf(link),
    Level.atom,
    joinContexts([contextOf(link), viewOf(store)])
  );
};
var targetRowExprs = (tables, scope) => {
  const build2 = (maps, prefix, optional, root) => {
    const row = {};
    for (const key of commonKeys(maps)) {
      const declared = maps.map((map) => map[key]);
      const mayBeNone = optional || declared.some(isOptionalField);
      const codecs = declared.map(unwrapField);
      const codec = union(codecs);
      const path = `${prefix}${escapeIdent3(key)}`;
      const start = root ?? { root: key, rootSql: path };
      const nested = codecs.map(fieldsOf);
      row[key] = Object.assign(
        nested.every((fields) => fields !== void 0) ? build2(
          nested,
          `${path}.`,
          mayBeNone,
          start
        ) : {},
        makePath(mayBeNone ? orNone(codec) : codec, path, start, scope)
      );
    }
    return row;
  };
  return build2(
    tables.map(selectFields),
    "",
    false,
    void 0
  );
};
var destructure = (store, records, shape) => {
  const link = records;
  const targets = targetsOf(store, link);
  const present = traversalOf(link)?.present ?? false;
  const scope = new RowScope(
    "target",
    targets.tables.map((table) => table.name).join(" | ")
  );
  const fields = shape(
    targetRowExprs(targets.tables, scope)
  );
  const entries = Object.entries(fields);
  const projected = project(fields);
  const inner = admit(
    {
      own: scope,
      what: "a destructuring callback",
      parents: "refuse",
      refused: "SurrealDB 3.3 binds `$parent` inside a destructuring to the outer row and 4.0 to the destructured record; project the step beside the destructured object"
    },
    Object.values(fields)
  );
  return makeExpr(
    lift(
      targets.shape,
      present,
      projected.codec,
      traversalOf(link)?.relation
    ),
    `${operand(link)}.{ ${entries.map(([alias, value]) => `${escapeIdent3(alias)}: ${sqlOf(value)}`).join(", ")} }`,
    mergeParams(paramsOf(link), projected.params),
    Level.atom,
    joinContexts([contextOf(link), inner, viewOf(store)])
  );
};
var arrows = {
  out: "->",
  in: "<-",
  both: "<->"
};
var accepted = (codecs) => {
  const tables = /* @__PURE__ */ new Set();
  for (const codec of codecs) {
    const shape = linkShape(codec);
    const names = shape === void 0 ? "any" : shapeTables(shape);
    if (names === "any") return "any";
    for (const name of names) tables.add(name);
  }
  return [...tables];
};
var startOf = (from, what) => {
  const shape = linkShape(codecOf(from));
  if (shape === void 0) {
    throw new TypeError(
      `${describeLink(from)} is not a record id, so ${what} cannot start from it`
    );
  }
  const inner = optionalOf(shape) ? shape.of : shape;
  if (inner.kind === "list" && traversalOf(from)?.edges === void 0) {
    throw new TypeError(
      `${describeLink(from)} is a list of records from which SurrealDB yields one list per record; ${what} starts from one record or chains from another step`
    );
  }
  return { shape, optional: optionalOf(shape) };
};
var step = (direction, store, from, name, options) => {
  const edge = store.edges[name];
  const table = store.tables[name];
  if (edge === void 0 || table === void 0) {
    throw new RangeError(`\`${name}\` is not a relation of this store`);
  }
  const start = startOf(from, `a step along \`${name}\``);
  const sides = direction === "out" ? edge.in : direction === "in" ? edge.out : [...edge.in, ...edge.out];
  const allowed = accepted(sides);
  const tables = shapeTables(start.shape);
  if (allowed !== "any") {
    const wrong = tables === "any" ? ["any table"] : tables.filter((table2) => !allowed.includes(table2));
    if (wrong.length > 0) {
      throw new RangeError(
        `\`${name}\` has no edges ${direction === "out" ? "out of" : direction === "in" ? "into" : "at"} ${wrong.map((table2) => `\`${table2}\``).join(", ")}`
      );
    }
  }
  const scope = new RowScope("edge", name);
  const condition = options?.where?.(
    makeRow(table, scope)
  );
  const filtered = condition === void 0 ? void 0 : admit(
    { own: scope, what: "a step's `where`", parents: "place" },
    [condition]
  );
  const arrow = arrows[direction];
  const through = condition === void 0 ? escapeIdent3(name) : `(${escapeIdent3(name)} WHERE ${sqlOf(condition)})`;
  const edgesSql = `${operand(from)}${arrow}${through}`;
  const ends = direction === "out" ? edge.out : direction === "in" ? edge.in : [...edge.in, ...edge.out];
  const item = union(ends);
  const list = (codec) => start.optional ? orNone(Schema2.Array(codec)) : Schema2.Array(codec);
  const reached = options?.whereTarget;
  let test;
  let kept;
  if (reached !== void 0) {
    const names = accepted(ends);
    if (names === "any") {
      throw new TypeError(
        `the records \`${name}\` reaches can be of any table, so a filter on them has no fields to read`
      );
    }
    const targets = names.map((target) => {
      const found = store.tables[target];
      if (found === void 0) {
        throw new RangeError(
          `\`${target}\` is not a table of this store`
        );
      }
      return found;
    });
    const own = new RowScope("reached", names.join(" | "));
    test = reached(targetRowExprs(targets, own));
    kept = admit(
      {
        own,
        what: "a step's `whereTarget`",
        parents: "refuse",
        refused: "it reads the select\u2019s row only from a filter on the edges of a step directly under it"
      },
      [test]
    );
  }
  const params = mergeParams(
    paramsOf(from),
    condition === void 0 ? {} : paramsOf(condition),
    test === void 0 ? {} : paramsOf(test)
  );
  return {
    ...makeExpr(
      list(item),
      `${edgesSql}${arrow}${test === void 0 ? "?" : `(? WHERE ${sqlOf(test)})`}`,
      params,
      Level.atom,
      joinContexts([contextOf(from), filtered, kept, viewOf(store)])
    ),
    [TraversalTypeId]: {
      present: edge.enforced,
      ...edge.enforced && { relation: name },
      item,
      edges: {
        sql: edgesSql,
        codec: list(table.id),
        item: table.id,
        ...test !== void 0 && { filtered: true }
      }
    }
  };
};
var makeRow = (table, scope) => targetRowExprs([table], scope);
var stepIn = (direction) => (store, from, edge, options) => step(
  direction,
  store,
  from,
  edge,
  options
);
var outgoing = stepIn("out");
var incoming = stepIn("in");
var both = stepIn("both");
var edges = (traversal) => {
  const data = traversalOf(traversal);
  if (data?.edges === void 0) {
    throw new TypeError(
      "only a graph step walks edges; a recursive path has none to read"
    );
  }
  if (data.edges.filtered === true) {
    throw new RangeError(
      "the edges of a step with a `whereTarget` filter would include the edges to the records it leaves out; filter the edges with `where` (`follow(store, edge.out)` reads the record an edge leads to)"
    );
  }
  return {
    ...derive(data.edges.codec, data.edges.sql, Level.atom, [
      traversal
    ]),
    [TraversalTypeId]: { present: true, item: data.edges.item }
  };
};
var bound = (value, what) => {
  if (!Number.isInteger(value) || value < 1 || value > 256) {
    throw new RangeError(
      `${what} is ${value}; a recursion depth is an integer from 1 to 256`
    );
  }
  return value;
};
var recursion = (from, repeat, instruction) => {
  const start = startOf(from, "a recursive path");
  const single = start.shape.kind === "optional" ? start.shape.of : start.shape;
  if (single.kind === "list") {
    throw new TypeError(
      "a recursive path starts from one record: `row.id`, a record link or a binding"
    );
  }
  const node = makeExpr(codecOf(from), "", {}, Level.atom);
  const inner = repeat(node);
  const data = traversalOf(inner);
  if (data === void 0 || !/^(?:->|<-)/u.test(sqlOf(inner))) {
    throw new TypeError(
      'a recursive path repeats a graph step from the node it is given, like `(node) => outgoing(store, node, "knows")`'
    );
  }
  const traversal = inner;
  const repeated = admit(
    {
      own: new RowScope("node", shapeTablesText(start.shape)),
      what: "the step a recursive path repeats",
      parents: "refuse",
      refused: "SurrealDB 3.3 and 4.0 bind `$parent` differently under a recursive path; bind the value with `param`"
    },
    [traversal]
  );
  const nodeTables = shapeTables(start.shape);
  const itemShape = linkShape(data.item);
  const itemTables = itemShape === void 0 ? "any" : shapeTables(itemShape);
  if (nodeTables !== "any" && (itemTables === "any" || itemTables.some((table) => !nodeTables.includes(table)))) {
    throw new RangeError(
      "a recursive path repeats a step that leads back to the table it starts from"
    );
  }
  const { depth, reads, optional } = instruction(traversal);
  const list = Schema2.Array(data.item);
  return {
    ...makeExpr(
      optional === true || start.optional ? orNone(list) : list,
      `${operand(from)}.{${depth}}(${sqlOf(traversal)})`,
      mergeParams(
        paramsOf(from),
        paramsOf(traversal),
        reads === void 0 ? {} : paramsOf(reads)
      ),
      Level.atom,
      joinContexts([
        contextOf(from),
        repeated,
        reads === void 0 ? void 0 : contextOf(reads)
      ])
    ),
    [TraversalTypeId]: {
      present: data.present,
      ...data.relation !== void 0 && { relation: data.relation },
      item: data.item
    }
  };
};
var recurse = (from, depth, repeat) => {
  const min = bound(depth.min, "the least depth");
  const max = bound(depth.max, "the greatest depth");
  if (min > max) {
    throw new RangeError(
      `the least depth ${min} is greater than the greatest ${max}; SurrealDB would answer NONE`
    );
  }
  return recursion(from, repeat, () => ({
    depth: `${min}..${max}`
  }));
};
var collect = (from, repeat, options = {}) => {
  const min = options.min === void 0 ? void 0 : bound(options.min, "the least depth");
  const max = options.max === void 0 ? void 0 : bound(options.max, "the greatest depth");
  if (min !== void 0 && max !== void 0 && min > max) {
    throw new RangeError(
      `the least depth ${min} is greater than the greatest ${max}`
    );
  }
  const range = max === void 0 ? `${min ?? ""}..` : `${min ?? 1}..${max}`;
  return recursion(from, repeat, () => ({
    depth: `${range}+collect${options.inclusive === true ? "+inclusive" : ""}`
  }));
};
var shortest = (from, to, repeat, options = {}) => {
  const target = to;
  const shape = linkShape(codecOf(target));
  if (shape === void 0 || shape.kind !== "id") {
    throw new TypeError(
      "a shortest path leads to one record id: a binding or a constant"
    );
  }
  return recursion(from, repeat, () => ({
    depth: `..+shortest=${operand(target)}${options.inclusive === true ? "+inclusive" : ""}`,
    reads: target,
    optional: true
  }));
};

export {
  isOptional,
  unwrap,
  fieldsOf,
  rowOf,
  rowAt,
  rowCodec,
  projectedCodec,
  readerOf,
  readAs,
  tableName,
  storedRow,
  rowExprs,
  project,
  andAll,
  subquery,
  TraversalTypeId,
  linkShape,
  shapeTables,
  traversalOf,
  isTraversal,
  union,
  viewOf,
  isOptionalField,
  unwrapField,
  selectFields,
  follow,
  rows,
  destructure,
  outgoing,
  incoming,
  both,
  edges,
  recurse,
  collect,
  shortest
};
//# sourceMappingURL=chunk-LWAKMPZO.js.map