import { getPaths } from '@saruni/internal';
import execa from 'execa';
import Listr from 'listr';
import { CommandBuilder } from 'yargs';

export const command = 'deploy';

export const builder: CommandBuilder = (yargs) => {
  return yargs.option('stage', {
    default: 'dev',
    type: 'string',
    choices: ['dev', 'prod'],
  });
};

export const desc = 'deploys the services found in the services folder';

const saruniJson = require(getPaths().saruni);

export const handler = async (args) => {
  try {
    await new Listr([
      {
        title: `Preparing frontend`,
        task: async () =>
          new Listr([
            {
              title: 'Clearing build directories',
              task: async () => {
                await execa('yarn', ['clean'], { cwd: getPaths().web.base });
              },
            },
            {
              title: 'Building Next.js production build',
              task: async () => {
                await execa('yarn', ['build'], {
                  cwd: getPaths().web.base,
                  env: { STAGE: args.stage },
                });
              },
            },
            {
              title: 'Creating a static build',
              task: async () => {
                await execa('yarn', ['export'], {
                  cwd: getPaths().web.base,
                  env: {
                    STAGE: args.stage,
                  },
                });
              },
            },
            {
              title: 'Uploading to S3',
              task: async () => {
                await execa(
                  `AWS_PROFILE=${saruniJson.serverless[args.stage].awsProfile}`,
                  [
                    'aws',
                    's3',
                    'sync',
                    'out',
                    `s3://${
                      saruniJson.serverless[args.stage].frontendS3Bucket
                    }`,
                    '--delete',
                  ],
                  { cwd: getPaths().web.base },
                );
              },
            },
            {
              title: 'Invalidating cloudfront cache',
              task: async () => {
                await execa(
                  `AWS_PROFILE=${saruniJson.serverless[args.stage].awsProfile}`,
                  [
                    'aws',
                    'cloudfront',
                    'create-invalidation',
                    '--distribution-id',
                    'E1W56ST7R2SIRK',
                    '--paths',
                    '*',
                  ],
                  { cwd: getPaths().web.base },
                );
              },
            },
          ]),
      },
    ]).run();
  } catch (error) {
    console.log(error);
  }
};
