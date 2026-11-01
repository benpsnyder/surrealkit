// src/collections.ts
import {
  Effect as Effect2,
  Schema as Schema3,
  SchemaGetter as SchemaGetter3,
  SchemaIssue as SchemaIssue2,
  SchemaParser as SchemaParser2
} from "effect";
import {
  BoundExcluded,
  BoundIncluded,
  equals,
  Range as SdkRange
} from "surrealdb";

// src/int.ts
import { Schema as Schema2, SchemaGetter as SchemaGetter2 } from "effect";

// src/internal/code.ts
import { SchemaRepresentation } from "effect";
var PACKAGE_NAME = "effect-surrealkit";
var RUNTIME_IMPORT = `import * as SurrealSchema from "${PACKAGE_NAME}"`;
var SDK_TYPE_IMPORT = 'import type * as Surreal from "surrealdb"';
var quote = (value) => JSON.stringify(value);
var quoteList = (values) => `[${values.map(quote).join(", ")}]`;
var literalUnion = (values) => values.length === 0 ? "string" : values.map(quote).join(" | ");
var codeOf = (schema) => {
  const document = SchemaRepresentation.toCodeDocument(
    SchemaRepresentation.toMultiDocument(
      SchemaRepresentation.toRepresentation(schema.ast)
    )
  );
  const [code] = document.codes;
  if (code === void 0) throw new Error("no code generated");
  return code;
};
var runtimeCode = (runtime, Type) => ({
  runtime: `SurrealSchema.${runtime}`,
  Type,
  importDeclarations: [RUNTIME_IMPORT, SDK_TYPE_IMPORT]
});

