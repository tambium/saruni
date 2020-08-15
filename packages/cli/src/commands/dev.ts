import concurrently from "concurrently";
import { getPaths } from "@saruni/internal";
import { CommandBuilder } from "yargs";

const saruniJson = require(getPaths().saruni);

export const command = "dev";

export const desc = "Start development servers.";

export const builder: CommandBuilder = (yargs) => {
  return yargs.option("cloud", { default: false, type: "boolean" });
};

export const handler = async (args: { cloud: boolean }) => {
  let nextCommand = `yarn dev`;

  if (saruniJson.devServerPort.web !== "3000") {
    nextCommand = `npx next dev -p ${saruniJson.devServerPort.web}`;
  }

  if (args.cloud === true) {
    return await concurrently([
      {
        command: `cd ${getPaths().web.base} && USE_CLOUD=true ${nextCommand}`,
      },
    ]);
  }

  return await concurrently([
    {
      command: "yarn ds",
    },
    {
      command: `cd ${getPaths().web.base} && ${nextCommand}`,
    },
    {
      command: `cd ${getPaths().api.base} && npx prisma generate --watch`,
    },
  ]);
};
