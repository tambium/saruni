import React from "react";
import ReactDOMServer from "react-dom/server";
import { CacheProvider } from "@emotion/core";
import createCache from "@emotion/cache";
import createEmotionServer from "create-emotion-server";
import juice from "juice";

const EmotionCache = createCache();
const { extractCritical } = createEmotionServer(EmotionCache);

export const createEmail = async (Template: React.FC) => {
  let element = (
    <CacheProvider value={EmotionCache}>
      <Template />
    </CacheProvider>
  );

  let { css, html } = extractCritical(ReactDOMServer.renderToString(element));

  /*
   * Inline CSS that is non-global and does not feature
   * media queries and removes unused class names.
   */
  const processed: string = juice(`<style>${css}</style>${html}`);

  return processed;
};
