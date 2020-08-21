import { getPaths } from '@saruni/internal';
import execa from 'execa';
import { CommandBuilder } from 'yargs';

export const command = 'tunnel';

export const builder: CommandBuilder = (yargs) => {
  return yargs.option('stage', {
    default: 'dev',
    type: 'string',
    choices: ['dev', 'prod'],
  });
};

export const desc =
  'Creates an SSH tunnel using your bastion-key to the AWS RDS instance.';

const saruniJson = require(getPaths().saruni);

export const handler = async (args) => {
  // const region = saruniJson.serverless[args.stage].region;
  // const profile = saruniJson.serverless[args.stage].awsProfile;
  const rdsPort =
    args.stage === 'dev' ? process.env.RDS_PORT_DEV : process.env.RDS_PORT_PROD;
  const ec2Domain =
    args.stage === 'dev'
      ? process.env.EC2_DOMAIN_DEV
      : process.env.EC2_DOMAIN_PROD;
  const keyName = saruniJson.serverless[args.stage].bastionKeyName;

  await execa(
    'ssh',
    [
      '-L',
      `2222:${rdsPort}:5432`,
      '-i',
      `${args.stage}-${keyName}.pem`,
      `ec2-user@${ec2Domain}`,
    ],
    {
      cwd: getPaths().base,
      stdio: 'inherit',
    },
  );
};
