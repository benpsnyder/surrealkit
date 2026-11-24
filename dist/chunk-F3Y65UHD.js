import {
  loadSurqlModule
} from "./chunk-BN7437D4.js";

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
//# sourceMappingURL=chunk-F3Y65UHD.js.map