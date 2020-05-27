import type { Argv } from "yargs";

export const command = "db <command>";
export const aliases = ["database"];

export const desc = "Database commands.";

export const builder = (yargs: Argv) => {
  yargs.commandDir("./dbCommands").demandCommand();
};
