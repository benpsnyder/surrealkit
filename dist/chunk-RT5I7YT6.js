import {
  renameParameterTokens,
  scanParameters
} from "./chunk-6LS7V54M.js";
import {
  assertBindingName,
  make
} from "./chunk-QRSY4HQJ.js";
import {
  codecIssueText
} from "./chunk-3SWEJO3L.js";

// src/client/errors.ts
import { Data } from "effect";
var requestDisplay = ({
  _tag,
  statement,
  message
}) => ({ _tag, statement, message });
var StatementEncodeError = class extends Data.TaggedError(
  "StatementEncodeError"
) {
  toJSON() {
    const { _tag, statement, binding, message } = this;
    return { _tag, statement, binding, message };
  }
};
var StatementScopeError = class extends Data.TaggedError(
  "StatementScopeError"
) {
};
var StatementRequestError = class extends Data.TaggedError(
  "StatementRequestError"
) {
  toJSON() {
    return requestDisplay(this);
  }
};
var StatementThrown = class extends Data.TaggedError("StatementThrown") {
  get message() {
    return this.reason;
  }
};
var StatementUnexpectedThrow = class extends Data.TaggedError(
  "StatementUnexpectedThrow"
) {
  get message() {
    return `\`${this.statement}\` threw a message it does not declare`;
  }
  toJSON() {
    return requestDisplay(this);
  }
};
var StatementConflict = class extends Data.TaggedError("StatementConflict") {
  toJSON() {
    return requestDisplay(this);
  }
};
var StatementDecodeError = class extends Data.TaggedError(
  "StatementDecodeError"
) {
};
var StatementEmptyResult = class extends Data.TaggedError(
  "StatementEmptyResult"
) {
};
var StatementWriteOutcomeError = class extends Data.TaggedError(
  "StatementWriteOutcomeError"
) {
  get message() {
    return this.cause.message;
  }
};
var StatementUnsupported = class extends Data.TaggedError(
  "StatementUnsupported"
) {
  toJSON() {
    const { _tag, feature, statement, message } = this;
    return { _tag, feature, statement, message };
  }
};
var TransactionOutcomeUnknown = class extends Data.TaggedError(
  "TransactionOutcomeUnknown"
) {
  toJSON() {
    const { _tag, message } = this;
    return { _tag, message };
  }
};
var BulkWriteError = class extends Data.TaggedError("BulkWriteError") {
};
var LiveQueryClosed = class extends Data.TaggedError("LiveQueryClosed") {
};

// src/client/timing.ts
import { Context, Effect } from "effect";
var timingCollectors = Context.Reference("effect-surrealkit/TimingCollectors", { defaultValue: () => [] });
var timed = (effect) => Effect.gen(function* () {
  const outer = yield* timingCollectors;
  const timings = [];
  let active = timings;
  const append = (timing) => {
    active?.push(timing);
  };
  const value = yield* Effect.provideService(effect, timingCollectors, [
    ...outer,
    append
  ]).pipe(
    Effect.ensuring(
      Effect.sync(() => {
        active = void 0;
      })
    )
  );
  return [value, timings];
});

// src/client/internal/trace.ts
import { Clock as Clock2, Duration, Effect as Effect3, Metric } from "effect";

// src/client/internal/span.ts
import {
  Cause,
  Channel,
  Clock,
  Effect as Effect2,
  Exit,
  References,
  Stream,
  Tracer
} from "effect";
var spanExit = (exit) => {
  if (Exit.isSuccess(exit)) return Exit.void;
  if (Cause.hasInterruptsOnly(exit.cause)) return Exit.interrupt();
  if (Cause.hasDies(exit.cause)) return Exit.die("Defect");
  return Exit.fail("Failure");
};
var end = (span, exit, clock, timingEnabled) => Effect2.sync(() => {
  if (span.status._tag === "Ended") return;
  span.end(
    timingEnabled ? clock.currentTimeNanosUnsafe() : 0n,
    spanExit(exit)
  );
});
var withClientSpan = (name2, options) => (effect) => Effect2.acquireUseRelease(
  Effect2.gen(function* () {
    const span = yield* Effect2.makeSpan(name2, options);
    const clock = yield* Clock.Clock;
    const timingEnabled = yield* References.TracerTimingEnabled;
    return { span, clock, timingEnabled };
  }),
  ({ span }) => effect.pipe(Effect2.withParentSpan(span)),
  ({ span, clock, timingEnabled }, exit) => end(span, exit, clock, timingEnabled)
);
var withClientStreamSpan = (name2, options) => (stream2) => Stream.fromChannel(
  Channel.acquireUseRelease(
    Effect2.makeSpan(name2, options),
    (span) => Stream.toChannel(stream2).pipe(
      Channel.provideService(Tracer.ParentSpan, span)
    ),
    (span, exit) => Effect2.gen(function* () {
      const clock = yield* Clock.Clock;
      const timingEnabled = yield* References.TracerTimingEnabled;
      yield* end(span, exit, clock, timingEnabled);
    })
  )
);

// src/client/internal/trace.ts
var metrics = {
  runs: Metric.counter("effect_surrealkit_statement_runs", {
    description: "Statements run, by statement name and outcome",
    incremental: true
  }),
  duration: Metric.timer("effect_surrealkit_statement_duration", {
    description: "Time to run a statement, by statement name"
  }),
  retries: Metric.counter("effect_surrealkit_statement_retries", {
    description: "Requests sent again after a transaction conflict",
    incremental: true
  })
};
var { runs, duration: durations, retries } = metrics;
var traced = (name2, sql, sources, variant, rows, effect, group) => Effect3.gen(function* () {
  const started = yield* Clock2.currentTimeNanos;
  const record = (outcome) => Effect3.gen(function* () {
    const ended = yield* Clock2.currentTimeNanos;
    for (const [index, member] of (group?.names ?? [name2]).entries()) {
      yield* Metric.update(
        Metric.withAttributes(runs, {
          statement: member,
          outcome: outcome(index)
        }),
        1
      );
    }
    const statement = { statement: name2 };
    yield* Metric.update(
      Metric.withAttributes(durations, statement),
      Duration.nanos(ended - started)
    );
  });
  return yield* effect.pipe(
    Effect3.tap(
      (result) => rows && Array.isArray(result) ? Effect3.annotateCurrentSpan(
        "db.response.returned_rows",
        result.length
      ) : Effect3.void
    ),
    Effect3.tapError(
      (error) => Effect3.annotateCurrentSpan("error.type", error._tag)
    ),
    withClientSpan(name2, {
      kind: "client",
      attributes: {
        "db.system.name": "surrealdb",
        "db.operation.name": name2,
        // Static text: values travel as bindings and are not recorded.
        "db.query.text": sql,
        ...sources !== void 0 && sources.length > 0 && {
          "code.file.path": sources.join(", ")
        },
        // A family variant's declared key: never a binding value.
        ...variant !== void 0 && {
          "effect_surrealkit.statement.variant": variant
        }
      }
    }),
    Effect3.tap(
      (result) => record((index) => group?.outcome(result, index) ?? "success")
    ),
    Effect3.tapError((error) => record(() => error._tag)),
    Effect3.onInterrupt(() => record(() => "interrupted"))
  );
});
var encodeDuration = Metric.timer(
  "effect_surrealkit_statement_encode_duration"
);
var serverDuration = Metric.timer(
  "effect_surrealkit_statement_server_duration"
);
var decodeDuration = Metric.timer(
  "effect_surrealkit_statement_decode_duration"
);
var micros = (duration) => Duration.toMillis(duration) * 1e3;
var report = (timing) => Effect3.gen(function* () {
  const { name: name2, sends, encode: encode2, wait, server, decode: decode2 } = timing;
  yield* Effect3.annotateCurrentSpan({
    "effect_surrealkit.encode_us": micros(encode2),
    "effect_surrealkit.wait_us": micros(wait),
    ...server === void 0 ? {} : { "effect_surrealkit.server_us": micros(server) },
    "effect_surrealkit.decode_us": micros(decode2),
    "effect_surrealkit.sends": sends
  });
  const tags = { statement: name2 };
  if (sends > 1 && (timing.kind === "run" || timing.kind === "transaction" || timing.kind === "bulk")) {
    yield* Metric.update(
      Metric.withAttributes(retries, tags),
      sends - 1
    );
  }
  yield* Metric.update(
    Metric.withAttributes(encodeDuration, tags),
    encode2
  );
  yield* Metric.update(
    Metric.withAttributes(decodeDuration, tags),
    decode2
  );
  if (server !== void 0) {
    yield* Metric.update(
      Metric.withAttributes(serverDuration, tags),
      server
    );
  }
  if (sends > 0) {
    const collectors = yield* timingCollectors;
    for (const collect of collectors) collect(timing);
  }
});
var measure = (effect, save, onStart) => Effect3.uninterruptibleMask(
  (restore) => Effect3.gen(function* () {
    const start = yield* Clock2.currentTimeNanos;
    onStart?.();
    return yield* restore(effect).pipe(
      Effect3.ensuring(
        Effect3.gen(function* () {
          save(
            Duration.nanos(
              (yield* Clock2.currentTimeNanos) - start
            )
          );
        })
      )
    );
  })
);
var startRecording = (kind, name2) => Effect3.gen(function* () {
  const start = yield* Clock2.currentTimeNanos;
  const statements = [];
  let sends = 0;
  let encode2 = Duration.zero;
  let wait = Duration.zero;
  let decode2 = Duration.zero;
  let server;
  const recorder = {
    encode: (effect) => measure(effect, (elapsed) => {
      encode2 = Duration.sum(encode2, elapsed);
    }),
    wait: (effect) => measure(
      effect,
      (elapsed) => {
        wait = elapsed;
      },
      () => {
        sends++;
      }
    ),
    pull: (effect) => measure(
      effect,
      (elapsed) => {
        wait = Duration.sum(wait, elapsed);
      },
      () => {
        sends = 1;
      }
    ),
    decode: (effect) => measure(effect, (elapsed) => {
      decode2 = Duration.sum(decode2, elapsed);
    }),
    server: (statement, duration) => Effect3.sync(() => {
      statements.push(
        duration === void 0 ? { statement } : { statement, server: duration }
      );
      if (duration !== void 0) {
        server = server === void 0 ? duration : Duration.sum(server, duration);
      }
    }),
    rows: (statement, rows) => Effect3.sync(() => {
      const index = statements.length - 1;
      const part = statements[index];
      if (part?.statement === statement)
        statements[index] = { ...part, rows };
    })
  };
  const finish = Effect3.gen(function* () {
    const total = Duration.nanos(
      (yield* Clock2.currentTimeNanos) - start
    );
    yield* report({
      kind,
      name: name2,
      sends,
      encode: encode2,
      wait,
      decode: decode2,
      total,
      statements: statements.slice(),
      ...server === void 0 ? {} : { server }
    });
  });
  return { recorder, finish };
});
var recording = (kind, name2, use) => Effect3.flatMap(
  startRecording(kind, name2),
  ({ recorder, finish }) => use(recorder).pipe(Effect3.ensuring(finish))
);
var recordingScoped = (kind, name2) => Effect3.acquireRelease(
  startRecording(kind, name2),
  ({ finish }) => finish
).pipe(Effect3.map(({ recorder }) => recorder));

