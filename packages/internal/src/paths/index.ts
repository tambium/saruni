import path from "path";
import findUp from "findup-sync";
import { readFile } from "fs-extra";

const CONFIG_FILE_NAME = "saruni.json";
const DOT_ENV = ".env";
const JEST_CONFIG = "jest.config.js";
const SERVERLESS_YML = "serverless.yml";

const PATH_API_DIR = "packages/api";
const PATH_API_DIR_DB = "packages/api/src/db";
const PATH_API_DIR_FUNCTIONS = "packages/api/src/functions";
const PATH_API_DIR_GRAPHQL = "packages/api/src/graphql";
const PATH_API_DIR_PRISMA = "packages/api/prisma";
const PATH_API_DIR_PRISMA_SCHEMA = "packages/api/prisma/schema.prisma";
const PATH_API_DIR_SERVICES = "packages/api/src/services";
const PATH_API_DIR_SRC = "packages/api/src";
const PATH_STATIC_DIR = "packages/static";
const PATH_STATIC_COMPILED_EMAILS = "packages/static/dist/emails";
const PATH_STATIC_GENERATED_EMAILS = "packages/static/generated/emails";
const PATH_WEB_DIR = "packages/web";
const PATH_WEB_DIR_COMPONENTS = "packages/web/src/components";
const PATH_WEB_DIR_GRAPHQL = "packages/web/src/graphql";
const PATH_WEB_DIR_LAYOUTS = "packages/web/src/layouts";
const PATH_WEB_DIR_PAGES = "packages/web/src/pages";
const PATH_WEB_DIR_SRC = "packages/web/src";
const PATH_WEB_DIR_VIEWS = "packages/web/src/views";
const PATH_SERVERLESS_DIR_RESOURCES = "resource";

async function filterSaruniDepsFromPackageJson(path) {
  const { dependencies } = JSON.parse(await readFile(path, "utf8"));

  return Object.keys(dependencies).filter((depName) =>
    depName.includes("@saruni")
  );
}

/**
 * Search the parent directories for the Saruni configuration file.
 */
export const getConfigPath = (): string => {
  const configPath = findUp(CONFIG_FILE_NAME);
  if (!configPath) {
    throw new Error(
      `Could not find a "${CONFIG_FILE_NAME}" file, are you sure you're in a Saruni project?`
    );
  }
  return configPath;
};

/**
 * The Saruni config file is used as an anchor for the base directory of a project.
 */
export const getBaseDir = (configPath: string = getConfigPath()): string => {
  return path.dirname(configPath);
};

/**
 * Path constants that are relevant to a Saruni project.
 */
export const getPaths = (BASE_DIR: string = getBaseDir()) => {
  return {
    base: BASE_DIR,
    env: path.join(BASE_DIR, DOT_ENV),
    sls: {
      base: path.join(BASE_DIR),
      yml: path.join(BASE_DIR, SERVERLESS_YML),
      resources: {
        base: path.join(BASE_DIR, PATH_SERVERLESS_DIR_RESOURCES),
      },
    },
    packagejson: path.join(BASE_DIR, "package.json"),
    api: {
      base: path.join(BASE_DIR, PATH_API_DIR),
      db: path.join(BASE_DIR, PATH_API_DIR_DB),
      functions: path.join(BASE_DIR, PATH_API_DIR_FUNCTIONS),
      graphql: path.join(BASE_DIR, PATH_API_DIR_GRAPHQL),
      prisma: path.join(BASE_DIR, PATH_API_DIR_PRISMA),
      prismaSchema: path.join(BASE_DIR, PATH_API_DIR_PRISMA_SCHEMA),
      services: path.join(BASE_DIR, PATH_API_DIR_SERVICES),
      src: path.join(BASE_DIR, PATH_API_DIR_SRC),
      packagejson: path.join(BASE_DIR, PATH_API_DIR, "package.json"),
      seedFile: path.join(BASE_DIR, PATH_API_DIR_DB, "seed.ts"),
      jestConfig: path.join(BASE_DIR, PATH_API_DIR, JEST_CONFIG),
    },
    static: {
      base: path.join(BASE_DIR, PATH_STATIC_DIR),
      compiledEmails: path.join(BASE_DIR, PATH_STATIC_COMPILED_EMAILS),
      generatedEmails: path.join(BASE_DIR, PATH_STATIC_GENERATED_EMAILS),
    },
    web: {
      base: path.join(BASE_DIR, PATH_WEB_DIR),
      components: path.join(BASE_DIR, PATH_WEB_DIR_COMPONENTS),
      layouts: path.join(BASE_DIR, PATH_WEB_DIR_LAYOUTS),
      graphql: path.join(BASE_DIR, PATH_WEB_DIR_GRAPHQL),
      pages: path.join(BASE_DIR, PATH_WEB_DIR_PAGES),
      src: path.join(BASE_DIR, PATH_WEB_DIR_SRC),
      views: path.join(BASE_DIR, PATH_WEB_DIR_VIEWS),
      packagejson: path.join(BASE_DIR, PATH_WEB_DIR, "package.json"),
    },
  };
};

export const getSaruniPackages = async () => {
  return {
    root: await filterSaruniDepsFromPackageJson(getPaths().packagejson),
    api: await filterSaruniDepsFromPackageJson(getPaths().api.packagejson),
    web: await filterSaruniDepsFromPackageJson(getPaths().web.packagejson),
  };
};
