import path from 'path';

import { getPaths } from '@saruni/internal';
import execa from 'execa';
import { run } from 'jest';
import { CommandBuilder } from 'yargs';
import babelRequireHook from '@babel/register';

babelRequireHook({
  extends: path.join(getPaths().api.base, '.babelrc.js'),
  extensions: ['.js', '.ts'],
  only: [path.resolve(getPaths().api.db)],
  ignore: ['node_modules'],
  cache: false,
});

export const command = 'test';

export const desc = 'Runs Jest with the project based setup.';

export const builder: CommandBuilder = (yargs) => {
  return yargs
    .option('watchAll', {
      default: false,
      type: 'boolean',
    })
    .option('side', {
      default: ['api', 'web'],
      type: 'array',
      choices: ['api', 'web'],
    });
};

export const handler = async (args) => {
  try {
    process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;

    const { db } = require(getPaths().api.db);

    if (args.side.find('api')) {
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
    }

    const testCommand = [
      `--config=${require.resolve('@saruni/config/dist/index.js')}`,
    ];

    if (args.watchAll) {
      testCommand.push('--watchAll');
    }

    if (args.side.length === 1) {
      testCommand.push(`--projects="<rootDir>/packages/${args.side[0]}"`);
    }

    await run(testCommand);
  } catch (error) {
    console.log(error);
  }
};
