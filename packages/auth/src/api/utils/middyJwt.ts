import createError from "http-errors";
import { verify } from "jsonwebtoken";

import type { Context } from "aws-lambda";

type JwtContext = Context & { payload: { userId: number } };

export const jwtMiddleware = () => {
  const middlewareObject = {
    before: (handler, next) => {
      try {
        const jwtToken = (handler.event.headers[
          "authentication"
        ] as string).split(" ")[1];

        const payload = verify(jwtToken, process.env.ACCESS_TOKEN_SECRET) as {
          userId: number;
        };

        (handler.context as JwtContext).payload = payload;
        return next();
      } catch {
        next(createError(401));
      }
    },
  };

  return middlewareObject;
};
