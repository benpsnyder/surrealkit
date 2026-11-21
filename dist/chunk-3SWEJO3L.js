// src/internal/codecIssue.ts
import { SchemaIssue } from "effect";
var diagnostics = /* @__PURE__ */ new WeakMap();
var staticCodecIssue = (message) => {
  const issue = new SchemaIssue.InvalidValue({ message });
  diagnostics.set(issue, message);
  return issue;
};
var matches = (ast, expected, seen = /* @__PURE__ */ new Set()) => {
  if (ast === expected) return true;
  if (seen.has(ast)) return false;
  seen.add(ast);
  return (ast.encoding?.some(({ to }) => matches(to, expected, seen)) ?? false) || ast._tag === "Union" && ast.types.some((member) => matches(member, expected, seen)) || ast._tag === "Suspend" && matches(ast.thunk(), expected, seen);
};
var property = (ast, child) => {
  const [key] = child.path;
  if (child.path.length === 1 && ast._tag === "Objects") {
    const field = ast.propertySignatures.find(({ name }) => name === key);
    if (field !== void 0 && typeof field.name === "string") {
      return { path: `[${JSON.stringify(field.name)}]`, ast: field.type };
    }
  }
  if (child.path.length === 1 && ast._tag === "Arrays" && typeof key === "number" && Number.isSafeInteger(key) && key >= 0) {
    const element = ast.elements[key];
    return element !== void 0 ? { path: `[${key}]`, ast: element } : { path: "[]", ast: ast.rest[0] };
  }
  return { path: "", ast: void 0 };
};
var codecIssueText = (issue, ast, path = "") => {
  const at = (message) => path.length === 0 ? message : `${message}
  at ${path}`;
  const trusted = diagnostics.get(issue);
  if (trusted !== void 0) return at(trusted);
  switch (issue._tag) {
    case "Composite":
      if (ast === void 0 || !matches(ast, issue.ast))
        return at("Value failed codec validation");
      return issue.issues.map((child) => {
        if (child._tag !== "Pointer")
          return codecIssueText(child, issue.ast, path);
        const next = property(issue.ast, child);
        return codecIssueText(
          child.issue,
          next.ast,
          path + next.path
        );
      }).join("\n");
    case "AnyOf":
      return ast !== void 0 && matches(ast, issue.ast) && issue.issues.length > 0 ? issue.issues.map((child) => codecIssueText(child, issue.ast, path)).join("\n") : at("No codec alternative accepted the value");
    case "MissingKey":
      return at("Missing required field");
    case "UnexpectedKey":
      return at("Unexpected field");
    case "InvalidType":
      return at("Value has an invalid type");
    case "Encoding":
      return at("Value failed a codec transformation");
    default:
      return at("Value failed codec validation");
  }
};

export {
  staticCodecIssue,
  codecIssueText
};
//# sourceMappingURL=chunk-3SWEJO3L.js.map