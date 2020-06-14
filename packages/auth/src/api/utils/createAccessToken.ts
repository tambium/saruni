import { sign, SignOptions } from "jsonwebtoken";

export const createAccessToken = (
  payload: String | Buffer | Object,
  options?: SignOptions
): string => {
  return sign(payload, process.env.ACCESS_TOKEN_SECRET, options);
};
