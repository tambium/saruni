import { makeExecutableSchema } from "@saruni/api";
import { getPaths } from "@saruni/internal";
import { graphql, ExecutionResult } from "graphql";
import path from "path";
import type { PrismaClient } from "@prisma/client";

const babelRequireHook = require("@babel/register");

babelRequireHook({
  extends: path.join(getPaths().api.base, ".babelrc.js"),
  extensions: [".js", ".ts"],
  only: [path.resolve(getPaths().api.graphql)],
  ignore: ["node_modules"],
  cache: false,
});

const { resolvers, typeDefs } = require(getPaths().api.graphql);

interface TestContext {
  db: PrismaClient;
  executeGraphql: (
    source: string,
    options?: {
      variables?: any;
      context?: any;
    }
  ) => Promise<ExecutionResult>;
  setGraphQLContext: (context: any) => void;
}

export const createApiTestContext = (db: PrismaClient): TestContext => {
  let mainContext = {};

  let schema = makeExecutableSchema({ typeDefs, resolvers });

  beforeAll(async () => {});

  afterAll(async () => {
    // await db.queryRaw(`DROP SCHEMA IF EXISTS "public" CASCADE`);

    await db.$disconnect();
  });

  async function executeGraphql(
    source: string,
    options?: { variables: any; context: any }
  ) {
    let extendedOptions: { variableValues?: any; contextValue } = {
      contextValue: mainContext,
    };

    if (options?.variables) {
      extendedOptions.variableValues = options.variables;
    }

    if (options?.context) {
      extendedOptions.contextValue = { ...mainContext, ...options.context };
    }

    const result = await graphql({
      source,
      schema,
      ...extendedOptions,
    });

    return result;
  }

  return {
    db,
    executeGraphql,
    setGraphQLContext: (ctx) => {
      mainContext = ctx;
    },
  };
};
