import execa from "execa";
import { getPaths } from "@saruni/internal";

export const command = "emails";
export const aliases = ["email"];

export const desc =
  "Generate HTML emails with inline CSS suitable for various clients.";

export const handler = async () => {
  /** Compile emails to `dist/emails` directory. */
  await execa(
    "babel",
    [
      "--out-dir",
      "./dist",
      "--extensions",
      ".ts,.tsx",
      "./src",
      "--presets",
      "@tambium/babel-preset,@tambium/babel-preset/react",
    ],
    {
      cwd: getPaths().static.base,
    }
  );

  /** Inline CSS, stringify HTML and send to `generated/emails` directory. */
  await execa("yarn", ["saruni-generate-emails"], {
    cwd: getPaths().static.base,
  });
};
