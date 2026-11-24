#!/usr/bin/env node

// src/cli/run.ts
import { createHash } from "crypto";
import { readFile as readFile3 } from "fs/promises";
import { resolve as resolve3 } from "path";
import { parseArgs as parseArgs2 } from "util";
import { Effect as Effect9 } from "effect";

// src/emitter/generate.ts
import { Data as Data3, Effect as Effect3 } from "effect";

// src/emitter/canonical.ts
var canonicalJson = (value) => {
  if (value === null) return "null";
  switch (typeof value) {
    case "boolean":
      return value ? "true" : "false";
    case "string":
      return JSON.stringify(value);
    case "number":
      if (!Number.isInteger(value) || Object.is(value, -0)) {
        throw new TypeError(
          `schema documents contain only integers; found ${value}`
        );
      }
      return String(value);
    case "object": {
      if (Array.isArray(value)) {
        return `[${value.map(canonicalJson).join(",")}]`;
      }
      const record = value;
      const keys = Object.keys(record).sort();
      return `{${keys.filter((key) => record[key] !== void 0).map(
        (key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`
      ).join(",")}}`;
    }
    default:
      throw new TypeError(`cannot canonicalise a ${typeof value}`);
  }
};
var omit = (value, keys) => Object.fromEntries(
  Object.entries(value).filter(([key]) => !keys.includes(key))
);
var semanticProjection = (document) => {
  const projected = omit(document, [
    "semanticDigest",
    "provenance",
    "diagnostics"
  ]);
  const tables = projected.tables;
  if (!Array.isArray(tables)) return projected;
  return {
    ...projected,
    tables: tables.map((table) => {
      const fields = Array.isArray(table.fields) ? table.fields : [];
      return {
        ...omit(table, ["define"]),
        fields: fields.map((field) => {
          const next = omit(field, ["define"]);
          if (typeof field.value === "object" && field.value !== null) {
            next.value = omit(
              field.value,
              ["readsInput"]
            );
          }
          if (typeof field.assert === "object" && field.assert !== null) {
            next.assert = omit(
              field.assert,
              ["recognized"]
            );
          }
          return next;
        })
      };
    })
  };
};
var semanticDigest = (document, sha256Hex) => `sha256:${sha256Hex(canonicalJson(semanticProjection(document)))}`;

// src/emitter/names.ts
var words = (name) => name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(/[^A-Za-z0-9]+/).filter((word) => word.length > 0);
var pascalCase = (name) => {
  const joined = words(name).map((word) => word[0]?.toUpperCase() + word.slice(1)).join("");
  if (joined.length === 0) return "T";
  return /^[0-9]/.test(joined) ? `T${joined}` : joined;
};
var kebabCase = (name) => {
  const joined = words(name).map((word) => word.toLowerCase()).join("-");
  return joined.length === 0 ? "table" : joined;
};
var functionIdentifier = (name) => `fn_${name.replace(/^fn::/, "").split("::").map((part) => part.replace(/[^A-Za-z0-9_]/g, "_")).join("_")}`;
var IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
var propertyKey = (key) => {
  if (key === "__proto__") return '["__proto__"]';
  return IDENTIFIER.test(key) ? key : JSON.stringify(key);
};
var propertyAccess = (key) => IDENTIFIER.test(key) ? `.${key}` : `[${JSON.stringify(key)}]`;

// src/emitter/context.ts
var IdRegistry = class {
  constructor(document, overrides) {
    this.document = document;
    this.overrides = overrides;
    this.#defined = new Set(document.tables.map((table) => table.name));
    for (const table of document.tables) this.table(table.name);
  }
  document;
  overrides;
  #names = /* @__PURE__ */ new Map();
  #unions = /* @__PURE__ */ new Map();
  #conflicts = [];
  #defined;
  /** PascalCase base name of a table (`member_of` → `MemberOf`). */
  pascal(table) {
    return this.overrides[table] ?? pascalCase(table);
  }
  /** Module file name of a table, without `.ts` (`member_of` → `member-of`). */
  file(table) {
    const override = this.overrides[table];
    return kebabCase(override ?? table);
  }
  /** The id schema name of one table, registering it. */
  table(table) {
    const existing = this.#names.get(table);
    if (existing !== void 0) return existing;
    const name = `${this.pascal(table)}Id`;
    this.#names.set(table, name);
    return name;
  }
  /**
   * The id-union schema name for `record<a | b>`, registering it. Two different
   * unions can spell the same name (`record<a_or_b | c>` and `record<a | b_or_c>`
   * are both `AOrBOrCId`); the second is recorded in {@link conflicts}, never
   * written over the first.
   */
  union(tables) {
    for (const table of tables) this.table(table);
    const name = `${tables.map((table) => this.pascal(table)).join("Or")}Id`;
    const existing = this.#unions.get(name);
    if (existing === void 0) {
      this.#unions.set(name, tables);
    } else if (existing.length !== tables.length || existing.some((table, i) => table !== tables[i])) {
      this.#conflicts.push([name, existing, tables]);
    }
    return name;
  }
  /** Names two different unions spell alike: the name, the first union, the other. */
  get conflicts() {
    return this.#conflicts;
  }
  /** The tagged application representation of a registered union. */
  static tagged(unionName) {
    return `${unionName.slice(0, -2)}Tagged`;
  }
  get tables() {
    return [...this.#names.entries()].sort(([a], [b]) => compare(a, b));
  }
  get unions() {
    return [...this.#unions.entries()].sort(([a], [b]) => compare(a, b));
  }
  isDefined(table) {
    return this.#defined.has(table);
  }
};
var compare = (a, b) => {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  const length = Math.min(left.length, right.length);
  for (let i = 0; i < length; i++) {
    const difference = left[i] - right[i];
    if (difference !== 0) return difference;
  }
  return left.length - right.length;
};
var ModuleScope = class {
  constructor(registry, warnings) {
    this.registry = registry;
    this.warnings = warnings;
  }
  registry;
  warnings;
  ids = /* @__PURE__ */ new Set();
  useId(name) {
    this.ids.add(name);
    return name;
  }
};
var profileFor = (options, key) => {
  const field = options.fields?.[key];
  return {
    int: field?.int ?? options.int ?? "safe-number",
    datetime: field?.datetime ?? options.datetime ?? "sdk"
  };
};
var admitsNoneKind = (kind) => kind === void 0 || kind.kind === "any" || kind.kind === "none";

// src/emitter/document.ts
import { Data, Effect, Schema, SchemaIssue } from "effect";
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
var DocumentError = class extends Data.TaggedError("DocumentError") {
};
var formatter = SchemaIssue.makeFormatterDefault();
var decodeDocument = (input) => Schema.decodeUnknownEffect(SchemaDocument)(input, {
  onExcessProperty: "error",
  errors: "all"
}).pipe(
  Effect.mapError(
    (error) => new DocumentError({
      message: `not a valid schema document v2:
${formatter(error.issue)}`
    })
  )
);

// src/emitter/kinds.ts
var json = (value) => JSON.stringify(value);
var list = (values) => `[${values.map(json).join(", ")}]`;
var SAFE = Number.MAX_SAFE_INTEGER;
var isSafeIntText = (text) => {
  if (!/^-?\d+$/.test(text)) return false;
  const big = BigInt(text);
  return big <= BigInt(SAFE) && big >= -BigInt(SAFE);
};
var plainLiteral = (literal, ctx) => {
  switch (literal.type) {
    case "string":
      return json(String(literal.value));
    case "bool":
      return String(literal.value);
    case "float": {
      const value = Number(literal.value);
      return Number.isFinite(value) ? String(value) : void 0;
    }
    case "int":
      return ctx.profile.int === "safe-number" && isSafeIntText(String(literal.value)) ? String(BigInt(String(literal.value))) : void 0;
    default:
      return void 0;
  }
};
var JSON_LITERAL_BASE = {
  int: "SurrealSchema.Int64FromJson",
  decimal: "SurrealSchema.DecimalFromJson",
  duration: "SurrealSchema.DurationFromJson"
};
var printLiteral = (literal, ctx) => {
  const plain = plainLiteral(literal, ctx);
  if (plain !== void 0) return `Schema.Literal(${plain})`;
  let native;
  switch (literal.type) {
    case "int":
      native = `SurrealSchema.Int64Literal(${json(String(literal.value))})`;
      break;
    case "decimal":
      native = `SurrealSchema.DecimalLiteral(${json(String(literal.value))})`;
      break;
    case "duration":
      native = `SurrealSchema.DurationLiteral(${json(String(literal.value))})`;
      break;
    default:
      throw new Error(`unprintable literal ${JSON.stringify(literal)}`);
  }
  return ctx.world === "json" ? `${JSON_LITERAL_BASE[literal.type]}.pipe(Schema.decodeTo(${native}))` : native;
};
var printLiterals = (literals, ctx) => {
  const plain = literals.map((literal) => plainLiteral(literal, ctx));
  if (plain.every((value) => value !== void 0)) {
    return plain.length === 1 ? `Schema.Literal(${plain[0]})` : `Schema.Literals([${plain.join(", ")}])`;
  }
  return `Schema.Union([${literals.map((literal) => printLiteral(literal, ctx)).join(", ")}])`;
};
var GEOMETRY_NAMES = {
  collection: "GeometryCollection",
  line: "GeometryLine",
  multiline: "GeometryMultiLine",
  multipoint: "GeometryMultiPoint",
  multipolygon: "GeometryMultiPolygon",
  point: "GeometryPoint",
  polygon: "GeometryPolygon"
};
var unsupported = (kind, ctx) => {
  ctx.scope.warnings.push(
    `${ctx.location}: kind \`${kind}\` has no SDK value representation; generated as SurrealSchema.Unsupported("${kind}"), which rejects every value`
  );
  return `SurrealSchema.Unsupported(${json(kind)})`;
};
var printRecord = (tables, ctx) => {
  if (tables.length === 0) return "SurrealSchema.RecordIdAny";
  if (tables.length === 1) {
    return ctx.scope.useId(ctx.scope.registry.table(tables[0]));
  }
  return ctx.scope.useId(ctx.scope.registry.union(tables));
};
var isLiteral = (kind) => kind.kind === "literal";
var openValue = (world) => world === "json" ? "SurrealSchema.SurrealJsonValue" : "SurrealSchema.SurrealValue";
var printOpenRecord = (world, merge = false) => `Schema.Record(Schema.String, ${merge && world !== "json" ? "SurrealSchema.SurrealMergeValue" : openValue(world)})`;
var printItem = (item, ctx) => item.kind === "any" ? openValue(ctx.world) : printKind(item, ctx);
var printJsonKind = (kind, ctx, hooks) => {
  switch (kind.kind) {
    case "none":
      return "Schema.Null";
    case "int":
      return ctx.profile.int === "bigint" ? "SurrealSchema.Int64FromJson" : void 0;
    case "decimal":
      return "SurrealSchema.DecimalFromJson";
    case "number":
      return "SurrealSchema.SurrealNumberFromJson";
    case "datetime":
      return ctx.profile.datetime === "effect-datetime" ? "SurrealSchema.DateTimeEffectFromJson" : "SurrealSchema.DateTimeFromJson";
    case "duration":
      return "SurrealSchema.DurationFromJson";
    case "uuid":
      return "SurrealSchema.UuidFromJson";
    case "bytes":
      return "SurrealSchema.BytesFromJson";
    case "range":
      return "SurrealSchema.RangeFromJson";
    case "record":
      return `SurrealSchema.RecordIdFromJsonAs(${printRecord(kind.tables, ctx)})`;
    case "table":
      return `SurrealSchema.TableFromJson(${list(kind.tables)})`;
    case "file":
      return `SurrealSchema.FileRefFromJson(${list(kind.buckets)})`;
    case "geometry":
      return `SurrealSchema.GeometryFromJson(${printKind(kind, { ...ctx, world: "native" })})`;
    case "set": {
      const item = hooks.item ?? printItem(kind.item, ctx);
      return kind.length === void 0 ? `SurrealSchema.SetFromJson(${item})` : `SurrealSchema.SetFromJson(${item}, { length: ${kind.length} })`;
    }
    case "option":
      return `Schema.NullOr(${printKind(kind.item, ctx)})`;
    case "union": {
      if (kind.variants.every(isLiteral)) return void 0;
      const variants = [
        ...new Set(
          kind.variants.map(
            (variant) => printKind(variant, ctx, hooks)
          )
        )
      ];
      const nullIndex = variants.indexOf("Schema.Null");
      if (variants.length === 2 && nullIndex !== -1) {
        return `Schema.NullOr(${variants[1 - nullIndex]})`;
      }
      return variants.length === 1 ? variants[0] : `Schema.Union([${variants.join(", ")}])`;
    }
    default:
      return void 0;
  }
};
var printKind = (kind, ctx, hooks = {}) => {
  if (ctx.world === "json") {
    const printed = printJsonKind(kind, ctx, hooks);
    if (printed !== void 0) return printed;
  }
  switch (kind.kind) {
    case "any":
      return ctx.world === "json" ? openValue(ctx.world) : "Schema.UndefinedOr(SurrealSchema.SurrealValue)";
    case "none":
      return "Schema.Undefined";
    case "null":
      return "Schema.Null";
    case "bool":
      return "Schema.Boolean";
    case "int":
      return ctx.profile.int === "bigint" ? "SurrealSchema.Int64" : "SurrealSchema.Int";
    case "float":
      return ctx.world === "json" ? "Schema.Finite" : "SurrealSchema.Float";
    case "decimal":
      return "SurrealSchema.Decimal";
    case "number":
      return "SurrealSchema.SurrealNumber";
    case "string":
      return "SurrealSchema.String";
    case "datetime":
      return ctx.profile.datetime === "effect-datetime" ? "SurrealSchema.DateTimeEffect" : "SurrealSchema.DateTime";
    case "duration":
      return "SurrealSchema.Duration";
    case "uuid":
      return "SurrealSchema.Uuid";
    case "bytes":
      return "SurrealSchema.Bytes";
    case "range":
      return "SurrealSchema.Range";
    case "regex":
    case "function":
      return unsupported(kind.kind, ctx);
    case "object":
      return hooks.object ?? (ctx.closedObjects === true ? "Schema.Record(Schema.String, Schema.Never)" : printOpenRecord(ctx.world));
    case "record":
      return printRecord(kind.tables, ctx);
    case "table":
      return `SurrealSchema.TableFor(${list(kind.tables)})`;
    case "file":
      return `SurrealSchema.FileRefFor(${list(kind.buckets)})`;
    case "geometry": {
      if (kind.types.length === 0) return "SurrealSchema.Geometry";
      if (kind.types.length === 1) {
        return `SurrealSchema.${GEOMETRY_NAMES[kind.types[0]]}`;
      }
      return `SurrealSchema.GeometryOf(${list(kind.types)})`;
    }
    case "array": {
      const item = hooks.item ?? printItem(kind.item, ctx);
      const array = `Schema.Array(${item})`;
      return kind.length === void 0 ? array : `${array}.check(Schema.isBetweenLength(${kind.length}, ${kind.length}))`;
    }
    case "set": {
      const item = hooks.item ?? printItem(kind.item, ctx);
      return kind.length === void 0 ? `SurrealSchema.SetOf(${item})` : `SurrealSchema.SetOf(${item}, { length: ${kind.length} })`;
    }
    case "tuple":
      return `Schema.Tuple([${kind.items.map((item) => printKind(item, ctx)).join(", ")}])`;
    case "objectLiteral": {
      if (kind.fields.length === 0) return "SurrealSchema.EmptyObject";
      const entries = kind.fields.map((field) => {
        const value = printKind(field.kind, ctx);
        return `${propertyKey(field.name)}: ${field.optional ? `Schema.optionalKey(${value})` : value}`;
      });
      return `Schema.Struct({ ${entries.join(", ")} })`;
    }
    case "literal":
      return printLiteral(kind, ctx);
    case "option":
      return `Schema.UndefinedOr(${printKind(kind.item, ctx)})`;
    case "union": {
      if (kind.variants.every(isLiteral))
        return printLiterals(kind.variants, ctx);
      const variants = kind.variants.map(
        (variant) => printKind(variant, ctx, hooks)
      );
      const nullIndex = kind.variants.findIndex(
        (variant) => variant.kind === "null"
      );
      if (variants.length === 2 && nullIndex !== -1) {
        return `Schema.NullOr(${variants[1 - nullIndex]})`;
      }
      return `Schema.Union([${variants.join(", ")}])`;
    }
    case "unknown":
      ctx.scope.warnings.push(
        `${ctx.location}: unrecognised kind \`${kind.source}\` (acknowledged) generated as Schema.Unknown`
      );
      return "Schema.Unknown";
  }
};
var literalsMatchKind = (values, kind) => {
  const expected = {
    string: "string",
    int: "int",
    float: "float",
    decimal: "decimal",
    bool: "bool",
    duration: "duration"
  };
  const type = expected[kind.kind];
  return type !== void 0 && values.every((value) => value.type === type);
};
var numberCheck = (bound, side, bigint) => {
  if (bigint) {
    if (!/^-?\d+$/.test(bound.value)) return void 0;
    const value2 = `${BigInt(bound.value)}n`;
    if (side === "min") {
      return bound.inclusive ? `Schema.isGreaterThanOrEqualToBigInt(${value2})` : `Schema.isGreaterThanBigInt(${value2})`;
    }
    return bound.inclusive ? `Schema.isLessThanOrEqualToBigInt(${value2})` : `Schema.isLessThanBigInt(${value2})`;
  }
  if (/^-?\d+$/.test(bound.value) && !isSafeIntText(bound.value))
    return void 0;
  const value = Number(bound.value);
  if (!Number.isFinite(value)) return void 0;
  if (side === "min") {
    return bound.inclusive ? `Schema.isGreaterThanOrEqualTo(${value})` : `Schema.isGreaterThan(${value})`;
  }
  return bound.inclusive ? `Schema.isLessThanOrEqualTo(${value})` : `Schema.isLessThan(${value})`;
};
var lengthChecks = (refinement, strings) => {
  const { min, max } = refinement;
  const [atLeast, atMost, between] = strings ? ["isMinCodePoints", "isMaxCodePoints", "isBetweenCodePoints"] : ["isMinLength", "isMaxLength", "isBetweenLength"];
  if (min !== void 0 && max !== void 0)
    return [`Schema.${between}(${min}, ${max})`];
  if (min !== void 0) return [`Schema.${atLeast}(${min})`];
  if (max !== void 0) return [`Schema.${atMost}(${max})`];
  return [];
};
var applyRefinements = (printed, kind, refinements, ctx) => {
  if (kind === void 0 || refinements === void 0) return printed;
  let base = printed;
  const checks = [];
  for (const refinement of refinements) {
    switch (refinement.type) {
      case "literals":
        if (literalsMatchKind(refinement.values, kind)) {
          base = printLiterals(refinement.values, ctx);
        }
        break;
      case "range": {
        const bigint = kind.kind === "int" && ctx.profile.int === "bigint";
        const applies = refinement.valueKind === "int" && kind.kind === "int" || refinement.valueKind === "float" && kind.kind === "float";
        if (!applies) break;
        for (const side of ["min", "max"]) {
          const bound = refinement[side];
          if (bound === void 0) continue;
          const check = numberCheck(bound, side, bigint);
          if (check !== void 0) checks.push(check);
        }
        break;
      }
      case "length":
        if (refinement.target === "string" && kind.kind === "string") {
          checks.push(...lengthChecks(refinement, true));
        } else if (refinement.target === "array" && kind.kind === "array") {
          checks.push(...lengthChecks(refinement, false));
        }
        break;
      case "email":
        break;
    }
  }
  return checks.length === 0 ? base : `${base}.check(${checks.join(", ")})`;
};

