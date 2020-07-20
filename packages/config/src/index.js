const { getPaths } = require("@saruni/internal");

module.exports = {
  verbose: true,
  rootDir: getPaths().base,
  projects: ["<rootDir>/packages/api", "<rootDir>/packages/web"],
};
