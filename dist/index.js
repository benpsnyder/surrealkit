import {
  FileRefFor,
  Geometry,
  GeometryCollection,
  GeometryLine,
  GeometryMultiLine,
  GeometryMultiPoint,
  GeometryMultiPolygon,
  GeometryOf,
  GeometryPoint,
  GeometryPolygon,
  Range,
  RecordIdAny,
  RecordIdFor,
  RecordKey,
  SetOf,
  SurrealJsonValue,
  SurrealMergeValue,
  SurrealValue,
  TableFor,
  taggedRecordId
} from "./chunk-BOMQHKJG.js";
import {
  NoneAsAbsent,
  stripNone
} from "./chunk-EEFZAKBV.js";
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
  RUNTIME_IMPORT,
  SDK_TYPE_IMPORT,
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
  isPlainObject,
  literalUnion,
  quote,
  quoteList,
  runtimeCode,
  toWellFormed,
  wrap
} from "./chunk-MUBWQQFC.js";
import "./chunk-3SWEJO3L.js";
import "./chunk-PZ5AY32C.js";

// src/empty.ts
import { Schema } from "effect";
var isEmptyObject = (annotations) => Schema.makeFilter(
  (value) => isPlainObject(value) && Object.keys(value).length === 0,
  {
    expected: "an empty object",
    representation: {
      id: "effect-surrealkit/isEmptyObject",
      payload: null
    },
    toJsonSchema: () => ({
      type: "object",
      additionalProperties: false
    }),
    toCode: () => ({
      runtime: "SurrealSchema.isEmptyObject()",
      importDeclarations: [RUNTIME_IMPORT, SDK_TYPE_IMPORT]
    }),
    ...annotations
  }
);
var EmptyObject = Schema.Struct({}).check(isEmptyObject());