// src/client/client.ts
import {
  Context as Context3,
  Effect as Effect13,
  Layer,
  Stream as Stream6
} from "effect";

// src/client/bulk.ts
import {
  Cause as Cause2,
  Duration as Duration5,
  Effect as Effect9,
  Pull,
  Stream as Stream3
} from "effect";
import {
  AuthenticationError,
  ConnectionUnavailableError as ConnectionUnavailableError2,
  ExpressionError as ExpressionError2,
  InvalidSessionError as InvalidSessionError2,
  MissingNamespaceDatabaseError as MissingNamespaceDatabaseError2,
  ServerError as ServerError2,
  UnavailableFeatureError as UnavailableFeatureError2,
  UnsupportedFeatureError as UnsupportedFeatureError2,
  UnsupportedVersionError
} from "surrealdb";

// src/client/interactive.ts
import { Context as Context2, Duration as Duration3, Effect as Effect7, Exit as Exit2, Stream as Stream2 } from "effect";
import {
  ConnectionUnavailableError,
  InvalidSessionError,
  MissingNamespaceDatabaseError,
  ServerError,
  UnavailableFeatureError,
  UnsupportedFeatureError
} from "surrealdb";

// src/client/internal/classify.ts
import { ExpressionError } from "surrealdb";
var isCollateralFailure = (error) => {
  if (!(error instanceof Error)) return false;
  const query = error;
  if (query.kind !== void 0 && query.kind !== "Query") return false;
  if (query.isNotExecuted === true || query.isCancelled === true) return true;
  return !query.details && /^(?:The query was not executed due to a (?:failed|cancelled) transaction|Cannot COMMIT: the transaction was aborted due to a prior error)/u.test(
    query.message
  );
};
var firstFailure = (slots) => {
  let first;
  for (const slot of slots) {
    if (slot.ok) continue;
    first ??= slot;
    if (!isCollateralFailure(slot.error)) return slot;
  }
  return first;
};
var thrownPrefix = "An error occurred: ";
var transactionRefusals = /* @__PURE__ */ new Set([
  ...["BEGIN", "COMMIT", "CANCEL"].map(
    (keyword) => `queries[0] contains a ${keyword} statement. transaction() wraps the queries in BEGIN and COMMIT itself, so they must not contain any`
  ),
  "queries[0] contains a RETURN statement which is followed by another statement (in queries[0]). Inside a transaction RETURN ends it early: the statements after it would be skipped but the transaction would still commit. Use SELECT or a bare expression instead, or move the RETURN to the end"
]);
var LiveRegistrationError = class extends Error {
  constructor(problem, cause) {
    super(
      problem === "missing-id" ? "LIVE SELECT did not return one query UUID" : "live query attachment failed and cleanup could not be confirmed",
      { cause }
    );
  }
};
var requestErrorText = (error) => {
  if (error instanceof LiveRegistrationError) return error.message;
  if (error instanceof ExpressionError) {
    const { message } = error;
    if (transactionRefusals.has(message)) return message;
  }
  return "SurrealDB request failed";
};
var classify = (name2, declaredBy, cause) => {
  let unexpected;
  for (let error = cause; error instanceof Error; error = error.cause) {
    const { isTransactionConflict, kind } = error;
    if (kind === "Thrown") {
      const reason = error.message.startsWith(thrownPrefix) ? error.message.slice(thrownPrefix.length) : error.message;
      const declarer2 = declaredBy(reason);
      if (declarer2 !== void 0) {
        return new StatementThrown({ ...declarer2, reason });
      }
      unexpected ??= reason;
    }
    if (isTransactionConflict === true) {
      return new StatementConflict({
        statement: name2,
        message: "Transaction conflict",
        cause
      });
    }
  }
  if (unexpected !== void 0) {
    return new StatementUnexpectedThrow({
      statement: name2,
      reason: unexpected,
      cause
    });
  }
  return new StatementRequestError({
    statement: name2,
    message: requestErrorText(cause),
    cause
  });
};
var declarer = (statements, reason) => {
  const declaring = statements.filter(
    (statement) => statement.throws.includes(reason)
  );
  const names = [...new Set(declaring.map((statement) => statement.name))];
  if (names.length > 1) {
    return {
      statement: `one of ${names.map((name2) => `\`${name2}\``).join(", ")}`
    };
  }
  const [first] = declaring;
  if (first === void 0) return void 0;
  const site = first.throwSites?.[reason];
  return site === void 0 ? { statement: first.name } : { statement: first.name, source: site.source, lines: site.lines };
};

// src/client/internal/decode.ts
import { Effect as Effect4, Schema } from "effect";
var changesOf = (statements) => statements.some((statement) => statement.writes === true) ? "writes" : statements.every((statement) => statement.writes === false) ? "none" : "maybe";
var committedNote = (changes2) => changes2 === "writes" ? ". The request succeeded and its writes are committed, so do not send it again to retry" : changes2 === "maybe" ? ". The request succeeded and may have written: it is not known whether it writes, and any writes it made are committed; read the data back before sending it again" : "";
var decodeOutcome = (request, changes2) => (error) => changes2 !== "none" && error instanceof StatementDecodeError ? new StatementWriteOutcomeError({ request, cause: error }) : error;
var decode = (statement, results, offset, writes) => {
  const at = offset + statement.valueSlot - 1;
  for (let slot = offset; slot < offset + statement.slots; slot++) {
    if (slot !== at && results[slot] !== void 0) {
      return Effect4.fail(
        new StatementDecodeError({
          statement: statement.name,
          slot: slot - offset + 1,
          committed: writes !== "none",
          message: `result ${slot - offset + 1} of ${statement.slots} must be NONE; only result ${statement.valueSlot} of a statement is decoded${committedNote(writes)}`
        })
      );
    }
  }
  const value = results[at];
  if (statement.nonEmpty === true && (value === void 0 || value === null || Array.isArray(value) && value.length === 0)) {
    return Effect4.fail(
      new StatementEmptyResult({
        statement: statement.name,
        slot: statement.valueSlot,
        message: `\`${statement.name}\` returned nothing, although it returns a row whenever it applies: the session may lack permission for it (SurrealDB reports a denied write as an empty result, without an error), and it wrote nothing`
      })
    );
  }
  return Schema.decodeUnknownEffect(statement.result)(value, {
    onExcessProperty: "error"
  }).pipe(
    Effect4.mapError(
      (error) => new StatementDecodeError({
        statement: statement.name,
        slot: statement.valueSlot,
        committed: writes !== "none",
        message: `${codecIssueText(error.issue, statement.result.ast)}${committedNote(writes)}`
      })
    )
  );
};
var countOf = (name2, results, expected, writes) => Array.isArray(results) && results.length === expected ? Effect4.succeed(results) : Effect4.fail(
  new StatementDecodeError({
    statement: name2,
    slot: 0,
    committed: writes !== "none",
    message: `expected ${expected} results, one per SurrealQL statement, and received ${Array.isArray(results) ? results.length : "no list"}${committedNote(writes)}`
  })
);

