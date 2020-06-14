import concurrently from "concurrently";
import execa from "execa";

import { getPaths } from "@saruni/internal";

export const command = "dev";

export const desc = "Start development servers.";

export const handler = async () => {
  await execa("cd", [getPaths().base]);

  await concurrently([
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
