import url from "url-join";

const LOCAL_URL = process.env.NEXT_PUBLIC_LOCAL_URL || "http://localhost:4000";

const IMAGE_UPLOAD = "image_upload";
const GRAPHQL = "graphql";
const REFRESH_TOKEN = "refresh_token";
const COOKIE_MANAGER = "cookie_manager";
const VERIFY_EMAIL = "verify_email";
const SEND_EMAIL_VERIFICATION = "send_email_verification";

const getBaseUrl = () => {
  let baseUrl = LOCAL_URL;

  if (
    (process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_USE_CLOUD === "true" &&
      process.env.NEXT_PUBLIC_API_URL) ||
    process.env.NODE_ENV === "production"
  ) {
    baseUrl = process.env.NEXT_PUBLIC_API_URL;
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