// src/client/internal/encode.ts
import { Effect as Effect5, Schema as Schema2, SchemaAST } from "effect";

// src/client/values.ts
import {
  BoundExcluded,
  BoundIncluded,
  DateTime,
  Decimal,
  Duration as Duration2,
  FileRef,
  Geometry,
  Range,
  RecordId,
  RecordIdRange,
  StringRecordId,
  Table,
  Uuid
} from "surrealdb";
var MAX_NUMBER = 2 ** 53;
var MAX_BIGINT = 2n ** 64n;
var wellFormed = (text) => {
  for (let i = 0; i < text.length; i++) {
    const unit = text.charCodeAt(i);
    if (unit >= 55296 && unit <= 56319) {
      const next = text.charCodeAt(i + 1);
      if (!(next >= 56320 && next <= 57343)) return false;
      i++;
    } else if (unit >= 56320 && unit <= 57343) {
      return false;
    }
  }
  return true;
};
var leaves = [
  DateTime,
  Duration2,
  Decimal,
  Uuid,
  Table,
  FileRef,
  StringRecordId
];
var fail = (path, problem) => ({
  path: [...path],
  problem
});
var checkBound = (bound, path, seen) => {
  if (bound === void 0) return void 0;
  if (bound instanceof BoundIncluded || bound instanceof BoundExcluded) {
    return check(bound.value, path, seen);
  }
  return fail(
    path,
    "a range bound that is not BoundIncluded or BoundExcluded"
  );
};
var checkObject = (value, path, seen) => {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index++) {
      path.push(index);
      const problem = check(value[index], path, seen);
      path.pop();
      if (problem !== void 0) return problem;
    }
    return void 0;
  }
  if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
    return void 0;
  }
  if (ArrayBuffer.isView(value)) {
    return fail(
      path,
      "an array buffer view, which the SDK sends as its raw bytes; send a Uint8Array"
    );
  }
  if (value instanceof Set) {
    let index = 0;
    for (const item of value) {
      path.push(index);
      const problem = check(item, path, seen);
      path.pop();
      if (problem !== void 0) return problem;
      index++;
    }
    return void 0;
  }
  if (value instanceof Map) {
    return fail(
      path,
      "a Map, which the SDK sends as a document whatever its keys; send a plain object"
    );
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? fail(path, "an invalid Date") : void 0;
  }
  if (value instanceof Geometry) {
    return check(value.toJSON(), path, seen);
  }
  if (value instanceof RecordId) {
    path.push("id");
    const problem = check(value.id, path, seen);
    path.pop();
    return problem;
  }
  if (value instanceof RecordIdRange || value instanceof Range) {
    path.push("begin");
    const begin = checkBound(value.begin, path, seen);
    path.pop();
    if (begin !== void 0) return begin;
    path.push("end");
    const end2 = checkBound(value.end, path, seen);
    path.pop();
    return end2;
  }
  for (const leaf of leaves) {
    if (value instanceof leaf) return void 0;
  }
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) {
    return fail(
      path,
      "a non-plain object, which the SDK would send as its own enumerable fields; encode it to a SurrealDB value"
    );
  }
  if (Object.getOwnPropertySymbols(value).length > 0) {
    return fail(path, "an object with symbol keys, which the SDK drops");
  }
  const record = value;
  for (const key of Object.keys(record)) {
    path.push(key);
    const problem = wellFormed(key) ? check(record[key], path, seen) : fail(
      path,
      "a key with a lone UTF-16 surrogate, which UTF-8 cannot carry"
    );
    path.pop();
    if (problem !== void 0) return problem;
  }
  return void 0;
};
var check = (value, path, seen) => {
  switch (typeof value) {
    case "undefined":
    case "boolean":
      return void 0;
    case "string":
      return wellFormed(value) ? void 0 : fail(
        path,
        "a string with a lone UTF-16 surrogate, which UTF-8 cannot carry; the SDK would replace it with U+FFFD"
      );
    case "number":
      if (Object.is(value, -0)) {
        return fail(
          path,
          "negative zero, which the SDK encodes as positive zero"
        );
      }
      return Number.isInteger(value) && Math.abs(value) > MAX_NUMBER ? fail(
        path,
        "an integer beyond \xB12^53, which the SDK cannot encode as a number; send a bigint"
      ) : void 0;
    case "bigint":
      return value >= MAX_BIGINT || value < -MAX_BIGINT ? fail(
        path,
        "a bigint beyond 64 bits, which the SDK cannot encode"
      ) : void 0;
    case "symbol":
    case "function":
      return fail(
        path,
        `a ${typeof value}, which is not a SurrealDB value`
      );
    default: {
      if (value === null) return void 0;
      const object = value;
      if (seen.has(object)) {
        return fail(path, "a cycle, which cannot be sent");
      }
      seen.add(object);
      try {
        return checkObject(object, path, seen);
      } finally {
        seen.delete(object);
      }
    }
  }
};
var valueProblem = (value) => {
  const path = [];
  try {
    return check(value, path, /* @__PURE__ */ new Set());
  } catch {
    return fail(path, "a value that cannot be read to the end");
  }
};
var pathText = (binding, path) => `$${binding}${path.map((step) => typeof step === "number" ? `[${step}]` : "[*]").join("")}`;

// src/client/internal/encode.ts
var encode = (statement, input) => Effect5.forEach(
  Object.entries(statement.params),
  ([name2, codec]) => Schema2.encodeUnknownEffect(codec)(input[name2]).pipe(
    Effect5.map((value) => [name2, value]),
    Effect5.mapError(
      (error) => new StatementEncodeError({
        statement: statement.name,
        binding: name2,
        message: codecIssueText(
          error.issue,
          SchemaAST.flip(codec.ast)
        )
      })
    )
  )
).pipe(Effect5.map((entries) => Object.fromEntries(entries)));
var checkValues = (bindings, owner, options) => {
  if (options?.unsafeSkipValueCheck === true) return Effect5.void;
  for (const [binding, value] of Object.entries(bindings)) {
    const found = valueProblem(value);
    if (found !== void 0) {
      return Effect5.fail(
        new StatementEncodeError({
          statement: owner(binding),
          binding,
          path: found.path,
          message: `${pathText(binding, found.path)} is ${found.problem}; nothing was sent`
        })
      );
    }
  }
  return Effect5.void;
};

// src/client/internal/join.ts
import { Effect as Effect6 } from "effect";
var planRenames = (statements) => Effect6.gen(function* () {
  const used = /* @__PURE__ */ new Set();
  const shared = /* @__PURE__ */ new Set();
  const scopes = statements.map(({ statement }) => {
    const names = /* @__PURE__ */ new Set([
      ...Object.keys(statement.params),
      ...statement.defines
    ]);
    for (const name2 of names) {
      if (used.has(name2)) shared.add(name2);
      used.add(name2);
    }
    return names;
  });
  const plans = /* @__PURE__ */ new Map();
  if (shared.size === 0) return plans;
  for (const binding of shared) {
    try {
      assertBindingName(binding);
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
      const owner = statements.find(
        ({ statement }) => Object.hasOwn(statement.params, binding) || statement.defines.includes(binding)
      );
      return yield* Effect6.fail(
        new StatementScopeError({
          statement: owner?.statement.name ?? "join",
          binding,
          message: `${error.message}; cannot rename a shared parameter`
        })
      );
    }
  }
  const scanned = [];
  for (const { statement } of statements) {
    const scan = scanParameters(statement.sql);
    if (scan === void 0) {
      return yield* Effect6.fail(
        new StatementScopeError({
          statement: statement.name,
          message: `cannot tokenize \`${statement.name}\` with certainty while renaming shared parameters`
        })
      );
    }
    const { tokens, recordNames } = scan;
    for (const token of tokens) used.add(token.value);
    for (const binding of recordNames) {
      if (shared.has(binding)) {
        return yield* Effect6.fail(
          new StatementScopeError({
            statement: statement.name,
            binding,
            message: `cannot rename shared parameter \`$${binding}\` inside a quoted record literal in \`${statement.name}\``
          })
        );
      }
      used.add(binding);
    }
    scanned.push({ statement, tokens });
  }
  for (const [index, { statement, tokens }] of scanned.entries()) {
    const names = /* @__PURE__ */ new Map();
    for (const name2 of scopes[index] ?? []) {
      if (!shared.has(name2)) continue;
      let alias = `${name2}__${index + 1}`;
      while (used.has(alias)) alias += "_";
      used.add(alias);
      names.set(name2, alias);
    }
    if (names.size !== 0) {
      plans.set(index, {
        sql: renameParameterTokens(statement.sql, tokens, names),
        names
      });
    }
  }
  return plans;
});
var requestPart = (statement, bindings, offset, slots, names) => ({
  statement,
  bindings,
  sent: Object.fromEntries(
    Object.keys(bindings).map((name2) => [name2, names?.get(name2) ?? name2])
  ),
  offset,
  slots
});
var joinWith = (statements, options) => Effect6.gen(function* () {
  if (options.refuseTransactional) {
    const own = statements.find(
      ({ statement }) => statement.transactional
    )?.statement;
    if (own !== void 0)
      return yield* Effect6.fail(
        new StatementScopeError({
          statement: own.name,
          message: `\`${own.name}\` writes its own BEGIN, COMMIT or CANCEL, so it cannot run inside a transaction; run it on its own`
        })
      );
  }
  const plans = yield* planRenames(statements);
  const bindings = /* @__PURE__ */ new Map();
  const sql = [];
  const parts = [];
  let offset = 0;
  for (const [
    index,
    { statement, bindings: encoded }
  ] of statements.entries()) {
    const planned = plans.get(index);
    const mine = yield* encoded;
    for (const [binding, value] of Object.entries(mine)) {
      const key = planned?.names.get(binding) ?? binding;
      if (options.mode === "atomic" && key === "__proto__") {
        return yield* Effect6.fail(
          new StatementScopeError({
            statement: statement.name,
            binding,
            message: `the SurrealDB SDK drops \`$${key}\` bound by \`${statement.name}\` when sending an atomic transaction; rename the binding`
          })
        );
      }
      bindings.set(key, value);
    }
    const wrap2 = options.wrap;
    const slots = statement.slots + (wrap2 === void 0 ? 0 : 2);
    parts.push(
      requestPart(statement, mine, offset, slots, planned?.names)
    );
    offset += slots;
    const text = planned?.sql ?? statement.sql;
    if (wrap2 === void 0) {
      sql.push(text);
    } else {
      sql.push(wrap2.before, text, wrap2.after);
    }
  }
  return {
    mode: options.mode,
    sql: sql.join("\n"),
    bindings: Object.fromEntries(bindings),
    parts
  };
});

