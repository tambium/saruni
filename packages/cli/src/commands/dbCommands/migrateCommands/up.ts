import execa from 'execa';

import { getPaths } from '@saruni/internal';

export const command = 'up';

export const desc = 'Migrate the database up to a specific state.';

export const handler = async (args) => {
  switch (args.stage) {
    case 'dev':
      process.env.DATABASE_URL = process.env.DATABASE_URL_DEV;
      break;

    case 'prod':
      process.env.DATABASE_URL = process.env.DATABASE_URL_PROD;
      break;

    case 'test':
      process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
      break;

    default:
      break;
  }

  return await execa('npx', ['prisma', 'migrate', 'up', '--experimental'], {
    cwd: getPaths().api.base,
    stdio: 'inherit',
    env: {
      DATABASE_URL: process.env.DATABASE_URL,
    },
  });
};
