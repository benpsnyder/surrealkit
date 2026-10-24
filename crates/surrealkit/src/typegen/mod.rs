//! `surrealkit typegen` — introspect a live database and emit a structured
//! schema document.
//!
//! JSON is the initial output format. The data model ([`SchemaTypes`] and
//! friends) is designed so additional emitters can be added without
//! re-introspecting the database.
//!
//! Every output file is published through the `output` module: written atomically, left
//! alone when its bytes are unchanged, and comparable without writing for
//! `surrealkit typegen --check`.

mod emit;
mod introspect;
mod output;
mod signature;
mod type_parser;
mod types;

use std::path::{Path, PathBuf};

use anyhow::{Context, Result, bail};
use output::{FileStatus, WriteOutcome};
use surrealdb::Surreal;
use surrealdb::engine::any::Any;
use time::OffsetDateTime;
use time::format_description::well_known::Rfc3339;
pub use types::{
	FieldDef, FieldType, FnArg, FunctionDef, NamedDef, ObjectField, ParamDef, PrimitiveType,
	SchemaTypes, TableDef,
};

/// Options for the `typegen` command.
#[derive(Debug, Clone, Default)]
pub struct TypegenOpts {
	/// Output path. The CLI fills it from `--out`, else `[typegen] json` in
	/// `surrealkit.toml`; when `None`, it is `{folder}/types/schema.json`.
	pub out: Option<PathBuf>,
	/// Print the JSON to stdout instead of writing the JSON file. Configured
	/// TypeScript output is still written.
	pub stdout: bool,
	/// Pretty-print the JSON.
	pub pretty: bool,
	/// When set, also emit TypeScript types: to this file when it ends in `.ts`
	/// (or `.mts`/`.cts`), otherwise to `index.ts` in this directory. Configured
	/// via `[typegen] typescript` and `filename` in `surrealkit.toml`.
	pub ts_out: Option<PathBuf>,
	/// Optional formatter command run on the generated TypeScript file after writing.
	/// Configured via `[typegen] format` in `surrealkit.toml`.
	pub ts_format: Option<String>,
	/// Fail instead of warning when an output cannot be produced exactly as
	/// configured — today, a formatter that fails. `--strict`, or `[typegen]
	/// strict = true`.
	pub strict: bool,
	/// Compare every output with the file on disk instead of writing it, and fail
	/// when any is missing or different. Nothing is written. `--check`.
	pub check: bool,
	/// Leave `generatedAt` out of the JSON, so the same schema always produces the
	/// same bytes. `--no-generated-at`, or `[typegen] generated_at = false`.
	pub omit_generated_at: bool,
}

/// Render a [`SchemaTypes`] document as TypeScript. Re-exported so callers
/// (e.g. the sync/watch loop) can emit types without re-introspecting.
pub fn render_typescript(doc: &SchemaTypes) -> Result<String> {
	emit::to_typescript(doc)
}

/// The file TypeScript types go to for `out`: `out` itself when it names a
/// `.ts`, `.mts` or `.cts` file, otherwise `index.ts` inside the directory `out`.
pub fn typescript_file(out: &Path) -> PathBuf {
	if crate::variables::is_typescript_file(out) {
		out.to_path_buf()
	} else {
		out.join(crate::variables::DEFAULT_TYPESCRIPT_FILE)
	}
}

/// Write `doc` as JSON to `path`, creating its directory if needed. The write is
/// atomic, and a file that already holds the same bytes is left untouched.
pub fn write_json(doc: &SchemaTypes, path: &Path, pretty: bool) -> Result<()> {
	output::write_atomic(path, &json_bytes(doc, pretty)?)?;
	Ok(())
}

/// Write the TypeScript types for `doc` to [`typescript_file`]`(out)`, creating
/// its directory if needed. Returns the path written. The write is atomic, and a
/// file that already holds the same bytes is left untouched.
pub fn write_typescript(doc: &SchemaTypes, out: &Path) -> Result<PathBuf> {
	let path = typescript_file(out);
	output::write_atomic(&path, emit::to_typescript(doc)?.as_bytes())?;
	Ok(path)
}

