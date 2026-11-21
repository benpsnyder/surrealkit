import {
  AnalyzeError,
  lex
} from "./chunk-FBUMKT7I.js";

// src/statement/rename.ts
var possibleParameter = /[$\\]/u;
var lexForRename = (sql) => lex(sql, void 0, {
  unambiguousLineComments: true,
  unambiguousSlashes: true
}).tokens;
var scanParameters = (sql) => {
  try {
    const tokens = lexForRename(sql);
    const writable = [];
    const recordNames = /* @__PURE__ */ new Set();
    const records = [];
    for (let source = tokens; source !== void 0; source = records.pop()) {
      const insideRecord = source !== tokens;
      for (const [index, token] of source.entries()) {
        if (token.kind === "word" && token.value.toUpperCase() === "FUNCTION" && source[index + 1]?.value === "(")
          return void 0;
        if (token.kind === "param") {
          if (insideRecord) recordNames.add(token.value);
          else writable.push(token);
        }
        if (token.kind === "string" && token.prefix === "r" && possibleParameter.test(token.value)) {
          records.push(lexForRename(token.value));
        }
      }
    }
    return { tokens: writable, recordNames };
  } catch (error) {
    if (error instanceof AnalyzeError) return void 0;
    throw error;
  }
};
var renameParameterTokens = (sql, tokens, names) => {
  let result = "";
  let copied = 0;
  for (const { value, start, end } of tokens) {
    const name = names.get(value);
    if (name === void 0 || name === value) continue;
    result += `${sql.slice(copied, start)}$${name}`;
    copied = end;
  }
  return result + sql.slice(copied);
};
var renameNames = (sql, names) => {
  const renames = new Map(
    Object.entries(names).filter(([name, alias]) => name !== alias)
  );
  if (renames.size === 0) return sql;
  const scan = scanParameters(sql);
  if (scan === void 0) return void 0;
  for (const [name, alias] of renames) {
    if (scan.recordNames.has(name) || scan.recordNames.has(alias))
      return void 0;
  }
  return renameParameterTokens(sql, scan.tokens, renames);
};

export {
  scanParameters,
  renameParameterTokens,
  renameNames
};
//# sourceMappingURL=chunk-6LS7V54M.js.map