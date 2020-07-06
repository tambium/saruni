import concurrently from "concurrently";
import { CommandBuilder } from "yargs";

export const command = "dev";

export const desc = "Start development servers.";

export const builder: CommandBuilder = (yargs) => {
  return yargs.option("cloud", { default: false, type: "boolean" });
};

export const handler = async (args: { cloud: boolean }) => {
  if (args.cloud === true) {
    return await concurrently([
      {
        command: "cd packages/web && yarn dev:cloud",
      },
    ]);
  }

  return await concurrently([
    {
      command: "yarn ds",
    },
    {
      command: "cd packages/web && yarn dev",
    },
    {
      command: "cd packages/api && npx prisma generate --watch",
    },
  ]);
};
