import execa from "execa";
import { getPaths } from "@saruni/internal";

export const command = "email";

export const desc = "Serve generated HTML emails.";

export const handler = async () => {
  /** Serve contents of `generated/email` directory. */
  await execa("yarn", ["saruni-serve-email"], {
    cwd: getPaths().static.base,
    stdio: "inherit"
  });
};
