import middy from '@middy/core';
import { add } from 'date-fns';
import createError from 'http-errors';
import { v4 as uuidV4 } from 'uuid';

import { sendMail } from './sendMail';

const between = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min) + min);
};

export const sendEmailVerification = ({ db }) => {
  // Check for the existence of required DB tables.
  if (!db.emailVerification) {
    throw new Error(
      'Your database does not have an `EmailVerification` Model. Please create one.',
    );
  }

  const handler = async (_event, context) => {
    const token = uuidV4();

    const code = between(0, 9999);

    let result;

    try {
      result = await db.emailVerification.create({
        data: {
          expiresAt: add(new Date(), { weeks: 1 }),
          token,
          code,
          user: {
            connect: {
              id: context.payload.userId,
            },
          },
        },
      });
    } catch {
      throw createError(500, 'Something went wrong.');
    }

    try {
      sendMail(`http://localhost:3000/verify-email?token=${token}`, code);
    } catch {
      throw createError(500, 'Could not send email.');
    }

    return {
      statusCode: 201,
      body: JSON.stringify({ emailVerification: result }),
    };
  };

  return middy(handler);
};
