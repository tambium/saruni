import { add } from "date-fns";
import createError from "http-errors";
import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import validator from "@middy/validator";
import jsonBodyParser from "@middy/http-json-body-parser";
import { v4 as uuidV4 } from "uuid";

import type { Handler } from "aws-lambda";

import { baseOptions } from "./corsOptions";
import { sendMail } from "./sendMail";

//@ts-ignore
type CreateSendEmailVerification = ({ db: any, auth: any }) => Handler;

export const createSendEmailVerification: CreateSendEmailVerification = ({
  db,
  auth = {},
}) => {
  // we need to assume the user has the proper db structure for this lambda to work.
  if (!db["emailVerification"]) {
    throw new Error(
      // TODO: Provide links to Prisma or / and Saruni docs how.
      "Your database does not have an `EmailVerification` Model. Please create one."
    );
  }

  return middy(async (_event, context) => {
    const token = uuidV4();

    let result;

    try {
      result = await db.emailVerification.create({
        data: {
          expiresAt: add(new Date(), { weeks: 1 }),
          token,
          user: {
            connect: {
              // @ts-ignore
              id: context.payload.userId,
            },
          },
        },
      });
    } catch {
      throw createError(500, "Something went wrong.");
    }

    try {
      // TODO: extract this to a separete lambda?
      sendMail(`http://localhost:3000/verify-email?token=${token}`);
    } catch {
      throw createError(500, "Could not send email.");
    }

    return {
      statusCode: 201,
      body: JSON.stringify({ emailVerification: result }),
    };
  })
    .use(jsonBodyParser())
    .use(
      validator({
        inputSchema: {
          required: ["body"],
          type: "object",
          properties: {
            body: {
              type: "object",
              required: ["token"],
              properties: {
                token: {
                  type: "string",
                },
              },
            },
          },
        },
        outputSchema: {
          required: ["emailVerification"],
          type: "object",
          properties: { token: { type: "string" } },
        },
      })
    )
    .use(auth)
    .use(httpErrorHandler())
    .use(cors(baseOptions));
};
