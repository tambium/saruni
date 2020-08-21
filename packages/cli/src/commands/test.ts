import path from 'path';
import babelRequireHook from '@babel/register';
import { getPaths } from '@saruni/internal';
import execa from 'execa';
import { run } from 'jest';

babelRequireHook({
  extends: path.join(getPaths().api.base, '.babelrc.js'),
  extensions: ['.js', '.ts'],
  only: [path.resolve(getPaths().api.db)],
  ignore: ['node_modules'],
  cache: false,
});

export const command = 'test';

export const desc = 'Runs jest with the project based setup.';

export const handler = async () => {
  try {
    process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;

    const { db } = require(getPaths().api.db);

    await db.$queryRaw(`DROP SCHEMA IF EXISTS "public" CASCADE`);

    await db.$disconnect();

    await execa('npx', ['prisma', 'migrate', 'up', '--experimental'], {
      cwd: getPaths().api.base,
      env: { DATABASE_URL: process.env.DATABASE_URL_TEST },
    });

    await execa('yarn', ['sr', 'db', 'seed'], {
      cwd: getPaths().api.base,
      env: { DATABASE_URL: process.env.DATABASE_URL_TEST },
    });

    await run([`--config=${require.resolve('@saruni/config/dist/index.js')}`]);
  } catch (error) {
    console.log(error);
  }
};
