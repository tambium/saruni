import type { APIGatewayEvent } from 'aws-lambda';
import cookie from 'cookie';
import createError from 'http-errors';
import { sign, verify } from 'jsonwebtoken';

export const refreshToken = () => {
  if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw new Error(
      'Please provide `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` in `.env`',
    );
  }

  return async (event: APIGatewayEvent) => {
    let payload: any;

    try {
      const { headers } = event;

      const header = headers['Cookie'] || headers['cookie'];

      const { jid } = cookie.parse(header);

      payload = verify(jid, process.env.REFRESH_TOKEN_SECRET);
    } catch (e) {
      throw createError(401);
    }

    const { exp, iat, ...rest } = payload;

    return {
      statusCode: 200,
      body: JSON.stringify({
        jwt: sign(
          { ...rest, exp: Math.floor(Date.now() / 1000) + 60 * 10 },
          process.env.ACCESS_TOKEN_SECRET,
        ),
      }),
    };
  };
};
// .use(httpErrorHandler())
// .use(
//   cors({
//     credentials: true,
//     headers:
//       "Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token, X-Amz-User-Agent",
//     origin: "http://localhost:3000",
//   })
// );

//   return handler;
// };
