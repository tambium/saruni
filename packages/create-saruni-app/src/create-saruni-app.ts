#!/usr/bin/env node

import fs from "fs";
import path from "path";

import decompress from "decompress";
import axios from "axios";
import Listr from "listr";
import execa from "execa";
import tmp from "tmp";
import checkNodeVersion from "check-node-version";
import chalk from "chalk";

const RELEASE_URL =
  "https://api.github.com/repos/tambium/create-saruni-app/releases/latest";

const latestReleaseZipFile = async () => {
  const response = await axios.get(RELEASE_URL);
  return response.data.zipball_url;
};

const downloadFile = async (sourceUrl, targetFile) => {
  const writer = fs.createWriteStream(targetFile);
  const response = await axios.get(sourceUrl, {
    responseType: "stream",
  });
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
};

const targetDir = String(process.argv.slice(2)).replace(/,/g, "-");
if (!targetDir) {
  console.error("Please specify the project directory");
  console.log(
    `  ${chalk.cyan("yarn create saruni-app")} ${chalk.green(
      "<project-directory>"
    )}`
  );
  console.log();
  console.log("For example:");
  console.log(
    `  ${chalk.cyan("yarn create saruni-app")} ${chalk.green("my-saruni-app")}`
  );
  process.exit(1);
}

const newAppDir = path.resolve(process.cwd(), targetDir);
const appDirExists = fs.existsSync(newAppDir);

if (appDirExists && fs.readdirSync(newAppDir).length > 0) {
  console.error(`'${newAppDir}' already exists and is not empty.`);
  process.exit(1);
}

const createProjectTasks = ({ newAppDir }) => {
  const tmpDownloadPath = tmp.tmpNameSync({
    prefix: "saruni",
    postfix: ".zip",
  });

  return [
    {
      title: `${appDirExists ? "Using" : "Creating"} directory '${newAppDir}'`,
      task: () => {
        fs.mkdirSync(newAppDir, { recursive: true });
      },
    },
    {
      title: "Downloading latest release",
      task: async () => {
        const url = await latestReleaseZipFile();
        return downloadFile(url, tmpDownloadPath);
      },
    },
    {
      title: "Extracting latest release",
      task: () => decompress(tmpDownloadPath, newAppDir, { strip: 1 }),
    },
  ];
};

const installNodeModulesTasks = ({ newAppDir }) => {
  return [
    {
      title: "Checking node and yarn compatibility",
      task: () => {
        return new Promise((resolve, reject) => {
          const { engines } = require(path.join(newAppDir, "package.json"));

          checkNodeVersion(engines, (_error, result) => {
            if (result.isSatisfied) {
              return resolve();
            }

            const errors = Object.keys(result.versions).map((name) => {
              const { version, wanted } = result.versions[name];
              return `${name} ${wanted} required, but you have ${version}.`;
            });
            return reject(new Error(errors.join("\n")));
          });
        });
      },
    },
    {
      title: "Running `yarn install`... (This could take a while)",
      task: () => {
        return execa("yarn install", {
          shell: true,
          cwd: newAppDir,
        });
      },
    },
  ];
};

new Listr(
  [
    {
      title: "Creating Saruni app",
      task: () => new Listr(createProjectTasks({ newAppDir })),
    },
    {
      title: "Installing packages",
      task: () => new Listr(installNodeModulesTasks({ newAppDir })),
    },
  ],
  { collapse: false, exitOnError: true }
)
  .run()
  .then(() => {
    console.log();
    console.log(`Success! We've created your app in '${newAppDir}'`);
    console.log();
    console.log(
      "Inside that directory you can run `yarn dev` to start the development server."
    );
  })
  .catch((e) => {
    console.log();
    console.log(e);
    process.exit(1);
  });
