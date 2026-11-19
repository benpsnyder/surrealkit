import {
  Bytes,
  DATETIME_MAX_SECONDS,
  DATETIME_MIN_SECONDS,
  DECIMAL_MAX_MANTISSA,
  DECIMAL_MAX_SCALE,
  DURATION_MAX_SECONDS,
  DateTime,
  DateTimeEffect,
  Decimal,
  DecimalLiteral,
  Duration,
  DurationLiteral,
  Float,
  INT64_MAX,
  INT64_MIN,
  Int,
  Int64,
  Int64Literal,
  NoneAsAbsent,
  SurrealNumber,
  SurrealString,
  Unsupported,
  Uuid,
  codeOf,
  dateTimeFromString,
  dateTimeToString,
  decimalFromString,
  int64,
  intFor,
  invalid,
  isPlainObject,
  leaf,
  literalUnion,
  ok,
  quote,
  quoteList,
  runtimeCode,
  stripNone,
  toWellFormed,
  wrap,
  wrongType
} from "./chunk-AHJIPVVB.js";

// src/collections.ts
import {
  Effect,
  Schema,
  SchemaGetter,
  SchemaIssue,
  SchemaParser
} from "effect";
import {
  BoundExcluded,
  BoundIncluded,
  equals,
  Range as SdkRange
} from "surrealdb";
var duplicateIndex = (values, equality) => {
  if (equality === "reference") return -1;
  for (let i = 1; i < values.length; i++) {
    for (let j = 0; j < i; j++) {
      if (equals(values[i], values[j])) return i;
    }
  }
  return -1;
};
var SetOf = (item, options = {}) => {
  const equality = options.equality ?? "surreal";
  const length = options.length;
  const optionsCode = [
    ...length === void 0 ? [] : [`length: ${length}`],
    ...equality === "surreal" ? [] : [`equality: "${equality}"`]
  ];
  return Schema.declareConstructor()(
    [item],
    ([itemCodec]) => (input, ast, parseOptions) => {
      if (!(input instanceof Set)) {
        return Effect.fail(
          new SchemaIssue.InvalidType(ast, input, parseOptions)
        );
      }
      const elements = [...input];
      return Effect.flatMap(
        Effect.forEach(
          elements,
          (element, index) => Effect.mapError(
            SchemaParser.decodeUnknownEffect(itemCodec)(
              element,
              parseOptions
            ),
            (issue) => new SchemaIssue.Composite(
              ast,
              [new SchemaIssue.Pointer([index], issue)],
              input,
              parseOptions
            )
          )
        ),
        (decoded) => {
          const duplicate = duplicateIndex(elements, equality);
          if (duplicate !== -1) {
            return Effect.fail(
              new SchemaIssue.InvalidValue(
                {
                  message: `set element ${duplicate} duplicates an earlier element; SurrealDB sets hold distinct values`
                },
                input,
                parseOptions
              )
            );
          }
          if (length !== void 0 && decoded.length !== length) {
            return Effect.fail(
              new SchemaIssue.InvalidValue(
                {
                  message: `expected a set of exactly ${length} elements, got ${decoded.length}`
                },
                input,
                parseOptions
              )
            );
          }
          return Effect.succeed(
            new Set(decoded)
          );
        }
      );
    },
    {
      expected: length === void 0 ? "a set" : `a set of ${length} elements`,
      representation: {
        id: "effect-surrealkit/SetOf",
        payload: { length: length ?? null, equality }
      },
      toCode: ({ typeParameters: [itemCode] }) => runtimeCode(
        `SetOf(${itemCode?.runtime ?? ""}${optionsCode.length === 0 ? "" : `, { ${optionsCode.join(", ")} }`})`,
        `ReadonlySet<${itemCode?.Type ?? "unknown"}>`
      ),
      toEquivalence: () => (self, that) => self.size === that.size && [...self].every((a) => [...that].some((b) => equals(a, b))),
      toCodecArbitrary: ({ typeParameters: [itemType] }) => Schema.link()(
        Schema.Array(itemType).check(
          length === void 0 ? Schema.isMaxLength(8) : Schema.isBetweenLength(length, length)
        ),
        {
          decode: SchemaGetter.transform(
            (values) => new Set(values)
          ),
          encode: SchemaGetter.transform((set) => [...set])
        }
      )
    }
  );
};
var boundSource = Schema.Union([
  Schema.Struct({ included: Schema.Boolean, value: Int }),
  Schema.Undefined
]);
var toBound = (source) => source === void 0 ? void 0 : source.included ? new BoundIncluded(source.value) : new BoundExcluded(source.value);
var isBound = (bound) => bound === void 0 || bound instanceof BoundIncluded || bound instanceof BoundExcluded;
var Range = leaf({
  id: "effect-surrealkit/Range",
  expected: "a SurrealDB range",
  code: runtimeCode("Range", "Surreal.Range<unknown, unknown>"),
  parse: (input) => input instanceof SdkRange && isBound(input.begin) && isBound(input.end) ? ok(input) : wrongType,
  equivalence: (self, that) => self.equals(that),
  arbitrary: () => Schema.link()(
    Schema.Tuple([boundSource, boundSource]),
    {
      decode: SchemaGetter.transform(
        ([begin, end]) => new SdkRange(toBound(begin), toBound(end))
      ),
      encode: SchemaGetter.forbidden(
        () => "range arbitraries only generate values"
      )
    }
  )
});

