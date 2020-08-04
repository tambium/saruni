import type { APIGatewayEvent } from "aws-lambda";
import { sign } from "jsonwebtoken";

const createCookie = (
  name: string,
  value: string,
  age = 60 ** 2 * 24 * 14,
  expires?: string
) => {
  return `${name}=${value}; HttpOnly;${
    process.env.DOMAIN
      ? `Domain=${process.env.DOMAIN}; Secure; SameSite=None;`
      : ""
  } Max-Age=${age}; ${expires ? `Expires: ${expires};` : ""} path=/;`;
};

export const cookieManager = () => {
  if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw new Error(
      "Please provide `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` in `.env`"
    );
  }

  return async (event: APIGatewayEvent, context) => {
    let payload = context.payload;

    if (event.httpMethod === "PUT") {
      const { exp, iat, ...rest } = payload;

      return {
        statusCode: 204,
        body: null,
        headers: {
          "Set-Cookie": createCookie(
            "jid",
            sign(
              {
                ...rest,
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
              },
              process.env.REFRESH_TOKEN_SECRET
            )
          ),
        },
      };
    }

    if (event.httpMethod === "DELETE") {
      return {
        statusCode: 204,
        body: null,
        headers: {
          "Set-Cookie": createCookie("jid", "", 0, new Date(0).toUTCString()),
        },
      };
    }
  };
  return;
};
// .use(jwtMiddleware())
// .use(httpErrorHandler())
// .use(
//   cors({
//     credentials: true,
//     // headers:
//     // "Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token, X-Amz-User-Agent",
//     origin: "http://localhost:3000",
//   })
// );
