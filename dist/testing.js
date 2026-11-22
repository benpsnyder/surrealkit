import {
  linkShape,
  shapeTables,
  tableName
} from "./chunk-LWAKMPZO.js";
import "./chunk-ZMDEVTBR.js";
import "./chunk-DVT5GPYS.js";
import "./chunk-VZONF6WY.js";
import {
  SurrealClient,
  make as make2,
  makeWith,
  run
} from "./chunk-MUR2DZX4.js";
import "./chunk-6LS7V54M.js";
import {
  make,
  scanTopLevel
} from "./chunk-QRSY4HQJ.js";
import "./chunk-3SWEJO3L.js";
import {
  DEFAULT_HOLE_DELIMITERS,
  lex
} from "./chunk-LJSHE6F3.js";
import {
  AnalyzeError
} from "./chunk-FBUMKT7I.js";
import "./chunk-PZ5AY32C.js";

// src/testing/database.ts
import { Context, Effect, Layer } from "effect";
import { Surreal } from "surrealdb";

// src/testing/errors.ts
import { Data } from "effect";
var TestingError = class extends Data.TaggedError("TestingError") {
};
var IndexExpectationError = class extends Data.TaggedError(
  "IndexExpectationError"
) {
};

// src/testing/database.ts
var TestDatabase = class extends Context.Service()(
  "effect-surrealkit/testing/TestDatabase"
) {
};
var messageOf = (cause) => cause instanceof Error ? cause.message : String(cause);
var fromConnection = (connection, scope) => ({
  connection,
  namespace: scope.namespace,
  database: scope.database,
  client: make2(connection),
  load: (schema) => Effect.tryPromise({
    try: () => connection.query(schema).then(() => void 0),
    catch: (cause) => new TestingError({
      message: `the schema text failed: ${messageOf(cause)}`,
      cause
    })
  })
});
var provide = (database) => Layer.succeedContext(
  Context.make(TestDatabase, database).pipe(
    Context.add(SurrealClient, database.client)
  )
);
var layerFrom = (connection, scope) => provide(fromConnection(connection, scope));
var nodeEngines = Effect.tryPromise({
  try: () => import("@surrealdb/node"),
  catch: (cause) => new TestingError({
    message: `a memory database needs \`@surrealdb/node\` and \`@surrealdb/node-native\` installed: ${messageOf(cause)}`,
    cause
  })
});
var memory = (options = {}) => Effect.gen(function* () {
  const { createNodeEngines } = yield* nodeEngines;
  const scope = {
    namespace: options.namespace ?? "test",
    database: options.database ?? "test"
  };
  const db = yield* Effect.acquireRelease(
    Effect.tryPromise({
      try: async () => {
        const surreal = new Surreal({
          engines: createNodeEngines()
        });
        try {
          await surreal.connect("mem://", scope);
          return surreal;
        } catch (cause) {
          await surreal.close();
          throw cause;
        }
      },
      catch: (cause) => new TestingError({
        message: `the memory database did not start: ${messageOf(cause)}`,
        cause
      })
    }),
    (surreal) => Effect.promise(() => surreal.close())
  );
  const database = fromConnection(db, scope);
  if (options.schema !== void 0) yield* database.load(options.schema);
  return database;
});
var memoryLayer = (options = {}) => Layer.unwrap(Effect.map(memory(options), provide));
var loadSchema = (schema) => Effect.flatMap(
  Effect.service(TestDatabase),
  (database) => database.load(schema)
);
var recordUser = (options) => Effect.gen(function* () {
  const database = yield* Effect.service(TestDatabase);
  const scope = {
    namespace: database.namespace,
    database: database.database
  };
  const session = yield* Effect.acquireRelease(
    Effect.tryPromise({
      try: () => database.connection.newSession(),
      catch: (cause) => new TestingError({
        message: `no session for a record user: ${messageOf(cause)}`,
        cause
      })
    }),
    (opened) => Effect.promise(() => opened.closeSession())
  );
  yield* Effect.tryPromise({
    try: async () => {
      await session.use(scope);
      await session.signup({
        ...scope,
        access: options.access,
        variables: { ...options.variables }
      });
    },
    catch: (cause) => new TestingError({
      message: `the record user did not sign up through \`${options.access}\`: ${messageOf(cause)}`,
      cause
    })
  });
  return { session, client: make2(session) };
});