// src/emitter/options.ts
import { Data as Data2, Effect as Effect2, Schema as Schema2, SchemaIssue as SchemaIssue2 } from "effect";
var PresenceOverride = Schema2.Literals([
  "required",
  "optional",
  "removable",
  "resettable",
  "excluded"
]);
var IntProfile = Schema2.Literals(["safe-number", "bigint"]);
var DatetimeProfile = Schema2.Literals(["sdk", "effect-datetime"]);
var FieldOptions = Schema2.Struct({
  int: Schema2.optionalKey(IntProfile),
  datetime: Schema2.optionalKey(DatetimeProfile),
  select: Schema2.optionalKey(PresenceOverride),
  create: Schema2.optionalKey(PresenceOverride),
  merge: Schema2.optionalKey(PresenceOverride),
  content: Schema2.optionalKey(PresenceOverride)
});
var EmitterOptions = Schema2.Struct({
  /**
   * The logical store the schema belongs to. Record-id brands are
   * `<store>/<table>`, so ids of same-named tables in different stores are
   * different types.
   */
  store: Schema2.String.check(
    Schema2.isPattern(/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/)
  ),
  /** Integer profile. Default `"safe-number"`. */
  int: Schema2.optionalKey(IntProfile),
  /** Datetime profile. Default `"sdk"`. */
  datetime: Schema2.optionalKey(DatetimeProfile),
  /** Emit `<Table>Patch` JSON Patch unions (not yet qualified). Default false. */
  patch: Schema2.optionalKey(Schema2.Boolean),
  /**
   * Extension of the generated modules' imports of each other. Default
   * `".js"`, which compilers and bundlers map to the `.ts` sources; `".ts"`
   * lets the sources load directly where nothing maps them, such as Node's
   * own type stripping (the consumer then compiles with
   * `allowImportingTsExtensions` or `rewriteRelativeImportExtensions`).
   */
  importExtension: Schema2.optionalKey(Schema2.Literals([".js", ".ts"])),
  /**
   * Error diagnostic codes generation may proceed past, each with the reason
   * it is acceptable. Generation fails on any other error diagnostic.
   */
  acknowledge: Schema2.optionalKey(
    Schema2.Record(
      Schema2.String.check(
        Schema2.isPattern(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/)
      ),
      Schema2.String.check(Schema2.isMinLength(1))
    )
  ),
  fields: Schema2.optionalKey(Schema2.Record(Schema2.String, FieldOptions)),
  /** PascalCase names for tables whose default names collide. */
  names: Schema2.optionalKey(
    Schema2.Record(
      Schema2.String,
      Schema2.String.check(Schema2.isPattern(/^[A-Z][A-Za-z0-9]*$/))
    )
  )
});
var OptionsError = class extends Data2.TaggedError("OptionsError") {
};
var formatter2 = SchemaIssue2.makeFormatterDefault();
var decodeOptions = (input) => Schema2.decodeUnknownEffect(EmitterOptions)(input, {
  onExcessProperty: "error",
  errors: "all"
}).pipe(
  Effect2.mapError(
    (error) => new OptionsError({
      message: `invalid emitter options:
${formatter2(error.issue)}`
    })
  )
);

