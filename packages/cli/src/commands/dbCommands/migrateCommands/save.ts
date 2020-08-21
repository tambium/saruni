import execa from 'execa';

import { getPaths } from '@saruni/internal';

export const command = 'save';

export const desc =
  'Saves a migration that defines the steps necessary to update the current schema.';

export const handler = async () => {
  const { stdout, stderr } = await execa(
    'npx',
    ['prisma', 'migrate', 'save', '--experimental'],
    {
      cwd: getPaths().api.prisma,
      stdio: 'inherit',
    },
  );

  console.log(stdout, stderr);
};
