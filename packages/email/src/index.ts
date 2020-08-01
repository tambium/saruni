import express from "express";
import fs from "fs-extra";
import path from "path";
import { getPaths } from "@saruni/internal";

import { createEmail, saveEmail } from "./utils";

const server = express();
const PORT = 2000;

(async () => {
  try {
    const templates = await fs.readdir(path.resolve(getPaths().static.email));

    templates.forEach((template) => {
      const exports = require(path.join(
        path.resolve(getPaths().static.email),
        template
      ));
      Object.keys(exports).forEach((exportKey) => {
        createEmail(exports[exportKey]).then((processedTemplate) => {
          return saveEmail(processedTemplate, exportKey);
        });
      });
    });
  } catch (e) {
    console.log(`Error processing templates: `, e);
  }

  server.use("/", express.static("public"));

  server.listen(PORT, async () => {
    console.log(`Emails available at localhost:${PORT}...`);
  });
})();