// src/client/interactive.ts
var name = "withTransaction";
var commitDeadline = "30 seconds";
var activeTransaction = Context2.Reference(
  "effect-surrealkit/activeTransaction",
  { defaultValue: () => false }
);
var scopeError = (operation) => new StatementScopeError({
  statement: operation,
  message: `${operation} cannot run inside an interactive transaction`
});
var unsupported = (cause) => new StatementUnsupported({
  feature: "interactive transaction",
  message: "the connection does not support interactive transactions",
  ...cause !== void 0 && { cause }
});
var requestError = (cause) => new StatementRequestError({
  statement: name,
  message: requestErrorText(cause),
  cause
});
var commitUnknown = (cause) => new TransactionOutcomeUnknown({
  message: "The transaction commit was not acknowledged. Read back the data before retrying.",
  cause
});
var commitError = (cause) => {
  const classified = classify(name, () => void 0, cause);
  if (classified instanceof StatementConflict) return classified;
  if (cause instanceof ServerError || cause instanceof ConnectionUnavailableError || cause instanceof InvalidSessionError || cause instanceof MissingNamespaceDatabaseError || cause instanceof UnsupportedFeatureError || cause instanceof UnavailableFeatureError)
    return requestError(cause);
  return commitUnknown(cause);
};
var recordControl = (operation, request) => {
  const span = `${name}.${operation}`;
  return recording(
    "interactive",
    span,
    (recorder) => recorder.wait(request)
  ).pipe(
    withClientSpan(span, {
      kind: "client",
      attributes: {
        "db.system.name": "surrealdb",
        "db.operation.name": operation
      }
    })
  );
};
var commit = (handle) => recordControl(
  "commit",
  Effect7.interruptible(
    Effect7.tryPromise({
      try: () => handle.commit(),
      catch: commitError
    })
  ).pipe(
    Effect7.timeoutOrElse({
      duration: commitDeadline,
      orElse: () => Effect7.fail(
        commitUnknown(
          new Error(
            `No acknowledgement within ${commitDeadline}`
          )
        )
      )
    })
  )
);
var cancel = (handle) => recordControl(
  "cancel",
  Effect7.tryPromise({
    try: () => handle.cancel(),
    catch: (cause) => cause
  })
).pipe(
  Effect7.catch(
    () => Effect7.annotateCurrentSpan("effect_surrealkit.cancel_failed", true)
  )
);
var serverTime = (answers) => {
  let total;
  for (const { server } of answers) {
    if (server !== void 0)
      total = total === void 0 ? server : Duration3.sum(total, server);
  }
  return total;
};
var execute = (send, requestName, statements, options) => recording(
  "interactive",
  requestName,
  (recorder) => Effect7.gen(function* () {
    if (statements.length === 0) return [];
    const request = yield* recorder.encode(
      Effect7.gen(function* () {
        const request2 = yield* joinWith(
          statements.map(({ statement, input }) => ({
            statement,
            bindings: Effect7.suspend(
              () => encode(statement, input)
            )
          })),
          { mode: "query", refuseTransactional: true }
        );
        for (const part of request2.parts) {
          yield* checkValues(
            part.bindings,
            () => part.statement.name,
            options
          );
        }
        return request2;
      })
    );
    const failureOf2 = (cause) => cause instanceof StatementScopeError ? cause : classify(
      requestName,
      (reason) => declarer(
        statements.map(
          ({ statement }) => statement
        ),
        reason
      ),
      cause
    );
    const answers = yield* recorder.wait(
      Effect7.tryPromise({
        try: (signal) => send(request, signal),
        catch: failureOf2
      })
    );
    const recordServer = ({ offset, slots, statement }) => recorder.server(
      statement.name,
      serverTime(answers.slice(offset, offset + slots))
    );
    const failure = firstFailure(answers);
    if (failure !== void 0) {
      yield* Effect7.forEach(request.parts, recordServer, {
        discard: true
      });
      return yield* Effect7.fail(failureOf2(failure.error));
    }
    return yield* recorder.decode(
      Effect7.gen(function* () {
        const values = yield* countOf(
          requestName,
          answers.map(
            (slot) => slot.ok ? slot.value : void 0
          ),
          request.parts.reduce(
            (total, part) => total + part.slots,
            0
          ),
          "none"
        );
        const decoded = [];
        for (const part of request.parts) {
          const { statement, offset } = part;
          yield* recordServer(part);
          const value = yield* decode(
            statement,
            values,
            offset,
            "none"
          );
          if (Array.isArray(value))
            yield* recorder.rows(statement.name, value.length);
          decoded.push(value);
        }
        return decoded;
      })
    );
  })
).pipe(withClientSpan(requestName, { kind: "client" }));
var transactionClient = (send) => ({
  run: (statement, ...args) => {
    const input = args[0] ?? {};
    const bound = { statement, input };
    return execute(send, statement.name, [bound], args[1]).pipe(
      Effect7.map(([value]) => value)
    );
  },
  transaction: (given, options) => {
    const statements = given;
    const labels = statements.map(({ statement }) => statement.name).join(", ");
    return execute(
      send,
      `transaction(${labels})`,
      statements,
      options
    );
  },
  bulk: makeBulk({ transaction: { send } })
});
var beginTransaction = (begin) => recordControl(
  "begin",
  Effect7.tryPromise({
    try: (signal) => begin(signal),
    catch: (cause) => cause instanceof UnsupportedFeatureError || cause instanceof UnavailableFeatureError ? unsupported(cause) : requestError(cause)
  })
);
var attempt = (begin, body) => Effect7.uninterruptibleMask(
  (restore) => Effect7.gen(function* () {
    const handle = yield* beginTransaction(begin);
    let open = true;
    const send = (request, signal) => open ? handle.send(request, signal) : Promise.reject(
      new StatementScopeError({
        statement: request.parts[0]?.statement.name ?? name,
        message: "the interactive transaction has already ended"
      })
    );
    const tx = transactionClient(send);
    const result = yield* Effect7.exit(
      restore(
        Effect7.suspend(() => body(tx)).pipe(
          Effect7.provideService(activeTransaction, true)
        )
      )
    );
    open = false;
    if (Exit2.isFailure(result)) {
      yield* cancel(handle);
      return yield* Effect7.failCause(result.cause);
    }
    yield* commit(handle).pipe(
      Effect7.tapError(
        (error) => error instanceof TransactionOutcomeUnknown ? Effect7.void : cancel(handle)
      )
    );
    return result.value;
  })
);
var makeWithTransaction = (transport) => (body, options) => Effect7.gen(function* () {
  if (yield* activeTransaction)
    return yield* Effect7.fail(scopeError(name));
  if (transport.begin === void 0)
    return yield* Effect7.fail(unsupported());
  const run2 = attempt(transport.begin, body);
  const retry = options?.retry;
  if (retry === void 0) return yield* run2;
  return yield* Effect7.retry(run2, {
    schedule: retry,
    while: (error) => error instanceof StatementConflict
  });
}).pipe(
  withClientSpan(name, {
    kind: "client",
    attributes: { "db.system.name": "surrealdb" }
  })
);
var contextClient = (tx) => ({
  run: tx.run,
  transaction: tx.transaction,
  bulk: (statement, input, { atomic: _atomic, retry: _retry, ...options }) => tx.bulk(statement, input, options),
  pipeline: () => Effect7.fail(scopeError("pipeline")),
  withTransaction: () => Effect7.fail(scopeError(name)),
  stream: () => Stream2.fail(scopeError("stream")),
  live: () => Stream2.fail(scopeError("live")),
  liveScoped: () => Effect7.fail(scopeError("liveScoped"))
});
var withTransactionContext = (client, effect, options) => client.withTransaction(
  (tx) => Effect7.provideService(effect, SurrealClient, contextClient(tx)),
  options
);

