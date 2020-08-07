import execa from "execa";
import { remove } from "fs-extra";
import { getPaths } from "@saruni/internal";

export const command = "emails";
export const aliases = ["email"];

export const desc = "Compile email templates with babel and tsc.";

export const handler = async () => {
  await remove(getPaths().static.generatedEmails);

  await execa(
    "babel",
    ["--out-dir", "./generated", "--extensions", ".ts,.tsx", "./src"],
    {
      cwd: getPaths().static.emails,
    }
  );

  await execa(
    "tsc",
    ["--outDir", "./generated", "--rootDir", "./src", "-p", "./tsconfig.json"],
    {
      cwd: getPaths().static.emails,
    }
  );
};
