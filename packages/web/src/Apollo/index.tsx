import * as React from "react";

import { ApolloProvider } from "@apollo/react-hooks";
import { getApiEndpoint } from "@saruni/core";
import { InMemoryCache, NormalizedCacheObject } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { ApolloLink } from "apollo-link";
import { HttpLink } from "apollo-link-http";
import { onError } from "apollo-link-error";

interface GenerateApiProviderOptions {
  apolloClient?: ApolloClient<NormalizedCacheObject>;
}

export const generateApiProvider = (options?: GenerateApiProviderOptions) => {
  const { apolloClient } = options ?? {};

  let client: ApolloClient<NormalizedCacheObject>;

  const httpLink = new HttpLink({
    uri: getApiEndpoint().graphql,
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
