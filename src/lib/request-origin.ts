// Next's internal request URL may use localhost behind a proxy. The public Host
// header must still match Origin; never accept an arbitrary forwarded host.
export function isSameOrigin(request: Request, requireOrigin = false) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const value = request.headers.get("origin");
  if (!value) return !requireOrigin;
  try {
    const origin = new URL(value);
    if (
      origin.username ||
      origin.password ||
      origin.pathname !== "/" ||
      origin.search ||
      origin.hash
    )
      return false;
    const url = new URL(request.url);
    const host = request.headers.get("host") || url.host;
    const proto =
      request.headers.get("x-forwarded-proto") || url.protocol.slice(0, -1);
    return (
      ["http", "https"].includes(proto) &&
      origin.protocol === `${proto}:` &&
      origin.host.toLowerCase() === host.toLowerCase()
    );
  } catch {
    return false;
  }
}
