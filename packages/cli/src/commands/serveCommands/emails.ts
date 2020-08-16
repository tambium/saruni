import execa from 'execa';
import { getPaths } from '@saruni/internal';

export const command = 'emails';
export const aliases = ['email'];

export const desc = 'Serve generated HTML emails.';

export const handler = async () => {
  /** Serve contents of `generated/emails` directory. */
  await execa('yarn', ['saruni-serve-emails'], {
    cwd: getPaths().static.base,
    stdio: 'inherit',
  });
};
