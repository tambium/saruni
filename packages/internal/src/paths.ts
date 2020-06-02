import path from "path";
import findUp from "findup-sync";

const CONFIG_FILE_NAME = "saruni.json";
const DOT_ENV = ".env";

const PATH_API_DIR_DB = "packages/api/src/db";
const PATH_API_DIR_FUNCTIONS = "packages/api/src/functions";
const PATH_API_DIR_GRAPHQL = "packages/api/src/graphql";
const PATH_API_DIR_PRISMA = "packages/api/prisma";
const PATH_API_DIR_PRISMA_SCHEMA = "packages/api/prisma/schema.prisma";
const PATH_API_DIR_SERVICES = "packages/api/src/services";
const PATH_API_DIR_SRC = "packages/api/src";
const PATH_WEB_DIR_COMPONENTS = "packages/web/src/components";
const PATH_WEB_DIR_LAYOUTS = "packages/web/src/layouts";
const PATH_WEB_DIR_PAGES = "packages/web/src/pages";
const PATH_WEB_DIR_SRC = "packages/web/src";
const PATH_WEB_DIR_VIEWS = "packages/web/src/views";

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
    api: {
      base: path.join(BASE_DIR, "packages/api"),
      db: path.join(BASE_DIR, PATH_API_DIR_DB),
      functions: path.join(BASE_DIR, PATH_API_DIR_FUNCTIONS),
      graphql: path.join(BASE_DIR, PATH_API_DIR_GRAPHQL),
      prisma: path.join(BASE_DIR, PATH_API_DIR_PRISMA),
      prismaSchema: path.join(BASE_DIR, PATH_API_DIR_PRISMA_SCHEMA),
      services: path.join(BASE_DIR, PATH_API_DIR_SERVICES),
      src: path.join(BASE_DIR, PATH_API_DIR_SRC),
    },
    web: {
      base: path.join(BASE_DIR, "packages/web"),
      components: path.join(BASE_DIR, PATH_WEB_DIR_COMPONENTS),
      layouts: path.join(BASE_DIR, PATH_WEB_DIR_LAYOUTS),
      pages: path.join(BASE_DIR, PATH_WEB_DIR_PAGES),
      src: path.join(BASE_DIR, PATH_WEB_DIR_SRC),
      views: path.join(BASE_DIR, PATH_WEB_DIR_VIEWS),
    },
  };
};