/// Write the TypeScript types and, when `format` is set, run that formatter
/// command so the output matches the project's house style (Biome / ESLint /
/// Prettier). Returns the path written.
///
/// The formatter runs on a temporary sibling of the file, which then replaces it
/// atomically, so the formatted result is compared with what is already there
/// like any other output. A failing formatter is a warning here and the
/// unformatted types are written; [`run_typegen`] with `strict` makes it an error.
pub fn write_typescript_formatted(
	doc: &SchemaTypes,
	out: &Path,
	format: Option<&str>,
) -> Result<PathBuf> {
	let path = typescript_file(out);
	let artifacts = render(
		doc,
		&Outputs {
			json: None,
			typescript: Some((&path, format)),
		},
		false,
		false,
	)?;
	publish(&artifacts, log::Level::Debug, OnWriteError::Propagate)?;
	Ok(path)
}

/// Run a user-configured formatter on `path`. The command is split on
/// whitespace (first token is the program, the rest are arguments) and the
/// file path is appended as the final argument — e.g. `biome check --write`
/// becomes `biome check --write <path>`. The command inherits the current
/// working directory so the formatter discovers the project's own config.
///
/// Failures (missing binary, non-zero exit) are non-fatal: they are reported as
/// warnings so a missing formatter never breaks `typegen` or `sync --watch`.
pub fn format_file(command: &str, path: &Path) {
	let mut parts = command.split_whitespace();
	let Some(program) = parts.next() else {
		return; // empty / whitespace-only command: nothing to run
	};
	let args: Vec<&str> = parts.collect();
	match std::process::Command::new(program).args(&args).arg(path).status() {
		Ok(status) if status.success() => {
			log::info!("typegen: formatted {} with `{command}`", path.display());
		}
		Ok(status) => {
			log::warn!("typegen: formatter `{command}` exited with {status}");
		}
		Err(err) => {
			log::error!("typegen: failed to run formatter `{command}`: {err}");
		}
	}
}

/// Introspect the database into a [`SchemaTypes`] document and stamp the
/// generation time. Performs no filesystem IO — used by emitters and tests.
pub async fn generate(db: &Surreal<Any>) -> Result<SchemaTypes> {
	let mut doc = introspect::introspect(db).await?;
	doc.generated_at = now_rfc3339()?;
	Ok(doc)
}

/// Introspect the database into a [`SchemaTypes`] document without a generation
/// time, so two runs over the same schema produce identical documents.
pub async fn generate_unstamped(db: &Surreal<Any>) -> Result<SchemaTypes> {
	introspect::introspect(db).await
}

fn now_rfc3339() -> Result<String> {
	Ok(OffsetDateTime::now_utc().format(&Rfc3339)?)
}

/// Run the `typegen` command: introspect the database, render JSON, and either
/// print it or write it to a file, then write the TypeScript types when they are
/// configured. With `check`, compare instead of writing.
///
/// `stdout` replaces only the JSON file: configured TypeScript is still written,
/// so `typegen --stdout | jq …` does not quietly leave the types stale. Progress
/// for that file is logged at `debug`, because the CLI prints `info` on stdout
/// and it would corrupt the JSON there.
#[doc(hidden)]
pub async fn run_typegen(db: &Surreal<Any>, folder: &str, opts: TypegenOpts) -> Result<()> {
	let mut doc = generate_unstamped(db).await?;
	let json_path = if opts.stdout {
		None
	} else {
		Some(opts.out.clone().unwrap_or_else(|| crate::constants::typegen_output_path(folder)))
	};
	if !opts.omit_generated_at {
		// A check compares content, not the clock: it reuses the timestamp already
		// on disk, so an unchanged schema is up to date however long ago it ran.
		let on_disk = if opts.check {
			json_path.as_deref().and_then(generated_at_on_disk)
		} else {
			None
		};
		doc.generated_at = match on_disk {
			Some(stamp) => stamp,
			None => now_rfc3339()?,
		};
	}

	let progress = if opts.stdout {
		log::info!("{}", emit::to_json(&doc, opts.pretty)?);
		log::Level::Debug
	} else {
		log::Level::Info
	};

	let ts_path = opts.ts_out.as_deref().map(typescript_file);
	let outputs = Outputs {
		json: json_path.as_deref().map(|path| (path, opts.pretty)),
		typescript: ts_path.as_deref().map(|path| (path, opts.ts_format.as_deref())),
	};
	let artifacts = render(&doc, &outputs, opts.strict, opts.check)?;
	if opts.check {
		return check(&artifacts);
	}
	publish(&artifacts, progress, OnWriteError::Propagate)
}