// src/testing/drift.ts
import { Effect as Effect2 } from "effect";
var nameOf = (value) => typeof value === "string" ? value : typeof value === "object" && value !== null && "name" in value && typeof value.name === "string" ? value.name : String(value);
var messageOf2 = (cause) => cause instanceof Error ? cause.message : String(cause);
var segmentsOf = (path) => {
  const segments = [];
  let current = "";
  let index = 0;
  while (index < path.length) {
    const char = path[index] ?? "";
    const close = char === "`" ? "`" : char === "\u27E8" ? "\u27E9" : void 0;
    if (close !== void 0) {
      index += 1;
      while (index < path.length && path[index] !== close) {
        if (path[index] === "\\") index += 1;
        current += path[index] ?? "";
        index += 1;
      }
      index += 1;
    } else if (char === ".") {
      segments.push(current);
      current = "";
      index += 1;
    } else {
      current += char;
      index += 1;
    }
  }
  segments.push(current);
  return segments;
};
var indexKind = (definition) => {
  const word = /^\s*([A-Za-z]+)/u.exec(definition)?.[1];
  return word === void 0 ? "standard" : word.toLowerCase();
};
var columnsText = (columns) => columns.length === 0 ? "(none)" : columns.map((path) => path.join(".")).join(", ");
var endpoints = (codecs) => {
  const tables = /* @__PURE__ */ new Set();
  for (const codec of codecs) {
    const shape = linkShape(codec);
    const names = shape === void 0 ? "any" : shapeTables(shape);
    if (names === "any") return "any table";
    for (const name of names) tables.add(name);
  }
  return [...tables].sort().join(" | ");
};
var liveEndpoints = (tables) => tables === void 0 || tables.length === 0 ? "any table" : tables.map(nameOf).sort().join(" | ");
var info = (sql) => Effect2.flatMap(
  Effect2.service(TestDatabase),
  (database) => Effect2.tryPromise({
    try: async () => {
      const results = await database.connection.query(
        sql
      );
      return results[results.length - 1];
    },
    catch: (cause) => new TestingError({
      message: `\`${sql}\` failed: ${messageOf2(cause)}`,
      cause
    })
  })
);
var compareTable = (declared, live, indexes) => {
  const table = declared.name;
  const differences = [];
  const liveKind = (live.kind?.kind ?? "ANY").toLowerCase();
  if (declared.type !== void 0 && declared.type !== liveKind) {
    differences.push({
      kind: "table-kind",
      table,
      declared: declared.type,
      live: liveKind,
      message: `\`${table}\` is declared ${declared.type} and defined ${liveKind}`
    });
  }
  if (declared.edge !== void 0 && liveKind === "relation") {
    const enforced = live.kind?.enforced === true;
    if (declared.edge.enforced !== enforced) {
      differences.push({
        kind: "relation-enforced",
        table,
        declared: declared.edge.enforced ? "ENFORCED" : "not ENFORCED",
        live: enforced ? "ENFORCED" : "not ENFORCED",
        message: `\`${table}\` is declared ${declared.edge.enforced ? "ENFORCED" : "not ENFORCED"} and defined ${enforced ? "ENFORCED" : "not ENFORCED"}`
      });
    }
    for (const side of ["in", "out"]) {
      const want = endpoints(declared.edge[side]);
      const have = liveEndpoints(live.kind?.[side]);
      if (want !== have) {
        differences.push({
          kind: "relation-endpoints",
          table,
          declared: `${side.toUpperCase()} ${want}`,
          live: `${side.toUpperCase()} ${have}`,
          message: `\`${table}\` is declared ${side.toUpperCase()} ${want} and defined ${side.toUpperCase()} ${have}`
        });
      }
    }
  }
  const byName = new Map(indexes.map((index) => [index.name, index]));
  for (const [name, index] of Object.entries(declared.indexes ?? {})) {
    const found = byName.get(name);
    if (found === void 0) {
      differences.push({
        kind: "missing-index",
        table,
        index: name,
        declared: `${index.type} on ${columnsText(index.columns)}`,
        live: "(none)",
        message: `\`${table}\` declares the ${index.type} index \`${name}\`, which the database does not define`
      });
      continue;
    }
    const kind = indexKind(found.index ?? "");
    if (kind !== index.type) {
      differences.push({
        kind: "index-kind",
        table,
        index: name,
        declared: index.type,
        live: kind,
        message: `the index \`${name}\` of \`${table}\` is declared ${index.type} and defined ${kind}`
      });
    }
    const columns = (found.cols ?? []).map(segmentsOf);
    if (columnsText(columns) !== columnsText(index.columns)) {
      differences.push({
        kind: "index-fields",
        table,
        index: name,
        declared: columnsText(index.columns),
        live: columnsText(columns),
        message: `the index \`${name}\` of \`${table}\` is declared on ${columnsText(index.columns)} and defined on ${columnsText(columns)}`
      });
    }
  }
  return differences;
};
var schemaDrift = (store) => Effect2.gen(function* () {
  const db = yield* info(
    "INFO FOR DB STRUCTURE;"
  );
  const tables = new Map(
    (db?.tables ?? []).map((table) => [table.name, table])
  );
  const differences = [];
  for (const declared of Object.values(store.tables)) {
    const live = tables.get(declared.name);
    if (live === void 0) {
      differences.push({
        kind: "missing-table",
        table: declared.name,
        declared: declared.type ?? "table",
        live: "(none)",
        message: `\`${declared.name}\` is declared and not defined`
      });
      continue;
    }
    const structure = yield* info(
      `INFO FOR TABLE ${tableName(declared)} STRUCTURE;`
    );
    differences.push(
      ...compareTable(declared, live, structure?.indexes ?? [])
    );
  }
  return differences;
});

