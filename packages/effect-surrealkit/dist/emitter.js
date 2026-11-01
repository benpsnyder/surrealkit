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
  adapter: Schema.Literals(["structure-3.2", "structure-3.3"]),
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

// src/emitter/generate.ts
import { Data as Data3, Effect as Effect3 } from "effect";

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
      const item = hooks.item ?? printKind(kind.item, ctx);
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
      return "Schema.Unknown";
    case "none":
      return "Schema.Undefined";
    case "null":
      return "Schema.Null";
    case "bool":
      return "Schema.Boolean";
    case "int":
      return ctx.profile.int === "bigint" ? "SurrealSchema.Int64" : "SurrealSchema.Int";
    case "float":
      return "Schema.Number";
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
      return hooks.object ?? (ctx.closedObjects === true ? "Schema.Record(Schema.String, Schema.Never)" : "Schema.Record(Schema.String, Schema.Unknown)");
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
      const item = hooks.item ?? printKind(kind.item, ctx);
      const array = `Schema.Array(${item})`;
      return kind.length === void 0 ? array : `${array}.check(Schema.isBetweenLength(${kind.length}, ${kind.length}))`;
    }
    case "set": {
      const item = hooks.item ?? printKind(kind.item, ctx);
      return kind.length === void 0 ? `SurrealSchema.SetOf(${item})` : `SurrealSchema.SetOf(${item}, { length: ${kind.length} })`;
    }
    case "tuple":
      return `Schema.Tuple([${kind.items.map((item) => printKind(item, ctx)).join(", ")}])`;
    case "objectLiteral": {
      if (kind.fields.length === 0) return "Schema.Struct({})";
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
      if (writeExcluded || info.computed) return "excluded";
      return none || info.defaultMode !== void 0 || info.valueIgnoresInput ? "optional" : "required";
    case "merge":
      if (writeExcluded || info.computed || info.readonly)
        return "excluded";
      if (info.defaultMode === "always") return "resettable";
      return none ? "removable" : "optional";
    case "content":
      if (writeExcluded || info.computed || info.readonly)
        return "excluded";
      return none || info.defaultMode === "always" || info.valueIgnoresInput ? "optional" : "required";
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
var OPEN_RECORD = "Schema.Record(Schema.String, Schema.Unknown)";
var struct = (entries, indent, open) => {
  const body = entries.length === 0 ? "Schema.Struct({})" : `Schema.Struct({
${entries.map(
    ([key, value]) => `${tabs(indent + 1)}${propertyKey(key)}: ${value},`
  ).join("\n")}
${tabs(indent)}})`;
  return open ? `Schema.StructWithRest(${body}, [${OPEN_RECORD}])` : body;
};
var TablePrinter = class {
  constructor(table, scope, options, world = "native") {
    this.table = table;
    this.scope = scope;
    this.options = options;
    this.world = world;
    this.root = buildTree(table.fields);
    this.isRelation = table.type.kind === "relation";
    this.lightweight = table.type.kind === "relation" && table.type.lightweight;
  }
  table;
  scope;
  options;
  world;
  root;
  isRelation;
  lightweight;
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
    if (override !== void 0) return override;
    const effective = element && operation !== "select" ? "create" : operation;
    const writeExcluded = this.lightweight || this.table.view !== void 0;
    return derivePresence(infoOf(fieldNode), effective, writeExcluded);
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
    const item = elementNode !== void 0 && elementNode.children.size > 0 ? this.field(elementNode, operation, indent, true) : void 0;
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
    return struct(entries, indent, open);
  }
  topLevel() {
    const reserved = this.isRelation ? ["in", "out"] : [];
    return namedChildren(this.root).filter(
      (child) => !reserved.includes(child.key)
    );
  }
};
var json2 = (value) => JSON.stringify(value);
var jsonList = (values) => `[${values.map((value) => JSON.stringify(value)).join(", ")}]`;
var printPermissions = (permissions) => `{ select: ${json2(permissions.select)}, create: ${json2(permissions.create)}, update: ${json2(permissions.update)}, delete: ${json2(permissions.delete)} }`;
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
var printTable = (input) => {
  const { table, scope, options, digest } = input;
  const registry = scope.registry;
  const pascal = registry.pascal(table.name);
  const idName = scope.useId(registry.table(table.name));
  const lines = [];
  const exportType = (name) => {
    lines.push(`export type ${name} = typeof ${name}.Type;`);
    lines.push(`export type ${name}Encoded = typeof ${name}.Encoded;`);
  };
  if (table.view !== void 0) {
    lines.push(
      `/** \`${table.name}\` is a view: its row shape comes from its query and is not derived. */`,
      `export const ${pascal}Table = SurrealSchema.view({`,
      `	name: ${json2(table.name)},`,
      `	type: "view",`,
      `	id: ${idName},`,
      `	view: ${json2(table.view.select)},`,
      `	permissions: ${printPermissions(table.permissions)},`,
      `	digest: ${json2(digest)},`,
      "});"
    );
    return lines.join("\n");
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
    lines.push(
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
    lines.push(
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
    lines.push(`/** ${VARIANT_DOCS[operation](table.name)} */`);
    lines.push(`export const ${name} = ${struct(entries, 0, open)};`);
    exportType(name);
    lines.push("");
    if (operation === "select") {
      lines.push(
        `/** \`${name}\` for rows the SDK returned: NONE (an \`undefined\` property) is removed first, so an optional field decodes as absent. */`,
        `export const ${name}Row = SurrealSchema.NoneAsAbsent(${name});`
      );
      exportType(`${name}Row`);
      lines.push("");
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
      lines.push(
        `/** JSON Patch operations on \`${table.name}\` (generated behind the \`patch\` flag; not yet qualified against an engine). */`,
        `export const ${pascal}Patch = Schema.Union([`,
        ...ops,
        "]);"
      );
      exportType(`${pascal}Patch`);
      lines.push("");
    }
  }
  if (relationType !== void 0) {
    const ends = (tables) => tables.length === 0 ? "[SurrealSchema.RecordIdAny]" : `[${tables.map((t) => scope.useId(registry.table(t))).join(", ")}]`;
    lines.push(
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
  lines.push(
    `/** Descriptor of \`${table.name}\`${table.comment === void 0 ? "" : `: ${table.comment.replace(/\*\//g, "* /")}`}. */`,
    `export const ${pascal}Table = SurrealSchema.table({`,
    `	name: ${json2(table.name)},`,
    `	type: ${json2(table.type.kind)},`,
    `	schemafull: ${table.schemafull},`,
    `	drop: ${table.drop},`,
    `	id: ${idName},`,
    ...operations.map(
      (operation) => `	${operation}: ${pascal}${SUFFIX[operation]},`
    ),
    `	fields: ${fieldsName},`,
    "	presence: {",
    ...presenceEntries.map(
      ([key, p]) => `		${propertyKey(key)}: ${presenceLiteral(p)},`
    ),
    "	},",
    `	relations: { in: ${jsonList(input.relations.in)}, out: ${jsonList(input.relations.out)} },`,
    `	permissions: ${printPermissions(table.permissions)},`,
    ...relationType === void 0 ? [] : [`	edge: ${pascal}Edge,`],
    `	digest: ${json2(digest)},`,
    "});"
  );
  lines.push("", ...printJsonWorld(input, fields, endpoint, relationType));
  return lines.join("\n");
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
    `export const ${pascal}FromJson = ${struct(entries, 0, !table.schemafull)};`,
    `export type ${pascal}JsonEncoded = typeof ${pascal}FromJson.Encoded;`
  ];
};

// src/emitter/version.ts
var EMITTER_VERSION = "0.1.0";
var PEER_VERSIONS = { effect: "4.0.6", surrealdb: "2.1.1" };

// src/emitter/generate.ts
var GenerateError = class extends Data3.TaggedError("GenerateError") {
};
var fail = (message) => {
  throw new GenerateError({ message });
};
var RESERVED_FILES = /* @__PURE__ */ new Set(["ids", "functions", "manifest", "index"]);
var json3 = (value) => JSON.stringify(value);
var jsonList2 = (values) => `[${values.map((value) => JSON.stringify(value)).join(", ")}]`;
var header = (digest) => [
  "// Generated by effect-surrealkit from a SurrealKit schema document. Do not edit.",
  `// semanticDigest: ${digest}`
].join("\n");
var imports = (body, ids, fromIds, ext) => {
  const lines = [];
  if (/\bSchema\./.test(body)) lines.push('import { Schema } from "effect";');
  if (/\bSurrealSchema\./.test(body)) {
    lines.push('import * as SurrealSchema from "effect-surrealkit";');
    lines.push('import type {} from "surrealdb";');
  }
  if (fromIds && ids.size > 0) {
    lines.push(
      `import { ${[...ids].sort(compare).join(", ")} } from "./ids${ext}";`
    );
  }
  return lines.join("\n");
};
var assemble = (digest, importLines, body) => `${[header(digest), importLines, body].filter((part) => part.length > 0).join("\n\n")}
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
var printIds = (registry, options, document, warnings) => {
  const scope = new ModuleScope(registry, warnings);
  const keys = new Map(
    document.tables.map((table) => [table.name, table.idKey])
  );
  const lines = [];
  for (const [table, name] of registry.tables) {
    const idKey = keys.get(table);
    const brand = `Schema.brand(${json3(`${options.store}/${table}`)})`;
    const profile = {
      ...profileFor(options, `${table}.id`),
      datetime: "sdk"
    };
    const key = idKey === void 0 ? "" : `, { key: ${printKind(idKey, { scope, profile, location: `${table}.id` })} }`;
    const note = registry.isDefined(table) ? "" : " (referenced, not defined in this schema)";
    lines.push(
      `/** Record id of \`${table}\`${note}. */`,
      `export const ${name} = SurrealSchema.RecordIdFor(${json3(table)}${key}).pipe(${brand});`,
      `export type ${name} = typeof ${name}.Type;`,
      ""
    );
  }
  for (const [name, tables] of registry.unions) {
    const tagged = IdRegistry.tagged(name);
    const spelled = `record<${tables.join(" | ")}>`;
    lines.push(
      `/** \`${spelled}\`. */`,
      `export const ${name} = Schema.Union([${tables.map((t) => registry.table(t)).join(", ")}]);`,
      `export type ${name} = typeof ${name}.Type;`,
      `/** \`${spelled}\` as \`{ _tag, id }\`, to match on the table. An application representation; never stored. */`,
      `export const ${tagged} = SurrealSchema.taggedRecordId({ ${tables.map((t) => `${propertyKey(t)}: ${registry.table(t)}`).join(", ")} });`,
      `export type ${tagged} = typeof ${tagged}.Type;`,
      ""
    );
  }
  return lines.join("\n").trimEnd();
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
  const digest = document.semanticDigest;
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
      digest,
      relations: relationsOf(table.name)
    });
    const ownId = registry.table(table.name);
    const reexport = `export { ${ownId} } from "./ids${ext}";`;
    files.push({
      path: `${registry.file(table.name)}.ts`,
      content: assemble(
        digest,
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
      digest,
      imports(functionBody, functionScope.ids, true, ext),
      functionBody
    )
  });
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
  const idsBody = printIds(registry, options, document, warnings) || "export {};";
  files.push({
    path: "ids.ts",
    content: assemble(
      digest,
      imports(idsBody, /* @__PURE__ */ new Set(), false, ext),
      idsBody
    )
  });
  const manifestBody = printManifest(document, options);
  files.push({
    path: "manifest.ts",
    content: assemble(digest, "", manifestBody)
  });
  const barrel = [
    `export * from "./ids${ext}";`,
    ...tables.map(
      (table) => `export * from "./${registry.file(table.name)}${ext}";`
    ),
    `export * from "./functions${ext}";`,
    `export { manifest } from "./manifest${ext}";`
  ].join("\n");
  files.push({ path: "index.ts", content: assemble(digest, "", barrel) });
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
export {
  DocumentError,
  EMITTER_VERSION,
  GenerateError,
  OptionsError,
  PEER_VERSIONS,
  canonicalJson,
  decodeDocument,
  decodeOptions,
  emit,
  generate,
  semanticDigest,
  semanticProjection
};
//# sourceMappingURL=emitter.js.map