// src/internal/declare.ts
import {
  Effect,
  Schema,
  SchemaAST,
  SchemaGetter,
  SchemaIssue,
  SchemaParser
} from "effect";
var ok = (value) => ({ ok: true, value });
var wrongType = { ok: false };
var invalid = (message) => ({
  ok: false,
  message
});
var constrained = (target, constraint) => constraint === void 0 ? target : target.check(
  Schema.makeFilter(() => true, {
    arbitraryConstraint: constraint
  })
);
var leaf = (options) => Schema.declareConstructor()(
  [],
  () => (input, ast, parseOptions) => {
    const parsed = options.parse(input);
    if (parsed.ok) return Effect.succeed(parsed.value);
    return Effect.fail(
      parsed.message === void 0 ? new SchemaIssue.InvalidType(ast, input, parseOptions) : new SchemaIssue.InvalidValue(
        { message: parsed.message },
        input,
        parseOptions
      )
    );
  },
  {
    expected: options.expected,
    representation: {
      id: options.id,
      payload: options.payload ?? null
    },
    toCode: () => options.code,
    ...options.arbitrary && {
      toCodecArbitrary: ({ constraint }) => options.arbitrary(constraint)
    },
    ...options.equivalence && {
      toEquivalence: () => options.equivalence
    }
  }
);
var wrap = (inner, annotations) => {
  const preprocess = annotations.preprocess ?? ((input) => input);
  const parser = (before) => (typeParameters) => {
    const codec = Schema.make(
      typeParameters[0] ?? inner.ast
    );
    return (input, _ast, parseOptions) => SchemaParser.decodeUnknownEffect(codec)(
      before(input),
      parseOptions
    );
  };
  const declaration = {
    expected: annotations.expected,
    representation: {
      id: annotations.id,
      payload: annotations.payload ?? null
    },
    toCode: ({ typeParameters }) => annotations.code(typeParameters),
    // Arbitraries and equivalences come from the wrapped codec.
    toCodecArbitrary: ({ typeParameters: [type] }) => annotations.arbitrary?.() ?? Schema.link()(type, {
      decode: identityGetter(),
      encode: identityGetter()
    }),
    toEquivalence: ([innerEquivalence]) => annotations.equivalence ?? innerEquivalence
  };
  return Schema.make(
    new SchemaAST.Declaration(
      [inner.ast],
      parser(preprocess),
      declaration,
      void 0,
      void 0,
      void 0,
      void 0,
      parser((input) => input)
    )
  );
};
var identityGetter = () => SchemaGetter.transform((value) => value);
var isPlainObject = (value) => {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

// src/int.ts
var INT64_MIN = -(2n ** 63n);
var INT64_MAX = 2n ** 63n - 1n;
var beyondSafe = (value) => `integer ${value} is outside the safe JavaScript range \xB1(2^53 - 1); SurrealDB int is 64-bit, so use the "bigint" int profile (Int64) for this field`;
var parseSafeInt = (input) => {
  if (typeof input === "number") {
    if (Number.isSafeInteger(input)) return ok(input);
    if (Number.isInteger(input)) return invalid(beyondSafe(input));
    return invalid(`${input} is not an integer`);
  }
  if (typeof input === "bigint") return invalid(beyondSafe(input));
  return wrongType;
};
var Int = leaf({
  id: "effect-surrealkit/Int",
  expected: "a safe integer (SurrealDB int)",
  code: runtimeCode("Int", "number"),
  parse: parseSafeInt,
  arbitrary: (constraint) => Schema2.link()(
    constrained(
      Schema2.Number.check(
        Schema2.isInt(),
        Schema2.isBetween({
          minimum: Number.MIN_SAFE_INTEGER,
          maximum: Number.MAX_SAFE_INTEGER
        })
      ),
      constraint
    ),
    {
      decode: SchemaGetter2.transform((n) => n),
      encode: SchemaGetter2.transform((n) => n)
    }
  )
});
var outsideInt64 = (value) => `integer ${value} is outside the SurrealDB int range [-2^63, 2^63 - 1]`;
var int64 = (value) => {
  if (value < INT64_MIN || value > INT64_MAX) {
    throw new RangeError(outsideInt64(value));
  }
  return value;
};
var parseInt64 = (input) => {
  if (typeof input === "bigint") {
    if (input < INT64_MIN || input > INT64_MAX) {
      return invalid(outsideInt64(input));
    }
    return ok(input);
  }
  if (typeof input === "number") {
    if (!Number.isInteger(input))
      return invalid(`${input} is not an integer`);
    if (Number.isSafeInteger(input) || input === 2 ** 53) {
      return ok(BigInt(input));
    }
    return invalid(
      `integer ${input} arrived as a JS number beyond \xB1(2^53 - 1), so its exact value is unknown (surrealdb.js 2.1.1 decodes -(2^53 + 1) as -2^53); select it as a bigint-producing value or use a string projection`
    );
  }
  return wrongType;
};
var Int64 = leaf({
  id: "effect-surrealkit/Int64",
  expected: "a signed 64-bit integer (SurrealDB int)",
  code: runtimeCode("Int64", "SurrealSchema.Int64"),
  parse: parseInt64,
  arbitrary: (constraint) => Schema2.link()(
    constrained(
      Schema2.BigInt.check(
        Schema2.isBetweenBigInt({
          minimum: INT64_MIN,
          maximum: INT64_MAX
        })
      ),
      constraint
    ),
    {
      decode: SchemaGetter2.transform((n) => n),
      encode: SchemaGetter2.transform((n) => n)
    }
  )
});
var Int64Literal = (value) => {
  const expectedValue = int64(BigInt(value));
  return leaf({
    id: "effect-surrealkit/Int64Literal",
    payload: value,
    expected: `the int ${value}`,
    code: runtimeCode(
      `Int64Literal(${JSON.stringify(value)})`,
      "SurrealSchema.Int64"
    ),
    parse: (input) => {
      const parsed = parseInt64(input);
      if (!parsed.ok) return parsed;
      return parsed.value === expectedValue ? parsed : wrongType;
    },
    arbitrary: () => Schema2.link()(Schema2.Literal(value), {
      decode: SchemaGetter2.transform(() => expectedValue),
      encode: SchemaGetter2.transform(() => value)
    })
  });
};
var intFor = (profile) => profile === "bigint" ? Int64 : Int;

// src/collections.ts
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
  return Schema3.declareConstructor()(
    [item],
    ([itemCodec]) => (input, ast, parseOptions) => {
      if (!(input instanceof Set)) {
        return Effect2.fail(
          new SchemaIssue2.InvalidType(ast, input, parseOptions)
        );
      }
      const elements = [...input];
      return Effect2.flatMap(
        Effect2.forEach(
          elements,
          (element, index) => Effect2.mapError(
            SchemaParser2.decodeUnknownEffect(itemCodec)(
              element,
              parseOptions
            ),
            (issue) => new SchemaIssue2.Composite(
              ast,
              [new SchemaIssue2.Pointer([index], issue)],
              input,
              parseOptions
            )
          )
        ),
        (decoded) => {
          const duplicate = duplicateIndex(elements, equality);
          if (duplicate !== -1) {
            return Effect2.fail(
              new SchemaIssue2.InvalidValue(
                {
                  message: `set element ${duplicate} duplicates an earlier element; SurrealDB sets hold distinct values`
                },
                input,
                parseOptions
              )
            );
          }
          if (length !== void 0 && decoded.length !== length) {
            return Effect2.fail(
              new SchemaIssue2.InvalidValue(
                {
                  message: `expected a set of exactly ${length} elements, got ${decoded.length}`
                },
                input,
                parseOptions
              )
            );
          }
          return Effect2.succeed(
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
      toCodecArbitrary: ({ typeParameters: [itemType] }) => Schema3.link()(
        Schema3.Array(itemType).check(
          length === void 0 ? Schema3.isMaxLength(8) : Schema3.isBetweenLength(length, length)
        ),
        {
          decode: SchemaGetter3.transform(
            (values) => new Set(values)
          ),
          encode: SchemaGetter3.transform((set) => [...set])
        }
      )
    }
  );
};
var boundSource = Schema3.Union([
  Schema3.Struct({ included: Schema3.Boolean, value: Int }),
  Schema3.Undefined
]);
var toBound = (source) => source === void 0 ? void 0 : source.included ? new BoundIncluded(source.value) : new BoundExcluded(source.value);
var isBound = (bound) => bound === void 0 || bound instanceof BoundIncluded || bound instanceof BoundExcluded;
var Range = leaf({
  id: "effect-surrealkit/Range",
  expected: "a SurrealDB range",
  code: runtimeCode("Range", "Surreal.Range<unknown, unknown>"),
  parse: (input) => input instanceof SdkRange && isBound(input.begin) && isBound(input.end) ? ok(input) : wrongType,
  equivalence: (self, that) => self.equals(that),
  arbitrary: () => Schema3.link()(
    Schema3.Tuple([boundSource, boundSource]),
    {
      decode: SchemaGetter3.transform(
        ([begin, end]) => new SdkRange(toBound(begin), toBound(end))
      ),
      encode: SchemaGetter3.forbidden(
        () => "range arbitraries only generate values"
      )
    }
  )
});

// src/decimal.ts
import { Schema as Schema4, SchemaGetter as SchemaGetter4 } from "effect";
import { equals as equals2, Decimal as SdkDecimal } from "surrealdb";
var DECIMAL_MAX_MANTISSA = 2n ** 96n - 1n;
var DECIMAL_MAX_SCALE = 28;
var DECIMAL_GRAMMAR = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/;
var DECIMAL_MAX_DIGITS = DECIMAL_MAX_MANTISSA.toString().length;
var CANONICAL = /^(-?)(\d+)(?:\.(\d+))?$/;
var decimalRangeError = (value) => {
  const text = value.toString();
  const match = CANONICAL.exec(text);
  if (match === null) return `decimal ${text} is not a plain decimal`;
  const fraction = match[3] ?? "";
  if (fraction.length > DECIMAL_MAX_SCALE) {
    return `decimal ${text} has ${fraction.length} fractional digits; SurrealDB keeps at most ${DECIMAL_MAX_SCALE} and would round the rest away`;
  }
  if (BigInt(`${match[2]}${fraction}`) > DECIMAL_MAX_MANTISSA) {
    return `decimal ${text} exceeds the SurrealDB decimal range (96-bit mantissa)`;
  }
  return void 0;
};
var parseDecimal = (input) => {
  if (!(input instanceof SdkDecimal)) return wrongType;
  const error = decimalRangeError(input);
  return error === void 0 ? ok(input) : invalid(error);
};
var decimalFromString = (text) => {
  const match = DECIMAL_GRAMMAR.exec(text);
  const intDigits = match?.[2] ?? "";
  const fracDigits = match?.[3] ?? "";
  if (match === null || intDigits === "" && fracDigits === "") {
    throw new RangeError(`${quote(text)} is not a decimal number`);
  }
  const negative = match[1] === "-";
  const exponent = Number(match[4] ?? "0");
  const outOfRange = () => new RangeError(
    `decimal ${quote(text)} exceeds the SurrealDB decimal range (96-bit mantissa, at most ${DECIMAL_MAX_SCALE} fractional digits)`
  );
  if (!Number.isSafeInteger(exponent)) throw outOfRange();
  let digits = `${intDigits}${fracDigits}`.replace(/^0+/, "");
  let scale = fracDigits.length - exponent;
  if (digits === "") return new SdkDecimal([0n, 0n, 0]);
  while (scale > 0 && digits.endsWith("0")) {
    digits = digits.slice(0, -1);
    scale -= 1;
  }
  if (scale > DECIMAL_MAX_SCALE) {
    throw new RangeError(
      `decimal ${quote(text)} has ${scale} fractional digits; SurrealDB keeps at most ${DECIMAL_MAX_SCALE} and would round the rest away`
    );
  }
  if (digits.length - Math.min(scale, 0) > DECIMAL_MAX_DIGITS)
    throw outOfRange();
  if (scale < 0) {
    digits = `${digits}${"0".repeat(-scale)}`;
    scale = 0;
  }
  const mantissa = BigInt(digits);
  if (mantissa > DECIMAL_MAX_MANTISSA) throw outOfRange();
  const unit = 10n ** BigInt(scale);
  const sign = negative ? -1n : 1n;
  const value = new SdkDecimal([
    sign * (mantissa / unit),
    sign * (mantissa % unit),
    scale
  ]);
  const error = decimalRangeError(value);
  if (error !== void 0) throw new RangeError(error);
  return value;
};
var decimalArbitrary = () => Schema4.link()(
  Schema4.Tuple([
    Schema4.BigInt.check(
      Schema4.isBetweenBigInt({
        minimum: -DECIMAL_MAX_MANTISSA,
        maximum: DECIMAL_MAX_MANTISSA
      })
    ),
    Schema4.Number.check(
      Schema4.isInt(),
      Schema4.isBetween({ minimum: 0, maximum: DECIMAL_MAX_SCALE })
    )
  ]),
  {
    decode: SchemaGetter4.transform(([mantissa, scale]) => {
      const negative = mantissa < 0n;
      const digits = (negative ? -mantissa : mantissa).toString().padStart(scale + 1, "0");
      const cut = digits.length - scale;
      const text = scale === 0 ? digits : `${digits.slice(0, cut)}.${digits.slice(cut)}`;
      return new SdkDecimal(`${negative ? "-" : ""}${text}`);
    }),
    encode: SchemaGetter4.transform((value) => {
      const match = CANONICAL.exec(value.toString());
      const fraction = match?.[3] ?? "";
      const mantissa = BigInt(
        `${match?.[1] ?? ""}${match?.[2] ?? "0"}${fraction}`
      );
      return [mantissa, fraction.length];
    })
  }
);
var Decimal = leaf({
  id: "effect-surrealkit/Decimal",
  expected: "a SurrealDB Decimal",
  code: runtimeCode("Decimal", "Surreal.Decimal"),
  parse: parseDecimal,
  equivalence: (self, that) => self.equals(that),
  arbitrary: decimalArbitrary
});
var DecimalLiteral = (value) => {
  const expected = decimalFromString(value);
  return leaf({
    id: "effect-surrealkit/DecimalLiteral",
    payload: value,
    expected: `the decimal ${value}`,
    code: runtimeCode(`DecimalLiteral(${quote(value)})`, "Surreal.Decimal"),
    parse: (input) => {
      const parsed = parseDecimal(input);
      if (!parsed.ok) return parsed;
      return parsed.value.equals(expected) ? parsed : wrongType;
    },
    equivalence: (self, that) => self.equals(that),
    arbitrary: () => Schema4.link()(Schema4.Literal(value), {
      decode: SchemaGetter4.transform(() => decimalFromString(value)),
      encode: SchemaGetter4.transform(() => value)
    })
  });
};
var SurrealNumber = leaf({
  id: "effect-surrealkit/SurrealNumber",
  expected: "a SurrealDB number (int, float or decimal)",
  code: runtimeCode("SurrealNumber", "number | bigint | Surreal.Decimal"),
  parse: (input) => {
    if (typeof input === "number") return ok(input);
    if (typeof input === "bigint") {
      return input < INT64_MIN || input > INT64_MAX ? invalid(`integer ${input} is outside the SurrealDB int range`) : ok(input);
    }
    return parseDecimal(input);
  },
  // SDK equality: an integral value may come back as `number` or `bigint`.
  equivalence: (self, that) => equals2(self, that),
  arbitrary: () => Schema4.link()(
    Schema4.Union([
      Schema4.Finite,
      Schema4.BigInt.check(
        Schema4.isBetweenBigInt({
          minimum: INT64_MIN,
          maximum: INT64_MAX
        })
      )
    ]),
    {
      decode: SchemaGetter4.transform((n) => n),
      encode: SchemaGetter4.transform(
        (n) => n instanceof SdkDecimal ? n.toFloat() : n
      )
    }
  )
});

// src/geometry.ts
import { Schema as Schema5, SchemaGetter as SchemaGetter5 } from "effect";
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
var coordinate = Schema5.Finite.check(
  Schema5.isBetween({ minimum: -180, maximum: 180 })
);
var point = (x, y) => new SdkGeometryPoint([x, y]);
var pairs = (min, max) => Schema5.Array(Schema5.Tuple([coordinate, coordinate])).check(
  Schema5.isBetweenLength(min, max)
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
    arbitrary: () => Schema5.link()(
      pairs(minimumPairs[first], minimumPairs[first] + 3),
      {
        decode: SchemaGetter5.transform(
          (list) => build[first](list)
        ),
        encode: SchemaGetter5.forbidden(
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
import { Effect as Effect4, Schema as Schema9, SchemaIssue as SchemaIssue4, SchemaTransformation as SchemaTransformation3 } from "effect";
import {
  equals as equals4,
  Duration as SdkDuration2,
  Geometry as SdkGeometry2,
  Table as SdkTable2,
  Uuid as SdkUuid3,
  TextCodec,
  toSurrealqlString
} from "surrealdb";

// src/record-id.ts
import {
  Effect as Effect3,
  Schema as Schema7,
  SchemaGetter as SchemaGetter7,
  SchemaIssue as SchemaIssue3,
  SchemaParser as SchemaParser3,
  SchemaTransformation
} from "effect";
import {
  equals as equals3,
  FileRef as SdkFileRef,
  RecordId as SdkRecordId,
  Table as SdkTable,
  Uuid as SdkUuid2
} from "surrealdb";

// src/scalars.ts
import { Schema as Schema6, SchemaGetter as SchemaGetter6 } from "effect";
import { Uuid as SdkUuid } from "surrealdb";
var byte = Schema6.Number.check(
  Schema6.isInt(),
  Schema6.isBetween({ minimum: 0, maximum: 255 })
);
var LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
var toWellFormed = (text) => text.replace(new RegExp(LONE_SURROGATE.source, "g"), "\uFFFD");
var SurrealString = leaf({
  id: "effect-surrealkit/String",
  expected: "a string",
  code: runtimeCode("String", "string"),
  parse: (input) => {
    if (typeof input !== "string") return wrongType;
    return LONE_SURROGATE.test(input) ? invalid(
      "string contains a lone UTF-16 surrogate, which SurrealDB (UTF-8) cannot store; it would be replaced with U+FFFD"
    ) : ok(input);
  },
  arbitrary: (constraint) => Schema6.link()(constrained(Schema6.String, constraint), {
    decode: SchemaGetter6.transform(toWellFormed),
    encode: SchemaGetter6.transform((text) => text)
  })
});
var Uuid = leaf({
  id: "effect-surrealkit/Uuid",
  expected: "a SurrealDB Uuid",
  code: runtimeCode("Uuid", "Surreal.Uuid"),
  parse: (input) => input instanceof SdkUuid ? ok(input) : wrongType,
  equivalence: (self, that) => self.equals(that),
  arbitrary: () => Schema6.link()(
    Schema6.Array(byte).check(Schema6.isBetweenLength(16, 16)),
    {
      decode: SchemaGetter6.transform(
        (bytes) => new SdkUuid(Uint8Array.from(bytes))
      ),
      encode: SchemaGetter6.transform((uuid) => [
        ...uuid.toUint8Array()
      ])
    }
  )
});
var sameBytes = (self, that) => self.length === that.length && self.every((b, i) => b === that[i]);
var Bytes = leaf({
  id: "effect-surrealkit/Bytes",
  expected: "bytes (Uint8Array or ArrayBuffer)",
  code: runtimeCode("Bytes", "Uint8Array"),
  parse: (input) => {
    if (input instanceof Uint8Array) return ok(input);
    if (input instanceof ArrayBuffer) return ok(new Uint8Array(input));
    return wrongType;
  },
  equivalence: sameBytes,
  arbitrary: () => Schema6.link()(
    Schema6.Array(byte).check(Schema6.isMaxLength(64)),
    {
      decode: SchemaGetter6.transform(
        (bytes) => Uint8Array.from(bytes)
      ),
      encode: SchemaGetter6.transform((bytes) => [...bytes])
    }
  )
});
var unsupportedReason = {
  regex: "regex values have no CBOR transport in SurrealDB 3.x; project the field to a string (`<string> field`) and use a string schema",
  function: "closures are not storable or transportable values; call functions through their signatures instead"
};
var Unsupported = (kind) => leaf({
  id: "effect-surrealkit/Unsupported",
  payload: kind,
  expected: `a ${kind} value (unsupported)`,
  code: runtimeCode(`Unsupported(${quote(kind)})`, "never"),
  parse: () => invalid(
    unsupportedReason[kind] ?? `the SurrealDB kind \`${kind}\` has no SDK value representation`
  )
});

// src/record-id.ts
var isRecordKey = (key) => typeof key === "string" || typeof key === "number" && Number.isInteger(key) || typeof key === "bigint" || key instanceof SdkUuid2 || Array.isArray(key) || isPlainObject(key);
var EMPTY_KEY = "an empty string is not a valid record id key (SurrealDB rejects it)";
var RecordKey = leaf({
  id: "effect-surrealkit/RecordKey",
  expected: "a record id key (string, integer, bigint, Uuid, array or object)",
  code: runtimeCode("RecordKey", "Surreal.RecordIdValue"),
  parse: (input) => input === "" ? invalid(EMPTY_KEY) : isRecordKey(input) ? ok(input) : wrongType,
  equivalence: equals3,
  arbitrary: () => Schema7.link()(
    Schema7.Union([Schema7.String.check(Schema7.isMinLength(1)), Int]),
    {
      decode: SchemaGetter7.transform(
        (key) => typeof key === "string" ? toWellFormed(key) : key
      ),
      encode: SchemaGetter7.transform(
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
  return equals3(a, b);
};
var tableMismatch = (expected, actual) => `expected a record id of table \`${expected}\`, got one of table \`${actual}\``;
var makeRecordIdFor = (table2, key, keyCode, typeCode) => Schema7.declareConstructor()(
  [key],
  ([keyCodec]) => (input, ast, options) => {
    if (!(input instanceof SdkRecordId)) {
      return Effect3.fail(
        new SchemaIssue3.InvalidType(ast, input, options)
      );
    }
    if (input.id === "") {
      return Effect3.fail(
        new SchemaIssue3.InvalidValue(
          { message: EMPTY_KEY },
          input,
          options
        )
      );
    }
    if (input.table.name !== table2) {
      return Effect3.fail(
        new SchemaIssue3.InvalidValue(
          { message: tableMismatch(table2, input.table.name) },
          input,
          options
        )
      );
    }
    return Effect3.flatMapEager(
      Effect3.mapErrorEager(
        SchemaParser3.decodeUnknownEffect(keyCodec)(input.id, {
          ...options,
          onExcessProperty: "error"
        }),
        (issue) => new SchemaIssue3.Composite(
          ast,
          [new SchemaIssue3.Pointer(["id"], issue)],
          input,
          options
        )
      ),
      (decoded) => {
        if (decoded === input.id)
          return Effect3.succeed(input);
        return sameKey(decoded, input.id) ? Effect3.succeed(
          new SdkRecordId(
            table2,
            decoded
          )
        ) : Effect3.fail(
          new SchemaIssue3.InvalidValue(
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
    toEquivalence: () => equals3,
    toCodecArbitrary: ({ typeParameters: [keyType] }) => Schema7.link()(keyType, {
      // An empty string is never a valid key; generate one that is.
      decode: SchemaGetter7.transform(
        (k) => new SdkRecordId(
          table2,
          k === "" ? "a" : k
        )
      ),
      encode: SchemaGetter7.transform(
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
  equivalence: equals3,
  arbitrary: () => Schema7.link()(
    Schema7.Tuple([
      Schema7.String.check(Schema7.isPattern(/^[a-z_][a-z0-9_]*$/)),
      Schema7.String.check(Schema7.isMinLength(1))
    ]),
    {
      decode: SchemaGetter7.transform(
        ([tb, key]) => new SdkRecordId(tb, toWellFormed(key))
      ),
      encode: SchemaGetter7.transform(
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
  arbitrary: () => Schema7.link()(
    tables.length === 0 ? Schema7.String.check(
      Schema7.isPattern(/^[a-z_][a-z0-9_]*$/)
    ) : Schema7.Literals(tables),
    {
      decode: SchemaGetter7.transform(
        (name) => new SdkTable(name)
      ),
      encode: SchemaGetter7.transform((table2) => table2.name)
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
  arbitrary: () => Schema7.link()(
    Schema7.Tuple([
      buckets.length === 0 ? Schema7.String.check(
        Schema7.isPattern(/^[a-z_][a-z0-9_]*$/)
      ) : Schema7.Literals(buckets),
      Schema7.String.check(Schema7.isPattern(/^\/[a-z0-9_./-]*$/))
    ]),
    {
      decode: SchemaGetter7.transform(
        ([bucket, key]) => new SdkFileRef(bucket, key)
      ),
      encode: SchemaGetter7.transform(
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
    (table2) => Schema7.TaggedStruct(table2, {
      id: Schema7.toType(ids[table2])
    })
  );
  const inner = Schema7.Union(idSchemas).pipe(
    Schema7.decodeTo(
      Schema7.Union(tagged),
      SchemaTransformation.transformEffect({
        // The union in front of this transformation only lets record ids
        // of the listed tables through.
        decode: (id) => Effect3.succeed({
          _tag: id.table.name,
          id
        }),
        encode: (value) => {
          const table2 = value.id.table.name;
          return table2 === value._tag ? Effect3.succeed(value.id) : Effect3.fail(
            new SchemaIssue3.InvalidValue({
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
    equivalence: (self, that) => self._tag === that._tag && equals3(self.id, that.id)
  });
};

// src/temporal.ts
import {
  DateTime as EffectDateTime,
  Schema as Schema8,
  SchemaGetter as SchemaGetter8,
  SchemaTransformation as SchemaTransformation2
} from "effect";
import { DateTime as SdkDateTime, Duration as SdkDuration } from "surrealdb";
var DATETIME_MIN_SECONDS = -8334601228800n;
var DATETIME_MAX_SECONDS = 8210266876799n;
var NANOS_PER_SECOND = 1000000000n;
var compactDateTime = (value) => {
  const [seconds = 0n, nanos = 0n] = value.toCompact();
  return [seconds, nanos];
};
var parseDateTime = (input) => {
  if (!(input instanceof SdkDateTime)) return wrongType;
  const [seconds, nanos] = compactDateTime(input);
  if (nanos < 0n || nanos >= NANOS_PER_SECOND) {
    return invalid(`datetime has an invalid nanosecond part ${nanos}`);
  }
  if (seconds < DATETIME_MIN_SECONDS || seconds > DATETIME_MAX_SECONDS) {
    return invalid(
      `datetime ${seconds}s since the epoch is outside the SurrealDB datetime range (-262143-01-01 to +262142-12-31)`
    );
  }
  return ok(input);
};
var datetimeArbitrarySource = Schema8.Tuple([
  // 1900-01-01 … 2100-01-01, plus the full nanosecond range.
  Schema8.BigInt.check(
    Schema8.isBetweenBigInt({
      minimum: -2208988800n,
      maximum: 4102444800n
    })
  ),
  Schema8.BigInt.check(
    Schema8.isBetweenBigInt({ minimum: 0n, maximum: 999999999n })
  )
]);
var DateTime = leaf({
  id: "effect-surrealkit/DateTime",
  expected: "a SurrealDB DateTime",
  code: runtimeCode("DateTime", "Surreal.DateTime"),
  parse: parseDateTime,
  equivalence: (self, that) => self.equals(that),
  arbitrary: () => Schema8.link()(datetimeArbitrarySource, {
    decode: SchemaGetter8.transform(
      ([s, ns]) => new SdkDateTime([s, ns])
    ),
    encode: SchemaGetter8.transform((dt) => compactDateTime(dt))
  })
});
var DATETIME_TEXT = /^([+-]\d{6}|\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}:\d{2})$/;
var dateTimeFromString = (text) => {
  const match = DATETIME_TEXT.exec(text);
  if (match === null) {
    throw new RangeError(`${quote(text)} is not an RFC 3339 datetime`);
  }
  const [
    ,
    year,
    month,
    day,
    hour,
    minute,
    second,
    fraction = "",
    zone = "Z"
  ] = match;
  const date = /* @__PURE__ */ new Date(0);
  date.setUTCFullYear(Number(year), Number(month) - 1, Number(day));
  date.setUTCHours(Number(hour), Number(minute), Number(second), 0);
  if (Number.isNaN(date.getTime()) || date.getUTCDate() !== Number(day) || date.getUTCMonth() !== Number(month) - 1 || date.getUTCHours() !== Number(hour) || date.getUTCMinutes() !== Number(minute) || date.getUTCSeconds() !== Number(second)) {
    throw new RangeError(`${quote(text)} is not a valid calendar datetime`);
  }
  let seconds = BigInt(date.getTime() / 1e3);
  if (zone !== "Z") {
    const sign = zone.startsWith("-") ? -1n : 1n;
    const offset = BigInt(
      Number(zone.slice(1, 3)) * 3600 + Number(zone.slice(4, 6)) * 60
    );
    seconds -= sign * offset;
  }
  return new SdkDateTime([seconds, BigInt(fraction.padEnd(9, "0"))]);
};
var pad = (value, width) => String(value).padStart(width, "0");
var dateTimeToString = (value) => {
  const [seconds, nanos] = compactDateTime(value);
  const date = new Date(Number(seconds) * 1e3);
  const year = date.getUTCFullYear();
  const yearText = year >= 0 && year <= 9999 ? pad(year, 4) : `${year < 0 ? "-" : "+"}${pad(Math.abs(year), 6)}`;
  const fraction = nanos === 0n ? "" : `.${pad(Number(nanos), 9).replace(/0+$/, "")}`;
  return `${yearText}-${pad(date.getUTCMonth() + 1, 2)}-${pad(date.getUTCDate(), 2)}T${pad(date.getUTCHours(), 2)}:${pad(date.getUTCMinutes(), 2)}:${pad(date.getUTCSeconds(), 2)}${fraction}Z`;
};
var floorDiv = (n, d) => {
  const q = n / d;
  return n % d !== 0n && n < 0n !== d < 0n ? q - 1n : q;
};
var DateTimeEffect = wrap(
  DateTime.pipe(
    Schema8.decodeTo(
      Schema8.DateTimeUtc,
      SchemaTransformation2.transform({
        decode: (dt) => EffectDateTime.makeUnsafe(
          Number(floorDiv(dt.nanoseconds, 1000000n))
        ),
        // Built from a normalised tuple: the SDK's own millisecond
        // constructors produce a negative nanosecond part before 1970.
        encode: (utc) => {
          const millis = BigInt(EffectDateTime.toEpochMillis(utc));
          const seconds = floorDiv(millis, 1000n);
          return new SdkDateTime([
            seconds,
            (millis - seconds * 1000n) * 1000000n
          ]);
        }
      })
    )
  ),
  {
    id: "effect-surrealkit/DateTimeEffect",
    expected: "a SurrealDB DateTime (as Effect DateTime.Utc, millisecond precision)",
    code: () => ({
      ...runtimeCode("DateTimeEffect", "DateTime.Utc"),
      importDeclarations: [
        ...runtimeCode("", "").importDeclarations,
        'import type { DateTime } from "effect"'
      ]
    }),
    equivalence: (self, that) => EffectDateTime.toEpochMillis(self) === EffectDateTime.toEpochMillis(that),
    // Effect's own arbitrary spans ±275,760 years, beyond SurrealDB's range.
    arbitrary: () => Schema8.link()(
      Schema8.Number.check(
        Schema8.isInt(),
        Schema8.isBetween({
          minimum: -22089888e5,
          maximum: 41024448e5
        })
      ),
      {
        decode: SchemaGetter8.transform(
          (millis) => EffectDateTime.makeUnsafe(millis)
        ),
        encode: SchemaGetter8.transform(
          (utc) => EffectDateTime.toEpochMillis(utc)
        )
      }
    )
  }
);
var DURATION_MAX_SECONDS = 2n ** 64n - 1n;
var compactDuration = (value) => {
  const [seconds = 0n, nanos = 0n] = value.toCompact();
  return [seconds, nanos];
};
var parseDuration = (input) => {
  if (!(input instanceof SdkDuration)) return wrongType;
  const total = input.nanoseconds;
  if (total < 0n) {
    return invalid(
      `duration of ${total}ns is negative; SurrealDB durations are non-negative and surrealdb.js 2.1.1 silently sends a negative one as 0ns`
    );
  }
  if (total / NANOS_PER_SECOND > DURATION_MAX_SECONDS) {
    return invalid(
      `duration ${input} exceeds the SurrealDB duration range`
    );
  }
  return ok(input);
};
var Duration = leaf({
  id: "effect-surrealkit/Duration",
  expected: "a SurrealDB Duration",
  code: runtimeCode("Duration", "Surreal.Duration"),
  parse: parseDuration,
  equivalence: (self, that) => self.equals(that),
  arbitrary: () => Schema8.link()(
    Schema8.Tuple([
      Schema8.BigInt.check(
        Schema8.isBetweenBigInt({
          minimum: 0n,
          maximum: 10n ** 12n
        })
      ),
      Schema8.BigInt.check(
        Schema8.isBetweenBigInt({
          minimum: 0n,
          maximum: 999999999n
        })
      )
    ]),
    {
      decode: SchemaGetter8.transform(
        ([s, ns]) => new SdkDuration([s, ns])
      ),
      encode: SchemaGetter8.transform((d) => compactDuration(d))
    }
  )
});
var DurationLiteral = (value) => {
  const expected = new SdkDuration(value);
  return leaf({
    id: "effect-surrealkit/DurationLiteral",
    payload: value,
    expected: `the duration ${value}`,
    code: runtimeCode(
      `DurationLiteral(${quote(value)})`,
      "Surreal.Duration"
    ),
    parse: (input) => {
      const parsed = parseDuration(input);
      if (!parsed.ok) return parsed;
      return parsed.value.equals(expected) ? parsed : wrongType;
    },
    equivalence: (self, that) => self.equals(that),
    arbitrary: () => Schema8.link()(Schema8.Literal(value), {
      decode: SchemaGetter8.transform(() => new SdkDuration(value)),
      encode: SchemaGetter8.transform(() => value)
    })
  });
};

// src/json.ts
var failWith = (message) => Effect4.fail(new SchemaIssue4.InvalidValue({ message }));
var attempt = (f) => Effect4.suspend(() => {
  try {
    return Effect4.succeed(f());
  } catch (error) {
    return failWith(
      error instanceof Error ? error.message : String(error)
    );
  }
});
var fromString = (target, name, options) => wrap(
  Schema9.String.pipe(
    Schema9.decodeTo(
      target,
      SchemaTransformation3.transformEffect({
        decode: (text) => attempt(() => options.decode(text)),
        encode: (value) => Effect4.succeed(options.encode(value))
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
    return new SdkDuration2(text);
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
    return new SdkUuid3(text);
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
  Schema9.String.pipe(
    Schema9.decodeTo(
      RecordIdFor(table2),
      SchemaTransformation3.transformEffect({
        decode: (text) => attempt(
          () => recordIdFromText(text)
        ),
        encode: (value) => Effect4.succeed(value.toString())
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
  Schema9.Union([Schema9.Number, Schema9.String]).pipe(
    Schema9.decodeTo(
      Int64,
      SchemaTransformation3.transformEffect({
        decode: (input) => {
          if (typeof input === "number") {
            return Number.isSafeInteger(input) ? Effect4.succeed(input) : failWith(
              `JSON number ${input} is not a safe integer; send ints beyond \xB1(2^53 - 1) as text`
            );
          }
          if (!INT_TEXT.test(input))
            return failWith(`${quote(input)} is not an integer`);
          const value = BigInt(input);
          return value < INT64_MIN || value > INT64_MAX ? failWith(
            `integer ${input} is outside the SurrealDB int range`
          ) : Effect4.succeed(value);
        },
        encode: (value) => Effect4.succeed(
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
var byte2 = Schema9.Number.check(
  Schema9.isInt(),
  Schema9.isBetween({ minimum: 0, maximum: 255 })
);
var BytesFromJson = wrap(
  Schema9.Array(byte2).pipe(
    Schema9.decodeTo(
      Bytes,
      SchemaTransformation3.transform({
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
  Schema9.String.pipe(
    Schema9.decodeTo(
      target,
      SchemaTransformation3.transformEffect({
        decode: (text) => attempt(() => options.decode(text)),
        encode: (value) => Effect4.succeed(options.encode(value))
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
var RecordIdFromJsonAs = (id) => wrap(RecordIdAnyFromJson.pipe(Schema9.decodeTo(id)), {
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
var GeoJson = Schema9.Record(Schema9.String, Schema9.Unknown);
var GeometryFromJson = (geometry) => wrap(
  GeoJson.pipe(
    Schema9.decodeTo(
      geometry,
      SchemaTransformation3.transformEffect({
        decode: (json) => attempt(
          () => SdkGeometry2.fromJSON(
            json
          )
        ),
        encode: (value) => Effect4.succeed(
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
  Schema9.Union([Schema9.Number, Schema9.String]).pipe(
    Schema9.decodeTo(
      SurrealNumber,
      SchemaTransformation3.transformEffect({
        decode: (input) => typeof input === "number" ? Effect4.succeed(input) : attempt(() => decimalFromString(input)),
        encode: (value) => Effect4.succeed(
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
  DateTimeFromJson.pipe(Schema9.decodeTo(DateTimeEffect)),
  {
    id: "effect-surrealkit/DateTimeEffectFromJson",
    expected: "an RFC 3339 datetime string",
    code: () => runtimeCode("DateTimeEffectFromJson", "DateTime.Utc")
  }
);
var SetFromJson = (item, options = {}) => wrap(
  Schema9.Array(item).pipe(
    Schema9.decodeTo(
      SetOf(Schema9.toType(item), options),
      SchemaTransformation3.transformEffect({
        // Check before `new Set` silently drops primitive duplicates.
        decode: (values) => {
          const duplicate = values.findIndex(
            (value, index) => values.slice(0, index).some((earlier) => equals4(earlier, value))
          );
          return duplicate === -1 ? Effect4.succeed(new Set(values)) : failWith(
            `set element ${duplicate} duplicates an earlier element; SurrealDB sets hold distinct values`
          );
        },
        encode: (set) => Effect4.succeed([...set])
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

// src/row.ts
var stripNone = (value) => {
  if (value instanceof Set) {
    let changed2 = false;
    const next2 = /* @__PURE__ */ new Set();
    for (const element of value) {
      const stripped = stripNone(element);
      if (stripped !== element) changed2 = true;
      next2.add(stripped);
    }
    return changed2 ? next2 : value;
  }
  if (Array.isArray(value)) {
    let changed2 = false;
    const next2 = value.map((element) => {
      const stripped = stripNone(element);
      if (stripped !== element) changed2 = true;
      return stripped;
    });
    return changed2 ? next2 : value;
  }
  if (!isPlainObject(value)) return value;
  let changed = false;
  const next = {};
  for (const [key, element] of Object.entries(value)) {
    if (element === void 0) {
      changed = true;
      continue;
    }
    const stripped = stripNone(element);
    if (stripped !== element) changed = true;
    next[key] = stripped;
  }
  return changed ? next : value;
};
var NoneAsAbsent = (schema) => wrap(schema, {
  id: "effect-surrealkit/NoneAsAbsent",
  expected: "a SurrealDB row",
  preprocess: stripNone,
  code: ([inner]) => runtimeCode(
    `NoneAsAbsent(${inner?.runtime ?? ""})`,
    inner?.Type ?? "unknown"
  )
});

// src/table.ts
import { Schema as Schema10 } from "effect";
var table = (descriptor) => descriptor;
var view = (descriptor) => descriptor;
var edge = (descriptor) => descriptor;
var fn = (descriptor) => descriptor;
var withPresence = (schema, presence) => {
  switch (presence) {
    case "required":
      return schema;
    case "optional":
      return Schema10.optionalKey(schema);
    case "removable":
    case "resettable":
      return Schema10.optional(schema);
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
  const rebuilt = Schema10.Struct(fields);
  return isStructWithRest(row) ? Schema10.StructWithRest(rebuilt, row.records) : rebuilt;
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
  SurrealNumber,
  SurrealNumberFromJson,
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