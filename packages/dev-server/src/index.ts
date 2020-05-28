#!/usr/bin/env node
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import type { Request, Response } from "express";
import babelRequireHook from "@babel/register";
import chokidar from "chokidar";
import express from "express";
import path from "path";
import qs from "qs";
import requireDir from "require-dir";

import { getPaths } from "@saruni/internal";

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

const functionsWatcher = chokidar.watch(getPaths().api.functions);

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

functionsWatcher.on("all", () => {
  console.log("lambda function change");

  babelRequireHook({
    extends: path.join(getPaths().base, ".babelrc.js"),
    extensions: [".js", ".ts"],
    only: [path.resolve(getPaths().api.functions)],
    ignore: ["node_modules"],
    cache: false,
  });

  functions = importFreshFunctions(path.resolve(getPaths().api.functions));
});

app.get("/:functionName", async (req, res) => {
  const fn = functions[req.params.functionName];

  const event = lambdaEventForExpressRequest(req);

  const context = {};

  if (fn && fn.handler && typeof fn.handler === "function") {
    try {
      const result = (await fn.handler(
        event,
        context
      )) as APIGatewayProxyResult;

      expressResponseForLambdaResult(res, result);
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
