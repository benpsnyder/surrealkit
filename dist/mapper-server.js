import {
  EMPTY_SURQL_MODULE,
  configurationDrift,
  openSurqlProject,
  surqlModuleIn
} from "./chunk-HNIKUY5K.js";

// src/mapper/rpc.ts
var frame = (message) => {
  const body = Buffer.from(JSON.stringify(message), "utf8");
  return Buffer.concat([
    Buffer.from(`Content-Length: ${body.length}\r
\r
`, "ascii"),
    body
  ]);
};
var serveRpc = (input, output, handlers) => new Promise((done, fail) => {
  let buffer = Buffer.alloc(0);
  let pending = Promise.resolve();
  const answer = async (request) => {
    const handler = typeof request.method === "string" ? handlers[request.method] : void 0;
    let reply;
    try {
      if (handler === void 0)
        reply = {
          error: {
            code: -32601,
            message: `unknown method ${String(request.method)}`
          }
        };
      else reply = { result: await handler(request.params) ?? {} };
    } catch (cause) {
      reply = {
        error: {
          code: -32603,
          message: cause instanceof Error ? cause.message : String(cause)
        }
      };
    }
    if (request.id === void 0) return;
    output.write(frame({ jsonrpc: "2.0", id: request.id, ...reply }));
  };
  input.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    for (; ; ) {
      const headerEnd = buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) return;
      const header = buffer.subarray(0, headerEnd).toString("ascii");
      const length = /^content-length:\s*(\d+)\s*$/imu.exec(header);
      if (length === null) {
        fail(
          new Error(
            `a message without Content-Length: ${header}`
          )
        );
        return;
      }
      const start = headerEnd + 4;
      const end = start + Number(length[1]);
      if (buffer.length < end) return;
      const body = buffer.subarray(start, end).toString("utf8");
      buffer = buffer.subarray(end);
      let request;
      try {
        request = JSON.parse(body);
      } catch {
        output.write(
          frame({
            jsonrpc: "2.0",
            id: null,
            error: { code: -32700, message: "parse error" }
          })
        );
        continue;
      }
      pending = pending.then(() => answer(request));
    }
  });
  input.on("end", () => {
    pending.then(() => done(), fail);
  });
  input.on("error", fail);
});

// src/mapper/server.ts
import { dirname } from "path";
var DIAGNOSTIC_SOURCE = "effect-surrealkit";
var DIAGNOSTIC_CODES = {
  analysis: 1,
  name: 2,
  scope: 3,
  undeclared: 4,
  schema: 5,
  option: 6,
  internal: 7,
  config: 8,
  layout: 9
};
var directivesOf = (sql, problems) => problems.length === 0 ? {} : {
  diagnosticDirectives: {
    unusedExpectDirectiveDiagnostics: problems.map(
      (problem) => ({
        code: DIAGNOSTIC_CODES[problem.kind],
        messageText: problem.code === void 0 ? problem.message : `${problem.message} (${problem.code})`
      })
    ),
    directives: problems.map((problem, index) => {
      const start = Math.min(problem.offset, sql.length);
      return [
        start,
        start < sql.length ? 1 : 0,
        0,
        0,
        1,
        index
      ];
    })
  }
};
var mapperHandlers = () => {
  const projects = /* @__PURE__ */ new Map();
  return {
    initialize: (params) => {
      const offered = params?.positionEncodings;
      const encoding = Array.isArray(offered) && !offered.includes("utf-16") ? "utf-8" : "utf-16";
      if (encoding !== "utf-16")
        throw new Error(
          "effect-surrealkit needs the utf-16 position encoding"
        );
      return {
        positionEncoding: encoding,
        diagnosticSource: DIAGNOSTIC_SOURCE
      };
    },
    openProject: (params) => {
      const p = params ?? {};
      const handle = String(p.projectHandle);
      const config = typeof p.configFileName === "string" ? p.configFileName : "";
      const refusal = configurationDrift(config, p.options);
      const project = refusal === void 0 ? openSurqlProject(dirname(config), p.options, { config }) : openSurqlProject(
        config === "" ? process.cwd() : dirname(config),
        void 0,
        { ...config !== "" && { config }, refusal }
      );
      projects.set(handle, project);
      return {
        configIdentity: project.identity,
        watchedFiles: project.config === void 0 ? project.documents : [project.config, ...project.documents],
        optionDiagnostics: refusal === void 0 ? project.problems.map((problem) => ({
          path: problem.path,
          messageText: problem.message,
          code: DIAGNOSTIC_CODES.option
        })) : []
      };
    },
    transform: (params) => {
      const p = params ?? {};
      const fileName = String(p.fileName);
      const sql = typeof p.content === "string" ? p.content : "";
      try {
        const project = projects.get(String(p.projectHandle)) ?? openSurqlProject(dirname(fileName), void 0, {
          refusal: "the content mapper has no project for this file; restart the TypeScript server"
        });
        const module = surqlModuleIn(project, fileName, sql);
        return {
          extension: ".ts",
          text: module.text,
          mappings: [],
          ...directivesOf(sql, module.problems)
        };
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        return {
          extension: ".ts",
          text: EMPTY_SURQL_MODULE,
          mappings: [],
          diagnosticDirectives: {
            unusedExpectDirectiveDiagnostics: [
              {
                code: DIAGNOSTIC_CODES.internal,
                messageText: `effect-surrealkit could not render this file: ${message}`
              }
            ],
            directives: [[0, sql.length > 0 ? 1 : 0, 0, 0, 1, 0]]
          }
        };
      }
    },
    closeProject: (params) => {
      projects.delete(
        String(
          params?.projectHandle
        )
      );
      return {};
    }
  };
};

// src/mapper/bin.ts
serveRpc(process.stdin, process.stdout, mapperHandlers()).then(
  () => process.exit(0),
  (error) => {
    process.stderr.write(
      `effect-surrealkit content mapper: ${error instanceof Error ? error.message : String(error)}
`
    );
    process.exit(1);
  }
);
//# sourceMappingURL=mapper-server.js.map