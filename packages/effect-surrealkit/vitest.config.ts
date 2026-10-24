import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['test/**/*.test.ts'],
		// The engine suite boots a disposable SurrealDB process; give it room.
		testTimeout: 60_000,
		hookTimeout: 60_000,
	},
});
