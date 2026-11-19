import {
  Level,
  codecOf,
  derive,
  isExpr,
  literal,
  operand,
  sqlOf
} from "./chunk-4HL7DR3L.js";
import {
  Decimal,
  Float,
  Int,
  Int64,
  SurrealNumber
} from "./chunk-PHSAVORF.js";

// src/statement/arithmetic.ts
import { Schema, SchemaAST } from "effect";
var kinds = {
  "effect-surrealkit/Int": "int",
  "effect-surrealkit/Int64": "int64",
  "effect-surrealkit/Int64Literal": "int64",
  "effect-surrealkit/Float": "float",
  "effect-surrealkit/Decimal": "decimal",
  "effect-surrealkit/DecimalLiteral": "decimal",
  "effect-surrealkit/SurrealNumber": "any"
};
var representation = (ast) => {
  const id = ast.annotations?.representation?.id;
  return typeof id === "string" ? id : void 0;
};
var kindOfAst = (ast) => {
  if (SchemaAST.isUndefined(ast) || SchemaAST.isNull(ast)) return "none";
  if (SchemaAST.isDeclaration(ast)) {
    const id = representation(ast);
    return id === void 0 ? void 0 : kinds[id];
  }
  if (SchemaAST.isNumber(ast)) return "float";
  if (SchemaAST.isBigInt(ast)) return "int64";
  if (SchemaAST.isLiteral(ast)) {
    if (typeof ast.literal === "bigint") return "int64";
    if (typeof ast.literal === "number") {
      return Number.isInteger(ast.literal) ? "int" : "float";
    }
    return void 0;
  }
  if (SchemaAST.isUnion(ast)) {
    const members = ast.types.map(kindOfAst);
    if (members.includes("none")) return "none";
    if (members.some((member) => member === void 0)) return void 0;
    const distinct = [...new Set(members)];
    return distinct.length === 1 ? distinct[0] : "any";
  }
  return void 0;
};
var holdsDecimalAst = (ast) => {
  if (SchemaAST.isUndefined(ast) || SchemaAST.isNull(ast)) return false;
  if (SchemaAST.isUnion(ast)) return ast.types.some(holdsDecimalAst);
  if (SchemaAST.isArrays(ast)) {
    return [...ast.elements, ...ast.rest].some(holdsDecimalAst);
  }
  const kind = kindOfAst(ast);
  return kind !== "int" && kind !== "int64" && kind !== "float";
};
var holdsDecimal = (codec) => holdsDecimalAst(codec.ast);
var FloatOrDecimal = /* @__PURE__ */ Schema.Union([Float, Decimal]);
var kindOf = (expr) => {
  const kind = kindOfAst(codecOf(expr).ast);
  if (kind === "none") {
    throw new TypeError(
      `\`${sqlOf(expr)}\` may be NONE, and SurrealDB refuses NONE in arithmetic`
    );
  }
  if (kind === void 0) {
    throw new TypeError(
      `\`${sqlOf(expr)}\` is not a number: arithmetic takes an int, a float, a decimal or a number`
    );
  }
  return kind;
};
var joined = (left, right) => {
  const both = /* @__PURE__ */ new Set([left, right]);
  if (both.has("any")) return "any";
  if (both.has("decimal")) return "decimal";
  if (both.has("float")) return "float";
  if (both.has("int64")) return "int64";
  return "int";
};
var product = {
  int: Int,
  int64: Int64,
  float: Float,
  decimal: Decimal,
  any: SurrealNumber
};
var quotient = {
  int: Schema.Union([Int, Float]),
  int64: Schema.Union([Int64, Float]),
  float: Float,
  decimal: Schema.Union([Decimal, Float]),
  any: SurrealNumber
};
var parameter = /^\$[A-Za-z_][A-Za-z0-9_]*$/u;
var lift = (value) => {
  if (isExpr(value)) return value;
  if (typeof value === "number" || typeof value === "bigint") {
    return literal(value);
  }
  throw new TypeError(
    "arithmetic takes numbers: an expression, or a number to inline"
  );
};
var arithmetic = (operator, divides) => (left, right) => {
  const a = lift(left);
  const b = lift(right);
  const kinds2 = [kindOf(a), kindOf(b)];
  const kind = joined(...kinds2);
  const text = (value, own) => own === "float" && parameter.test(sqlOf(value)) ? `<float>${sqlOf(value)}` : operand(value);
  return derive(
    (divides ? quotient : product)[kind],
    `${text(a, kinds2[0])} ${operator} ${text(b, kinds2[1])}`,
    // Looser than a term, so it is parenthesised as an operand.
    Level.comparison,
    [a, b]
  );
};
var add = arithmetic("+", false);
var sub = arithmetic("-", false);
var mul = arithmetic("*", false);
var div = arithmetic("/", true);

export {
  holdsDecimal,
  FloatOrDecimal,
  add,
  sub,
  mul,
  div
};
//# sourceMappingURL=chunk-5SKHDALX.js.map