#!/usr/bin/env node
import express from "express";
import chalk from "chalk";
import path from "path";
import terminalLink from "terminal-link";
import { getPaths } from "@saruni/internal";

const server = express();
const PORT = 2000;

(async () => {
  server.use(
    "/",
    express.static(path.resolve(getPaths().static.generatedEmails))
  );

  server.listen(PORT, async () => {
    console.log(
      `${chalk.green(`● saruni:serve:emails`)} listening -- url: ${chalk.green(
        terminalLink(`'localhost:${PORT}'`, `http://localhost:${PORT}`)
      )}`
    );
  });
})();