// src/testing/explain.ts
import { Effect as Effect3, Schema } from "effect";
var indexesOf = (plan) => {
  const found = [];
  const visit = (node) => {
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    if (typeof node !== "object" || node === null) return;
    const { attributes, children, detail } = node;
    for (const index of [attributes?.index, detail?.plan?.index]) {
      if (typeof index === "string" && !found.includes(index)) {
        found.push(index);
      }
    }
    visit(children);
  };
  visit(plan);
  return found;
};
var explainable = (statement) => {
  const text = statement.sql.trim();
  if (statement.slots !== 1 || !/^SELECT\s/iu.test(text)) {
    throw new TypeError(
      `\`${statement.name}\` is not a single SELECT, so the engine has no plan of it to read`
    );
  }
  return `${text.slice(0, -1).trimEnd()} EXPLAIN;`;
};
var explain = (statement, input) => Effect3.suspend(() => {
  const plan = make({
    name: `explain ${statement.name}`,
    sql: explainable(statement),
    params: statement.params,
    result: Schema.Unknown,
    // EXPLAIN plans the statement without running it.
    writes: false
  });
  return run(plan, input).pipe(
    Effect3.map((tree) => ({ plan: tree, indexes: indexesOf(tree) }))
  );
});
var expecting = (expected) => (statement, input, index) => Effect3.flatMap(
  explain(statement, input),
  ({ indexes, plan }) => indexes.includes(index) === (expected === "used") ? Effect3.void : Effect3.fail(
    new IndexExpectationError({
      statement: statement.name,
      index,
      expected,
      used: indexes,
      plan,
      message: expected === "used" ? `\`${statement.name}\` does not read the index \`${index}\`; its plan reads ${indexes.length === 0 ? "no index" : indexes.map((name) => `\`${name}\``).join(", ")}` : `\`${statement.name}\` reads the index \`${index}\``
    })
  )
);
var expectIndex = expecting("used");
var expectNoIndex = expecting("unused");

