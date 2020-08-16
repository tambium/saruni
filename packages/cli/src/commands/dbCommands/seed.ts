import babelRequireHook from '@babel/register';
import { getPaths } from '@saruni/internal';
import { magenta } from 'chalk';
import path from 'path';

export const command = 'seed';

export const desc = 'Creates entities within the database.';

// export const builder: CommandBuilder = (yargs) => {
//   return yargs.option("stage", {
//     default: "local",
//     type: "string",
//     choices: ["test", "prod", "dev", "local"],
//   });
// };

babelRequireHook({
  extends: path.join(getPaths().api.base, '.babelrc.js'),
  extensions: ['.js', '.ts'],
  only: [path.resolve(getPaths().api.db)],
  ignore: ['node_modules'],
  cache: false,
});

export const handler = async (args: {
  stage: 'dev' | 'test' | 'prod' | 'local';
}) => {
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

  const { seed } = require(getPaths().api.seedFile);

  try {
    console.log(magenta('Start seeding the data into the database...\n'));

    await seed();

    console.log(magenta('Seeding done.\n'));
  } catch {
    console.log('Something went wrong while seeding.\n');
  }
};
