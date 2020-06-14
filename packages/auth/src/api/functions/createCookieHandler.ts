import type { APIGatewayEvent } from "aws-lambda";
import { sign, verify } from "jsonwebtoken";
import { AuthenticationError } from "@saruni/internal";

const createCookie = (
  name: string,
  value: string,
  age = 60 ** 2 * 24 * 14,
  expires?: string
) =>
  `${name}=${value}; HttpOnly;${
    process.env.NODE_ENV === "production"
      ? `Domain=${process.env.API_URL}; Secure;`
      : ""
  } SameSite=Lax; Max-Age=${age}; ${expires ? `Expires: ${expires};` : ""}`;

const handler = async (event: APIGatewayEvent) => {
  try {
    const { headers, httpMethod } = event;

    const header = headers["authentication"];

    const bearer = header?.split(" ")[1] || "";

    let payload: any;

    try {
      payload = verify(bearer, process.env.ACCESS_TOKEN_SECRET);
    } catch (e) {
      throw new AuthenticationError();
    }

    if (httpMethod === "POST" || httpMethod === "PUT") {
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

    if (httpMethod === "DELETE") {
      return {
        statusCode: 204,
        body: null,
        headers: {
          "Set-Cookie": createCookie("jid", "", 0, new Date(0).toUTCString()),
        },
      };
    }
  } catch (e) {
    if (e.message.includes("Not authenticated")) {
      return {
        statusCode: 401,
        body: e.message,
      };
    }

    return {
      statusCode: 500,
      body: "Something went wrong",
    };
  }
};

export const createCookieHandler = () => {
  if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw new Error(
      "Please provide `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` in `.env`"
    );
  }

  return handler;
};