// src/json.ts
import { Effect, Schema as Schema2, SchemaIssue, SchemaTransformation } from "effect";
import {
  equals,
  Duration as SdkDuration,
  Geometry as SdkGeometry,
  Table as SdkTable,
  Uuid as SdkUuid,
  TextCodec,
  toSurrealqlString
} from "surrealdb";
var failWith = (message) => Effect.fail(new SchemaIssue.InvalidValue({ message }));
var attempt = (f) => Effect.suspend(() => {
  try {
    return Effect.succeed(f());
  } catch (error) {
    return failWith(
      error instanceof Error ? error.message : String(error)
    );
  }
});
var fromString = (target, name, options) => wrap(
  Schema2.String.pipe(
    Schema2.decodeTo(
      target,
      SchemaTransformation.transformEffect({
        decode: (text) => attempt(() => options.decode(text)),
        encode: (value) => Effect.succeed(options.encode(value))
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
    return new SdkUuid(text);
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
  Schema2.String.pipe(
    Schema2.decodeTo(
      RecordIdFor(table2),
      SchemaTransformation.transformEffect({
        decode: (text) => attempt(
          () => recordIdFromText(text)
        ),
        encode: (value) => Effect.succeed(value.toString())
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
  Schema2.Union([Schema2.Number, Schema2.String]).pipe(
    Schema2.decodeTo(
      Int64,
      SchemaTransformation.transformEffect({
        decode: (input) => {
          if (typeof input === "number") {
            return Number.isSafeInteger(input) ? Effect.succeed(input) : failWith(
              `JSON number ${input} is not a safe integer; send ints beyond \xB1(2^53 - 1) as text`
            );
          }
          if (!INT_TEXT.test(input))
            return failWith(`${quote(input)} is not an integer`);
          const value = BigInt(input);
          return value < INT64_MIN || value > INT64_MAX ? failWith(
            `integer ${input} is outside the SurrealDB int range`
          ) : Effect.succeed(value);
        },
        encode: (value) => Effect.succeed(
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
var byte = Schema2.Number.check(
  Schema2.isInt(),
  Schema2.isBetween({ minimum: 0, maximum: 255 })
);
var BytesFromJson = wrap(
  Schema2.Array(byte).pipe(
    Schema2.decodeTo(
      Bytes,
      SchemaTransformation.transform({
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
  Schema2.String.pipe(
    Schema2.decodeTo(
      target,
      SchemaTransformation.transformEffect({
        decode: (text) => attempt(() => options.decode(text)),
        encode: (value) => Effect.succeed(options.encode(value))
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
var RecordIdFromJsonAs = (id) => wrap(RecordIdAnyFromJson.pipe(Schema2.decodeTo(id)), {
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
  decode: (text) => new SdkTable(text),
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
var GeoJson = Schema2.Record(Schema2.String, Schema2.Unknown);
var GeometryFromJson = (geometry) => wrap(
  GeoJson.pipe(
    Schema2.decodeTo(
      geometry,
      SchemaTransformation.transformEffect({
        decode: (json) => attempt(
          () => SdkGeometry.fromJSON(
            json
          )
        ),
        encode: (value) => Effect.succeed(
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
  Schema2.Union([Schema2.Finite, Schema2.String]).pipe(
    Schema2.decodeTo(
      SurrealNumber,
      SchemaTransformation.transformEffect({
        decode: (input) => typeof input === "number" ? Effect.succeed(input) : attempt(() => decimalFromString(input)),
        encode: (value) => Effect.succeed(
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
  DateTimeFromJson.pipe(Schema2.decodeTo(DateTimeEffect)),
  {
    id: "effect-surrealkit/DateTimeEffectFromJson",
    expected: "an RFC 3339 datetime string",
    code: () => runtimeCode("DateTimeEffectFromJson", "DateTime.Utc")
  }
);
var SetFromJson = (item, options = {}) => wrap(
  Schema2.Array(item).pipe(
    Schema2.decodeTo(
      SetOf(Schema2.toType(item), options),
      SchemaTransformation.transformEffect({
        // Check before `new Set` silently drops primitive duplicates.
        decode: (values) => {
          const duplicate = values.findIndex(
            (value, index) => values.slice(0, index).some((earlier) => equals(earlier, value))
          );
          return duplicate === -1 ? Effect.succeed(new Set(values)) : failWith(
            `set element ${duplicate} duplicates an earlier element; SurrealDB sets hold distinct values`
          );
        },
        encode: (set) => Effect.succeed([...set])
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
import { Schema as Schema3 } from "effect";
var table = (descriptor) => descriptor;
var view = (descriptor) => descriptor;
var edge = (descriptor) => descriptor;
var fn = (descriptor) => descriptor;
var store = (descriptor) => descriptor;
var withPresence = (schema, presence) => {
  switch (presence) {
    case "required":
      return schema;
    case "optional":
      return Schema3.optionalKey(schema);
    case "removable":
    case "resettable":
      return Schema3.optional(schema);
    case "excluded":
      throw new RangeError(
        "an excluded field has no schema in this operation"
      );
  }
};
var isStructWithRest = (row) => "records" in row && "schema" in row;
var replaceInRow = (row, operation, presence, replacements) => {
  const struct = isStructWithRest(row) ? row.schema : row;
  if (!Object.keys(struct.fields).some(
    (key) => Object.hasOwn(replacements, key)
  )) {
    return row;
  }
  const fields = {};
  for (const [key, field] of Object.entries(struct.fields)) {
    const replacement = replacements[key];
    const fieldPresence = operation === "visible" ? field.ast.context?.isOptional === true ? "optional" : "required" : presence[key]?.[operation];
    fields[key] = replacement === void 0 || fieldPresence === void 0 ? field : withPresence(replacement, fieldPresence);
  }
  const rebuilt = Schema3.Struct(fields);
  return isStructWithRest(row) ? Schema3.StructWithRest(rebuilt, row.records) : rebuilt;
};
var operations = [
  "select",
  "visible",
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
  EmptyObject,
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
  isEmptyObject,
  refine,
  replaceField,
  store,
  stripNone,
  table,
  taggedRecordId,
  toWellFormed,
  view,
  withPresence
};
//# sourceMappingURL=index.js.map