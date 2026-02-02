export function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  const allowedOrigin = process.env.APP_ORIGIN;

  if (!origin || !host) {
    return;
  }

  if (allowedOrigin) {
    if (origin !== allowedOrigin) {
      throw new Error("CSRF_BLOCKED");
    }
    return;
  }

  const originHost = new URL(origin).host;
  if (originHost !== host) {
    throw new Error("CSRF_BLOCKED");
  }
}
