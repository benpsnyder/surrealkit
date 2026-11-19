import {
  FloatOrDecimal,
  holdsDecimal
} from "./chunk-O3PDOYWY.js";
import {
  Geometry,
  Range,
  RecordIdAny,
  SurrealValue
} from "./chunk-F4HWMI2D.js";
import {
  Level,
  codecOf,
  derive,
  isExpr,
  literal,
  makeExpr,
  operand,
  orNone,
  sqlOf
} from "./chunk-ZWM5V4DS.js";
import {
  Bytes,
  DateTime,
  Decimal,
  Duration,
  Float,
  Int,
  Int64,
  SurrealNumber,
  SurrealString,
  Uuid
} from "./chunk-PHSAVORF.js";
import {
  __export
} from "./chunk-PZ5AY32C.js";

// src/functions/generated/array.ts
var array_exports = {};
__export(array_exports, {
  add: () => add,
  all: () => all,
  any: () => any,
  append: () => append,
  at: () => at,
  booleanAnd: () => booleanAnd,
  booleanNot: () => booleanNot,
  booleanOr: () => booleanOr,
  booleanXor: () => booleanXor,
  clump: () => clump,
  combine: () => combine,
  complement: () => complement,
  concat: () => concat,
  difference: () => difference,
  distinct: () => distinct,
  every: () => every,
  fill: () => fill,
  filter: () => filter,
  filterIndex: () => filterIndex,
  find: () => find,
  findIndex: () => findIndex,
  first: () => first,
  flatten: () => flatten,
  group: () => group,
  includes: () => includes,
  indexOf: () => indexOf,
  insert: () => insert,
  intersect: () => intersect,
  isEmpty: () => isEmpty,
  join: () => join,
  last: () => last,
  len: () => len,
  logicalAnd: () => logicalAnd,
  logicalOr: () => logicalOr,
  logicalXor: () => logicalXor,
  matches: () => matches,
  max: () => max,
  min: () => min,
  pop: () => pop,
  prepend: () => prepend,
  push: () => push,
  range: () => range,
  remove: () => remove,
  repeat: () => repeat,
  reverse: () => reverse,
  sequence: () => sequence,
  shuffle: () => shuffle,
  slice: () => slice,
  some: () => some,
  sort: () => sort,
  sortAsc: () => sortAsc,
  sortDesc: () => sortDesc,
  sortLexical: () => sortLexical,
  sortNatural: () => sortNatural,
  sortNaturalLexical: () => sortNaturalLexical,
  swap: () => swap,
  transpose: () => transpose,
  union: () => union,
  windows: () => windows
});

// src/functions/internal.ts
import { Schema } from "effect";
var AnyCodec = /* @__PURE__ */ Schema.UndefinedOr(SurrealValue);
var ObjectCodec = /* @__PURE__ */ Schema.Record(
  Schema.String,
  SurrealValue
);
var ArrayCodec = /* @__PURE__ */ Schema.Array(AnyCodec);
var Derived = class {
  constructor(derive2) {
    this.derive = derive2;
  }
  derive;
};
var argCodec = (args, index, fallback) => {
  const arg = args[index];
  return isExpr(arg) ? codecOf(arg) : fallback;
};
var same = (index, fallback) => new Derived((args) => argCodec(args, index, fallback));
var item = (index, fallback) => new Derived((args) => {
  const codec = argCodec(args, index, fallback);
  return "value" in codec && Schema.isSchema(codec.value) ? orNone(codec.value) : AnyCodec;
});
var typedItem = (codec) => {
  if (codec.ast._tag !== "Arrays" || !("value" in codec)) return void 0;
  const element = codec.value;
  if (!Schema.isSchema(element)) return void 0;
  const { ast } = element;
  const open = ast._tag === "Unknown" || ast._tag === "Any" || ast === SurrealValue.ast || ast._tag === "Union" && ast.types.includes(SurrealValue.ast);
  return open ? void 0 : element;
};
var items = (index, fallback) => new Derived((args) => {
  const given = args.slice(index);
  const elements = [];
  for (const arg of given) {
    const element = isExpr(arg) ? typedItem(codecOf(arg)) : void 0;
    if (element === void 0) return fallback;
    if (!elements.includes(element)) elements.push(element);
  }
  const [only, ...others] = elements;
  if (only === void 0) return fallback;
  if (given.length === 1) return codecOf(given[0]);
  return Schema.Array(
    others.length === 0 ? only : Schema.Union(elements)
  );
});
var mayHoldDecimal = (arg) => isExpr(arg) ? holdsDecimal(codecOf(arg)) : Array.isArray(arg) && arg.some(mayHoldDecimal);
var floatOrDecimal = (indices) => new Derived(
  (args) => indices.some((index) => mayHoldDecimal(args[index])) ? FloatOrDecimal : Float
);
var lift = (value) => {
  if (isExpr(value)) return value;
  if (Array.isArray(value)) {
    const items2 = value.map((element) => sqlOf(lift(element)));
    return makeExpr(ArrayCodec, `[ ${items2.join(", ")} ]`, {}, Level.atom);
  }
  return literal(value);
};
var apply = (name, result, required, args, rest = []) => {
  let count = args.length;
  while (count > required && args[count - 1] === void 0) count--;
  const given = [...args.slice(0, count), ...rest];
  const values2 = given.map(lift);
  return derive(
    result instanceof Derived ? result.derive(given) : result,
    `${name}(${values2.map(operand).join(", ")})`,
    Level.atom,
    values2
  );
};
var constant = (name, codec) => makeExpr(codec, name, {}, Level.atom);

// src/functions/generated/codecs.ts
import { Schema as Schema2 } from "effect";
var BoolCodec = Schema2.Boolean;
var BytesCodec = Bytes;
var DateTimeCodec = DateTime;
var DecimalCodec = Decimal;
var DurationCodec = Duration;
var FloatCodec = Float;
var GeometryCodec = Geometry;
var Int64Codec = Int64;
var IntCodec = Int;
var NumberCodec = SurrealNumber;
var RangeCodec = Range;
var RecordCodec = RecordIdAny;
var StringCodec = SurrealString;
var UuidCodec = Uuid;
var ArrayOfArrayCodec = /* @__PURE__ */ Schema2.Array(ArrayCodec);
var ArrayOfBoolCodec = /* @__PURE__ */ Schema2.Array(BoolCodec);
var ArrayOfDateTimeCodec = /* @__PURE__ */ Schema2.Array(DateTimeCodec);
var ArrayOfIntCodec = /* @__PURE__ */ Schema2.Array(IntCodec);
var ArrayOfNumberCodec = /* @__PURE__ */ Schema2.Array(NumberCodec);
var ArrayOfObjectCodec = /* @__PURE__ */ Schema2.Array(ObjectCodec);
var ArrayOfStringCodec = /* @__PURE__ */ Schema2.Array(StringCodec);
var OptionOfIntCodec = /* @__PURE__ */ Schema2.UndefinedOr(IntCodec);
var OptionOfNumberCodec = /* @__PURE__ */ Schema2.UndefinedOr(NumberCodec);
var OptionOfStringCodec = /* @__PURE__ */ Schema2.UndefinedOr(StringCodec);
var OptionOfArrayOfNumberCodec = /* @__PURE__ */ Schema2.UndefinedOr(ArrayOfNumberCodec);

