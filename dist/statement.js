import {
  FloatOrDecimal,
  add,
  div,
  holdsDecimal,
  mul,
  sub
} from "./chunk-ACZISPEL.js";
import {
  SurrealValue
} from "./chunk-F4HWMI2D.js";
import {
  DEFAULT_HOLE_DELIMITERS,
  analyzeSync,
  lex
} from "./chunk-774SB3OG.js";
import {
  TraversalTypeId,
  andAll,
  both,
  collect,
  destructure,
  edges,
  fieldsOf,
  follow,
  incoming,
  isOptional,
  isOptionalField,
  isTraversal,
  linkShape,
  outgoing,
  project,
  projectedCodec,
  readAs,
  readerOf,
  recurse,
  rowAt,
  rowCodec,
  rowExprs,
  rowOf,
  rows,
  selectFields,
  shapeTables,
  shortest,
  storedRow,
  subquery,
  tableName,
  traversalOf,
  union,
  unwrap,
  unwrapField,
  viewOf
} from "./chunk-KRFS2OMG.js";
import {
  NoneAsAbsent
} from "./chunk-FN4HR4GU.js";
import {
  ExprTypeId,
  Level,
  RowScope,
  StatementTypeId,
  admit,
  and,
  assertBindingName,
  assertIdentifier,
  assertReader,
  at,
  call,
  cast,
  codecOf,
  contains,
  contextOf,
  derive,
  eq,
  gt,
  gte,
  inside,
  isExpr,
  isNone,
  isNotNone,
  isPath,
  isStatement,
  joinContexts,
  literal,
  lt,
  lte,
  make,
  makeExpr,
  mergeParams,
  ne,
  not,
  operand,
  or,
  orNone,
  param,
  paramsOf,
  parent,
  pathOf,
  settle,
  sqlOf,
  unsafeExpr,
  withRefs
} from "./chunk-ZJPZBNCL.js";
import {
  Decimal,
  Float,
  Int,
  Int64,
  SurrealNumber,
  SurrealString,
  isPlainObject
} from "./chunk-PHSAVORF.js";
import "./chunk-PZ5AY32C.js";

// src/statement/block.ts
import { Schema, SchemaAST } from "effect";
import { escapeIdent } from "surrealdb";
var noneMember = (codec) => {
  const { members } = codec;
  return Array.isArray(members) && members.length === 2 && members[1] === Schema.Undefined && Schema.isSchema(members[0]) ? members[0] : void 0;
};
var someOf = (codec) => noneMember(codec) ?? codec;
var rowWrappers = /* @__PURE__ */ new Set([
  "effect-surrealkit/NoneAsAbsent",
  "effect-surrealkit/ProjectedRow"
]);
var representationOf = (ast) => {
  const { representation } = ast.annotations ?? {};
  return typeof representation?.id === "string" ? representation.id : void 0;
};
var objectsOf = (ast) => {
  let at2 = ast;
  while (SchemaAST.isDeclaration(at2) && at2.typeParameters.length === 1 && rowWrappers.has(representationOf(at2) ?? "")) {
    at2 = at2.typeParameters[0];
  }
  return SchemaAST.isObjects(at2) ? at2 : void 0;
};
var withFields = (expr, codec, sql, optional) => {
  const none2 = noneMember(codec);
  const objects = objectsOf((none2 ?? codec).ast);
  if (objects === void 0) return expr;
  const mayBeNone = optional || none2 !== void 0;
  const fields = {};
  for (const property of objects.propertySignatures) {
    if (typeof property.name !== "string") continue;
    const fieldOptional = mayBeNone || SchemaAST.isOptional(property.type);
    const base = Schema.make(property.type);
    const path = `${sql}.${escapeIdent(property.name)}`;
    fields[property.name] = withFields(
      makeExpr(fieldOptional ? orNone(base) : base, path, {}, Level.atom),
      base,
      path,
      fieldOptional
    );
  }
  return Object.assign(fields, expr);
};
var localExpr = (name, codec) => withFields(
  makeExpr(codec, `$${name}`, {}, Level.atom),
  codec,
  `$${name}`,
  false
);
var scopeOf = (locals) => Object.fromEntries(
  [...locals].map(([name, codec]) => [name, localExpr(name, codec)])
);
var key = /^[A-Za-z_][A-Za-z0-9_]*$/u;
var lift = (value) => isExpr(value) ? value : literal(value);
var object = (fields) => {
  const entries = Object.entries(fields).map(
    ([name, value]) => [name, lift(value)]
  );
  if (entries.length === 0) {
    throw new RangeError(
      "an object expression needs at least one field: `{}` reads as an empty block"
    );
  }
  for (const [name] of entries) {
    if (!key.test(name)) {
      throw new RangeError(
        `\`${name}\` is not an object key a block writes: use letters, digits and underscores, not starting with a digit`
      );
    }
  }
  return derive(
    projectedCodec(
      Object.fromEntries(
        entries.map(([name, value]) => [name, value[ExprTypeId].codec])
      )
    ),
    `{ ${entries.map(([name, value]) => `${name}: ${operand(value)}`).join(", ")} }`,
    Level.atom,
    entries.map(([, value]) => value)
  );
};
var BlockTypeId = "~effect-surrealkit/Block";
var bodyOf = (arm) => arm[BlockTypeId];
var resultsOf = (body) => body.terminal?.results ?? [Schema.Undefined];
var statementsOf = (body) => [
  ...body.steps,
  ...body.terminal === void 0 ? [] : [body.terminal.sql]
];
var armText = (body) => {
  const statements = statementsOf(body);
  return `{ ${statements.length === 0 ? "NONE" : statements.join("; ")} }`;
};
var conditionText = (condition) => assertInBlock(condition)[ExprTypeId].level === Level.raw ? `(${sqlOf(condition)})` : sqlOf(condition);
var messageText = (message) => {
  if (typeof message !== "string" || message.length === 0) {
    throw new RangeError("a THROW message is a non-empty string");
  }
  return sqlOf(literal(message));
};
var unique = (values) => [
  ...new Set(values)
];
var quotes = {
  "'": "'",
  '"': '"',
  "`": "`",
  "\u27E8": "\u27E9"
};
var hasReturn = (sql) => {
  let previous = ";";
  let index = 0;
  while (index < sql.length) {
    const char = sql[index] ?? "";
    const two = sql.slice(index, index + 2);
    if (/\s/u.test(char)) {
      index += 1;
    } else if (two === "--" || two === "//" || char === "#") {
      const end = sql.indexOf("\n", index);
      index = end === -1 ? sql.length : end + 1;
    } else if (two === "/*") {
      const end = sql.indexOf("*/", index + 2);
      index = end === -1 ? sql.length : end + 2;
    } else if (quotes[char] !== void 0) {
      const close = quotes[char];
      index += 1;
      while (index < sql.length && sql[index] !== close) {
        index += sql[index] === "\\" ? 2 : 1;
      }
      index += 1;
      previous = "value";
    } else if (/[A-Za-z0-9_]/u.test(char)) {
      let end = index;
      while (end < sql.length && /[A-Za-z0-9_]/u.test(sql[end] ?? "")) {
        end += 1;
      }
      const word = sql.slice(index, end).toUpperCase();
      if (word === "RETURN" && (";{(".includes(previous) || previous === "THEN" || previous === "ELSE")) {
        return true;
      }
      previous = word;
      index = end;
    } else {
      previous = char;
      index += 1;
    }
  }
  return false;
};
var assertInBlock = (expr) => {
  admit(
    {
      own: void 0,
      what: "a block",
      parents: "refuse",
      refused: "SurrealDB 3.3 and 4.0 bind `$parent` differently in a block with no enclosing select"
    },
    [expr]
  );
  return expr;
};
var valueText = (value, what) => {
  if (isExpr(value)) {
    assertInBlock(value);
    return {
      sql: operand(value),
      codec: value[ExprTypeId].codec,
      params: paramsOf(value),
      throws: [],
      writes: false
    };
  }
  if (!isStatement(value)) {
    throw new TypeError(`${what} is an expression or a built statement`);
  }
  if (value.slots !== 1 || value.defines.length > 0 || value.transactional) {
    throw new RangeError(
      `${what} is a statement of one result that defines nothing; \`${value.name}\` returns ${value.slots} results${value.defines.length > 0 ? `, defines ${value.defines.map((name) => `\`$${name}\``).join(", ")}` : ""}${value.transactional ? " and writes its own transaction" : ""}`
    );
  }
  let text = value.sql.trimEnd();
  while (text.endsWith(";")) text = text.slice(0, -1).trimEnd();
  if (hasReturn(text)) {
    throw new RangeError(
      `${what} is a statement without RETURN: \`${value.name}\` writes one, and a RETURN in a LET's value ends the block on SurrealDB 4 and is the value on 3; end the statement with its value instead`
    );
  }
  const lastLine = text.slice(text.lastIndexOf("\n") + 1);
  return {
    // A line comment at the end would swallow the closing parenthesis.
    sql: /--|\/\/|#/u.test(lastLine) ? `(${text}
)` : `(${text})`,
    codec: value.result,
    params: value.params,
    throws: value.throws,
    writes: value.writes === true
  };
};
var unionOf = (results) => {
  const members = unique(results);
  if (members.length === 0) return Schema.Never;
  if (members.length === 1) return members[0];
  return Schema.Union(members);
};
var closeArms = ({ before, arms, otherwise }) => {
  const bodies = [
    ...arms.map((arm) => arm.body),
    ...otherwise ? [otherwise] : []
  ];
  const sql = [
    ...arms.map(
      (arm, index) => `${index === 0 ? "IF" : "ELSE IF"} ${arm.condition} ${armText(arm.body)}`
    ),
    ...otherwise === void 0 ? [] : [`ELSE ${armText(otherwise)}`]
  ].join(" ");
  return {
    ...before,
    terminal: {
      sql,
      results: [
        ...bodies.flatMap(resultsOf),
        ...otherwise === void 0 ? [Schema.Undefined] : []
      ]
    },
    params: mergeParams(
      before.params,
      ...bodies.map((body) => body.params)
    ),
    inner: unique([
      ...before.inner,
      ...bodies.flatMap((body) => [...body.own, ...body.inner])
    ]),
    throws: unique([
      ...before.throws,
      ...bodies.flatMap((body) => body.throws)
    ]),
    writes: before.writes || bodies.some((body) => body.writes)
  };
};
var armStart = (before, locals = before.locals) => ({
  steps: [],
  params: before.params,
  locals,
  own: [],
  inner: [],
  throws: [],
  writes: false
});
var assertLocal = (body, name) => {
  const codec = body.locals.get(name);
  if (codec === void 0) {
    throw new RangeError(`\`$${name}\` is not a local of this block`);
  }
  return codec;
};
var finish = (body) => ({
  build: (name, options) => {
    const label2 = name ?? "block";
    const statements = statementsOf(body);
    if (statements.length === 0) {
      throw new RangeError(`block \`${label2}\` has no steps`);
    }
    const locals = [...body.own, ...body.inner];
    const shadowed = unique(
      locals.filter((local) => Object.hasOwn(body.params, local))
    );
    if (shadowed.length > 0) {
      throw new RangeError(
        `block \`${label2}\` reads ${shadowed.map((local) => `\`$${local}\``).join(", ")} as a binding and defines a local of the same name, which would shadow it; rename the local`
      );
    }
    if (options?.writes === false && body.writes) {
      throw new RangeError(
        `block \`${label2}\` is declared not to write, but a statement it runs writes`
      );
    }
    const writes = body.writes ? true : options?.writes;
    return make({
      name: label2,
      // One statement: a lone value or IF as it is, anything more as a
      // block, whose locals stay inside it.
      sql: body.steps.length === 0 ? `${statements.join("")};` : `{
	${statements.join(";\n	")}
};`,
      params: body.params,
      result: unionOf(resultsOf(body)),
      slots: 1,
      throws: [...body.throws].sort(),
      defines: [],
      ...writes !== void 0 && { writes }
    });
  }
});
var ended = (body) => ({ [BlockTypeId]: body, ...finish(body) });
var branching = (state) => {
  const scope = () => scopeOf(state.before.locals);
  const arm = (then) => bodyOf(then(open(armStart(state.before))));
  const closed = closeArms(state);
  return {
    [BlockTypeId]: closed,
    ...finish(closed),
    elseIf: (condition, then) => {
      const test = condition(scope());
      const body = arm(then);
      return branching({
        ...state,
        before: {
          ...state.before,
          params: mergeParams(state.before.params, paramsOf(test))
        },
        arms: [...state.arms, { condition: conditionText(test), body }]
      });
    },
    else: (then) => ended(closeArms({ ...state, otherwise: arm(then) }))
  };
};
var open = (body) => {
  const scope = () => scopeOf(body.locals);
  const step = (sql, changes = {}) => open({ ...body, ...changes, steps: [...body.steps, sql] });
  const guard = (condition, message) => `IF ${condition} { THROW ${messageText(message)} }`;
  return {
    [BlockTypeId]: body,
    ...finish(body),
    let: (name, value) => {
      assertBindingName(name);
      if (body.locals.has(name)) {
        throw new RangeError(
          `local \`$${name}\` is already defined in this block`
        );
      }
      const local = valueText(
        value(scope()),
        `the value of \`$${name}\``
      );
      return step(`LET $${name} = ${local.sql}`, {
        params: mergeParams(body.params, local.params),
        locals: new Map([...body.locals, [name, local.codec]]),
        own: [...body.own, name],
        throws: unique([...body.throws, ...local.throws]),
        writes: body.writes || local.writes
      });
    },
    throwIf: (condition, message) => {
      const test = condition(scope());
      return step(guard(conditionText(test), message), {
        params: mergeParams(body.params, paramsOf(test)),
        throws: unique([...body.throws, message])
      });
    },
    throwIfNone: (name, message) => {
      const codec = assertLocal(body, name);
      return step(guard(`$${name} = NONE`, message), {
        locals: new Map([...body.locals, [name, someOf(codec)]]),
        throws: unique([...body.throws, message])
      });
    },
    do: (run) => {
      const statement = run(scope());
      if (!isStatement(statement)) {
        throw new TypeError(
          "a step run for its effect is a built statement"
        );
      }
      const effect = valueText(statement, "a step run for its effect");
      if (!SchemaAST.isUndefined(effect.codec.ast)) {
        throw new RangeError(
          'a step run for its effect returns NONE (a write by id with `.returning("none")`); bind a result with `let`'
        );
      }
      return step(effect.sql.slice(1, -1), {
        params: mergeParams(body.params, effect.params),
        throws: unique([...body.throws, ...effect.throws]),
        writes: body.writes || effect.writes
      });
    },
    return: (value) => {
      const returned = value(scope());
      if (!isExpr(returned) && !isPlainObject(returned)) {
        throw new TypeError(
          "a block returns an expression or an object of expressions; inline a constant with `literal`"
        );
      }
      const expr = assertInBlock(
        isExpr(returned) ? returned : object(returned)
      );
      return ended({
        ...body,
        terminal: {
          sql: operand(expr),
          results: [expr[ExprTypeId].codec]
        },
        params: mergeParams(body.params, paramsOf(expr))
      });
    },
    throw: (message) => ended({
      ...body,
      terminal: { sql: `THROW ${messageText(message)}`, results: [] },
      throws: unique([...body.throws, message])
    }),
    if: (condition, then) => {
      const test = condition(scope());
      const before = {
        ...body,
        params: mergeParams(body.params, paramsOf(test))
      };
      return branching({
        before,
        arms: [
          {
            condition: conditionText(test),
            body: bodyOf(then(open(armStart(before))))
          }
        ]
      });
    },
    ifNotNone: (name, then) => {
      const codec = assertLocal(body, name);
      const narrowed = new Map([...body.locals, [name, someOf(codec)]]);
      return branching({
        before: body,
        arms: [
          {
            condition: `$${name} != NONE`,
            body: bodyOf(
              then(open(armStart(body, narrowed)))
            )
          }
        ]
      });
    }
  };
};
var block = () => open({
  steps: [],
  params: {},
  locals: /* @__PURE__ */ new Map(),
  own: [],
  inner: [],
  throws: [],
  writes: false
});