// src/client/internal/transport.ts
import { Duration as Duration4, Effect as Effect8 } from "effect";
import {
  BoundQuery,
  Uuid as Uuid2
} from "surrealdb";
var sdkDuration = (value) => {
  const [seconds = 0n, nanos = 0n] = value.toCompact();
  return Duration4.nanos(seconds * 1000000000n + nanos);
};
var responseSlots = (responses) => responses.map((response) => {
  const timing = response.stats === void 0 ? {} : { server: sdkDuration(response.stats.duration) };
  return response.success ? { ok: true, value: response.result, ...timing } : { ok: false, error: response.error, ...timing };
});
var sdkTransport = (db) => {
  const requests = /* @__PURE__ */ new WeakMap();
  const collectAtomic = (request, signal) => {
    let bound = requests.get(request);
    if (bound === void 0) {
      bound = new BoundQuery(request.sql, request.bindings);
      requests.set(request, bound);
    }
    return db.transaction([bound], {
      signal,
      ...request.sdkRetry === false && { retry: false }
    });
  };
  const query = (request, signal) => {
    const pending = db.query(request.sql, request.bindings).signal(signal);
    return request.sdkRetry === false ? pending.retry(false) : pending;
  };
  const beginTransaction2 = db.beginTransaction?.bind(db);
  const liveOf = db.liveOf?.bind(db);
  return {
    collect: (request, signal) => request.mode === "atomic" ? collectAtomic(request, signal) : query(request, signal),
    send: async (request, signal) => {
      if (request.mode === "atomic") {
        const values = await collectAtomic(request, signal);
        return values.map((value) => ({ ok: true, value }));
      }
      return responseSlots(await query(request, signal).responses());
    },
    ...beginTransaction2 === void 0 ? {} : {
      begin: async (signal) => {
        signal.throwIfAborted();
        const tx = await beginTransaction2();
        return {
          send: async (request, signal2) => responseSlots(
            await tx.query(request.sql, request.bindings).signal(signal2).responses()
          ),
          commit: () => tx.commit(),
          cancel: () => tx.cancel()
        };
      }
    },
    ...liveOf === void 0 ? {} : {
      live: async (request, signal) => {
        signal.throwIfAborted();
        const ids = await db.query(request.sql, request.bindings).retry(false).collect();
        const [id] = ids;
        if (ids.length !== 1 || !(id instanceof Uuid2))
          throw new LiveRegistrationError("missing-id");
        const killById = async () => {
          await db.query("KILL $id;", { id }).retry(false).collect();
        };
        let attached;
        try {
          attached = await liveOf(id);
          const subscription = attached;
          const iterator = subscription[Symbol.asyncIterator]();
          signal.throwIfAborted();
          return {
            messages: (async function* () {
              for await (const message of {
                [Symbol.asyncIterator]: () => iterator
              }) {
                if (message.action === "KILLED")
                  yield { action: message.action };
                else
                  yield {
                    action: message.action,
                    id: message.recordId,
                    value: message.value
                  };
              }
            })(),
            // The SDK caches a rejected kill. A fresh request
            // on the same session can still release this UUID.
            kill: () => subscription.kill().catch(killById)
          };
        } catch (error) {
          const cleanup = attached === void 0 ? killById() : attached.kill().catch(killById);
          await cleanup.catch(() => {
            throw new LiveRegistrationError(
              "cleanup-unconfirmed",
              error
            );
          });
          throw error;
        }
      }
    },
    stream: async function* (request, signal) {
      const part = request.parts[0];
      const valueSlot = part === void 0 ? -1 : part.offset + part.statement.valueSlot - 1;
      for await (const frame of query(request, signal).stream()) {
        const slot = frame.query;
        if (frame.isValue()) {
          if (frame.isSingle && slot === valueSlot && Array.isArray(frame.value)) {
            for (const value of frame.value)
              yield { kind: "row", slot, value };
          } else {
            yield {
              kind: frame.isSingle ? "value" : "row",
              slot,
              value: frame.value
            };
          }
        } else if (frame.isDone()) {
          const timing = frame.stats === void 0 ? {} : { server: sdkDuration(frame.stats.duration) };
          yield { kind: "done", slot, ...timing };
        } else if (frame.isError()) {
          const timing = frame.stats === void 0 ? {} : { server: sdkDuration(frame.stats.duration) };
          yield {
            kind: "error",
            slot,
            error: frame.error,
            ...timing
          };
        }
      }
    }
  };
};
var sending = (send, options) => options?.retry === void 0 ? send : send.pipe(
  Effect8.retry({
    schedule: options.retry,
    while: (error) => error._tag === "StatementConflict"
  })
);

