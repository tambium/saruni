import url from "url-join";

const LOCAL_URL = process.env.NEXT_PUBLIC_LOCAL_URL || "http://localhost:4000";

const IMAGE_UPLOAD = "imageUpload";
const GRAPHQL = "graphql";
const REFRESH_TOKEN = "refreshToken";
const COOKIE_MANAGER = "cookieManager";
const VERIFY_EMAIL = "verifyEmail";
const SEND_EMAIL_VERIFICATION = "sendEmailVerification";

const getBaseUrl = () => {
  let baseUrl = LOCAL_URL;

  if (
    (process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_USE_CLOUD === "true" &&
      process.env.NEXT_PUBLIC_API_URL) ||
    process.env.NODE_ENV === "production"
  ) {
    baseUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      "http://" + process.env.DOMAIN + "/" + process.env.STAGE;
  }

  return baseUrl;
};

export const getApiEndpoint = () => {
  const baseUrl = getBaseUrl();

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
  const baseUrl = getBaseUrl();

  return url(baseUrl, resource);
};
