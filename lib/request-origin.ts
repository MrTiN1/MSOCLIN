/** Only deployment hostnames supplied by Vercel may authorize Preview form requests. */
export function allowedRequestOrigins(
  env: NodeJS.ProcessEnv,
  developmentOrigin: string,
): string[] {
  if (env.VERCEL_ENV === "preview") {
    return [...new Set([env.VERCEL_URL, env.VERCEL_BRANCH_URL])]
      .filter(
        (host): host is string =>
          !!host && /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(host),
      )
      .map((host) => new URL(`https://${host}`).origin);
  }
  if (env.APP_URL) return [new URL(env.APP_URL).origin];
  return env.NODE_ENV === "production" ? [] : [developmentOrigin];
}
