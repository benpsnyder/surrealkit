import {
  loadSurqlModule
} from "./chunk-HNIKUY5K.js";

// src/mapper/bun.ts
var surqlBunPlugin = (options = {}) => ({
  name: "effect-surrealkit-surql",
  setup: (build) => {
    build.onLoad({ filter: /\.surql$/u }, ({ path }) => ({
      contents: loadSurqlModule(path, options),
      loader: "ts"
    }));
  }
});

export {
  surqlBunPlugin
};
//# sourceMappingURL=chunk-SZMSW6R7.js.map