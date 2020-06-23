import * as React from "react";

import { useApolloClient } from "@apollo/react-hooks";
import { setContext } from "apollo-link-context";
import jwtDecode from "jwt-decode";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { ApolloLink } from "apollo-link";
import { HttpLink } from "apollo-link-http";
import { onError } from "apollo-link-error";
import fetch from "isomorphic-unfetch";

const getAPIEndpoint = (resource: string) => {
  return `http://localhost:4000/${resource}`;
};

import { useRouter } from "next/router";

const isServer = () => typeof window === "undefined";

const isDev = () => process.env.NODE_ENV !== "production";

let accessToken: string | undefined = undefined;

// TODO: temp solution
export const getAccessToken = () => {
  return accessToken;
};

export const setAccessToken = (token: string) => {
  accessToken = token;
};

export const removeAccessToken = () => {
  accessToken = undefined;
};

export const refreshLink = setContext(async (_request, { headers }) => {
  const token = getAccessToken();

  let isTokenValid = false;

  try {
    const { exp }: { exp: number } = jwtDecode(token);

    if (Date.now() < exp * 1000) {
      isTokenValid = true;
    }
  } catch {}

  if (!isTokenValid) {
    try {
      const result = await fetch(getAPIEndpoint("refresh_token"), {
        credentials: "include",
      });

      const json = await result.json();

      setAccessToken(json.jwt);
    } catch {}
  }

  return {
    headers: {
      ...headers,
    },
  };
});

export const authLink = setContext(async (_request, { headers }) => {
  const token = getAccessToken();

  if (token) {
    return {
      headers: {
        ...headers,
        authentication: token ? `bearer ${token}` : "",
      },
    };
  }

  return {};
});

const httpLink = new HttpLink({
  uri: getAPIEndpoint("graphql"),
  credentials: "include",
  fetch,
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  console.log(graphQLErrors);
  console.log(networkError);
});

export const AuthContext = React.createContext<{
  isAuthenticated: boolean;
  loading: boolean;
  login: () => void | Promise<void>;
  signup: () => void | Promise<void>;
  logout: () => void | Promise<void>;
}>({
  isAuthenticated: false,
  loading: false,
  login: () => {},
  signup: () => {},
  logout: () => {},
});

export const setToken = async (token) => {
  try {
    setAccessToken(token);

    await fetch(getAPIEndpoint("cookie_manager"), {
      method: "PUT",
      credentials: "include",
      headers: {
        authentication: `bearer ${token}`,
      },
    });
  } catch (e) {
    throw e;
  }
};

export const removeToken = async () => {
  try {
    await fetch(getAPIEndpoint("cookie_manager"), {
      method: "DELETE",
      credentials: "include",
      headers: {
        authentication: `bearer ${getAccessToken()}`,
      },
    });

    removeAccessToken();
  } catch (e) {
    throw e;
  }
};

export const useJwtToken = () => {
  const client = useApolloClient();

  return {
    setToken: async (token: string) => {
      try {
        await setToken(token);

        await client.resetStore();
      } catch (e) {
        throw e;
      }
    },
    removeToken: async () => {
      try {
        await removeToken();

        await client.resetStore();
      } catch (e) {
        throw e;
      }
    },
  };
};

export const jwtClient = new ApolloClient({
  ssrMode: false,
  link: ApolloLink.from([
    ApolloLink.from([refreshLink, authLink, errorLink, httpLink]),
  ]),
  cache: new InMemoryCache(),
});

export const useAuth = () => {
  return React.useContext(AuthContext);
};

export const privateRoute = (
  Comp: React.FC,
  options: { redirectTo: string }
) => {
  const PrivateRouteComponent: React.FC = (props) => {
    const router = useRouter();

    const { loading, isAuthenticated } = React.useContext(AuthContext);

    React.useEffect(() => {
      if (!isAuthenticated && options.redirectTo && !loading) {
        router.replace(options.redirectTo);
      }
    }, [loading]);

    if (isServer() && isDev()) {
      return null;
    }

    if (loading && !isAuthenticated) return null;

    if (!isAuthenticated && options.redirectTo) return null;

    return <Comp {...props} />;
  };

  return PrivateRouteComponent;
};

export const useVerifyEmail = () => {
  const router = useRouter();
  const {
    query: { token },
  } = router;

  const { isAuthenticated } = useAuth();

  const [status, setStatus] = React.useState<string | undefined>(undefined);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [loading, setLoading] = React.useState<boolean>(true);

  const callback = React.useCallback(async () => {
    if (!token || !isAuthenticated) return;

    setLoading(true);

    const firstToken: string = Array.isArray(token) ? token[0] : token;

    try {
      const fetchResult = await fetch("http://localhost:4000/verify_email", {
        method: "PUT",
        body: JSON.stringify({ token: firstToken }),
        headers: {
          authentication: "bearer " + getAccessToken(),
        },
      });

      if (fetchResult.ok) {
        setError(undefined);

        setStatus("done");

        setLoading(false);
      } else {
        throw new Error("Something went wrong");
      }
    } catch (e) {
      setError(e.message);

      setLoading(false);
    }
  }, [token, isAuthenticated]);

  React.useEffect(() => {
    callback();
  }, [callback]);

  return { verifyEmail: callback, status, error, loading };
};
