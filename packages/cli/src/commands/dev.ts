import concurrently from "concurrently";
import { CommandBuilder } from "yargs";

export const command = "dev <useCloud>";

export const desc = "Start development servers.";

export const builder: CommandBuilder = (yargs) => {
  return yargs.option("cloud", { alias: "u", default: "false" });
};

export const handler = async (args: { cloud: boolean }) => {
  console.log(args);
  if (args.cloud) {
    return await concurrently([
      {
        command: "cd packages/web && yarn dev:useCloud",
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
