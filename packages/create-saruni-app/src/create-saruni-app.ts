#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import chalk from 'chalk';
import checkNodeVersion from 'check-node-version';
import decompress from 'decompress';
import execa from 'execa';
import Listr from 'listr';
import tmp from 'tmp';

const RELEASE_URL =
  'https://api.github.com/repos/tambium/create-saruni-app/releases/latest';

const latestReleaseZipFile = async () => {
  const response = await axios.get(RELEASE_URL);
  return response.data.zipball_url;
};

const downloadFile = async (sourceUrl, targetFile) => {
  const writer = fs.createWriteStream(targetFile);
  const response = await axios.get(sourceUrl, {
    responseType: 'stream',
  });
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};

const targetDir = String(process.argv.slice(2)).replace(/,/g, '-');
if (!targetDir) {
  console.error('Please specify the project directory');
  console.log(
    `  ${chalk.cyan('yarn create saruni-app')} ${chalk.green(
      '<project-directory>',
    )}`,
  );
  console.log();
  console.log('For example:');
  console.log(
    `  ${chalk.cyan('yarn create saruni-app')} ${chalk.green('my-saruni-app')}`,
  );
  process.exit(1);
}

const newAppDir = path.resolve(process.cwd(), targetDir);
const appDirExists = fs.existsSync(newAppDir);

if (appDirExists && fs.readdirSync(newAppDir).length > 0) {
  console.error(
    `The project directory you specified (${chalk.green(
      newAppDir,
    )}) already exists and is not empty. Please try again with a different project directory.`,
  );
  process.exit(1);
}

const createProjectTasks = ({ newAppDir }) => {
  const tmpDownloadPath = tmp.tmpNameSync({
    prefix: 'saruni',
    postfix: '.zip',
  });

  return [
    {
      title: `Creating a new Saruni app in ${chalk.green(newAppDir)}.`,
      task: () => {
        fs.mkdirSync(newAppDir, { recursive: true });
      },
    },
    {
      title: 'Downloading latest release',
      task: async () => {
        const url = await latestReleaseZipFile();
        return downloadFile(url, tmpDownloadPath);
      },
    },
    {
      title: 'Extracting latest release',
      task: () => decompress(tmpDownloadPath, newAppDir, { strip: 1 }),
    },
  ];
};

const installNodeModulesTasks = ({ newAppDir }) => {
  return [
    {
      title: 'Checking node and yarn compatibility',
      task: () => {
        return new Promise((resolve, reject) => {
          import(path.join(newAppDir, 'package.json'))
            .then(({ engines }) => {
              checkNodeVersion(engines, (_error, result) => {
                if (result.isSatisfied) {
                  return resolve();
                }

                const errors = Object.keys(result.versions).map((name) => {
                  const { version, wanted } = result.versions[name];
                  return `${name} ${wanted} required, but you have ${version}.`;
                });
                return reject(new Error(errors.join('\n')));
              });
            })
            .catch((rejected) => reject(rejected));
        });
      },
    },
    {
      title: 'Installing packages. This might take a couple of minutes.',
      task: () => {
        return execa('yarn install', {
          shell: true,
          cwd: newAppDir,
        });
      },
    },
  ];
};

const initializeProjectTasks = ({ newAppDir }) => {
  return [
    {
      title: 'Initializing Git repository.',
      task: async () => {
        try {
          await execa('git', ['init'], { cwd: newAppDir });
        } catch (error) {
          console.log(error);
        }
      },
    },
    {
      title: 'Adding changes to staging area.',
      task: async () => {
        try {
          await execa('git', ['add', '.'], { cwd: newAppDir });
        } catch (error) {
          console.log(error);
        }
      },
    },
    {
      title: 'Capturing changes.',
      task: async () => {
        try {
          await execa(
            'git',
            ['commit', '-m', 'Initialize project using Create Saruni App'],
            { cwd: newAppDir },
          );
        } catch (error) {
          console.log(error);
        }
      },
    },
  ];
};

new Listr([
  {
    title: 'Creating Saruni app',
    task: () => new Listr(createProjectTasks({ newAppDir })),
  },
  {
    title: 'Installing packages',
    task: () => new Listr(installNodeModulesTasks({ newAppDir })),
  },
  {
    title: 'Initializing project',
    task: () => new Listr(initializeProjectTasks({ newAppDir })),
  },
])
  .run()
  .then(() => {
    console.log();
    console.log(`Success! We've created your app in ${newAppDir}`);
    console.log();
    console.log(
      'Inside that directory you can run `yarn dev` to start the development server.',
    );
  })
  .catch((error) => {
    console.log();
    console.log(error);
    process.exit(1);
  });
