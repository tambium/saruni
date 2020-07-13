import {
  APIGatewayEvent,
  APIGatewayProxyResultV2,
  Context,
  Callback,
} from "aws-lambda";
import { isBefore } from "date-fns";
import createError from "http-errors";
import middy from "@middy/core";

interface VerifyEmailBody {
  body: {
    code?: number;
    token?: string;
  };
}

interface JwtLambdaEvent {
  payload: {
    userId: number;
  };
}
export type Handler<TEvent = any, TResult = any, TContext = {}> = (
  event: TEvent,
  context: Context & TContext,
  callback: Callback<TResult>
) => void | Promise<TResult>;

type VerifyEmailEvent = Omit<APIGatewayEvent, "body"> &
  VerifyEmailBody &
  JwtLambdaEvent;

interface JwtContext {
  payload: { userId: number };
}

type VerifyEmailLambda = Handler<
  VerifyEmailEvent,
  APIGatewayProxyResultV2,
  JwtContext
>;

export const createVerifyEmailLambda = ({ db }) => {
  const handler: VerifyEmailLambda = async (event, context) => {
    const token = event.body.token;
    const code = event.body.code;

    const userId = context.payload.userId;

    if (!token && !code) {
      throw new createError.BadRequest(
        "Either token or code must be sent with the request."
      );
    }

    const user = await db.user.findOne({
      where: { id: userId },
    });

    if (!user.emailVerified) {
      let result;

      if (token) {
        result = await db.emailVerification.findMany({
          where: { token, userId },
          orderBy: { expiresAt: "desc" },
          take: 1,
        });

        if (result.length === 0) {
          throw createError(
            400,
            `Email could not be verified. Please request a new email.`
          );
        }
      } else if (code) {
        result = await db.emailVerification.findMany({
          where: { code, userId },
          orderBy: { expiresAt: "desc" },
          take: 1,
        });

        if (result.length === 0) {
          throw createError(400, `Incorrect code provided.`);
        }
      }

      const latest = result[0];

      if (isBefore(new Date(), latest.expiresAt)) {
        await db.user.update({
          where: { id: latest.userId },
          data: { emailVerified: true },
        });

        await db.emailVerification.deleteMany({
          where: { userId: latest.userId },
        });
      }
    }

    return {
      statusCode: 204,
    };
  };

  return middy(handler);
};