// src/functions/generated/array.ts
var add = (array2, value) => apply("array::add", ArrayCodec, 2, [array2, value]);
var all = (array2, predicate) => apply("array::all", BoolCodec, 1, [array2, predicate]);
var any = (array2, predicate) => apply("array::any", BoolCodec, 1, [array2, predicate]);
var append = (array2, value) => apply("array::append", ArrayCodec, 2, [array2, value]);
var at = (array2, index) => apply("array::at", item(0, ArrayCodec), 2, [array2, index]);
var booleanAnd = (left, right) => apply("array::boolean_and", ArrayOfBoolCodec, 2, [left, right]);
var booleanNot = (array2) => apply("array::boolean_not", ArrayOfBoolCodec, 1, [array2]);
var booleanOr = (left, right) => apply("array::boolean_or", ArrayOfBoolCodec, 2, [left, right]);
var booleanXor = (left, right) => apply("array::boolean_xor", ArrayOfBoolCodec, 2, [left, right]);
var clump = (array2, size) => apply("array::clump", ArrayOfArrayCodec, 2, [array2, size]);
var combine = (left, right) => apply("array::combine", ArrayOfArrayCodec, 2, [left, right]);
var complement = (left, right) => apply("array::complement", same(0, ArrayCodec), 2, [left, right]);
var concat = (...arrays) => apply("array::concat", items(0, ArrayCodec), 0, [], arrays);
var difference = (left, right) => apply("array::difference", ArrayCodec, 2, [left, right]);
var distinct = (array2) => apply("array::distinct", same(0, ArrayCodec), 1, [array2]);
var every = (array2, predicate) => apply("array::every", BoolCodec, 1, [array2, predicate]);
var fill = (array2, value, start, end) => apply("array::fill", ArrayCodec, 2, [array2, value, start, end]);
var filter = (array2, predicate) => apply("array::filter", same(0, ArrayCodec), 2, [array2, predicate]);
var filterIndex = (array2, predicate) => apply("array::filter_index", ArrayOfIntCodec, 2, [array2, predicate]);
var find = (array2, predicate) => apply("array::find", item(0, ArrayCodec), 2, [array2, predicate]);
var findIndex = (array2, predicate) => apply("array::find_index", OptionOfIntCodec, 2, [array2, predicate]);
var first = (array2) => apply("array::first", item(0, ArrayCodec), 1, [array2]);
var flatten = (array2) => apply("array::flatten", ArrayCodec, 1, [array2]);
var group = (array2) => apply("array::group", ArrayCodec, 1, [array2]);
var includes = (array2, value) => apply("array::includes", BoolCodec, 1, [array2, value]);
var indexOf = (array2, value) => apply("array::index_of", OptionOfIntCodec, 2, [array2, value]);
var insert = (array2, value, index) => apply("array::insert", ArrayCodec, 2, [array2, value, index]);
var intersect = (left, right) => apply("array::intersect", same(0, ArrayCodec), 2, [left, right]);
var isEmpty = (array2) => apply("array::is_empty", BoolCodec, 1, [array2]);
var join = (array2, separator) => apply("array::join", StringCodec, 2, [array2, separator]);
var last = (array2) => apply("array::last", item(0, ArrayCodec), 1, [array2]);
var len = (array2) => apply("array::len", IntCodec, 1, [array2]);
var logicalAnd = (left, right) => apply("array::logical_and", ArrayCodec, 2, [left, right]);
var logicalOr = (left, right) => apply("array::logical_or", ArrayCodec, 2, [left, right]);
var logicalXor = (left, right) => apply("array::logical_xor", ArrayCodec, 2, [left, right]);
var matches = (array2, value) => apply("array::matches", ArrayOfBoolCodec, 2, [array2, value]);
var max = (array2) => apply("array::max", item(0, ArrayCodec), 1, [array2]);
var min = (array2) => apply("array::min", item(0, ArrayCodec), 1, [array2]);
var pop = (array2) => apply("array::pop", item(0, ArrayCodec), 1, [array2]);
var prepend = (array2, value) => apply("array::prepend", ArrayCodec, 2, [array2, value]);
var push = (array2, value) => apply("array::push", ArrayCodec, 2, [array2, value]);
var range = (start, count) => apply("array::range", ArrayOfIntCodec, 1, [start, count]);
var remove = (array2, index) => apply("array::remove", same(0, ArrayCodec), 2, [array2, index]);
var repeat = (value, count) => apply("array::repeat", ArrayCodec, 2, [value, count]);
var reverse = (array2) => apply("array::reverse", same(0, ArrayCodec), 1, [array2]);
var sequence = (start, count) => apply("array::sequence", ArrayOfIntCodec, 1, [start, count]);
var shuffle = (array2) => apply("array::shuffle", same(0, ArrayCodec), 1, [array2]);
var slice = (array2, start, length) => apply("array::slice", same(0, ArrayCodec), 1, [array2, start, length]);
var some = (array2, predicate) => apply("array::some", BoolCodec, 1, [array2, predicate]);
var sort = (array2, order) => apply("array::sort", same(0, ArrayCodec), 1, [array2, order]);
var sortAsc = (array2) => apply("array::sort::asc", same(0, ArrayCodec), 1, [array2]);
var sortDesc = (array2) => apply("array::sort::desc", same(0, ArrayCodec), 1, [array2]);
var sortLexical = (array2, order) => apply("array::sort_lexical", same(0, ArrayCodec), 1, [array2, order]);
var sortNatural = (array2, order) => apply("array::sort_natural", same(0, ArrayCodec), 1, [array2, order]);
var sortNaturalLexical = (array2, order) => apply("array::sort_natural_lexical", same(0, ArrayCodec), 1, [
  array2,
  order
]);
var swap = (array2, from, to) => apply("array::swap", same(0, ArrayCodec), 3, [array2, from, to]);
var transpose = (array2) => apply("array::transpose", ArrayOfArrayCodec, 1, [array2]);
var union = (left, right) => apply("array::union", ArrayCodec, 2, [left, right]);
var windows = (array2, size) => apply("array::windows", ArrayOfArrayCodec, 2, [array2, size]);

// src/functions/generated/bytes.ts
var bytes_exports = {};
__export(bytes_exports, {
  len: () => len2
});
var len2 = (bytes2) => apply("bytes::len", IntCodec, 1, [bytes2]);

// src/functions/generated/crypto.ts
var crypto_exports = {};
__export(crypto_exports, {
  argon2Compare: () => argon2Compare,
  argon2Generate: () => argon2Generate,
  bcryptCompare: () => bcryptCompare,
  bcryptGenerate: () => bcryptGenerate,
  blake3: () => blake3,
  joaat: () => joaat,
  md5: () => md5,
  pbkdf2Compare: () => pbkdf2Compare,
  pbkdf2Generate: () => pbkdf2Generate,
  scryptCompare: () => scryptCompare,
  scryptGenerate: () => scryptGenerate,
  sha1: () => sha1,
  sha256: () => sha256,
  sha512: () => sha512
});
var argon2Compare = (hash, password) => apply("crypto::argon2::compare", BoolCodec, 2, [hash, password]);
var argon2Generate = (password) => apply("crypto::argon2::generate", StringCodec, 1, [password]);
var bcryptCompare = (hash, password) => apply("crypto::bcrypt::compare", BoolCodec, 2, [hash, password]);
var bcryptGenerate = (password) => apply("crypto::bcrypt::generate", StringCodec, 1, [password]);
var blake3 = (value) => apply("crypto::blake3", StringCodec, 1, [value]);
var joaat = (value) => apply("crypto::joaat", IntCodec, 1, [value]);
var md5 = (value) => apply("crypto::md5", StringCodec, 1, [value]);
var pbkdf2Compare = (hash, password) => apply("crypto::pbkdf2::compare", BoolCodec, 2, [hash, password]);
var pbkdf2Generate = (password) => apply("crypto::pbkdf2::generate", StringCodec, 1, [password]);
var scryptCompare = (hash, password) => apply("crypto::scrypt::compare", BoolCodec, 2, [hash, password]);
var scryptGenerate = (password) => apply("crypto::scrypt::generate", StringCodec, 1, [password]);
var sha1 = (value) => apply("crypto::sha1", StringCodec, 1, [value]);
var sha256 = (value) => apply("crypto::sha256", StringCodec, 1, [value]);
var sha512 = (value) => apply("crypto::sha512", StringCodec, 1, [value]);