// src/statement/family.ts
var TextNodeTypeId = "~effect-surrealkit/TextNode";
var empty = { [TextNodeTypeId]: "empty" };
var compose = (template, fills) => {
  const given = fills;
  const holes = new Set(template.holes);
  for (const hole of Object.keys(given).sort()) {
    if (!holes.has(hole))
      throw new RangeError(`${label(template)} has no hole ${hole}`);
    checkNode(given[hole], `the fill for ${hole}`);
  }
  for (const hole of [...holes].sort()) {
    if (!Object.hasOwn(given, hole))
      throw new RangeError(
        `hole ${hole} of ${label(template)} has no fill`
      );
  }
  return {
    [TextNodeTypeId]: "compose",
    template,
    fills: given
  };
};
var choose = (axis, options) => {
  const given = options;
  const values = Object.keys(given);
  if (values.length === 0)
    throw new RangeError(`choose('${axis}', \u2026) has no options`);
  for (const value of values)
    checkNode(given[value], `the text for ${axis} = ${value}`);
  return {
    [TextNodeTypeId]: "choose",
    axis,
    options: given
  };
};
var label = (item) => item.name === void 0 ? "the template" : `\`${item.name}\``;
var nodeKind = (node) => {
  if (typeof node !== "object" || node === null) return void 0;
  if (TextNodeTypeId in node)
    return node[TextNodeTypeId];
  if (isExpr(node)) return "expr";
  const candidate = node;
  return typeof candidate.sql === "string" && Array.isArray(candidate.free) ? "text" : void 0;
};
var checkNode = (node, what) => {
  const kind = nodeKind(node);
  if (kind === void 0) {
    throw new RangeError(
      `${what} is not a text, a composite, a choice, a constant or \`empty\`; raw SurrealQL strings are refused`
    );
  }
  if (kind === "text" && (node.holes ?? []).length > 0) {
    throw new RangeError(
      `${what} is a template with holes (${(node.holes ?? []).join(", ")}): compose it first`
    );
  }
  if (kind === "expr" && Object.keys(node[ExprTypeId].params).length > 0) {
    throw new RangeError(
      `${what} is a constant that binds ${Object.keys(node[ExprTypeId].params).join(", ")}: a constant fill binds nothing`
    );
  }
};
var verified = /* @__PURE__ */ new WeakMap();
var sameList = (a, b) => {
  const x = [...new Set(a)].sort();
  const y = [...new Set(b)].sort();
  return x.length === y.length && x.every((value, index) => value === y[index]);
};
var verifyText = (item) => {
  const known = verified.get(item);
  if (known !== void 0) return known;
  const analysis = analyzeSync(item.sql);
  const differences = [];
  const compare = (field, declared, derived) => {
    if (!sameList(declared, derived))
      differences.push(
        `${field}: declared [${[...declared].sort().join(", ")}], the text has [${derived.join(", ")}]`
      );
  };
  compare("holes", item.holes ?? [], analysis.holes);
  compare("free", item.free, analysis.free);
  compare("defines", item.defines, analysis.defines);
  compare("throws", item.throws, analysis.throws);
  if (analysis.holes.length > 0) {
    if (item.scopes === void 0) {
      differences.push(
        "scopes: a template must declare the scope of each hole (regenerate it with `effect-surrealkit statements`)"
      );
    } else {
      for (const hole of analysis.holes) {
        const declared = item.scopes[hole];
        const derived = analysis.holeScopes[hole];
        if (declared === void 0 || derived === void 0) {
          differences.push(
            `scopes: hole ${hole} has no declared scope`
          );
          continue;
        }
        compare(`scopes.${hole}.bound`, declared.bound, derived.bound);
        compare(`scopes.${hole}.binds`, declared.binds, derived.binds);
      }
    }
  }
  if (differences.length > 0)
    throw new RangeError(
      `${label(item)} does not declare what its text does: ${differences.join("; ")}`
    );
  const { tokens } = lex(item.sql, DEFAULT_HOLE_DELIMITERS);
  const first = tokens[0];
  const last = tokens[tokens.length - 1];
  const offset = first?.start ?? 0;
  const body = first === void 0 || last === void 0 ? "" : item.sql.slice(first.start, last.end);
  const sites = tokens.filter((token) => token.kind === "hole").map((token) => ({
    hole: token.value,
    start: token.start - offset,
    end: token.end - offset
  }));
  const entry = { analysis, body, sites };
  verified.set(item, entry);
  return entry;
};
var selectedOption = (node, key2) => {
  const value = key2[node.axis];
  const option = value === void 0 ? void 0 : node.options[String(value)];
  if (option === void 0)
    throw new RangeError(
      `choose('${node.axis}', \u2026) has no text for ${String(value)}`
    );
  return option;
};
var render = (node, key2) => {
  switch (nodeKind(node)) {
    case "empty":
      return "";
    case "expr":
      return node[ExprTypeId].sql;
    case "choose":
      return render(selectedOption(node, key2), key2);
    case "compose": {
      const { template, fills } = node;
      const { body, sites } = verifyText(template);
      let out = "";
      let at2 = 0;
      for (const site of sites) {
        out += body.slice(at2, site.start) + render(fills[site.hole], key2);
        at2 = site.end;
      }
      return out + body.slice(at2);
    }
    default:
      return verifyText(node).body;
  }
};
var none = { free: /* @__PURE__ */ new Set(), defines: /* @__PURE__ */ new Set(), throws: /* @__PURE__ */ new Set() };
var claim = (node, key2) => {
  switch (nodeKind(node)) {
    case "empty":
    case "expr":
      return none;
    case "choose":
      return claim(selectedOption(node, key2), key2);
    case "compose": {
      const { template, fills } = node;
      verifyText(template);
      const free = /* @__PURE__ */ new Set();
      const throws = new Set(template.throws);
      const bindsByFills = /* @__PURE__ */ new Set();
      for (const [hole, fill] of Object.entries(fills)) {
        const scope = template.scopes?.[hole] ?? {
          bound: [],
          binds: []
        };
        const inner = claim(fill, key2);
        for (const name of inner.free)
          if (!scope.bound.includes(name)) free.add(name);
        for (const name of inner.defines)
          if (scope.binds.includes(name)) bindsByFills.add(name);
        for (const message of inner.throws) throws.add(message);
      }
      for (const name of template.free)
        if (!bindsByFills.has(name)) free.add(name);
      return { free, defines: new Set(template.defines), throws };
    }
    default: {
      const item = node;
      verifyText(item);
      return {
        free: new Set(item.free),
        defines: new Set(item.defines),
        throws: new Set(item.throws)
      };
    }
  }
};
var keysOf = (axes) => {
  let keys = [{}];
  for (const [axis, values] of Object.entries(axes)) {
    keys = keys.flatMap(
      (key2) => values.map((value) => ({ ...key2, [axis]: value }))
    );
  }
  return keys;
};
var describeKey = (key2) => Object.entries(key2).map(([axis, value]) => `${axis}=${String(value)}`).join(", ");
var pinName = (family2, key2) => [
  family2,
  ...Object.entries(key2).map(
    ([axis, value]) => `${axis}-${String(value).replaceAll(".", "%2E")}`
  )
].join(".");
var axesOf = (node, into) => {
  const kind = nodeKind(node);
  if (kind === "choose") {
    const choice = node;
    const options = into.get(choice.axis) ?? /* @__PURE__ */ new Set();
    for (const [value, option] of Object.entries(choice.options)) {
      options.add(value);
      axesOf(option, into);
    }
    into.set(choice.axis, options);
  } else if (kind === "compose") {
    for (const fill of Object.values(node.fills))
      axesOf(fill, into);
  }
};
var checkAxes = (name, axes, root) => {
  const used = /* @__PURE__ */ new Map();
  axesOf(root, used);
  const problems = [];
  for (const [axis, values] of Object.entries(axes)) {
    if (values.length === 0)
      problems.push(`axis \`${axis}\` has no values`);
    if (new Set(values.map(String)).size !== values.length)
      problems.push(`axis \`${axis}\` repeats a value`);
    if (!used.has(axis))
      problems.push(`axis \`${axis}\` is never chosen on`);
  }
  for (const axis of used.keys())
    if (!Object.hasOwn(axes, axis))
      problems.push(
        `choose('${axis}', \u2026) names an axis the family does not declare`
      );
  if (problems.length > 0)
    throw new RangeError(`family \`${name}\`: ${problems.join("; ")}`);
};
var listNames = (names2) => [...names2].sort().map((name) => `$${name}`).join(", ");
var family = (checkedAxes, root) => ({
  define: (contract) => {
    const name = contract.name ?? "family";
    const tree = root;
    const axes = checkedAxes;
    const params = contract.params;
    checkNode(tree, `the text of family \`${name}\``);
    checkAxes(name, axes, tree);
    const keys = keysOf(axes);
    const read = /* @__PURE__ */ new Set();
    for (const key2 of keys)
      for (const free of claim(tree, key2).free) read.add(free);
    const declared = Object.keys(params);
    const missing = [...read].filter((free) => !declared.includes(free));
    const extra = declared.filter((free) => !read.has(free));
    if (missing.length > 0 || extra.length > 0) {
      throw new RangeError(
        [
          `the bindings of family \`${name}\` do not match the names its variants read`,
          ...missing.length > 0 ? [`missing: ${listNames(missing)}`] : [],
          ...extra.length > 0 ? [`not read by any variant: ${listNames(extra)}`] : []
        ].join("; ")
      );
    }
    const built = /* @__PURE__ */ new Map();
    const indexOf = (key2) => JSON.stringify(Object.keys(axes).map((axis) => key2[axis]));
    const build = (key2) => {
      const index = indexOf(key2);
      const known = built.get(index);
      if (known !== void 0) return known;
      const where = `family \`${name}\`, variant ${describeKey(key2)}`;
      const sql = render(tree, key2);
      const analysis = analyzeSync(sql);
      const expected = claim(tree, key2);
      const problems = [];
      if (analysis.holes.length > 0)
        problems.push(
          `its text still has holes (${analysis.holes.join(", ")})`
        );
      if (analysis.kind !== "part")
        problems.push(
          "its text is a fragment, not a statement: end it with `;`"
        );
      if (!sameList([...expected.free], analysis.free))
        problems.push(
          `the composition reads [${listNames(expected.free)}], its text reads [${listNames(analysis.free)}]`
        );
      if (!sameList([...expected.throws], analysis.throws))
        problems.push(
          `the composition throws [${[...expected.throws].sort().join(", ")}], its text [${analysis.throws.join(", ")}]`
        );
      const errors = analysis.diagnostics.filter(
        (diagnostic) => diagnostic.severity === "error"
      );
      for (const error of errors)
        problems.push(
          `${error.message} at ${error.line}:${error.column}`
        );
      if (problems.length > 0)
        throw new RangeError(`${where}: ${problems.join("; ")}`);
      const writes = analysis.writes ? true : contract.writes;
      const made = make({
        name,
        sql,
        params: Object.fromEntries(
          analysis.free.map((free) => [free, params[free]])
        ),
        result: contract.result,
        slots: analysis.slots,
        valueSlot: analysis.valueSlot,
        throws: analysis.throws,
        defines: analysis.defines,
        transactional: analysis.transactional,
        tables: analysis.tables,
        functions: analysis.functions,
        openTargets: analysis.openTargets,
        ...Object.keys(analysis.uses).length > 0 && {
          uses: analysis.uses
        },
        ...writes !== void 0 && { writes }
      });
      const variant = describeKey(key2);
      const statement = variant === "" ? made : { ...made, variant };
      built.set(index, statement);
      return statement;
    };
    if (contract.build === "eager") for (const key2 of keys) build(key2);
    const select2 = (key2) => {
      const extraAxes = Object.keys(key2).filter(
        (axis) => !Object.hasOwn(axes, axis)
      );
      if (extraAxes.length > 0)
        throw new RangeError(
          `family \`${name}\` has no axis ${extraAxes.join(", ")}`
        );
      for (const [axis, values] of Object.entries(axes)) {
        if (!values.includes(key2[axis])) {
          throw new RangeError(
            `family \`${name}\`: ${String(key2[axis])} is not a value of the axis \`${axis}\` (${values.map(String).join(", ")})`
          );
        }
      }
      return build(key2);
    };
    return {
      name,
      axes,
      select: select2,
      variants: () => keys.map((key2) => {
        const statement = build(key2);
        return {
          key: key2,
          name: pinName(name, key2),
          sql: statement.sql,
          statement
        };
      })
    };
  }
});