// src/client/bulk.ts
var SourceFailure = class {
  constructor(error) {
    this.error = error;
  }
  error;
};
var streamChunks = (source, size) => Effect9.map(
  Stream3.toPull(Stream3.grouped(source, size)),
  (pull) => pull.pipe(
    Effect9.map(([chunk]) => chunk),
    Pull.catchDone(() => Effect9.succeed(void 0))
  )
);
var iterableChunks = (source, size) => Effect9.gen(function* () {
  let done = false;
  const iterator = yield* Effect9.acquireRelease(
    Effect9.sync(() => source[Symbol.iterator]()),
    (cursor) => Effect9.sync(() => {
      if (!done) cursor.return?.();
    })
  );
  return Effect9.sync(() => {
    if (done) return void 0;
    const head = iterator.next();
    if (head.done) {
      done = true;
      return void 0;
    }
    const chunk = [head.value];
    while (chunk.length < size) {
      const row = iterator.next();
      if (row.done) {
        done = true;
        break;
      }
      chunk.push(row.value);
    }
    return chunk;
  });
});
var totalOf = (rows) => Array.isArray(rows) ? rows.length : rows instanceof Set || rows instanceof Map ? rows.size : void 0;
var inputWith = (input, key, rows) => ({ ...input, [key]: rows });
var definiteRejection = (cause) => cause instanceof ServerError2 || cause instanceof AuthenticationError || cause instanceof ConnectionUnavailableError2 || cause instanceof ExpressionError2 || cause instanceof InvalidSessionError2 || cause instanceof MissingNamespaceDatabaseError2 || cause instanceof UnavailableFeatureError2 || cause instanceof UnsupportedFeatureError2 || cause instanceof UnsupportedVersionError;
var failureOf = (statement, atomic, cause) => {
  if (cause instanceof StatementScopeError || cause instanceof StatementConflict || cause instanceof TransactionOutcomeUnknown)
    return cause;
  if (!atomic || cause instanceof Error) {
    const classified = classify(
      statement.name,
      (reason) => declarer([statement], reason),
      cause
    );
    if (!atomic || !(classified instanceof StatementRequestError) || definiteRejection(cause))
      return classified;
  }
  return new TransactionOutcomeUnknown({
    message: "The bulk transaction was not acknowledged. Read back the data before retrying.",
    cause
  });
};
var serverTime2 = (answers) => {
  let server;
  for (const slot of answers) {
    if (slot.server !== void 0)
      server = server === void 0 ? slot.server : Duration5.sum(server, slot.server);
  }
  return server;
};
var submit = (sender, job, chunks, atomic) => {
  const { statement, input, options } = job;
  const scoped2 = "transaction" in sender;
  const label = `bulk(${statement.name})`;
  const writes = scoped2 ? "none" : changesOf([statement]);
  return recording(
    "bulk",
    label,
    (recorder) => Effect9.gen(function* () {
      const request = yield* recorder.encode(
        Effect9.gen(function* () {
          const request2 = yield* joinWith(
            chunks.map((rows) => ({
              statement,
              bindings: encode(
                statement,
                inputWith(input, options.over, rows)
              )
            })),
            {
              mode: atomic ? "atomic" : "query",
              refuseTransactional: true
            }
          );
          for (const part of request2.parts) {
            yield* checkValues(
              part.bindings,
              () => statement.name,
              options
            );
          }
          return { ...request2, sdkRetry: false };
        })
      );
      const sendFailure = (cause) => failureOf(statement, atomic, cause);
      let raw;
      let answers;
      if (scoped2) {
        answers = yield* recorder.wait(
          Effect9.tryPromise({
            try: (signal) => sender.transaction.send(request, signal),
            catch: sendFailure
          })
        );
        const failure = firstFailure(answers);
        if (failure !== void 0) {
          yield* recorder.server(statement.name, serverTime2(answers));
          return yield* Effect9.fail(sendFailure(failure.error));
        }
        raw = answers.map((slot) => slot.ok ? slot.value : void 0);
      } else {
        raw = yield* sending(
          recorder.wait(
            Effect9.tryPromise({
              try: (signal) => sender.transport.collect(request, signal),
              catch: sendFailure
            })
          ),
          options
        );
      }
      return yield* recorder.decode(
        Effect9.gen(function* () {
          const slots = yield* countOf(
            label,
            raw,
            request.parts.reduce(
              (total, part) => total + part.slots,
              0
            ),
            writes
          );
          const decoded = [];
          for (const { offset, slots: size } of request.parts) {
            yield* recorder.server(
              statement.name,
              answers === void 0 ? void 0 : serverTime2(
                answers.slice(offset, offset + size)
              )
            );
            const value = yield* decode(
              statement,
              slots,
              offset,
              writes
            );
            if (Array.isArray(value))
              yield* recorder.rows(statement.name, value.length);
            decoded.push(value);
          }
          return decoded;
        }).pipe(Effect9.mapError(decodeOutcome(label, writes)))
      );
    })
  ).pipe(
    withClientSpan(label, {
      kind: "client",
      attributes: { "db.system.name": "surrealdb" }
    })
  );
};
var sequential = (sender, job, first, next) => Effect9.gen(function* () {
  const { statement, options, total } = job;
  const atomic = !("transaction" in sender) && statement.slots > 1;
  const results = [];
  let rows = 0;
  for (let chunk = first; chunk !== void 0; chunk = yield* next) {
    const index = results.length;
    yield* options.beforeChunk?.({ index, rows: chunk }) ?? Effect9.void;
    const [result] = yield* submit(sender, job, [chunk], atomic).pipe(
      Effect9.mapError(
        (cause) => "transaction" in sender || cause instanceof TransactionOutcomeUnknown ? cause : new BulkWriteError({
          statement: statement.name,
          chunk: index,
          chunksCommitted: index,
          rowsCommitted: rows,
          cause
        })
      )
    );
    results.push(result);
    rows += chunk.length;
    yield* options.onProgress?.({
      chunks: results.length,
      rows,
      total
    }) ?? Effect9.void;
  }
  return { chunks: results.length, rows, results };
});
var batched = (sender, job, first, next) => Effect9.gen(function* () {
  const { options, total } = job;
  const chunks = [];
  for (let chunk = first; chunk !== void 0; chunk = yield* next) {
    yield* options.beforeChunk?.({
      index: chunks.length,
      rows: chunk
    }) ?? Effect9.void;
    chunks.push(chunk);
  }
  const results = yield* submit(sender, job, chunks, true);
  let rows = 0;
  for (const [index, chunk] of chunks.entries()) {
    rows += chunk.length;
    yield* options.onProgress?.({ chunks: index + 1, rows, total }) ?? Effect9.void;
  }
  return { chunks: chunks.length, rows, results };
});
var fromOneShot = (first, next, replay) => {
  const history = [first];
  let finished = false;
  return () => {
    let index = 0;
    const pull = Effect9.suspend(() => {
      const cached = history[index++];
      if (cached !== void 0) return Effect9.succeed(cached);
      if (finished) return Cause2.done();
      return next.pipe(
        Effect9.mapError((error) => new SourceFailure(error)),
        Effect9.flatMap((chunk) => {
          if (chunk === void 0) {
            finished = true;
            return Cause2.done();
          }
          if (replay) history.push(chunk);
          return Effect9.succeed(chunk);
        })
      );
    });
    return Stream3.fromPull(Effect9.succeed(pull));
  };
};
function makeBulk(sender) {
  return (statement, input, options) => {
    const size = options.chunk ?? 500;
    if (!Number.isInteger(size) || size <= 0) {
      return Effect9.die(
        new RangeError("bulk chunk size must be a positive integer")
      );
    }
    if (statement.transactional) {
      return Effect9.fail(
        new StatementScopeError({
          statement: statement.name,
          message: "bulk cannot run a statement with its own BEGIN, COMMIT or CANCEL"
        })
      );
    }
    return Effect9.scoped(
      Effect9.gen(function* () {
        const source = input[options.over];
        const next = Stream3.isStream(source) ? yield* streamChunks(
          source,
          size
        ) : yield* iterableChunks(source, size);
        const first = yield* next;
        if (first === void 0)
          return { chunks: 0, rows: 0, results: [] };
        const total = totalOf(source);
        const job = { statement, input, options, total };
        if ("transaction" in sender || options.atomic === false) {
          return yield* sequential(sender, job, first, next);
        }
        if (sender.transport.begin === void 0) {
          return yield* batched(sender, job, first, next);
        }
        const replay = fromOneShot(
          first,
          next,
          options.retry !== void 0
        );
        let bodyStarted = false;
        const before = options.beforeChunk;
        const progress = options.onProgress;
        const scoped2 = makeWithTransaction(sender.transport)(
          (tx) => {
            bodyStarted = true;
            return tx.bulk(
              statement,
              inputWith(
                input,
                options.over,
                replay()
              ),
              {
                over: options.over,
                chunk: size,
                ...options.unsafeSkipValueCheck !== void 0 && {
                  unsafeSkipValueCheck: options.unsafeSkipValueCheck
                },
                ...before !== void 0 && {
                  beforeChunk: (chunk) => before(chunk).pipe(
                    Effect9.mapError(
                      (error) => new SourceFailure(error)
                    )
                  )
                },
                ...progress !== void 0 && {
                  onProgress: (value) => progress({ ...value, total })
                }
              }
            );
          },
          options.retry === void 0 ? void 0 : { retry: options.retry }
        );
        return yield* scoped2.pipe(
          Effect9.catch(
            (error) => {
              if (error instanceof SourceFailure)
                return Effect9.fail(error.error);
              if (!bodyStarted && error instanceof StatementUnsupported)
                return batched(sender, job, first, next);
              return Effect9.fail(error);
            }
          )
        );
      })
    );
  };
}

// src/client/live.ts
import { Effect as Effect10, Queue, Schema as Schema3, Stream as Stream4 } from "effect";
import {
  ConfigurationError,
  UnavailableFeatureError as UnavailableFeatureError3,
  UnsupportedFeatureError as UnsupportedFeatureError3
} from "surrealdb";
var unsupported2 = (statement, cause) => new StatementUnsupported({
  feature: "live query",
  statement,
  message: "the connection cannot listen for live queries",
  ...cause !== void 0 && { cause }
});
var requestError2 = (statement, cause) => cause instanceof UnsupportedFeatureError3 || cause instanceof UnavailableFeatureError3 || cause instanceof ConfigurationError && cause.isLiveQueryNotSupported ? unsupported2(statement, cause) : new StatementRequestError({
  statement,
  message: requestErrorText(cause),
  cause
});
var closed = (statement, reason) => new LiveQueryClosed({
  statement,
  reason,
  message: reason === "killed" ? `the engine killed live query \`${statement}\`` : `the connection for live query \`${statement}\` closed`
});
var decodeField = (statement, field, codec, value) => Schema3.decodeUnknownEffect(codec)(value, {
  onExcessProperty: "error"
}).pipe(
  Effect10.mapError(
    (error) => new StatementDecodeError({
      statement,
      slot: 1,
      committed: false,
      message: `live event ${field}: ${codecIssueText(error.issue, codec.ast)}`
    })
  )
);
var changes = (statement, handle) => Effect10.gen(function* () {
  const disconnected = () => closed(statement, "disconnected");
  const iterator = yield* Effect10.try({
    try: () => handle.messages[Symbol.asyncIterator](),
    catch: disconnected
  });
  const queue = yield* Queue.unbounded();
  yield* Effect10.addFinalizer(() => Queue.shutdown(queue));
  const poll = Effect10.gen(function* () {
    const frame = yield* Effect10.tryPromise({
      try: () => iterator.next(),
      catch: disconnected
    });
    if (frame.done) return yield* Effect10.fail(disconnected());
    const { action, id, value } = frame.value;
    if (action === "KILLED")
      return yield* Effect10.fail(closed(statement, "killed"));
    yield* Queue.offer(queue, { action, id, value });
  });
  yield* Effect10.forkScoped(
    Effect10.forever(poll).pipe(
      Effect10.catch((error) => Queue.fail(queue, error))
    ),
    { startImmediately: true }
  );
  return Stream4.fromQueue(queue);
});
var register = (open, descriptor, input) => {
  const { name: name2, sql } = descriptor;
  const operation = `live(${name2})`;
  return recording(
    "run",
    operation,
    (recorder) => Effect10.gen(function* () {
      const bindings = yield* Effect10.interruptible(
        recorder.encode(
          encode(descriptor, input).pipe(
            Effect10.tap(
              (encoded) => checkValues(encoded, () => name2, void 0)
            )
          )
        )
      );
      yield* recorder.server(name2, void 0);
      return yield* recorder.wait(
        Effect10.tryPromise({
          try: (signal) => open(
            {
              mode: "query",
              sql,
              bindings,
              parts: [
                requestPart(descriptor, bindings, 0, 1)
              ]
            },
            signal
          ),
          catch: (cause) => requestError2(name2, cause)
        })
      );
    })
  ).pipe(withClientSpan(operation, { kind: "client" }));
};
var kill = (name2, handle) => {
  const operation = `kill(${name2})`;
  return recording(
    "run",
    operation,
    (recorder) => recorder.wait(Effect10.tryPromise(() => handle.kill())).pipe(
      Effect10.catch(
        () => Effect10.logWarning(
          "live query cleanup could not be confirmed"
        ).pipe(Effect10.annotateLogs({ statement: name2 }))
      )
    )
  ).pipe(withClientSpan(operation, { kind: "client" }));
};
var scoped = (transport) => (statement, ...args) => Effect10.gen(function* () {
  const open = transport.live;
  if (open === void 0)
    return yield* Effect10.fail(unsupported2(statement.name));
  const { name: name2, sql, params } = statement;
  const descriptor = make({
    name: name2,
    sql,
    params,
    result: Schema3.Unknown,
    writes: false
  });
  const input = args[0] ?? {};
  const handle = yield* Effect10.acquireRelease(
    register(open, descriptor, input),
    (subscribed) => kill(name2, subscribed)
  );
  const messages = yield* changes(name2, handle);
  return messages.pipe(
    Stream4.mapEffect(
      ({ action, id, value }) => Effect10.gen(function* () {
        const recordId = yield* decodeField(
          name2,
          "id",
          statement.id,
          id
        );
        const row = yield* decodeField(
          name2,
          "value",
          statement.row,
          value
        );
        return { action, id: recordId, value: row };
      })
    )
  );
});
var makeLive = (transport) => {
  const liveScoped = scoped(transport);
  return {
    liveScoped,
    live: (statement, ...args) => Stream4.unwrap(liveScoped(statement, ...args))
  };
};

