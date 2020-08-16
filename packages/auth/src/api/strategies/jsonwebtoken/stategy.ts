import { verify } from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

export const strategy = (context) => {
  if (!ACCESS_TOKEN_SECRET) {
    throw new Error(
      `Access token has not been provided in \`.env\`, which is required by the authentication strategy chosen in \`saruni.json\`.`,
    );
  }

  const header =
    context.headers['authorization'] || context.headers['Authorization'];
  const bearer = header?.split(' ')[1] || '';

  const payload = verify(bearer, ACCESS_TOKEN_SECRET);
  return { ...context, payload };
};
