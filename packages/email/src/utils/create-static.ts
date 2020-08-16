import ReactDOMServer from 'react-dom/server';
import juice from 'juice';

export const createStatic = (element: JSX.Element) => {
  return juice(ReactDOMServer.renderToStaticMarkup(element));
};
