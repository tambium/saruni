import execa from 'execa';
import Listr from 'listr';

import { getPaths } from '@saruni/internal';

export const command = 'graphql';

export const aliases = ['gql'];

export const desc = 'Generate code from your GraphQL schema and operations.';

export const handler = async () => {
  try {
    await new Listr([
      {
        title: `Generating GraphQL code.`,
        task: async () => {
          await execa('yarn', ['gen'], { cwd: getPaths().web.base });
        },
      },
    ]).run();
  } catch (e) {
    console.log(e);
  }
};
