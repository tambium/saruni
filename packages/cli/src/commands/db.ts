import type { Argv } from "yargs";

export const command = "db <command>";
export const aliases = ["database"];

export const desc = "Database commands.";

export const builder = (yargs: Argv) => {
  return yargs
    .option("stage", {
      default: "local",
      type: "string",
      choices: ["test", "prod", "dev", "local"],
    })
    .commandDir("./dbCommands")
    .demandCommand();
};
