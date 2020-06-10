import * as React from "react";

import { ApolloProvider } from "@apollo/react-hooks";
import { InMemoryCache, NormalizedCacheObject } from "apollo-cache-inmemory";
import { ApolloClient, ApolloClientOptions } from "apollo-client";
import { ApolloLink } from "apollo-link";
import { HttpLink } from "apollo-link-http";
import { onError } from "apollo-link-error";

const getAddress = (name: string) => {
  const uri =
    process.env.NODE_ENV === "production"
      ? process.env.API_URL
      : "http://localhost:4000";

  return `${uri}/${name}`;
};

interface GenerateApiProviderOptions {
  apolloClientOptions?: Partial<ApolloClientOptions<NormalizedCacheObject>>;
}

export const generateApiProvider = (options?: GenerateApiProviderOptions) => {
  const { apolloClientOptions } = options ?? {};

  let client: ApolloClient<NormalizedCacheObject>;

  const httpLink = new HttpLink({
    uri: getAddress("graphql"),
    credentials: "include",
  });

  const errorLink = onError(({ graphQLErrors, networkError }) => {
    console.log(graphQLErrors);
    console.log(networkError);
  });

  if (apolloClientOptions) {
    client = new ApolloClient({
      ssrMode: false,
      link: ApolloLink.from([
        apolloClientOptions.link,
        ApolloLink.from([errorLink, httpLink]),
      ]),
      cache: new InMemoryCache(),
      ...apolloClientOptions,
    });
  } else {
    client = new ApolloClient({
      ssrMode: false,
      link: ApolloLink.from([ApolloLink.from([errorLink, httpLink])]),
      cache: new InMemoryCache(),
    });
  }

  const ApiProvider: React.FC = (props) => {
    return <ApolloProvider client={client}>{props.children}</ApolloProvider>;
  };

  return ApiProvider;
};
