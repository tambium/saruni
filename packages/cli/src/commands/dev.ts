import concurrently from "concurrently";
import { getPaths } from "@saruni/internal";
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
        command: `cd ${getPaths().web.base} && USE_CLOUD=true yarn dev`,
      },
    ]);
  }

  return await concurrently([
    {
      command: "yarn ds",
    },
    {
      command: `cd ${getPaths().web.base} && yarn dev`,
    },
    {
      command: `cd ${getPaths().api.base} && npx prisma generate --watch`,
    },
  ]);
};
