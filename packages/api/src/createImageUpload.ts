import AWS from "aws-sdk";
import createError from "http-errors";
import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import validator from "@middy/validator";
import jsonBodyParser from "@middy/http-json-body-parser";
import { v4 as uuidV4 } from "uuid";

import type { APIGatewayEvent } from "aws-lambda";

interface ImageUploadBody {
  body: { image: string; pathPrefix?: string };
}

type ImageUploadEvent = Omit<APIGatewayEvent, "body"> & ImageUploadBody;

export const createImageUpload = ({
  auth = {
    before: (_, next) => {
      next();
    },
  },
}) => {
  return middy(async (event: ImageUploadEvent) => {
    let path, contentType, body, extension, location;

    try {
      const { image, pathPrefix } = event.body;

      body = Buffer.from(
        image.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );

      contentType = image.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];

      extension = contentType.split("/")[1];

      if (pathPrefix) {
        path = `${pathPrefix}/${uuidV4()}.${extension}`;
      } else {
        path = `${uuidV4()}.${extension}`;
      }
    } catch {
      throw createError(422, "Could not process image.");
    }

    try {
      const uploadResult = await new AWS.S3.ManagedUpload({
        params: {
          Body: body,
          Bucket: "imageuploaddevlam",
          Key: path,
          ContentType: contentType,
          ContentEncoding: "base64",
        },
      }).promise();

      location = uploadResult.Location;
    } catch {
      createError(500, "Could not upload image.");
    }
    return {
      statusCode: 201,
      body: JSON.stringify({ location }),
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
              required: ["image"],
              properties: {
                image: {
                  type: "string",
                },
                pathPrefix: {
                  type: "string",
                },
              },
            },
          },
        },
      })
    )
    .use(auth)
    .use(httpErrorHandler())
    .use(
      cors({
        credentials: false,
        headers: "Content-Type, Authentication",
        origin: "*",
      })
    );
};