// src/statement/group.ts
import { Schema as Schema2 } from "effect";
import {
  escapeIdent as escapeIdent2
} from "surrealdb";
var RowValueTypeId = "~effect-surrealkit/RowValue";
var groupRow = (fields, prefix, optional, all) => {
  const row = {};
  for (const [key2, declared] of Object.entries(fields)) {
    const mayBeNone = optional || isOptional(declared);
    const codec = unwrap(declared);
    const sql = `${prefix}${escapeIdent2(key2)}`;
    const nested = fieldsOf(codec);
    row[key2] = Object.assign(
      nested === void 0 ? {} : groupRow(nested, `${sql}.`, mayBeNone, all),
      { [RowValueTypeId]: { codec, sql, optional: mayBeNone, all } }
    );
  }
  return row;
};
var isRowValue = (value) => typeof value === "object" && value !== null && RowValueTypeId in value;
var aggregate = (fn, value, codec) => makeExpr(
  codec,
  `${fn}(${value === void 0 ? "" : value[RowValueTypeId].sql})`,
  {},
  Level.atom
);
var dataOf = (value) => {
  if (!isRowValue(value)) {
    throw new TypeError("an aggregate takes a field of the grouped row");
  }
  return value[RowValueTypeId];
};
var empty2 = (value) => value[RowValueTypeId].optional || value[RowValueTypeId].all;
function count(value) {
  if (value !== void 0) dataOf(value);
  return aggregate("count", value, Int);
}
var sumCodec = (value) => {
  const annotations = value[RowValueTypeId].codec.ast.annotations;
  switch (annotations?.representation?.id) {
    case "effect-surrealkit/Int":
      return Int;
    case "effect-surrealkit/Int64":
      return Int64;
    case "effect-surrealkit/Decimal":
      return empty2(value) ? Schema2.Union([Decimal, Int]) : Decimal;
    case "effect-surrealkit/SurrealNumber":
      return SurrealNumber;
    default:
      return Float;
  }
};
var sum = (value) => {
  dataOf(value);
  return aggregate(
    "math::sum",
    value,
    sumCodec(value)
  );
};
var mean = (value) => {
  dataOf(value);
  return aggregate("math::mean", value, Float);
};
var spreadCodec = (value) => holdsDecimal(value[RowValueTypeId].codec) ? FloatOrDecimal : Float;
var spread = (fn) => (value) => {
  dataOf(value);
  return aggregate(
    fn,
    value,
    spreadCodec(value)
  );
};
var stddev = spread("math::stddev");
var variance = spread("math::variance");
var median = (value) => {
  dataOf(value);
  const codec = spreadCodec(value);
  return aggregate(
    "math::median",
    value,
    empty2(value) ? Schema2.UndefinedOr(codec) : codec
  );
};
var extreme = (fn) => (value) => {
  const data = dataOf(value);
  return aggregate(
    fn,
    value,
    empty2(value) ? Schema2.Union([data.codec, Float]) : data.codec
  );
};
var min = extreme("math::min");
var max = extreme("math::max");
var time = (fn) => (value) => {
  const data = dataOf(value);
  return aggregate(
    fn,
    value,
    empty2(value) ? Schema2.UndefinedOr(data.codec) : data.codec
  );
};
var timeMin = time("time::min");
var timeMax = time("time::max");
var distinct = (fn) => (value) => {
  const data = dataOf(value);
  return aggregate(
    fn,
    value,
    Schema2.Array(data.optional ? orNone(data.codec) : data.codec)
  );
};
var arrayGroup = distinct("array::group");
var arrayDistinct = distinct("array::distinct");
var rowCount = (rows2, clause) => {
  if (!Number.isInteger(rows2) || rows2 < 0) {
    throw new RangeError(
      `${clause} takes a non-negative integer, not ${rows2}`
    );
  }
  return String(rows2);
};
var outputOf = (state) => project({ ...state.keys, ...state.aggregates });
var render2 = (state) => {
  const keys = Object.values(state.keys);
  return [
    `SELECT ${outputOf(state).sql} FROM ${state.from}`,
    ...state.where.length > 0 ? [`WHERE ${andAll(state.where)}`] : [],
    keys.length === 0 ? "GROUP ALL" : `GROUP BY ${keys.map((key2) => sqlOf(key2)).join(", ")}`,
    ...state.order.length > 0 ? [`ORDER BY ${state.order.join(", ")}`] : [],
    ...state.limit === void 0 ? [] : [`LIMIT ${state.limit}`],
    ...state.start === void 0 ? [] : [`START ${state.start}`]
  ].join(" ");
};
var finishing = (state) => ({
  orderBy: (alias, direction = "ASC") => {
    if (!Object.hasOwn(state.keys, alias) && !Object.hasOwn(state.aggregates, alias)) {
      throw new RangeError(
        `\`${alias}\` is not a group key or an aggregate of this SELECT`
      );
    }
    return finishing({
      ...state,
      order: [...state.order, `${escapeIdent2(alias)} ${direction}`]
    });
  },
  limit: (rows2) => finishing({ ...state, limit: rowCount(rows2, "LIMIT") }),
  start: (rows2) => finishing({ ...state, start: rowCount(rows2, "START") }),
  build: (name, options) => {
    const output = outputOf(state);
    const all = Object.keys(state.keys).length === 0;
    const writes = options?.writes ?? (state.pure ? false : void 0);
    const label2 = name ?? `select ${state.table.name} grouped`;
    const readers = settle(
      joinContexts([
        state.context,
        admit(
          {
            own: state.scope,
            what: `a grouped select of \`${state.table.name}\``,
            parents: "refuse",
            refused: "it reads the row of a select from a step's `where` directly under that select, and a grouped select's rows are groups"
          },
          [
            ...Object.values(state.keys),
            ...Object.values(state.aggregates)
          ]
        )
      ]),
      `statement \`${label2}\``
    );
    assertReader(readerOf(state.table), readers, `statement \`${label2}\``);
    return make({
      ...writes !== void 0 && { writes },
      name: label2,
      sql: `${render2(state)};`,
      params: mergeParams(state.params, output.params),
      result: all ? Schema2.Tuple([output.codec]) : Schema2.Array(output.codec)
    });
  }
});
var withAggregates = (state, fields) => {
  const fieldsOfRow = fieldsOf(state.table.select);
  if (fieldsOfRow === void 0) {
    throw new TypeError("a grouped SELECT takes a generated row schema");
  }
  const row = groupRow(
    fieldsOfRow,
    "",
    false,
    Object.keys(state.keys).length === 0
  );
  const returned = fields(row);
  const aggregates = {};
  for (const [alias, value] of Object.entries(returned)) {
    if (Object.hasOwn(state.keys, alias)) {
      throw new RangeError(
        `\`${alias}\` is already a key of this GROUP BY`
      );
    }
    if (!isExpr(value)) {
      throw new TypeError(
        isRowValue(value) ? `\`${alias}\` is a field that is neither grouped nor aggregated: group by it, or aggregate it (count, sum, \u2026)` : "an aggregate is an expression: inline a constant with `literal`"
      );
    }
    aggregates[alias] = value;
  }
  if (Object.keys(state.keys).length + Object.keys(aggregates).length === 0) {
    throw new RangeError("a grouped SELECT needs at least one aggregate");
  }
  return {
    ...state,
    aggregates,
    pure: false,
    params: mergeParams(
      state.params,
      ...Object.values(aggregates).map(paramsOf)
    )
  };
};
var groupBy = (base, keys) => {
  const returned = keys(base.row);
  const entries = Object.entries(returned);
  if (entries.length === 0) {
    throw new RangeError("GROUP BY needs at least one key; use groupAll()");
  }
  for (const [, key2] of entries) {
    if (!isPath(key2)) {
      throw new TypeError(
        "GROUP BY takes a field path of the row, like `row.role` or `row.address.city`"
      );
    }
  }
  const state = {
    ...base,
    keys: returned,
    aggregates: {},
    order: [],
    limit: void 0,
    start: void 0
  };
  return {
    ...finishing(state),
    aggregate: (fields) => finishing(withAggregates(state, fields))
  };
};
var groupAll = (base) => {
  const state = {
    ...base,
    keys: {},
    aggregates: {},
    order: [],
    limit: void 0,
    start: void 0
  };
  return {
    aggregate: (fields) => finishing(withAggregates(state, fields))
  };
};

