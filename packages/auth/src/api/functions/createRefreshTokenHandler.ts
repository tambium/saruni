import type { APIGatewayEvent } from "aws-lambda";
import cookie from "cookie";
import { sign, verify } from "jsonwebtoken";
import { AuthenticationError } from "@saruni/internal";

const handler = async (event: APIGatewayEvent) => {
  try {
    let payload: any;

    try {
      const { headers } = event;

      const header = headers["cookie"];

      const { jid } = cookie.parse(header);

      payload = verify(jid, process.env.REFRESH_TOKEN_SECRET);
    } catch (e) {
      throw new AuthenticationError();
    }

    return {
      statusCode: 200,
      body: sign(payload, process.env.ACCESS_TOKEN_SECRET),
    };
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

export const createRefreshTokenHandler = () => {
  if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw new Error(
      "Please provide `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` in `.env`"
    );
  }

  return handler;
};