/// Regenerate the configured outputs after `sync` applied schema changes.
///
/// Without `strict` this never fails: a problem is logged and the sync, which has
/// already applied its changes, still succeeds, which is how sync has always
/// treated typegen. With `strict` the first problem is returned, so a CI sync
/// fails instead of leaving outputs stale behind a log line.
#[doc(hidden)]
pub async fn regenerate_after_sync(
	db: &Surreal<Any>,
	outputs: &Outputs<'_>,
	strict: bool,
	omit_generated_at: bool,
) -> Result<()> {
	let result = async {
		let mut doc = generate_unstamped(db).await.context("introspecting the schema")?;
		if !omit_generated_at {
			doc.generated_at = now_rfc3339()?;
		}
		let artifacts = render(&doc, outputs, strict, false)?;
		let on_error = if strict {
			OnWriteError::Propagate
		} else {
			OnWriteError::Log
		};
		publish(&artifacts, log::Level::Info, on_error)
	}
	.await;
	match result {
		Err(err) if strict => Err(err.context("typegen after sync")),
		Err(err) => {
			log::error!("typegen: {err:#}");
			Ok(())
		}
		Ok(()) => Ok(()),
	}
}

/// The outputs one generation produces.
#[derive(Debug, Clone, Copy, Default)]
#[doc(hidden)]
pub struct Outputs<'a> {
	/// The JSON file and whether to pretty-print it.
	pub json: Option<(&'a Path, bool)>,
	/// The TypeScript file (already resolved with [`typescript_file`]) and its
	/// optional formatter command.
	pub typescript: Option<(&'a Path, Option<&'a str>)>,
}

/// One rendered output, ready to publish or check.
#[derive(Debug)]
struct Artifact {
	path: PathBuf,
	bytes: Vec<u8>,
}

/// What to do when publishing one output fails.
#[derive(Debug, Clone, Copy)]
enum OnWriteError {
	/// Stop and return the error.
	Propagate,
	/// Log it and carry on with the other outputs.
	Log,
}

fn json_bytes(doc: &SchemaTypes, pretty: bool) -> Result<Vec<u8>> {
	let mut json = emit::to_json(doc, pretty)?;
	json.push('\n');
	Ok(json.into_bytes())
}

/// Render every output in memory, formatting TypeScript when a formatter is
/// configured. Nothing is published, so a strict failure leaves every file as it
/// was rather than some regenerated and some not.
///
/// When `checking`, the formatter only runs if the output's directory already
/// exists: a missing directory means a missing file, and a check must not create
/// one.
fn render(
	doc: &SchemaTypes,
	outputs: &Outputs<'_>,
	strict: bool,
	checking: bool,
) -> Result<Vec<Artifact>> {
	let mut artifacts = Vec::new();
	if let Some((path, pretty)) = outputs.json {
		artifacts.push(Artifact {
			path: path.to_path_buf(),
			bytes: json_bytes(doc, pretty)?,
		});
	}
	if let Some((path, format)) = outputs.typescript {
		let raw = emit::to_typescript(doc)?.into_bytes();
		let bytes = match format.filter(|cmd| !cmd.trim().is_empty()) {
			None => raw,
			Some(cmd) => format_typescript(cmd, path, raw, strict, checking)?,
		};
		artifacts.push(Artifact {
			path: path.to_path_buf(),
			bytes,
		});
	}
	Ok(artifacts)
}

fn format_typescript(
	cmd: &str,
	path: &Path,
	raw: Vec<u8>,
	strict: bool,
	checking: bool,
) -> Result<Vec<u8>> {
	let dir = path.parent().filter(|dir| !dir.as_os_str().is_empty());
	if let Some(dir) = dir {
		if checking && !dir.is_dir() {
			return Ok(raw);
		}
		std::fs::create_dir_all(dir)
			.with_context(|| format!("creating directory {}", dir.display()))?;
	}
	match output::format_bytes(cmd, path, &raw) {
		Ok(formatted) => {
			log::debug!("typegen: formatted {} with `{cmd}`", path.display());
			Ok(formatted)
		}
		Err(err) if strict => Err(err.context(format!("formatting {}", path.display()))),
		Err(err) => {
			log::warn!("typegen: {err:#}; writing {} unformatted", path.display());
			Ok(raw)
		}
	}
}