// src/testing/fake.ts
import { Layer as Layer2 } from "effect";
import { ExpressionError, Features, UnsupportedFeatureError } from "surrealdb";
var ReplyTypeId = "~effect-surrealkit/testing/Reply";
var result = (value) => ({
  [ReplyTypeId]: "result",
  value
});
var thrown = (message) => ({
  [ReplyTypeId]: "throw",
  message
});
var conflict = () => ({ [ReplyTypeId]: "conflict" });
var failure = (message) => ({
  [ReplyTypeId]: "failure",
  message
});
var events = (messages) => ({
  [ReplyTypeId]: "events",
  messages
});
var unsupported = (feature) => ({
  [ReplyTypeId]: "unsupported",
  feature
});
var isReply = (value) => typeof value === "object" && value !== null && ReplyTypeId in value;
var sdkError = (message, fields = {}) => Object.assign(new Error(message), fields);
var sdkFeatures = {
  "interactive transaction": Features.Transactions,
  "live query": Features.LiveQueries,
  stream: Features.QueryStreaming
};
var rejection = (reply) => {
  switch (reply[ReplyTypeId]) {
    case "throw":
      return sdkError(`An error occurred: ${reply.message}`, {
        kind: "Thrown"
      });
    case "conflict":
      return sdkError(
        "Transaction conflict: the transaction was retried but still conflicted",
        { isTransactionConflict: true }
      );
    case "failure":
      return sdkError(reply.message);
    case "unsupported":
      return new UnsupportedFeatureError(sdkFeatures[reply.feature]);
    default:
      return void 0;
  }
};
var control = /* @__PURE__ */ new Set(["BEGIN", "COMMIT", "CANCEL"]);
var sdkRefusal = (sql) => {
  let returned = false;
  for (const keyword of scanTopLevel(sql).keywords) {
    if (control.has(keyword)) {
      return new ExpressionError(
        `queries[0] contains a ${keyword} statement. transaction() wraps the queries in BEGIN and COMMIT itself, so they must not contain any`
      );
    }
    if (returned) {
      return new ExpressionError(
        "queries[0] contains a RETURN statement which is followed by another statement (in queries[0]). Inside a transaction RETURN ends it early: the statements after it would be skipped but the transaction would still commit. Use SELECT or a bare expression instead, or move the RETURN to the end"
      );
    }
    if (keyword === "RETURN") returned = true;
  }
  return void 0;
};
var success = (value) => ({ ok: true, value });
var firstSlot = (part) => part.offset + (part.slots === part.statement.slots + 2 ? 1 : 0);
var valueSlot = (part) => firstSlot(part) + part.statement.valueSlot - 1;
var requestContext = ({ mode, parts }, collected) => {
  if (mode === "query" && collected) return {};
  const names = parts.map(({ statement }) => statement.name).join(", ");
  return mode === "atomic" ? { transaction: `transaction(${names})` } : { pipeline: `pipeline(${names})` };
};
var scriptedTransport = (script) => {
  const calls = [];
  let transactions = 0;
  const entryFor = (name, bindings) => {
    const entry = script[name];
    return typeof entry === "function" ? entry(bindings) : entry;
  };
  const reply = ({ statement: { name }, bindings }, context) => {
    calls.push({ statement: name, bindings: { ...bindings }, ...context });
    if (!Object.hasOwn(script, name)) {
      return failure(`the scripted client has no reply for \`${name}\``);
    }
    const value = entryFor(name, bindings);
    return isReply(value) ? value : result(value);
  };
  const dispatch = async (request, signal, collected, interactive) => {
    signal.throwIfAborted();
    const context = interactive === void 0 ? requestContext(request, collected) : { interactive };
    const whole = collected || request.mode === "atomic" && interactive === void 0;
    if (request.mode === "atomic" && interactive === void 0) {
      const refused = sdkRefusal(request.sql);
      if (refused !== void 0) throw refused;
    }
    const size = request.parts.reduce(
      (size2, part) => Math.max(size2, part.offset + part.slots),
      0
    );
    const slots = Array.from({ length: size }, () => success(void 0));
    for (const part of request.parts) {
      try {
        const answer = reply(part, context);
        const error = rejection(answer);
        if (error !== void 0) throw error;
        slots[valueSlot(part)] = success(
          answer[ReplyTypeId] === "result" ? answer.value : void 0
        );
      } catch (error) {
        if (whole) throw error;
        slots[firstSlot(part)] = { ok: false, error };
      }
    }
    return slots;
  };
  const lifecycle = async (operation, context, statement = operation) => {
    calls.push({ statement, bindings: {}, operation, ...context });
    if (!Object.hasOwn(script, operation)) return;
    const answer = await entryFor(operation, {});
    if (isReply(answer)) {
      const error = rejection(answer);
      if (error !== void 0) throw error;
    }
  };
  const transport = {
    collect: async (request, signal) => {
      const slots = await dispatch(request, signal, true);
      return slots.map((slot) => {
        if (!slot.ok) throw slot.error;
        return slot.value;
      });
    },
    send: (request, signal) => dispatch(request, signal, false),
    stream: async function* (request, signal) {
      for (const part of request.parts) {
        signal.throwIfAborted();
        const answer = reply(part, {});
        const error = rejection(answer);
        if (error instanceof UnsupportedFeatureError) throw error;
        if (error !== void 0) {
          yield { kind: "error", slot: firstSlot(part), error };
          continue;
        }
        for (let slot = part.offset; slot < part.offset + part.slots; slot++) {
          if (slot === valueSlot(part) && answer[ReplyTypeId] === "result") {
            if (Array.isArray(answer.value)) {
              for (const value of answer.value) {
                signal.throwIfAborted();
                yield { kind: "row", slot, value };
              }
            } else {
              yield { kind: "value", slot, value: answer.value };
            }
          } else {
            yield { kind: "value", slot, value: void 0 };
          }
          yield { kind: "done", slot };
        }
      }
    },
    begin: async (signal) => {
      signal.throwIfAborted();
      const interactive = `transaction ${++transactions}`;
      await lifecycle("begin", { interactive });
      return {
        send: (request, signal2) => dispatch(request, signal2, false, interactive),
        commit: () => lifecycle("commit", { interactive }),
        cancel: () => lifecycle("cancel", { interactive })
      };
    },
    live: async (request, signal) => {
      signal.throwIfAborted();
      const [part] = request.parts;
      if (part === void 0)
        throw new Error("the scripted live query has no statement");
      const answer = reply(part, {});
      const error = rejection(answer);
      if (error !== void 0) throw error;
      if (answer[ReplyTypeId] !== "events") {
        throw new Error(
          `the scripted client needs events for \`${part.statement.name}\``
        );
      }
      let killed = false;
      return {
        messages: (async function* () {
          for (const message of answer.messages) {
            if (killed) return;
            yield message;
          }
        })(),
        kill: async () => {
          killed = true;
          await lifecycle("kill", {}, part.statement.name);
        }
      };
    }
  };
  return { transport, calls };
};
var fake = (script) => {
  const { transport, calls } = scriptedTransport(script);
  return Object.assign(makeWith(transport), { calls });
};
var fakeLayer = (script) => Layer2.succeed(SurrealClient, fake(script));