// src/geometry.ts
import { Schema as Schema2, SchemaGetter as SchemaGetter2 } from "effect";
import {
  Geometry as SdkGeometry,
  GeometryCollection as SdkGeometryCollection,
  GeometryLine as SdkGeometryLine,
  GeometryMultiLine as SdkGeometryMultiLine,
  GeometryMultiPoint as SdkGeometryMultiPoint,
  GeometryMultiPolygon as SdkGeometryMultiPolygon,
  GeometryPoint as SdkGeometryPoint,
  GeometryPolygon as SdkGeometryPolygon
} from "surrealdb";
var classes = {
  collection: (u) => u instanceof SdkGeometryCollection,
  line: (u) => u instanceof SdkGeometryLine,
  multiline: (u) => u instanceof SdkGeometryMultiLine,
  multipoint: (u) => u instanceof SdkGeometryMultiPoint,
  multipolygon: (u) => u instanceof SdkGeometryMultiPolygon,
  point: (u) => u instanceof SdkGeometryPoint,
  polygon: (u) => u instanceof SdkGeometryPolygon
};
var typeNames = {
  collection: "Surreal.GeometryCollection",
  line: "Surreal.GeometryLine",
  multiline: "Surreal.GeometryMultiLine",
  multipoint: "Surreal.GeometryMultiPoint",
  multipolygon: "Surreal.GeometryMultiPolygon",
  point: "Surreal.GeometryPoint",
  polygon: "Surreal.GeometryPolygon"
};
var kindOf = (value) => Object.keys(classes).find(
  (kind) => classes[kind](value)
);
var coordinate = Schema2.Finite.check(
  Schema2.isBetween({ minimum: -180, maximum: 180 })
);
var point = (x, y) => new SdkGeometryPoint([x, y]);
var pairs = (min, max) => Schema2.Array(Schema2.Tuple([coordinate, coordinate])).check(
  Schema2.isBetweenLength(min, max)
);
var toPoints = (list) => list.map(([x, y]) => point(x, y));
var atLeastTwo = (points) => {
  const [a, b, ...rest] = points;
  if (a === void 0 || b === void 0) {
    throw new RangeError("a line needs at least two points");
  }
  return [a, b, ...rest];
};
var nonEmpty = (points) => {
  const [a, ...rest] = points;
  if (a === void 0)
    throw new RangeError("a geometry needs at least one point");
  return [a, ...rest];
};
var closedRing = (list) => {
  const points = toPoints(list);
  return new SdkGeometryLine(atLeastTwo([...points, ...points.slice(0, 1)]));
};
var build = {
  point: (list) => nonEmpty(toPoints(list))[0],
  line: (list) => new SdkGeometryLine(atLeastTwo(toPoints(list))),
  polygon: (list) => new SdkGeometryPolygon([closedRing(list)]),
  multipoint: (list) => new SdkGeometryMultiPoint(nonEmpty(toPoints(list))),
  multiline: (list) => new SdkGeometryMultiLine([
    new SdkGeometryLine(atLeastTwo(toPoints(list)))
  ]),
  multipolygon: (list) => new SdkGeometryMultiPolygon([
    new SdkGeometryPolygon([closedRing(list)])
  ]),
  collection: (list) => new SdkGeometryCollection(nonEmpty(toPoints(list)))
};
var minimumPairs = {
  point: 1,
  line: 2,
  polygon: 3,
  multipoint: 1,
  multiline: 2,
  multipolygon: 3,
  collection: 1
};
var GeometryOf = (kinds) => {
  const accepted = kinds.length === 0 ? Object.keys(classes) : kinds;
  const first = accepted[0];
  return leaf({
    id: "effect-surrealkit/GeometryOf",
    payload: [...kinds],
    expected: kinds.length === 0 ? "a geometry" : `a geometry (${kinds.join(", ")})`,
    code: runtimeCode(
      `GeometryOf(${quoteList(kinds)})`,
      kinds.length === 0 ? "Surreal.Geometry" : kinds.map((kind) => typeNames[kind]).join(" | ")
    ),
    parse: (input) => {
      if (!(input instanceof SdkGeometry)) return wrongType;
      const kind = kindOf(input);
      if (kind === void 0 || !accepted.includes(kind)) {
        return invalid(
          `geometry ${kind ?? "of an unknown kind"} is not one of ${accepted.join(", ")}`
        );
      }
      return ok(input);
    },
    equivalence: (self, that) => self.equals(that),
    arbitrary: () => Schema2.link()(
      pairs(minimumPairs[first], minimumPairs[first] + 3),
      {
        decode: SchemaGetter2.transform(
          (list) => build[first](list)
        ),
        encode: SchemaGetter2.forbidden(
          () => "geometry arbitraries only generate values"
        )
      }
    )
  });
};
var GeometryPoint = GeometryOf(["point"]);
var GeometryLine = GeometryOf(["line"]);
var GeometryPolygon = GeometryOf(["polygon"]);
var GeometryMultiPoint = GeometryOf(["multipoint"]);
var GeometryMultiLine = GeometryOf(["multiline"]);
var GeometryMultiPolygon = GeometryOf(["multipolygon"]);
var GeometryCollection = GeometryOf(["collection"]);
var Geometry = GeometryOf([]);

