import {
  surqlBunPlugin
} from "./chunk-SZMSW6R7.js";
import {
  loadSurqlModule
} from "./chunk-HNIKUY5K.js";

// src/mapper/register.ts
import * as nodeModule from "module";
import { fileURLToPath } from "url";
if (typeof Bun !== "undefined") {
  Bun.plugin(surqlBunPlugin());
} else {
  const { registerHooks, stripTypeScriptTypes } = nodeModule;
  if (typeof registerHooks !== "function" || typeof stripTypeScriptTypes !== "function")
    throw new Error(
      `effect-surrealkit/register needs module.registerHooks and module.stripTypeScriptTypes, from Node 22.15 or 23.5; this is Node ${process.versions.node}`
    );
  registerHooks({
    load: (url, context, nextLoad) => {
      if (!url.startsWith("file:") || !new URL(url).pathname.endsWith(".surql"))
        return nextLoad(url, context);
      return {
        format: "module",
        source: stripTypeScriptTypes(
          loadSurqlModule(fileURLToPath(url))
        ),
        shortCircuit: true
      };
    }
  });
}
//# sourceMappingURL=register.js.map