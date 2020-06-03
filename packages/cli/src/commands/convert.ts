import execa from "execa";
import fs from "fs-extra";
import Listr from "listr";
import path from "path";

import { getPaths } from "@saruni/internal";

export const command = "convert";

export const desc =
  "converts a saruni project into a test project by replacing npm registry";

export const handler = async () => {
  try {
    await new Listr([
      {
        title: `Create .yarnrc file and replacing registry`,
        task: async () => {
          await fs.writeFile(
            path.resolve(getPaths().base, ".yarnrc"),
            `registry "http://localhost:4873/"`
          );
        },
      },
      {
        title: `Deleting yarn.lock`,
        task: async () => {
          await execa("rm", ["-rf", "yarn.lock"]);
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
                await execa(
                  "yarn",
                  ["-W", "remove", "@saruni/cli", "@saruni/dev-server"],
                  { cwd: getPaths().base }
                );
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
                await execa(
                  "yarn",
                  ["-W", "add", "@saruni/cli", "@saruni/dev-server"],
                  { cwd: getPaths().base }
                );
              },
            },
          ]),
      },
    ]).run();
  } catch (e) {
    console.log(e);
  }
};
