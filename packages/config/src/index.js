const { getPaths } = require("@saruni/internal");
const { existsSync } = require("fs-extra");

const config = {
  verbose: true,
  testEnvironment: require.resolve("./node-env.js"),
  rootDir: getPaths().api.base,
};

let finalConfig = config;

if (existsSync(getPaths().api.jestConfig)) {
  const configFunction = require(getPaths().api.jestConfig);

  if (typeof configFunction === "function") {
    finalConfig = configFunction(config);
  }
}

module.exports = finalConfig;
