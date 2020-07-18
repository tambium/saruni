const babelRequireHook = require("@babel/register");
const { getPaths } = require("@saruni/internal");
const chalk = require("chalk");
const { config } = require("dotenv");
const execa = require("execa");
const NodeEnvironment = require("jest-environment-node");
const path = require("path");

config({ path: getPaths().env });

process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;

babelRequireHook({
  extends: path.join(getPaths().api.base, ".babelrc.js"),
  extensions: [".js", ".ts"],
  only: [path.resolve(getPaths().api.db)],
  ignore: ["node_modules"],
  cache: false,
});

const { db } = require(getPaths().api.db);

const mainText = chalk.white.bgMagenta.bold;

const errorText = chalk.white.bgRed.bold;

class PrismaTestEnvironment extends NodeEnvironment {
  constructor(c) {
    super(c);
  }

  async setup() {
    console.log(mainText(`Global setup for test runner.\n`));

    console.log(
      mainText(`Url of the test db is: ${process.env.DATABASE_URL}\n`)
    );

    console.log(mainText("Applying migrations to the test database...\n"));

    try {
      await execa("npx", ["prisma", "migrate", "up", "--experimental"]);

      console.log(mainText("Migrations applied.\n"));
    } catch (e) {
      console.log(
        errorText(
          "Something went wrong while applying the migrations within the test database.\n"
        )
      );
    }

    try {
      console.log(mainText("Applying global seeds...\n"));

      await execa("yarn", ["sr", "db", "seed"]);

      console.log(mainText("Seeding done.\n"));
    } catch (e) {
      console.log(
        errorText(
          "Something went wrong while applying the seeds within the test database.\n"
        )
      );
    }

    return super.setup();
  }

  async teardown() {
    console.log(mainText("Dropping schema...\n"));

    await db.queryRaw(`DROP SCHEMA IF EXISTS "public" CASCADE`);

    await db.disconnect();

    console.log(mainText("Schema dropped. Connection closed.\n"));
  }
}

module.exports = PrismaTestEnvironment;
