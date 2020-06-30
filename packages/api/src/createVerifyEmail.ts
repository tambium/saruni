import { isBefore } from "date-fns";
import createError from "http-errors";
import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import validator from "@middy/validator";
import jsonBodyParser from "@middy/http-json-body-parser";

import { baseOptions } from "./corsOptions";

export const createVerifyEmail = ({ db }) => {
  return middy(async (event) => {
    const token = event.body.token;

    const result = await db.emailVerification.findMany({
      //@ts-ignore
      where: { token },
      orderBy: { expiresAt: "desc" },
      take: 1,
    });

    if (result.length === 0) {
      /*
       * Failure to find a result could mean one of two things (or more?):
       * 1. no tokens exist for this user in the EmailVerification table
       * 2. user has already verified their email and the token has been
       * removed from EmailVerification
       */
      throw createError(
        400,
        `Email could not be verified. Please request a new email.`
      );
    }

    const latest = result[0];

    if (isBefore(new Date(), latest.expiresAt)) {
      await db.user.update({
        // @ts-ignore
        where: { id: latest.userId },
        data: { emailVerified: true },
      });

      await db.emailVerification.delete({ where: { id: latest.userId } });
    }

    return {
      statusCode: 204,
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
      })
    )
    .use(httpErrorHandler())
    .use(cors(baseOptions));
};
