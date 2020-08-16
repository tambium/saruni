import axios from 'axios';
import decompress from 'decompress';
import execa from 'execa';
import fs from 'fs-extra';
import Listr from 'listr';
import path from 'path';
import tmp from 'tmp';

import { getPaths } from '@saruni/internal';

export const command = 'init';

export const desc = 'Inits Saruni project';

const latestReleaseZipFile = async (releaseUrl: string) => {
  const response = await axios.get(releaseUrl);
  return response.data.zipball_url;
};

const downloadFile = async (sourceUrl: string, targetFile: string) => {
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

const getServerlessResources = async (flavour = 'jwt') => {
  const url = await latestReleaseZipFile(
    'https://api.github.com/repos/tambium/sls-resources/releases/latest',
  );

  const tmpDownloadPath = tmp.tmpNameSync({
    prefix: 'sls',
    postfix: '.zip',
  });

  await downloadFile(url, tmpDownloadPath);

  await fs.ensureDir(path.resolve(getPaths().base, 'tmp'));

  await fs.ensureDir(getPaths().sls.resources.base);

  await decompress(tmpDownloadPath, path.resolve(getPaths().base, 'tmp'), {
    strip: 1,
  });

  await fs.copy(
    path.resolve(getPaths().base, 'tmp', `${flavour}/resource`),
    getPaths().sls.resources.base,
  );

  await fs.copy(
    path.resolve(getPaths().base, 'tmp', `${flavour}/serverless.yml`),
    getPaths().sls.yml,
  );

  await fs.copy(
    path.resolve(getPaths().base, 'tmp', `${flavour}/webpack.config.js`),
    path.resolve(getPaths().api.base, 'webpack.config.js'),
  );

  await fs.remove(path.resolve(getPaths().base, 'tmp', `${flavour}/resource`));
};

export const handler = async () => {
  try {
    await new Listr([
      // {
      //   title: `Init git repo`,
      //   task: async () => {
      //     await execa("git", ["init"]);
      //   },
      // },
      // {
      //   title: `create .env`,
      //   task: async () => {
      //     await execa("git", ["init"]);
      //   },
      // },
      {
        title: `Set up the serverless framewor`,
        task: async () => {
          return new Listr([
            {
              title: 'Downloading serverless resources',
              task: () => getServerlessResources(),
            },
            {
              title: 'Installing sls dependencies',
              task: async () => {
                await execa(
                  'yarn',
                  [
                    '-W',
                    'add',
                    'serverless-webpack',
                    'serverless-pseudo-parameters',
                  ],
                  { cwd: getPaths().base },
                );

                await execa('yarn', ['add', '-D', 'babel-loader'], {
                  cwd: getPaths().api.base,
                });
              },
            },
          ]);
        },
      },
    ]).run();
  } catch (e) {
    console.log(e);
  }
};
