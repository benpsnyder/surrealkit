import {
  isPlainObject,
  runtimeCode,
  wrap
} from "./chunk-MUBWQQFC.js";

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
  stripNone,
  NoneAsAbsent
};
//# sourceMappingURL=chunk-EEFZAKBV.js.map