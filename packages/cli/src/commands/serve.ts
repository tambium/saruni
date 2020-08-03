import type { Argv } from "yargs";

export const command = "serve <command>";

export const desc = "Serve commands.";

export const builder = (yargs: Argv) => {
  yargs.commandDir("./serveCommands").demandCommand();
};
