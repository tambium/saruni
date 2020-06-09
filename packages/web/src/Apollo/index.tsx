import * as React from "react";

import { ApolloProvider, useMutation } from "@apollo/react-hooks";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { ApolloLink } from "apollo-link";
import { setContext } from "apollo-link-context";
import { HttpLink } from "apollo-link-http";
import { onError } from "apollo-link-error";
import gql from "graphql-tag";
import jwtDecode from "jwt-decode";

let accessToken: string | undefined = undefined;

export const getAccessToken = () => {
  return accessToken;
};

export const setAccessToken = (token: string) => {
  accessToken = token;
};

const getAddress = (name: string) => {
  const uri =
    process.env.NODE_ENV === "production"
      ? process.env.API_URL
      : "http://localhost:4000";

  return `${uri}/${name}`;
};

const httpLink = new HttpLink({
  uri: getAddress("graphql"),
  credentials: "include",
});

const refreshLink = setContext(async (_request, { headers }) => {
  const token = getAccessToken();

  let isTokenInvalid = false;

  if (!token) {
    isTokenInvalid = true;
  }

  try {
    const { exp }: { exp: number } = jwtDecode(token);

    if (Date.now() < exp * 1000) {
      isTokenInvalid = false;
    } else {
      isTokenInvalid = true;
    }
  } catch (e) {
    console.log(e);
    isTokenInvalid = true;
  }

  if (isTokenInvalid) {
    try {
      const result = await fetch(getAddress("refresh_token"), {
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

const authLink = setContext(async (_request, { headers }) => {
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

const errorLink = onError(({ graphQLErrors, networkError }) => {
  console.log(graphQLErrors);
  console.log(networkError);
});

const client = new ApolloClient({
  ssrMode: false,
  link: ApolloLink.from([refreshLink, authLink, errorLink, httpLink]),
  cache: new InMemoryCache(),
});

export const AuthContext = React.createContext(null);

export const Auth: React.FC = (props) => {
  const isAuthenticated = true;

  return (
    <AuthContext.Provider value={isAuthenticated}>
      {props.children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const [handler] = useMutation(
    gql`
      mutation {
        login
      }
    `
  );

  return {
    login: async () => {
      try {
        const result = await handler();

        setAccessToken(result.data.login);

        await fetch(getAddress("cookie_manager"), {
          method: "PUT",
          credentials: "include",
          headers: {
            authentication: `bearer ${result.data.login}`,
          },
        });
      } catch (e) {
        throw e;
      }
    },
    logout: async () => {
      try {
        await fetch(getAddress("cookie_manager"), {
          method: "DELETE",
          credentials: "include",
          headers: {
            authentication: `bearer ${getAccessToken()}`,
          },
        });

        setAccessToken(undefined);
      } catch (e) {
        throw e;
      }
    },
  };
};

export const ApiProvider: React.FC = (props) => {
  return (
    <ApolloProvider client={client}>
      <Auth>{props.children} </Auth>
    </ApolloProvider>
  );
};