// src/functions/generated/duration.ts
var duration_exports = {};
__export(duration_exports, {
  days: () => days,
  fromDays: () => fromDays,
  fromHours: () => fromHours,
  fromMicros: () => fromMicros,
  fromMillis: () => fromMillis,
  fromMins: () => fromMins,
  fromNanos: () => fromNanos,
  fromSecs: () => fromSecs,
  fromWeeks: () => fromWeeks,
  hours: () => hours,
  max: () => max2,
  micros: () => micros,
  millis: () => millis,
  mins: () => mins,
  nanos: () => nanos,
  secs: () => secs,
  weeks: () => weeks,
  years: () => years
});
var days = (duration3) => apply("duration::days", IntCodec, 1, [duration3]);
var fromDays = (days2) => apply("duration::from_days", DurationCodec, 1, [days2]);
var fromHours = (hours2) => apply("duration::from_hours", DurationCodec, 1, [hours2]);
var fromMicros = (micros3) => apply("duration::from_micros", DurationCodec, 1, [micros3]);
var fromMillis = (millis3) => apply("duration::from_millis", DurationCodec, 1, [millis3]);
var fromMins = (mins2) => apply("duration::from_mins", DurationCodec, 1, [mins2]);
var fromNanos = (nanos2) => apply("duration::from_nanos", DurationCodec, 1, [nanos2]);
var fromSecs = (secs2) => apply("duration::from_secs", DurationCodec, 1, [secs2]);
var fromWeeks = (weeks2) => apply("duration::from_weeks", DurationCodec, 1, [weeks2]);
var hours = (duration3) => apply("duration::hours", IntCodec, 1, [duration3]);
var max2 = /* @__PURE__ */ constant("duration::max", DurationCodec);
var micros = (duration3) => apply("duration::micros", IntCodec, 1, [duration3]);
var millis = (duration3) => apply("duration::millis", IntCodec, 1, [duration3]);
var mins = (duration3) => apply("duration::mins", IntCodec, 1, [duration3]);
var nanos = (duration3) => apply("duration::nanos", Int64Codec, 1, [duration3]);
var secs = (duration3) => apply("duration::secs", IntCodec, 1, [duration3]);
var weeks = (duration3) => apply("duration::weeks", IntCodec, 1, [duration3]);
var years = (duration3) => apply("duration::years", IntCodec, 1, [duration3]);

// src/functions/generated/encoding.ts
var encoding_exports = {};
__export(encoding_exports, {
  base64Decode: () => base64Decode,
  base64Encode: () => base64Encode,
  cborDecode: () => cborDecode,
  cborEncode: () => cborEncode,
  jsonDecode: () => jsonDecode,
  jsonEncode: () => jsonEncode
});
var base64Decode = (text) => apply("encoding::base64::decode", BytesCodec, 1, [text]);
var base64Encode = (bytes2, padded) => apply("encoding::base64::encode", StringCodec, 1, [bytes2, padded]);
var cborDecode = (bytes2) => apply("encoding::cbor::decode", AnyCodec, 1, [bytes2]);
var cborEncode = (value) => apply("encoding::cbor::encode", BytesCodec, 1, [value]);
var jsonDecode = (text) => apply("encoding::json::decode", AnyCodec, 1, [text]);
var jsonEncode = (value) => apply("encoding::json::encode", StringCodec, 1, [value]);

// src/functions/generated/geo.ts
var geo_exports = {};
__export(geo_exports, {
  area: () => area,
  bearing: () => bearing,
  centroid: () => centroid,
  distance: () => distance,
  hashDecode: () => hashDecode,
  hashEncode: () => hashEncode,
  isValid: () => isValid
});
var area = (geometry2) => apply("geo::area", FloatCodec, 1, [geometry2]);
var bearing = (from, to) => apply("geo::bearing", FloatCodec, 2, [from, to]);
var centroid = (geometry2) => apply("geo::centroid", GeometryCodec, 1, [geometry2]);
var distance = (from, to) => apply("geo::distance", FloatCodec, 2, [from, to]);
var hashDecode = (hash) => apply("geo::hash::decode", GeometryCodec, 1, [hash]);
var hashEncode = (point2, length) => apply("geo::hash::encode", StringCodec, 1, [point2, length]);
var isValid = (geometry2) => apply("geo::is_valid", BoolCodec, 1, [geometry2]);

