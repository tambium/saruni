import type { APIGatewayEvent } from "aws-lambda";
import { sign, verify } from "jsonwebtoken";

const domain =
  process.env.NODE_ENV === "production"
    ? process.env.API_URL
    : "http://localhost:4000";

const createCookie = (
  name: string,
  value: string,
  age = 60 ** 2 * 24 * 14,
  expires?: string
) =>
  `${name}=${value}; HttpOnly;${
    true ? `Domain=${domain}; Secure;` : ""
  } SameSite=Lax; Max-Age=${age}; ${expires ? `Expires: ${expires};` : ""}`;

const handler = async (event: APIGatewayEvent) => {
  try {
    const header = event.headers["authentication"];

    const bearer = header?.split(" ")[1] || "";

    const payload = verify(bearer, process.env.ACCESS_TOKEN_SECRET);

    const body: { method: "set" | "remove" } = JSON.parse(event.body);

    const { method } = body;

    const cookie =
      method === "set"
        ? createCookie("jid", sign(payload, process.env.REFRESH_TOKEN_SECRET))
        : createCookie("jid", "", 0, new Date(0).toUTCString());

    return {
      statusCode: 200,
      body: method === "set" ? "Refresh token set" : "Refresh token removed",
      headers: {
        "Set-Cookie": cookie,
      },
    };
  } catch (e) {
    return {
      statusCode: 401,
      body: "Not authenticated",
    };
  }
};

export const createCookieHandler = () => {
  return handler;
};
