import type { Argv } from "yargs";

export const command = "migrate <command>";

export const desc = "Migration commands.";

export const builder = (yargs: Argv) => {
  yargs.commandDir("./migrateCommands").demandCommand();
};
