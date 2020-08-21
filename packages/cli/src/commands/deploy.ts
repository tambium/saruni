import { getPaths } from '@saruni/internal';
import execa from 'execa';
import Listr from 'listr';
import path from 'path';
import rimraf from 'rimraf';
import { CommandBuilder } from 'yargs';

export const command = 'deploy';

export const builder: CommandBuilder = (yargs) => {
  return yargs
    .option('stage', {
      default: 'dev',
      type: 'string',
      choices: ['dev', 'prod'],
    })
    .option('service', {
      default: 'graphql',
      choices: ['resources', 'graphql', 'auth', 'web', 'domain'],
    });
};

export const desc = 'deploys the services found in the services folder';

const saruniJson = require(getPaths().saruni);

export const handler = async (args) => {
  const region = saruniJson.serverless[args.stage].region;
  const profile = saruniJson.serverless[args.stage].awsProfile;

  if (args.service === 'resources') {
    await execa(
      'sls',
      ['--aws-profile', profile, 'deploy', `--stage=${args.stage}`],
      {
        cwd: path.join(getPaths().base, 'packages/api/src/resources'),
        stdio: 'inherit',
      },
    );
  }

  if (args.service === 'domain') {
    await execa(
      'sls',
      [
        '--aws-profile',
        saruniJson.serverless.prod.awsProfile,
        'create_domain',
        `--stage=prod`,
      ],
      {
        cwd: path.join(getPaths().base, 'packages/api/src/services/graphql'),
        stdio: 'inherit',
      },
    );
  }

  if (args.service === 'graphql') {
    await execa(
      'sls',
      ['--aws-profile', profile, 'deploy', `--stage=${args.stage}`],
      {
        cwd: path.join(getPaths().base, 'packages/api/src/services/graphql'),
        stdio: 'inherit',
      },
    );
  }

  if (args.service === 'auth') {
    await execa(
      'sls',
      ['--aws-profile', profile, 'deploy', `--stage=${args.stage}`],
      {
        cwd: path.join(getPaths().base, 'packages/api/src/services/auth'),
        stdio: 'inherit',
      },
    );
  }

  if (args.service === 'web') {
    try {
      await new Listr([
        {
          title: `Preparing frontend`,
          task: async () =>
            new Listr([
              {
                title: 'Clearing build directories',
                task: () => {
                  rimraf.sync(path.join(getPaths().web.base, 'out'));
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
                    'aws',
                    [
                      's3',
                      '--profile',
                      saruniJson.serverless[args.stage].awsProfile,
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
                    'aws',
                    [
                      'cloudfront',
                      '--profile',
                      saruniJson.serverless[args.stage].awsProfile,
                      'create-invalidation',
                      '--distribution-id',
                      saruniJson.serverless[args.state].distId,
                      '--paths',
                      '*',
                    ],
                    { cwd: getPaths().web.base },
                  );
                },
              },
              {
                title: 'Invalidating cloudfront cache',
                task: async () => {
                  await execa(
                    `AWS_PROFILE=${
                      saruniJson.serverless[args.stage].awsProfile
                    }`,
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
  }
};
