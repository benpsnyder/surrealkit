import {
  DateTime,
  Decimal,
  Duration,
  Int,
  Uuid,
  invalid,
  isPlainObject,
  leaf,
  literalUnion,
  ok,
  quote,
  quoteList,
  runtimeCode,
  toWellFormed,
  wrap,
  wrongType
} from "./chunk-VZONF6WY.js";

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
var makeRecordIdFor = (table, key, keyCode, typeCode) => Schema3.declareConstructor()(
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
    if (input.table.name !== table) {
      return Effect2.fail(
        new SchemaIssue2.InvalidValue(
          { message: tableMismatch(table, input.table.name) },
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
            table,
            decoded
          )
        ) : Effect2.fail(
          new SchemaIssue2.InvalidValue(
            {
              message: `the key of ${table}:${String(input.id)} decodes to a different key`
            },
            input,
            options
          )
        );
      }
    );
  },
  {
    expected: `a record id of table ${table}`,
    representation: {
      id: "effect-surrealkit/RecordIdFor",
      payload: { table }
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
          table,
          k === "" ? "a" : k
        )
      ),
      encode: SchemaGetter3.transform(
        (id) => id.id
      )
    })
  }
);
function RecordIdFor(table, options) {
  if (options === void 0) {
    return makeRecordIdFor(
      table,
      RecordKey,
      () => `RecordIdFor(${quote(table)})`,
      () => `Surreal.RecordId<${quote(table)}>`
    );
  }
  return makeRecordIdFor(
    table,
    options.key,
    (key) => `RecordIdFor(${quote(table)}, { key: ${key} })`,
    (key) => `SurrealSchema.RecordIdOf<${quote(table)}, ${key}>`
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
      encode: SchemaGetter3.transform((table) => table.name)
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
  const idSchemas = tables.map((table) => ids[table]);
  const tagged = tables.map(
    (table) => Schema3.TaggedStruct(table, {
      id: Schema3.toType(ids[table])
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
          const table = value.id.table.name;
          return table === value._tag ? Effect2.succeed(value.id) : Effect2.fail(
            new SchemaIssue2.InvalidValue({
              message: `tag \`${value._tag}\` does not match the id's table \`${table}\``
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
    codeParameters: idSchemas,
    code: ([, ...idCodes]) => {
      const entries = tables.map((table, index) => {
        const code = idCodes[index];
        if (code === void 0)
          throw new Error(`Missing schema code for ${table}`);
        return { table, code };
      });
      const runtimeMap = entries.map(({ table, code }) => `${quote(table)}: ${code.runtime}`).join(", ");
      const typeMap = entries.map(
        ({ table, code }) => `${quote(table)}: Schema.Codec<${code.Type}>`
      ).join("; ");
      return runtimeCode(
        `taggedRecordId({ ${runtimeMap} })`,
        `SurrealSchema.TaggedRecordId<{ ${typeMap} }>`
      );
    },
    equivalence: (self, that) => self._tag === that._tag && equals2(self.id, that.id)
  });
};

// src/value.ts
import { Effect as Effect3, Schema as Schema4, SchemaIssue as SchemaIssue3, SchemaParser as SchemaParser3 } from "effect";
import {
  FileRef,
  Table
} from "surrealdb";
var plainRecord = (value) => Schema4.declareConstructor()(
  [Schema4.Record(Schema4.String, value)],
  ([record]) => (input, ast, options) => {
    if (Array.isArray(input) || !isPlainObject(input)) {
      return Effect3.fail(
        new SchemaIssue3.InvalidType(ast, input, options)
      );
    }
    return SchemaParser3.decodeUnknownEffect(record)(input, options);
  },
  { expected: "a plain object" }
);
var NativeElement = Schema4.suspend(() => SurrealValue);
var nativeNonRecord = [
  Schema4.Null,
  Schema4.Boolean,
  Schema4.Number,
  Schema4.BigInt,
  Schema4.String,
  DateTime,
  RecordIdAny,
  Duration,
  Decimal,
  Uuid,
  Geometry,
  Range,
  Schema4.Date,
  Schema4.instanceOf(Table),
  Schema4.instanceOf(FileRef),
  Schema4.instanceOf(Uint8Array),
  Schema4.ReadonlySet(NativeElement),
  Schema4.Array(NativeElement)
];
var SurrealValue = Schema4.Union([
  ...nativeNonRecord,
  plainRecord(NativeElement)
]).annotate({ identifier: "SurrealValue" });
var SurrealMergeValue = Schema4.Union([
  Schema4.Undefined,
  ...nativeNonRecord,
  plainRecord(Schema4.suspend(() => SurrealMergeValue))
]).annotate({ identifier: "SurrealMergeValue" });
var JsonElement = Schema4.suspend(() => SurrealJsonValue);
var SurrealJsonValue = Schema4.Union([
  Schema4.Null,
  Schema4.Boolean,
  Schema4.Finite,
  Schema4.String,
  Schema4.Array(JsonElement),
  plainRecord(JsonElement)
]).annotate({ identifier: "SurrealJsonValue" });

export {
  SetOf,
  Range,
  GeometryOf,
  GeometryPoint,
  GeometryLine,
  GeometryPolygon,
  GeometryMultiPoint,
  GeometryMultiLine,
  GeometryMultiPolygon,
  GeometryCollection,
  Geometry,
  RecordKey,
  RecordIdFor,
  RecordIdAny,
  TableFor,
  FileRefFor,
  taggedRecordId,
  SurrealValue,
  SurrealMergeValue,
  SurrealJsonValue
};
//# sourceMappingURL=chunk-LHVQILTS.js.map