// src/functions/generated/math.ts
var math_exports = {};
__export(math_exports, {
  abs: () => abs,
  acos: () => acos,
  acot: () => acot,
  asin: () => asin,
  atan: () => atan,
  bottom: () => bottom,
  ceil: () => ceil,
  clamp: () => clamp,
  cos: () => cos,
  cot: () => cot,
  deg2rad: () => deg2rad,
  e: () => e,
  fixed: () => fixed,
  floor: () => floor,
  frac1Pi: () => frac1Pi,
  frac1Sqrt2: () => frac1Sqrt2,
  frac2Pi: () => frac2Pi,
  frac2SqrtPi: () => frac2SqrtPi,
  fracPi2: () => fracPi2,
  fracPi3: () => fracPi3,
  fracPi4: () => fracPi4,
  fracPi6: () => fracPi6,
  fracPi8: () => fracPi8,
  inf: () => inf,
  interquartile: () => interquartile,
  lerp: () => lerp,
  lerpangle: () => lerpangle,
  ln: () => ln,
  ln10: () => ln10,
  ln2: () => ln2,
  log: () => log,
  log10: () => log10,
  log10E: () => log10E,
  log10_2: () => log10_2,
  log2: () => log2,
  log2E: () => log2E,
  log2_10: () => log2_10,
  max: () => max3,
  mean: () => mean,
  median: () => median,
  midhinge: () => midhinge,
  min: () => min2,
  mode: () => mode,
  nearestrank: () => nearestrank,
  negInf: () => negInf,
  percentile: () => percentile,
  pi: () => pi,
  pow: () => pow,
  product: () => product,
  rad2deg: () => rad2deg,
  round: () => round,
  sign: () => sign,
  sin: () => sin,
  spread: () => spread,
  sqrt: () => sqrt,
  sqrt2: () => sqrt2,
  stddev: () => stddev,
  sum: () => sum,
  tan: () => tan,
  tau: () => tau,
  top: () => top,
  trimean: () => trimean,
  variance: () => variance
});
var abs = (value) => apply("math::abs", NumberCodec, 1, [value]);
var acos = (value) => apply("math::acos", FloatCodec, 1, [value]);
var acot = (value) => apply("math::acot", FloatCodec, 1, [value]);
var asin = (value) => apply("math::asin", FloatCodec, 1, [value]);
var atan = (value) => apply("math::atan", FloatCodec, 1, [value]);
var bottom = (values2, count) => apply("math::bottom", ArrayOfNumberCodec, 2, [values2, count]);
var ceil = (value) => apply("math::ceil", NumberCodec, 1, [value]);
var clamp = (value, min4, max5) => apply("math::clamp", NumberCodec, 3, [value, min4, max5]);
var cos = (value) => apply("math::cos", FloatCodec, 1, [value]);
var cot = (value) => apply("math::cot", FloatCodec, 1, [value]);
var deg2rad = (value) => apply("math::deg2rad", FloatCodec, 1, [value]);
var e = /* @__PURE__ */ constant(
  "math::e",
  FloatCodec
);
var fixed = (value, places) => apply("math::fixed", NumberCodec, 2, [value, places]);
var floor = (value) => apply("math::floor", NumberCodec, 1, [value]);
var frac1Pi = /* @__PURE__ */ constant("math::frac_1_pi", FloatCodec);
var frac1Sqrt2 = /* @__PURE__ */ constant("math::frac_1_sqrt_2", FloatCodec);
var frac2Pi = /* @__PURE__ */ constant("math::frac_2_pi", FloatCodec);
var frac2SqrtPi = /* @__PURE__ */ constant("math::frac_2_sqrt_pi", FloatCodec);
var fracPi2 = /* @__PURE__ */ constant("math::frac_pi_2", FloatCodec);
var fracPi3 = /* @__PURE__ */ constant("math::frac_pi_3", FloatCodec);
var fracPi4 = /* @__PURE__ */ constant("math::frac_pi_4", FloatCodec);
var fracPi6 = /* @__PURE__ */ constant("math::frac_pi_6", FloatCodec);
var fracPi8 = /* @__PURE__ */ constant("math::frac_pi_8", FloatCodec);
var inf = /* @__PURE__ */ constant(
  "math::inf",
  FloatCodec
);
var interquartile = (values2) => apply("math::interquartile", FloatCodec, 1, [values2]);
var lerp = (from, to, factor) => apply("math::lerp", floatOrDecimal([0, 1, 2]), 3, [from, to, factor]);
var lerpangle = (from, to, factor) => apply("math::lerpangle", floatOrDecimal([0, 1, 2]), 3, [from, to, factor]);
var ln = (value) => apply("math::ln", FloatCodec, 1, [value]);
var ln10 = /* @__PURE__ */ constant(
  "math::ln_10",
  FloatCodec
);
var ln2 = /* @__PURE__ */ constant(
  "math::ln_2",
  FloatCodec
);
var log = (value, base) => apply("math::log", FloatCodec, 2, [value, base]);
var log10 = (value) => apply("math::log10", FloatCodec, 1, [value]);
var log10_2 = /* @__PURE__ */ constant("math::log10_2", FloatCodec);
var log10E = /* @__PURE__ */ constant("math::log10_e", FloatCodec);
var log2 = (value) => apply("math::log2", FloatCodec, 1, [value]);
var log2_10 = /* @__PURE__ */ constant("math::log2_10", FloatCodec);
var log2E = /* @__PURE__ */ constant("math::log2_e", FloatCodec);
var max3 = (values2) => apply("math::max", NumberCodec, 1, [values2]);
var mean = (values2) => apply("math::mean", floatOrDecimal([0]), 1, [values2]);
var median = (values2) => apply("math::median", OptionOfNumberCodec, 1, [values2]);
var midhinge = (values2) => apply("math::midhinge", FloatCodec, 1, [values2]);
var min2 = (values2) => apply("math::min", NumberCodec, 1, [values2]);
var mode = (values2) => apply("math::mode", NumberCodec, 1, [values2]);
var nearestrank = (values2, percentile2) => apply("math::nearestrank", NumberCodec, 2, [values2, percentile2]);
var negInf = /* @__PURE__ */ constant("math::neg_inf", FloatCodec);
var percentile = (values2, percentile2) => apply("math::percentile", FloatCodec, 2, [values2, percentile2]);
var pi = /* @__PURE__ */ constant(
  "math::pi",
  FloatCodec
);
var pow = (base, exponent) => apply("math::pow", NumberCodec, 2, [base, exponent]);
var product = (values2) => apply("math::product", NumberCodec, 1, [values2]);
var rad2deg = (value) => apply("math::rad2deg", FloatCodec, 1, [value]);
var round = (value) => apply("math::round", NumberCodec, 1, [value]);
var sign = (value) => apply("math::sign", NumberCodec, 1, [value]);
var sin = (value) => apply("math::sin", FloatCodec, 1, [value]);
var spread = (values2) => apply("math::spread", NumberCodec, 1, [values2]);
var sqrt = (value) => apply("math::sqrt", floatOrDecimal([0]), 1, [value]);
var sqrt2 = /* @__PURE__ */ constant("math::sqrt_2", FloatCodec);
var stddev = (values2) => apply("math::stddev", floatOrDecimal([0]), 1, [values2]);
var sum = (values2) => apply("math::sum", NumberCodec, 1, [values2]);
var tan = (value) => apply("math::tan", FloatCodec, 1, [value]);
var tau = /* @__PURE__ */ constant(
  "math::tau",
  FloatCodec
);
var top = (values2, count) => apply("math::top", ArrayOfNumberCodec, 2, [values2, count]);
var trimean = (values2) => apply("math::trimean", FloatCodec, 1, [values2]);
var variance = (values2) => apply("math::variance", floatOrDecimal([0]), 1, [values2]);

// src/functions/generated/meta.ts
var meta_exports = {};
__export(meta_exports, {
  id: () => id,
  tb: () => tb
});
var id = (record2) => apply("meta::id", AnyCodec, 1, [record2]);
var tb = (record2) => apply("meta::tb", StringCodec, 1, [record2]);

// src/functions/generated/object.ts
var object_exports = {};
__export(object_exports, {
  entries: () => entries,
  extend: () => extend,
  fromEntries: () => fromEntries,
  isEmpty: () => isEmpty2,
  keys: () => keys,
  len: () => len3,
  remove: () => remove2,
  values: () => values
});
var entries = (object) => apply("object::entries", ArrayOfArrayCodec, 1, [object]);
var extend = (object, other) => apply("object::extend", ObjectCodec, 2, [object, other]);
var fromEntries = (entries2) => apply("object::from_entries", ObjectCodec, 1, [entries2]);
var isEmpty2 = (object) => apply("object::is_empty", BoolCodec, 1, [object]);
var keys = (object) => apply("object::keys", ArrayOfStringCodec, 1, [object]);
var len3 = (object) => apply("object::len", IntCodec, 1, [object]);
var remove2 = (object, keys2) => apply("object::remove", ObjectCodec, 2, [object, keys2]);
var values = (object) => apply("object::values", ArrayCodec, 1, [object]);

// src/functions/generated/parse.ts
var parse_exports = {};
__export(parse_exports, {
  emailHost: () => emailHost,
  emailUser: () => emailUser,
  urlDomain: () => urlDomain,
  urlFragment: () => urlFragment,
  urlHost: () => urlHost,
  urlPath: () => urlPath,
  urlPort: () => urlPort,
  urlQuery: () => urlQuery,
  urlScheme: () => urlScheme
});
var emailHost = (email) => apply("parse::email::host", OptionOfStringCodec, 1, [email]);
var emailUser = (email) => apply("parse::email::user", OptionOfStringCodec, 1, [email]);
var urlDomain = (url) => apply("parse::url::domain", OptionOfStringCodec, 1, [url]);
var urlFragment = (url) => apply("parse::url::fragment", OptionOfStringCodec, 1, [url]);
var urlHost = (url) => apply("parse::url::host", OptionOfStringCodec, 1, [url]);
var urlPath = (url) => apply("parse::url::path", OptionOfStringCodec, 1, [url]);
var urlPort = (url) => apply("parse::url::port", OptionOfIntCodec, 1, [url]);
var urlQuery = (url) => apply("parse::url::query", OptionOfStringCodec, 1, [url]);
var urlScheme = (url) => apply("parse::url::scheme", OptionOfStringCodec, 1, [url]);

