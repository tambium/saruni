interface ICorsOptions {
  origin?: string;
  origins?: string[];
  headers?: string;
  credentials?: boolean;
  maxAge?: string;
  cacheControl?: string;
}

const credentialsOrigin = process.env.WEB_DOMAIN || "http://localhost:3000";

export const baseOptions: ICorsOptions = {
  credentials: false,
  headers:
    "Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token, X-Amz-User-Agent",
  origin: "*",
};

export const credentialsOptions: ICorsOptions = {
  credentials: true,
  headers:
    "Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token, X-Amz-User-Agent",
  origin: credentialsOrigin,
};
