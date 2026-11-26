import {
  renameParameterTokens,
  scanParameters
} from "./chunk-6LS7V54M.js";
import {
  assertBindingName,
  make
} from "./chunk-Q5N5NWCM.js";
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
var StatementIndexConflict = class extends Data.TaggedError("StatementIndexConflict") {
  get message() {
    return `\`${this.statement}\` would duplicate a value of the unique index \`${this.index}\``;
  }
  toJSON() {
    const { _tag, statement, index, message } = this;
    return { _tag, statement, index, message };
  }
};
var StatementRecordExists = class extends Data.TaggedError(
  "StatementRecordExists"
) {
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
var WatchQueryClosed = class extends Data.TaggedError("WatchQueryClosed") {
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
  Scope,
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
var start = (name2, options) => Effect2.gen(function* () {
  const span = yield* Effect2.makeSpan(name2, options);
  const clock = yield* Clock.Clock;
  const timingEnabled = yield* References.TracerTimingEnabled;
  return { span, clock, timingEnabled };
});
var withClientSpan = (name2, options) => (effect) => Effect2.acquireUseRelease(
  start(name2, options),
  ({ span }) => effect.pipe(Effect2.withParentSpan(span)),
  ({ span, clock, timingEnabled }, exit) => end(span, exit, clock, timingEnabled)
);
var withClientStreamSpan = (name2, options) => (stream2) => Stream.fromChannel(
  Channel.fromTransformBracket(
    Effect2.fnUntraced(function* (upstream, _scope, channelScope) {
      const { span, streamScope } = yield* Effect2.uninterruptible(
        Effect2.gen(function* () {
          const { span: span2, clock, timingEnabled } = yield* start(
            name2,
            options
          );
          const streamScope2 = yield* Scope.make("sequential");
          yield* Scope.addFinalizerExit(
            channelScope,
            (exit) => Scope.close(streamScope2, exit).pipe(
              Effect2.withParentSpan(span2),
              Effect2.ensuring(
                end(
                  span2,
                  exit,
                  clock,
                  timingEnabled
                )
              )
            )
          );
          return { span: span2, streamScope: streamScope2 };
        })
      );
      const channel = Stream.toChannel(stream2).pipe(
        Channel.provideService(Tracer.ParentSpan, span)
      );
      return yield* Channel.toTransform(channel)(
        upstream,
        streamScope
      );
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
    const start2 = yield* Clock2.currentTimeNanos;
    onStart?.();
    return yield* restore(effect).pipe(
      Effect3.ensuring(
        Effect3.gen(function* () {
          save(
            Duration.nanos(
              (yield* Clock2.currentTimeNanos) - start2
            )
          );
        })
      )
    );
  })
);
var startRecording = (kind, name2) => Effect3.gen(function* () {
  const start2 = yield* Clock2.currentTimeNanos;
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
      (yield* Clock2.currentTimeNanos) - start2
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

// src/client/watch-query.ts
import { Cause as Cause2, Deferred, Duration as Duration3, Effect as Effect7, Queue as Queue2, Stream as Stream3 } from "effect";

// src/client/internal/classify.ts
import {
  AuthenticationError,
  ExpressionError,
  InvalidSessionError,
  NotAllowedError,
  NotFoundError
} from "surrealdb";
var causedBy = (cause, matches) => {
  const visited = /* @__PURE__ */ new Set();
  for (let error = cause; error instanceof Error && !visited.has(error); error = error.cause) {
    if (matches(error)) return true;
    visited.add(error);
  }
  return false;
};
var isAuthenticationFailure = (cause) => causedBy(
  cause,
  (error) => error instanceof AuthenticationError || error instanceof NotAllowedError && error.details?.kind === "Auth"
);
var isClosedSession = (cause) => causedBy(
  cause,
  (error) => error instanceof InvalidSessionError || error instanceof NotFoundError && error.details?.kind === "Session"
);
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
var declaredBy = (statements, reason) => {
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
var duplicateMessage = /^Database index `[\s\S]+` already contains [\s\S]+, with record `[\s\S]+`$/u;
var isIndexDuplicate = (error) => typeof error.kind === "string" && error.kind !== "Thrown" && duplicateMessage.test(error.message);
var conflictingIndex = (error, declared) => {
  if (!isIndexDuplicate(error)) return;
  const { message } = error;
  let found;
  for (const index of declared) {
    if (message.startsWith(
      `Database index \`${index}\` already contains `
    ) && (found === void 0 || index.length > found.length)) {
      found = index;
    }
  }
  return found;
};
var isRecordExists = (error) => {
  if (error.kind !== "AlreadyExists" || isIndexDuplicate(error)) return false;
  const { details } = error;
  return typeof details === "object" && details?.kind === "Record";
};
var indexDeclarer = (statements, index) => {
  const names = [
    ...new Set(
      statements.filter((statement) => statement.uniqueIndexes?.includes(index)).map((statement) => statement.name)
    )
  ];
  return names.length === 1 ? names[0] : `one of ${names.map((name2) => `\`${name2}\``).join(", ")}`;
};
var classify = (name2, statements, cause) => {
  const declared = new Set(
    statements.flatMap((statement) => statement.uniqueIndexes ?? [])
  );
  let unexpected;
  for (let error = cause; error instanceof Error; error = error.cause) {
    const { isTransactionConflict, kind } = error;
    if (kind === "Thrown") {
      const reason = error.message.startsWith(thrownPrefix) ? error.message.slice(thrownPrefix.length) : error.message;
      const declarer = declaredBy(statements, reason);
      if (declarer !== void 0) {
        return new StatementThrown({ ...declarer, reason });
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
    if (isIndexDuplicate(error)) {
      const index = conflictingIndex(error, declared);
      if (index !== void 0) {
        return new StatementIndexConflict({
          statement: indexDeclarer(statements, index),
          index,
          cause
        });
      }
      continue;
    }
    if (isRecordExists(error)) {
      return new StatementRecordExists({
        statement: name2,
        message: `\`${name2}\` tried to create a record whose id already exists`,
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

// src/client/live.ts
import { Effect as Effect6, Queue, Schema as Schema2, Stream as Stream2 } from "effect";
import {
  ConfigurationError,
  UnavailableFeatureError,
  UnsupportedFeatureError
} from "surrealdb";

// src/client/internal/encode.ts
import { Effect as Effect4, Schema, SchemaAST } from "effect";

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
          "negative zero, which surrealdb.js 2.1.1 encodes as positive zero"
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
var encode = (statement, input) => Effect4.forEach(
  Object.entries(statement.params),
  ([name2, codec]) => Schema.encodeUnknownEffect(codec)(input[name2]).pipe(
    Effect4.map((value) => [name2, value]),
    Effect4.mapError(
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
).pipe(Effect4.map((entries) => Object.fromEntries(entries)));
var checkValues = (bindings, owner, options) => {
  if (options?.unsafeSkipValueCheck === true) return Effect4.void;
  for (const [binding, value] of Object.entries(bindings)) {
    const found = valueProblem(value);
    if (found !== void 0) {
      return Effect4.fail(
        new StatementEncodeError({
          statement: owner(binding),
          binding,
          path: found.path,
          message: `${pathText(binding, found.path)} is ${found.problem}; nothing was sent`
        })
      );
    }
  }
  return Effect4.void;
};

// src/client/internal/join.ts
import { Effect as Effect5 } from "effect";
var planRenames = (statements) => Effect5.gen(function* () {
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
      return yield* Effect5.fail(
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
      return yield* Effect5.fail(
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
        return yield* Effect5.fail(
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
var joinWith = (statements, options) => Effect5.gen(function* () {
  if (options.refuseTransactional) {
    const own = statements.find(
      ({ statement }) => statement.transactional
    )?.statement;
    if (own !== void 0)
      return yield* Effect5.fail(
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
        return yield* Effect5.fail(
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

// src/client/live.ts
var unsupported = (statement, cause) => new StatementUnsupported({
  feature: "live query",
  statement,
  message: "the connection cannot listen for live queries",
  ...cause !== void 0 && { cause }
});
var requestError = (statement, cause) => cause instanceof UnsupportedFeatureError || cause instanceof UnavailableFeatureError || cause instanceof ConfigurationError && cause.isLiveQueryNotSupported ? unsupported(statement, cause) : new StatementRequestError({
  statement,
  message: requestErrorText(cause),
  cause
});
var closed = (statement, reason) => new LiveQueryClosed({
  statement,
  reason,
  message: reason === "killed" ? `the engine killed live query \`${statement}\`` : `the connection for live query \`${statement}\` closed`
});
var liveIterator = (handle, onError) => Effect6.try({
  try: () => handle.messages[Symbol.asyncIterator](),
  catch: onError
});
var consumeFrames = (statement, iterator, consume, onError) => Effect6.forever(
  Effect6.gen(function* () {
    const frame = yield* Effect6.tryPromise({
      try: () => iterator.next(),
      catch: onError
    });
    if (frame.done)
      return yield* Effect6.fail(closed(statement, "disconnected"));
    const { action, id, value } = frame.value;
    if (action === "KILLED")
      return yield* Effect6.fail(closed(statement, "killed"));
    yield* consume({ action, id, value });
  })
);
var consumeLive = (statement, handle, consume, onError) => liveIterator(handle, onError).pipe(
  Effect6.flatMap(
    (iterator) => consumeFrames(statement, iterator, consume, onError)
  )
);
var decodeField = (statement, field, codec, value) => Schema2.decodeUnknownEffect(codec)(value, {
  onExcessProperty: "error"
}).pipe(
  Effect6.mapError(
    (error) => new StatementDecodeError({
      statement,
      slot: 1,
      committed: false,
      message: `live event ${field}: ${codecIssueText(error.issue, codec.ast)}`
    })
  )
);
var changes = (statement, handle) => Effect6.gen(function* () {
  const disconnected = () => closed(statement, "disconnected");
  const iterator = yield* liveIterator(handle, disconnected);
  const queue = yield* Queue.unbounded();
  yield* Effect6.addFinalizer(() => Queue.shutdown(queue));
  yield* Effect6.forkScoped(
    consumeFrames(
      statement,
      iterator,
      (frame) => Queue.offer(queue, frame),
      disconnected
    ).pipe(Effect6.catch((error) => Queue.fail(queue, error))),
    { startImmediately: true }
  );
  return Stream2.fromQueue(queue);
});
var register = (open, descriptor, input, connectionSignal) => {
  const { name: name2, sql } = descriptor;
  const operation = `live(${name2})`;
  return recording(
    "run",
    operation,
    (recorder) => Effect6.gen(function* () {
      const bindings = yield* Effect6.interruptible(
        recorder.encode(
          encode(descriptor, input).pipe(
            Effect6.tap(
              (encoded) => checkValues(encoded, () => name2, void 0)
            )
          )
        )
      );
      yield* recorder.server(name2, void 0);
      return yield* recorder.wait(
        Effect6.tryPromise({
          try: (signal) => open(
            {
              mode: "query",
              sql,
              bindings,
              parts: [
                requestPart(descriptor, bindings, 0, 1)
              ]
            },
            signal,
            connectionSignal
          ),
          catch: (cause) => requestError(name2, cause)
        })
      );
    })
  ).pipe(withClientSpan(operation, { kind: "client" }));
};
var acquireLive = (transport, statement, input, connectionSignal) => {
  const open = transport.live;
  const { name: name2, sql, params } = statement;
  if (open === void 0) return Effect6.fail(unsupported(name2));
  const descriptor = make({
    name: name2,
    sql,
    params,
    result: Schema2.Unknown,
    writes: false
  });
  return Effect6.acquireRelease(
    register(open, descriptor, input, connectionSignal),
    (subscribed) => kill(name2, subscribed)
  );
};
var kill = (name2, handle) => {
  const operation = `kill(${name2})`;
  return recording(
    "run",
    operation,
    (recorder) => recorder.wait(Effect6.tryPromise(() => handle.kill())).pipe(
      Effect6.catch(
        () => Effect6.logWarning(
          "live query cleanup could not be confirmed"
        ).pipe(Effect6.annotateLogs({ statement: name2 }))
      )
    )
  ).pipe(withClientSpan(operation, { kind: "client" }));
};
var scoped = (transport) => (statement, ...args) => Effect6.gen(function* () {
  const { name: name2 } = statement;
  const input = args[0] ?? {};
  const handle = yield* acquireLive(transport, statement, input);
  const messages = yield* changes(name2, handle);
  return messages.pipe(
    Stream2.mapEffect(
      ({ action, id, value }) => Effect6.gen(function* () {
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
    live: (statement, ...args) => Stream2.unwrap(liveScoped(statement, ...args))
  };
};

// src/client/watch-query.ts
var bindLive = (statement, ...input) => ({ statement, input: input[0] ?? {} });
var closed2 = (statement, reason) => new WatchQueryClosed({
  statement,
  reason,
  message: {
    disconnected: "the observer connection closed",
    "session-closed": "the observer session closed",
    "identity-changed": "the observer session credentials or database selection changed",
    authentication: "the observer session authentication failed or was invalidated",
    "source-overflow": "a live source reported notification overflow"
  }[reason]
});
var intervalOf = (input) => {
  const interval = Duration3.fromInput(input);
  if (interval._tag === "None") return;
  const millis = Duration3.toMillis(interval.value);
  if (Number.isFinite(millis) && millis > 0) return interval.value;
};
var watchFailure = (name2, error) => {
  if (isAuthenticationFailure(error)) return closed2(name2, "authentication");
  if (isClosedSession(error)) return closed2(name2, "session-closed");
  if (causedBy(error, (cause) => cause.name === "LiveQueryOverflowError"))
    return closed2(name2, "source-overflow");
  return error;
};
var sessionIsValid = (transport) => transport.isWatchSessionValid?.() !== false;
var notificationFailure = (name2, cause) => {
  const error = watchFailure(name2, cause);
  return error instanceof WatchQueryClosed ? error : closed2(name2, "disconnected");
};
var newConnectionController = () => new globalThis.AbortController();
var maintain = (name2, transport, sources, interval, read, generation, publish, onFailure) => Effect7.scoped(
  Effect7.gen(function* () {
    const dirty = yield* Queue2.dropping(1);
    const failed = yield* Deferred.make();
    const markDirty = () => Queue2.offerUnsafe(dirty, void 0);
    const invalidate = Effect7.sync(markDirty);
    yield* Effect7.forkScoped(
      Effect7.forever(
        Effect7.sleep(interval).pipe(
          Effect7.andThen(
            Effect7.sync(() => {
              if (sessionIsValid(transport)) markDirty();
              else onFailure(closed2(name2, "session-closed"));
            })
          )
        )
      ),
      { startImmediately: true }
    );
    return yield* Effect7.raceFirst(
      Deferred.await(failed),
      Effect7.gen(function* () {
        const verify = transport.verifyWatchOwner;
        if (verify !== void 0) {
          const verified = yield* Effect7.tryPromise({
            try: verify,
            catch: (cause) => new StatementRequestError({
              statement: name2,
              message: requestErrorText(cause),
              cause
            })
          });
          if (!verified)
            return yield* Effect7.fail(
              new StatementScopeError({
                statement: name2,
                message: "watchQuery requires the connection that owns the session"
              })
            );
        }
        for (const { statement, input } of sources) {
          const handle = yield* acquireLive(
            transport,
            statement,
            input,
            generation.connection.signal
          );
          yield* Effect7.forkScoped(
            consumeLive(
              statement.name,
              handle,
              () => invalidate,
              (cause) => notificationFailure(statement.name, cause)
            ).pipe(
              Effect7.catch(
                (error) => Deferred.fail(failed, error)
              )
            ),
            { startImmediately: true }
          );
        }
        yield* Queue2.poll(dirty);
        yield* Effect7.forever(
          Effect7.suspend(
            () => sessionIsValid(transport) ? read : Effect7.fail(closed2(name2, "session-closed"))
          ).pipe(
            Effect7.tap(
              (value) => Effect7.sync(() => publish(value))
            ),
            Effect7.andThen(Queue2.take(dirty))
          )
        );
      })
    ).pipe(
      Effect7.mapError((error) => watchFailure(name2, error)),
      Effect7.tapError((error) => Effect7.sync(() => onFailure(error)))
    );
  })
);
var observer = (name2, transport, watch, sources, interval, read) => Effect7.gen(function* () {
  const output = yield* Queue2.sliding(1);
  const lifecycle = yield* Queue2.dropping(1);
  let generation;
  let supervised;
  let status;
  let currentPublished = false;
  let stale = false;
  let finished = false;
  const publishStale = () => {
    if (stale) return;
    stale = true;
    Queue2.offerUnsafe(output, { _tag: "Stale" });
  };
  const fail2 = (cause, wasConnected = false) => {
    if (finished) return;
    finished = true;
    if (currentPublished || wasConnected) publishStale();
    Queue2.failCauseUnsafe(output, cause);
  };
  const notify = (event) => {
    if (event === "reconnecting" || event === "disconnected" || event === "session-closed") {
      generation?.connection.abort();
      supervised?.connection.abort();
    }
    if (finished) return;
    if (event === status) return;
    status = event;
    if (event === "connected") {
      generation = {
        ended: Deferred.makeUnsafe(),
        connection: newConnectionController()
      };
    } else {
      const previous = generation;
      generation = void 0;
      if (previous !== void 0)
        Deferred.doneUnsafe(previous.ended, Effect7.void);
      if (event === "reconnecting") publishStale();
      else
        fail2(
          Cause2.fail(closed2(name2, event)),
          previous !== void 0
        );
    }
    Queue2.offerUnsafe(lifecycle, void 0);
  };
  yield* Effect7.acquireRelease(
    Effect7.try({
      try: () => watch(notify),
      catch: () => closed2(name2, "disconnected")
    }),
    (stop) => Effect7.sync(stop)
  );
  yield* Effect7.forkScoped(
    Effect7.forever(
      Effect7.gen(function* () {
        const active = generation;
        if (active === void 0)
          return yield* Queue2.take(lifecycle);
        supervised = active;
        yield* Effect7.raceFirst(
          Deferred.await(active.ended),
          maintain(
            name2,
            transport,
            sources,
            interval,
            read,
            active,
            (value) => {
              if (generation !== active || finished) return;
              if (!sessionIsValid(transport)) {
                notify("session-closed");
                return;
              }
              currentPublished = true;
              stale = false;
              Queue2.offerUnsafe(output, {
                _tag: "Current",
                value,
                generation: active
              });
            },
            (error) => {
              if (generation !== active) return;
              if (error instanceof WatchQueryClosed && error.reason === "session-closed")
                notify("session-closed");
              else fail2(Cause2.fail(error));
            }
          )
        ).pipe(
          Effect7.ensuring(
            Effect7.sync(() => {
              supervised = void 0;
            })
          ),
          Effect7.catchCause(
            (cause) => generation === active ? Effect7.failCause(cause) : Effect7.void
          )
        );
      })
    ).pipe(
      Effect7.catchCause((cause) => Effect7.sync(() => fail2(cause)))
    ),
    { startImmediately: true }
  );
  const emit = (state) => Effect7.suspend(() => {
    if (state._tag === "Stale") return Effect7.succeed(state);
    if (state.generation === generation && !finished) {
      if (sessionIsValid(transport))
        return Effect7.succeed({
          _tag: "Current",
          value: state.value
        });
      notify("session-closed");
    }
    return Queue2.take(output).pipe(Effect7.flatMap(emit));
  });
  const states = Stream3.fromEffectRepeat(
    Queue2.take(output).pipe(Effect7.flatMap(emit))
  );
  return Stream3.concat(
    Stream3.succeed({ _tag: "Loading" }),
    states
  );
});
var makeWatchQuery = (transport, run2) => (statement, options, ...input) => Stream3.unwrap(
  Effect7.gen(function* () {
    const { name: name2, writes } = statement;
    const scopeError2 = (message) => new StatementScopeError({ statement: name2, message });
    if (writes !== false)
      return yield* Effect7.fail(
        scopeError2(
          "watchQuery requires a statement declared with writes: false"
        )
      );
    if (options.sources.length === 0)
      return yield* Effect7.fail(
        scopeError2(
          "watchQuery requires at least one live source"
        )
      );
    const interval = intervalOf(
      options.reconcileEvery ?? "30 seconds"
    );
    if (interval === void 0)
      return yield* Effect7.fail(
        scopeError2(
          "watchQuery reconcileEvery must be positive and finite"
        )
      );
    const watch = transport.watch;
    if (watch === void 0 || transport.live === void 0)
      return yield* Effect7.fail(
        new StatementUnsupported({
          feature: "live query",
          statement: name2,
          message: "watchQuery requires live queries and connection lifecycle events"
        })
      );
    return yield* observer(
      name2,
      transport,
      watch,
      options.sources,
      interval,
      run2(statement, ...input)
    );
  })
);

// src/client/client.ts
import {
  Context as Context3,
  Effect as Effect14,
  Layer,
  Stream as Stream7
} from "effect";

// src/client/bulk.ts
import {
  Cause as Cause3,
  Duration as Duration6,
  Effect as Effect11,
  Pull,
  Stream as Stream5
} from "effect";
import {
  AuthenticationError as AuthenticationError2,
  ConnectionUnavailableError as ConnectionUnavailableError2,
  ExpressionError as ExpressionError2,
  InvalidSessionError as InvalidSessionError3,
  MissingNamespaceDatabaseError as MissingNamespaceDatabaseError2,
  ServerError as ServerError2,
  UnavailableFeatureError as UnavailableFeatureError3,
  UnsupportedFeatureError as UnsupportedFeatureError3,
  UnsupportedVersionError
} from "surrealdb";

// src/client/interactive.ts
import { Context as Context2, Duration as Duration4, Effect as Effect9, Exit as Exit2, Stream as Stream4 } from "effect";
import {
  ConnectionUnavailableError,
  InvalidSessionError as InvalidSessionError2,
  MissingNamespaceDatabaseError,
  ServerError,
  UnavailableFeatureError as UnavailableFeatureError2,
  UnsupportedFeatureError as UnsupportedFeatureError2
} from "surrealdb";

// src/client/internal/decode.ts
import { Effect as Effect8, Schema as Schema3 } from "effect";
var changesOf = (statements) => statements.some((statement) => statement.writes === true) ? "writes" : statements.every((statement) => statement.writes === false) ? "none" : "maybe";
var committedNote = (changes2) => changes2 === "writes" ? ". The request succeeded and its writes are committed, so do not send it again to retry" : changes2 === "maybe" ? ". The request succeeded and may have written: it is not known whether it writes, and any writes it made are committed; read the data back before sending it again" : "";
var decodeOutcome = (request, changes2) => (error) => changes2 !== "none" && error instanceof StatementDecodeError ? new StatementWriteOutcomeError({ request, cause: error }) : error;
var decode = (statement, results, offset, writes) => {
  const at = offset + statement.valueSlot - 1;
  for (let slot = offset; slot < offset + statement.slots; slot++) {
    if (slot !== at && results[slot] !== void 0) {
      return Effect8.fail(
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
    return Effect8.fail(
      new StatementEmptyResult({
        statement: statement.name,
        slot: statement.valueSlot,
        message: `\`${statement.name}\` returned nothing, although it returns a row whenever it applies: the session may lack permission for it (SurrealDB reports a denied write as an empty result, without an error), and it wrote nothing`
      })
    );
  }
  return Schema3.decodeUnknownEffect(statement.result)(value, {
    onExcessProperty: "error"
  }).pipe(
    Effect8.mapError(
      (error) => new StatementDecodeError({
        statement: statement.name,
        slot: statement.valueSlot,
        committed: writes !== "none",
        message: `${codecIssueText(error.issue, statement.result.ast)}${committedNote(writes)}`
      })
    )
  );
};
var countOf = (name2, results, expected, writes) => Array.isArray(results) && results.length === expected ? Effect8.succeed(results) : Effect8.fail(
  new StatementDecodeError({
    statement: name2,
    slot: 0,
    committed: writes !== "none",
    message: `expected ${expected} results, one per SurrealQL statement, and received ${Array.isArray(results) ? results.length : "no list"}${committedNote(writes)}`
  })
);

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
var unsupported2 = (cause) => new StatementUnsupported({
  feature: "interactive transaction",
  message: "the connection does not support interactive transactions",
  ...cause !== void 0 && { cause }
});
var requestError2 = (cause) => new StatementRequestError({
  statement: name,
  message: requestErrorText(cause),
  cause
});
var commitUnknown = (cause) => new TransactionOutcomeUnknown({
  message: "The transaction commit was not acknowledged. Read back the data before retrying.",
  cause
});
var commitError = (cause) => {
  const classified = classify(name, [], cause);
  if (classified instanceof StatementConflict) return classified;
  if (cause instanceof ServerError || cause instanceof ConnectionUnavailableError || cause instanceof InvalidSessionError2 || cause instanceof MissingNamespaceDatabaseError || cause instanceof UnsupportedFeatureError2 || cause instanceof UnavailableFeatureError2)
    return requestError2(cause);
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
  Effect9.interruptible(
    Effect9.tryPromise({
      try: () => handle.commit(),
      catch: commitError
    })
  ).pipe(
    Effect9.timeoutOrElse({
      duration: commitDeadline,
      orElse: () => Effect9.fail(
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
  Effect9.tryPromise({
    try: () => handle.cancel(),
    catch: (cause) => cause
  })
).pipe(
  Effect9.catch(
    () => Effect9.annotateCurrentSpan("effect_surrealkit.cancel_failed", true)
  )
);
var serverTime = (answers) => {
  let total;
  for (const { server } of answers) {
    if (server !== void 0)
      total = total === void 0 ? server : Duration4.sum(total, server);
  }
  return total;
};
var execute = (send, requestName, statements, options) => recording(
  "interactive",
  requestName,
  (recorder) => Effect9.gen(function* () {
    if (statements.length === 0) return [];
    const request = yield* recorder.encode(
      Effect9.gen(function* () {
        const request2 = yield* joinWith(
          statements.map(({ statement, input }) => ({
            statement,
            bindings: Effect9.suspend(
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
      statements.map(({ statement }) => statement),
      cause
    );
    const answers = yield* recorder.wait(
      Effect9.tryPromise({
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
      yield* Effect9.forEach(request.parts, recordServer, {
        discard: true
      });
      return yield* Effect9.fail(failureOf2(failure.error));
    }
    return yield* recorder.decode(
      Effect9.gen(function* () {
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
      Effect9.map(([value]) => value)
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
  Effect9.tryPromise({
    try: (signal) => begin(signal),
    catch: (cause) => cause instanceof UnsupportedFeatureError2 || cause instanceof UnavailableFeatureError2 ? unsupported2(cause) : requestError2(cause)
  })
);
var attempt = (begin, body) => Effect9.uninterruptibleMask(
  (restore) => Effect9.gen(function* () {
    const handle = yield* beginTransaction(begin);
    let open = true;
    const send = (request, signal) => open ? handle.send(request, signal) : Promise.reject(
      new StatementScopeError({
        statement: request.parts[0]?.statement.name ?? name,
        message: "the interactive transaction has already ended"
      })
    );
    const tx = transactionClient(send);
    const result = yield* Effect9.exit(
      restore(
        Effect9.suspend(() => body(tx)).pipe(
          Effect9.provideService(activeTransaction, true)
        )
      )
    );
    open = false;
    if (Exit2.isFailure(result)) {
      yield* cancel(handle);
      return yield* Effect9.failCause(result.cause);
    }
    yield* commit(handle).pipe(
      Effect9.tapError(
        (error) => error instanceof TransactionOutcomeUnknown ? Effect9.void : cancel(handle)
      )
    );
    return result.value;
  })
);
var makeWithTransaction = (transport) => (body, options) => Effect9.gen(function* () {
  if (yield* activeTransaction)
    return yield* Effect9.fail(scopeError(name));
  if (transport.begin === void 0)
    return yield* Effect9.fail(unsupported2());
  const run2 = attempt(transport.begin, body);
  const retry = options?.retry;
  if (retry === void 0) return yield* run2;
  return yield* Effect9.retry(run2, {
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
  pipeline: () => Effect9.fail(scopeError("pipeline")),
  withTransaction: () => Effect9.fail(scopeError(name)),
  stream: () => Stream4.fail(scopeError("stream")),
  live: () => Stream4.fail(scopeError("live")),
  liveScoped: () => Effect9.fail(scopeError("liveScoped")),
  watchQuery: () => Stream4.fail(scopeError("watchQuery"))
});
var withTransactionContext = (client, effect, options) => client.withTransaction(
  (tx) => Effect9.provideService(effect, SurrealClient, contextClient(tx)),
  options
);

// src/client/internal/transport.ts
import { Duration as Duration5, Effect as Effect10 } from "effect";
import {
  BoundQuery,
  Surreal,
  SurrealSession,
  Uuid as Uuid2
} from "surrealdb";
var sdkDuration = (value) => {
  const [seconds = 0n, nanos = 0n] = value.toCompact();
  return Duration5.nanos(seconds * 1000000000n + nanos);
};
var responseSlots = (responses) => responses.map((response) => {
  const timing = response.stats === void 0 ? {} : { server: sdkDuration(response.stats.duration) };
  return response.success ? { ok: true, value: response.result, ...timing } : { ok: false, error: response.error, ...timing };
});
var watchConnection = (session, connection) => (notify) => {
  const status = connection.status;
  if (status !== "connected" && status !== "reconnecting") {
    notify("disconnected");
    return () => {
    };
  }
  if (!session.isValid) {
    notify("session-closed");
    return () => {
    };
  }
  const { namespace, database, accessToken } = session;
  const unsubscribe = [
    connection.subscribe("reconnecting", () => notify("reconnecting")),
    connection.subscribe("disconnected", () => notify("disconnected")),
    connection.subscribe("error", (error) => {
      if (connection.status === "reconnecting" && isAuthenticationFailure(error))
        notify("authentication");
    }),
    connection.subscribe("connected", () => {
      if (!session.isValid) notify("session-closed");
      else notify("connected");
    }),
    session.subscribe("using", (selected) => {
      if (selected.namespace !== namespace || selected.database !== database)
        notify("identity-changed");
    }),
    session.subscribe("auth", (tokens) => {
      if (tokens === null) notify("authentication");
      else if (tokens.access !== accessToken)
        notify("identity-changed");
    })
  ];
  notify(status);
  return () => {
    for (const stop of unsubscribe) stop();
  };
};
var waitForLiveCleanup = (cleanup, connectionSignal) => {
  if (connectionSignal === void 0) return cleanup;
  return new Promise((resolve, reject) => {
    const gone = () => resolve();
    if (connectionSignal.aborted) gone();
    else connectionSignal.addEventListener("abort", gone, { once: true });
    void cleanup.then(resolve, reject).finally(() => connectionSignal.removeEventListener("abort", gone));
  });
};
var sdkTransport = (db, owner) => {
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
  const connection = db instanceof Surreal ? db : owner;
  return {
    ...connection !== void 0 && db instanceof SurrealSession && {
      watch: watchConnection(db, connection),
      isWatchSessionValid: () => db.isValid,
      ...db !== connection && {
        verifyWatchOwner: async () => {
          const id = db.session;
          return id !== void 0 && (await connection.sessions()).some(
            (session) => session.toString() === id.toString()
          );
        }
      }
    },
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
      live: async (request, signal, connectionSignal) => {
        signal.throwIfAborted();
        const pending = db.query(request.sql, request.bindings).retry(false);
        const ids = await (connectionSignal === void 0 ? pending : pending.signal(connectionSignal)).collect();
        const [id] = ids;
        if (ids.length !== 1 || !(id instanceof Uuid2))
          throw new LiveRegistrationError("missing-id");
        const killById = async () => {
          const pending2 = db.query("KILL $id;", { id }).retry(false);
          await (connectionSignal === void 0 ? pending2 : pending2.signal(connectionSignal)).collect();
        };
        let attached;
        const killAttached = (subscription) => {
          if (connectionSignal?.aborted)
            return Promise.resolve();
          return waitForLiveCleanup(
            subscription.kill().catch(killById),
            connectionSignal
          );
        };
        try {
          connectionSignal?.throwIfAborted();
          attached = await (connectionSignal !== void 0 && db instanceof SurrealSession ? db.withSignal(connectionSignal).liveOf(id) : liveOf(id));
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
            kill: () => killAttached(subscription)
          };
        } catch (error) {
          if (connectionSignal?.aborted) throw error;
          const cleanup = attached === void 0 ? killById() : killAttached(attached);
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
  Effect10.retry({
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
var streamChunks = (source, size) => Effect11.map(
  Stream5.toPull(Stream5.grouped(source, size)),
  (pull) => pull.pipe(
    Effect11.map(([chunk]) => chunk),
    Pull.catchDone(() => Effect11.succeed(void 0))
  )
);
var iterableChunks = (source, size) => Effect11.gen(function* () {
  let done = false;
  const iterator = yield* Effect11.acquireRelease(
    Effect11.sync(() => source[Symbol.iterator]()),
    (cursor) => Effect11.sync(() => {
      if (!done) cursor.return?.();
    })
  );
  return Effect11.sync(() => {
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
var definiteRejection = (cause) => cause instanceof ServerError2 || cause instanceof AuthenticationError2 || cause instanceof ConnectionUnavailableError2 || cause instanceof ExpressionError2 || cause instanceof InvalidSessionError3 || cause instanceof MissingNamespaceDatabaseError2 || cause instanceof UnavailableFeatureError3 || cause instanceof UnsupportedFeatureError3 || cause instanceof UnsupportedVersionError;
var failureOf = (statement, atomic, cause) => {
  if (cause instanceof StatementScopeError || cause instanceof StatementConflict || cause instanceof TransactionOutcomeUnknown)
    return cause;
  if (!atomic || cause instanceof Error) {
    const classified = classify(statement.name, [statement], cause);
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
      server = server === void 0 ? slot.server : Duration6.sum(server, slot.server);
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
    (recorder) => Effect11.gen(function* () {
      const request = yield* recorder.encode(
        Effect11.gen(function* () {
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
          Effect11.tryPromise({
            try: (signal) => sender.transaction.send(request, signal),
            catch: sendFailure
          })
        );
        const failure = firstFailure(answers);
        if (failure !== void 0) {
          yield* recorder.server(statement.name, serverTime2(answers));
          return yield* Effect11.fail(sendFailure(failure.error));
        }
        raw = answers.map((slot) => slot.ok ? slot.value : void 0);
      } else {
        raw = yield* sending(
          recorder.wait(
            Effect11.tryPromise({
              try: (signal) => sender.transport.collect(request, signal),
              catch: sendFailure
            })
          ),
          options
        );
      }
      return yield* recorder.decode(
        Effect11.gen(function* () {
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
        }).pipe(Effect11.mapError(decodeOutcome(label, writes)))
      );
    })
  ).pipe(
    withClientSpan(label, {
      kind: "client",
      attributes: { "db.system.name": "surrealdb" }
    })
  );
};
var sequential = (sender, job, first, next) => Effect11.gen(function* () {
  const { statement, options, total } = job;
  const atomic = !("transaction" in sender) && statement.slots > 1;
  const results = [];
  let rows = 0;
  for (let chunk = first; chunk !== void 0; chunk = yield* next) {
    const index = results.length;
    yield* options.beforeChunk?.({ index, rows: chunk }) ?? Effect11.void;
    const [result] = yield* submit(sender, job, [chunk], atomic).pipe(
      Effect11.mapError(
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
    }) ?? Effect11.void;
  }
  return { chunks: results.length, rows, results };
});
var batched = (sender, job, first, next) => Effect11.gen(function* () {
  const { options, total } = job;
  const chunks = [];
  for (let chunk = first; chunk !== void 0; chunk = yield* next) {
    yield* options.beforeChunk?.({
      index: chunks.length,
      rows: chunk
    }) ?? Effect11.void;
    chunks.push(chunk);
  }
  const results = yield* submit(sender, job, chunks, true);
  let rows = 0;
  for (const [index, chunk] of chunks.entries()) {
    rows += chunk.length;
    yield* options.onProgress?.({ chunks: index + 1, rows, total }) ?? Effect11.void;
  }
  return { chunks: chunks.length, rows, results };
});
var fromOneShot = (first, next, replay) => {
  const history = [first];
  let finished = false;
  return () => {
    let index = 0;
    const pull = Effect11.suspend(() => {
      const cached = history[index++];
      if (cached !== void 0) return Effect11.succeed(cached);
      if (finished) return Cause3.done();
      return next.pipe(
        Effect11.mapError((error) => new SourceFailure(error)),
        Effect11.flatMap((chunk) => {
          if (chunk === void 0) {
            finished = true;
            return Cause3.done();
          }
          if (replay) history.push(chunk);
          return Effect11.succeed(chunk);
        })
      );
    });
    return Stream5.fromPull(Effect11.succeed(pull));
  };
};
function makeBulk(sender) {
  return (statement, input, options) => {
    const size = options.chunk ?? 500;
    if (!Number.isInteger(size) || size <= 0) {
      return Effect11.die(
        new RangeError("bulk chunk size must be a positive integer")
      );
    }
    if (statement.transactional) {
      return Effect11.fail(
        new StatementScopeError({
          statement: statement.name,
          message: "bulk cannot run a statement with its own BEGIN, COMMIT or CANCEL"
        })
      );
    }
    return Effect11.scoped(
      Effect11.gen(function* () {
        const source = input[options.over];
        const next = Stream5.isStream(source) ? yield* streamChunks(
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
                    Effect11.mapError(
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
          Effect11.catch(
            (error) => {
              if (error instanceof SourceFailure)
                return Effect11.fail(error.error);
              if (!bodyStarted && error instanceof StatementUnsupported)
                return batched(sender, job, first, next);
              return Effect11.fail(error);
            }
          )
        );
      })
    );
  };
}

// src/client/pipeline.ts
import { Duration as Duration7, Effect as Effect12, Result } from "effect";
var wrap = { before: "BEGIN;", after: "COMMIT;" };
var decodePart = ({ statement, slots: expected }, answers, wrapped) => {
  const failed = firstFailure(answers);
  if (failed !== void 0) {
    return Effect12.succeed(
      Result.fail(classify(statement.name, [statement], failed.error))
    );
  }
  const writes = changesOf([statement]);
  return Effect12.gen(function* () {
    const values = answers.map(
      (slot) => slot.ok ? slot.value : void 0
    );
    if (wrapped && (values[0] !== void 0 || values[expected - 1] !== void 0)) {
      return yield* Effect12.fail(
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
    Effect12.mapError(decodeOutcome(statement.name, writes)),
    Effect12.result
  );
};
var serverTime3 = (slots) => {
  let duration;
  for (const { server } of slots) {
    if (server !== void 0)
      duration = Duration7.sum(duration ?? Duration7.zero, server);
  }
  return duration;
};
var decodeAnswers = ({ parts }, answers, wrapped, recorder) => {
  const expected = parts.reduce((total, { slots }) => total + slots, 0);
  const aligned = answers.length === expected;
  return Effect12.forEach(
    parts,
    (part) => Effect12.gen(function* () {
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
          Effect12.mapError(decodeOutcome(statement.name, writes)),
          Effect12.result
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
    return Effect12.succeed([]);
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
      (recorder) => Effect12.gen(function* () {
        const request = yield* recorder.encode(
          Effect12.gen(function* () {
            const joined = yield* joinWith(
              statements.map(({ statement, input }) => ({
                statement,
                bindings: Effect12.suspend(
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
          Effect12.tryPromise({
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
    Effect12.map((outcomes) => outcomes)
  );
};

// src/client/stream.ts
import {
  Cause as Cause4,
  Clock as Clock3,
  Duration as Duration8,
  Effect as Effect13,
  Exit as Exit3,
  Metric as Metric2,
  Schema as Schema4,
  Scope as Scope2,
  Stream as Stream6
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
  }) : classify(name2, [statement], cause);
  return Stream6.unwrap(
    Effect13.gen(function* () {
      const recorder = yield* recordingScoped("stream", name2);
      const started = yield* Clock3.currentTimeNanos;
      let outcome = "success";
      let rows = 0;
      let server;
      yield* Effect13.addFinalizer(
        (exit) => Effect13.gen(function* () {
          yield* recorder.server(name2, server);
          yield* recorder.rows(name2, rows);
          const label = Exit3.hasInterrupts(exit) ? "interrupted" : outcome;
          yield* Effect13.annotateCurrentSpan(
            "db.response.returned_rows",
            rows
          );
          if (label !== "success" && label !== "interrupted")
            yield* Effect13.annotateCurrentSpan(
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
            Duration8.nanos(
              (yield* Clock3.currentTimeNanos) - started
            )
          );
        })
      );
      const countError = (error) => Effect13.sync(() => {
        if (!Cause4.isDone(error)) outcome = error._tag;
      });
      const bindings = yield* recorder.encode(
        Effect13.gen(function* () {
          if (result.ast.checks !== void 0 || result.ast.encoding !== void 0) {
            return yield* Effect13.fail(
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
      ).pipe(Effect13.tapError(countError));
      const request = {
        mode: "query",
        sql,
        bindings,
        parts: [requestPart(statement, bindings, 0, slots)]
      };
      const scope = yield* Scope2.Scope;
      const sourceScope = yield* Scope2.fork(scope, "sequential");
      const signal = yield* Effect13.abortSignal;
      const frames = Stream6.fromAsyncIterable(
        {
          async *[Symbol.asyncIterator]() {
            yield* transport.stream(request, signal);
          }
        },
        classifyError
      );
      const pull = yield* Stream6.toPull(frames).pipe(
        Effect13.provideService(Scope2.Scope, sourceScope)
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
        return recorder.decode(decode(statement, values, 0, "none")).pipe(Effect13.mapError(decodeError));
      };
      const checkedFrame = nextFrame.pipe(
        Effect13.catchIf(
          Cause4.isDone,
          (end2) => Effect13.gen(function* () {
            if (collateral !== void 0)
              return yield* Effect13.fail(
                classifyError(collateral.error)
              );
            yield* countOf(
              name2,
              Array.from(completed),
              slots,
              "none"
            ).pipe(Effect13.mapError(decodeError));
            return yield* Effect13.fail(end2);
          })
        )
      );
      const nextRow = Effect13.gen(function* () {
        while (true) {
          const [frame] = yield* checkedFrame;
          const { slot } = frame;
          if ((frame.kind === "done" || frame.kind === "error") && frame.server !== void 0) {
            server = Duration8.sum(
              server ?? Duration8.zero,
              frame.server
            );
          }
          if (frame.kind === "error") {
            if (!isCollateralFailure(frame.error))
              return yield* Effect13.fail(
                classifyError(frame.error)
              );
            collateral ??= frame;
          }
          if (collateral !== void 0) continue;
          if (!Number.isInteger(slot) || slot < 0 || slot >= slots || completed.has(slot)) {
            return yield* Effect13.fail(
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
              Effect13.mapError(
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
      }).pipe(Effect13.tapError(countError));
      return Stream6.fromPull(Effect13.succeed(nextRow));
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
var make2 = (db, options) => makeWith(sdkTransport(db, options?.connection));
var makeRun = (transport, sdkRetry) => (statement, ...args) => {
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
      (recorder) => Effect14.gen(function* () {
        const request = yield* recorder.encode(
          Effect14.gen(function* () {
            const bindings = yield* encode(statement, input);
            yield* checkValues(
              bindings,
              () => statement.name,
              options
            );
            return {
              mode: "query",
              ...sdkRetry === false && { sdkRetry },
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
            Effect14.tryPromise({
              try: (signal) => transport.collect(request, signal),
              catch: (cause) => classify(
                statement.name,
                [statement],
                cause
              )
            })
          ),
          options
        );
        yield* recorder.server(statement.name, void 0);
        const decoded = yield* recorder.decode(
          Effect14.gen(function* () {
            const slots = yield* countOf(
              statement.name,
              results,
              statement.slots,
              writes
            );
            return yield* decode(statement, slots, 0, writes);
          }).pipe(
            Effect14.mapError(
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
      (recorder) => Effect14.gen(function* () {
        if (statements.length === 0) return [];
        const request = yield* recorder.encode(
          Effect14.gen(function* () {
            const joined = yield* joinWith(
              statements.map(({ statement, input }) => ({
                statement,
                bindings: Effect14.suspend(
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
            Effect14.tryPromise({
              try: (signal) => transport.collect(request, signal),
              catch: (cause) => classify(name2, descriptors, cause)
            })
          ),
          options
        );
        return yield* recorder.decode(
          Effect14.gen(function* () {
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
          }).pipe(Effect14.mapError(decodeOutcome(name2, writes)))
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
  ...makeLive(transport),
  watchQuery: makeWatchQuery(transport, makeRun(transport, false))
});
var layer = (db, options) => Layer.succeed(SurrealClient, make2(db, options));
var run = (statement, ...args) => Effect14.flatMap(
  Effect14.service(SurrealClient),
  (client) => client.run(statement, ...args)
);
var transaction = (statements, options) => Effect14.flatMap(
  Effect14.service(SurrealClient),
  (client) => client.transaction(statements, options)
);
var pipeline = (statements, options) => Effect14.flatMap(
  Effect14.service(SurrealClient),
  (client) => client.pipeline(statements, options)
);
var withTransaction = (effect, options) => Effect14.flatMap(
  Effect14.service(SurrealClient),
  (client) => withTransactionContext(client, effect, options)
);
var stream = (statement, ...input) => Stream7.unwrap(
  Effect14.map(
    Effect14.service(SurrealClient),
    (client) => client.stream(statement, ...input)
  )
);
var watchQuery = (statement, options, ...input) => Stream7.unwrap(
  Effect14.map(
    Effect14.service(SurrealClient),
    (client) => client.watchQuery(statement, options, ...input)
  )
);

export {
  StatementEncodeError,
  StatementScopeError,
  StatementRequestError,
  StatementThrown,
  StatementUnexpectedThrow,
  StatementConflict,
  StatementIndexConflict,
  StatementRecordExists,
  StatementDecodeError,
  StatementEmptyResult,
  StatementWriteOutcomeError,
  StatementUnsupported,
  TransactionOutcomeUnknown,
  BulkWriteError,
  LiveQueryClosed,
  WatchQueryClosed,
  timed,
  metrics,
  bindLive,
  bind,
  SurrealClient,
  make2 as make,
  makeWith,
  layer,
  run,
  transaction,
  pipeline,
  withTransaction,
  stream,
  watchQuery
};
//# sourceMappingURL=chunk-7IAWJOZ5.js.map