import * as React from "react";

import { useMutation, MutationOptions } from "@apollo/react-hooks";
import { setContext } from "apollo-link-context";
import gql from "graphql-tag";
import jwtDecode from "jwt-decode";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { ApolloLink } from "apollo-link";
import { HttpLink } from "apollo-link-http";
import { onError } from "apollo-link-error";
import fetch from "isomorphic-unfetch";

// TODO: add next/router here
// import { useRouter } from "next/router";

const isServer = () => typeof window === "undefined";

const isDev = () => process.env.NODE_ENV !== "production";

let accessToken: string | undefined = undefined;

const getAccessToken = () => {
  return accessToken;
};

const setAccessToken = (token: string | undefined) => {
  accessToken = token;
};

const getAddress = (name: string) => {
  const uri =
    process.env.NODE_ENV === "production"
      ? process.env.API_URL
      : "http://localhost:4000";

  return `${uri}/${name}`;
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
  uri: getAddress("graphql"),
  credentials: "include",
  fetch,
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  console.log(graphQLErrors);
  console.log(networkError);
});

const AuthContext = React.createContext(null);

export const Auth: React.FC = (props) => {
  // TODO: use real data to decide auth state
  const authResult = {};

  return (
    <AuthContext.Provider value={authResult}>
      {props.children}
    </AuthContext.Provider>
  );
};

export const jwtClient = new ApolloClient({
  ssrMode: false,
  link: ApolloLink.from([
    ApolloLink.from([refreshLink, authLink, errorLink, httpLink]),
  ]),
  cache: new InMemoryCache(),
});

export const useAuth = () => {
  const [handler] = useMutation(
    gql`
      mutation {
        login
      }
    `
  );

  return {
    login: async (options?: MutationOptions) => {
      try {
        const result = await handler(options);

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

export const privateRoute = (Comp, options: { redirectTo: string }) => {
  const PrivateRouteComponent: React.FC = (props) => {
    // const router = useRouter();

    const [{ data, error, loading }, isAuth] = React.useContext(AuthContext);

    React.useEffect(() => {
      if (!data?.user && options.redirectTo && !loading) {
        // router.replace(options.redirectTo);
      }
    }, [loading]);

    if (isServer() && isDev()) {
      return null;
    }

    if (loading || error) return null;

    if (!data?.user && options.redirectTo) return null;

    return <Comp {...props} />;
  };

  return PrivateRouteComponent;
};
