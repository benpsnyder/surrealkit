// src/client/errors.ts
import { Data } from "effect";
var StatementEncodeError = class extends Data.TaggedError(
  "StatementEncodeError"
) {
};
var StatementScopeError = class extends Data.TaggedError(
  "StatementScopeError"
) {
};
var StatementRequestError = class extends Data.TaggedError(
  "StatementRequestError"
) {
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
    return `\`${this.statement}\` threw '${this.reason}', which it does not declare`;
  }
};
var StatementConflict = class extends Data.TaggedError("StatementConflict") {
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

// src/client/client.ts
import {
  Clock,
  Context,
  Duration as Duration3,
  Effect,
  Layer,
  Metric,
  Schema
} from "effect";
import { BoundQuery } from "surrealdb";

// src/client/equal.ts
import {
  BoundExcluded,
  BoundIncluded,
  DateTime,
  Decimal,
  Duration,
  FileRef,
  Future,
  Geometry,
  Range,
  RecordId,
  RecordIdRange,
  StringRecordId,
  Table,
  Uuid
} from "surrealdb";
var sameBytes = (a, b) => a.byteLength === b.byteLength && a.every((byte, index) => byte === b[index]);
var isPlain = (value) => {
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};
var sameBound = (a, b, path) => {
  if (a === void 0 || b === void 0) return a === b;
  if (a instanceof BoundIncluded) {
    return b instanceof BoundIncluded && same(a.value, b.value, path);
  }
  if (a instanceof BoundExcluded) {
    return b instanceof BoundExcluded && same(a.value, b.value, path);
  }
  return false;
};
var sameSdkValue = (a, b, path) => {
  if (a instanceof RecordId) {
    return b instanceof RecordId && a.table.name === b.table.name && same(a.id, b.id, path);
  }
  if (a instanceof RecordIdRange) {
    return b instanceof RecordIdRange && a.table.name === b.table.name && sameBound(a.begin, b.begin, path) && sameBound(a.end, b.end, path);
  }
  if (a instanceof Range) {
    return b instanceof Range && sameBound(a.begin, b.begin, path) && sameBound(a.end, b.end, path);
  }
  if (a instanceof Decimal) {
    return b instanceof Decimal && a.toString() === b.toString();
  }
  const leaves2 = [
    DateTime,
    Duration,
    Uuid,
    Table,
    StringRecordId,
    FileRef,
    Future,
    Geometry
  ];
  for (const leaf of leaves2) {
    if (a instanceof leaf) {
      return b instanceof leaf && a.equals(b);
    }
  }
  return void 0;
};
var sameObject = (a, b, path) => {
  if (Array.isArray(a)) {
    return Array.isArray(b) && Object.getPrototypeOf(a) === Array.prototype && Object.getPrototypeOf(b) === Array.prototype && a.length === b.length && a.every((item, index) => same(item, b[index], path));
  }
  if (a instanceof Uint8Array) {
    return b instanceof Uint8Array && Object.getPrototypeOf(a) === Uint8Array.prototype && Object.getPrototypeOf(b) === Uint8Array.prototype && sameBytes(a, b);
  }
  if (a instanceof ArrayBuffer) {
    return b instanceof ArrayBuffer && sameBytes(new Uint8Array(a), new Uint8Array(b));
  }
  if (a instanceof Set) {
    if (!(b instanceof Set) || a.size !== b.size) return false;
    if (Object.getPrototypeOf(a) !== Set.prototype) return false;
    if (Object.getPrototypeOf(b) !== Set.prototype) return false;
    const unmatched = [...b];
    for (const item of a) {
      const at = unmatched.findIndex((other) => same(item, other, path));
      if (at < 0) return false;
      unmatched.splice(at, 1);
    }
    return true;
  }
  const sdk = sameSdkValue(a, b, path);
  if (sdk !== void 0) return sdk;
  if (isPlain(a) && isPlain(b)) {
    if (Object.getOwnPropertySymbols(a).length > 0 || Object.getOwnPropertySymbols(b).length > 0) {
      return false;
    }
    const keys = Object.keys(a);
    const other = Object.keys(b);
    if (keys.length !== other.length) return false;
    const record = a;
    const that = b;
    return keys.every(
      (key) => Object.hasOwn(that, key) && same(record[key], that[key], path)
    );
  }
  return false;
};
var same = (a, b, path) => {
  if (typeof a !== typeof b) return false;
  if (typeof a === "function" || typeof a === "symbol") return false;
  if (typeof a !== "object" || a === null || b === null) {
    return Object.is(a, b);
  }
  if (a === b) return true;
  const other = b;
  if (path.has(a) || path.has(other)) return false;
  path.add(a);
  path.add(other);
  try {
    return sameObject(a, other, path);
  } finally {
    path.delete(a);
    path.delete(other);
  }
};
var sameValue = (a, b) => {
  try {
    return same(a, b, /* @__PURE__ */ new Set());
  } catch {
    return false;
  }
};

// src/client/values.ts
import {
  BoundExcluded as BoundExcluded2,
  BoundIncluded as BoundIncluded2,
  DateTime as DateTime2,
  Decimal as Decimal2,
  Duration as Duration2,
  FileRef as FileRef2,
  Geometry as Geometry2,
  Range as Range2,
  RecordId as RecordId2,
  RecordIdRange as RecordIdRange2,
  StringRecordId as StringRecordId2,
  Table as Table2,
  Uuid as Uuid2
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
  DateTime2,
  Duration2,
  Decimal2,
  Uuid2,
  Geometry2,
  Table2,
  FileRef2,
  StringRecordId2
];
var kindOf = (value) => {
  const proto = Object.getPrototypeOf(value);
  const name = proto?.constructor?.name;
  return typeof name === "string" && name.length > 0 ? `a ${name}` : "an object";
};
var fail = (path, problem) => ({
  path: [...path],
  problem
});
var checkBound = (bound, path, seen) => {
  if (bound === void 0) return void 0;
  if (bound instanceof BoundIncluded2 || bound instanceof BoundExcluded2) {
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
      `${kindOf(value)}, which the SDK sends as its raw bytes; send a Uint8Array`
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
  if (value instanceof RecordId2) {
    path.push("id");
    const problem = check(value.id, path, seen);
    path.pop();
    return problem;
  }
  if (value instanceof RecordIdRange2 || value instanceof Range2) {
    path.push("begin");
    const begin = checkBound(value.begin, path, seen);
    path.pop();
    if (begin !== void 0) return begin;
    path.push("end");
    const end = checkBound(value.end, path, seen);
    path.pop();
    return end;
  }
  for (const leaf of leaves) {
    if (value instanceof leaf) return void 0;
  }
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) {
    return fail(
      path,
      `${kindOf(value)}, which the SDK would send as its own enumerable fields; encode it to a SurrealDB value`
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
  } catch (error) {
    return {
      path: [...path],
      problem: `a value that cannot be read to the end (${error instanceof Error ? error.message : "it threw"})`
    };
  }
};
var pathText = (binding, path) => `$${binding}${path.map(
  (step) => typeof step === "number" ? `[${step}]` : /^[A-Za-z_][A-Za-z0-9_]*$/u.test(step) ? `.${step}` : `[${JSON.stringify(step)}]`
).join("")}`;

// src/client/client.ts
var bind = (statement, ...input) => ({
  statement,
  input: input[0] ?? {}
});
var SurrealClient = class extends Context.Service()(
  "effect-surrealkit/SurrealClient"
) {
};
var thrownPrefix = "An error occurred: ";
var messageOf = (error) => error instanceof Error ? error.message : String(error);
var classify = (name, declaredBy, cause) => {
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
        statement: name,
        message: error.message,
        cause
      });
    }
  }
  if (unexpected !== void 0) {
    return new StatementUnexpectedThrow({
      statement: name,
      reason: unexpected,
      cause
    });
  }
  return new StatementRequestError({
    statement: name,
    message: messageOf(cause),
    cause
  });
};
var encode = (statement, input) => Effect.forEach(
  Object.entries(statement.params),
  ([name, codec]) => Schema.encodeUnknownEffect(codec)(input[name]).pipe(
    Effect.map((value) => [name, value]),
    Effect.mapError(
      (error) => new StatementEncodeError({
        statement: statement.name,
        binding: name,
        message: error.message
      })
    )
  )
).pipe(Effect.map((entries) => Object.fromEntries(entries)));
var checkValues = (bindings, owner, options) => {
  if (options?.unsafeSkipValueCheck === true) return Effect.void;
  for (const [binding, value] of Object.entries(bindings)) {
    const found = valueProblem(value);
    if (found !== void 0) {
      return Effect.fail(
        new StatementEncodeError({
          statement: owner(binding),
          binding,
          path: found.path,
          message: `${pathText(binding, found.path)} is ${found.problem}; nothing was sent`
        })
      );
    }
  }
  return Effect.void;
};
var changesOf = (statements) => statements.some((statement) => statement.writes === true) ? "writes" : statements.every((statement) => statement.writes === false) ? "none" : "maybe";
var committedNote = (changes) => changes === "writes" ? ". The request succeeded and its writes are committed, so do not send it again to retry" : changes === "maybe" ? ". The request succeeded and may have written: it is not known whether it writes, and any writes it made are committed; read the data back before sending it again" : "";
var decodeOutcome = (request, changes) => (error) => changes !== "none" && error instanceof StatementDecodeError ? new StatementWriteOutcomeError({ request, cause: error }) : error;
var decode = (statement, results, offset, writes) => {
  const at = offset + statement.valueSlot - 1;
  for (let slot = offset; slot < offset + statement.slots; slot++) {
    if (slot !== at && results[slot] !== void 0) {
      return Effect.fail(
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
    return Effect.fail(
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
    Effect.mapError(
      (error) => new StatementDecodeError({
        statement: statement.name,
        slot: statement.valueSlot,
        committed: writes !== "none",
        message: `${error.message}${committedNote(writes)}`
      })
    )
  );
};
var countOf = (name, results, expected, writes) => Array.isArray(results) && results.length === expected ? Effect.succeed(results) : Effect.fail(
  new StatementDecodeError({
    statement: name,
    slot: 0,
    committed: writes !== "none",
    message: `expected ${expected} results, one per SurrealQL statement, and received ${Array.isArray(results) ? results.length : "no list"}${committedNote(writes)}`
  })
);
var sending = (send, options) => options?.retry === void 0 ? send : send.pipe(
  Effect.retry({
    schedule: options.retry,
    while: (error) => error._tag === "StatementConflict"
  })
);
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
var traced = (name, sql, sources, rows, sent, effect) => Effect.gen(function* () {
  const started = yield* Clock.currentTimeNanos;
  const record = (outcome) => Effect.gen(function* () {
    const ended = yield* Clock.currentTimeNanos;
    const statement = { statement: name };
    yield* Metric.update(
      Metric.withAttributes(runs, { ...statement, outcome }),
      1
    );
    yield* Metric.update(
      Metric.withAttributes(durations, statement),
      Duration3.nanos(ended - started)
    );
    if (sent.count > 1) {
      yield* Metric.update(
        Metric.withAttributes(retries, statement),
        sent.count - 1
      );
    }
  });
  return yield* effect.pipe(
    Effect.tap(
      (result) => rows && Array.isArray(result) ? Effect.annotateCurrentSpan(
        "db.response.returned_rows",
        result.length
      ) : Effect.void
    ),
    Effect.tapError(
      (error) => Effect.annotateCurrentSpan("error.type", error._tag)
    ),
    Effect.withSpan(name, {
      kind: "client",
      attributes: {
        "db.system.name": "surrealdb",
        "db.operation.name": name,
        // Static text: values travel as bindings and are not recorded.
        "db.query.text": sql,
        ...sources !== void 0 && sources.length > 0 && {
          "code.file.path": sources.join(", ")
        }
      }
    }),
    Effect.tap(() => record("success")),
    Effect.tapError((error) => record(error._tag)),
    Effect.onInterrupt(() => record("interrupted"))
  );
});
var refuseInTransaction = (statements) => {
  for (const { statement } of statements) {
    if (statement.transactional) {
      return new StatementScopeError({
        statement: statement.name,
        message: `\`${statement.name}\` writes its own BEGIN, COMMIT or CANCEL, so it cannot run inside a transaction; run it on its own`
      });
    }
  }
  for (const [index, { statement }] of statements.entries()) {
    for (const binding of Object.keys(statement.params)) {
      const definer = statements.find(
        (other, at) => at !== index && other.statement.defines.includes(binding)
      );
      if (definer !== void 0) {
        return new StatementScopeError({
          statement: statement.name,
          binding,
          message: `\`$${binding}\` is bound by \`${statement.name}\` and defined with LET by \`${definer.statement.name}\`, and statements in one transaction share one variable scope, so one would read the other's value; rename one of them`
        });
      }
    }
  }
  return void 0;
};
var declarer = (statements, reason) => {
  const declaring = statements.filter(
    (statement) => statement.throws.includes(reason)
  );
  const names = [...new Set(declaring.map((statement) => statement.name))];
  if (names.length > 1) {
    return {
      statement: `one of ${names.map((name) => `\`${name}\``).join(", ")}`
    };
  }
  const [first] = declaring;
  if (first === void 0) return void 0;
  const site = first.throwSites?.[reason];
  return site === void 0 ? { statement: first.name } : { statement: first.name, source: site.source, lines: site.lines };
};
var sdkTransport = (db) => {
  const requests = /* @__PURE__ */ new WeakMap();
  return {
    query: (statement, bindings, signal) => db.query(statement.sql, bindings).signal(signal),
    transaction: (_, { sql, bindings }, signal) => {
      let request = requests.get(bindings);
      if (request === void 0) {
        request = new BoundQuery(
          sql,
          bindings
        );
        requests.set(bindings, request);
      }
      return db.transaction([request], { signal });
    }
  };
};
var make = (db) => makeWith(sdkTransport(db));
var makeWith = (transport) => ({
  run: (statement, ...args) => {
    const input = args[0] ?? {};
    const options = args[1];
    const writes = changesOf([statement]);
    const sent = { count: 0 };
    return traced(
      statement.name,
      statement.sql,
      statement.sources,
      true,
      sent,
      Effect.gen(function* () {
        const bindings = yield* encode(statement, input);
        yield* checkValues(bindings, () => statement.name, options);
        const results = yield* sending(
          Effect.tryPromise({
            try: (signal) => {
              sent.count++;
              return transport.query(statement, bindings, signal);
            },
            catch: (cause) => classify(
              statement.name,
              (reason) => declarer([statement], reason),
              cause
            )
          }),
          options
        );
        const slots = yield* countOf(
          statement.name,
          results,
          statement.slots,
          writes
        ).pipe(Effect.mapError(decodeOutcome(statement.name, writes)));
        return yield* decode(statement, slots, 0, writes).pipe(
          Effect.mapError(decodeOutcome(statement.name, writes))
        );
      })
    );
  },
  transaction: (given, options) => {
    const statements = given;
    const name = `transaction(${statements.map(({ statement }) => statement.name).join(", ")})`;
    const sql = statements.map(({ statement }) => statement.sql).join("\n");
    const sources = [
      ...new Set(
        statements.flatMap(({ statement }) => statement.sources ?? [])
      )
    ];
    const writes = changesOf(statements.map(({ statement }) => statement));
    const sent = { count: 0 };
    return traced(
      name,
      sql,
      sources,
      false,
      sent,
      Effect.gen(function* () {
        if (statements.length === 0) return [];
        const refused = refuseInTransaction(statements);
        if (refused !== void 0) return yield* Effect.fail(refused);
        const bindings = {};
        const boundBy = /* @__PURE__ */ new Map();
        for (const { input, statement } of statements) {
          const encoded = yield* encode(statement, input);
          for (const [key, value] of Object.entries(encoded)) {
            const first = boundBy.get(key);
            if (first === void 0) {
              boundBy.set(key, statement.name);
            } else if (!sameValue(bindings[key], value)) {
              return yield* Effect.fail(
                new StatementScopeError({
                  statement: statement.name,
                  binding: key,
                  message: `\`$${key}\` is bound by \`${first}\` and by \`${statement.name}\` to values that are not certainly equal, and statements in one transaction share one variable scope; rename the binding in one of them`
                })
              );
            }
            bindings[key] = value;
          }
        }
        yield* checkValues(
          bindings,
          (binding) => boundBy.get(binding) ?? name,
          options
        );
        const request = { sql, bindings };
        const results = yield* sending(
          Effect.tryPromise({
            try: (signal) => {
              sent.count++;
              return transport.transaction(
                statements.map((item) => item.statement),
                request,
                signal
              );
            },
            catch: (cause) => classify(
              name,
              (reason) => declarer(
                statements.map(
                  (item) => item.statement
                ),
                reason
              ),
              cause
            )
          }),
          options
        );
        const slots = yield* countOf(
          name,
          results,
          statements.reduce(
            (total, { statement }) => total + statement.slots,
            0
          ),
          writes
        ).pipe(Effect.mapError(decodeOutcome(name, writes)));
        const decoded = [];
        let offset = 0;
        for (const { statement } of statements) {
          decoded.push(
            yield* decode(statement, slots, offset, writes).pipe(
              Effect.mapError(decodeOutcome(name, writes))
            )
          );
          offset += statement.slots;
        }
        return decoded;
      })
    );
  }
});
var layer = (db) => Layer.succeed(SurrealClient, make(db));
var run = (statement, ...args) => Effect.flatMap(
  Effect.service(SurrealClient),
  (client) => client.run(statement, ...args)
);
var transaction = (statements, options) => Effect.flatMap(
  Effect.service(SurrealClient),
  (client) => client.transaction(statements, options)
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
  bind,
  SurrealClient,
  metrics,
  make,
  makeWith,
  layer,
  run,
  transaction
};
//# sourceMappingURL=chunk-VRNODB5B.js.map