// src/statement/part.ts
var checked = /* @__PURE__ */ new WeakMap();
var names = (values) => values.map((name) => `$${name}`).join(", ");
var messages = (values) => values.map((message) => `'${message}'`).join(", ");
var missingFrom = (values, other) => [...new Set(values)].filter((value) => !other.includes(value)).sort();
var quoted = (values) => values.map((value) => `\`${value}\``).join(", ");
var listDifferences = (field, declared, derived, verb) => {
  if (declared === void 0) return [];
  const out = [];
  const undeclared = missingFrom(derived, declared);
  if (undeclared.length > 0)
    out.push(
      `${field}: the text ${verb} ${quoted(undeclared)}, which is not declared`
    );
  const absent = missingFrom(declared, derived);
  if (absent.length > 0)
    out.push(
      `${field}: declared ${quoted(absent)}, which the text never ${verb}`
    );
  return out;
};
var useText = (use) => use.kind === "argument" ? `argument ${use.index} of \`${use.function}\` on line ${use.line}` : use.kind === "key" ? `key of \`${use.table}\` on line ${use.line}` : `field \`${use.table}.${use.field}\`${use.role === "assign" ? " (assigned)" : ""} on line ${use.line}`;
var useKey = (use, role = true) => use.kind === "argument" ? `a\0${use.function}\0${use.index}\0${use.line}` : use.kind === "key" ? `k\0${use.table}\0${use.line}` : `f\0${use.table}\0${use.field}\0${use.line}${role && use.role !== void 0 ? `\0${use.role}` : ""}`;
var usesDifferences = (declared, derived) => {
  if (declared === void 0) return [];
  const out = [];
  const names2 = [
    .../* @__PURE__ */ new Set([...Object.keys(declared), ...Object.keys(derived)])
  ].sort();
  for (const name of names2) {
    const mine = declared[name] ?? [];
    const theirs = derived[name] ?? [];
    const own = new Set(mine.map((use) => useKey(use)));
    const found = new Set(
      theirs.flatMap((use) => [useKey(use), useKey(use, false)])
    );
    const missing = theirs.filter(
      (use) => !own.has(useKey(use)) && !own.has(useKey(use, false))
    );
    const extra = mine.filter((use) => !found.has(useKey(use)));
    if (missing.length > 0)
      out.push(
        `uses: the text uses \`$${name}\` as ${missing.map(useText).join(", ")}, which is not declared`
      );
    if (extra.length > 0)
      out.push(
        `uses: declared \`$${name}\` as ${extra.map(useText).join(", ")}, which the text does not use it as`
      );
  }
  return out;
};
var isWordChar = (c) => c !== void 0 && (c >= "A" && c <= "Z" || c >= "a" && c <= "z" || c >= "0" && c <= "9" || c === "_");
var reads = (sql, name) => {
  const needle = `$${name}`;
  for (let at2 = sql.indexOf(needle); at2 !== -1; at2 = sql.indexOf(needle, at2 + 1)) {
    if (!isWordChar(sql[at2 + needle.length])) return true;
  }
  return false;
};
var verify = (item, label2) => {
  const known = checked.get(item);
  if (known !== void 0) return known;
  const text = item.sql.trim();
  if (!text.endsWith(";")) {
    throw new RangeError(
      `${label2} does not end with \`;\`, so the next part would run into it`
    );
  }
  if (!Number.isInteger(item.slots) || item.slots < 0) {
    throw new RangeError(`${label2} returns ${item.slots} results`);
  }
  for (const name of [...item.free, ...item.defines]) {
    assertIdentifier(name);
    if (!reads(text, name)) {
      throw new RangeError(
        `${label2} lists \`$${name}\`, which its text never mentions`
      );
    }
  }
  const analysis = analyzeSync(item.sql);
  if (analysis.holes.length > 0) {
    throw new RangeError(
      `${label2} has holes (${analysis.holes.join(", ")}): a template is not a part; fill its holes and declare the filled text`
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
  if (item.valueSlot !== void 0 && item.valueSlot !== analysis.valueSlot) {
    differences.push(
      `valueSlot: declared ${item.valueSlot}, the text's value is result ${analysis.valueSlot}`
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
  differences.push(
    ...listDifferences(
      "tables.read",
      item.tables?.read,
      analysis.tables.read,
      "reads"
    ),
    ...listDifferences(
      "tables.written",
      item.tables?.written,
      analysis.tables.written,
      "writes"
    ),
    ...listDifferences(
      "functions",
      item.functions,
      analysis.functions,
      "calls"
    )
  );
  if (item.openTargets !== void 0 && item.openTargets !== analysis.openTargets) {
    differences.push(
      analysis.openTargets ? "openTargets: declared false, a target of the text is not a static table name" : "openTargets: declared true, every target of the text is a static table name"
    );
  }
  differences.push(...usesDifferences(item.uses, analysis.uses));
  for (const name of Object.keys(item.binds ?? {}).sort()) {
    if (analysis.uses[name] === void 0)
      differences.push(
        `binds: declared \`$${name}\`, which the text never uses as an argument, a key or a field`
      );
  }
  for (const [name, at2] of Object.entries(item.rejectsNone ?? {}).sort(
    ([a], [b]) => a < b ? -1 : a > b ? 1 : 0
  )) {
    const assigned = (analysis.uses[name] ?? []).some(
      (use) => use.kind === "field" && use.role === "assign" && use.table === at2.table && use.field === at2.field
    );
    if (!assigned)
      differences.push(
        `rejectsNone: declared \`$${name}\` as assigned to \`${at2.table}.${at2.field}\`, which the text never assigns it to`
      );
  }
  if (differences.length > 0) {
    throw new RangeError(
      `${label2} does not declare what its text does: ${differences.join("; ")}`
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
    ...options.valueSlot !== void 0 && {
      valueSlot: options.valueSlot
    },
    throws: options.throws ?? [],
    ...options.throwsAt !== void 0 && { throwsAt: options.throwsAt },
    ...options.writes !== void 0 && { writes: options.writes },
    ...options.tables !== void 0 && { tables: options.tables },
    ...options.functions !== void 0 && {
      functions: options.functions
    },
    ...options.openTargets !== void 0 && {
      openTargets: options.openTargets
    },
    ...options.uses !== void 0 && { uses: options.uses },
    ...options.binds !== void 0 && { binds: options.binds },
    ...options.rejectsNone !== void 0 && {
      rejectsNone: options.rejectsNone
    }
  };
  const analysis = verify(declared, nameOf(options.name, "part"));
  const result = {
    ...declared,
    ...analysis.writes && { writes: true },
    tables: analysis.tables,
    functions: analysis.functions,
    openTargets: analysis.openTargets,
    uses: analysis.uses
  };
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
var usesOf = (analyses, parts) => {
  const defined = /* @__PURE__ */ new Set();
  const merged = /* @__PURE__ */ new Map();
  for (const [index, analysis] of analyses.entries()) {
    for (const [name, uses] of Object.entries(analysis.uses)) {
      if (defined.has(name)) continue;
      const into = merged.get(name) ?? /* @__PURE__ */ new Map();
      for (const use of uses) into.set(useKey(use), use);
      merged.set(name, into);
    }
    for (const name of parts[index].defines) defined.add(name);
  }
  if (merged.size === 0) return void 0;
  const out = {};
  for (const name of [...merged.keys()].sort()) {
    out[name] = [...merged.get(name).entries()].sort(
      ([a, x], [b, y]) => x.line !== y.line ? x.line - y.line : a < b ? -1 : a > b ? 1 : 0
    ).map(([, use]) => use);
  }
  return out;
};
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
    const label2 = contract.name ?? "sequence";
    const throwSites = throwSitesOf(parts);
    const expected = unboundOf(parts);
    const declared = Object.keys(contract.params);
    const missing = expected.filter((name) => !declared.includes(name));
    const extra = declared.filter((name) => !expected.includes(name));
    if (missing.length > 0 || extra.length > 0) {
      throw new RangeError(
        [
          `the bindings of sequence \`${label2}\` do not match the names it reads`,
          ...missing.length > 0 ? [`missing: ${names(missing)}`] : [],
          ...extra.length > 0 ? [`not read by any part: ${names(extra)}`] : []
        ].join("; ")
      );
    }
    const derived = writesOf(parts, analyses);
    if (contract.writes !== void 0 && derived !== void 0 && contract.writes !== derived) {
      throw new RangeError(
        contract.writes ? `sequence \`${label2}\` is declared to write, but every part is declared not to` : `sequence \`${label2}\` is declared not to write, but it writes`
      );
    }
    const writes = contract.writes ?? derived;
    const uses = usesOf(analyses, parts);
    const slots = parts.reduce((total, item) => total + item.slots, 0);
    let valueSlot = slots;
    let offset = 0;
    for (const [index, analysis] of analyses.entries()) {
      if (analysis.valueSlot > 0) valueSlot = offset + analysis.valueSlot;
      offset += parts[index].slots;
    }
    return make({
      name: label2,
      sql: parts.map((item) => item.sql.trim()).join("\n"),
      params: contract.params,
      result: contract.result,
      slots,
      valueSlot,
      throws: [
        ...new Set(parts.flatMap((item) => item.throws))
      ],
      defines: [...new Set(parts.flatMap((item) => item.defines))].sort(),
      transactional: analyses.some((analysis) => analysis.transactional),
      tables: {
        read: [
          ...new Set(analyses.flatMap((a) => a.tables.read))
        ].sort(),
        written: [
          ...new Set(analyses.flatMap((a) => a.tables.written))
        ].sort()
      },
      functions: [
        ...new Set(analyses.flatMap((a) => a.functions))
      ].sort(),
      openTargets: analyses.some((analysis) => analysis.openTargets),
      ...uses !== void 0 && { uses },
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

// src/statement/record.ts
var part2 = (value) => {
  if (isExpr(value)) return value;
  if (typeof value === "object" && value !== null) {
    throw new TypeError(
      "a key part is an expression or a constant; nest no array or object inside a key"
    );
  }
  return literal(value);
};
var keyOf = (key2) => {
  if (isExpr(key2) || typeof key2 !== "object" || key2 === null) {
    const value = part2(key2);
    return { sql: operand(value), params: paramsOf(value), parts: [value] };
  }
  if (Array.isArray(key2)) {
    if (key2.length === 0) {
      throw new RangeError("an array key needs at least one part");
    }
    const parts = key2.map(part2);
    return {
      sql: `[${parts.map(operand).join(", ")}]`,
      params: mergeParams(...parts.map(paramsOf)),
      parts
    };
  }
  const entries = Object.entries(key2).map(
    ([name, value]) => [name, part2(value)]
  );
  if (entries.length === 0) {
    throw new RangeError("an object key needs at least one part");
  }
  return {
    sql: `{ ${entries.map(
      ([name, value]) => `${JSON.stringify(name)}: ${operand(value)}`
    ).join(", ")} }`,
    params: mergeParams(...entries.map(([, value]) => paramsOf(value))),
    parts: entries.map(([, value]) => value)
  };
};
var typeRecord = (table, inner) => `type::record(${sqlOf(literal(table.name))}, ${inner})`;
var recordId = (table, key2) => {
  const built = keyOf(key2);
  const id = derive(
    table.id,
    typeRecord(table, built.sql),
    Level.atom,
    built.parts,
    built.params
  );
  builtIds.add(id);
  return id;
};
var builtIds = /* @__PURE__ */ new WeakSet();
var isBuiltRecordId = (expr) => typeof expr === "object" && expr !== null && builtIds.has(expr);
var IdRangeTypeId = "~effect-surrealkit/IdRange";
var isIdRange = (value) => typeof value === "object" && value !== null && IdRangeTypeId in value;
var idRange = (table, bounds) => {
  const given = bounds;
  if (given.from !== void 0 && given.after !== void 0) {
    throw new RangeError(
      "a range starts `from` a key (included) or `after` one (excluded), not both"
    );
  }
  if (given.to !== void 0 && given.through !== void 0) {
    throw new RangeError(
      "a range ends `to` a key (excluded) or `through` one (included), not both"
    );
  }
  const start2 = given.from ?? given.after;
  const end = given.to ?? given.through;
  const low = start2 === void 0 ? void 0 : keyOf(start2);
  const high = end === void 0 ? void 0 : keyOf(end);
  const sql = `${low?.sql ?? ""}${given.after === void 0 ? "" : ">"}..${given.through === void 0 ? "" : "="}${high?.sql ?? ""}`;
  return {
    [IdRangeTypeId]: {
      table: table.name,
      sql: typeRecord(table, sql),
      params: mergeParams(
        low?.params ?? {},
        high?.params ?? {}
      ),
      parts: [...low?.parts ?? [], ...high?.parts ?? []]
    }
  };
};

// src/statement/search.ts
import { Schema as Schema3, SchemaAST as SchemaAST2, SchemaTransformation } from "effect";
var U32 = 4294967295;
var assertRef = (ref) => {
  if (!Number.isInteger(ref) || ref < 0 || ref > 255) {
    throw new RangeError(
      `${ref} is not a match reference: use an integer from 0 to 255`
    );
  }
};
var assertCount = (value, what) => {
  if (!Number.isInteger(value) || value < 1 || value > U32) {
    throw new RangeError(
      `${what} takes a positive integer up to ${U32}, not ${value}`
    );
  }
  return String(value);
};
var indexesOn = (table, field, kinds) => Object.entries(table.indexes ?? {}).flatMap(
  ([name, index]) => kinds.includes(index.type) && index.columns.length === 1 && index.columns[0]?.join(".") === field ? [{ name, ...index }] : []
);
var fieldExpr = (table, field) => {
  let node = rowExprs(table);
  for (const part3 of field.split(".")) {
    node = typeof node === "object" && node !== null && Object.hasOwn(node, part3) ? node[part3] : void 0;
  }
  if (!isPath(node)) {
    throw new TypeError(
      `\`${table.name}\` has no field \`${field}\` in its select schema`
    );
  }
  return node;
};
var MatchTypeId = "~effect-surrealkit/Match";
var match = (table, field, terms, options) => {
  const path = field;
  const [index] = indexesOn(table, path, ["fulltext"]);
  if (index === void 0) {
    throw new TypeError(
      `\`${table.name}\` has no FULLTEXT index on \`${path}\``
    );
  }
  const target = fieldExpr(table, path);
  const ref = options?.ref;
  if (ref !== void 0) assertRef(ref);
  const operator = options?.operator;
  if (operator !== void 0 && operator !== "AND" && operator !== "OR") {
    throw new RangeError(
      `a match operator is \`AND\` or \`OR\`, not ${String(operator)}`
    );
  }
  const query = isExpr(terms) ? terms : literal(terms);
  const between = [ref, operator].filter((part3) => part3 !== void 0);
  const sql = `${sqlOf(target)} @${between.join(",")}@ ${operand(query)}`;
  const params = withRefs(
    mergeParams(paramsOf(query)),
    ref === void 0 ? void 0 : { matches: /* @__PURE__ */ new Map([[ref, sqlOf(target)]]) }
  );
  return {
    ...derive(
      Schema3.Boolean,
      sql,
      Level.comparison,
      [target, query],
      params
    ),
    [MatchTypeId]: {
      ref,
      field: codecOf(target),
      highlights: index.fulltext?.highlights === true,
      sql
    }
  };
};
var refOf = (target) => {
  const data = target[MatchTypeId];
  if (data?.ref === void 0) {
    throw new TypeError(
      "this match has no reference number: give it one, as in `match(table, field, terms, { ref: 1 })`"
    );
  }
  return data.ref;
};
var reading = (codec, sql, ref) => makeExpr(
  codec,
  sql,
  withRefs({}, { reads: /* @__PURE__ */ new Set([ref]) }),
  Level.atom
);
var score = (target) => {
  const ref = refOf(target);
  return reading(Float, `search::score(${ref})`, ref);
};
var MarkedText = SurrealString;
var MarkedOptionalText = Schema3.UndefinedOr(SurrealString);
var MarkedList = Schema3.Union([
  Schema3.Array(SurrealString),
  SurrealString,
  Schema3.Undefined
]).pipe(
  Schema3.decodeTo(
    Schema3.Array(SurrealString),
    SchemaTransformation.transform({
      decode: (answer) => answer === void 0 ? [] : typeof answer === "string" ? [answer] : answer,
      encode: (list) => list
    })
  )
);
var MarkedAny = Schema3.UndefinedOr(
  Schema3.Union([SurrealString, Schema3.Array(SurrealString)])
);
var textShape = (ast, seen = /* @__PURE__ */ new Set()) => {
  const nothing = { list: false, text: false, none: false };
  if (seen.has(ast)) return nothing;
  seen.add(ast);
  if (SchemaAST2.isUndefined(ast) || SchemaAST2.isNull(ast)) {
    return { ...nothing, none: true };
  }
  if (SchemaAST2.isUnknown(ast) || SchemaAST2.isAny(ast)) {
    return { list: true, text: true, none: true };
  }
  if (SchemaAST2.isArrays(ast)) return { ...nothing, list: true };
  if (SchemaAST2.isSuspend(ast)) return textShape(ast.thunk(), seen);
  if (SchemaAST2.isUnion(ast)) {
    const members = ast.types.map((member) => textShape(member, seen));
    return {
      list: members.some((member) => member.list),
      text: members.some((member) => member.text),
      none: members.some((member) => member.none)
    };
  }
  return { ...nothing, text: true };
};
var markedCodec = (field) => {
  const shape = textShape(field.ast);
  if (shape.list && !shape.text) return MarkedList;
  if (shape.text && !shape.list) {
    return shape.none ? MarkedOptionalText : MarkedText;
  }
  return MarkedAny;
};
var highlight = (target, open2, close) => {
  const ref = refOf(target);
  const data = target[MatchTypeId];
  if (!data.highlights) {
    throw new TypeError(
      "the FULLTEXT index of this match keeps no HIGHLIGHTS: define the index with HIGHLIGHTS"
    );
  }
  const marks = [open2, close].map(
    (mark) => isExpr(mark) ? mark : literal(mark)
  );
  return derive(
    markedCodec(data.field),
    `search::highlight(${marks.map(operand).join(", ")}, ${ref})`,
    Level.atom,
    marks,
    withRefs(mergeParams(...marks.map(paramsOf)), {
      reads: /* @__PURE__ */ new Set([ref])
    })
  );
};
var Offsets = Schema3.UndefinedOr(
  Schema3.Record(
    Schema3.String,
    Schema3.Array(Schema3.Struct({ s: Int, e: Int }))
  )
);
var offsets = (target) => {
  const ref = refOf(target);
  return reading(Offsets, `search::offsets(${ref})`, ref);
};
var KnnTypeId = "~effect-surrealkit/Knn";
var distances = /* @__PURE__ */ new Set([
  "CHEBYSHEV",
  "COSINE",
  "COSINE_NORMALIZED",
  "EUCLIDEAN",
  "HAMMING",
  "INNER_PRODUCT",
  "MANHATTAN"
]);
var differing = {
  JACCARD: "SurrealDB 3.3 answers a measure of the sets of values (0 for most vectors of floats) and 4.0 one minus the weighted Jaccard similarity",
  PEARSON: "SurrealDB 3.3 answers the Pearson correlation itself as the distance, so its nearest rows are the least correlated, and 4.0 answers one minus it"
};
var distanceText = (distance) => {
  if (typeof distance === "string" && distances.has(distance)) {
    return distance;
  }
  if (typeof distance === "string" && Object.hasOwn(differing, distance)) {
    throw new RangeError(
      `${distance} is refused: ${differing[distance]}; the same search finds other rows on each`
    );
  }
  if (Array.isArray(distance) && distance[0] === "MINKOWSKI") {
    const order = distance[1];
    if (typeof order === "number" && Number.isFinite(order) && order > 0) {
      return `MINKOWSKI ${order}`;
    }
  }
  throw new RangeError(
    `${JSON.stringify(distance)} is not a distance: use one of ${[...distances].join(", ")} or ['MINKOWSKI', p] with p > 0`
  );
};
var lengthChecked = /* @__PURE__ */ new WeakMap();
var withDimension = (codec, dimensions) => {
  if (dimensions.length === 0) return codec;
  const id = dimensions.join(",");
  const known = lengthChecked.get(codec) ?? /* @__PURE__ */ new Map();
  lengthChecked.set(codec, known);
  const existing = known.get(id);
  if (existing !== void 0) return existing;
  const [first, ...rest] = dimensions.map(
    (dimension) => Schema3.isBetweenLength(dimension, dimension, {
      expected: `a vector of ${dimension} numbers (the index dimension)`
    })
  );
  if (first === void 0) return codec;
  const checked2 = codec.check(first, ...rest);
  known.set(id, checked2);
  return checked2;
};
var knn = (table, field, vector, options) => {
  const path = field;
  const given = options;
  const indexed = "ef" in given;
  const indexes = indexesOn(table, path, ["hnsw", "diskann"]);
  if (indexed && indexes.length === 0) {
    throw new TypeError(
      `\`${table.name}\` has no HNSW or DISKANN index on \`${path}\`: search without one by naming a distance, as in \`{ k, distance: 'COSINE' }\``
    );
  }
  const target = fieldExpr(table, path);
  const k = assertCount(given.k, "the neighbour count");
  const how = "ef" in given ? assertCount(given.ef, "the search effort") : distanceText(given.distance);
  const dimensions = [
    ...new Set(indexes.flatMap((index) => index.vector?.dimension ?? []))
  ];
  let bound;
  if (typeof vector === "string") {
    bound = param(vector, withDimension(Schema3.Array(Float), dimensions));
  } else {
    const own = vector;
    const names2 = Object.keys(paramsOf(own));
    const name = names2[0];
    if (names2.length !== 1 || name === void 0 || sqlOf(own) !== `$${name}`) {
      throw new TypeError(
        "the query vector is a binding (`param(name, codec)`) or a binding name: SurrealDB compares it as a value, and its length is checked when it is encoded"
      );
    }
    const codec = withDimension(codecOf(own), dimensions);
    bound = makeExpr(codec, sqlOf(own), { [name]: codec }, Level.atom);
  }
  const sql = `${sqlOf(target)} <|${k},${how}|> ${operand(bound)}`;
  return {
    ...derive(
      Schema3.Boolean,
      sql,
      Level.comparison,
      [target, bound],
      withRefs(mergeParams(paramsOf(bound)), { knn: /* @__PURE__ */ new Set([sql]) })
    ),
    [KnnTypeId]: { sql }
  };
};
var knnDistance = (_search) => makeExpr(
  Float,
  "vector::distance::knn()",
  withRefs({}, { distance: true }),
  Level.atom
);
var rowAst = (list) => {
  let node = list.ast;
  if (SchemaAST2.isArrays(node) && node.rest[0] !== void 0) {
    node = node.rest[0];
    while (SchemaAST2.isDeclaration(node) && node.typeParameters[0]) {
      node = node.typeParameters[0];
    }
    if (SchemaAST2.isObjects(node)) return node;
  }
  throw new TypeError(
    "a fused list is a list of rows, such as `select(\u2026).project(\u2026).toExpr()`"
  );
};
var union2 = (codecs) => {
  const distinct2 = [...new Set(codecs)];
  return distinct2.length === 1 && distinct2[0] !== void 0 ? distinct2[0] : Schema3.Union(distinct2);
};
var fusedCodec = (lists, scoreField) => {
  const fields = /* @__PURE__ */ new Map();
  const asts = /* @__PURE__ */ new Map();
  for (const list of lists) {
    const row = rowAst(codecOf(list));
    if (!row.propertySignatures.some((field) => field.name === "id")) {
      throw new TypeError(
        `the fused list \`${sqlOf(list)}\` has rows without an \`id\`; SurrealDB leaves such rows out`
      );
    }
    for (const { name, type } of row.propertySignatures) {
      if (typeof name !== "string") continue;
      if (name === scoreField) {
        throw new RangeError(
          `a fused list has a field \`${scoreField}\`, which the fused score replaces; rename it`
        );
      }
      const codec = asts.get(type) ?? Schema3.make(type);
      asts.set(type, codec);
      fields.set(name, [...fields.get(name) ?? [], codec]);
    }
  }
  const struct = {};
  for (const [name, codecs] of fields) {
    struct[name] = name === "id" ? union2(codecs) : Schema3.optionalKey(union2(codecs));
  }
  struct[scoreField] = Float;
  return Schema3.Array(
    NoneAsAbsent(Schema3.Struct(struct))
  );
};
var countText = (value, what, minimum) => {
  if (isExpr(value)) return value;
  if (!Number.isInteger(value) || value < minimum) {
    throw new RangeError(
      `${what} takes an integer of at least ${minimum}, not ${value}`
    );
  }
  return literal(value);
};
var listsText = (lists) => {
  if (lists.length < 2) {
    throw new RangeError("a fused ranking takes two or more lists");
  }
  return `[${lists.map(sqlOf).join(", ")}]`;
};
var rrf = (lists, options) => {
  const all = lists;
  const limit = countText(options.limit, "the fused limit", 1);
  const k = countText(options.k ?? 60, "the rank constant", 0);
  return derive(
    fusedCodec(all, "rrf_score"),
    `search::rrf(${listsText(all)}, ${operand(limit)}, ${operand(k)})`,
    Level.atom,
    [...all, limit, k]
  );
};
var linear = (lists, options) => {
  const all = lists;
  const given = options.weights;
  let weights;
  if (isExpr(given)) {
    weights = given;
  } else {
    if (given.length !== all.length) {
      throw new RangeError(
        `there are ${all.length} lists and ${given.length} weights; give one weight per list`
      );
    }
    weights = literal([...given], Schema3.Array(Schema3.Finite));
  }
  if (options.normalisation !== "minmax" && options.normalisation !== "zscore") {
    throw new RangeError(
      `normalisation is \`minmax\` or \`zscore\`, not ${String(options.normalisation)}`
    );
  }
  const limit = countText(options.limit, "the fused limit", 1);
  return derive(
    fusedCodec(all, "linear_score"),
    `search::linear(${listsText(all)}, ${operand(weights)}, ${operand(limit)}, ${sqlOf(literal(options.normalisation))})`,
    Level.atom,
    [...all, weights, limit]
  );
};
var evaluate = (expr, name = "evaluate", options) => {
  admit(
    {
      own: void 0,
      what: "a bare `RETURN`",
      parents: "refuse",
      refused: "SurrealDB 3.3 and 4.0 bind `$parent` differently under a bare `RETURN`, which has no enclosing select"
    },
    [expr]
  );
  return make({
    ...options?.writes !== void 0 && { writes: options.writes },
    name,
    sql: `RETURN ${sqlOf(expr)};`,
    params: paramsOf(expr),
    result: codecOf(expr)
  });
};

// src/statement/select.ts
import { Schema as Schema5, SchemaAST as SchemaAST3 } from "effect";
import { escapeIdent as escapeIdent4 } from "surrealdb";

// src/statement/fetch.ts
import { Schema as Schema4 } from "effect";
import { escapeIdent as escapeIdent3 } from "surrealdb";
var treeOf = (paths) => {
  const root = {};
  for (const path of paths) {
    let node = root;
    for (const segment of path.split(".")) {
      node[segment] ??= {};
      node = node[segment];
    }
  }
  return root;
};
var fetchPath = (path) => {
  const segments = path.split(".");
  if (segments.some((segment) => segment.length === 0)) {
    throw new RangeError(
      `\`${path}\` is not a FETCH path: name fields separated by dots`
    );
  }
  return segments.map((segment) => escapeIdent3(segment)).join(".");
};
var rebuildRow = (row, fields) => "records" in row && "schema" in row ? Schema4.StructWithRest(
  Schema4.Struct(fields),
  row.records
) : Schema4.Struct(fields);
var targetsOf = (store, tables, path) => {
  if (tables === "any") {
    throw new TypeError(
      `\`${path}\` can point at any table (\`record\`), so FETCH has no row type for it`
    );
  }
  return tables.map((name) => {
    const table = store.tables[name];
    if (table === void 0) {
      throw new RangeError(
        `\`${path}\` points at \`${name}\`, which is not a table of this store`
      );
    }
    return table;
  });
};
var fetchedRow = (store, tables, tree, path) => union(
  targetsOf(store, tables, path).map(
    (table) => Object.keys(tree).length === 0 ? rowCodec(table.select) : rowCodec(
      rebuildRow(
        table.select,
        rewrite(store, selectFields(table), tree, path)
      )
    )
  )
);
var rewriteValue = (store, codec, tree, path) => {
  const shape = linkShape(codec);
  if (shape !== void 0) {
    const inner = shape.kind === "optional" ? shape.of : shape;
    if (inner.kind === "id") {
      return {
        codec: fetchedRow(store, inner.tables, tree, path),
        absent: true
      };
    }
    if (inner.kind === "list" && inner.of.kind !== "list") {
      const row = fetchedRow(store, shapeTables(inner.of), tree, path);
      const list = Schema4.Array(
        Schema4.UndefinedOr(row)
      );
      return {
        codec: shape.kind === "optional" ? Schema4.UndefinedOr(list) : list,
        absent: false
      };
    }
  }
  const nested = fieldsOf(codec);
  if (nested !== void 0 && Object.keys(tree).length > 0) {
    return {
      codec: rebuildRow(codec, rewrite(store, nested, tree, path)),
      absent: false
    };
  }
  if ("value" in codec && Schema4.isSchema(codec.value) && Object.keys(tree).length > 0) {
    const item = fieldsOf(codec.value);
    if (item !== void 0) {
      return {
        codec: Schema4.Array(
          rebuildRow(
            codec.value,
            rewrite(store, item, tree, path)
          )
        ),
        absent: false
      };
    }
  }
  throw new TypeError(
    `\`${path}\` is not a record link, so FETCH has nothing to replace`
  );
};
var rewrite = (store, fields, tree, prefix) => {
  const next = { ...fields };
  for (const [key2, subtree] of Object.entries(tree)) {
    const path = prefix === "" ? key2 : `${prefix}.${key2}`;
    const declared = fields[key2];
    if (declared === void 0) {
      throw new RangeError(
        path === key2 ? `\`${key2}\` is not a field of what the select returns` : `\`${path}\`: \`${key2}\` is not a field of what the select returns`
      );
    }
    const optional = isOptionalField(declared);
    const { codec, absent } = rewriteValue(
      store,
      unwrapField(declared),
      subtree,
      path
    );
    next[key2] = absent ? Schema4.optional(codec) : optional ? Schema4.optionalKey(codec) : codec;
  }
  return next;
};
var fetchedCodec = (store, base, paths) => {
  for (const path of paths) fetchPath(path);
  const tree = treeOf(paths);
  switch (base.kind) {
    case "row":
      return rowCodec(
        rebuildRow(
          base.table.select,
          rewrite(store, selectFields(base.table), tree, "")
        )
      );
    case "projection":
      return projectedCodec(
        rewrite(store, base.fields, tree, "")
      );
    case "value":
      throw new TypeError(
        "FETCH replaces fields of the row or of a projection; `SELECT VALUE` has none: project the value instead"
      );
  }
};

// src/statement/select.ts
var ownReader = (state, what) => {
  assertReader(readerOf(state.table), state.context?.readers, what);
  if (state.context?.readers === void 0) return state.context;
  const { readers: _, ...rest } = state.context;
  return Object.keys(rest).length === 0 ? void 0 : rest;
};
var siteOf = (state) => ({
  own: state.scope,
  what: `a select of \`${state.table.name}\``,
  parents: "select"
});
var reading2 = (state, exprs, callback = true) => {
  const context = joinContexts([
    state.context,
    callback ? admit(siteOf(state), exprs) : joinContexts(exprs.map(contextOf))
  ]);
  return {
    ...state,
    ...context !== void 0 && { context }
  };
};
var valueHasNoNames = "SELECT VALUE returns one value per row, with no names to order by; order by a field path of the stored row with `orderBy`";
var missingName = (state, name) => {
  const missing = `\`${name}\` is not a name the result row holds`;
  if (state.base.kind === "value") return `${missing}: ${valueHasNoNames}`;
  const holds = state.fields === "*" ? Object.hasOwn(fieldsOf(state.table.select) ?? {}, name) && !(state.omit ?? []).includes(name) : state.aliases.has(name);
  return holds ? void 0 : missing;
};
var assertOrder = (state) => {
  for (const { alias, path, sql } of state.order) {
    if (alias !== void 0) {
      const missing = missingName(state, alias);
      if (missing !== void 0) {
        throw new RangeError(`ORDER BY \`${alias}\`: ${missing}`);
      }
    }
    if (path === void 0) continue;
    const source = state.aliases.get(path.root);
    if (source !== void 0 && source !== path.rootSql) {
      throw new RangeError(
        `the projection alias \`${path.root}\` stands for \`${source}\` and shadows the stored field \`${path.root}\` that ORDER BY ${sql} reads, so SurrealDB would order by the alias; rename the alias`
      );
    }
  }
};
var count2 = (value, clause) => {
  if (isExpr(value)) return sqlOf(value);
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(
      `${clause} takes a non-negative integer, not ${value}`
    );
  }
  return String(value);
};
var render3 = (state) => {
  assertOrder(state);
  const limit = state.only && readsMany(state) ? "1" : state.limit;
  return [
    `SELECT ${state.fields}${state.omit === void 0 || state.omit.length === 0 ? "" : ` OMIT ${state.omit.map((field) => escapeIdent4(field)).join(", ")}`} FROM ${state.only ? "ONLY " : ""}${state.source === void 0 ? tableName(state.table) : sqlOf(state.source)}`,
    ...state.index === void 0 ? [] : [`WITH INDEX ${escapeIdent4(state.index)}`],
    ...state.where.length > 0 ? [`WHERE ${andAll(state.where)}`] : [],
    ...state.split === void 0 ? [] : [`SPLIT ${splitTarget(state, state.split)}`],
    ...state.order.length > 0 ? [
      `ORDER BY ${state.order.map(({ direction, sql }) => `${sql} ${direction}`).join(", ")}`
    ] : [],
    ...limit === void 0 ? [] : [`LIMIT ${limit}`],
    ...state.start === void 0 ? [] : [`START ${state.start}`],
    ...state.fetch.length > 0 ? [`FETCH ${state.fetch.map(fetchPath).join(", ")}`] : [],
    ...state.lock === true ? ["FOR UPDATE"] : []
  ].join(" ");
};
var assertNoFetch = (state, method) => {
  if (state.fetch.length > 0) {
    throw new RangeError(
      `FETCH ${state.fetch.join(", ")} names fields of what the select returns; call \`${method}\` before \`fetch\``
    );
  }
};
var splitTarget = (state, field) => {
  const sql = escapeIdent4(field);
  if (state.fields !== "*" && state.aliases.get(field) !== sql) {
    throw new RangeError(
      `the SPLIT field \`${field}\` must be projected under its own name (\`${field}: row.${field}\`)`
    );
  }
  return sql;
};
var baseOf = (state) => {
  if (state.split !== void 0 || state.omit !== void 0 || state.fetch.length > 0 || state.fields !== "*" || state.only || state.order.length > 0 || state.limit !== void 0 || state.start !== void 0) {
    throw new RangeError(
      "group a SELECT before projecting, ordering, limiting, fetching it or reading ONLY one row"
    );
  }
  return {
    table: state.table,
    scope: state.scope,
    ...state.context !== void 0 && { context: state.context },
    row: state.row,
    from: state.source === void 0 ? tableName(state.table) : sqlOf(state.source),
    where: state.where,
    params: state.params,
    pure: state.pure
  };
};
var rebuild = (row, fields) => "records" in row && "schema" in row ? Schema5.StructWithRest(
  Schema5.Struct(fields),
  row.records
) : Schema5.Struct(fields);
var readsMany = (state) => state.source === void 0 || state.range === true;
var resultOf = (state) => state.only ? Schema5.UndefinedOr(state.out) : Schema5.Array(state.out);
var parameter = /^\$[A-Za-z_][A-Za-z0-9_]*$/u;
var recordLiteral = /^r"(?:[^"\\]|\\.)*"$/u;
var lockable = (id) => parameter.test(sqlOf(id)) || recordLiteral.test(sqlOf(id)) || isBuiltRecordId(id);
var builder = (state) => {
  const row = state.row;
  const bounded = (rows2) => isExpr(rows2) ? mergeParams(state.params, paramsOf(rows2)) : state.params;
  return {
    where: (predicate) => {
      if (state.split !== void 0) {
        throw new RangeError(
          "WHERE reads the stored row, before SPLIT; add conditions before `.split(\u2026)`"
        );
      }
      const condition = predicate(row);
      return builder({
        ...reading2(state, [condition]),
        where: [...state.where, condition],
        pure: false,
        params: mergeParams(state.params, paramsOf(condition))
      });
    },
    orderBy: (key2, direction = "ASC") => {
      const by = key2(row);
      const path = isPath(by) ? pathOf(by) : void 0;
      if (path === void 0) {
        throw new TypeError(
          "ORDER BY takes a field path of the row (`row.name`, `row.address.city`, `at(row.pins, 0)`); SurrealDB parses nothing else there"
        );
      }
      return builder({
        ...reading2(state, [by]),
        order: [
          ...state.order,
          { sql: sqlOf(by), direction, path }
        ]
      });
    },
    orderByAlias: (alias, direction = "ASC") => {
      const name = alias;
      const missing = missingName(state, name);
      if (missing !== void 0) throw new RangeError(missing);
      return builder({
        ...state,
        order: [
          ...state.order,
          { sql: escapeIdent4(name), direction, alias: name }
        ]
      });
    },
    limit: (rows2) => {
      if (state.only && readsMany(state)) {
        throw new RangeError(
          "a SELECT \u2026 FROM ONLY a table already reads at most one row"
        );
      }
      return builder({
        ...reading2(state, isExpr(rows2) ? [rows2] : [], false),
        limit: count2(rows2, "LIMIT"),
        params: bounded(rows2),
        pure: state.pure && !isExpr(rows2)
      });
    },
    start: (rows2) => builder({
      ...reading2(state, isExpr(rows2) ? [rows2] : [], false),
      start: count2(rows2, "START"),
      params: bounded(rows2),
      pure: state.pure && !isExpr(rows2)
    }),
    project: (fields) => {
      if (state.omit !== void 0) {
        throw new RangeError(
          "OMIT leaves fields out of `SELECT *`; a projection names the fields it keeps instead"
        );
      }
      const projection = fields(row);
      const projected = project(projection);
      assertNoFetch(state, "project");
      return builder({
        ...reading2(state, Object.values(projection)),
        base: {
          kind: "projection",
          fields: Object.fromEntries(
            Object.entries(projection).map(([alias, value]) => [
              alias,
              codecOf(value)
            ])
          )
        },
        fields: projected.sql,
        aliases: projected.aliases,
        pure: state.pure && Object.values(projection).every(isPath),
        out: projected.codec,
        params: mergeParams(state.params, projected.params)
      });
    },
    value: (pick) => {
      if (state.omit !== void 0 || state.split !== void 0) {
        throw new RangeError(
          "`SELECT VALUE` takes no OMIT or SPLIT here; project the field instead"
        );
      }
      const picked = pick(row);
      assertNoFetch(state, "value");
      return builder({
        ...reading2(state, [picked]),
        base: { kind: "value" },
        fields: `VALUE ${sqlOf(picked)}`,
        aliases: /* @__PURE__ */ new Map(),
        pure: state.pure && isPath(picked),
        out: rowCodec(codecOf(picked)),
        params: mergeParams(state.params, paramsOf(picked))
      });
    },
    fetch: (store, ...paths) => {
      const fetch = [...state.fetch, ...paths];
      const context = joinContexts([state.context, viewOf(store)]);
      return builder({
        ...state,
        ...context !== void 0 && { context },
        fetch,
        out: fetchedCodec(store, state.base, fetch)
      });
    },
    only: () => {
      if (readsMany(state) && state.limit !== void 0) {
        throw new RangeError(
          "a SELECT \u2026 FROM ONLY a table reads at most one row; drop the LIMIT"
        );
      }
      return builder({ ...state, only: true });
    },
    omit: (...names2) => {
      assertNoFetch(state, "omit");
      if (state.fields !== "*") {
        throw new RangeError(
          "OMIT leaves fields out of `SELECT *`; a projection names the fields it keeps instead"
        );
      }
      const stored = fieldsOf(state.table.select);
      if (stored === void 0) {
        throw new TypeError("OMIT takes a generated row schema");
      }
      const omitted = [
        ...state.omit ?? [],
        ...names2
      ];
      for (const name of omitted) {
        if (!Object.hasOwn(stored, name)) {
          throw new RangeError(
            `\`${name}\` is not a field of \`${state.table.name}\``
          );
        }
        if (name === state.split) {
          throw new RangeError(
            `\`${name}\` is the SPLIT field, which the row must hold`
          );
        }
      }
      const kept = Object.fromEntries(
        Object.entries(stored).filter(
          ([name]) => !omitted.includes(name)
        )
      );
      const select2 = rebuild(state.table.select, kept);
      return builder({
        ...state,
        omit: omitted,
        out: rowCodec(select2),
        base: { kind: "row", table: { ...state.table, select: select2 } }
      });
    },
    split: (field) => {
      assertNoFetch(state, "split");
      const name = field;
      if (state.fields !== "*" || state.only || state.omit !== void 0) {
        throw new RangeError(
          "split a SELECT before projecting it, omitting fields or reading ONLY one row"
        );
      }
      if (state.split !== void 0) {
        throw new RangeError("this SELECT splits one field");
      }
      const stored = fieldsOf(state.table.select);
      const declared = stored?.[name];
      const codec = declared === void 0 ? void 0 : unwrap(declared);
      if (stored === void 0 || declared === void 0 || codec === void 0 || !("value" in codec) || !Schema5.isSchema(codec.value)) {
        throw new RangeError(
          `\`${name}\` is not an array field of \`${state.table.name}\`: SPLIT takes one`
        );
      }
      const element = Schema5.Union([codec.value, codec]);
      const select2 = rebuild(state.table.select, {
        ...stored,
        [name]: isOptional(declared) ? Schema5.optionalKey(element) : element
      });
      const table = { ...state.table, select: select2 };
      return builder({
        ...state,
        table,
        row: rowExprs(table, state.scope),
        out: storedRow(table),
        base: { kind: "row", table },
        split: name
      });
    },
    groupBy: (keys) => groupBy(
      baseOf(state),
      keys
    ),
    groupAll: () => groupAll(baseOf(state)),
    toExpr: () => subquery(
      resultOf(state),
      render3(state),
      state.params,
      ownReader(state, `the subquery of \`${state.table.name}\``)
    ),
    build: (name, options) => {
      const writes = options?.writes ?? (state.pure ? false : void 0);
      const label2 = name ?? `select ${state.table.name}`;
      settle(
        ownReader(state, `statement \`${label2}\``),
        `statement \`${label2}\``
      );
      return make({
        ...writes !== void 0 && { writes },
        name: label2,
        sql: `${render3(state)};`,
        params: state.params,
        result: resultOf(state)
      });
    }
  };
};
var select = (table, id, values) => {
  const scope = new RowScope("select", table.name);
  const state = {
    table,
    scope,
    row: rowExprs(table, scope),
    source: void 0,
    out: storedRow(table),
    fields: "*",
    where: [],
    pure: id === void 0,
    order: [],
    aliases: /* @__PURE__ */ new Map(),
    limit: void 0,
    start: void 0,
    only: false,
    params: {},
    base: { kind: "row", table },
    fetch: []
  };
  if (typeof id === "string") {
    const where = uniqueLookup(table, state.row, id, values ?? {});
    return builder({
      ...reading2(state, where),
      where,
      pure: false,
      only: true,
      index: id,
      params: mergeParams(...where.map(paramsOf))
    });
  }
  if (isIdRange(id)) {
    const { sql, params, parts = [] } = id[IdRangeTypeId];
    if (id[IdRangeTypeId].table !== table.name) {
      throw new RangeError(
        `a range of \`${id[IdRangeTypeId].table}\` is not a subject of \`${table.name}\``
      );
    }
    const source = derive(Schema5.Unknown, sql, Level.atom, parts, params);
    return {
      ...builder({
        ...reading2(state, [source], false),
        source,
        range: true,
        pure: false,
        params
      }),
      forUpdate: () => {
        throw new RangeError(
          `FOR UPDATE reads one record, and an id range of \`${table.name}\` reads many; select the record by its id`
        );
      }
    };
  }
  if (id === void 0) {
    return builder(state);
  }
  const record = {
    ...reading2(state, [id], false),
    source: id,
    params: paramsOf(id)
  };
  return {
    ...builder(record),
    forUpdate: () => {
      if (!lockable(id)) {
        throw new RangeError(
          `FOR UPDATE reads one record from a binding or a local (\`$name\`), a literal record id or a \`recordId(\u2026)\`, and SurrealDB refuses \`${sqlOf(id)}\` as its target; LET the id in a block first`
        );
      }
      return builder({
        ...record,
        lock: true
      });
    }
  };
};
var selectFrom = (store, records) => {
  const source = records;
  const data = traversalOf(source);
  if (data === void 0) {
    throw new TypeError(
      "a select reads the records of a graph step or a recursive path"
    );
  }
  const shape = linkShape(data.item);
  const names2 = shape === void 0 ? "any" : shapeTables(shape);
  if (names2 === "any") {
    throw new TypeError(
      "the records of this step can be of any table, so a select has no row to read them with"
    );
  }
  if (names2.length !== 1) {
    throw new RangeError(
      `the records of this step are of several tables (${names2.map((name2) => `\`${name2}\``).join(", ")}), and a select reads the rows of one`
    );
  }
  const [name] = names2;
  const table = store.tables[name];
  if (table === void 0) {
    throw new RangeError(`\`${name}\` is not a table of this store`);
  }
  const scope = new RowScope("select", table.name);
  const state = {
    table,
    scope,
    row: rowExprs(table, scope),
    source,
    range: true,
    out: storedRow(table),
    fields: "*",
    where: [],
    pure: false,
    order: [],
    aliases: /* @__PURE__ */ new Map(),
    limit: void 0,
    start: void 0,
    only: false,
    params: paramsOf(source),
    base: { kind: "row", table },
    fetch: []
  };
  return builder(reading2(state, [source], false));
};
var arrayShape = (ast, seen = /* @__PURE__ */ new Set()) => {
  if (seen.has(ast)) return { array: false, other: false };
  seen.add(ast);
  if (SchemaAST3.isUndefined(ast) || SchemaAST3.isNull(ast)) {
    return { array: false, other: false };
  }
  if (SchemaAST3.isUnknown(ast) || SchemaAST3.isAny(ast)) {
    return { array: true, other: true };
  }
  if (SchemaAST3.isArrays(ast)) return { array: true, other: false };
  if (SchemaAST3.isSuspend(ast)) return arrayShape(ast.thunk(), seen);
  if (SchemaAST3.isUnion(ast)) {
    const members = ast.types.map((member) => arrayShape(member, seen));
    return {
      array: members.some((member) => member.array),
      other: members.some((member) => member.other)
    };
  }
  return { array: false, other: true };
};
var assertSameOnBoth = (field, value, key2, index) => {
  const stored = arrayShape(codecOf(field).ast);
  if (!stored.array || !stored.other || !isExpr(value)) return;
  if (!arrayShape(codecOf(value).ast).array) return;
  throw new RangeError(
    `\`${key2}\` of the unique index \`${index}\` may hold an array or another kind, and SurrealDB 3.3 finds no array through such an index (4.0 does): look it up by a value that is not an array, or declare \`${key2}\` an array kind only`
  );
};
var uniqueLookup = (table, row, name, values) => {
  const index = table.indexes?.[name];
  if (index === void 0) {
    throw new RangeError(`\`${table.name}\` has no index \`${name}\``);
  }
  if (index.type !== "unique") {
    throw new RangeError(
      `\`${name}\` is a ${index.type} index of \`${table.name}\`, not a unique one`
    );
  }
  const keys = index.columns.map((path) => path.join("."));
  if (index.columns.some((path) => path.includes("*"))) {
    throw new RangeError(
      `\`${name}\` indexes array elements, which a unique lookup cannot address`
    );
  }
  for (const key2 of keys) {
    if (!Object.hasOwn(values, key2)) {
      throw new RangeError(
        `the unique index \`${name}\` also needs \`${key2}\``
      );
    }
  }
  for (const key2 of Object.keys(values)) {
    if (!keys.includes(key2)) {
      throw new RangeError(
        `\`${key2}\` is not a field of the unique index \`${name}\``
      );
    }
  }
  return index.columns.map((path, at2) => {
    let field = row;
    for (const segment of path) {
      field = typeof field === "object" && field !== null && Object.hasOwn(field, segment) ? field[segment] : void 0;
    }
    if (!isPath(field)) {
      throw new RangeError(
        `\`${keys[at2]}\` of the unique index \`${name}\` is not a declared field of \`${table.name}\``
      );
    }
    const value = values[keys[at2]];
    assertSameOnBoth(field, value, keys[at2], name);
    const compare = eq;
    return compare(field, value);
  });
};

// src/statement/write.ts
import { Schema as Schema6, SchemaTransformation as SchemaTransformation2 } from "effect";
import { escapeIdent as escapeIdent5 } from "surrealdb";
var PatchOperation = Schema6.Union([
  Schema6.Struct({
    op: Schema6.Literal("add"),
    path: Schema6.String,
    value: SurrealValue
  }),
  Schema6.Struct({ op: Schema6.Literal("remove"), path: Schema6.String }),
  Schema6.Struct({
    op: Schema6.Literal("replace"),
    path: Schema6.String,
    value: Schema6.optional(SurrealValue)
  }),
  Schema6.Struct({
    op: Schema6.Literal("change"),
    path: Schema6.String,
    value: Schema6.String
  })
]);
var Diff = Schema6.Array(PatchOperation);
var siteOf2 = (state) => ({
  own: state.scope,
  what: `${/^[AEIOU]/u.test(state.verb) ? "an" : "a"} ${state.verb}`,
  parents: "refuse",
  refused: "it reads the row of a select from a step's `where` directly under that select"
});
var reading3 = (state, exprs) => {
  const context = joinContexts([state.context, admit(siteOf2(state), exprs)]);
  return {
    ...state,
    ...context !== void 0 && { context }
  };
};
var returnClause = (state) => {
  if (state.returning !== void 0) return `RETURN ${state.returning.sql}`;
  return state.verb === "UPSERT" ? "RETURN VALUE NONE" : "RETURN NONE";
};
var NoRows = Schema6.Array(Schema6.Undefined).pipe(
  Schema6.decodeTo(
    Schema6.Tuple([]),
    SchemaTransformation2.transform({
      decode: () => [],
      encode: () => []
    })
  )
);
var render4 = (state) => [
  state.verb === "INSERT" ? `INSERT ${state.relation === true ? "RELATION " : ""}INTO ${state.target}` : `${state.verb} ${state.shape === "many" ? "" : "ONLY "}${state.target}`,
  ...state.data === void 0 ? [] : [state.data],
  ...state.duplicate === void 0 ? [] : [`ON DUPLICATE KEY UPDATE ${state.duplicate}`],
  ...state.where.length > 0 ? [`WHERE ${andAll(state.where)}`] : [],
  returnClause(state)
].join(" ");
var elementOf = (state) => {
  const returning = state.returning;
  if (returning === void 0) return Schema6.Undefined;
  switch (returning.mode) {
    case "after":
      return state.verb === "DELETE" ? Schema6.Undefined : returning.codec;
    case "before":
      return state.verb === "UPSERT" || state.verb === "INSERT" ? Schema6.UndefinedOr(returning.codec) : returning.codec;
    default:
      return returning.codec;
  }
};
var resultOf2 = (state) => {
  if (state.returning === void 0) {
    if (state.shape !== "many") return Schema6.Undefined;
    return state.verb === "UPSERT" ? NoRows : Schema6.Tuple([]);
  }
  const element = elementOf(state);
  if (state.shape === "one") return element;
  return state.shape === "maybe" ? Schema6.UndefinedOr(element) : Schema6.Array(element);
};
var nonEmpty = (state) => {
  const mode = state.returning?.mode;
  if (state.verb === "CREATE" || state.verb === "RELATE") {
    return mode === "after" || mode === "fields" || mode === "diff";
  }
  return state.verb === "UPSERT" && state.shape === "one" && (mode === "after" || mode === "fields");
};
var finish2 = (state, name) => {
  const label2 = name ?? `${state.verb.toLowerCase()}${state.relation === true ? " relation" : ""} ${state.table.name}`;
  assertReader(
    readerOf(state.table),
    settle(state.context, `statement \`${label2}\``),
    `statement \`${label2}\``
  );
  return make({
    name: label2,
    sql: `${render4(state)};`,
    params: state.params,
    result: resultOf2(state),
    writes: true,
    nonEmpty: nonEmpty(state)
  });
};
var start = (verb, table, options) => {
  const scope = new RowScope("write", table.name);
  const context = joinContexts((options.subject ?? []).map(contextOf));
  return {
    verb,
    table,
    scope,
    ...context !== void 0 && { context },
    row: rowExprs(table, scope),
    target: options.target,
    shape: options.shape,
    ...options.relation === true && { relation: true },
    data: void 0,
    where: [],
    returning: options.returning === "NONE" ? void 0 : { mode: "after", sql: "AFTER", codec: storedRow(table) },
    params: options.params
  };
};
var withData = (state, keyword, data) => ({
  ...reading3(state, [data]),
  data: keyword === void 0 ? operand(data) : `${keyword} ${operand(data)}`,
  params: mergeParams(state.params, paramsOf(data))
});
var withWhere = (state, predicate) => {
  const condition = predicate(state.row);
  return {
    ...reading3(state, [condition]),
    where: [...state.where, condition],
    params: mergeParams(state.params, paramsOf(condition))
  };
};
var returnedRow = (state) => state.verb === "DELETE" ? rowAt(state.table.select, "$before.") : state.row;
var withReturning = (state, returning) => {
  if (returning === "none") return { ...state, returning: void 0 };
  if (returning === "diff") {
    return {
      ...state,
      returning: { mode: "diff", sql: "DIFF", codec: Diff }
    };
  }
  if (typeof returning === "string") {
    return {
      ...state,
      returning: {
        mode: returning,
        sql: returning.toUpperCase(),
        codec: storedRow(state.table)
      }
    };
  }
  const projection = returning(
    returnedRow(state)
  );
  const projected = project(projection);
  return {
    ...reading3(state, Object.values(projection)),
    returning: {
      mode: "fields",
      sql: projected.sql,
      codec: projected.codec
    },
    params: mergeParams(state.params, projected.params)
  };
};
var withValue = (state, pick) => {
  const picked = pick(returnedRow(state));
  return {
    ...reading3(state, [picked]),
    returning: {
      mode: "value",
      sql: `VALUE ${sqlOf(picked)}`,
      codec: rowCodec(codecOf(picked))
    },
    params: mergeParams(state.params, paramsOf(picked))
  };
};
var creating = (state) => ({
  content: (data) => creating(withData(state, "CONTENT", data)),
  returning: ((returning) => creating(withReturning(state, returning))),
  returningValue: (pick) => creating(withValue(state, pick)),
  build: (name) => finish2(state, name)
});
var create = (table, id) => creating(
  start("CREATE", table, {
    target: id === void 0 ? tableName(table) : operand(id),
    shape: "one",
    params: id === void 0 ? {} : paramsOf(id),
    subject: id === void 0 ? [] : [id],
    returning: "AFTER"
  })
);
var updating = (state) => ({
  where: (predicate) => updating(
    withWhere(state, predicate)
  ),
  returning: ((returning) => updating(withReturning(state, returning))),
  returningValue: (pick) => updating(withValue(state, pick)),
  build: (name) => finish2(state, name)
});
var update = (table, id) => {
  const state = start("UPDATE", table, {
    target: id === void 0 ? tableName(table) : operand(id),
    shape: id === void 0 ? "many" : "maybe",
    params: id === void 0 ? {} : paramsOf(id),
    subject: id === void 0 ? [] : [id],
    returning: "AFTER"
  });
  return {
    merge: (data) => updating(withData(state, "MERGE", data)),
    content: (data) => updating(withData(state, "CONTENT", data))
  };
};
var upserting = (state) => ({
  where: ((predicate) => upserting(withWhere(state, predicate))),
  returning: ((returning) => upserting(withReturning(state, returning))),
  returningValue: (pick) => upserting(withValue(state, pick)),
  build: (name) => finish2(state, name)
});
var upsert = (table, id) => {
  const state = start("UPSERT", table, {
    target: id === void 0 ? tableName(table) : operand(id),
    shape: id === void 0 ? "many" : "one",
    params: id === void 0 ? {} : paramsOf(id),
    subject: id === void 0 ? [] : [id],
    returning: "AFTER"
  });
  return {
    merge: (data) => upserting(withData(state, "MERGE", data)),
    content: (data) => upserting(withData(state, "CONTENT", data))
  };
};
var deleting = (state) => ({
  where: (predicate) => deleting(
    withWhere(state, predicate)
  ),
  returning: ((returning) => deleting(withReturning(state, returning))),
  returningValue: (pick) => deleting(withValue(state, pick)),
  build: (name) => finish2(state, name)
});
var deleteFrom = (table, id) => deleting(
  start("DELETE", table, {
    target: id === void 0 ? tableName(table) : operand(id),
    shape: id === void 0 ? "many" : "maybe",
    params: id === void 0 ? {} : paramsOf(id),
    subject: id === void 0 ? [] : [id],
    returning: "NONE"
  })
);
var relating = (state) => ({
  content: (data) => relating(withData(state, "CONTENT", data)),
  returning: ((returning) => relating(withReturning(state, returning))),
  returningValue: (pick) => relating(withValue(state, pick)),
  build: (name) => finish2(state, name)
});
var endpoint = (value) => {
  const sql = sqlOf(value);
  return /^\$[A-Za-z_][A-Za-z0-9_]*$/u.test(sql) ? sql : `(${sql})`;
};
var relate = (table, from, to) => {
  const source = from;
  const target = to;
  return relating(
    start("RELATE", table, {
      target: `${endpoint(source)}->${tableName(table)}->${endpoint(target)}`,
      shape: "one",
      params: mergeParams(paramsOf(source), paramsOf(target)),
      subject: [source, target],
      returning: "AFTER"
    })
  );
};
var inserting = (state) => ({
  onDuplicate: (set) => {
    if (state.duplicate !== void 0) {
      throw new RangeError(
        "an INSERT has one ON DUPLICATE KEY UPDATE clause"
      );
    }
    const input = rowAt(
      state.table.create ?? state.table.select,
      "$input."
    );
    const assignments = Object.entries(
      set(input)
    );
    if (assignments.length === 0) {
      throw new RangeError(
        "ON DUPLICATE KEY UPDATE needs at least one assignment"
      );
    }
    const merge = state.table.merge;
    const settable = merge === void 0 ? void 0 : fieldsOf(merge);
    const values = assignments.map(([field, value]) => {
      if (settable !== void 0 && !Object.hasOwn(settable, field)) {
        throw new RangeError(
          `\`${field}\` is not a field \`${state.table.name}\` accepts in ON DUPLICATE KEY UPDATE`
        );
      }
      return [field, isExpr(value) ? value : literal(value)];
    });
    return inserting({
      ...reading3(
        state,
        values.map(([, value]) => value)
      ),
      duplicate: values.map(
        ([field, value]) => `${escapeIdent5(field)} = ${operand(value)}`
      ).join(", "),
      params: mergeParams(
        state.params,
        ...values.map(([, value]) => paramsOf(value))
      )
    });
  },
  returning: ((returning) => inserting(withReturning(state, returning))),
  returningValue: (pick) => inserting(withValue(state, pick)),
  build: (name) => finish2(state, name)
});
var insert = (table, data) => inserting(
  withData(
    start("INSERT", table, {
      target: tableName(table),
      shape: "many",
      params: {},
      returning: "AFTER"
    }),
    void 0,
    data
  )
);
var insertRelation = (table, data) => inserting(
  withData(
    start("INSERT", table, {
      target: tableName(table),
      shape: "many",
      params: {},
      returning: "AFTER",
      relation: true
    }),
    void 0,
    data
  )
);
export {
  BlockTypeId,
  Diff,
  ExprTypeId,
  IdRangeTypeId,
  KnnTypeId,
  MarkedAny,
  MarkedList,
  MarkedOptionalText,
  MarkedText,
  MatchTypeId,
  Offsets,
  PatchOperation,
  RowValueTypeId,
  StatementTypeId,
  TextNodeTypeId,
  TraversalTypeId,
  add,
  and,
  arrayDistinct,
  arrayGroup,
  at,
  block,
  both,
  call,
  cast,
  choose,
  codecOf,
  collect,
  compose,
  contains,
  count,
  create,
  deleteFrom,
  destructure,
  div,
  edges,
  empty,
  eq,
  evaluate,
  family,
  follow,
  gt,
  gte,
  highlight,
  idRange,
  incoming,
  insert,
  insertRelation,
  inside,
  isExpr,
  isIdRange,
  isNone,
  isNotNone,
  isPath,
  isStatement,
  isTraversal,
  knn,
  knnDistance,
  linear,
  literal,
  lt,
  lte,
  make,
  match,
  max,
  mean,
  median,
  min,
  mul,
  ne,
  not,
  object,
  offsets,
  or,
  outgoing,
  param,
  paramsOf,
  parent,
  part,
  readAs,
  recordId,
  recurse,
  relate,
  rowOf,
  rows,
  rrf,
  score,
  select,
  selectFrom,
  sequence,
  shortest,
  sqlOf,
  stddev,
  sub,
  sum,
  timeMax,
  timeMin,
  unsafeExpr,
  update,
  upsert,
  variance
};
//# sourceMappingURL=statement.js.map