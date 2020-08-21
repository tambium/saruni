import type { APIGatewayEvent } from 'aws-lambda';
import { sign } from 'jsonwebtoken';
import createError from 'http-errors';

const createCookie = (
  name: string,
  value: string,
  age = 60 ** 2 * 24 * 14,
  expires?: string,
) => {
  const domain = process.env.DOMAIN;
  const stage = process.env.STAGE;

  if (stage === 'prod')
    return `${name}=${value}; HttpOnly; Domain=${domain}; Secure; SameSite=Lax; Max-Age=${age}; ${
      expires ? `Expires: ${expires};` : ''
    } path=/;`;

  return `${name}=${value}; HttpOnly; Max-Age=${age}; ${
    expires ? `Expires: ${expires};` : ''
  } path=/;`;
};

export const cookieManager = () => {
  if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw new Error(
      'Please provide `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` in `.env`',
    );
  }

  return async (event: APIGatewayEvent, context) => {
    const payload = context.payload;

    if (event.httpMethod === 'PUT') {
      const { exp, iat, ...rest } = payload;

      return {
        statusCode: 204,
        body: null,
        headers: {
          'Set-Cookie': createCookie(
            'jid',
            sign(
              {
                ...rest,
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
              },
              process.env.REFRESH_TOKEN_SECRET,
            ),
          ),
        },
      };
    }

    if (event.httpMethod === 'DELETE') {
      return {
        statusCode: 204,
        body: null,
        headers: {
          'Set-Cookie': createCookie('jid', '', 0, new Date(0).toUTCString()),
        },
      };
    }

    throw createError(405, `Request method not supported.`);
  };
};
