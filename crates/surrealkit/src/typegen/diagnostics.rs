//! Diagnostics: everything typegen could not represent structurally, said out
//! loud instead of being dropped or silently typed as unknown.
//!
//! The shape and the codes are those of schema document v2
//! (its section 14 lists them), so the v1 generator and
//! the v2 document report problems the same way. Codes are stable identifiers;
//! reasons are prose and may change.
//!
//! Severity decides what a strict run does: `surrealkit typegen --strict` (and
//! `[typegen] strict`) fails on any `error`, and logs warnings and infos.

use std::fmt;

use serde::{Deserialize, Serialize};

/// The stable diagnostic codes typegen raises.
pub mod codes {
	/// A kind string could not be parsed; the kind became `unknown`. Error.
	pub const KIND_UNRECOGNIZED: &str = "kind-unrecognized";
	/// `INFO` returned an entry in a category the document does not model. Warning.
	pub const DEFINITION_UNSUPPORTED: &str = "definition-unsupported";
	/// `COMPUTED` without `TYPE`: the value can be anything. Warning.
	pub const FIELD_COMPUTED_KIND_UNDECLARED: &str = "field-computed-kind-undeclared";
	/// A non-computed field has no `TYPE`: it holds any value. Info.
	pub const FIELD_KIND_UNDECLARED: &str = "field-kind-undeclared";
}

/// How serious a [`Diagnostic`] is.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Severity {
	/// The output does not describe the schema; strict runs fail.
	Error,
	/// The output is correct but weaker than the schema deserves.
	Warning,
	/// Worth knowing, not worth fixing.
	Info,
}

impl fmt::Display for Severity {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		f.write_str(match self {
			Severity::Error => "error",
			Severity::Warning => "warning",
			Severity::Info => "info",
		})
	}
}

/// A UTF-8 byte range within a diagnostic's `source`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub struct Span {
	pub start: usize,
	pub end: usize,
}

/// One thing typegen could not represent structurally.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Diagnostic {
	pub severity: Severity,
	/// A stable identifier from [`codes`].
	pub code: String,
	/// The table the diagnostic is about, if any.
	#[serde(default, skip_serializing_if = "Option::is_none")]
	pub table: Option<String>,
	/// The field path, as segments (`["address", "zip"]`, `["tags", "*"]`).
	#[serde(default, skip_serializing_if = "Option::is_none")]
	pub field: Option<Vec<String>>,
	/// The function (with its `fn::` prefix) the diagnostic is about, if any.
	#[serde(default, skip_serializing_if = "Option::is_none")]
	pub function: Option<String>,
	/// The exact text the diagnostic is about.
	pub source: String,
	/// The part of `source` at fault, when narrower than all of it.
	#[serde(default, skip_serializing_if = "Option::is_none")]
	pub span: Option<Span>,
	/// A human-readable explanation.
	pub reason: String,
}

impl Diagnostic {
	pub(crate) fn new(
		severity: Severity,
		code: &str,
		source: impl Into<String>,
		reason: impl Into<String>,
	) -> Self {
		Self {
			severity,
			code: code.to_string(),
			table: None,
			field: None,
			function: None,
			source: source.into(),
			span: None,
			reason: reason.into(),
		}
	}

	pub(crate) fn on_table(mut self, table: &str) -> Self {
		self.table = Some(table.to_string());
		self
	}

	pub(crate) fn on_field(mut self, path: Vec<String>) -> Self {
		self.field = Some(path);
		self
	}

	pub(crate) fn on_function(mut self, name: &str) -> Self {
		self.function = Some(name.to_string());
		self
	}

	pub(crate) fn with_span(mut self, span: std::ops::Range<usize>) -> Self {
		self.span = Some(Span {
			start: span.start,
			end: span.end,
		});
		self
	}

	/// Whether a strict run must fail on this diagnostic.
	pub fn is_error(&self) -> bool {
		self.severity == Severity::Error
	}
}

impl fmt::Display for Diagnostic {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		write!(f, "{} {}", self.severity, self.code)?;
		match (&self.table, &self.field, &self.function) {
			(Some(table), Some(field), _) => write!(f, " at {table}.{}", field.join("."))?,
			(Some(table), None, _) => write!(f, " at {table}")?,
			(None, _, Some(function)) => write!(f, " at {function}")?,
			_ => {}
		}
		write!(f, ": {} (`{}`)", self.reason, self.source)
	}
}

#[cfg(test)]
mod tests {
	use super::*;

	#[test]
	fn serialises_in_the_document_v2_shape() {
		let d = Diagnostic::new(Severity::Error, codes::KIND_UNRECOGNIZED, "range<int>", "nope")
			.on_table("k")
			.on_field(vec!["r".into()])
			.with_span(5..10);
		let json = serde_json::to_value(&d).unwrap();
		assert_eq!(
			json,
			serde_json::json!({
				"severity": "error", "code": "kind-unrecognized", "table": "k", "field": ["r"],
				"source": "range<int>", "span": { "start": 5, "end": 10 }, "reason": "nope"
			})
		);
		assert_eq!(serde_json::from_value::<Diagnostic>(json).unwrap(), d);
	}

	#[test]
	fn displays_where_and_why() {
		let d = Diagnostic::new(Severity::Warning, codes::DEFINITION_UNSUPPORTED, "X", "why")
			.on_function("fn::f");
		assert_eq!(d.to_string(), "warning definition-unsupported at fn::f: why (`X`)");
		let d = Diagnostic::new(Severity::Info, codes::FIELD_KIND_UNDECLARED, "Y", "any value")
			.on_table("person")
			.on_field(vec!["prefs".into(), "locale".into()]);
		assert_eq!(
			d.to_string(),
			"info field-kind-undeclared at person.prefs.locale: any value (`Y`)"
		);
	}
}
