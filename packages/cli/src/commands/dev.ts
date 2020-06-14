import concurrently from "concurrently";

export const command = "dev";

export const desc = "Start development servers.";

export const handler = async () => {
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