// src/functions/generated/rand.ts
var rand_exports = {};
__export(rand_exports, {
  bool: () => bool,
  duration: () => duration,
  enum_: () => enum_,
  float: () => float,
  id: () => id2,
  int: () => int,
  string: () => string,
  time: () => time,
  ulid: () => ulid,
  uuid: () => uuid,
  uuidV4: () => uuidV4,
  uuidV7: () => uuidV7
});
var bool = () => apply("rand::bool", BoolCodec, 0, []);
var duration = (min4, max5) => apply("rand::duration", DurationCodec, 2, [min4, max5]);
var enum_ = (...values2) => apply("rand::enum", AnyCodec, 0, [], values2);
var float = (min4, max5) => apply("rand::float", FloatCodec, 0, [min4, max5]);
var id2 = (length, max5) => apply("rand::id", StringCodec, 0, [length, max5]);
var int = (min4, max5) => apply("rand::int", Int64Codec, 0, [min4, max5]);
var string = (length, max5) => apply("rand::string", StringCodec, 0, [length, max5]);
var time = (min4, max5) => apply("rand::time", DateTimeCodec, 0, [min4, max5]);
var ulid = (time3) => apply("rand::ulid", StringCodec, 0, [time3]);
var uuid = (time3) => apply("rand::uuid", UuidCodec, 0, [time3]);
var uuidV4 = () => apply("rand::uuid::v4", UuidCodec, 0, []);
var uuidV7 = (time3) => apply("rand::uuid::v7", UuidCodec, 0, [time3]);

// src/functions/generated/record.ts
var record_exports = {};
__export(record_exports, {
  exists: () => exists,
  id: () => id3,
  isEdge: () => isEdge,
  table: () => table,
  tb: () => tb2
});
var exists = (record2) => apply("record::exists", BoolCodec, 1, [record2]);
var id3 = (record2) => apply("record::id", AnyCodec, 1, [record2]);
var isEdge = (record2) => apply("record::is_edge", BoolCodec, 1, [record2]);
var table = (record2) => apply("record::table", StringCodec, 1, [record2]);
var tb2 = (record2) => apply("record::tb", StringCodec, 1, [record2]);

// src/functions/generated/search.ts
var search_exports = {};
__export(search_exports, {
  analyze: () => analyze
});
var analyze = (analyzer, text) => apply("search::analyze", ArrayOfStringCodec, 2, [analyzer, text]);

// src/functions/generated/string.ts
var string_exports = {};
__export(string_exports, {
  capitalize: () => capitalize,
  concat: () => concat2,
  contains: () => contains,
  distanceDamerauLevenshtein: () => distanceDamerauLevenshtein,
  distanceHamming: () => distanceHamming,
  distanceLevenshtein: () => distanceLevenshtein,
  distanceNormalizedDamerauLevenshtein: () => distanceNormalizedDamerauLevenshtein,
  distanceNormalizedLevenshtein: () => distanceNormalizedLevenshtein,
  distanceOsa: () => distanceOsa,
  endsWith: () => endsWith,
  htmlEncode: () => htmlEncode,
  htmlSanitize: () => htmlSanitize,
  isAlpha: () => isAlpha,
  isAlphanum: () => isAlphanum,
  isAscii: () => isAscii,
  isDatetime: () => isDatetime,
  isDomain: () => isDomain,
  isEmail: () => isEmail,
  isHexadecimal: () => isHexadecimal,
  isIp: () => isIp,
  isIpv4: () => isIpv4,
  isIpv6: () => isIpv6,
  isLatitude: () => isLatitude,
  isLongitude: () => isLongitude,
  isNumeric: () => isNumeric,
  isRecord: () => isRecord,
  isSemver: () => isSemver,
  isUlid: () => isUlid,
  isUrl: () => isUrl,
  isUuid: () => isUuid,
  join: () => join2,
  len: () => len4,
  lowercase: () => lowercase,
  matches: () => matches2,
  repeat: () => repeat2,
  replace: () => replace,
  reverse: () => reverse2,
  semverCompare: () => semverCompare,
  semverIncMajor: () => semverIncMajor,
  semverIncMinor: () => semverIncMinor,
  semverIncPatch: () => semverIncPatch,
  semverMajor: () => semverMajor,
  semverMinor: () => semverMinor,
  semverPatch: () => semverPatch,
  semverSetMajor: () => semverSetMajor,
  semverSetMinor: () => semverSetMinor,
  semverSetPatch: () => semverSetPatch,
  similarityFuzzy: () => similarityFuzzy,
  similarityJaro: () => similarityJaro,
  similarityJaroWinkler: () => similarityJaroWinkler,
  similaritySmithwaterman: () => similaritySmithwaterman,
  similaritySorensenDice: () => similaritySorensenDice,
  slice: () => slice2,
  slug: () => slug,
  split: () => split,
  startsWith: () => startsWith,
  trim: () => trim,
  uppercase: () => uppercase,
  words: () => words
});
var capitalize = (value) => apply("string::capitalize", StringCodec, 1, [value]);
var concat2 = (...values2) => apply("string::concat", StringCodec, 0, [], values2);
var contains = (value, search) => apply("string::contains", BoolCodec, 2, [value, search]);
var distanceDamerauLevenshtein = (left, right) => apply("string::distance::damerau_levenshtein", IntCodec, 2, [
  left,
  right
]);
var distanceHamming = (left, right) => apply("string::distance::hamming", IntCodec, 2, [left, right]);
var distanceLevenshtein = (left, right) => apply("string::distance::levenshtein", IntCodec, 2, [left, right]);
var distanceNormalizedDamerauLevenshtein = (left, right) => apply("string::distance::normalized_damerau_levenshtein", FloatCodec, 2, [
  left,
  right
]);
var distanceNormalizedLevenshtein = (left, right) => apply("string::distance::normalized_levenshtein", FloatCodec, 2, [
  left,
  right
]);
var distanceOsa = (left, right) => apply("string::distance::osa", IntCodec, 2, [left, right]);
var endsWith = (value, suffix) => apply("string::ends_with", BoolCodec, 2, [value, suffix]);
var htmlEncode = (value) => apply("string::html::encode", StringCodec, 1, [value]);
var htmlSanitize = (value) => apply("string::html::sanitize", StringCodec, 1, [value]);
var isAlpha = (value) => apply("string::is_alpha", BoolCodec, 1, [value]);
var isAlphanum = (value) => apply("string::is_alphanum", BoolCodec, 1, [value]);
var isAscii = (value) => apply("string::is_ascii", BoolCodec, 1, [value]);
var isDatetime = (value, format2) => apply("string::is_datetime", BoolCodec, 1, [value, format2]);
var isDomain = (value) => apply("string::is_domain", BoolCodec, 1, [value]);
var isEmail = (value) => apply("string::is_email", BoolCodec, 1, [value]);
var isHexadecimal = (value) => apply("string::is_hexadecimal", BoolCodec, 1, [value]);
var isIp = (value) => apply("string::is_ip", BoolCodec, 1, [value]);
var isIpv4 = (value) => apply("string::is_ipv4", BoolCodec, 1, [value]);
var isIpv6 = (value) => apply("string::is_ipv6", BoolCodec, 1, [value]);
var isLatitude = (value) => apply("string::is_latitude", BoolCodec, 1, [value]);
var isLongitude = (value) => apply("string::is_longitude", BoolCodec, 1, [value]);
var isNumeric = (value) => apply("string::is_numeric", BoolCodec, 1, [value]);
var isRecord = (value, table3) => apply("string::is_record", BoolCodec, 1, [value, table3]);
var isSemver = (value) => apply("string::is_semver", BoolCodec, 1, [value]);
var isUlid = (value) => apply("string::is_ulid", BoolCodec, 1, [value]);
var isUrl = (value) => apply("string::is_url", BoolCodec, 1, [value]);
var isUuid = (value) => apply("string::is_uuid", BoolCodec, 1, [value]);
var join2 = (separator, ...values2) => apply("string::join", StringCodec, 1, [separator], values2);
var len4 = (value) => apply("string::len", IntCodec, 1, [value]);
var lowercase = (value) => apply("string::lowercase", StringCodec, 1, [value]);
var matches2 = (value, pattern) => apply("string::matches", BoolCodec, 2, [value, pattern]);
var repeat2 = (value, count) => apply("string::repeat", StringCodec, 2, [value, count]);
var replace = (value, search, replacement) => apply("string::replace", StringCodec, 3, [value, search, replacement]);
var reverse2 = (value) => apply("string::reverse", StringCodec, 1, [value]);
var semverCompare = (left, right) => apply("string::semver::compare", IntCodec, 2, [left, right]);
var semverIncMajor = (version) => apply("string::semver::inc::major", StringCodec, 1, [version]);
var semverIncMinor = (version) => apply("string::semver::inc::minor", StringCodec, 1, [version]);
var semverIncPatch = (version) => apply("string::semver::inc::patch", StringCodec, 1, [version]);
var semverMajor = (version) => apply("string::semver::major", IntCodec, 1, [version]);
var semverMinor = (version) => apply("string::semver::minor", IntCodec, 1, [version]);
var semverPatch = (version) => apply("string::semver::patch", IntCodec, 1, [version]);
var semverSetMajor = (version, value) => apply("string::semver::set::major", StringCodec, 2, [version, value]);
var semverSetMinor = (version, value) => apply("string::semver::set::minor", StringCodec, 2, [version, value]);
var semverSetPatch = (version, value) => apply("string::semver::set::patch", StringCodec, 2, [version, value]);
var similarityFuzzy = (left, right) => apply("string::similarity::fuzzy", IntCodec, 2, [left, right]);
var similarityJaro = (left, right) => apply("string::similarity::jaro", FloatCodec, 2, [left, right]);
var similarityJaroWinkler = (left, right) => apply("string::similarity::jaro_winkler", FloatCodec, 2, [left, right]);
var similaritySmithwaterman = (left, right) => apply("string::similarity::smithwaterman", IntCodec, 2, [left, right]);
var similaritySorensenDice = (left, right) => apply("string::similarity::sorensen_dice", FloatCodec, 2, [left, right]);
var slice2 = (value, start, length) => apply("string::slice", StringCodec, 1, [value, start, length]);
var slug = (value) => apply("string::slug", StringCodec, 1, [value]);
var split = (value, separator) => apply("string::split", ArrayOfStringCodec, 2, [value, separator]);
var startsWith = (value, prefix) => apply("string::starts_with", BoolCodec, 2, [value, prefix]);
var trim = (value) => apply("string::trim", StringCodec, 1, [value]);
var uppercase = (value) => apply("string::uppercase", StringCodec, 1, [value]);
var words = (value) => apply("string::words", ArrayOfStringCodec, 1, [value]);

