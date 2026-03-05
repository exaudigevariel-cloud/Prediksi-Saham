import serverless from "serverless-http";
import { createApp } from "../../server";

type NetlifyHandler = (event: any, context: any) => Promise<any>;

const handlerPromise: Promise<NetlifyHandler> = createApp({
  includeViteMiddleware: false,
  includeStatic: false,
}).then((app) => serverless(app) as NetlifyHandler);

export const handler: NetlifyHandler = async (event, context) => {
  const runtimeHandler = await handlerPromise;
  return runtimeHandler(event, context);
};
