import execa from 'execa';
import fs from 'fs-extra';
import Listr from 'listr';
import path from 'path';

import { getPaths, getSaruniPackages } from '@saruni/internal';

export const command = 'repull';

export const desc =
  'pulls the latest published @saruni packages from local verdaccio registry';

export const handler = async () => {
  try {
    const { api, root, web } = await getSaruniPackages();

    await new Listr([
      {
        title: `Checking if ".yarnrc" is present`,
        task: async () => {
          const yarnrc = await fs.readFile(
            path.resolve(getPaths().base, '.yarnrc'),
            'utf8',
          );

          if (!yarnrc) {
            throw new Error(
              '.yarnrc does not exist. Packages will be pulled from the npm registry instead of verdaccio.',
            );
          }

          if (!yarnrc.includes(`registry "http://localhost:4873/"`)) {
            throw new Error(
              '.yarnrc does not point to the local verdaccio registry',
            );
          }
        },
      },
      {
        title: 'removing @saruni dependencies',
        task: async () =>
          new Listr([
            {
              title: 'worktree/packages/api',
              task: async () => {
                if (api.length > 0)
                  await execa('yarn', ['remove', ...api], {
                    cwd: getPaths().api.base,
                  });
              },
            },
            {
              title: 'worktree/packages/web',
              task: async () => {
                if (web.length > 0)
                  await execa('yarn', ['remove', ...web], {
                    cwd: getPaths().web.base,
                  });
              },
            },
            {
              title: 'worktree/root',
              task: async () => {
                if (root.length > 0)
                  await execa('yarn', ['-W', 'remove', ...root], {
                    cwd: getPaths().base,
                  });
              },
            },
          ]),
      },
      {
        title: 'reinstalling @saruni dependencies',
        task: async () =>
          new Listr([
            {
              title: 'worktree/packages/api',
              task: async () => {
                if (api.length > 0)
                  await execa('yarn', ['add', ...api], {
                    cwd: getPaths().api.base,
                  });
              },
            },
            {
              title: 'worktree/packages/web',
              task: async () => {
                if (web.length > 0)
                  await execa('yarn', ['add', ...web], {
                    cwd: getPaths().web.base,
                  });
              },
            },
            {
              title: 'worktree/root',
              task: async () => {
                if (root.length > 0)
                  await execa('yarn', ['-W', 'add', ...root], {
                    cwd: getPaths().base,
                  });
              },
            },
          ]),
      },
    ]).run();
  } catch (e) {
    console.log(e);
  }
};
