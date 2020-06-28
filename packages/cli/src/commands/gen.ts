import type { Argv } from "yargs";

export const command = "gen <command>";
export const aliases = ["generate"];

export const desc = "Generate commands.";

export const builder = (yargs: Argv) => {
  yargs.commandDir("./genCommands").demandCommand();
};
