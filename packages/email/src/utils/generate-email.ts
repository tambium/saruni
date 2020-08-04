import fs from "fs-extra";
import path from "path";
import { getPaths } from "@saruni/internal";

import { createEmail, saveEmail } from "../utils";

export const generateEmail = async () => {
  try {
    const templates = await fs.readdir(
      path.resolve(getPaths().static.compiledEmails)
    );

    if (templates) {
      await fs.ensureDir(getPaths().static.generatedEmails);

      templates.forEach((template) => {
        const expts = require(path.join(
          path.resolve(getPaths().static.compiledEmails),
          template
        ));
        if (expts) {
          Object.keys(expts).forEach((exportKey) => {
            createEmail(expts[exportKey]).then((processedTemplate) => {
              return saveEmail(processedTemplate, exportKey);
            });
          });
        }
      });
    }
  } catch (e) {
    console.error(e);
  }
};
