import { createApp } from "../server";

const appPromise = createApp({
  includeViteMiddleware: false,
  includeStatic: false,
});

export default async function handler(req: any, res: any) {
  const app = await appPromise;
  return app(req, res);
}
