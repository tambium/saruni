import execa from "execa";
import fs from "fs-extra";
import Listr from "listr";
import path from "path";

import { getPaths } from "@saruni/internal";

export const command = "repull";

export const desc =
  "pulls the latest published @saruni packages from local verdaccio registry";

export const handler = async () => {
  try {
    await new Listr([
      {
        title: `Checking if ".yarnrc" is present`,
        task: async () => {
          const yarnrc = await fs.readFile(
            path.resolve(getPaths().base, ".yarnrc"),
            "utf8"
          );

          if (!yarnrc) {
            throw new Error(
              ".yarnrc does not exist. Packages will be pulled from the npm registry instead of verdaccio."
            );
          }

          if (!yarnrc.includes(`registry "http://localhost:4873/"`)) {
            throw new Error(
              ".yarnrc does not point to the local verdaccio registry"
            );
          }
        },
      },
      {
        title: "removing @saruni dependencies",
        task: async () =>
          new Listr([
            {
              title: "worktree/package/api",
              task: async () => {
                await execa("yarn", ["remove", "@saruni/api"], {
                  cwd: getPaths().api.base,
                });
              },
            },
            {
              title: "worktree",
              task: async () => {
                await execa("yarn", [
                  "-W",
                  "remove",
                  "@saruni/cli",
                  "@saruni/dev-server",
                ]);
              },
            },
          ]),
      },
      {
        title: "reinstalling @saruni dependencies",
        task: async () =>
          new Listr([
            {
              title: "worktree/package/api",
              task: async () => {
                await execa("yarn", ["add", "@saruni/api"], {
                  cwd: getPaths().api.base,
                });
              },
            },
            {
              title: "worktree",
              task: async () => {
                await execa("yarn", [
                  "-W",
                  "add",
                  "@saruni/cli",
                  "@saruni/dev-server",
                ]);
              },
            },
          ]),
      },
    ]).run();
  } catch (e) {
    console.log(e);
  }
};