// src/testing/session.ts
import {
  BoundQuery,
  ErrorFrame,
  QueryError
} from "surrealdb";
var forwardData = (target, key, {
  configurable = false,
  enumerable = false,
  writable = false
}) => {
  let method;
  let bound;
  return {
    configurable,
    enumerable,
    get: () => {
      const value = Reflect.get(target, key);
      if (typeof value !== "function") return value;
      if (value !== method) {
        method = value;
        bound = value.bind(target);
      }
      return bound;
    },
    ...writable && {
      set: (value) => {
        if (!Reflect.set(target, key, value)) {
          throw new TypeError(
            `Cannot write session property ${String(key)}`
          );
        }
      }
    }
  };
};
var forward = (target, overrides) => {
  const facade = Object.defineProperties(
    {},
    Object.getOwnPropertyDescriptors(overrides)
  );
  for (let owner = target; owner !== null && owner !== Object.prototype; owner = Object.getPrototypeOf(owner)) {
    for (const key of Reflect.ownKeys(owner)) {
      if (owner !== target && key === "constructor" || Object.hasOwn(facade, key))
        continue;
      const descriptor = Object.getOwnPropertyDescriptor(owner, key);
      if (descriptor === void 0) continue;
      if ("value" in descriptor) {
        Object.defineProperty(
          facade,
          key,
          forwardData(target, key, descriptor)
        );
        continue;
      }
      if (descriptor.get !== void 0)
        descriptor.get = descriptor.get.bind(target);
      if (descriptor.set !== void 0)
        descriptor.set = descriptor.set.bind(target);
      Object.defineProperty(facade, key, descriptor);
    }
  }
  return facade;
};
var conflict2 = () => new QueryError({
  kind: "Query",
  message: "Transaction conflict: Write conflict, retry the transaction.",
  details: { kind: "TransactionConflict" }
});
var notExecuted = () => new QueryError({
  kind: "Query",
  message: "The query was not executed due to a failed transaction",
  details: { kind: "NotExecuted" }
});
var statementTexts = (sql) => {
  const { tokens } = lex(sql, DEFAULT_HOLE_DELIMITERS);
  const texts = [];
  let depth = 0;
  let start = 0;
  let hasText = false;
  for (const token of tokens) {
    if (token.kind === "punct") {
      if (token.value === ";" && depth === 0) {
        if (hasText) texts.push(sql.slice(start, token.end));
        start = token.end;
        hasText = false;
        continue;
      }
      if ("([{".includes(token.value)) depth++;
      if (")]}".includes(token.value)) depth--;
    }
    hasText = true;
  }
  if (hasText) texts.push(sql.slice(start));
  return texts;
};
var conflictResponses = (sql, marker) => {
  let texts;
  try {
    texts = statementTexts(sql);
  } catch (cause) {
    if (cause instanceof AnalyzeError) throw conflict2();
    throw cause;
  }
  if (texts.length === 0) throw conflict2();
  const matching = Math.max(
    0,
    texts.findIndex((text) => text.includes(marker))
  );
  return texts.map((_, index) => ({
    success: false,
    error: index === matching ? conflict2() : notExecuted()
  }));
};
var textOf = (query) => {
  if (typeof query === "string") return query;
  if (query instanceof BoundQuery) return query.query;
  return ("inner" in query ? query.inner : query.compile()).query;
};
var view = (open, inject) => {
  let source;
  let closed = false;
  const done = { done: true, value: void 0 };
  const iterator = {
    async next() {
      if (closed) return done;
      if (source === void 0) {
        try {
          if (inject()) throw conflict2();
          source = open();
        } catch (error) {
          closed = true;
          throw error;
        }
      }
      return source.next();
    },
    async return() {
      closed = true;
      return source?.return === void 0 ? done : source.return();
    },
    async throw(error) {
      closed = true;
      if (source?.throw !== void 0) return source.throw(error);
      throw error;
    },
    [Symbol.asyncIterator]() {
      return iterator;
    },
    async [Symbol.asyncDispose]() {
      await iterator.return();
    }
  };
  return iterator;
};
var wrapQuery = (query, marker, take, signals = []) => {
  const inject = () => {
    for (const signal of signals) signal.throwIfAborted();
    return take();
  };
  const responses = () => conflictResponses(query.inner.query, marker);
  let dispatched;
  const collect = async (...indexes) => {
    if (inject()) throw conflict2();
    return query.collect(...indexes);
  };
  const awaitOnce = () => {
    dispatched ??= collect();
    return dispatched;
  };
  return forward(query, {
    signal: (signal) => wrapQuery(
      query.signal(signal),
      marker,
      take,
      signal === void 0 ? signals : [...signals, signal]
    ),
    retry: (...args) => wrapQuery(query.retry(...args), marker, take, signals),
    requestTimeout: (...args) => wrapQuery(query.requestTimeout(...args), marker, take, signals),
    as: (...args) => wrapQuery(query.as(...args), marker, take, signals),
    json: () => wrapQuery(query.json(), marker, take, signals),
    dispatch: collect,
    collect,
    // biome-ignore lint/suspicious/noThenProperty: the SDK Query is a thenable
    then: (...args) => awaitOnce().then(...args),
    catch: (...args) => awaitOnce().catch(...args),
    finally: (...args) => awaitOnce().finally(...args),
    responses: async (...indexes) => {
      if (!inject()) return query.responses(...indexes);
      const slots = responses();
      if (indexes.length === 0) return slots;
      const positions = new Map(
        indexes.map((slot, index) => [slot, index])
      );
      const selected = [];
      for (const [index, slot] of slots.entries()) {
        const position = positions.get(index);
        if (position === void 0) throw slot.error;
        selected[position] = slot;
      }
      return selected;
    },
    rows: (parse) => view(() => query.rows(parse), inject),
    statements: () => view(() => query.statements(), inject),
    stream: async function* () {
      if (!inject()) {
        yield* query.stream();
        return;
      }
      for (const [index, slot] of responses().entries()) {
        yield new ErrorFrame(index, void 0, slot.error);
      }
    }
  });
};
var conflictingSession = (session, options) => {
  const { marker, times } = options;
  const matched = { count: 0 };
  const take = () => ++matched.count <= times;
  const query = (...args) => {
    const request = Reflect.apply(session.query, session, args);
    return request.inner.query.includes(marker) ? wrapQuery(request, marker, take) : request;
  };
  const transaction = async (queries, options2) => {
    if (queries.some((query2) => textOf(query2).includes(marker))) {
      options2?.signal?.throwIfAborted();
      if (take()) throw conflict2();
    }
    return session.transaction(queries, options2);
  };
  return { session: forward(session, { query, transaction }), matched };
};
export {
  IndexExpectationError,
  TestDatabase,
  TestingError,
  conflict,
  conflictingSession,
  events,
  expectIndex,
  expectNoIndex,
  explain,
  failure,
  fake,
  fakeLayer,
  fromConnection,
  indexesOf,
  layerFrom,
  loadSchema,
  memory,
  memoryLayer,
  recordUser,
  result,
  schemaDrift,
  thrown,
  unsupported
};
//# sourceMappingURL=testing.js.map