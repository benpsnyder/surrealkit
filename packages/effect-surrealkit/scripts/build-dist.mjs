#!/usr/bin/env node
/**
 * Builds the prebuilt package directory that the fork's dist branch holds.
 *
 *     node scripts/build-dist.mjs --out <dir>
 *
 * 1. Refuses unless the whole repository's working tree is clean, so the
 *    package is exactly the commit it names.
 * 2. Runs the gate in this package: `pnpm install --frozen-lockfile`, then
 *    `lint`, `typecheck`, `test` and `build`. Any failure stops the script
 *    before anything is written.
 * 3. Checks the tree is still clean (no step rewrote a tracked file).
 * 4. Writes `<dir>`: the files `package.json` lists (`dist`, README, LICENSE)
 *    and a `package.json` without `scripts`, `devDependencies` or
 *    `packageManager`, so installing it runs nothing. Its `version` is
 *    `<source version>-fork.<7 hex of the commit built>` and its `gitHead`
 *    is that commit in full.
 *
 * `<dir>` must not exist or be empty. The script writes only `<dir>`;
 * committing it to the dist branch is a separate, manual step (see
 * "Prebuilt package" in the README).
 */
import { spawnSync } from 'node:child_process';
import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	renameSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const pkg = resolve(import.meta.dirname, '..');

const fail = (message) => {
	console.error(`build-dist: ${message}; no package written`);
	process.exit(1);
};

const { values } = parseArgs({
	options: {
		out: { type: 'string' },
	},
});
if (values.out === undefined) fail('--out <dir> is required');
const out = resolve(values.out);
if (existsSync(out) && readdirSync(out).length > 0)
	fail(`${out} exists and is not empty`);

const git = (...args) => {
	const result = spawnSync('git', args, { cwd: pkg, encoding: 'utf8' });
	if (result.status !== 0)
		fail(`git ${args.join(' ')} failed: ${result.stderr.trim()}`);
	return result.stdout.trim();
};

const requireClean = (when) => {
	const status = git('status', '--porcelain', '--untracked-files=all');
	if (status !== '') fail(`the working tree is dirty ${when}:\n${status}`);
};

requireClean('before the build');
const built = git('rev-parse', 'HEAD');

for (const step of [
	['install', '--frozen-lockfile'],
	['run', 'lint'],
	['run', 'typecheck'],
	['run', 'test'],
	['run', 'build'],
]) {
	console.log(`build-dist: pnpm ${step.join(' ')}`);
	const result = spawnSync('pnpm', step, { cwd: pkg, stdio: 'inherit' });
	if (result.error !== undefined)
		fail(`pnpm ${step.join(' ')} did not start: ${result.error.message}`);
	if (result.status !== 0)
		fail(
			`pnpm ${step.join(' ')} exited with ${result.status ?? result.signal}`,
		);
}
requireClean('after the gate');

const source = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8'));
const {
	scripts: _scripts,
	devDependencies: _devDependencies,
	packageManager: _packageManager,
	...kept
} = source;
for (const entry of source.files)
	if (!existsSync(join(pkg, entry)))
		fail(`${entry}, listed in files, is missing`);
const manifest = {
	...kept,
	version: `${source.version}-fork.${built.slice(0, 7)}`,
	gitHead: built,
};

// Assemble beside the destination, then move it in whole, so a failure
// part-way leaves no partial package.
mkdirSync(dirname(out), { recursive: true });
const staging = mkdtempSync(join(dirname(out), '.build-dist-'));
try {
	for (const entry of source.files)
		cpSync(join(pkg, entry), join(staging, entry), { recursive: true });
	writeFileSync(
		join(staging, 'package.json'),
		`${JSON.stringify(manifest, null, '\t')}\n`,
	);
	if (existsSync(out)) rmSync(out, { recursive: true });
	renameSync(staging, out);
} catch (error) {
	rmSync(staging, { recursive: true, force: true });
	throw error;
}

console.log(
	`build-dist: wrote ${out}\n  version ${manifest.version}\n  gitHead ${built}`,
);