fn publish(artifacts: &[Artifact], level: log::Level, on_error: OnWriteError) -> Result<()> {
	for artifact in artifacts {
		match output::write_atomic(&artifact.path, &artifact.bytes) {
			Ok(WriteOutcome::Written) => {
				log::log!(level, "typegen: wrote {}", artifact.path.display());
			}
			Ok(WriteOutcome::Unchanged) => {
				log::log!(level, "typegen: {} is up to date", artifact.path.display());
			}
			Err(err) => match on_error {
				OnWriteError::Propagate => return Err(err),
				OnWriteError::Log => log::error!("typegen: {err:#}"),
			},
		}
	}
	Ok(())
}

/// Compare every output with the file on disk; fail listing each one that is
/// missing or different.
fn check(artifacts: &[Artifact]) -> Result<()> {
	let mut problems = Vec::new();
	for artifact in artifacts {
		match output::status(&artifact.path, &artifact.bytes)? {
			FileStatus::UpToDate => {}
			FileStatus::Stale => problems.push(format!("  stale:   {}", artifact.path.display())),
			FileStatus::Missing => problems.push(format!("  missing: {}", artifact.path.display())),
		}
	}
	if !problems.is_empty() {
		bail!(
			"typegen --check: {} of {} generated file(s) out of date:\n{}\nrun `surrealkit typegen` \
			 to regenerate them",
			problems.len(),
			artifacts.len(),
			problems.join("\n")
		);
	}
	log::info!("typegen: {} generated file(s) up to date", artifacts.len());
	Ok(())
}

/// The `generatedAt` recorded in the JSON file at `path`, if it has one.
fn generated_at_on_disk(path: &Path) -> Option<String> {
	let text = std::fs::read_to_string(path).ok()?;
	let value: serde_json::Value = serde_json::from_str(&text).ok()?;
	value.get("generatedAt")?.as_str().map(str::to_string)
}

#[cfg(test)]
mod tests {
	use super::*;

	fn doc() -> SchemaTypes {
		SchemaTypes {
			version: 1,
			generated_at: String::new(),
			namespace: None,
			database: None,
			tables: vec![],
			functions: vec![],
			params: vec![],
			analyzers: vec![],
			accesses: vec![],
			apis: vec![],
			buckets: vec![],
			sequences: vec![],
			configs: vec![],
			models: vec![],
			users: vec![],
		}
	}

	#[test]
	fn an_unstamped_document_has_no_generated_at_key() {
		let json = String::from_utf8(json_bytes(&doc(), true).unwrap()).unwrap();
		assert!(!json.contains("generatedAt"), "{json}");
		// It still reads back, with an empty timestamp.
		let parsed: SchemaTypes = serde_json::from_str(&json).unwrap();
		assert_eq!(parsed.generated_at, "");

		let mut stamped = doc();
		stamped.generated_at = "2026-01-01T00:00:00Z".into();
		let json = String::from_utf8(json_bytes(&stamped, true).unwrap()).unwrap();
		assert!(json.contains("\"generatedAt\": \"2026-01-01T00:00:00Z\""), "{json}");
	}

	#[test]
	fn check_lists_missing_and_stale_files_and_writes_nothing() {
		let tmp = tempfile::TempDir::new().unwrap();
		let fresh = tmp.path().join("fresh.json");
		let stale = tmp.path().join("stale.json");
		let missing = tmp.path().join("missing.json");
		std::fs::write(&fresh, "a").unwrap();
		std::fs::write(&stale, "old").unwrap();
		let artifacts = [
			Artifact {
				path: fresh,
				bytes: b"a".to_vec(),
			},
			Artifact {
				path: stale.clone(),
				bytes: b"new".to_vec(),
			},
			Artifact {
				path: missing.clone(),
				bytes: b"x".to_vec(),
			},
		];
		let err = check(&artifacts).unwrap_err().to_string();
		assert!(err.contains("2 of 3 generated file(s) out of date"), "{err}");
		assert!(err.contains(&format!("stale:   {}", stale.display())), "{err}");
		assert!(err.contains(&format!("missing: {}", missing.display())), "{err}");
		assert_eq!(std::fs::read_to_string(&stale).unwrap(), "old");
		assert!(!missing.exists());
		check(&artifacts[..1]).expect("an up-to-date file passes");
	}

