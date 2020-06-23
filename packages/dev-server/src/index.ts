#!/usr/bin/env node
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import type { Request, Response } from "express";
import babelRequireHook from "@babel/register";
import bodyParser from "body-parser";
import chokidar from "chokidar";
import cors from "cors";
import express from "express";
import path from "path";
import qs from "qs";
import requireDir from "require-dir";

import { getPaths } from "@saruni/internal";

const CORS_SAFE_LIST = ["http://localhost:3000", "http://localhost:4000"];

babelRequireHook({
  extends: path.join(getPaths().api.base, ".babelrc.js"),
  extensions: [".js", ".ts"],
  only: [path.resolve(getPaths().api.base)],
  ignore: ["node_modules"],
  cache: false,
});

const parseBody = (rawBody: string | Buffer) => {
  if (typeof rawBody === "string") {
    return { body: rawBody, isBase64Encoded: false };
  }

  if (rawBody instanceof Buffer) {
    return { body: rawBody.toString("base64"), isBase64Encoded: true };
  }

  return { body: "", isBase64Encoded: false };
};

const lambdaEventForExpressRequest = (
  request: Request
): APIGatewayProxyEvent => {
  return {
    httpMethod: request.method,
    headers: request.headers,
    path: request.path,
    queryStringParameters: qs.parse(request.url.split(/\?(.+)/)[1]),
    requestContext: {
      identity: {
        sourceIp: request.ip,
      },
    },
    ...parseBody(request.body), // adds `body` and `isBase64Encoded`
  } as APIGatewayProxyEvent;
};

const expressResponseForLambdaResult = (
  expressResFn: Response,
  lambdaResult: APIGatewayProxyResult
) => {
  const { statusCode = 200, headers, body = "" } = lambdaResult;
  if (headers) {
    Object.keys(headers).forEach((headerName) => {
      const headerValue: any = headers[headerName];
      expressResFn.setHeader(headerName, headerValue);
    });
  }
  expressResFn.statusCode = statusCode;
  // The AWS lambda docs specify that the response object must be
  // compatible with `JSON.stringify`, but the type definition specifices that
  // it must be a string.
  return expressResFn.end(
    typeof body === "string" ? body : JSON.stringify(body)
  );
};

const expressResponseForLambdaError = (
  expressResFn: Response,
  error: Error
) => {
  console.error(error);

  expressResFn.status(500).send(error);
};

const app = express();

app.use(
  bodyParser.text({
    type: ["text/*", "application/json", "multipart/form-data"],
  })
);

app.use(bodyParser.raw({ type: "*/*" }));

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (CORS_SAFE_LIST.indexOf(origin!) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS."));
      }
    },
  })
);

const WATCHER_IGNORE_EXTENSIONS = [".db", ".sqlite", "-journal"];

const apiWatcher = chokidar.watch(getPaths().api.base, {
  ignored: (file: string) =>
    file.includes("node_modules") ||
    WATCHER_IGNORE_EXTENSIONS.some((ext) => file.endsWith(ext)),
});

const importFreshFunctions = (functionsPath) => {
  Object.keys(require.cache).forEach((key) => {
    delete require.cache[key];
  });

  return requireDir(functionsPath, {
    recurse: false,
    extensions: [".js", ".ts"],
  });
};

let functions;

functions = importFreshFunctions(path.resolve(getPaths().api.functions));

apiWatcher.on("ready", () => {
  apiWatcher.on("all", async (event) => {
    if (/add/.test(event)) {
      console.log("New file added. Rebuilding...");
      functions = importFreshFunctions(path.resolve(getPaths().api.functions));
      console.log("New functions deployed.");
    }

    if (/change/.test(event)) {
      console.log("Code change detected. Rebuilding...");
      functions = importFreshFunctions(path.resolve(getPaths().api.functions));
      console.log("New functions deployed.");
    }

    if (/unlink/.test(event)) {
      console.log("Some file deleted. Rebuilding...");
      functions = importFreshFunctions(path.resolve(getPaths().api.functions));
      console.log("New functions deployed.");
    }
  });
});

app.get("/", (_, res) => {
  res.send(`
  <html style="height: 100%; margin: 0; padding: 0;">
    <body
      style="
        color: #e0e6eb;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell,
          Noto Sans, sans-serif, BlinkMacSystemFont, 'Segoe UI', Roboto,
          'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji',
          'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
        font-size: 16px;
        height: 100%;
        line-height: 1.5;
        margin: 0;
        padding: 0;
      "
    >
      <div
        style="
          background-color: #1d1b1c;
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
        "
      >
        <div style="flex-direction: row; margin: 24px;">
          <span style="font-size: 21px; font-weight: 600;">Saruni</span>
        </div>
        <div
          style="
            align-items: center;
            display: flex;
            justify-content: center;
            flex-direction: column;
            flex-grow: 1;
            padding: 16px;
          "
        >
          <div
            style="
              background-color: #262425;
              border-radius: 4px;
              box-sizing: border-box;
              max-width: 440px;
              padding: 16px;
              width: 100%;
            "
          >
            <div style="font-size: 21px; font-weight: 600; margin-bottom: 16px;">
              Function Reference
            </div>
            <ul style="margin: 0;">
              ${Object.entries(functions).map(([key]) => {
                return `<li><a href="/${key}" style="color: #e0e6eb; text-decoration: none;">${key}</a></li>`;
              })}
            </ul>
          </div>
        </div>
      </div>
    </body>
  </html>
  `);
});

const handlerCallback = (expressResFn: Response) => (
  error: Error,
  lambdaResult: APIGatewayProxyResult
) => {
  if (error) {
    return expressResponseForLambdaError(expressResFn, error);
  }
  return expressResponseForLambdaResult(expressResFn, lambdaResult);
};

function isPromise<T>(val: any): val is Promise<T> {
  return val && val.then && typeof val.then === "function";
}

app.all("/:functionName", async (req, res) => {
  const fn = functions[req.params.functionName];

  const event = lambdaEventForExpressRequest(req);

  const context = {};

  if (fn && fn.handler && typeof fn.handler === "function") {
    try {
      const lambdaPromise = fn.handler(event, context, handlerCallback(res)) as
        | APIGatewayProxyResult
        | Promise<APIGatewayProxyResult>;

      if (isPromise(lambdaPromise)) {
        const result = await lambdaPromise;

        expressResponseForLambdaResult(res, result);
      }
    } catch (e) {
      expressResponseForLambdaError(res, e);
    }
  } else {
    res
      .status(500)
      .send("`handler` is not a function or the file does not exist.");
  }
});

app.listen(4000, () => {
  console.log("server started...");
});
