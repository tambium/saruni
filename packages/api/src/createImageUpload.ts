import AWS from 'aws-sdk';
import createError from 'http-errors';
import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import validator from '@middy/validator';
import jsonBodyParser from '@middy/http-json-body-parser';
import { v4 as uuidV4 } from 'uuid';

import type {
  APIGatewayEvent,
  Handler,
  APIGatewayProxyResultV2,
} from 'aws-lambda';

import { credentialsOptions } from './corsOptions';

interface ImageUploadProperties {
  auth?: any;
  bucketName: string;
}

interface ImageUploadBody {
  body: { image: string; pathPrefix?: string };
}

type ImageUploadEvent = Omit<APIGatewayEvent, 'body'> & ImageUploadBody;

type ImageUploadLambda = Handler<ImageUploadEvent, APIGatewayProxyResultV2>;

export const createImageUpload = ({
  auth = {},
  bucketName,
}: ImageUploadProperties) => {
  return middy(async (event) => {
    let path: string;
    let contentType: string;
    let body: Buffer;
    let extension: string;
    let location: string;

    try {
      const { image, pathPrefix } = event.body;

      body = Buffer.from(
        image.replace(/^data:image\/\w+;base64,/, ''),
        'base64',
      );

      contentType = image.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];

      extension = contentType.split('/')[1];

      if (pathPrefix) {
        path = `${pathPrefix}/${uuidV4()}.${extension}`;
      } else {
        path = `${uuidV4()}.${extension}`;
      }
    } catch {
      throw createError(422, 'Could not process image.');
    }

    if (!contentType.includes('image')) {
      throw createError(422, 'File provided is not an image.');
    }

    try {
      await new AWS.S3()
        .putObject({
          Body: body,
          Bucket: bucketName,
          Key: path,
          ContentType: contentType,
          ContentEncoding: 'base64',
        })
        .promise();

      const {
        LocationConstraint,
      } = await new AWS.S3().getBucketLocation().promise();

      const region =
        process.env.AWS_REGION || LocationConstraint || 'eu-west-1';

      location = `https://${bucketName}.s3-${region}.amazonaws.com/${path}`;
    } catch {
      createError(500, 'Could not upload image.');
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
          required: ['body'],
          type: 'object',
          properties: {
            body: {
              type: 'object',
              required: ['image'],
              properties: {
                image: {
                  type: 'string',
                },
                pathPrefix: {
                  type: 'string',
                },
              },
            },
          },
        },
      }),
    )
    .use(auth)
    .use(httpErrorHandler())
    .use(cors(credentialsOptions));
};
