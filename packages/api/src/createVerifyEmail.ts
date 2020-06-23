import { isBefore } from "date-fns";
import { verify } from "jsonwebtoken";

export const createVerifyEmail = ({ db }) => {
  return async (event) => {
    try {
      const { headers, body } = event;

      const { token } = JSON.parse(body);

      const authHeader = (headers["authentication"] as string).split(" ")[1];

      const payload = verify(authHeader, process.env.ACCESS_TOKEN_SECRET);

      const user = await db.user.findOne({
        //@ts-ignore
        where: { id: payload.id },
      });

      if (user.emailVerified) {
        throw new Error("Already verified.");
      }

      const result = await db.emailVerification.findMany({
        //@ts-ignore
        where: { token, userId: payload.userId },
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
        throw new Error(
          `Email could not be verified. Please request a new email.`
        );
      }

      const latest = result[0];

      if (isBefore(new Date(), latest.expiresAt)) {
        await db.user.update({
          // @ts-ignore
          where: { id: payload.userId },
          data: { emailVerified: true },
        });

        await db.emailVerification.delete({ where: { id: latest.id } });
      }

      return {
        statusCode: 204,
        body: true,
      };
    } catch (e) {
      return {
        statusCode: 500,
        body: e.message,
      };
    }
  };
};
