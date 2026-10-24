import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm"],
	dts: true,
	sourcemap: true,
	clean: true,
	// The runtime codecs run in browsers and Workers as well as Node, so they
	// target the language level rather than a Node release.
	target: "es2022",
	platform: "neutral",
	external: ["effect", "surrealdb"],
});