// src/functions/generated/time.ts
var time_exports = {};
__export(time_exports, {
  age: () => age,
  ceil: () => ceil2,
  day: () => day,
  epoch: () => epoch,
  floor: () => floor2,
  format: () => format,
  fromMicros: () => fromMicros2,
  fromMillis: () => fromMillis2,
  fromNanos: () => fromNanos2,
  fromSecs: () => fromSecs2,
  fromUlid: () => fromUlid,
  fromUnix: () => fromUnix,
  fromUuid: () => fromUuid,
  group: () => group2,
  hour: () => hour,
  isLeapYear: () => isLeapYear,
  makeDate: () => makeDate,
  makeTime: () => makeTime,
  makeTimestamp: () => makeTimestamp,
  max: () => max4,
  maximum: () => maximum,
  micros: () => micros2,
  millis: () => millis2,
  min: () => min3,
  minimum: () => minimum,
  minute: () => minute,
  month: () => month,
  nano: () => nano,
  now: () => now,
  round: () => round2,
  second: () => second,
  setDay: () => setDay,
  setHour: () => setHour,
  setMinute: () => setMinute,
  setMonth: () => setMonth,
  setNanosecond: () => setNanosecond,
  setSecond: () => setSecond,
  setYear: () => setYear,
  timezone: () => timezone,
  trunc: () => trunc,
  unix: () => unix,
  wday: () => wday,
  week: () => week,
  yday: () => yday,
  year: () => year
});
var age = (from, to) => apply("time::age", StringCodec, 2, [from, to]);
var ceil2 = (time3, step) => apply("time::ceil", DateTimeCodec, 2, [time3, step]);
var day = (time3) => apply("time::day", IntCodec, 0, [time3]);
var epoch = /* @__PURE__ */ constant("time::epoch", DateTimeCodec);
var floor2 = (time3, step) => apply("time::floor", DateTimeCodec, 2, [time3, step]);
var format = (time3, format2) => apply("time::format", StringCodec, 2, [time3, format2]);
var fromMicros2 = (micros3) => apply("time::from_micros", DateTimeCodec, 1, [micros3]);
var fromMillis2 = (millis3) => apply("time::from_millis", DateTimeCodec, 1, [millis3]);
var fromNanos2 = (nanos2) => apply("time::from_nanos", DateTimeCodec, 1, [nanos2]);
var fromSecs2 = (secs2) => apply("time::from_secs", DateTimeCodec, 1, [secs2]);
var fromUlid = (ulid2) => apply("time::from_ulid", DateTimeCodec, 1, [ulid2]);
var fromUnix = (secs2) => apply("time::from_unix", DateTimeCodec, 1, [secs2]);
var fromUuid = (uuid3) => apply("time::from_uuid", DateTimeCodec, 1, [uuid3]);
var group2 = (time3, unit) => apply("time::group", DateTimeCodec, 2, [time3, unit]);
var hour = (time3) => apply("time::hour", IntCodec, 0, [time3]);
var isLeapYear = (time3) => apply("time::is_leap_year", BoolCodec, 0, [time3]);
var makeDate = (year2, month2, day2) => apply("time::make_date", DateTimeCodec, 3, [year2, month2, day2]);
var makeTime = (hour2, minute2, second2) => apply("time::make_time", DurationCodec, 3, [hour2, minute2, second2]);
var makeTimestamp = (year2, month2, day2, hour2, minute2, second2) => apply("time::make_timestamp", DateTimeCodec, 6, [
  year2,
  month2,
  day2,
  hour2,
  minute2,
  second2
]);
var max4 = (times) => apply("time::max", item(0, ArrayOfDateTimeCodec), 1, [times]);
var maximum = /* @__PURE__ */ constant("time::maximum", DateTimeCodec);
var micros2 = (time3) => apply("time::micros", IntCodec, 0, [time3]);
var millis2 = (time3) => apply("time::millis", IntCodec, 0, [time3]);
var min3 = (times) => apply("time::min", item(0, ArrayOfDateTimeCodec), 1, [times]);
var minimum = /* @__PURE__ */ constant("time::minimum", DateTimeCodec);
var minute = (time3) => apply("time::minute", IntCodec, 0, [time3]);
var month = (time3) => apply("time::month", IntCodec, 0, [time3]);
var nano = (time3) => apply("time::nano", Int64Codec, 0, [time3]);
var now = () => apply("time::now", DateTimeCodec, 0, []);
var round2 = (time3, step) => apply("time::round", DateTimeCodec, 2, [time3, step]);
var second = (time3) => apply("time::second", IntCodec, 0, [time3]);
var setDay = (time3, day2) => apply("time::set_day", DateTimeCodec, 2, [time3, day2]);
var setHour = (time3, hour2) => apply("time::set_hour", DateTimeCodec, 2, [time3, hour2]);
var setMinute = (time3, minute2) => apply("time::set_minute", DateTimeCodec, 2, [time3, minute2]);
var setMonth = (time3, month2) => apply("time::set_month", DateTimeCodec, 2, [time3, month2]);
var setNanosecond = (time3, nanosecond) => apply("time::set_nanosecond", DateTimeCodec, 2, [time3, nanosecond]);
var setSecond = (time3, second2) => apply("time::set_second", DateTimeCodec, 2, [time3, second2]);
var setYear = (time3, year2) => apply("time::set_year", DateTimeCodec, 2, [time3, year2]);
var timezone = () => apply("time::timezone", StringCodec, 0, []);
var trunc = (time3, unit) => apply("time::trunc", DateTimeCodec, 2, [time3, unit]);
var unix = (time3) => apply("time::unix", IntCodec, 0, [time3]);
var wday = (time3) => apply("time::wday", IntCodec, 0, [time3]);
var week = (time3) => apply("time::week", IntCodec, 0, [time3]);
var yday = (time3) => apply("time::yday", IntCodec, 0, [time3]);
var year = (time3) => apply("time::year", IntCodec, 0, [time3]);

