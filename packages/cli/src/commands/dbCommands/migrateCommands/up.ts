import execa from "execa";

import { getPaths } from "@saruni/internal";

export const command = "up";

export const desc = "Migrate the database up to a specific state.";

export const handler = async () => {
  const { stdout, stderr } = await execa(
    "npx",
    ["prisma", "migrate", "up", "--experimental"],
    {
      cwd: getPaths().api.base,
    }
  );

  console.log(stdout, stderr);
};
