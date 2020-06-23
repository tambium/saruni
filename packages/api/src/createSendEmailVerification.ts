import type { Handler } from "aws-lambda";
import { add } from "date-fns";
import { verify } from "jsonwebtoken";
import { v4 as uuidV4 } from "uuid";

import { sendMail } from "./sendMail";

type CreateSendEmailVerification = ({ db: any }) => Handler;

export const createSendEmailVerification: CreateSendEmailVerification = ({
  db,
}) => {
  return async (event) => {
    let result;

    try {
      const { headers } = event;

      const authHeader = (headers["authentication"] as string).split(" ")[1];

      const payload = verify(authHeader, process.env.ACCESS_TOKEN_SECRET);

      const token = uuidV4();

      result = await db.emailVerification.create({
        data: {
          expiresAt: add(new Date(), { weeks: 1 }),
          token,
          user: {
            connect: {
              // @ts-ignore
              id: payload.userId,
            },
          },
        },
      });

      sendMail(`http://localhost:3000/verify-email?token=${token}`);
    } catch (e) {}

    return {
      statusCode: result ? 201 : 500,
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "http://localhost:3000",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(result),
    };
  };
};