// src/client/pipeline.ts
import { Duration as Duration6, Effect as Effect11, Result } from "effect";
var wrap = { before: "BEGIN;", after: "COMMIT;" };
var decodePart = ({ statement, slots: expected }, answers, wrapped) => {
  const failed = firstFailure(answers);
  if (failed !== void 0) {
    return Effect11.succeed(
      Result.fail(
        classify(
          statement.name,
          (reason) => declarer([statement], reason),
          failed.error
        )
      )
    );
  }
  const writes = changesOf([statement]);
  return Effect11.gen(function* () {
    const values = answers.map(
      (slot) => slot.ok ? slot.value : void 0
    );
    if (wrapped && (values[0] !== void 0 || values[expected - 1] !== void 0)) {
      return yield* Effect11.fail(
        new StatementDecodeError({
          statement: statement.name,
          slot: 0,
          committed: writes !== "none",
          message: `the BEGIN and COMMIT results of a pipeline block must be NONE${committedNote(writes)}`
        })
      );
    }
    return yield* decode(statement, values, wrapped ? 1 : 0, writes);
  }).pipe(
    Effect11.mapError(decodeOutcome(statement.name, writes)),
    Effect11.result
  );
};
var serverTime3 = (slots) => {
  let duration;
  for (const { server } of slots) {
    if (server !== void 0)
      duration = Duration6.sum(duration ?? Duration6.zero, server);
  }
  return duration;
};
var decodeAnswers = ({ parts }, answers, wrapped, recorder) => {
  const expected = parts.reduce((total, { slots }) => total + slots, 0);
  const aligned = answers.length === expected;
  return Effect11.forEach(
    parts,
    (part) => Effect11.gen(function* () {
      const { statement, offset, slots } = part;
      if (!aligned) {
        yield* recorder.server(statement.name, void 0);
        const writes = changesOf([statement]);
        return yield* countOf(
          statement.name,
          answers,
          expected,
          writes
        ).pipe(
          Effect11.mapError(decodeOutcome(statement.name, writes)),
          Effect11.result
        );
      }
      const returned = answers.slice(offset, offset + slots);
      yield* recorder.server(statement.name, serverTime3(returned));
      const outcome = yield* decodePart(part, returned, wrapped);
      if (Result.isSuccess(outcome) && Array.isArray(outcome.success)) {
        yield* recorder.rows(statement.name, outcome.success.length);
      }
      return outcome;
    })
  );
};
var makePipeline = (transport) => (given, options) => {
  const statements = given;
  if (statements.length === 0)
    return Effect11.succeed([]);
  const names = statements.map(({ statement }) => statement.name);
  const name2 = `pipeline(${names.join(", ")})`;
  const sql = statements.map(({ statement }) => statement.sql).join("\n");
  const sources = [
    ...new Set(
      statements.flatMap(({ statement }) => statement.sources ?? [])
    )
  ];
  const wrapped = options?.each === "transaction";
  return traced(
    name2,
    sql,
    sources,
    void 0,
    false,
    recording(
      "pipeline",
      name2,
      (recorder) => Effect11.gen(function* () {
        const request = yield* recorder.encode(
          Effect11.gen(function* () {
            const joined = yield* joinWith(
              statements.map(({ statement, input }) => ({
                statement,
                bindings: Effect11.suspend(
                  () => encode(statement, input)
                )
              })),
              {
                mode: "query",
                refuseTransactional: wrapped,
                ...wrapped && { wrap }
              }
            );
            for (const {
              statement,
              bindings
            } of joined.parts) {
              yield* checkValues(
                bindings,
                () => statement.name,
                options
              );
            }
            return joined;
          })
        );
        const answers = yield* recorder.wait(
          Effect11.tryPromise({
            try: (signal) => transport.send(request, signal),
            catch: (cause) => new StatementRequestError({
              statement: name2,
              message: requestErrorText(cause),
              cause
            })
          })
        );
        return yield* recorder.decode(
          decodeAnswers(request, answers, wrapped, recorder)
        );
      })
    ),
    {
      names,
      outcome: (outcomes, index) => {
        const outcome = outcomes[index];
        return outcome !== void 0 && Result.isFailure(outcome) ? outcome.failure._tag : "success";
      }
    }
  ).pipe(
    Effect11.map((outcomes) => outcomes)
  );
};

// src/client/stream.ts
import {
  Cause as Cause3,
  Clock as Clock3,
  Duration as Duration7,
  Effect as Effect12,
  Exit as Exit3,
  Metric as Metric2,
  Schema as Schema4,
  Scope,
  Stream as Stream5
} from "effect";
import { UnavailableFeatureError as UnavailableFeatureError4, UnsupportedFeatureError as UnsupportedFeatureError4 } from "surrealdb";
var makeStream = (transport) => (statement, ...args) => {
  const { name: name2, sql, result, slots, valueSlot } = statement;
  const index = valueSlot - 1;
  const writes = changesOf([statement]);
  const input = args[0] ?? {};
  const decodeRow = Schema4.decodeUnknownEffect(result.value);
  const classifyError = (cause) => cause instanceof UnsupportedFeatureError4 || cause instanceof UnavailableFeatureError4 ? new StatementUnsupported({
    statement: name2,
    feature: "stream",
    message: "the connection does not support streaming queries",
    cause
  }) : classify(
    name2,
    (reason) => declarer([statement], reason),
    cause
  );
  return Stream5.unwrap(
    Effect12.gen(function* () {
      const recorder = yield* recordingScoped("stream", name2);
      const started = yield* Clock3.currentTimeNanos;
      let outcome = "success";
      let rows = 0;
      let server;
      yield* Effect12.addFinalizer(
        (exit) => Effect12.gen(function* () {
          yield* recorder.server(name2, server);
          yield* recorder.rows(name2, rows);
          const label = Exit3.hasInterrupts(exit) ? "interrupted" : outcome;
          yield* Effect12.annotateCurrentSpan(
            "db.response.returned_rows",
            rows
          );
          if (label !== "success" && label !== "interrupted")
            yield* Effect12.annotateCurrentSpan(
              "error.type",
              label
            );
          yield* Metric2.update(
            Metric2.withAttributes(metrics.runs, {
              statement: name2,
              outcome: label
            }),
            1
          );
          yield* Metric2.update(
            Metric2.withAttributes(metrics.duration, {
              statement: name2
            }),
            Duration7.nanos(
              (yield* Clock3.currentTimeNanos) - started
            )
          );
        })
      );
      const countError = (error) => Effect12.sync(() => {
        if (!Cause3.isDone(error)) outcome = error._tag;
      });
      const bindings = yield* recorder.encode(
        Effect12.gen(function* () {
          if (result.ast.checks !== void 0 || result.ast.encoding !== void 0) {
            return yield* Effect12.fail(
              new StatementUnsupported({
                statement: name2,
                feature: "stream",
                message: "stream result must be a plain Schema.Array of rows without array-wide checks or transformations"
              })
            );
          }
          const encoded = yield* encode(statement, input);
          yield* checkValues(encoded, () => name2, void 0);
          return encoded;
        })
      ).pipe(Effect12.tapError(countError));
      const request = {
        mode: "query",
        sql,
        bindings,
        parts: [requestPart(statement, bindings, 0, slots)]
      };
      const scope = yield* Scope.Scope;
      const sourceScope = yield* Scope.fork(scope, "sequential");
      const signal = yield* Effect12.abortSignal;
      const frames = Stream5.fromAsyncIterable(
        {
          async *[Symbol.asyncIterator]() {
            yield* transport.stream(request, signal);
          }
        },
        classifyError
      );
      const pull = yield* Stream5.toPull(frames).pipe(
        Effect12.provideService(Scope.Scope, sourceScope)
      );
      const nextFrame = recorder.pull(pull);
      const completed = /* @__PURE__ */ new Set();
      const none = /* @__PURE__ */ new Set();
      let collateral;
      const makeDecodeError = (slot, message) => new StatementDecodeError({
        statement: name2,
        slot,
        committed: false,
        message
      });
      const decodeError = (error) => {
        if (writes === "none" || !(error instanceof StatementDecodeError))
          return error;
        const committed = completed.size === slots;
        return new StatementWriteOutcomeError({
          request: name2,
          cause: new StatementDecodeError({
            statement: name2,
            slot: error.slot,
            committed,
            message: error.message + (committed ? committedNote(writes) : ". The stream ended before the write outcome was acknowledged. Read the data back before replaying")
          })
        });
      };
      const validate = (slot, value) => {
        const values = [];
        values[slot] = value;
        return recorder.decode(decode(statement, values, 0, "none")).pipe(Effect12.mapError(decodeError));
      };
      const checkedFrame = nextFrame.pipe(
        Effect12.catchIf(
          Cause3.isDone,
          (end2) => Effect12.gen(function* () {
            if (collateral !== void 0)
              return yield* Effect12.fail(
                classifyError(collateral.error)
              );
            yield* countOf(
              name2,
              Array.from(completed),
              slots,
              "none"
            ).pipe(Effect12.mapError(decodeError));
            return yield* Effect12.fail(end2);
          })
        )
      );
      const nextRow = Effect12.gen(function* () {
        while (true) {
          const [frame] = yield* checkedFrame;
          const { slot } = frame;
          if ((frame.kind === "done" || frame.kind === "error") && frame.server !== void 0) {
            server = Duration7.sum(
              server ?? Duration7.zero,
              frame.server
            );
          }
          if (frame.kind === "error") {
            if (!isCollateralFailure(frame.error))
              return yield* Effect12.fail(
                classifyError(frame.error)
              );
            collateral ??= frame;
          }
          if (collateral !== void 0) continue;
          if (!Number.isInteger(slot) || slot < 0 || slot >= slots || completed.has(slot)) {
            return yield* Effect12.fail(
              decodeError(
                makeDecodeError(
                  0,
                  `unexpected stream frame for result ${slot + 1} of ${slots}`
                )
              )
            );
          }
          if (frame.kind === "done") {
            completed.add(slot);
            if (slot === index ? rows === 0 : !none.has(slot))
              yield* validate(slot, []);
          } else if (frame.kind === "value") {
            if (slot === index || frame.value !== void 0)
              yield* validate(slot, frame.value);
            none.add(slot);
          } else if (frame.kind === "row") {
            if (slot !== index) {
              yield* validate(slot, [frame.value]);
              continue;
            }
            const row = yield* recorder.decode(
              decodeRow(frame.value, {
                onExcessProperty: "error"
              })
            ).pipe(
              Effect12.mapError(
                (error) => decodeError(
                  makeDecodeError(
                    valueSlot,
                    codecIssueText(
                      error.issue,
                      result.value.ast
                    )
                  )
                )
              )
            );
            rows++;
            return [row];
          }
        }
      }).pipe(Effect12.tapError(countError));
      return Stream5.fromPull(Effect12.succeed(nextRow));
    })
  ).pipe(
    withClientStreamSpan(name2, {
      kind: "client",
      attributes: {
        "db.system.name": "surrealdb",
        "db.operation.name": name2,
        "db.query.text": sql,
        ...statement.sources === void 0 || statement.sources.length === 0 ? {} : { "code.file.path": statement.sources.join(", ") },
        ...statement.variant === void 0 ? {} : {
          "effect_surrealkit.statement.variant": statement.variant
        }
      }
    })
  );
};