// src/emitter/tables.ts
var OPERATIONS = [
  "select",
  "create",
  "merge",
  "content"
];
var node = (path) => ({
  key: path[path.length - 1] ?? "",
  path,
  field: void 0,
  children: /* @__PURE__ */ new Map()
});
var buildTree = (fields) => {
  const root = node([]);
  for (const field of fields) {
    let current = root;
    for (let depth = 0; depth < field.path.length; depth++) {
      const key = field.path[depth];
      let child = current.children.get(key);
      if (child === void 0) {
        child = node(field.path.slice(0, depth + 1));
        current.children.set(key, child);
      }
      current = child;
    }
    current.field = field;
  }
  return root;
};
var sortedChildren = (parent) => [...parent.children.values()].sort((a, b) => compare(a.key, b.key));
var namedChildren = (parent) => sortedChildren(parent).filter((child) => child.key !== "*");
var infoOf = (fieldNode) => {
  const field = fieldNode.field;
  const named = namedChildren(fieldNode);
  const childRequired = named.some((child) => !admitsNone(infoOf(child)));
  if (field === void 0) {
    return {
      kind: { kind: "object" },
      untypedParent: false,
      childRequired,
      optional: false,
      flexible: false,
      readonly: false,
      defaultMode: childRequired ? void 0 : "always",
      valueIgnoresInput: false,
      computed: false,
      recognized: void 0
    };
  }
  const untypedParent = field.kind === void 0 && named.length > 0;
  return {
    kind: field.kind,
    untypedParent,
    childRequired,
    optional: field.optional,
    flexible: field.flexible,
    readonly: field.readonly,
    defaultMode: field.default?.mode ?? (untypedParent && !childRequired ? "always" : void 0),
    valueIgnoresInput: field.value !== void 0 && !field.value.readsInput,
    computed: field.computed !== void 0,
    recognized: field.assert?.recognized
  };
};
var admitsNone = (info) => info.optional || !info.untypedParent && admitsNoneKind(info.kind);
var derivePresence = (info, operation, writeExcluded) => {
  const none = admitsNone(info);
  switch (operation) {
    case "select":
      return none ? "optional" : "required";
    case "create":
      if (writeExcluded || info.computed || info.valueIgnoresInput)
        return "excluded";
      return none || info.defaultMode !== void 0 ? "optional" : "required";
    case "merge":
      if (writeExcluded || info.computed || info.readonly || info.valueIgnoresInput)
        return "excluded";
      if (info.defaultMode === "always") return "resettable";
      return none ? "removable" : "optional";
    case "content":
      if (writeExcluded || info.computed || info.readonly || info.valueIgnoresInput)
        return "excluded";
      return none || info.defaultMode === "always" ? "optional" : "required";
  }
};
var wrap = (code, presence) => {
  switch (presence) {
    case "required":
      return code;
    case "optional":
      return `Schema.optionalKey(${code})`;
    case "removable":
    case "resettable":
      return `Schema.optional(${code})`;
    case "excluded":
      throw new Error("excluded fields are not printed");
  }
};
var tabs = (indent) => "	".repeat(indent);
var struct = (entries, indent, open, world = "native", merge = false) => {
  if (entries.length === 0 && !open) return "SurrealSchema.EmptyObject";
  const body = entries.length === 0 ? "Schema.Struct({})" : `Schema.Struct({
${entries.map(
    ([key, value]) => `${tabs(indent + 1)}${propertyKey(key)}: ${value},`
  ).join("\n")}
${tabs(indent)}})`;
  return open ? `Schema.StructWithRest(${body}, [${printOpenRecord(world, merge)}])` : body;
};
var TablePrinter = class {
  constructor(table, scope, options, world = "native", visible = false) {
    this.table = table;
    this.scope = scope;
    this.options = options;
    this.world = world;
    this.visible = visible;
    this.root = buildTree(table.fields);
    this.isRelation = table.type.kind === "relation";
    this.lightweight = table.type.kind === "relation" && table.type.lightweight;
  }
  table;
  scope;
  options;
  world;
  visible;
  root;
  isRelation;
  lightweight;
  /** Some session may be refused this field when it selects it. */
  mayBeHidden(fieldNode) {
    return fieldNode.field !== void 0 && fieldNode.field.permissions.select !== true;
  }
  location(path) {
    return `${this.table.name}.${path.join(".")}`;
  }
  context(path) {
    const key = this.location(path);
    return {
      scope: this.scope,
      profile: profileFor(this.options, key),
      location: key,
      ...this.world === "json" && { world: "json" }
    };
  }
  presence(fieldNode, operation, element) {
    const override = this.options.fields?.[this.location(fieldNode.path)]?.[operation];
    const effective = element && operation !== "select" ? "create" : operation;
    const writeExcluded = this.lightweight || this.table.view !== void 0;
    const presence = override ?? derivePresence(infoOf(fieldNode), effective, writeExcluded);
    return this.visible && operation === "select" && presence === "required" && this.mayBeHidden(fieldNode) ? "optional" : presence;
  }
  /** The schema of one field in one operation, before its own presence. */
  field(fieldNode, operation, indent, element) {
    const info = infoOf(fieldNode);
    const ctx = {
      ...this.context(fieldNode.path),
      ...this.table.schemafull && !info.flexible && { closedObjects: true }
    };
    const named = namedChildren(fieldNode);
    const elementNode = fieldNode.children.get("*");
    const object = named.length === 0 ? void 0 : this.object(named, operation, indent, element, info.flexible);
    const openCollection = (info.kind?.kind === "array" || info.kind?.kind === "set") && info.kind.item.kind === "any";
    const item = elementNode !== void 0 && (elementNode.children.size > 0 || openCollection && infoOf(elementNode).kind !== void 0) ? this.field(elementNode, operation, indent, true) : void 0;
    if (info.kind === void 0) {
      return info.untypedParent && info.childRequired && object !== void 0 ? object : "Schema.Unknown";
    }
    const printed = printKind(info.kind, ctx, {
      ...object !== void 0 && { object },
      ...item !== void 0 && { item }
    });
    return applyRefinements(printed, info.kind, info.recognized, ctx);
  }
  object(children, operation, indent, element, open) {
    const entries = [];
    for (const child of children) {
      const presence = this.presence(child, operation, element);
      if (presence === "excluded") continue;
      entries.push([
        child.key,
        wrap(
          this.field(child, operation, indent + 1, element),
          presence
        )
      ]);
    }
    return struct(
      entries,
      indent,
      open,
      this.world,
      operation === "merge" && !element
    );
  }
  topLevel() {
    const reserved = this.isRelation ? ["id", "in", "out"] : ["id"];
    return namedChildren(this.root).filter(
      (child) => !reserved.includes(child.key)
    );
  }
};
var json2 = (value) => JSON.stringify(value);
var jsonList = (values) => `[${values.map((value) => JSON.stringify(value)).join(", ")}]`;
var printPermissions = (permissions) => `{ select: ${json2(permissions.select)}, create: ${json2(permissions.create)}, update: ${json2(permissions.update)}, delete: ${json2(permissions.delete)} }`;
var printFieldPermissions = (fieldNode, indent) => {
  const own = fieldNode.field?.permissions ?? {
    select: true,
    create: true,
    update: true
  };
  const head = `select: ${json2(own.select)}, create: ${json2(own.create)}, update: ${json2(own.update)}`;
  const children = sortedChildren(fieldNode);
  if (children.length === 0) return `{ ${head} }`;
  return [
    `{ ${head}, fields: {`,
    ...children.map(
      (child) => `${tabs(indent + 1)}${propertyKey(child.key)}: ${printFieldPermissions(child, indent + 1)},`
    ),
    `${tabs(indent)}} }`
  ].join("\n");
};
var printIndex = (index) => {
  const parts = [
    `type: ${json2(index.type)}`,
    `columns: [${index.columns.map((path) => jsonList(path)).join(", ")}]`
  ];
  if (index.fulltext !== void 0) {
    parts.push(
      `fulltext: { analyzer: ${json2(index.fulltext.analyzer)}, highlights: ${index.fulltext.highlights} }`
    );
  }
  if (index.vector !== void 0) {
    parts.push(
      `vector: { dimension: ${index.vector.dimension}, distance: ${json2(index.vector.distance)}, elementType: ${json2(index.vector.elementType)} }`
    );
  }
  if (index.where !== void 0) parts.push(`where: ${json2(index.where)}`);
  return `{ ${parts.join(", ")} }`;
};
var presenceLiteral = (presence) => `{ select: ${json2(presence.select)}, create: ${json2(presence.create)}, merge: ${json2(presence.merge)}, content: ${json2(presence.content)} }`;
var varianceReason = (perCode) => {
  const merge = perCode?.get("merge");
  const others = [...perCode?.entries() ?? []].filter(([operation]) => operation !== "merge").map(([, code]) => code);
  const othersAgree = others.every((code) => code === others[0]);
  return merge !== void 0 && othersAgree ? "its children are partial in Merge" : "its children differ by operation";
};
var jsonPointer = (key) => `/${key.replace(/~/g, "~0").replace(/\//g, "~1")}`;
var VARIANT_DOCS = {
  select: (name) => `A stored \`${name}\` row as a privileged reader selects it (all fields).`,
  create: (name) => `Input for \`CREATE ${name} CONTENT\` / \`INSERT\`. The record id is an operation argument.`,
  merge: (name) => `Input for \`UPDATE ${name} MERGE\`: omitting a field leaves it unchanged; \`undefined\` (NONE) removes a removable field and re-applies a resettable one's default.`,
  content: (name) => `Input for \`UPDATE ${name} CONTENT\`: a full replacement of the writable fields.`
};
var SUFFIX = {
  select: "",
  create: "Create",
  merge: "Merge",
  content: "Content"
};
var printVisible = (name, selectEntries, fields, printer, reference, selectCode, open) => {
  const byKey = new Map(fields.map((field) => [field.key, field]));
  let changed = false;
  const entries = selectEntries.map(([key, value]) => {
    const field = byKey.get(key);
    if (field === void 0) return [key, value];
    const code = printer.field(field, "select", 1, false);
    const printed = wrap(
      code === selectCode(field) ? reference(field) : code,
      printer.presence(field, "select", false)
    );
    if (printed !== value) changed = true;
    return [key, printed];
  });
  const visible = `${name}Visible`;
  const types = [
    `export type ${visible} = typeof ${visible}.Type;`,
    `export type ${visible}Encoded = typeof ${visible}.Encoded;`
  ];
  if (!changed) {
    return [
      `/** \`${name}\` as a session reads it when field permissions may hide fields: every field's select permission is FULL, so it is \`${name}\`. */`,
      `export const ${visible} = ${name};`,
      ...types,
      ""
    ];
  }
  return [
    `/** \`${name}\` as a session reads it when field permissions may hide fields: each field whose select permission is not FULL may be NONE (absent). Build statements from \`readAs(${name}Table)\`. */`,
    `export const ${visible} = ${struct(entries, 0, open)};`,
    ...types,
    ""
  ];
};
var printTable = (input) => {
  const { table, scope, options } = input;
  const registry = scope.registry;
  const pascal = registry.pascal(table.name);
  const idName = scope.useId(registry.table(table.name));
  const lines2 = [];
  const exportType = (name) => {
    lines2.push(`export type ${name} = typeof ${name}.Type;`);
    lines2.push(`export type ${name}Encoded = typeof ${name}.Encoded;`);
  };
  if (table.view !== void 0) {
    lines2.push(
      `/** \`${table.name}\` is a view: its row shape comes from its query and is not derived. */`,
      `export const ${pascal}Table = SurrealSchema.view({`,
      `	name: ${json2(table.name)},`,
      `	type: "view",`,
      `	id: ${idName},`,
      `	view: ${json2(table.view.select)},`,
      `	permissions: ${printPermissions(table.permissions)},`,
      "});"
    );
    return lines2.join("\n");
  }
  const printer = new TablePrinter(table, scope, options);
  const fields = printer.topLevel();
  const operations = printer.lightweight ? ["select"] : OPERATIONS;
  const presence = /* @__PURE__ */ new Map();
  const codes = /* @__PURE__ */ new Map();
  for (const field of fields) {
    const perOperation = {};
    const perCode = /* @__PURE__ */ new Map();
    for (const operation of OPERATIONS) {
      const p = operations.includes(operation) ? printer.presence(field, operation, false) : "excluded";
      perOperation[operation] = p;
      if (p !== "excluded")
        perCode.set(
          operation,
          printer.field(field, operation, 1, false)
        );
    }
    presence.set(field.key, perOperation);
    codes.set(field.key, perCode);
  }
  const shared = fields.filter((field) => {
    const perCode = [...codes.get(field.key)?.values() ?? []];
    return perCode.length > 0 && perCode.every((code) => code === perCode[0]);
  });
  const sharedKeys = new Set(shared.map((field) => field.key));
  const fieldsName = `${pascal}Fields`;
  const variant = fields.filter((field) => !sharedKeys.has(field.key)).map(
    (field) => `\`${field.key}\` (${varianceReason(codes.get(field.key))})`
  );
  const doc = (summary) => variant.length === 0 ? [`/** ${summary} */`] : [
    "/**",
    ` * ${summary}`,
    " *",
    ` * Not listed, because their schema differs by operation: ${variant.join(", ")}.`,
    " * Narrow such a field in the variant schemas that use it.",
    " */"
  ];
  if (shared.length > 0) {
    lines2.push(
      ...doc(
        `Field schemas of \`${table.name}\` that are the same in every operation using them; \`refine\` and \`replaceField\` accept these keys.`
      ),
      `export const ${fieldsName} = {`,
      ...shared.map(
        (field) => `	${propertyKey(field.key)}: ${codes.get(field.key)?.values().next().value},`
      ),
      "} as const;",
      ""
    );
  } else {
    lines2.push(
      ...doc(
        `No field of \`${table.name}\` is shared by every operation.`
      ),
      `export const ${fieldsName} = {} as const;`,
      ""
    );
  }
  const endpoint = (tables) => printRecord(tables, {
    scope,
    profile: profileFor(options, table.name),
    location: table.name
  });
  const relationType = table.type.kind === "relation" ? table.type : void 0;
  const open = !table.schemafull;
  for (const operation of operations) {
    const name = `${pascal}${SUFFIX[operation]}`;
    const entries = [];
    if (operation === "select") {
      entries.push(["id", idName]);
      if (relationType !== void 0) {
        entries.push(
          ["in", endpoint(relationType.in)],
          ["out", endpoint(relationType.out)]
        );
      }
    }
    for (const field of fields) {
      const p = presence.get(field.key)?.[operation] ?? "excluded";
      if (p === "excluded") continue;
      const code = sharedKeys.has(field.key) ? `${fieldsName}${propertyAccess(field.key)}` : codes.get(field.key)?.get(operation);
      entries.push([field.key, wrap(code, p)]);
    }
    lines2.push(`/** ${VARIANT_DOCS[operation](table.name)} */`);
    lines2.push(
      `export const ${name} = ${struct(entries, 0, open, "native", operation === "merge")};`
    );
    exportType(name);
    lines2.push("");
    if (operation === "select") {
      lines2.push(
        `/** \`${name}\` for rows the SDK returned: NONE (an \`undefined\` property) is removed first, so an optional field decodes as absent. */`,
        `export const ${name}Row = SurrealSchema.NoneAsAbsent(${name});`
      );
      exportType(`${name}Row`);
      lines2.push("");
      lines2.push(
        ...printVisible(
          name,
          entries,
          fields,
          new TablePrinter(table, scope, options, "native", true),
          (field) => sharedKeys.has(field.key) ? `${fieldsName}${propertyAccess(field.key)}` : codes.get(field.key)?.get("select"),
          (field) => codes.get(field.key)?.get("select"),
          open
        )
      );
    }
  }
  if (options.patch === true && !printer.lightweight) {
    const ops = [];
    for (const field of fields) {
      const p = presence.get(field.key)?.merge ?? "excluded";
      if (p === "excluded") continue;
      const value = sharedKeys.has(field.key) ? `${fieldsName}${propertyAccess(field.key)}` : codes.get(field.key)?.get("merge");
      const path = json2(jsonPointer(field.key));
      ops.push(
        `	Schema.Struct({ op: Schema.Literals(["add", "replace"]), path: Schema.Literal(${path}), value: ${value} }),`
      );
      if (p === "removable" || p === "resettable") {
        ops.push(
          `	Schema.Struct({ op: Schema.Literal("remove"), path: Schema.Literal(${path}) }),`
        );
      }
    }
    if (ops.length > 0) {
      lines2.push(
        `/** JSON Patch operations on \`${table.name}\` (generated behind the \`patch\` flag; not yet qualified against an engine). */`,
        `export const ${pascal}Patch = Schema.Union([`,
        ...ops,
        "]);"
      );
      exportType(`${pascal}Patch`);
      lines2.push("");
    }
  }
  if (relationType !== void 0) {
    const ends = (tables) => tables.length === 0 ? "[SurrealSchema.RecordIdAny]" : `[${tables.map((t) => scope.useId(registry.table(t))).join(", ")}]`;
    lines2.push(
      `/** Endpoints of the \`${table.name}\` relation, for typed \`RELATE\` arguments. */`,
      `export const ${pascal}Edge = SurrealSchema.edge({`,
      `	table: ${json2(table.name)},`,
      `	in: ${ends(relationType.in)},`,
      `	out: ${ends(relationType.out)},`,
      `	enforced: ${relationType.enforced},`,
      `	lightweight: ${relationType.lightweight},`,
      "});",
      ""
    );
  }
  const presenceEntries = [
    [
      "id",
      {
        select: "required",
        create: "excluded",
        merge: "excluded",
        content: "excluded"
      }
    ]
  ];
  if (relationType !== void 0) {
    presenceEntries.push(
      [
        "in",
        {
          select: "required",
          create: "excluded",
          merge: "excluded",
          content: "excluded"
        }
      ],
      [
        "out",
        {
          select: "required",
          create: "excluded",
          merge: "excluded",
          content: "excluded"
        }
      ]
    );
  }
  for (const field of fields) {
    presenceEntries.push([
      field.key,
      presence.get(field.key)
    ]);
  }
  lines2.push(
    `/** Descriptor of \`${table.name}\`${table.comment === void 0 ? "" : `: ${table.comment.replace(/\*\//g, "* /")}`}. */`,
    `export const ${pascal}Table = SurrealSchema.table({`,
    `	name: ${json2(table.name)},`,
    `	type: ${json2(table.type.kind)},`,
    `	schemafull: ${table.schemafull},`,
    `	drop: ${table.drop},`,
    `	id: ${idName},`,
    ...operations.flatMap(
      (operation) => operation === "select" ? [`	select: ${pascal},`, `	visible: ${pascal}Visible,`] : [`	${operation}: ${pascal}${SUFFIX[operation]},`]
    ),
    `	fields: ${fieldsName},`,
    "	presence: {",
    ...presenceEntries.map(
      ([key, p]) => `		${propertyKey(key)}: ${presenceLiteral(p)},`
    ),
    "	},",
    `	relations: { in: ${jsonList(input.relations.in)}, out: ${jsonList(input.relations.out)} },`,
    `	permissions: ${printPermissions(table.permissions)},`,
    ...fields.length === 0 ? ["	fieldPermissions: {},"] : [
      "	fieldPermissions: {",
      ...fields.map(
        (field) => `		${propertyKey(field.key)}: ${printFieldPermissions(field, 2)},`
      ),
      "	},"
    ],
    ...table.indexes.length === 0 ? ["	indexes: {},"] : [
      "	indexes: {",
      ...table.indexes.map(
        (index) => `		${propertyKey(index.name)}: ${printIndex(index)},`
      ),
      "	},"
    ],
    ...relationType === void 0 ? [] : [`	edge: ${pascal}Edge,`],
    "});"
  );
  lines2.push("", ...printJsonWorld(input, fields, endpoint, relationType));
  return lines2.join("\n");
};
var printJsonWorld = (input, fields, endpoint, relationType) => {
  const { table, scope, options } = input;
  const pascal = scope.registry.pascal(table.name);
  const idName = scope.useId(scope.registry.table(table.name));
  const printer = new TablePrinter(table, scope, options, "json");
  const jsonFields = `${pascal}JsonFields`;
  const selected = fields.map(
    (field) => [field, printer.presence(field, "select", false)]
  ).filter(([, presence]) => presence !== "excluded");
  const fromJson = (code) => `SurrealSchema.RecordIdFromJsonAs(${code})`;
  const entries = [
    ["id", fromJson(idName)]
  ];
  if (relationType !== void 0) {
    entries.push(
      ["in", fromJson(endpoint(relationType.in))],
      ["out", fromJson(endpoint(relationType.out))]
    );
  }
  for (const [field, presence] of selected) {
    entries.push([
      field.key,
      wrap(`${jsonFields}${propertyAccess(field.key)}`, presence)
    ]);
  }
  return [
    `/** JSON world: the field schemas of a selected \`${table.name}\` row as SurrealDB's HTTP \`/sql\` renders it (lossy; see the effect-surrealkit README), decoding to the native types. */`,
    `export const ${jsonFields} = {`,
    ...selected.map(
      ([field]) => `	${propertyKey(field.key)}: ${printer.field(field, "select", 1, false)},`
    ),
    "} as const;",
    "",
    `/** A selected \`${table.name}\` row from SurrealDB JSON. Not the default: rows the SDK returned decode with \`${pascal}Row\`. */`,
    `export const ${pascal}FromJson = ${struct(entries, 0, !table.schemafull, "json")};`,
    `export type ${pascal}JsonEncoded = typeof ${pascal}FromJson.Encoded;`
  ];
};

// src/emitter/version.ts
var EMITTER_VERSION = "0.1.0";
var PEER_VERSIONS = { effect: "4.1.5", surrealdb: "2.2.2" };

// src/emitter/generate.ts
var GenerateError = class extends Data3.TaggedError("GenerateError") {
};
var fail = (message) => {
  throw new GenerateError({ message });
};
var RESERVED_FILES = /* @__PURE__ */ new Set(["ids", "functions", "manifest", "index"]);
var json3 = (value) => JSON.stringify(value);
var jsonList2 = (values) => `[${values.map((value) => JSON.stringify(value)).join(", ")}]`;
var HEADER = "// Generated by effect-surrealkit from a SurrealKit schema document. Do not edit.";
var imports = (body, ids, fromIds, ext) => {
  const lines2 = [];
  if (/\bSchema\./.test(body)) lines2.push('import { Schema } from "effect";');
  if (/\bSurrealSchema\./.test(body)) {
    lines2.push('import * as SurrealSchema from "effect-surrealkit";');
    lines2.push('import type {} from "surrealdb";');
  }
  if (fromIds && ids.size > 0) {
    lines2.push(
      `import { ${[...ids].sort(compare).join(", ")} } from "./ids${ext}";`
    );
  }
  return lines2.join("\n");
};
var assemble = (importLines, body) => `${[HEADER, importLines, body].filter((part) => part.length > 0).join("\n\n")}
`;
var gateDiagnostics = (document, options) => {
  const acknowledged = options.acknowledge ?? {};
  const blocking = document.diagnostics.filter(
    (diagnostic) => diagnostic.severity === "error" && acknowledged[diagnostic.code] === void 0
  );
  if (blocking.length > 0) {
    const listed = blocking.map((d) => {
      const where = [d.table, d.field?.join("."), d.function].filter(Boolean).join(" ");
      return `  ${d.code}${where === "" ? "" : ` (${where})`}: ${d.reason}`;
    }).join("\n");
    fail(
      `the schema document has error diagnostics; fix them or acknowledge each code with a reason in the emitter options (acknowledge):
${listed}`
    );
  }
};
var checkNames = (document, registry) => {
  const files = /* @__PURE__ */ new Map();
  const exports = /* @__PURE__ */ new Map();
  const claim = (map, name, owner, what) => {
    const previous = map.get(name);
    if (previous !== void 0 && previous !== owner) {
      fail(
        `${what} \`${name}\` would be generated for both ${previous} and ${owner}; give one of them another name in the emitter options (names)`
      );
    }
    map.set(name, owner);
  };
  for (const table of document.tables) {
    const owner = `table \`${table.name}\``;
    const file = registry.file(table.name);
    if (RESERVED_FILES.has(file)) {
      fail(
        `table \`${table.name}\` would be written to ${file}.ts, which the emitter reserves`
      );
    }
    claim(files, file, owner, "module");
    const pascal = registry.pascal(table.name);
    for (const suffix of [
      "",
      "Row",
      "Visible",
      "Id",
      "Create",
      "Merge",
      "Content",
      "Patch",
      "Fields",
      "Table",
      "Edge"
    ]) {
      claim(exports, `${pascal}${suffix}`, owner, "export");
    }
  }
  for (const fn of document.functions) {
    claim(
      exports,
      functionIdentifier(fn.name),
      `function \`${fn.name}\``,
      "export"
    );
  }
  return exports;
};
var printIdKeys = (registry, options, tables, warnings) => {
  const keys = /* @__PURE__ */ new Map();
  for (const { name, idKey } of tables) {
    if (idKey === void 0) continue;
    const scope = new ModuleScope(registry, warnings);
    const location = `${name}.id`;
    const profile = {
      ...profileFor(options, location),
      datetime: "sdk"
    };
    keys.set(name, {
      code: printKind(idKey, { scope, profile, location }),
      dependencies: scope.ids
    });
  }
  return keys;
};
var orderIds = (expressions) => {
  const declarations = /* @__PURE__ */ new Map();
  const ready = [];
  for (const [name, expression] of expressions) {
    const declaration = {
      ...expression,
      name,
      rank: declarations.size,
      dependents: [],
      remaining: expression.dependencies.size
    };
    declarations.set(name, declaration);
    if (declaration.remaining === 0) ready.push(declaration);
  }
  for (const declaration of declarations.values()) {
    for (const dependency of declaration.dependencies) {
      const target = declarations.get(dependency) ?? fail(`missing record ID declaration ${dependency}`);
      target.dependents.push(declaration);
    }
  }
  ready.reverse();
  const ordered = [];
  for (let next = ready.pop(); next !== void 0; next = ready.pop()) {
    ordered.push(next.code);
    for (const dependent of next.dependents) {
      dependent.remaining -= 1;
      if (dependent.remaining !== 0) continue;
      const index = ready.findIndex(
        (other) => other.rank < dependent.rank
      );
      ready.splice(index === -1 ? ready.length : index, 0, dependent);
    }
  }
  if (ordered.length !== declarations.size) {
    const blocked = [...declarations.values()].filter((declaration) => declaration.remaining > 0).map((declaration) => declaration.name);
    fail(
      `cyclic record ID key dependencies prevent initializing ${blocked.join(", ")}`
    );
  }
  return ordered.join("\n\n");
};
var printIds = (registry, options, keys) => {
  const declarations = /* @__PURE__ */ new Map();
  for (const [table, name] of registry.tables) {
    const idKey = keys.get(table);
    const brand = `Schema.brand(${json3(`${options.store}/${table}`)})`;
    const key = idKey === void 0 ? "" : `, { key: ${idKey.code} }`;
    const note = registry.isDefined(table) ? "" : " (referenced, not defined in this schema)";
    declarations.set(name, {
      code: [
        `/** Record id of \`${table}\`${note}. */`,
        `export const ${name} = SurrealSchema.RecordIdFor(${json3(table)}${key}).pipe(${brand});`,
        `export type ${name} = typeof ${name}.Type;`
      ].join("\n"),
      dependencies: idKey?.dependencies ?? /* @__PURE__ */ new Set()
    });
  }
  for (const [name, tables] of registry.unions) {
    const tagged = IdRegistry.tagged(name);
    const spelled = `record<${tables.join(" | ")}>`;
    const members = tables.map((table) => registry.table(table));
    declarations.set(name, {
      code: [
        `/** \`${spelled}\`. */`,
        `export const ${name} = Schema.Union([${members.join(", ")}]);`,
        `export type ${name} = typeof ${name}.Type;`,
        `/** \`${spelled}\` as \`{ _tag, id }\`, to match on the table. An application representation; never stored. */`,
        `export const ${tagged} = SurrealSchema.taggedRecordId({ ${tables.map(
          (table, index) => `${propertyKey(table)}: ${members[index]}`
        ).join(", ")} });`,
        `export type ${tagged} = typeof ${tagged}.Type;`
      ].join("\n"),
      dependencies: new Set(members)
    });
  }
  return orderIds(declarations);
};
var printFunction = (fn, scope, options) => {
  const ctx = (location) => ({
    scope,
    profile: profileFor(options, fn.name),
    location
  });
  const args = fn.args.map((arg) => {
    const code = printKind(arg.kind, ctx(`${fn.name}($${arg.name})`));
    if (!arg.optional) return code;
    return arg.omittable ? `Schema.optional(${code})` : `Schema.UndefinedOr(${code})`;
  });
  const returns = fn.returns === void 0 ? "Schema.Unknown" : printKind(fn.returns, ctx(`${fn.name} -> return`));
  const doc = fn.comment === void 0 ? `\`${fn.name}\`` : `\`${fn.name}\`: ${fn.comment.replace(/\*\//g, "* /")}`;
  return [
    `/** ${doc} */`,
    `export const ${functionIdentifier(fn.name)} = SurrealSchema.fn({`,
    `	name: ${json3(fn.name)},`,
    `	args: Schema.Tuple([${args.join(", ")}]),`,
    `	returns: ${returns},`,
    "});"
  ].join("\n");
};
var printManifest = (document, options) => {
  const { generator, engine, adapter, source } = document.provenance;
  const sourceLines = source.kind === "compile" ? [
    `		kind: "compile",`,
    `		modules: ${jsonList2(source.modules)},`
  ] : [`		kind: "introspect",`];
  return [
    "/** What these modules were generated from, and how. */",
    "export const manifest = {",
    `	store: ${json3(options.store)},`,
    `	semanticDigest: ${json3(document.semanticDigest)},`,
    `	emitter: { name: "effect-surrealkit", version: ${json3(EMITTER_VERSION)} },`,
    `	profile: { int: ${json3(options.int ?? "safe-number")}, datetime: ${json3(options.datetime ?? "sdk")} },`,
    `	peers: { effect: ${json3(PEER_VERSIONS.effect)}, surrealdb: ${json3(PEER_VERSIONS.surrealdb)} },`,
    "	source: {",
    ...sourceLines,
    `		surrealkit: ${json3(generator.version)},`,
    ...generator.commit === void 0 ? [] : [`		commit: ${json3(generator.commit)},`],
    `		engine: ${json3(engine.version)},`,
    `		adapter: ${json3(adapter)},`,
    "	},",
    `	tables: ${jsonList2(document.tables.map((table) => table.name))},`,
    `	functions: ${jsonList2(document.functions.map((fn) => fn.name))},`,
    "} as const;"
  ].join("\n");
};
var printStore = (tables, functions, registry, options, ext) => {
  const imported = /* @__PURE__ */ new Map();
  const use = (module, name) => {
    imported.set(module, [...imported.get(module) ?? [], name]);
    return name;
  };
  const entries = (pairs) => pairs.length === 0 ? "{}" : `{
${pairs.map(([key, value]) => `		${propertyKey(key)}: ${value},`).join("\n")}
	}`;
  const typeEntries = (pairs) => pairs.length === 0 ? "SurrealSchema.NoEntries" : `{
${pairs.map(([key, value]) => `		readonly ${propertyKey(key)}: typeof ${value};`).join("\n")}
	}`;
  const tableEntries = [];
  const viewEntries = [];
  const edgeEntries = [];
  for (const table of tables) {
    const module = `./${registry.file(table.name)}${ext}`;
    const pascal = registry.pascal(table.name);
    const descriptor = use(module, `${pascal}Table`);
    if (table.view !== void 0) {
      viewEntries.push([table.name, descriptor]);
      continue;
    }
    tableEntries.push([table.name, descriptor]);
    if (table.type.kind === "relation") {
      edgeEntries.push([table.name, use(module, `${pascal}Edge`)]);
    }
  }
  const functionEntries = functions.map(
    (fn) => [
      fn.name,
      use(`./functions${ext}`, functionIdentifier(fn.name))
    ]
  );
  const importLines = [...imported.entries()].sort(([a], [b]) => compare(a, b)).map(
    ([module, names]) => `import { ${[...names].sort(compare).join(", ")} } from "${module}";`
  );
  const body = [
    "/** The type of `store`. Each entry names its descriptor, so a declaration file refers to the descriptors instead of copying them. */",
    "export interface Store {",
    `	readonly name: ${json3(options.store)};`,
    `	readonly tables: ${typeEntries(tableEntries)};`,
    `	readonly views: ${typeEntries(viewEntries)};`,
    `	readonly edges: ${typeEntries(edgeEntries)};`,
    `	readonly functions: ${typeEntries(functionEntries)};`,
    "}",
    "",
    `/** Every table, view, relation endpoint and function of store \`${options.store}\`, by its SurrealDB name. */`,
    "export const store: Store = SurrealSchema.store({",
    `	name: ${json3(options.store)},`,
    `	tables: ${entries(tableEntries)},`,
    `	views: ${entries(viewEntries)},`,
    `	edges: ${entries(edgeEntries)},`,
    `	functions: ${entries(functionEntries)},`,
    "});"
  ].join("\n");
  return assemble(
    [
      'import * as SurrealSchema from "effect-surrealkit";',
      'import type {} from "surrealdb";',
      ...importLines
    ].join("\n"),
    body
  );
};
var emit = (document, options, hooks = {}) => {
  gateDiagnostics(document, options);
  if (hooks.sha256 !== void 0) {
    const actual = semanticDigest(
      document,
      hooks.sha256
    );
    if (actual !== document.semanticDigest) {
      fail(
        `semanticDigest mismatch: the document declares ${document.semanticDigest} but its semantic content hashes to ${actual}; regenerate it with surrealkit instead of editing it`
      );
    }
  }
  const registry = new IdRegistry(document, options.names ?? {});
  const ext = options.importExtension ?? ".js";
  const claimed = checkNames(document, registry);
  const warnings = document.diagnostics.filter((diagnostic) => diagnostic.severity === "warning").map((d) => {
    const where = [d.table, d.field?.join("."), d.function].filter(Boolean).join(" ");
    return `document: ${d.code}${where === "" ? "" : ` (${where})`}: ${d.reason}`;
  });
  const tables = [...document.tables].sort((a, b) => compare(a.name, b.name));
  const relationsOf = (name) => {
    const ins = [];
    const outs = [];
    for (const table of tables) {
      if (table.type.kind !== "relation") continue;
      if (table.type.in.includes(name)) ins.push(table.name);
      if (table.type.out.includes(name)) outs.push(table.name);
    }
    return { in: ins, out: outs };
  };
  const files = [];
  for (const table of tables) {
    const scope = new ModuleScope(registry, warnings);
    const body = printTable({
      table,
      scope,
      options,
      relations: relationsOf(table.name)
    });
    const ownId = registry.table(table.name);
    const reexport = `export { ${ownId} } from "./ids${ext}";`;
    files.push({
      path: `${registry.file(table.name)}.ts`,
      content: assemble(
        imports(body, scope.ids, true, ext),
        `${reexport}

${body}`
      )
    });
  }
  const functionScope = new ModuleScope(registry, warnings);
  const functions = [...document.functions].sort(
    (a, b) => compare(a.name, b.name)
  );
  const functionBody = functions.length === 0 ? "export {};" : functions.map((fn) => printFunction(fn, functionScope, options)).join("\n\n");
  files.push({
    path: "functions.ts",
    content: assemble(
      imports(functionBody, functionScope.ids, true, ext),
      functionBody
    )
  });
  const idKeys = printIdKeys(registry, options, tables, warnings);
  const exported = new Map(claimed);
  for (const [table, name] of registry.tables) {
    if (registry.isDefined(table)) continue;
    const owner = exported.get(name);
    if (owner !== void 0) {
      fail(
        `export \`${name}\` would be generated for both ${owner} and the referenced table \`${table}\`; give one of them another name in the emitter options (names)`
      );
    }
    exported.set(name, `the referenced table \`${table}\``);
  }
  for (const [name, first, other] of registry.conflicts) {
    fail(
      `export \`${name}\` would be generated for both record<${first.join(" | ")}> and record<${other.join(" | ")}>; give one of their tables another name in the emitter options (names)`
    );
  }
  for (const [name, tables2] of registry.unions) {
    for (const unionExport of [name, IdRegistry.tagged(name)]) {
      const owner = exported.get(unionExport);
      if (owner !== void 0) {
        fail(
          `export \`${unionExport}\` would be generated for both record<${tables2.join(" | ")}> and ${owner}; give one of the tables another name in the emitter options (names)`
        );
      }
    }
  }
  const idsBody = printIds(registry, options, idKeys) || "export {};";
  files.push({
    path: "ids.ts",
    content: assemble(imports(idsBody, /* @__PURE__ */ new Set(), false, ext), idsBody)
  });
  const manifestBody = printManifest(document, options);
  files.push({
    path: "manifest.ts",
    content: assemble("", manifestBody)
  });
  files.push({
    path: "_store.ts",
    content: printStore(tables, functions, registry, options, ext)
  });
  const barrel = [
    `export * from "./ids${ext}";`,
    ...tables.map(
      (table) => `export * from "./${registry.file(table.name)}${ext}";`
    ),
    `export * from "./functions${ext}";`,
    `export { manifest } from "./manifest${ext}";`,
    `export { store } from "./_store${ext}";`
  ].join("\n");
  files.push({ path: "index.ts", content: assemble("", barrel) });
  files.sort((a, b) => compare(a.path, b.path));
  return { files, warnings: [...new Set(warnings)].sort(compare) };
};
var generate = (document, options, hooks = {}) => Effect3.gen(function* () {
  const decoded = yield* decodeDocument(document);
  const decodedOptions = yield* decodeOptions(options);
  return yield* Effect3.try({
    try: () => emit(decoded, decodedOptions, hooks),
    catch: (error) => error instanceof GenerateError ? error : new GenerateError({
      message: error instanceof Error ? error.message : String(error)
    })
  });
});

// src/cli/files.ts
import { randomBytes } from "crypto";
import {
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  rmdir,
  writeFile
} from "fs/promises";
import { dirname, join } from "path";
var listDir = async (dir) => {
  try {
    return await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
};
var generatedFilesIn = async (dir, owned2, depth = 0, prefix = "") => {
  const found = /* @__PURE__ */ new Map();
  const entries = (await listDir(dir)).sort(
    (a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0
  );
  for (const entry of entries) {
    const path = `${prefix}${entry.name}`;
    if (entry.isDirectory()) {
      if (depth > 0) {
        const nested = await generatedFilesIn(
          join(dir, entry.name),
          owned2,
          depth - 1,
          `${path}/`
        );
        for (const [key, value] of nested) found.set(key, value);
      }
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;
    const content = await readFile(join(dir, entry.name), "utf8");
    if (owned2(content)) found.set(path, content);
  }
  return found;
};
var compareWith = async (dir, files, owned2, depth = 0) => {
  const existing = await generatedFilesIn(dir, owned2, depth);
  const missing = [];
  const changed = [];
  const foreign = [];
  for (const file of files) {
    const mine = existing.get(file.path);
    const current = mine ?? await readFile(join(dir, file.path), "utf8").catch(
      () => void 0
    );
    if (current === void 0) missing.push(file.path);
    else if (current !== file.content) {
      changed.push(file.path);
      if (mine === void 0) foreign.push(file.path);
    }
  }
  const produced = new Set(files.map((file) => file.path));
  const stale = [...existing.keys()].filter((path) => !produced.has(path));
  return { missing, changed, stale, foreign };
};
var writeAtomic = async (path, content) => {
  const temp = `${path}.${randomBytes(6).toString("hex")}.tmp`;
  await writeFile(temp, content, "utf8");
  try {
    await rename(temp, path);
  } catch (error) {
    await rm(temp, { force: true });
    throw error;
  }
};
var apply = async (dir, files, drift) => {
  await mkdir(dir, { recursive: true });
  for (const file of files) {
    if (drift.missing.includes(file.path) || drift.changed.includes(file.path)) {
      const path = join(dir, file.path);
      await mkdir(dirname(path), { recursive: true });
      await writeAtomic(path, file.content);
    }
  }
  for (const path of drift.stale) {
    await rm(join(dir, path));
    let parent = dirname(path);
    while (parent !== "." && parent !== "") {
      const held = await listDir(join(dir, parent));
      if (held.length > 0) break;
      await rmdir(join(dir, parent));
      parent = dirname(parent);
    }
  }
  return drift.missing.length + drift.changed.length + drift.stale.length;
};
var problemsOf = (drift) => [
  ...drift.missing.map((path) => `missing: ${path}`),
  ...drift.changed.map((path) => `out of date or edited: ${path}`),
  ...drift.stale.map((path) => `stale: ${path}`)
];

// src/cli/io.ts
var UsageError = class extends Error {
};

// src/cli/statements.ts
import { readdir as readdir2, readFile as readFile2, stat } from "fs/promises";
import { join as join2, relative, resolve as resolve2, sep } from "path";
import { parseArgs } from "util";
import { Effect as Effect8 } from "effect";

// src/internal/surql-lexer.ts
import { Data as Data4 } from "effect";
var AnalyzeError = class extends Data4.TaggedError("AnalyzeError") {
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
  const fail2 = (code, message, offset) => {
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
        fail2(
          "invalidEscape",
          `invalid escape sequence \`\\${next ?? ""}\` in ${what}`,
          i2
        );
      }
      value += c;
      i2++;
    }
    return fail2("unterminated", `unterminated ${what}`, from);
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
          fail2(
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
      if (end === -1) fail2("unterminated", "unterminated comment", i);
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
      fail2(
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
        fail2("unbalanced", `\`${c}\` closes nothing`, i);
      } else if (OPEN.get(open2.char) !== c) {
        fail2(
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
            fail2("unterminated", "unterminated regex literal", i);
          push("regex", i, end + 1, sql.slice(i + 1, end));
          i = end + 1;
          continue;
        }
        if (sql[end] === "/") {
          fail2(
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
    fail2(
      "unexpectedCharacter",
      `cannot classify ${JSON.stringify(String.fromCodePoint(sql.codePointAt(i) ?? 0))} outside a string, identifier or comment`,
      i
    );
  }
  const open = brackets.pop();
  if (open !== void 0) {
    fail2("unbalanced", `\`${open.char}\` is never closed`, open.offset);
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
  let run2 = name + 1;
  while (run2 < sql.length && isHoleNameChar(sql[run2])) run2++;
  for (let end = run2; end > name; end--) {
    if (sql.startsWith(holes.close, end)) return end + holes.close.length;
  }
  return -1;
};
var lex2 = (sql, holes) => lex(sql, (start) => holeEnd(sql, start, holes));

// src/analyze/render.ts
import { Data as Data5, Effect as Effect5 } from "effect";

// src/analyze/analyze.ts
import { Effect as Effect4 } from "effect";

// src/analyze/lock.ts
var upper = (token) => token?.kind === "word" ? token.value.toUpperCase() : "";
var isPunct = (token, char) => token?.kind === "punct" && token.value === char;
var isOpen = (token) => isPunct(token, "(") || isPunct(token, "[") || isPunct(token, "{");
var isClose = (token) => isPunct(token, ")") || isPunct(token, "]") || isPunct(token, "}");
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
    if (isOpen(tokens[j])) {
      let depth = 0;
      for (; j < end; j++) {
        if (isOpen(tokens[j])) depth++;
        else if (isClose(tokens[j]) && --depth === 0) break;
      }
      continue;
    }
    if (!isPunct(tokens[j - 1], ".") && !isPunct(tokens[j - 1], ":"))
      level.push(j);
  }
  const at = level.findIndex(
    (j, k) => upper(tokens[j]) === "FOR" && level[k + 1] === j + 1 && upper(tokens[j + 1]) === "UPDATE"
  );
  if (at === -1) return { kind: "none" };
  const index = level[at];
  for (const j of level.slice(at + 2))
    if (!AFTER.has(upper(tokens[j]))) return { kind: "refused" };
  for (const j of level.slice(0, at))
    if (EXCLUDED.has(upper(tokens[j]))) return { kind: "refused" };
  return { kind: "locked", at: index };
};

// src/analyze/projections.ts
var upper2 = (token) => token?.kind === "word" ? token.value.toUpperCase() : "";
var isPunct2 = (token, char) => token?.kind === "punct" && token.value === char;
var isOpen2 = (token) => isPunct2(token, "(") || isPunct2(token, "[") || isPunct2(token, "{");
var isClose2 = (token) => isPunct2(token, ")") || isPunct2(token, "]") || isPunct2(token, "}");
var isPlainString = (token) => token?.kind === "string" && (token.prefix === void 0 || token.prefix === "s");
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
var analyzeProjections = (tokens) => {
  const found = /* @__PURE__ */ new Map();
  const closing = (at) => {
    let depth = 0;
    for (let j = at; j < tokens.length; j++) {
      if (isOpen2(tokens[j])) depth++;
      else if (isClose2(tokens[j])) {
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
    if (upper2(tokens[j]) === "ONLY") j++;
    const token = tokens[j];
    let table;
    let record2 = false;
    if (token?.kind === "word" && token.value.toLowerCase() === "type" && isPunct2(tokens[j + 1], ":")) {
      const fn = tokens[j + 3];
      const name = fn?.kind === "word" ? fn.value.toLowerCase() : "";
      if (!isPunct2(tokens[j + 2], ":") || !["record", "thing", "table"].includes(name) || !isPunct2(tokens[j + 4], "(") || !isPlainString(tokens[j + 5]) || !isPunct2(tokens[j + 6], name === "table" ? ")" : ","))
        return void 0;
      table = tokens[j + 5].value;
      record2 = name !== "table";
      j = closing(j + 4) + 1;
    } else {
      table = bareName(j);
      if (table === void 0 || AFTER_TARGET.has(upper2(token)))
        return void 0;
      j++;
      if (isPunct2(tokens[j], ":")) {
        const key = tokens[j + 1];
        if (key === void 0 || key.kind === "punct" && !isOpen2(key))
          return void 0;
        j = isOpen2(key) ? closing(j + 1) + 1 : j + 2;
        record2 = true;
      }
    }
    if (lock !== void 0 && !record2) return void 0;
    const next = tokens[j];
    return j >= end || j === lock || isPunct2(next, ";") || AFTER_TARGET.has(upper2(next)) ? table : void 0;
  };
  const record = (table, field, line) => {
    found.set(JSON.stringify([line, table, field]), { table, field, line });
  };
  const nested = (start2, stop) => {
    for (let i = start2; i < stop; i++) {
      if (!isOpen2(tokens[i])) continue;
      const close = closing(i);
      if (isPunct2(tokens[i], "(") && upper2(tokens[i + 1]) === "SELECT")
        select(i + 1, close);
      else nested(i + 1, close);
      i = close;
    }
  };
  const select = (from, end) => {
    nested(from + 1, end);
    const froms = [];
    for (let j = from + 1; j < end; j++) {
      if (isOpen2(tokens[j])) {
        j = closing(j);
        continue;
      }
      if (upper2(tokens[j]) === "FROM" && !isPunct2(tokens[j - 1], ".") && !isPunct2(tokens[j - 1], ":"))
        froms.push(j);
    }
    if (froms.length !== 1) return;
    const at = froms[0];
    const lock = lockOf(tokens, from, end);
    if (lock.kind === "refused") return;
    for (let j = at + 1; j < end; j++) {
      if (isOpen2(tokens[j])) j = closing(j);
      else if (upper2(tokens[j]) === "PARALLEL" && !isPunct2(tokens[j - 1], ".") && !isPunct2(tokens[j - 1], ":"))
        return;
    }
    const table = targetTable(
      at + 1,
      end,
      lock.kind === "locked" ? lock.at : void 0
    );
    if (table === void 0) return;
    const fields = [];
    if (upper2(tokens[from + 1]) === "VALUE") {
      const name = at === from + 3 ? bareName(from + 2) : void 0;
      if (name !== void 0)
        record(table, name, tokens[from + 2].line);
      return;
    }
    let start2 = from + 1;
    for (let k = from + 1; k <= at; k++) {
      if (k < at && isOpen2(tokens[k])) {
        k = closing(k);
        continue;
      }
      if (k < at && upper2(tokens[k]) === "OMIT") return;
      if (k !== at && !isPunct2(tokens[k], ",")) continue;
      const item = tokens[start2];
      const name = k - start2 === 1 ? isPunct2(item, "*") ? "*" : bareName(start2) : k - start2 === 3 && upper2(tokens[start2 + 1]) === "AS" && bareName(start2 + 2) !== void 0 ? bareName(start2) : void 0;
      if (name !== void 0)
        fields.push({ field: name, line: item.line });
      start2 = k + 1;
    }
    for (const { field, line } of fields) record(table, field, line);
  };
  let start = 0;
  for (let i = 0; i <= tokens.length; i++) {
    const token = tokens[i];
    if (token !== void 0 && isOpen2(token)) {
      i = closing(i);
      continue;
    }
    if (token !== void 0 && !isPunct2(token, ";")) continue;
    let first = start;
    if (upper2(tokens[first]) === "LET" && tokens[first + 1]?.kind === "param" && isPunct2(tokens[first + 2], "=") && !isPunct2(tokens[first + 3], "="))
      first += 3;
    else if (upper2(tokens[first]) === "RETURN") first += 1;
    if (first < i) {
      if (upper2(tokens[first]) === "SELECT") select(first, i);
      else nested(start, i);
    }
    start = i + 1;
  }
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
var upper3 = (token) => token?.kind === "word" ? token.value.toUpperCase() : "";
var isPunct3 = (token, char) => token?.kind === "punct" && token.value === char;
var isOpen3 = (token) => isPunct3(token, "(") || isPunct3(token, "[") || isPunct3(token, "{");
var isClose3 = (token) => isPunct3(token, ")") || isPunct3(token, "]") || isPunct3(token, "}");
var isName = (token) => token?.kind === "word" && /^[A-Za-z_]/u.test(token.value) || token?.kind === "ident";
var isPlainString2 = (token) => token?.kind === "string" && (token.prefix === void 0 || token.prefix === "s");
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
      if (isOpen3(tokens[j])) depth++;
      else if (isClose3(tokens[j])) {
        depth--;
        if (depth === 0) return j + 1;
      }
    }
    return tokens.length;
  };
  const pathAt = (at) => isPunct3(tokens[at], ":") && isPunct3(tokens[at + 1], ":") && adjacent(tokens[at], tokens[at + 1]);
  const member = (at) => isPunct3(tokens[at - 1], ".") || isPunct3(tokens[at - 1], ":");
  const statementPosition = (at) => {
    const previous = tokens[at - 1];
    if (previous === void 0) return true;
    if (isPunct3(previous, ";") || isPunct3(previous, "{") || isPunct3(previous, "("))
      return true;
    if (VALUE_WORDS.has(upper3(previous))) return true;
    return isPunct3(previous, "=") && tokens[at - 2]?.kind === "param" && upper3(tokens[at - 3]) === "LET";
  };
  const statementEnd = (at) => {
    for (let j = at; j < tokens.length; j++) {
      const token = tokens[j];
      if (isPunct3(token, ";") || isClose3(token)) return j;
      if (isOpen3(token)) j = pastGroup(j) - 1;
    }
    return tokens.length;
  };
  const typeCall = (at, fn) => tokens[at]?.kind === "word" && tokens[at]?.value.toLowerCase() === "type" && pathAt(at + 1) && tokens[at + 3]?.kind === "word" && tokens[at + 3]?.value.toLowerCase() === fn && isPunct3(tokens[at + 4], "(") ? at + 4 : -1;
  const typeTarget = (at, fns) => {
    for (const fn of fns) {
      const paren = typeCall(at, fn);
      if (paren === -1) continue;
      const literal = tokens[paren + 1];
      const after = tokens[paren + 2];
      const next = pastGroup(paren);
      const certain = isPlainString2(literal) && (fn === "table" ? isPunct3(after, ")") : isPunct3(after, ","));
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
    if (isPunct3(token, "(")) {
      return subqueries && SUBQUERY.has(upper3(tokens[at + 1])) ? { kind: "subquery", next: pastGroup(at) } : { kind: "open" };
    }
    if (!isName(token)) return { kind: "open" };
    if (token.kind === "word" && CLAUSES.has(upper3(token)))
      return { kind: "open" };
    const colon = tokens[at + 1];
    if (isPunct3(colon, ":") && !isPunct3(tokens[at + 2], ":")) {
      const key = at + 2;
      const keyToken = tokens[key];
      if (keyToken === void 0) return { kind: "open" };
      const next = isOpen3(keyToken) ? pastGroup(key) : key + 1;
      if (!isOpen3(keyToken) && keyToken.kind === "punct")
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
    return token === void 0 || isPunct3(token, ";") || isClose3(token) || CLAUSES.has(upper3(token)) || extra.includes(upper3(token));
  };
  const targetList = (at, into, subqueries, lock) => {
    let j = at;
    if (upper3(tokens[j]) === "ONLY") j++;
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
      if (isPunct3(tokens[j], ",")) {
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
      if (isOpen3(tokens[j])) {
        j = pastGroup(j) - 1;
        continue;
      }
      if (upper3(tokens[j]) === "FROM" && !member(j)) froms.push(j);
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
      while (upper3(tokens[j]) === "IGNORE" || upper3(tokens[j]) === "RELATION")
        j++;
      if (upper3(tokens[j]) !== "INTO") {
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
      if (isName(token) && !isPunct3(tokens[j + 1], ".") && !isPunct3(tokens[j + 1], ":")) {
        consumed.add(j);
        add(writtenAt, token.value, token);
      } else open = true;
      return;
    }
    if (word === "RELATE") {
      if (upper3(tokens[j]) === "ONLY") j++;
      const end = statementEnd(j);
      let arrow = -1;
      for (let k = j; k < end; k++) {
        if (isOpen3(tokens[k])) {
          k = pastGroup(k) - 1;
          continue;
        }
        if (isPunct3(tokens[k], "-") && isPunct3(tokens[k + 1], ">") && adjacent(tokens[k], tokens[k + 1])) {
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
      if (edge.kind === "table" && isPunct3(tokens[after], "-") && isPunct3(tokens[after + 1], ">") && adjacent(tokens[after], tokens[after + 1])) {
        for (let k = arrow + 2; k < after + 2; k++) consumed.add(k);
        add(writtenAt, edge.name, tokens[arrow + 2]);
      } else open = true;
      return;
    }
    if (word === "DELETE" && upper3(tokens[j]) === "FROM") j++;
    targetList(j, writtenAt, false);
  };
  const definition = (at) => {
    const kind = upper3(tokens[at + 1]);
    let j = at + 2;
    if (upper3(tokens[j]) === "OVERWRITE") j++;
    if (upper3(tokens[j]) === "IF" && upper3(tokens[j + 1]) === "NOT" && upper3(tokens[j + 2]) === "EXISTS")
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
    if (isPunct3(a, "-") && isPunct3(b, ">") && adjacent(a, b)) return at + 2;
    if (isPunct3(a, "<") && isPunct3(b, "-") && adjacent(a, b)) {
      return isPunct3(c, ">") && adjacent(b, c) ? at + 3 : at + 2;
    }
    return -1;
  };
  const graphStep = (at) => {
    const token = tokens[at];
    if (isName(token)) {
      add(readAt, token.value, token);
      return;
    }
    if (!isPunct3(token, "(")) {
      open = true;
      return;
    }
    if (SUBQUERY.has(upper3(tokens[at + 1]))) return;
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
      if (isPunct3(tokens[j], ",")) {
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
      if (IGNORED.has(word) && statementPosition(i) && !isPunct3(tokens[i + 1], ":")) {
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
      if (member(i) || isPunct3(tokens[i + 1], ":")) {
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
      if (word === "UPDATE" && upper3(tokens[i - 1]) === "FOR") continue;
      if (WRITES.has(word)) {
        if (statementPosition(i) || isPunct3(tokens[i - 1], "[")) {
          write(i, word);
        } else if (!(tokens[i + 1]?.kind === "punct" || upper3(tokens[i + 1]) === "FROM" || upper3(tokens[i + 1]) === "AS")) {
          open = true;
        }
      }
      continue;
    }
    if (token.kind === "punct") {
      const past = arrowEnd(i);
      if (past !== -1 && !isPunct3(tokens[i - 1], "|")) {
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
var upper4 = (token) => token?.kind === "word" ? token.value.toUpperCase() : "";
var isPunct4 = (token, char) => token?.kind === "punct" && token.value === char;
var isOpen4 = (token) => isPunct4(token, "(") || isPunct4(token, "[") || isPunct4(token, "{");
var isClose4 = (token) => isPunct4(token, ")") || isPunct4(token, "]") || isPunct4(token, "}");
var adjacent2 = (a, b) => a !== void 0 && b !== void 0 && a.end === b.start;
var isPlainString3 = (token) => token?.kind === "string" && (token.prefix === void 0 || token.prefix === "s");
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
    if (upper4(before) === "LET" || upper4(before) === "FOR" || isPunct4(before, "|") || isPunct4(after, "|") || isPunct4(after, ":"))
      names.add(token.value);
  });
  return names;
};
var analyzeUses = (tokens, free) => {
  const local = localNames(tokens);
  const bindable = new Set(free.filter((name) => !local.has(name)));
  const found = /* @__PURE__ */ new Map();
  const record = (token, use) => {
    if (token?.kind !== "param" || !bindable.has(token.value)) return;
    const uses2 = found.get(token.value) ?? /* @__PURE__ */ new Map();
    uses2.set(JSON.stringify(use), use);
    found.set(token.value, uses2);
  };
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
  const pathAt = (at) => isPunct4(tokens[at], ":") && isPunct4(tokens[at + 1], ":") && adjacent2(tokens[at], tokens[at + 1]);
  const loneParam = (at) => tokens[at]?.kind === "param" && !isPunct4(tokens[at + 1], ".") && !isPunct4(tokens[at + 1], "[");
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.kind !== "word") continue;
    if (isPunct4(tokens[i - 1], ".") || isPunct4(tokens[i - 1], ":"))
      continue;
    const word = token.value.toLowerCase();
    if (word === "fn" && pathAt(i + 1)) {
      let name = token.value;
      let j = i + 1;
      while (pathAt(j) && (tokens[j + 2]?.kind === "word" || tokens[j + 2]?.kind === "ident")) {
        name += `::${tokens[j + 2].value}`;
        j += 3;
      }
      if (!isPunct4(tokens[j], "(")) continue;
      const end = closing(j);
      let start2 = j + 1;
      let index = 0;
      for (let k = j + 1; k <= end; k++) {
        if (isOpen4(tokens[k])) {
          k = closing(k);
          continue;
        }
        if (k === end || isPunct4(tokens[k], ",")) {
          if (k - start2 === 1 && tokens[start2]?.kind === "param")
            record(tokens[start2], {
              kind: "argument",
              function: name,
              index,
              line: tokens[start2].line
            });
          index++;
          start2 = k + 1;
        }
      }
      continue;
    }
    if (word === "type" && pathAt(i + 1) && tokens[i + 3]?.kind === "word" && ["record", "thing"].includes(
      tokens[i + 3].value.toLowerCase()
    ) && isPunct4(tokens[i + 4], "(") && isPlainString3(tokens[i + 5]) && isPunct4(tokens[i + 6], ",") && tokens[i + 7]?.kind === "param" && isPunct4(tokens[i + 8], ")")) {
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
    while (tokens[j]?.kind === "punct" && OPERATOR.includes(tokens[j].value) && (j === at || adjacent2(tokens[j - 1], tokens[j]))) {
      text += tokens[j].value;
      j++;
    }
    return COMPARISONS.has(text) ? { text, next: j } : void 0;
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
    if (isPunct4(after, ".") || isPunct4(after, "(") || isPunct4(after, "[") || isPunct4(after, ":") || isPunct4(after, "-") && isPunct4(tokens[at + 2], ">") || isPunct4(after, "<") && isPunct4(tokens[at + 2], "-"))
      return void 0;
    return token.value;
  };
  const startsAfter = (at) => {
    const token = tokens[at];
    return BEFORE.has(upper4(token)) || isPunct4(token, "(") || isPunct4(token, ",");
  };
  const forUpdateAt = (at) => upper4(tokens[at]) === "FOR" && upper4(tokens[at + 1]) === "UPDATE";
  const endsAt = (at) => {
    const token = tokens[at];
    return token === void 0 || isPunct4(token, ";") || isPunct4(token, ")") || isPunct4(token, ",") || AFTER2.has(upper4(token)) || forUpdateAt(at);
  };
  const query = (from, end) => {
    const word = upper4(tokens[from]);
    const targets = analyzeTargets(tokens.slice(from, end));
    const tables = /* @__PURE__ */ new Set([...targets.read, ...targets.written]);
    const table = tables.size === 1 ? [...tables][0] : void 0;
    const certain = table !== void 0 && !targets.openTargets && QUERIES.has(word);
    let clause = "";
    let clauses = 0;
    const scan = (start2, stop, depth) => {
      for (let i = start2; i < stop; i++) {
        const token = tokens[i];
        if (isPunct4(token, "(")) {
          const close = closing(i);
          if (QUERIES.has(upper4(tokens[i + 1]))) query(i + 1, close);
          else scan(i + 1, close, depth + 1);
          i = close;
          continue;
        }
        if (isOpen4(token)) {
          const close = closing(i);
          nested(i + 1, close);
          i = close;
          continue;
        }
        if (depth === 0 && token.kind === "word" && CLAUSE_ENDS.has(token.value.toUpperCase()) && !isPunct4(tokens[i - 1], ".") && !isPunct4(tokens[i - 1], ":") && !isPunct4(tokens[i + 1], ":")) {
          clause = token.value.toUpperCase();
          if (clause === "WHERE" || clause === "SET") clauses++;
          continue;
        }
        if (depth === 0 && forUpdateAt(i)) {
          clause = "FOR";
          continue;
        }
        if (!certain || table === void 0 || clauses > 1) continue;
        const inWhere = clause === "WHERE";
        const inSet = clause === "SET" && depth === 0 && (word === "UPDATE" || word === "UPSERT" || word === "CREATE");
        if (!inWhere && !inSet) continue;
        if (!startsAfter(i - 1)) continue;
        const field = bareField(i);
        if (field !== void 0) {
          const op = operatorAt(i + 1);
          if (op !== void 0 && (inWhere || op.text === "=") && loneParam(op.next) && endsAt(op.next + 1))
            record(tokens[op.next], {
              kind: "field",
              table,
              field,
              role: inWhere ? "compare" : "assign",
              line: tokens[op.next].line
            });
          continue;
        }
        if (inWhere && loneParam(i)) {
          const op = operatorAt(i + 1);
          if (op === void 0) continue;
          const other = bareField(op.next);
          if (other !== void 0 && endsAt(op.next + 1))
            record(token, {
              kind: "field",
              table,
              field: other,
              role: "compare",
              line: token.line
            });
        }
      }
    };
    scan(from, end, 0);
  };
  const nested = (start2, stop) => {
    for (let i = start2; i < stop; i++) {
      if (!isOpen4(tokens[i])) continue;
      const close = closing(i);
      if (isPunct4(tokens[i], "(") && QUERIES.has(upper4(tokens[i + 1])))
        query(i + 1, close);
      else nested(i + 1, close);
      i = close;
    }
  };
  let start = 0;
  for (let i = 0; i <= tokens.length; i++) {
    const token = tokens[i];
    if (token !== void 0 && isOpen4(token)) {
      i = closing(i);
      continue;
    }
    if (token !== void 0 && !isPunct4(token, ";")) continue;
    let first = start;
    if (upper4(tokens[first]) === "LET" && tokens[first + 1]?.kind === "param" && isPunct4(tokens[first + 2], "=") && !isPunct4(tokens[first + 3], "="))
      first += 3;
    else if (upper4(tokens[first]) === "RETURN") first += 1;
    if (first < i) {
      if (QUERIES.has(upper4(tokens[first]))) query(first, i);
      else nested(start, i);
    }
    start = i + 1;
  }
  const uses = {};
  for (const name of [...found.keys()].sort()) {
    uses[name] = [...found.get(name).entries()].sort(
      ([a, x], [b, y]) => x.line !== y.line ? x.line - y.line : a < b ? -1 : a > b ? 1 : 0
    ).map(([, use]) => use);
  }
  return uses;
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
var isPunct5 = (token, char) => token?.kind === "punct" && token.value === char;
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
  const fail2 = (code, message, token) => {
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
    if (!isPunct5(token, ";")) {
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
        const member = isPunct5(previous, ".") || isPunct5(previous, ":") || isPunct5(next, ":");
        if (member) break;
        if (WRITE_WORDS.has(word) && (starting || isPunct5(previous, "(") || previous?.kind === "word" && VALUE_WORDS2.has(previous.value.toUpperCase()) || isPunct5(previous, "=") && tokens[i - 2]?.kind === "param" && isWord(tokens[i - 3], "LET"))) {
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
          if (next?.kind === "string" && (next.prefix === void 0 || next.prefix === "s") && (after === void 0 || isPunct5(after, ";") || isPunct5(after, "}") || isPunct5(after, ")"))) {
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
              fail2("emptyStatement", "an empty statement", token);
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
              return fail2(
                "unexpectedToken",
                "cannot read this closure parameter list",
                param ?? token
              );
            }
            names.push(param.value);
            j++;
            if (isPunct5(tokens[j], ":")) {
              let angle = 0;
              j++;
              while (j < tokens.length) {
                const t = tokens[j];
                if (isPunct5(t, "<")) angle++;
                else if (isPunct5(t, ">")) angle--;
                else if (angle === 0 && (isPunct5(t, ",") || isPunct5(t, "|")))
                  break;
                else if (t.kind === "punct" && "()[]{};".includes(t.value))
                  return fail2(
                    "unexpectedToken",
                    "cannot read this closure parameter type",
                    t
                  );
                j++;
              }
            }
            if (isPunct5(tokens[j], ",")) {
              j++;
              continue;
            }
            if (isPunct5(tokens[j], "|")) break;
            return fail2(
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
          if (isPunct5(after, "{") || isPunct5(after, "-")) {
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
      fail2(
        "unterminatedStatement",
        "the last statement is not terminated by `;`; only a single expression or block may be left unterminated (a fragment)",
        statementFirst
      );
    }
    if (statementFirst.kind === "word" && STATEMENT_WORDS.has(statementFirst.value.toUpperCase()) && !isPunct5(tokens[1], ":")) {
      fail2(
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
    uses: analyzeUses(tokens, sorted(free)),
    projected: analyzeProjections(tokens),
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
      ([, list3]) => own.some(
        (site) => site.statement && // A LET can stand there: in a block, or at the top of a part.
        (site.frame.open === "{" || kind === "part") && list3.every(
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

// src/analyze/render.ts
var STATEMENTS_MARK = "// Generated by effect-surrealkit from SurrealQL files. Do not edit.";
var NAME = /^[A-Za-z_][A-Za-z0-9_]*$/u;
var RESERVED = new Set(
  "await break case catch class const continue debugger default delete do else enum export extends false finally for function if implements import in instanceof interface let new null package private protected public return static super switch this throw true try typeof var void while with yield arguments eval".split(" ")
);
var StatementModulesError = class extends Data5.TaggedError(
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
var list2 = (values) => `[${values.map((value) => JSON.stringify(value)).join(", ")}]`;
var scopesField = (scopes) => `{ ${Object.entries(scopes).map(
  ([hole, scope]) => `${JSON.stringify(hole)}: { bound: ${list2(scope.bound)}, binds: ${list2(scope.binds)} }`
).join(", ")} }`;
var lines = (throwsAt) => {
  const entries = Object.entries(throwsAt);
  return entries.length === 0 ? "{}" : `{ ${entries.map(([message, at]) => `${JSON.stringify(message)}: [${at.join(", ")}]`).join(", ")} }`;
};
var useEntry = (use) => use.kind === "argument" ? `{ kind: "argument", function: ${JSON.stringify(use.function)}, index: ${use.index}, line: ${use.line} }` : use.kind === "key" ? `{ kind: "key", table: ${JSON.stringify(use.table)}, line: ${use.line} }` : `{ kind: "field", table: ${JSON.stringify(use.table)}, field: ${JSON.stringify(use.field)}, ${use.role === void 0 ? "" : `role: ${JSON.stringify(use.role)}, `}line: ${use.line} }`;
var usesField = (uses) => `{ ${Object.entries(uses).map(
  ([name, list3]) => `${JSON.stringify(name)}: [${list3.map(useEntry).join(", ")}]`
).join(", ")} }`;
var rejectsNoneField = (fields) => `{ ${Object.entries(fields).map(
  ([name, at]) => `${JSON.stringify(name)}: { table: ${JSON.stringify(at.table)}, field: ${JSON.stringify(at.field)}, kind: ${JSON.stringify(at.kind)} }`
).join(", ")} }`;
var bindsField = (binds) => `{ ${Object.entries(binds).map(
  ([name, kind]) => `${JSON.stringify(name)}: ${JSON.stringify(kind)}`
).join(", ")} }`;
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
    message: `${use.role === "assign" ? "assigns" : "compares"} ${quoted(use.field)} of ${quoted(use.table)}, which declares no such field`
  };
};
var checkUses = (uses, detail, schemaChanges) => {
  const problems = [];
  const binds = {};
  const rejectsNone2 = {};
  for (const [name, list3] of Object.entries(uses)) {
    const kinds = /* @__PURE__ */ new Set();
    let none = true;
    for (const use of list3) {
      const resolved = resolve(use, detail);
      if (resolved.kind === "problem") {
        problems.push({ line: use.line, message: resolved.message });
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
      message: `selects ${quoted(field)} of ${quoted(table)}, which declares no such field`
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
var docComment = (analysis, title, holes) => {
  const first = lex2(analysis.sql, holeDelimiters(holes)).tokens[0];
  const body = analysis.sql.slice(first?.start ?? 0);
  const longest = Math.max(
    0,
    ...[...body.matchAll(/`+/gu)].map(([run2]) => run2.length)
  );
  const fence = "`".repeat(Math.max(3, longest + 1));
  const lines2 = [
    ...analysis.comment === "" ? [] : [analysis.comment, ""],
    `${fence}surql`,
    body,
    fence,
    "",
    title
  ].join("\n").split(/\r\n|[\n\r\u2028\u2029]/u).map(
    (line) => line.replaceAll("*/", "*\\/").replace(/(^|\s)@/gu, "$1\\@").trimEnd()
  );
  return ["/**", ...lines2.map((line) => ` * ${line}`.trimEnd()), " */"].join(
    "\n"
  );
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
    ...complete ? [] : [`holes: ${list2(analysis.holes)}`],
    `free: ${list2(analysis.free)}`,
    `defines: ${list2(analysis.defines)}`,
    ...complete ? [] : [`provisional: ${analysis.provisional}`],
    ...analysis.holes.length > 0 ? [`scopes: ${scopesField(analysis.holeScopes)}`] : [],
    `slots: ${analysis.slots}`,
    `throws: ${list2(analysis.throws)}`,
    `throwsAt: ${lines(analysis.throwsAt)}`,
    ...complete ? [
      `tables: { read: ${list2(analysis.tables.read)}, written: ${list2(analysis.tables.written)} }`,
      `functions: ${list2(analysis.functions)}`,
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
var undeclared = (sql, declared, holes) => {
  const targets = analyzeTargets(lex2(sql, holeDelimiters(holes)).tokens);
  const tables = /* @__PURE__ */ new Set([...declared.tables, ...targets.definedTables]);
  const functions = /* @__PURE__ */ new Set([
    ...declared.functions,
    ...targets.definedFunctions
  ]);
  const found = [];
  const check = (at, known, what) => {
    for (const [name, line] of at)
      if (!known.has(name))
        found.push({
          line,
          message: `${what} \`${name}\`, which the schema does not declare`
        });
  };
  check(targets.readAt, tables, "reads table");
  check(targets.writtenAt, tables, "writes table");
  check(targets.functionsAt, functions, "calls function");
  return found.sort((a, b) => a.line - b.line);
};
var renderStatementModulesSync = (input) => {
  const problems = [];
  const warnings = [];
  const byScope = /* @__PURE__ */ new Map();
  const imports2 = /* @__PURE__ */ new Map();
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
      const problem3 = checkName(
        source.scope,
        `scope ${JSON.stringify(source.scope)}`,
        scopes
      );
      if (problem3 !== void 0) {
        problems.push({
          kind: "scope",
          scope: source.scope,
          message: problem3,
          text: `${source.scope}: ${problem3}`
        });
        continue;
      }
      byScope.set(source.scope, []);
    }
    const seen = names.get(source.scope) ?? /* @__PURE__ */ new Map();
    names.set(source.scope, seen);
    const problem2 = checkName(
      source.name,
      `file name ${JSON.stringify(source.name)}`,
      seen
    );
    if (problem2 !== void 0) {
      problems.push({
        kind: "name",
        scope: source.scope,
        file: source.name,
        message: problem2,
        text: `${file}: ${problem2}`
      });
      continue;
    }
    let analysis;
    try {
      analysis = analyzeSync(source.sql, {
        ...input.holes !== void 0 && { holes: input.holes }
      });
    } catch (error) {
      if (error instanceof AnalyzeError) {
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
      throw error;
    }
    let binds;
    let rejectsNone2;
    if (source.declared !== void 0) {
      const detail = source.declared.detail;
      const schemaChanges = detail !== void 0 && changesSchema(source.sql, input.holes);
      const checked = detail === void 0 ? void 0 : checkUses(analysis.uses, detail, schemaChanges);
      binds = checked?.binds;
      rejectsNone2 = checked?.rejectsNone;
      for (const problem3 of [
        ...undeclared(source.sql, source.declared, input.holes),
        ...checked?.problems ?? [],
        ...detail === void 0 ? [] : checkProjected(
          analysis.projected,
          detail,
          schemaChanges || holeStartsStatement(source.sql, input.holes)
        )
      ].sort((a, b) => a.line - b.line))
        problems.push({
          kind: "undeclared",
          scope: source.scope,
          file: source.name,
          line: problem3.line,
          message: problem3.message,
          text: `${file}:${problem3.line}: ${problem3.message}`
        });
    }
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
    const used = imports2.get(source.scope) ?? /* @__PURE__ */ new Set();
    used.add(
      analysis.kind === "part" && analysis.holes.length === 0 ? "statement" : "analyze"
    );
    imports2.set(source.scope, used);
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
    for (const problem2 of problems)
      if (!unique.has(problem2.text)) unique.set(problem2.text, problem2);
    throw new StatementModulesError({
      problems: [...unique.values()],
      message: [...unique.keys()].join("\n")
    });
  }
  const files = [];
  for (const [scope, constants] of byScope) {
    const used = imports2.get(scope) ?? /* @__PURE__ */ new Set();
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

// src/testing/errors.ts
import { Data as Data6 } from "effect";
var TestingError = class extends Data6.TaggedError("TestingError") {
};
var IndexExpectationError = class extends Data6.TaggedError(
  "IndexExpectationError"
) {
};

// src/testing/verify.ts
import { Data as Data7, Effect as Effect7 } from "effect";
import { Surreal as Surreal2 } from "surrealdb";

// src/testing/database.ts
import { Context, Effect as Effect6, Layer } from "effect";
import { Surreal } from "surrealdb";
var TestDatabase = class extends Context.Service()(
  "effect-surrealkit/testing/TestDatabase"
) {
};
var messageOf = (cause) => cause instanceof Error ? cause.message : String(cause);
var INSTALL_ENGINE = "npm install --save-dev @surrealdb/node @surrealdb/node-native";
var nodeEngines = Effect6.tryPromise({
  try: () => import("@surrealdb/node"),
  catch: (cause) => new TestingError({
    message: `a memory database needs \`@surrealdb/node\` and \`@surrealdb/node-native\` installed (\`${INSTALL_ENGINE}\`): ${messageOf(cause)}`,
    cause
  })
});

// src/testing/verify.ts
var StatementVerificationError = class extends Data7.TaggedError(
  "StatementVerificationError"
) {
};
var DEFAULT_TIMEOUT_SECONDS = 10;
var engineOptions = (timeoutSeconds) => ({
  query_timeout: timeoutSeconds,
  capabilities: {
    scripting: false,
    guest_access: false,
    network_targets: false,
    functions: { allow: true, deny: ["http"] }
  }
});
var messageOf2 = (cause) => cause instanceof Error ? cause.message : String(cause);
var problem = (kind, file, text, at) => ({
  kind,
  file,
  ...at !== void 0 && at,
  text,
  message: `${file}${at === void 0 ? "" : `:${at.line}:${at.column}`}: ${text}`
});
var isTimeout = (error) => {
  for (let at = error, depth = 0; typeof at === "object" && at !== null && depth < 8; at = at.cause, depth++) {
    const { kind, details } = at;
    if (kind === "Query" && typeof details === "object" && details?.kind === "TimedOut")
      return true;
  }
  return false;
};
var timeoutProblem = (file, timeoutSeconds) => problem(
  "timeout",
  file,
  `the text did not finish within ${timeoutSeconds}s on an empty database with no bindings, so its result count was not verified`
);
var refusal = (file, cause, timeoutSeconds) => {
  if (isTimeout(cause)) return timeoutProblem(file, timeoutSeconds);
  const message = messageOf2(cause);
  const first = message.split("\n", 1)[0]?.trim() ?? "";
  if (!message.startsWith("Parse error"))
    return problem(
      "refused",
      file,
      `the engine did not run the text: ${first}`
    );
  const at = /-->\s*\[(\d+):(\d+)\]/u.exec(message);
  return problem(
    "parse",
    file,
    first,
    at === null ? void 0 : { line: Number(at[1]), column: Number(at[2]) }
  );
};
var judgeText = (text, sent, timeoutSeconds) => {
  if ("refused" in sent)
    return refusal(text.file, sent.refused, timeoutSeconds);
  const { responses } = sent;
  if (responses.some((r) => !r.success && isTimeout(r.error)))
    return timeoutProblem(text.file, timeoutSeconds);
  if (responses.length !== text.slots)
    return problem(
      "count",
      text.file,
      `the engine returned ${responses.length} results, the analyzer derived ${text.slots}`
    );
  return void 0;
};
var startEngine = (timeoutSeconds) => Effect7.gen(function* () {
  const { createNodeEngines } = yield* nodeEngines;
  const surreal = yield* Effect7.acquireRelease(
    Effect7.tryPromise({
      try: async () => {
        const surreal2 = new Surreal2({
          engines: createNodeEngines(
            engineOptions(timeoutSeconds)
          )
        });
        try {
          await surreal2.connect("mem://", {
            namespace: "verify",
            database: "verify"
          });
          return surreal2;
        } catch (cause) {
          await surreal2.close();
          throw cause;
        }
      },
      catch: (cause) => new TestingError({
        message: `the in-memory engine did not start: ${messageOf2(cause)}`,
        cause
      })
    }),
    (surreal2) => Effect7.promise(() => surreal2.close())
  );
  const version = yield* Effect7.tryPromise({
    try: () => surreal.version(),
    catch: (cause) => new TestingError({
      message: `the in-memory engine did not report its version: ${messageOf2(cause)}`,
      cause
    })
  });
  return {
    version: version.version.replace(/^surrealdb-/u, ""),
    send: (sql) => surreal.query(sql).responses()
  };
});
var verifyAnalysed = (texts, options) => Effect7.gen(function* () {
  const timeoutSeconds = options.timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS;
  const engine = yield* startEngine(timeoutSeconds);
  const send = async (sql) => {
    try {
      return { responses: await engine.send(sql) };
    } catch (refused) {
      return { refused };
    }
  };
  const problems = yield* Effect7.promise(async () => {
    for (const { name, sql } of options.schema ?? []) {
      const sent = await send(sql);
      if ("refused" in sent)
        return [refusal(name, sent.refused, timeoutSeconds)];
      const failed = sent.responses.findIndex((r) => !r.success);
      const response = sent.responses[failed];
      if (response !== void 0 && !response.success)
        return [
          isTimeout(response.error) ? timeoutProblem(name, timeoutSeconds) : problem(
            "schema",
            name,
            `statement ${failed + 1} failed: ${response.error.message.split("\n", 1)[0]}`
          )
        ];
    }
    const found = [];
    for (const text of texts) {
      const judged = judgeText(
        text,
        await send(text.sql),
        timeoutSeconds
      );
      if (judged !== void 0) found.push(judged);
    }
    return found;
  });
  return { engine: engine.version, problems };
});
var verifyStatements = (input) => Effect7.gen(function* () {
  const sent = [];
  const notSent = [];
  const early = [];
  for (const scope of input.scopes) {
    for (const { name, sql } of scope.files) {
      const file = `${scope.name}/${name}.surql`;
      let analysis;
      try {
        analysis = analyzeSync(
          sql,
          input.holes === void 0 ? {} : { holes: input.holes }
        );
      } catch (cause) {
        early.push(
          problem(
            "analyzer",
            file,
            `the analyzer refused the text: ${messageOf2(cause)}`
          )
        );
        continue;
      }
      if (analysis.kind === "part" && analysis.holes.length === 0)
        sent.push({
          file,
          sql: analysis.sql,
          slots: analysis.slots
        });
      else notSent.push(file);
    }
  }
  const { engine, problems } = yield* Effect7.scoped(
    verifyAnalysed(sent, input)
  );
  const all = [...early, ...problems].sort(
    (a, b) => a.file < b.file ? -1 : a.file > b.file ? 1 : 0
  );
  if (all.length > 0)
    return yield* new StatementVerificationError({
      engine,
      problems: all,
      message: all.map((p) => p.message).join("\n")
    });
  return {
    engine,
    sent: sent.map((text) => text.file).sort(),
    notSent: notSent.sort()
  };
});

// src/cli/statements.ts
var STATEMENTS_USAGE = `Usage: effect-surrealkit statements --input <dir> --out <dir> [options]

Generates typed statement modules from SurrealQL files. --input holds one
directory per scope, each holding .surql files; each scope becomes
<out>/<scope>/statements.ts with one constant per file, and <out>/index.ts
re-exports every scope.

Options:
  --input <dir>              Directory of scope directories (required)
  --out <dir>                Output directory (required, outside --input)
  --check                    Write nothing; exit 1 if the output is not up to date
  --watch                    Regenerate whenever a file under --input changes
  --import-extension <ext>   .js (default) | .ts: extension of index.ts imports
  --hole-open <text>         The text that opens a template hole (default __)
  --hole-close <text>        The text that closes a template hole (default __);
                             a hole is open, a name matching [A-Z][A-Z0-9_]*,
                             then close
  --schema <file>            A SurrealKit schema document v2 (JSON): every table
                             and fn:: function a file names must be declared
                             in it or defined by the same file
  --verify                   Before writing, send each complete text once,
                             with no bindings, to a discarded in-memory
                             engine (needs @surrealdb/node): a parse error or
                             a result count other than the derived one fails
                             generation. The texts run; network, http:: and
                             scripting are denied
  --verify-schema <file>     SurrealQL loaded before the texts are sent, in
                             the order given (repeatable; needs --verify)
  --help                     Show this help

Exit codes: 0 success, 1 generation failed or output out of date, 2 bad arguments.
`;
var StatementsError = class extends Error {
};
var readSources = async (input) => {
  const problems = [];
  const sources = [];
  let scopes;
  try {
    scopes = await readdir2(input, { withFileTypes: true });
  } catch (error) {
    throw new StatementsError(
      `cannot read --input ${input}: ${error.message}`
    );
  }
  for (const scope of scopes.sort((a, b) => a.name < b.name ? -1 : 1)) {
    if (scope.name.startsWith(".")) continue;
    if (!scope.isDirectory()) {
      problems.push(
        `${scope.name}: --input holds only scope directories`
      );
      continue;
    }
    const entries = await readdir2(join2(input, scope.name), {
      withFileTypes: true
    });
    let count = 0;
    for (const entry of entries.sort(
      (a, b) => a.name < b.name ? -1 : 1
    )) {
      if (entry.name.startsWith(".")) continue;
      const path = `${scope.name}/${entry.name}`;
      if (!entry.isFile() || !entry.name.endsWith(".surql")) {
        problems.push(`${path}: a scope holds only .surql files`);
        continue;
      }
      count++;
      sources.push({
        scope: scope.name,
        name: entry.name.slice(0, -".surql".length),
        sql: await readFile2(join2(input, path), "utf8")
      });
    }
    if (count === 0 && !problems.some((p) => p.startsWith(`${scope.name}/`)))
      problems.push(`${scope.name}: has no .surql files`);
  }
  if (problems.length > 0) throw new StatementsError(problems.join("\n"));
  if (sources.length === 0) {
    throw new StatementsError(`${input} has no scope directories`);
  }
  return sources;
};
var renderStatements = (sources, options) => {
  const scopes = /* @__PURE__ */ new Map();
  for (const { scope, name, sql } of sources) {
    const files = scopes.get(scope) ?? [];
    files.push({ name, sql });
    scopes.set(scope, files);
  }
  const { declared, ...rest } = options;
  try {
    const { files, warnings } = renderStatementModulesSync({
      scopes: [...scopes].map(([name, files2]) => ({
        name,
        files: files2,
        ...declared !== void 0 && { declared }
      })),
      ...rest
    });
    return { files, warnings: warnings.map((warning) => warning.text) };
  } catch (error) {
    if (error instanceof StatementModulesError)
      throw new StatementsError(error.message);
    throw error;
  }
};
var WATCH_INTERVAL_MS = 200;
var pause = (ms, signal) => new Promise((done) => {
  const timer = setTimeout(done, ms);
  signal?.addEventListener(
    "abort",
    () => {
      clearTimeout(timer);
      done();
    },
    { once: true }
  );
});
var fingerprint = async (dir, prefix = "") => {
  const entries = await readdir2(dir, { withFileTypes: true }).catch(() => []);
  const parts = [];
  for (const entry of entries.sort((a, b) => a.name < b.name ? -1 : 1)) {
    const path = join2(dir, entry.name);
    if (entry.isDirectory()) {
      parts.push(
        `${prefix}${entry.name}/`,
        await fingerprint(path, `${prefix}${entry.name}/`)
      );
    } else {
      const info = await stat(path).catch(() => void 0);
      parts.push(`${prefix}${entry.name}:${info?.size}:${info?.mtimeMs}`);
    }
  }
  return parts.join("\n");
};
var owned = (content) => content.startsWith(STATEMENTS_MARK);
var inside = (parent, child) => {
  const path = relative(parent, child);
  return path === "" || !path.startsWith("..") && !path.startsWith(sep);
};
var verify2 = async (sources, schemaPaths, io, holes) => {
  const report = (lines2) => io.stderr(
    `effect-surrealkit: statements not verified:
${lines2.split("\n").map((line) => `  ${line}`).join("\n")}
`
  );
  const schema = [];
  for (const path of schemaPaths) {
    try {
      schema.push({
        name: path,
        sql: await readFile2(resolve2(io.cwd, path), "utf8")
      });
    } catch (error) {
      report(
        `cannot read --verify-schema ${path}: ${error.message}`
      );
      return false;
    }
  }
  const scopes = /* @__PURE__ */ new Map();
  for (const { scope, name, sql } of sources) {
    const files = scopes.get(scope) ?? [];
    files.push({ name, sql });
    scopes.set(scope, files);
  }
  const result = await Effect8.runPromise(
    Effect8.result(
      verifyStatements({
        scopes: [...scopes].map(([name, files]) => ({ name, files })),
        schema,
        ...holes !== void 0 && { holes }
      })
    )
  );
  if (result._tag === "Failure") {
    const error = result.failure;
    if (error instanceof StatementVerificationError)
      report(`on SurrealDB ${error.engine}:
${error.message}`);
    else if (error instanceof TestingError) report(error.message);
    else throw error;
    return false;
  }
  const { engine, sent, notSent } = result.success;
  io.stderr(
    `effect-surrealkit: verified ${sent.length} texts on SurrealDB ${engine} (${notSent.length} fragments and templates not sent)
`
  );
  return true;
};
var statements = async (argv, io) => {
  const { values } = parseArgs({
    args: [...argv],
    options: {
      input: { type: "string" },
      out: { type: "string" },
      check: { type: "boolean" },
      watch: { type: "boolean" },
      "import-extension": { type: "string" },
      "hole-open": { type: "string" },
      "hole-close": { type: "string" },
      schema: { type: "string" },
      verify: { type: "boolean" },
      "verify-schema": { type: "string", multiple: true },
      help: { type: "boolean" }
    },
    strict: true,
    allowPositionals: false
  });
  if (values.help) {
    io.stdout(STATEMENTS_USAGE);
    return 0;
  }
  if (values.input === void 0)
    throw new UsageError("--input <dir> is required");
  if (values.out === void 0)
    throw new UsageError("--out <dir> is required");
  if (values.check && values.watch)
    throw new UsageError("--check and --watch cannot be combined");
  const verifySchema = values["verify-schema"] ?? [];
  if (verifySchema.length > 0 && !values.verify)
    throw new UsageError("--verify-schema needs --verify");
  const importExtension = values["import-extension"] ?? ".js";
  if (importExtension !== ".js" && importExtension !== ".ts")
    throw new UsageError("--import-extension must be .js or .ts");
  const holeOpen = values["hole-open"];
  const holeClose = values["hole-close"];
  let holes;
  if (holeOpen !== void 0 || holeClose !== void 0) {
    try {
      holes = holeDelimiters({
        open: holeOpen ?? "__",
        close: holeClose ?? "__"
      });
    } catch (error) {
      throw new UsageError(
        `--hole-open/--hole-close: ${error.message}`
      );
    }
  }
  const input = resolve2(io.cwd, values.input);
  const out = resolve2(io.cwd, values.out);
  if (inside(input, out))
    throw new UsageError("--out must be outside --input");
  let declared;
  if (values.schema !== void 0) {
    const path = resolve2(io.cwd, values.schema);
    let json4;
    try {
      json4 = JSON.parse(await readFile2(path, "utf8"));
    } catch (error) {
      throw new UsageError(
        `--schema ${values.schema}: ${error.message}`
      );
    }
    const decoded = await Effect8.runPromise(
      Effect8.result(decodeDocument(json4))
    );
    if (decoded._tag === "Failure")
      throw new UsageError(
        `--schema ${values.schema}: ${decoded.failure.message}`
      );
    declared = declaredNames(decoded.success);
  }
  const options = {
    importExtension,
    ...holes !== void 0 && { holes },
    ...declared !== void 0 && { declared }
  };
  const once = async () => {
    let rendered;
    let sources;
    try {
      sources = await readSources(input);
      rendered = renderStatements(sources, options);
    } catch (error) {
      if (error instanceof StatementsError) {
        io.stderr(
          `effect-surrealkit: statements not generated:
${error.message.split("\n").map((line) => `  ${line}`).join("\n")}
`
        );
        return 1;
      }
      throw error;
    }
    const { files, warnings } = rendered;
    for (const warning of warnings)
      io.stderr(`effect-surrealkit: warning: ${warning}
`);
    if (values.verify) {
      const verified = await verify2(sources, verifySchema, io, holes);
      if (!verified) return 1;
    }
    const drift = await compareWith(out, files, owned, 1);
    if (values.check) {
      const problems = problemsOf(drift);
      if (problems.length > 0) {
        io.stderr(
          `effect-surrealkit: ${out} is not up to date:
${problems.map((p) => `  ${p}`).join("\n")}
`
        );
        return 1;
      }
      return 0;
    }
    if (drift.foreign.length > 0) {
      io.stderr(
        `effect-surrealkit: refusing to overwrite files this command did not generate:
${drift.foreign.map((p) => `  ${p}`).join("\n")}
`
      );
      return 1;
    }
    const touched = await apply(out, files, drift);
    io.stderr(
      `effect-surrealkit: ${files.length} modules in ${out} (${touched === 0 ? "unchanged" : `${touched} updated`})
`
    );
    return 0;
  };
  const first = await once();
  if (!values.watch) return first;
  const { signal } = io;
  let seen = await fingerprint(input);
  io.stderr(`effect-surrealkit: watching ${input}
`);
  const stopped = () => signal?.aborted === true;
  while (!stopped()) {
    await pause(WATCH_INTERVAL_MS, signal);
    if (stopped()) break;
    const now = await fingerprint(input);
    if (now === seen) continue;
    seen = now;
    await once().catch((error) => {
      io.stderr(`effect-surrealkit: ${error.message}
`);
    });
  }
  return 0;
};

// src/cli/run.ts
var USAGE = `Usage: effect-surrealkit --out <dir> [options] [< schema.json]
       effect-surrealkit statements --input <dir> --out <dir> [options]

Generates Effect v4 modules from a SurrealKit schema document v2, or typed
statement modules from .surql files (\`effect-surrealkit statements --help\`).

Options:
  --input <file>             Read the schema document from a file (default: stdin)
  --out <dir>                Output directory (required)
  --config <file>            Emitter options as JSON: store, int, datetime, patch,
                             importExtension, acknowledge, fields, names
  --store <name>             Logical store name, used in record-id brands
  --int <profile>            safe-number (default) | bigint
  --datetime <profile>       sdk (default) | effect-datetime
  --patch                    Also emit JSON Patch unions (not yet qualified)
  --import-extension <ext>   .js (default) | .ts: extension of imports between the
                             generated modules; .ts loads under Node type stripping
  --acknowledge <code=why>   Proceed past an error diagnostic code (repeatable)
  --check                    Write nothing; exit 1 if the output is not up to date
  --help                     Show this help
  --version                  Show the emitter version

As a SurrealKit external emitter ([typegen.emit.<name>], which sets
SURREALKIT_EMIT_PROTOCOL=1), it reads the document on stdin and prints the
protocol 1 reply on stdout instead of writing files; SurrealKit writes them,
so --out, --input and --check are refused there. The project's
[typegen] acknowledge (SURREALKIT_EMIT_ACKNOWLEDGE) counts as --acknowledge:

  [typegen.emit.effect]
  command = "effect-surrealkit --store app"
  out = "src/generated/surreal"

Exit codes: 0 success, 1 generation failed or output out of date, 2 bad arguments.
`;
var GENERATED_MARK = "// Generated by effect-surrealkit";
var EMIT_PROTOCOL = "1";
var parseJson = (text, what) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new UsageError(
      `${what} is not valid JSON: ${error.message}`
    );
  }
};
var emitted = (content) => content.startsWith(GENERATED_MARK) && !content.startsWith(STATEMENTS_MARK);
var readOptions = async (values, cwd, inherited) => {
  const config = values.config === void 0 ? {} : parseJson(
    await readFile3(resolve3(cwd, values.config), "utf8"),
    `--config ${values.config}`
  );
  if (typeof config !== "object" || config === null || Array.isArray(config)) {
    throw new UsageError("--config must hold a JSON object");
  }
  const base = config;
  const acknowledge = {
    ...inherited,
    ...base.acknowledge ?? {}
  };
  for (const entry of values.acknowledge ?? []) {
    const separator = entry.indexOf("=");
    if (separator <= 0 || separator === entry.length - 1) {
      throw new UsageError(
        `--acknowledge expects <code>=<reason>, got ${JSON.stringify(entry)}`
      );
    }
    acknowledge[entry.slice(0, separator)] = entry.slice(separator + 1);
  }
  return {
    ...base,
    ...values.store !== void 0 && { store: values.store },
    ...values.int !== void 0 && { int: values.int },
    ...values.datetime !== void 0 && { datetime: values.datetime },
    ...values.patch !== void 0 && { patch: values.patch },
    ...values["import-extension"] !== void 0 && {
      importExtension: values["import-extension"]
    },
    ...Object.keys(acknowledge).length > 0 && { acknowledge }
  };
};
var projectAcknowledgements = (raw) => {
  if (raw === void 0 || raw === "") return {};
  const parsed = parseJson(raw, "SURREALKIT_EMIT_ACKNOWLEDGE");
  const invalid = () => new UsageError(
    "SURREALKIT_EMIT_ACKNOWLEDGE must be a JSON object of diagnostic code to reason"
  );
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
    throw invalid();
  const acknowledged = {};
  for (const [code, reason] of Object.entries(parsed)) {
    if (code === "" || typeof reason !== "string" || reason.trim() === "")
      throw invalid();
    acknowledged[code] = reason;
  }
  return acknowledged;
};
var execute = async (argv, io) => {
  const { values } = parseArgs2({
    args: [...argv],
    options: {
      input: { type: "string" },
      out: { type: "string" },
      config: { type: "string" },
      store: { type: "string" },
      int: { type: "string" },
      datetime: { type: "string" },
      patch: { type: "boolean" },
      "import-extension": { type: "string" },
      acknowledge: { type: "string", multiple: true },
      check: { type: "boolean" },
      help: { type: "boolean" },
      version: { type: "boolean" }
    },
    strict: true,
    allowPositionals: false
  });
  if (values.help) {
    io.stdout(USAGE);
    return 0;
  }
  if (values.version) {
    io.stdout(`${EMITTER_VERSION}
`);
    return 0;
  }
  const protocol = io.env?.SURREALKIT_EMIT_PROTOCOL;
  if (protocol !== void 0) {
    if (protocol !== EMIT_PROTOCOL) {
      io.stderr(
        `effect-surrealkit: SurrealKit asked for external-emitter protocol ${JSON.stringify(protocol)}; this emitter speaks protocol ${EMIT_PROTOCOL}
`
      );
      return 1;
    }
    for (const flag of ["out", "input", "check"]) {
      if (values[flag] !== void 0)
        throw new UsageError(
          `--${flag} is not allowed when SurrealKit runs the emitter (SURREALKIT_EMIT_PROTOCOL is set): SurrealKit reads the document, writes the files and checks them`
        );
    }
  } else if (values.out === void 0)
    throw new UsageError("--out <dir> is required");
  const options = await readOptions(
    values,
    io.cwd,
    protocol === void 0 ? {} : projectAcknowledgements(io.env?.SURREALKIT_EMIT_ACKNOWLEDGE)
  );
  const source = values.input === void 0 ? await io.stdin() : await readFile3(resolve3(io.cwd, values.input), "utf8");
  const document = parseJson(source, values.input ?? "stdin");
  const result = await Effect9.runPromise(
    Effect9.result(
      generate(document, options, {
        sha256: (text) => createHash("sha256").update(text, "utf8").digest("hex")
      })
    )
  );
  if (result._tag === "Failure") {
    io.stderr(`effect-surrealkit: ${result.failure.message}
`);
    return 1;
  }
  const { files, warnings } = result.success;
  for (const warning of warnings) {
    if (protocol !== void 0 && warning.startsWith("document: "))
      continue;
    io.stderr(`effect-surrealkit: warning: ${warning}
`);
  }
  if (protocol !== void 0 || values.out === void 0) {
    const reply = {
      protocol: Number(EMIT_PROTOCOL),
      files: files.map((file) => ({
        path: file.path,
        contents: file.content
      }))
    };
    io.stdout(`${JSON.stringify(reply)}
`);
    return 0;
  }
  const out = resolve3(io.cwd, values.out);
  const drift = await compareWith(out, files, emitted);
  if (values.check) {
    const problems = problemsOf(drift);
    if (problems.length > 0) {
      io.stderr(
        `effect-surrealkit: ${out} is not up to date:
${problems.map((p) => `  ${p}`).join("\n")}
`
      );
      return 1;
    }
    return 0;
  }
  const touched = await apply(out, files, drift);
  io.stderr(
    `effect-surrealkit: ${files.length} modules in ${out} (${touched === 0 ? "unchanged" : `${touched} updated`})
`
  );
  return 0;
};
var run = async (argv, io) => {
  try {
    return argv[0] === "statements" ? await statements(argv.slice(1), io) : await execute(argv, io);
  } catch (error) {
    const usage = error instanceof UsageError || String(error.code ?? "").startsWith(
      "ERR_PARSE_ARGS"
    );
    io.stderr(
      `effect-surrealkit: ${error.message}
${usage ? `
${argv[0] === "statements" ? STATEMENTS_USAGE : USAGE}` : ""}`
    );
    return usage ? 2 : 1;
  }
};

// src/cli/main.ts
var readStdin = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
};
process.exitCode = await run(process.argv.slice(2), {
  cwd: process.cwd(),
  stdin: readStdin,
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
  env: process.env
});
//# sourceMappingURL=cli.js.map