	#[cfg(unix)]
	fn script(dir: &Path, name: &str, body: &str) -> String {
		let path = dir.join(name);
		std::fs::write(&path, format!("#!/bin/sh\n{body}\n")).unwrap();
		let mut perms = std::fs::metadata(&path).unwrap().permissions();
		std::os::unix::fs::PermissionsExt::set_mode(&mut perms, 0o755);
		std::fs::set_permissions(&path, perms).unwrap();
		// Run through `sh`: executing a file this process just wrote can fail with ETXTBSY
		// while another test thread forks.
		format!("sh {}", path.display())
	}

	#[cfg(unix)]
	#[test]
	fn a_failing_formatter_warns_unless_strict() {
		let tmp = tempfile::TempDir::new().unwrap();
		let fail = script(tmp.path(), "fail.sh", "exit 7");
		let ts = tmp.path().join("types/index.ts");
		let outputs = Outputs {
			json: None,
			typescript: Some((&ts, Some(&fail))),
		};

		let lenient = render(&doc(), &outputs, false, false).expect("a warning, not an error");
		assert_eq!(lenient[0].bytes, emit::to_typescript(&doc()).unwrap().into_bytes());

		let err = render(&doc(), &outputs, true, false).unwrap_err();
		assert!(format!("{err:#}").contains("exited with"), "{err:#}");
		assert!(!ts.exists(), "a strict failure publishes nothing");
	}

	#[cfg(unix)]
	#[test]
	fn formatted_output_is_published_and_then_unchanged() {
		let tmp = tempfile::TempDir::new().unwrap();
		let fmt = script(tmp.path(), "fmt.sh", "printf '// formatted\\n' >> \"$1\"");
		let ts = tmp.path().join("types/index.ts");
		let outputs = Outputs {
			json: None,
			typescript: Some((&ts, Some(&fmt))),
		};
		let artifacts = render(&doc(), &outputs, true, false).unwrap();
		publish(&artifacts, log::Level::Debug, OnWriteError::Propagate).unwrap();
		let written = std::fs::read_to_string(&ts).unwrap();
		assert!(written.ends_with("// formatted\n"), "{written}");
		// Formatting again gives the same bytes, so a check passes and nothing else
		// was left in the directory.
		let again = render(&doc(), &outputs, true, true).unwrap();
		check(&again).expect("formatted output is up to date");
		let names: Vec<_> = std::fs::read_dir(tmp.path().join("types"))
			.unwrap()
			.map(|e| e.unwrap().file_name().to_string_lossy().into_owned())
			.collect();
		assert_eq!(names, vec!["index.ts"]);
	}

	#[test]
	fn checking_does_not_create_a_missing_output_directory() {
		let tmp = tempfile::TempDir::new().unwrap();
		let ts = tmp.path().join("absent/index.ts");
		let outputs = Outputs {
			json: None,
			typescript: Some((&ts, Some("surrealkit-no-such-formatter-xyz"))),
		};
		let artifacts = render(&doc(), &outputs, true, true).expect("no formatter run");
		assert!(!tmp.path().join("absent").exists());
		let err = check(&artifacts).unwrap_err().to_string();
		assert!(err.contains("missing"), "{err}");
	}

	#[test]
	fn lenient_publication_logs_a_failed_write_and_continues() {
		let tmp = tempfile::TempDir::new().unwrap();
		// A regular file where a directory must go makes the first write fail.
		std::fs::write(tmp.path().join("blocked"), "").unwrap();
		let artifacts = [
			Artifact {
				path: tmp.path().join("blocked/schema.json"),
				bytes: b"{}".to_vec(),
			},
			Artifact {
				path: tmp.path().join("ok/index.ts"),
				bytes: b"x".to_vec(),
			},
		];
		publish(&artifacts, log::Level::Debug, OnWriteError::Log).expect("logged, not returned");
		assert!(tmp.path().join("ok/index.ts").exists());
		assert!(publish(&artifacts, log::Level::Debug, OnWriteError::Propagate).is_err());
	}
}
