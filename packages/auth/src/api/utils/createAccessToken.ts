import { sign, SignOptions } from 'jsonwebtoken';

export const createAccessToken = (
  payload: string | Buffer | object,
  options?: SignOptions,
): string => {
  return sign(payload, process.env.ACCESS_TOKEN_SECRET, options);
};