// src/functions/generated/type.ts
var type_exports = {};
__export(type_exports, {
  array: () => array,
  bool: () => bool2,
  bytes: () => bytes,
  date: () => date,
  datetime: () => datetime,
  decimal: () => decimal,
  duration: () => duration2,
  f16: () => f16,
  f32: () => f32,
  field: () => field,
  fields: () => fields,
  float: () => float2,
  geometry: () => geometry,
  i16: () => i16,
  i32: () => i32,
  i8: () => i8,
  int: () => int2,
  interval: () => interval,
  isArray: () => isArray,
  isBool: () => isBool,
  isBytes: () => isBytes,
  isCollection: () => isCollection,
  isDate: () => isDate,
  isDatetime: () => isDatetime2,
  isDecimal: () => isDecimal,
  isDuration: () => isDuration,
  isF16: () => isF16,
  isF32: () => isF32,
  isFloat: () => isFloat,
  isGeometry: () => isGeometry,
  isI16: () => isI16,
  isI32: () => isI32,
  isI8: () => isI8,
  isInt: () => isInt,
  isInterval: () => isInterval,
  isLine: () => isLine,
  isMultiline: () => isMultiline,
  isMultipoint: () => isMultipoint,
  isMultipolygon: () => isMultipolygon,
  isNone: () => isNone,
  isNull: () => isNull,
  isNumber: () => isNumber,
  isObject: () => isObject,
  isPoint: () => isPoint,
  isPolygon: () => isPolygon,
  isRange: () => isRange,
  isRecord: () => isRecord2,
  isSet: () => isSet,
  isString: () => isString,
  isTime: () => isTime,
  isTimestamp: () => isTimestamp,
  isU16: () => isU16,
  isU32: () => isU32,
  isU64: () => isU64,
  isU8: () => isU8,
  isUuid: () => isUuid2,
  number: () => number,
  of: () => of,
  point: () => point,
  range: () => range2,
  record: () => record,
  set: () => set,
  string: () => string2,
  stringLossy: () => stringLossy,
  table: () => table2,
  time: () => time2,
  timestamp: () => timestamp,
  u16: () => u16,
  u32: () => u32,
  u64: () => u64,
  u8: () => u8,
  uuid: () => uuid2
});
var array = (value) => apply("type::array", ArrayCodec, 1, [value]);
var bool2 = (value) => apply("type::bool", BoolCodec, 1, [value]);
var bytes = (value) => apply("type::bytes", BytesCodec, 1, [value]);
var date = (value) => apply("type::date", DateTimeCodec, 1, [value]);
var datetime = (value) => apply("type::datetime", DateTimeCodec, 1, [value]);
var decimal = (value) => apply("type::decimal", DecimalCodec, 1, [value]);
var duration2 = (value) => apply("type::duration", DurationCodec, 1, [value]);
var f16 = (value) => apply("type::f16", FloatCodec, 1, [value]);
var f32 = (value) => apply("type::f32", FloatCodec, 1, [value]);
var field = (field2) => apply("type::field", AnyCodec, 1, [field2]);
var fields = (fields2) => apply("type::fields", ArrayCodec, 1, [fields2]);
var float2 = (value) => apply("type::float", FloatCodec, 1, [value]);
var geometry = (value) => apply("type::geometry", GeometryCodec, 1, [value]);
var i16 = (value) => apply("type::i16", IntCodec, 1, [value]);
var i32 = (value) => apply("type::i32", IntCodec, 1, [value]);
var i8 = (value) => apply("type::i8", IntCodec, 1, [value]);
var int2 = (value) => apply("type::int", IntCodec, 1, [value]);
var interval = (value) => apply("type::interval", StringCodec, 1, [value]);
var isArray = (value) => apply("type::is_array", BoolCodec, 1, [value]);
var isBool = (value) => apply("type::is_bool", BoolCodec, 1, [value]);
var isBytes = (value) => apply("type::is_bytes", BoolCodec, 1, [value]);
var isCollection = (value) => apply("type::is_collection", BoolCodec, 1, [value]);
var isDate = (value) => apply("type::is_date", BoolCodec, 1, [value]);
var isDatetime2 = (value) => apply("type::is_datetime", BoolCodec, 1, [value]);
var isDecimal = (value) => apply("type::is_decimal", BoolCodec, 1, [value]);
var isDuration = (value) => apply("type::is_duration", BoolCodec, 1, [value]);
var isF16 = (value) => apply("type::is_f16", BoolCodec, 1, [value]);
var isF32 = (value) => apply("type::is_f32", BoolCodec, 1, [value]);
var isFloat = (value) => apply("type::is_float", BoolCodec, 1, [value]);
var isGeometry = (value) => apply("type::is_geometry", BoolCodec, 1, [value]);
var isI16 = (value) => apply("type::is_i16", BoolCodec, 1, [value]);
var isI32 = (value) => apply("type::is_i32", BoolCodec, 1, [value]);
var isI8 = (value) => apply("type::is_i8", BoolCodec, 1, [value]);
var isInt = (value) => apply("type::is_int", BoolCodec, 1, [value]);
var isInterval = (value) => apply("type::is_interval", BoolCodec, 1, [value]);
var isLine = (value) => apply("type::is_line", BoolCodec, 1, [value]);
var isMultiline = (value) => apply("type::is_multiline", BoolCodec, 1, [value]);
var isMultipoint = (value) => apply("type::is_multipoint", BoolCodec, 1, [value]);
var isMultipolygon = (value) => apply("type::is_multipolygon", BoolCodec, 1, [value]);
var isNone = (value) => apply("type::is_none", BoolCodec, 1, [value]);
var isNull = (value) => apply("type::is_null", BoolCodec, 1, [value]);
var isNumber = (value) => apply("type::is_number", BoolCodec, 1, [value]);
var isObject = (value) => apply("type::is_object", BoolCodec, 1, [value]);
var isPoint = (value) => apply("type::is_point", BoolCodec, 1, [value]);
var isPolygon = (value) => apply("type::is_polygon", BoolCodec, 1, [value]);
var isRange = (value) => apply("type::is_range", BoolCodec, 1, [value]);
var isRecord2 = (value, table3) => apply("type::is_record", BoolCodec, 1, [value, table3]);
var isSet = (value) => apply("type::is_set", BoolCodec, 1, [value]);
var isString = (value) => apply("type::is_string", BoolCodec, 1, [value]);
var isTime = (value) => apply("type::is_time", BoolCodec, 1, [value]);
var isTimestamp = (value) => apply("type::is_timestamp", BoolCodec, 1, [value]);
var isU16 = (value) => apply("type::is_u16", BoolCodec, 1, [value]);
var isU32 = (value) => apply("type::is_u32", BoolCodec, 1, [value]);
var isU64 = (value) => apply("type::is_u64", BoolCodec, 1, [value]);
var isU8 = (value) => apply("type::is_u8", BoolCodec, 1, [value]);
var isUuid2 = (value) => apply("type::is_uuid", BoolCodec, 1, [value]);
var number = (value) => apply("type::number", NumberCodec, 1, [value]);
var of = (value) => apply("type::of", StringCodec, 1, [value]);
var point = (value) => apply("type::point", GeometryCodec, 1, [value]);
var range2 = (value) => apply("type::range", RangeCodec, 1, [value]);
var record = (value, key) => apply("type::record", RecordCodec, 1, [value, key]);
var set = (value) => apply("type::set", AnyCodec, 1, [value]);
var string2 = (value) => apply("type::string", StringCodec, 1, [value]);
var stringLossy = (value) => apply("type::string_lossy", StringCodec, 1, [value]);
var table2 = (value) => apply("type::table", AnyCodec, 1, [value]);
var time2 = (value) => apply("type::time", DurationCodec, 1, [value]);
var timestamp = (value) => apply("type::timestamp", DateTimeCodec, 1, [value]);
var u16 = (value) => apply("type::u16", IntCodec, 1, [value]);
var u32 = (value) => apply("type::u32", IntCodec, 1, [value]);
var u64 = (value) => apply("type::u64", IntCodec, 1, [value]);
var u8 = (value) => apply("type::u8", IntCodec, 1, [value]);
var uuid2 = (value) => apply("type::uuid", UuidCodec, 1, [value]);

