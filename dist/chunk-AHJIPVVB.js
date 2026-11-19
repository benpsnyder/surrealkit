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

// src/decimal.ts
import { Schema as Schema3, SchemaGetter as SchemaGetter3 } from "effect";
import { equals, Decimal as SdkDecimal } from "surrealdb";
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
var decimalArbitrary = () => Schema3.link()(
  Schema3.Tuple([
    Schema3.BigInt.check(
      Schema3.isBetweenBigInt({
        minimum: -DECIMAL_MAX_MANTISSA,
        maximum: DECIMAL_MAX_MANTISSA
      })
    ),
    Schema3.Number.check(
      Schema3.isInt(),
      Schema3.isBetween({ minimum: 0, maximum: DECIMAL_MAX_SCALE })
    )
  ]),
  {
    decode: SchemaGetter3.transform(([mantissa, scale]) => {
      const negative = mantissa < 0n;
      const digits = (negative ? -mantissa : mantissa).toString().padStart(scale + 1, "0");
      const cut = digits.length - scale;
      const text = scale === 0 ? digits : `${digits.slice(0, cut)}.${digits.slice(cut)}`;
      return new SdkDecimal(`${negative ? "-" : ""}${text}`);
    }),
    encode: SchemaGetter3.transform((value) => {
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
    arbitrary: () => Schema3.link()(Schema3.Literal(value), {
      decode: SchemaGetter3.transform(() => decimalFromString(value)),
      encode: SchemaGetter3.transform(() => value)
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
  equivalence: (self, that) => equals(self, that),
  arbitrary: () => Schema3.link()(
    Schema3.Union([
      Schema3.Finite,
      Schema3.BigInt.check(
        Schema3.isBetweenBigInt({
          minimum: INT64_MIN,
          maximum: INT64_MAX
        })
      )
    ]),
    {
      decode: SchemaGetter3.transform((n) => n),
      encode: SchemaGetter3.transform(
        (n) => n instanceof SdkDecimal ? n.toFloat() : n
      )
    }
  )
});

// src/scalars.ts
import { Order, Schema as Schema4, SchemaGetter as SchemaGetter4 } from "effect";
import { Uuid as SdkUuid } from "surrealdb";
var byte = Schema4.Number.check(
  Schema4.isInt(),
  Schema4.isBetween({ minimum: 0, maximum: 255 })
);
var LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
var LONE_SURROGATES = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;
var toWellFormed = (text) => text.replace(LONE_SURROGATES, "\uFFFD");
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
  arbitrary: (constraint) => Schema4.link()(constrained(Schema4.String, constraint), {
    decode: SchemaGetter4.transform(toWellFormed),
    encode: SchemaGetter4.transform((text) => text)
  })
});
var Float = leaf({
  id: "effect-surrealkit/Float",
  expected: "a native SurrealDB float (IEEE-754 number)",
  code: runtimeCode("Float", "number"),
  parse: (input) => typeof input === "number" ? ok(input) : wrongType,
  equivalence: Object.is,
  arbitrary: (constraint) => {
    const bounds = constraint && { ...constraint, order: Order.Number };
    return Schema4.link()(constrained(Schema4.Number, bounds), {
      decode: SchemaGetter4.transform((value) => value),
      encode: SchemaGetter4.transform((value) => value)
    });
  }
});
var Uuid = leaf({
  id: "effect-surrealkit/Uuid",
  expected: "a SurrealDB Uuid",
  code: runtimeCode("Uuid", "Surreal.Uuid"),
  parse: (input) => input instanceof SdkUuid ? ok(input) : wrongType,
  equivalence: (self, that) => self.equals(that),
  arbitrary: () => Schema4.link()(
    Schema4.Array(byte).check(Schema4.isBetweenLength(16, 16)),
    {
      decode: SchemaGetter4.transform(
        (bytes) => new SdkUuid(Uint8Array.from(bytes))
      ),
      encode: SchemaGetter4.transform((uuid) => [
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
  arbitrary: () => Schema4.link()(
    Schema4.Array(byte).check(Schema4.isMaxLength(64)),
    {
      decode: SchemaGetter4.transform(
        (bytes) => Uint8Array.from(bytes)
      ),
      encode: SchemaGetter4.transform((bytes) => [...bytes])
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

// src/temporal.ts
import {
  DateTime as EffectDateTime,
  Schema as Schema5,
  SchemaGetter as SchemaGetter5,
  SchemaTransformation
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
var datetimeArbitrarySource = Schema5.Tuple([
  // 1900-01-01 … 2100-01-01, plus the full nanosecond range.
  Schema5.BigInt.check(
    Schema5.isBetweenBigInt({
      minimum: -2208988800n,
      maximum: 4102444800n
    })
  ),
  Schema5.BigInt.check(
    Schema5.isBetweenBigInt({ minimum: 0n, maximum: 999999999n })
  )
]);
var DateTime = leaf({
  id: "effect-surrealkit/DateTime",
  expected: "a SurrealDB DateTime",
  code: runtimeCode("DateTime", "Surreal.DateTime"),
  parse: parseDateTime,
  equivalence: (self, that) => self.equals(that),
  arbitrary: () => Schema5.link()(datetimeArbitrarySource, {
    decode: SchemaGetter5.transform(
      ([s, ns]) => new SdkDateTime([s, ns])
    ),
    encode: SchemaGetter5.transform((dt) => compactDateTime(dt))
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
    Schema5.decodeTo(
      Schema5.DateTimeUtc,
      SchemaTransformation.transform({
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
    arbitrary: () => Schema5.link()(
      Schema5.Number.check(
        Schema5.isInt(),
        Schema5.isBetween({
          minimum: -22089888e5,
          maximum: 41024448e5
        })
      ),
      {
        decode: SchemaGetter5.transform(
          (millis) => EffectDateTime.makeUnsafe(millis)
        ),
        encode: SchemaGetter5.transform(
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
  arbitrary: () => Schema5.link()(
    Schema5.Tuple([
      Schema5.BigInt.check(
        Schema5.isBetweenBigInt({
          minimum: 0n,
          maximum: 10n ** 12n
        })
      ),
      Schema5.BigInt.check(
        Schema5.isBetweenBigInt({
          minimum: 0n,
          maximum: 999999999n
        })
      )
    ]),
    {
      decode: SchemaGetter5.transform(
        ([s, ns]) => new SdkDuration([s, ns])
      ),
      encode: SchemaGetter5.transform((d) => compactDuration(d))
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
    arbitrary: () => Schema5.link()(Schema5.Literal(value), {
      decode: SchemaGetter5.transform(() => new SdkDuration(value)),
      encode: SchemaGetter5.transform(() => value)
    })
  });
};

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

export {
  quote,
  quoteList,
  literalUnion,
  codeOf,
  runtimeCode,
  ok,
  wrongType,
  invalid,
  leaf,
  wrap,
  isPlainObject,
  INT64_MIN,
  INT64_MAX,
  Int,
  int64,
  Int64,
  Int64Literal,
  intFor,
  DECIMAL_MAX_MANTISSA,
  DECIMAL_MAX_SCALE,
  decimalFromString,
  Decimal,
  DecimalLiteral,
  SurrealNumber,
  toWellFormed,
  SurrealString,
  Float,
  Uuid,
  Bytes,
  Unsupported,
  DATETIME_MIN_SECONDS,
  DATETIME_MAX_SECONDS,
  DateTime,
  dateTimeFromString,
  dateTimeToString,
  DateTimeEffect,
  DURATION_MAX_SECONDS,
  Duration,
  DurationLiteral,
  stripNone,
  NoneAsAbsent
};
//# sourceMappingURL=chunk-AHJIPVVB.js.map