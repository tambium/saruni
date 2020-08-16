import execa from 'execa';

import { getPaths } from '@saruni/internal';

export const command = 'init';

export const desc = 'Initializes database.';

export const handler = async () => {
  const { stdout } = await execa('npx', ['prisma', 'init'], {
    cwd: getPaths().api.base,
  });
};
