import aws from 'aws-sdk';
import chalk from 'chalk';
import fs from 'fs-extra';
import { CommandBuilder } from 'yargs';

interface CreateKeyParams {
  name: string;
}

const ec2 = new aws.EC2({
  apiVersion: '2016-11-15',
  region: process.env.AWS_REGION,
});

const createKey = async (
  params: aws.EC2.CreateKeyPairRequest,
): Promise<aws.EC2.KeyPair> => {
  return new Promise((resolve, reject) => {
    ec2.createKeyPair(params, (err, data) => {
      if (err) {
        return reject(err);
      }

      return resolve(data);
    });
  });
};

export const command = 'create-key';

export const builder: CommandBuilder = (yargs) => {
  return yargs.option('name', { default: 'bastion-key', type: 'string' });
};

export const desc = 'creates a key with aws that can be used in ssh sessions';

export const handler = async (args: CreateKeyParams) => {
  try {
    // @ts-ignore
    const hasKey = (await fs.exists(`${args.name}.pem`)) as boolean;

    if (hasKey) {
      console.log(chalk.red(`The file ${args.name}.pem already exists.`));
      console.log(
        chalk.yellow(
          'It is advised to backup this file then either delete or remove it.',
        ),
      );

      process.exit(1);
    }

    const result = await createKey({ KeyName: args.name });

    await fs.writeFile(`${args.name}.pem`, result.KeyMaterial);

    console.log(
      chalk.green(`Your key was created and saved as ${args.name}.pem`),
    );
  } catch (e) {
    console.log(e);
  }
};