// src/functions/generated/value.ts
var value_exports = {};
__export(value_exports, {
  diff: () => diff,
  patch: () => patch
});
var diff = (from, to) => apply("value::diff", ArrayOfObjectCodec, 2, [from, to]);
var patch = (value, patch2) => apply("value::patch", AnyCodec, 2, [value, patch2]);

// src/functions/generated/vector.ts
var vector_exports = {};
__export(vector_exports, {
  add: () => add2,
  angle: () => angle,
  cross: () => cross,
  distanceChebyshev: () => distanceChebyshev,
  distanceCosine: () => distanceCosine,
  distanceEuclidean: () => distanceEuclidean,
  distanceHamming: () => distanceHamming2,
  distanceMahalanobis: () => distanceMahalanobis,
  distanceManhattan: () => distanceManhattan,
  distanceMinkowski: () => distanceMinkowski,
  divide: () => divide,
  dot: () => dot,
  magnitude: () => magnitude,
  multiply: () => multiply,
  normalize: () => normalize,
  project: () => project,
  scale: () => scale,
  similarityCosine: () => similarityCosine,
  similarityJaccard: () => similarityJaccard,
  similarityPearson: () => similarityPearson,
  similaritySpearman: () => similaritySpearman,
  subtract: () => subtract,
  sum: () => sum2
});
var add2 = (left, right) => apply("vector::add", ArrayOfNumberCodec, 2, [left, right]);
var angle = (left, right) => apply("vector::angle", FloatCodec, 2, [left, right]);
var cross = (left, right) => apply("vector::cross", ArrayOfNumberCodec, 2, [left, right]);
var distanceChebyshev = (left, right) => apply("vector::distance::chebyshev", NumberCodec, 2, [left, right]);
var distanceCosine = (left, right) => apply("vector::distance::cosine", floatOrDecimal([0, 1]), 2, [left, right]);
var distanceEuclidean = (left, right) => apply("vector::distance::euclidean", FloatCodec, 2, [left, right]);
var distanceHamming2 = (left, right) => apply("vector::distance::hamming", IntCodec, 2, [left, right]);
var distanceMahalanobis = (left, right, covariance) => apply("vector::distance::mahalanobis", FloatCodec, 3, [
  left,
  right,
  covariance
]);
var distanceManhattan = (left, right) => apply("vector::distance::manhattan", NumberCodec, 2, [left, right]);
var distanceMinkowski = (left, right, order) => apply("vector::distance::minkowski", FloatCodec, 3, [left, right, order]);
var divide = (left, right) => apply("vector::divide", ArrayOfNumberCodec, 2, [left, right]);
var dot = (left, right) => apply("vector::dot", NumberCodec, 2, [left, right]);
var magnitude = (vector) => apply("vector::magnitude", FloatCodec, 1, [vector]);
var multiply = (left, right) => apply("vector::multiply", ArrayOfNumberCodec, 2, [left, right]);
var normalize = (vector) => apply("vector::normalize", ArrayOfNumberCodec, 1, [vector]);
var project = (left, right) => apply("vector::project", ArrayOfNumberCodec, 2, [left, right]);
var scale = (vector, factor) => apply("vector::scale", ArrayOfNumberCodec, 2, [vector, factor]);
var similarityCosine = (left, right) => apply("vector::similarity::cosine", floatOrDecimal([0, 1]), 2, [
  left,
  right
]);
var similarityJaccard = (left, right) => apply("vector::similarity::jaccard", FloatCodec, 2, [left, right]);
var similarityPearson = (left, right) => apply("vector::similarity::pearson", FloatCodec, 2, [left, right]);
var similaritySpearman = (left, right) => apply("vector::similarity::spearman", FloatCodec, 2, [left, right]);
var subtract = (left, right) => apply("vector::subtract", ArrayOfNumberCodec, 2, [left, right]);
var sum2 = (vectors) => apply("vector::sum", OptionOfArrayOfNumberCodec, 1, [vectors]);
export {
  array_exports as array,
  bytes_exports as bytes,
  crypto_exports as crypto,
  duration_exports as duration,
  encoding_exports as encoding,
  geo_exports as geo,
  math_exports as math,
  meta_exports as meta,
  object_exports as object,
  parse_exports as parse,
  rand_exports as rand,
  record_exports as record,
  search_exports as search,
  string_exports as string,
  time_exports as time,
  type_exports as type,
  value_exports as value,
  vector_exports as vector
};
//# sourceMappingURL=functions.js.map