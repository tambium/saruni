import execa from 'execa';

import { getPaths } from '@saruni/internal';

export const command = 'generate';

export const desc = 'Creates the `PrismaClient` object.';

export const handler = async () => {
  const { stdout, stderr } = await execa('npx', ['prisma', 'generate'], {
    cwd: getPaths().api.base,
  });

  console.log(stdout, stderr);
};