// src/json.ts
import { Effect as Effect3, Schema as Schema4, SchemaIssue as SchemaIssue3, SchemaTransformation as SchemaTransformation2 } from "effect";
import {
  equals as equals3,
  Duration as SdkDuration,
  Geometry as SdkGeometry2,
  Table as SdkTable2,
  Uuid as SdkUuid2,
  TextCodec,
  toSurrealqlString
} from "surrealdb";

// src/record-id.ts
import {
  Effect as Effect2,
  Schema as Schema3,
  SchemaGetter as SchemaGetter3,
  SchemaIssue as SchemaIssue2,
  SchemaParser as SchemaParser2,
  SchemaTransformation
} from "effect";
import {
  equals as equals2,
  FileRef as SdkFileRef,
  RecordId as SdkRecordId,
  Table as SdkTable,
  Uuid as SdkUuid
} from "surrealdb";
var isRecordKey = (key) => typeof key === "string" || typeof key === "number" && Number.isInteger(key) || typeof key === "bigint" || key instanceof SdkUuid || Array.isArray(key) || isPlainObject(key);
var EMPTY_KEY = "an empty string is not a valid record id key (SurrealDB rejects it)";
var RecordKey = leaf({
  id: "effect-surrealkit/RecordKey",
  expected: "a record id key (string, integer, bigint, Uuid, array or object)",
  code: runtimeCode("RecordKey", "Surreal.RecordIdValue"),
  parse: (input) => input === "" ? invalid(EMPTY_KEY) : isRecordKey(input) ? ok(input) : wrongType,
  equivalence: equals2,
  arbitrary: () => Schema3.link()(
    Schema3.Union([Schema3.String.check(Schema3.isMinLength(1)), Int]),
    {
      decode: SchemaGetter3.transform(
        (key) => typeof key === "string" ? toWellFormed(key) : key
      ),
      encode: SchemaGetter3.transform(
        (key) => typeof key === "number" || typeof key === "string" ? key : String(key)
      )
    }
  )
});
var sameKey = (a, b) => {
  if ((typeof a === "number" || typeof a === "bigint") && (typeof b === "number" || typeof b === "bigint")) {
    return (typeof a === "number" ? Number.isInteger(a) : true) && (typeof b === "number" ? Number.isInteger(b) : true) && BigInt(a) === BigInt(b);
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => sameKey(x, b[i]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every((k) => Object.hasOwn(b, k) && sameKey(a[k], b[k]));
  }
  return equals2(a, b);
};
var tableMismatch = (expected, actual) => `expected a record id of table \`${expected}\`, got one of table \`${actual}\``;
var makeRecordIdFor = (table2, key, keyCode, typeCode) => Schema3.declareConstructor()(
  [key],
  ([keyCodec]) => (input, ast, options) => {
    if (!(input instanceof SdkRecordId)) {
      return Effect2.fail(
        new SchemaIssue2.InvalidType(ast, input, options)
      );
    }
    if (input.id === "") {
      return Effect2.fail(
        new SchemaIssue2.InvalidValue(
          { message: EMPTY_KEY },
          input,
          options
        )
      );
    }
    if (input.table.name !== table2) {
      return Effect2.fail(
        new SchemaIssue2.InvalidValue(
          { message: tableMismatch(table2, input.table.name) },
          input,
          options
        )
      );
    }
    return Effect2.flatMapEager(
      Effect2.mapErrorEager(
        SchemaParser2.decodeUnknownEffect(keyCodec)(input.id, {
          ...options,
          onExcessProperty: "error"
        }),
        (issue) => new SchemaIssue2.Composite(
          ast,
          [new SchemaIssue2.Pointer(["id"], issue)],
          input,
          options
        )
      ),
      (decoded) => {
        if (decoded === input.id)
          return Effect2.succeed(input);
        return sameKey(decoded, input.id) ? Effect2.succeed(
          new SdkRecordId(
            table2,
            decoded
          )
        ) : Effect2.fail(
          new SchemaIssue2.InvalidValue(
            {
              message: `the key of ${table2}:${String(input.id)} decodes to a different key`
            },
            input,
            options
          )
        );
      }
    );
  },
  {
    expected: `a record id of table ${table2}`,
    representation: {
      id: "effect-surrealkit/RecordIdFor",
      payload: { table: table2 }
    },
    toCode: ({ typeParameters: [keyParameter] }) => runtimeCode(
      keyCode(keyParameter?.runtime ?? ""),
      typeCode(keyParameter?.Type ?? "")
    ),
    toEquivalence: () => equals2,
    toCodecArbitrary: ({ typeParameters: [keyType] }) => Schema3.link()(keyType, {
      // An empty string is never a valid key; generate one that is.
      decode: SchemaGetter3.transform(
        (k) => new SdkRecordId(
          table2,
          k === "" ? "a" : k
        )
      ),
      encode: SchemaGetter3.transform(
        (id) => id.id
      )
    })
  }
);
function RecordIdFor(table2, options) {
  if (options === void 0) {
    return makeRecordIdFor(
      table2,
      RecordKey,
      () => `RecordIdFor(${quote(table2)})`,
      () => `Surreal.RecordId<${quote(table2)}>`
    );
  }
  return makeRecordIdFor(
    table2,
    options.key,
    (key) => `RecordIdFor(${quote(table2)}, { key: ${key} })`,
    (key) => `SurrealSchema.RecordIdOf<${quote(table2)}, ${key}>`
  );
}
var RecordIdAny = leaf({
  id: "effect-surrealkit/RecordIdAny",
  expected: "a record id",
  code: runtimeCode("RecordIdAny", "Surreal.RecordId"),
  parse: (input) => input instanceof SdkRecordId && isRecordKey(input.id) ? input.id === "" ? invalid(EMPTY_KEY) : ok(input) : wrongType,
  equivalence: equals2,
  arbitrary: () => Schema3.link()(
    Schema3.Tuple([
      Schema3.String.check(Schema3.isPattern(/^[a-z_][a-z0-9_]*$/)),
      Schema3.String.check(Schema3.isMinLength(1))
    ]),
    {
      decode: SchemaGetter3.transform(
        ([tb, key]) => new SdkRecordId(tb, toWellFormed(key))
      ),
      encode: SchemaGetter3.transform(
        (id) => [id.table.name, String(id.id)]
      )
    }
  )
});
var TableFor = (tables) => leaf({
  id: "effect-surrealkit/TableFor",
  payload: [...tables],
  expected: tables.length === 0 ? "a table" : `one of the tables ${tables.join(", ")}`,
  code: runtimeCode(
    `TableFor(${quoteList(tables)})`,
    `Surreal.Table<${literalUnion(tables)}>`
  ),
  parse: (input) => {
    if (!(input instanceof SdkTable)) return wrongType;
    if (tables.length > 0 && !tables.includes(input.name)) {
      return invalid(
        `table \`${input.name}\` is not one of ${tables.join(", ")}`
      );
    }
    return ok(input);
  },
  equivalence: (self, that) => self.equals(that),
  arbitrary: () => Schema3.link()(
    tables.length === 0 ? Schema3.String.check(
      Schema3.isPattern(/^[a-z_][a-z0-9_]*$/)
    ) : Schema3.Literals(tables),
    {
      decode: SchemaGetter3.transform(
        (name) => new SdkTable(name)
      ),
      encode: SchemaGetter3.transform((table2) => table2.name)
    }
  )
});
var FileRefFor = (buckets) => leaf({
  id: "effect-surrealkit/FileRefFor",
  payload: [...buckets],
  expected: buckets.length === 0 ? "a file reference" : `a file reference in ${buckets.join(", ")}`,
  code: runtimeCode(
    `FileRefFor(${quoteList(buckets)})`,
    "Surreal.FileRef"
  ),
  parse: (input) => {
    if (!(input instanceof SdkFileRef)) return wrongType;
    if (buckets.length > 0 && !buckets.includes(input.bucket)) {
      return invalid(
        `file bucket \`${input.bucket}\` is not one of ${buckets.join(", ")}`
      );
    }
    return ok(input);
  },
  equivalence: (self, that) => self.equals(that),
  arbitrary: () => Schema3.link()(
    Schema3.Tuple([
      buckets.length === 0 ? Schema3.String.check(
        Schema3.isPattern(/^[a-z_][a-z0-9_]*$/)
      ) : Schema3.Literals(buckets),
      Schema3.String.check(Schema3.isPattern(/^\/[a-z0-9_./-]*$/))
    ]),
    {
      decode: SchemaGetter3.transform(
        ([bucket, key]) => new SdkFileRef(bucket, key)
      ),
      encode: SchemaGetter3.transform(
        (file) => [file.bucket, file.key]
      )
    }
  )
});
var taggedRecordId = (ids) => {
  const tables = Object.keys(ids).sort();
  if (tables.length === 0) {
    throw new RangeError("taggedRecordId needs at least one table");
  }
  const idSchemas = tables.map((table2) => ids[table2]);
  const tagged = tables.map(
    (table2) => Schema3.TaggedStruct(table2, {
      id: Schema3.toType(ids[table2])
    })
  );
  const inner = Schema3.Union(idSchemas).pipe(
    Schema3.decodeTo(
      Schema3.Union(tagged),
      SchemaTransformation.transformEffect({
        // The union in front of this transformation only lets record ids
        // of the listed tables through.
        decode: (id) => Effect2.succeed({
          _tag: id.table.name,
          id
        }),
        encode: (value) => {
          const table2 = value.id.table.name;
          return table2 === value._tag ? Effect2.succeed(value.id) : Effect2.fail(
            new SchemaIssue2.InvalidValue({
              message: `tag \`${value._tag}\` does not match the id's table \`${table2}\``
            })
          );
        }
      })
    )
  );
  return wrap(inner, {
    id: "effect-surrealkit/TaggedRecordId",
    payload: tables,
    expected: `a record id of ${tables.join(", ")}`,
    // The wrapped union only shows the encoded side, so print the map.
    code: () => {
      const entries = tables.map((table2) => {
        const code = codeOf(ids[table2]);
        return { table: table2, code };
      });
      const runtimeMap = entries.map(({ table: table2, code }) => `${quote(table2)}: ${code.runtime}`).join(", ");
      const typeMap = entries.map(
        ({ table: table2, code }) => `${quote(table2)}: Schema.Codec<${code.Type}>`
      ).join("; ");
      return {
        runtime: `SurrealSchema.taggedRecordId({ ${runtimeMap} })`,
        Type: `SurrealSchema.TaggedRecordId<{ ${typeMap} }>`,
        importDeclarations: runtimeCode("", "").importDeclarations
      };
    },
    equivalence: (self, that) => self._tag === that._tag && equals2(self.id, that.id)
  });
};

// src/json.ts
var failWith = (message) => Effect3.fail(new SchemaIssue3.InvalidValue({ message }));
var attempt = (f) => Effect3.suspend(() => {
  try {
    return Effect3.succeed(f());
  } catch (error) {
    return failWith(
      error instanceof Error ? error.message : String(error)
    );
  }
});
var fromString = (target, name, options) => wrap(
  Schema4.String.pipe(
    Schema4.decodeTo(
      target,
      SchemaTransformation2.transformEffect({
        decode: (text) => attempt(() => options.decode(text)),
        encode: (value) => Effect3.succeed(options.encode(value))
      })
    )
  ),
  {
    id: `effect-surrealkit/${name}`,
    expected: options.expected,
    code: () => runtimeCode(name, options.Type)
  }
);
var DateTimeFromJson = fromString(DateTime, "DateTimeFromJson", {
  expected: "an RFC 3339 datetime string",
  Type: "Surreal.DateTime",
  decode: dateTimeFromString,
  encode: dateTimeToString
});
var DecimalFromJson = fromString(Decimal, "DecimalFromJson", {
  expected: "a decimal string",
  Type: "Surreal.Decimal",
  decode: decimalFromString,
  encode: (value) => value.toString()
});
var DURATION_TEXT = /^(?:\d+(?:y|w|d|h|m|s|ms|us|µs|ns))+$/;
var DurationFromJson = fromString(Duration, "DurationFromJson", {
  expected: "a duration string",
  Type: "Surreal.Duration",
  decode: (text) => {
    if (!DURATION_TEXT.test(text))
      throw new RangeError(`${quote(text)} is not a duration`);
    return new SdkDuration(text);
  },
  encode: (value) => value.toString()
});
var UUID_TEXT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var UuidFromJson = fromString(Uuid, "UuidFromJson", {
  expected: "a UUID string",
  Type: "Surreal.Uuid",
  decode: (text) => {
    if (!UUID_TEXT.test(text))
      throw new RangeError(`${quote(text)} is not a UUID`);
    return new SdkUuid2(text);
  },
  encode: (value) => value.toString()
});
var tableLength = (text) => {
  const close = text.startsWith("`") ? "`" : text.startsWith("\u27E8") ? "\u27E9" : "";
  if (close === "") {
    const name = /^[A-Za-z0-9_]+/.exec(text);
    if (name === null)
      throw new RangeError(`${quote(text)} has no table name`);
    return name[0].length;
  }
  for (let i = 1; i < text.length; i++) {
    if (text[i] === "\\") i++;
    else if (text[i] === close) return i + 1;
  }
  throw new RangeError(`${quote(text)} has an unterminated table name`);
};
var recordIdFromText = (text) => {
  const length = tableLength(text);
  if (text[length] !== ":")
    throw new RangeError(`${quote(text)} is not a record id`);
  const key = text.slice(length + 1);
  return /^[A-Za-z0-9_]+$/.test(key) && !/^\d+$/.test(key) ? TextCodec.parseRecordId(`${text.slice(0, length)}:\u27E8${key}\u27E9`) : TextCodec.parseRecordId(text);
};
var RecordIdFromJson = (table2) => wrap(
  Schema4.String.pipe(
    Schema4.decodeTo(
      RecordIdFor(table2),
      SchemaTransformation2.transformEffect({
        decode: (text) => attempt(
          () => recordIdFromText(text)
        ),
        encode: (value) => Effect3.succeed(value.toString())
      })
    )
  ),
  {
    id: "effect-surrealkit/RecordIdFromJson",
    payload: { table: table2 },
    expected: `a record id string of table ${table2}`,
    code: () => runtimeCode(
      `RecordIdFromJson(${quote(table2)})`,
      `Surreal.RecordId<${quote(table2)}>`
    )
  }
);
var INT_TEXT = /^-?\d+$/;
var Int64FromJson = wrap(
  Schema4.Union([Schema4.Number, Schema4.String]).pipe(
    Schema4.decodeTo(
      Int64,
      SchemaTransformation2.transformEffect({
        decode: (input) => {
          if (typeof input === "number") {
            return Number.isSafeInteger(input) ? Effect3.succeed(input) : failWith(
              `JSON number ${input} is not a safe integer; send ints beyond \xB1(2^53 - 1) as text`
            );
          }
          if (!INT_TEXT.test(input))
            return failWith(`${quote(input)} is not an integer`);
          const value = BigInt(input);
          return value < INT64_MIN || value > INT64_MAX ? failWith(
            `integer ${input} is outside the SurrealDB int range`
          ) : Effect3.succeed(value);
        },
        encode: (value) => Effect3.succeed(
          typeof value === "bigint" && value >= BigInt(Number.MIN_SAFE_INTEGER) && value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : String(value)
        )
      })
    )
  ),
  {
    id: "effect-surrealkit/Int64FromJson",
    expected: "an integer (JSON number or text)",
    code: () => runtimeCode("Int64FromJson", "SurrealSchema.Int64")
  }
);
var byte = Schema4.Number.check(
  Schema4.isInt(),
  Schema4.isBetween({ minimum: 0, maximum: 255 })
);
var BytesFromJson = wrap(
  Schema4.Array(byte).pipe(
    Schema4.decodeTo(
      Bytes,
      SchemaTransformation2.transform({
        decode: (bytes) => Uint8Array.from(bytes),
        encode: (bytes) => [
          ...bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
        ]
      })
    )
  ),
  {
    id: "effect-surrealkit/BytesFromJson",
    expected: "an array of bytes",
    code: () => runtimeCode("BytesFromJson", "Uint8Array")
  }
);
var textTo = (target, options) => wrap(
  Schema4.String.pipe(
    Schema4.decodeTo(
      target,
      SchemaTransformation2.transformEffect({
        decode: (text) => attempt(() => options.decode(text)),
        encode: (value) => Effect3.succeed(options.encode(value))
      })
    )
  ),
  {
    id: options.id,
    expected: options.expected,
    code: options.code
  }
);
var RecordIdAnyFromJson = textTo(RecordIdAny, {
  id: "effect-surrealkit/RecordIdAnyFromJson",
  expected: "a record id string",
  code: () => runtimeCode("RecordIdAnyFromJson", "Surreal.RecordId"),
  decode: recordIdFromText,
  encode: (value) => value.toString()
});
var RecordIdFromJsonAs = (id) => wrap(RecordIdAnyFromJson.pipe(Schema4.decodeTo(id)), {
  id: "effect-surrealkit/RecordIdFromJsonAs",
  expected: "a record id string",
  code: () => {
    const inner = codeOf(id);
    return runtimeCode(
      `RecordIdFromJsonAs(${inner.runtime})`,
      inner.Type
    );
  }
});
var TableFromJson = (tables) => textTo(TableFor(tables), {
  id: "effect-surrealkit/TableFromJson",
  expected: tables.length === 0 ? "a table name" : `one of the table names ${tables.join(", ")}`,
  code: () => runtimeCode(
    `TableFromJson(${quoteList(tables)})`,
    `Surreal.Table<${literalUnion(tables)}>`
  ),
  // The table leaf checks the name against `tables`.
  decode: (text) => new SdkTable2(text),
  encode: (table2) => table2.name
});
var FileRefFromJson = (buckets) => textTo(FileRefFor(buckets), {
  id: "effect-surrealkit/FileRefFromJson",
  expected: 'a file reference string (f"bucket:/key")',
  code: () => runtimeCode(
    `FileRefFromJson(${quoteList(buckets)})`,
    "Surreal.FileRef"
  ),
  decode: (text) => TextCodec.parseFile(text),
  encode: (file) => toSurrealqlString(file)
});
var RangeFromJson = textTo(Range, {
  id: "effect-surrealkit/RangeFromJson",
  expected: "a range string",
  code: () => runtimeCode("RangeFromJson", "Surreal.Range<unknown, unknown>"),
  decode: (text) => TextCodec.parseRange(text),
  encode: (range) => toSurrealqlString(range)
});
var GeoJson = Schema4.Record(Schema4.String, Schema4.Unknown);
var GeometryFromJson = (geometry) => wrap(
  GeoJson.pipe(
    Schema4.decodeTo(
      geometry,
      SchemaTransformation2.transformEffect({
        decode: (json) => attempt(
          () => SdkGeometry2.fromJSON(
            json
          )
        ),
        encode: (value) => Effect3.succeed(
          value.toJSON()
        )
      })
    )
  ),
  {
    id: "effect-surrealkit/GeometryFromJson",
    expected: "a GeoJSON geometry",
    code: () => {
      const inner = codeOf(geometry);
      return runtimeCode(
        `GeometryFromJson(${inner.runtime})`,
        inner.Type
      );
    }
  }
);
var SurrealNumberFromJson = wrap(
  Schema4.Union([Schema4.Finite, Schema4.String]).pipe(
    Schema4.decodeTo(
      SurrealNumber,
      SchemaTransformation2.transformEffect({
        decode: (input) => typeof input === "number" ? Effect3.succeed(input) : attempt(() => decimalFromString(input)),
        encode: (value) => Effect3.succeed(
          typeof value === "number" ? value : value.toString()
        )
      })
    )
  ),
  {
    id: "effect-surrealkit/SurrealNumberFromJson",
    expected: "a number, or a decimal string",
    code: () => runtimeCode(
      "SurrealNumberFromJson",
      "number | bigint | Surreal.Decimal"
    )
  }
);
var DateTimeEffectFromJson = wrap(
  DateTimeFromJson.pipe(Schema4.decodeTo(DateTimeEffect)),
  {
    id: "effect-surrealkit/DateTimeEffectFromJson",
    expected: "an RFC 3339 datetime string",
    code: () => runtimeCode("DateTimeEffectFromJson", "DateTime.Utc")
  }
);
var SetFromJson = (item, options = {}) => wrap(
  Schema4.Array(item).pipe(
    Schema4.decodeTo(
      SetOf(Schema4.toType(item), options),
      SchemaTransformation2.transformEffect({
        // Check before `new Set` silently drops primitive duplicates.
        decode: (values) => {
          const duplicate = values.findIndex(
            (value, index) => values.slice(0, index).some((earlier) => equals3(earlier, value))
          );
          return duplicate === -1 ? Effect3.succeed(new Set(values)) : failWith(
            `set element ${duplicate} duplicates an earlier element; SurrealDB sets hold distinct values`
          );
        },
        encode: (set) => Effect3.succeed([...set])
      })
    )
  ),
  {
    id: "effect-surrealkit/SetFromJson",
    expected: "an array of distinct elements",
    // The wrapped array only shows the encoded side, so print the item.
    code: () => {
      const itemCode = codeOf(item);
      const lengthCode = options.length === void 0 ? "" : `, { length: ${options.length} }`;
      return runtimeCode(
        `SetFromJson(${itemCode.runtime}${lengthCode})`,
        `ReadonlySet<${itemCode.Type}>`
      );
    }
  }
);

// src/table.ts
import { Schema as Schema5 } from "effect";
var table = (descriptor) => descriptor;
var view = (descriptor) => descriptor;
var edge = (descriptor) => descriptor;
var fn = (descriptor) => descriptor;
var withPresence = (schema, presence) => {
  switch (presence) {
    case "required":
      return schema;
    case "optional":
      return Schema5.optionalKey(schema);
    case "removable":
    case "resettable":
      return Schema5.optional(schema);
    case "excluded":
      throw new RangeError(
        "an excluded field has no schema in this operation"
      );
  }
};
var isStructWithRest = (row) => "records" in row && "schema" in row;
var replaceInRow = (row, operation, presence, replacements) => {
  const struct = isStructWithRest(row) ? row.schema : row;
  const fields = {};
  for (const [key, field] of Object.entries(struct.fields)) {
    const replacement = replacements[key];
    const fieldPresence = presence[key]?.[operation];
    fields[key] = replacement === void 0 || fieldPresence === void 0 ? field : withPresence(replacement, fieldPresence);
  }
  const rebuilt = Schema5.Struct(fields);
  return isStructWithRest(row) ? Schema5.StructWithRest(rebuilt, row.records) : rebuilt;
};
var operations = [
  "select",
  "create",
  "merge",
  "content"
];
var assertSharedFields = (descriptor, keys) => {
  for (const key of keys) {
    if (!Object.hasOwn(descriptor.fields, key)) {
      throw new RangeError(
        `\`${key}\` is not a shared field of table \`${descriptor.name}\`; refine and replaceField accept: ${Object.keys(descriptor.fields).join(", ")}`
      );
    }
  }
};
var replaceFields = (descriptor, replacements) => {
  assertSharedFields(descriptor, Object.keys(replacements));
  for (const [key, schema] of Object.entries(replacements)) {
    if (schema.ast.context?.isOptional === true) {
      throw new TypeError(
        `the schema for \`${key}\` of table \`${descriptor.name}\` is optional; refine and replaceField take the base schema, and each variant applies the field's own presence`
      );
    }
  }
  const next = {
    ...descriptor,
    fields: { ...descriptor.fields, ...replacements }
  };
  for (const operation of operations) {
    const row = descriptor[operation];
    if (row !== void 0) {
      next[operation] = replaceInRow(
        row,
        operation,
        descriptor.presence,
        replacements
      );
    }
  }
  return next;
};
var refine = (descriptor, refinements) => {
  const entries = Object.entries(
    refinements
  );
  assertSharedFields(
    descriptor,
    entries.map(([key]) => key)
  );
  const replacements = {};
  for (const [key, refinement] of entries) {
    replacements[key] = refinement(descriptor.fields[key]);
  }
  return replaceFields(descriptor, replacements);
};
var replaceField = (descriptor, key, schema) => replaceFields(descriptor, { [key]: schema });

// src/value.ts
import { Effect as Effect4, Schema as Schema6, SchemaIssue as SchemaIssue4, SchemaParser as SchemaParser3 } from "effect";
import {
  FileRef,
  Table
} from "surrealdb";
var plainRecord = (value) => Schema6.declareConstructor()(
  [Schema6.Record(Schema6.String, value)],
  ([record]) => (input, ast, options) => {
    if (Array.isArray(input) || !isPlainObject(input)) {
      return Effect4.fail(
        new SchemaIssue4.InvalidType(ast, input, options)
      );
    }
    return SchemaParser3.decodeUnknownEffect(record)(input, options);
  },
  { expected: "a plain object" }
);
var NativeElement = Schema6.suspend(() => SurrealValue);
var nativeNonRecord = [
  Schema6.Null,
  Schema6.Boolean,
  Schema6.Number,
  Schema6.BigInt,
  Schema6.String,
  DateTime,
  RecordIdAny,
  Duration,
  Decimal,
  Uuid,
  Geometry,
  Range,
  Schema6.Date,
  Schema6.instanceOf(Table),
  Schema6.instanceOf(FileRef),
  Schema6.instanceOf(Uint8Array),
  Schema6.ReadonlySet(NativeElement),
  Schema6.Array(NativeElement)
];
var SurrealValue = Schema6.Union([
  ...nativeNonRecord,
  plainRecord(NativeElement)
]).annotate({ identifier: "SurrealValue" });
var SurrealMergeValue = Schema6.Union([
  Schema6.Undefined,
  ...nativeNonRecord,
  plainRecord(Schema6.suspend(() => SurrealMergeValue))
]).annotate({ identifier: "SurrealMergeValue" });
var JsonElement = Schema6.suspend(() => SurrealJsonValue);
var SurrealJsonValue = Schema6.Union([
  Schema6.Null,
  Schema6.Boolean,
  Schema6.Finite,
  Schema6.String,
  Schema6.Array(JsonElement),
  plainRecord(JsonElement)
]).annotate({ identifier: "SurrealJsonValue" });
export {
  Bytes,
  BytesFromJson,
  DATETIME_MAX_SECONDS,
  DATETIME_MIN_SECONDS,
  DECIMAL_MAX_MANTISSA,
  DECIMAL_MAX_SCALE,
  DURATION_MAX_SECONDS,
  DateTime,
  DateTimeEffect,
  DateTimeEffectFromJson,
  DateTimeFromJson,
  Decimal,
  DecimalFromJson,
  DecimalLiteral,
  Duration,
  DurationFromJson,
  DurationLiteral,
  FileRefFor,
  FileRefFromJson,
  Float,
  Geometry,
  GeometryCollection,
  GeometryFromJson,
  GeometryLine,
  GeometryMultiLine,
  GeometryMultiPoint,
  GeometryMultiPolygon,
  GeometryOf,
  GeometryPoint,
  GeometryPolygon,
  INT64_MAX,
  INT64_MIN,
  Int,
  Int64,
  Int64FromJson,
  Int64Literal,
  NoneAsAbsent,
  Range,
  RangeFromJson,
  RecordIdAny,
  RecordIdAnyFromJson,
  RecordIdFor,
  RecordIdFromJson,
  RecordIdFromJsonAs,
  RecordKey,
  SetFromJson,
  SetOf,
  SurrealString as String,
  SurrealJsonValue,
  SurrealMergeValue,
  SurrealNumber,
  SurrealNumberFromJson,
  SurrealValue,
  TableFor,
  TableFromJson,
  Unsupported,
  Uuid,
  UuidFromJson,
  dateTimeFromString,
  dateTimeToString,
  decimalFromString,
  edge,
  fn,
  int64,
  intFor,
  refine,
  replaceField,
  stripNone,
  table,
  taggedRecordId,
  toWellFormed,
  view,
  withPresence
};
//# sourceMappingURL=index.js.map