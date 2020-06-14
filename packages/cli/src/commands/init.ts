import execa from "execa";
import fs from "fs-extra";
import Listr from "listr";

import { getPaths } from "@saruni/internal";

export const command = "init";

export const desc = "Inits Saruni project";

export const handler = async () => {
  try {
    await new Listr([
      {
        title: `Init git repo`,
        task: async () => {
          await execa("git", ["init"]);
        },
      },
      {
        title: `Moving serverless resource files`,
        task: async () => {
          // fetch from git repo
          // install   "serverless-pseudo-parameters": "^2.5.0",
          // "serverless-webpack": "^5.3.2"

          await fs.ensureDir(getPaths().sls.resources.base);
        },
      },
    ]).run();
  } catch (e) {
    console.log(e);
  }
};
