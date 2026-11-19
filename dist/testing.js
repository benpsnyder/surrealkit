import {
  make,
  scanTopLevel
} from "./chunk-6FQGMUUR.js";
import {
  SurrealClient,
  make as make2,
  makeWith,
  run
} from "./chunk-EBKUDRXT.js";

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

// src/testing/explain.ts
import { Effect as Effect2, Schema } from "effect";
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
var explain = (statement, input) => Effect2.suspend(() => {
  const plan = make({
    name: `explain ${statement.name}`,
    sql: explainable(statement),
    params: statement.params,
    result: Schema.Unknown,
    // EXPLAIN plans the statement without running it.
    writes: false
  });
  return run(plan, input).pipe(
    Effect2.map((tree) => ({ plan: tree, indexes: indexesOf(tree) }))
  );
});
var expecting = (expected) => (statement, input, index) => Effect2.flatMap(
  explain(statement, input),
  ({ indexes, plan }) => indexes.includes(index) === (expected === "used") ? Effect2.void : Effect2.fail(
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
var isReply = (value) => typeof value === "object" && value !== null && ReplyTypeId in value;
var sdkError = (message, fields = {}) => Object.assign(new Error(message), fields);
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
    default:
      return void 0;
  }
};
var control = /* @__PURE__ */ new Set(["BEGIN", "COMMIT", "CANCEL"]);
var sdkRefusal = (sql) => {
  let returned = false;
  for (const keyword of scanTopLevel(sql).keywords) {
    if (control.has(keyword)) {
      return sdkError(
        `queries[0] contains a ${keyword} statement. transaction() wraps the queries in BEGIN and COMMIT itself, so they must not contain any`
      );
    }
    if (returned) {
      return sdkError(
        "queries[0] contains a RETURN statement which is followed by another statement (in queries[0]). Inside a transaction RETURN ends it early: the statements after it would be skipped but the transaction would still commit. Use SELECT or a bare expression instead, or move the RETURN to the end"
      );
    }
    if (keyword === "RETURN") returned = true;
  }
  return void 0;
};
var fake = (script) => {
  const calls = [];
  const reply = (statement, bindings) => {
    if (!Object.hasOwn(script, statement.name)) {
      return failure(
        `the scripted client has no reply for \`${statement.name}\``
      );
    }
    const entry = script[statement.name];
    const value = typeof entry === "function" ? entry(bindings) : entry;
    return isReply(value) ? value : result(value);
  };
  const slotsOf = (statement, value) => [
    ...Array.from({ length: statement.slots - 1 }, () => void 0),
    value
  ];
  const own = (statement, bindings) => Object.fromEntries(
    Object.keys(statement.params).flatMap(
      (name) => Object.hasOwn(bindings, name) ? [[name, bindings[name]]] : []
    )
  );
  const transport = {
    query: async (statement, bindings) => {
      calls.push({
        statement: statement.name,
        bindings: { ...bindings }
      });
      const answer = reply(statement, bindings);
      const error = rejection(answer);
      if (error !== void 0) throw error;
      return slotsOf(
        statement,
        answer[ReplyTypeId] === "result" ? answer.value : void 0
      );
    },
    transaction: async (statements, { sql, bindings }) => {
      const refused = sdkRefusal(sql);
      if (refused !== void 0) throw refused;
      const name = `transaction(${statements.map((item) => item.name).join(", ")})`;
      const results = [];
      for (const statement of statements) {
        const mine = own(statement, bindings);
        calls.push({
          statement: statement.name,
          bindings: mine,
          transaction: name
        });
        const answer = reply(statement, mine);
        const error = rejection(answer);
        if (error !== void 0) throw error;
        results.push(
          ...slotsOf(
            statement,
            answer[ReplyTypeId] === "result" ? answer.value : void 0
          )
        );
      }
      return results;
    }
  };
  return Object.assign(makeWith(transport), { calls });
};
var fakeLayer = (script) => Layer2.succeed(SurrealClient, fake(script));
export {
  IndexExpectationError,
  TestDatabase,
  TestingError,
  conflict,
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
  thrown
};
//# sourceMappingURL=testing.js.map