// src/client/client.ts
var bind = (statement, ...input) => ({
  statement,
  input: input[0] ?? {}
});
var SurrealClient = class extends Context3.Service()(
  "effect-surrealkit/SurrealClient"
) {
};
var make2 = (db) => makeWith(sdkTransport(db));
var makeRun = (transport) => (statement, ...args) => {
  const input = args[0] ?? {};
  const options = args[1];
  const writes = changesOf([statement]);
  return traced(
    statement.name,
    statement.sql,
    statement.sources,
    statement.variant,
    true,
    recording(
      "run",
      statement.name,
      (recorder) => Effect13.gen(function* () {
        const request = yield* recorder.encode(
          Effect13.gen(function* () {
            const bindings = yield* encode(statement, input);
            yield* checkValues(
              bindings,
              () => statement.name,
              options
            );
            return {
              mode: "query",
              sql: statement.sql,
              bindings,
              parts: [
                requestPart(
                  statement,
                  bindings,
                  0,
                  statement.slots
                )
              ]
            };
          })
        );
        const results = yield* sending(
          recorder.wait(
            Effect13.tryPromise({
              try: (signal) => transport.collect(request, signal),
              catch: (cause) => classify(
                statement.name,
                (reason) => declarer([statement], reason),
                cause
              )
            })
          ),
          options
        );
        yield* recorder.server(statement.name, void 0);
        const decoded = yield* recorder.decode(
          Effect13.gen(function* () {
            const slots = yield* countOf(
              statement.name,
              results,
              statement.slots,
              writes
            );
            return yield* decode(statement, slots, 0, writes);
          }).pipe(
            Effect13.mapError(
              decodeOutcome(statement.name, writes)
            )
          )
        );
        if (Array.isArray(decoded))
          yield* recorder.rows(statement.name, decoded.length);
        return decoded;
      })
    )
  );
};
var makeTransaction = (transport) => (given, options) => {
  const statements = given;
  const name2 = `transaction(${statements.map(({ statement }) => statement.name).join(", ")})`;
  const sql = statements.map(({ statement }) => statement.sql).join("\n");
  const sources = [
    ...new Set(
      statements.flatMap(({ statement }) => statement.sources ?? [])
    )
  ];
  const descriptors = statements.map(({ statement }) => statement);
  const writes = changesOf(descriptors);
  return traced(
    name2,
    sql,
    sources,
    void 0,
    false,
    recording(
      "transaction",
      name2,
      (recorder) => Effect13.gen(function* () {
        if (statements.length === 0) return [];
        const request = yield* recorder.encode(
          Effect13.gen(function* () {
            const joined = yield* joinWith(
              statements.map(({ statement, input }) => ({
                statement,
                bindings: Effect13.suspend(
                  () => encode(statement, input)
                )
              })),
              { mode: "atomic", refuseTransactional: true }
            );
            for (const {
              statement,
              bindings
            } of joined.parts) {
              yield* checkValues(
                bindings,
                () => statement.name,
                options
              );
            }
            return joined;
          })
        );
        const results = yield* sending(
          recorder.wait(
            Effect13.tryPromise({
              try: (signal) => transport.collect(request, signal),
              catch: (cause) => classify(
                name2,
                (reason) => declarer(descriptors, reason),
                cause
              )
            })
          ),
          options
        );
        return yield* recorder.decode(
          Effect13.gen(function* () {
            const slots = yield* countOf(
              name2,
              results,
              request.parts.reduce(
                (total, part) => total + part.slots,
                0
              ),
              writes
            );
            const decoded = [];
            for (const { statement, offset } of request.parts) {
              yield* recorder.server(
                statement.name,
                void 0
              );
              const value = yield* decode(
                statement,
                slots,
                offset,
                writes
              );
              if (Array.isArray(value))
                yield* recorder.rows(
                  statement.name,
                  value.length
                );
              decoded.push(value);
            }
            return decoded;
          }).pipe(Effect13.mapError(decodeOutcome(name2, writes)))
        );
      })
    )
  );
};
var makeWith = (transport) => ({
  run: makeRun(transport),
  transaction: makeTransaction(transport),
  pipeline: makePipeline(transport),
  withTransaction: makeWithTransaction(transport),
  bulk: makeBulk({ transport }),
  stream: makeStream(transport),
  ...makeLive(transport)
});
var layer = (db) => Layer.succeed(SurrealClient, make2(db));
var run = (statement, ...args) => Effect13.flatMap(
  Effect13.service(SurrealClient),
  (client) => client.run(statement, ...args)
);
var transaction = (statements, options) => Effect13.flatMap(
  Effect13.service(SurrealClient),
  (client) => client.transaction(statements, options)
);
var pipeline = (statements, options) => Effect13.flatMap(
  Effect13.service(SurrealClient),
  (client) => client.pipeline(statements, options)
);
var withTransaction = (effect, options) => Effect13.flatMap(
  Effect13.service(SurrealClient),
  (client) => withTransactionContext(client, effect, options)
);
var stream = (statement, ...input) => Stream6.unwrap(
  Effect13.map(
    Effect13.service(SurrealClient),
    (client) => client.stream(statement, ...input)
  )
);

export {
  StatementEncodeError,
  StatementScopeError,
  StatementRequestError,
  StatementThrown,
  StatementUnexpectedThrow,
  StatementConflict,
  StatementDecodeError,
  StatementEmptyResult,
  StatementWriteOutcomeError,
  StatementUnsupported,
  TransactionOutcomeUnknown,
  BulkWriteError,
  LiveQueryClosed,
  timed,
  metrics,
  bind,
  SurrealClient,
  make2 as make,
  makeWith,
  layer,
  run,
  transaction,
  pipeline,
  withTransaction,
  stream
};
//# sourceMappingURL=chunk-RT5I7YT6.js.map