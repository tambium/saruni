import url from 'url-join';

const IMAGE_UPLOAD = 'imageUpload';
const GRAPHQL = 'graphql';
const REFRESH_TOKEN = 'refreshToken';
const COOKIE_MANAGER = 'cookieManager';
const VERIFY_EMAIL = 'verifyEmail';
const SEND_EMAIL_VERIFICATION = 'sendEmailVerification';

export const getApiEndpoint = () => {
  const baseUrl = process.env.API_ENDPOINT || 'http://localhost:4000';

  return {
    imageUpload: url(baseUrl, IMAGE_UPLOAD),
    graphql: url(baseUrl, GRAPHQL),
    refreshToken: url(baseUrl, REFRESH_TOKEN),
    cookieManager: url(baseUrl, COOKIE_MANAGER),
    verifyEmail: url(baseUrl, VERIFY_EMAIL),
    sendEmailVerification: url(baseUrl, SEND_EMAIL_VERIFICATION),
  };
};

export const getCustomApiEndpoint = (resource: string): string => {
  const baseUrl = process.env.API_ENDPOINT || 'http://localhost:4000';

  return url(baseUrl, resource);
};
