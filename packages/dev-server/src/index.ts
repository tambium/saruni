#!/usr/bin/env node
import path from 'path';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import type { Request, Response } from 'express';
import babelRequireHook from '@babel/register';
import bodyParser from 'body-parser';
import chalk from 'chalk';
import chokidar from 'chokidar';
import cors from 'cors';
import execa from 'execa';
import express from 'express';
import fs from 'fs-extra';
import qs from 'qs';
import requireDir from 'require-dir';

import { getPaths } from '@saruni/internal';

const saruniJson = require(getPaths().saruni);

const CORS_SAFE_LIST = [
  `http://localhost:${saruniJson.devServerPort.web}`,
  `http://localhost:${saruniJson.devServerPort.api}`,
];

process.env.STAGE = 'local';

babelRequireHook({
  extends: path.join(getPaths().api.base, '.babelrc.js'),
  extensions: ['.js', '.ts'],
  only: [path.resolve(getPaths().api.base)],
  ignore: ['node_modules'],
  cache: false,
});

const parseBody = (rawBody: string | Buffer) => {
  if (typeof rawBody === 'string') {
    return { body: rawBody, isBase64Encoded: false };
  }

  if (rawBody instanceof Buffer) {
    return { body: rawBody.toString('base64'), isBase64Encoded: true };
  }

  return { body: '', isBase64Encoded: false };
};

const lambdaEventForExpressRequest = (
  request: Request,
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
    // adds `body` and `isBase64Encoded`
    ...parseBody(request.body),
  } as APIGatewayProxyEvent;
};

const expressResponseForLambdaResult = (
  expressResFn: Response,
  lambdaResult: APIGatewayProxyResult,
) => {
  const { statusCode = 200, headers, body = '' } = lambdaResult;
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
    typeof body === 'string' ? body : JSON.stringify(body),
  );
};

const expressResponseForLambdaError = (
  expressResFn: Response,
  error: Error,
) => {
  console.error(error);

  expressResFn.status(500).send(error);
};

const app = express();

app.use(
  bodyParser.text({
    type: ['text/*', 'application/json', 'multipart/form-data'],
    limit: '50mb',
  }),
);

app.use(bodyParser.json({ limit: '50mb' }));

app.use(bodyParser.raw({ type: '*/*', limit: '50mb' }));

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (CORS_SAFE_LIST.indexOf(origin!) !== -1 || !origin) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS.'));
      }
    },
  }),
);

const graphqlWatcher = chokidar.watch(getPaths().web.graphql);

let isGeneratingGraphqlFiles = false;

graphqlWatcher.on('ready', () => {
  graphqlWatcher.on('change', async () => {
    try {
      if (!isGeneratingGraphqlFiles) {
        console.log(
          chalk.green('GraphQL schema files changed. Generating new files...'),
        );

        isGeneratingGraphqlFiles = true;

        await execa('yarn', ['gen'], { cwd: getPaths().web.base });

        console.log(chalk.green('New files have been generated for apollo.'));
      }
    } catch (error) {
      console.log(error);
    } finally {
      isGeneratingGraphqlFiles = false;
    }
  });
});

const WATCHER_IGNORE_EXTENSIONS = ['.db'];

const apiWatcher = chokidar.watch(getPaths().api.base, {
  ignored: (file: string) =>
    file.includes('node_modules') ||
    WATCHER_IGNORE_EXTENSIONS.some((ext) => file.endsWith(ext)),
});

const importFreshFunctions = async (functionsPath) => {
  Object.keys(require.cache).forEach((key) => {
    delete require.cache[key];
  });

  const services = await fs.readdir(functionsPath);

  return services
    .filter((item) => item !== '.keep')
    .map((item) => {
      return requireDir(path.resolve(functionsPath, item), {
        extensions: ['.js', '.ts'],
      });
    })
    .reduce((sum, item) => {
      return { ...sum, ...item };
    }, {});
};

let functions;

apiWatcher.on('ready', async () => {
  functions = await importFreshFunctions(path.resolve(getPaths().api.services));

  apiWatcher.on('all', async (event) => {
    if (/add/.test(event)) {
      console.log('New file added. Rebuilding...');
      functions = await importFreshFunctions(
        path.resolve(getPaths().api.services),
      );
      console.log('New functions deployed.');
    }

    if (/change/.test(event)) {
      console.log('Code change detected. Rebuilding...');
      functions = await importFreshFunctions(
        path.resolve(getPaths().api.services),
      );
      console.log('New functions deployed.');
    }

    if (/unlink/.test(event)) {
      console.log('Some file deleted. Rebuilding...');
      functions = await importFreshFunctions(
        path.resolve(getPaths().api.services),
      );
      console.log('New functions deployed.');
    }
  });
});

app.get('/', (_req, res) => {
  res.send(`
  <html>
  <body style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%;" >
    <div>The following functions are available:</div>
    <ul>
  ${Object.entries(functions).map(([key]) => {
    return `<li><a href="/${key}">${key}</a></li>`;
  })}
    </ul>
  </body>
</html>
  `);
});

const handlerCallback = (expressResFn: Response) => (
  error: Error,
  lambdaResult: APIGatewayProxyResult,
) => {
  if (error) {
    return expressResponseForLambdaError(expressResFn, error);
  }
  return expressResponseForLambdaResult(expressResFn, lambdaResult);
};

function isPromise<T>(val: any): val is Promise<T> {
  return val && val.then && typeof val.then === 'function';
}

app.all('/:functionName', async (req, res) => {
  const fn = functions[req.params.functionName];

  const event = lambdaEventForExpressRequest(req);

  const context = {};

  if (fn && fn.handler && typeof fn.handler === 'function') {
    try {
      const lambdaPromise = fn.handler(event, context, handlerCallback(res)) as
        | APIGatewayProxyResult
        | Promise<APIGatewayProxyResult>;

      if (isPromise(lambdaPromise)) {
        const result = await lambdaPromise;

        expressResponseForLambdaResult(res, result);
      }
    } catch (error) {
      expressResponseForLambdaError(res, error);
    }
  } else {
    res
      .status(500)
      .send('`handler` is not a function or the file does not exist.');
  }
});

app.listen(saruniJson.devServerPort.api, () => {
  console.log(`API server started on port: ${saruniJson.devServerPort.api}`);
});
