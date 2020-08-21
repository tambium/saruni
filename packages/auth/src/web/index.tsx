import * as React from 'react';

import { useApolloClient } from '@apollo/react-hooks';
import { getApiEndpoint } from '@saruni/core';
import { setContext } from 'apollo-link-context';
import jwtDecode from 'jwt-decode';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { ApolloLink } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { onError } from 'apollo-link-error';
import fetch from 'isomorphic-unfetch';

import { useRouter } from 'next/router';

const isServer = () => typeof window === 'undefined';

const isDev = () => process.env.NODE_ENV !== 'production';

let accessToken: string | undefined;

export const getAccessToken = () => {
  return accessToken;
};

export const setAccessToken = (token: string) => {
  accessToken = token;
};

export const removeAccessToken = () => {
  accessToken = undefined;
};

const isTokenValid = () => {
  const token = getAccessToken();

  let isTokenValid = false;

  try {
    const { exp }: { exp: number } = jwtDecode(token);

    if (Date.now() < exp * 1000) {
      isTokenValid = true;
    }
  } catch (error) {
    throw new Error(`Unable to decode JWT token.`);
  }

  return isTokenValid;
};

export const handleTokenRefresh = async () => {
  if (!isTokenValid()) {
    try {
      const result = await fetch(getApiEndpoint().refreshToken, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
      });

      const json = await result.json();

      setAccessToken(json.jwt);
    } catch (error) {
      throw new Error(`Unable to create refresh token.`);
    }
  }
};

export const refreshLink = setContext(async (_request, { headers }) => {
  await handleTokenRefresh();

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
        authorization: token ? `bearer ${token}` : '',
      },
    };
  }

  return {};
});

const httpLink = new HttpLink({
  uri: getApiEndpoint().graphql,
  credentials: 'include',
  fetch,
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  console.log(graphQLErrors);
  console.log(networkError);
});

export const AuthContext = React.createContext<{
  isAuthenticated: boolean;
  loading: boolean;
  defaultRedirect: string;
  login: (...args: any[]) => void | Promise<void>;
  signup: (...args: any[]) => void | Promise<void>;
  logout: (...args: any[]) => void | Promise<void>;
}>({
  defaultRedirect: '/',
  isAuthenticated: false,
  loading: false,
  login: () => {},
  signup: () => {},
  logout: () => {},
});

export const setToken = async (token) => {
  setAccessToken(token);

  await fetch(getApiEndpoint().cookieManager, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      authorization: `bearer ${token}`,
    },
  });
};

export const removeToken = async () => {
  await fetch(getApiEndpoint().cookieManager, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      authorization: `bearer ${getAccessToken()}`,
    },
  });

  removeAccessToken();
};

export const useJwt = () => {
  const client = useApolloClient();

  return {
    setToken: async (token: string) => {
      await setToken(token);
      await client.resetStore();
    },
    removeToken: async () => {
      await removeToken();
      await client.resetStore();
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
  const context = React.useContext(AuthContext);

  return context;
};

export const privateRoute = (
  Comp: React.FC,
  options?: { redirectTo?: string },
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

  const { isAuthenticated } = useAuth();

  const token = router?.query?.token;

  const [loading, setLoading] = React.useState(() => {
    return Boolean(token);
  });

  const [done, setDone] = React.useState(() => false);

  const handler = React.useCallback(async (token) => {
    const fetchResult = await fetch(getApiEndpoint().verifyEmail, {
      method: 'PUT',
      body: JSON.stringify({ token }),
      headers: {
        'content-type': 'application/json',
        authorization: `bearer ${getAccessToken()}`,
      },
    });

    if (!fetchResult.ok) {
      throw new Error(fetchResult.statusText);
    }

    setDone(true);
    setLoading(false);

    return true;
  }, []);

  const callback = React.useCallback(async () => {
    if (!token) return false;
    const firstToken: string = Array.isArray(token) ? token[0] : token;

    return handler(firstToken);
  }, [token]);

  const callbackWithCode = async (code: number) => {
    const fetchResult = await fetch(getApiEndpoint().verifyEmail, {
      method: 'PUT',
      body: JSON.stringify({ code }),
      // credentials: "include",
      headers: {
        'content-type': 'application/json',
        authorization: `bearer ${getAccessToken()}`,
      },
    });

    return fetchResult;
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      callback();
    }
  }, [callback, isAuthenticated]);

  return [{ done, loading }, callback, callbackWithCode];
};
