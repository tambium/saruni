import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { CommandBuilder } from 'yargs';

import { getPaths } from '@saruni/internal';
import execa from 'execa';

interface CreateKeyParams {
  name: string;
  stage: string;
}

export const command = 'create-key';

export const builder: CommandBuilder = (yargs) => {
  return yargs
    .option('stage', {
      default: 'dev',
      type: 'string',
      choices: ['prod', 'dev'],
    })
    .option('name', { default: 'bastion-key', type: 'string' });
};

export const desc = 'creates a key with aws that can be used in ssh sessions';

export const handler = async (args: CreateKeyParams) => {
  const saruniJson = require(getPaths().saruni);

  const name = `${args.stage}-${args.name}`;
  const fileName = `${name}.pem`;

  const region = saruniJson.serverless[args.stage].region;
  const profile = saruniJson.serverless[args.stage].awsProfile;

  try {
    // @ts-ignore
    const hasKey = (await fs.exists(fileName)) as boolean;

    if (hasKey) {
      console.log(chalk.red(`The file ${fileName}.pem already exists.`));
      console.log(
        chalk.yellow('It is advised to backup this file then delete it.'),
      );

      process.exit(1);
    }

    const { stdout } = await execa(`aws`, [
      'ec2',
      'create-key-pair',
      '--profile',
      profile,
      '--region',
      region,
      '--key-name',
      name,
    ]);

    const { KeyMaterial } = JSON.parse(stdout);

    await fs.writeFile(path.join(getPaths().base, fileName), KeyMaterial);

    await fs.chmod(path.join(getPaths().base, fileName), '700');

    console.log(chalk.green(`Your key was created and saved as ${fileName}`));
  } catch (e) {
    console.log(e);
  }
};
