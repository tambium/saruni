import * as React from "react";

import { ApolloProvider } from "@apollo/react-hooks";
import { InMemoryCache, NormalizedCacheObject } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { ApolloLink } from "apollo-link";
import { HttpLink } from "apollo-link-http";
import { onError } from "apollo-link-error";

const getAPIEndpoint = (resource: string) => {
  if (
    (process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_USE_CLOUD === "true" &&
      process.env.NEXT_PUBLIC_API_URL) ||
    process.env.NODE_ENV === "production"
  ) {
    return `${process.env.NEXT_PUBLIC_API_URL}/${resource}`;
  }

  return `http://localhost:4000/${resource}`;
};

interface GenerateApiProviderOptions {
  apolloClient?: ApolloClient<NormalizedCacheObject>;
}

export const generateApiProvider = (options?: GenerateApiProviderOptions) => {
  const { apolloClient } = options ?? {};

  let client: ApolloClient<NormalizedCacheObject>;

  const httpLink = new HttpLink({
    uri: getAPIEndpoint("graphql"),
    credentials: "include",
  });

  const errorLink = onError(({ graphQLErrors, networkError }) => {
    console.log(graphQLErrors);
    console.log(networkError);
  });

  client = new ApolloClient({
    ssrMode: false,
    link: ApolloLink.from([ApolloLink.from([errorLink, httpLink])]),
    cache: new InMemoryCache(),
  });

  const ApiProvider: React.FC = (props) => {
    return (
      <ApolloProvider client={apolloClient || client}>
        {props.children}
      </ApolloProvider>
    );
  };

  return ApiProvider;
};
