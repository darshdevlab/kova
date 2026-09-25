import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { request } from "node:https";
import { ProviderError } from "./errors";

export function isPublicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b, c] = address.split(".").map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 0 || b === 168 || (b === 88 && c === 99))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113));
  }
  // Restrict IPv6 to global unicast; reject transition, mapped and documentation ranges.
  const v = address.toLowerCase();
  const second = parseInt(v.split(":")[1] || "0", 16);
  return isIP(v) === 6 && /^[23][0-9a-f]{3}:/.test(v) &&
    !(v.startsWith("2001:") && (second < 0x200 || second === 0xdb8)) && !v.startsWith("2002:") && !v.startsWith("3fff:");
}
export function endpointUrl(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { throw new ProviderError("invalid_endpoint", "Enter a valid HTTPS API base URL."); }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
    (url.port && url.port !== "443") || url.pathname.includes("%") || url.href.length > 2048)
    throw new ProviderError("invalid_endpoint", "Endpoint must use HTTPS port 443, without credentials, query parameters or encoded paths.");
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") ||
    !host.includes(".") && !isIP(host) || isIP(host) && !isPublicAddress(host))
    throw new ProviderError("private_endpoint", "Private-network endpoints require a dedicated local connector, which is not available yet.");
  url.pathname = url.pathname.replace(/\/+$/, "");
  return url;
}

export async function safeJsonRequest(url: URL, headers: Record<string, string>, body?: unknown, timeoutMs = 15000): Promise<unknown> {
  endpointUrl(url.origin + url.pathname);
  const host = url.hostname.replace(/^\[|\]$/g, "");
  let timer: ReturnType<typeof setTimeout> | undefined;
  // One deadline covers DNS, TLS, headers and the entire bounded response body.
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ProviderError("timeout", "Provider request timed out.", 504)), timeoutMs);
  });
  let cancel: (() => void) | undefined;
  let finished = false;
  try {
    return await Promise.race([deadline, (async () => {
      const addresses = isIP(host) ? [{ address: host, family: isIP(host) }] : await lookup(host, { all: true });
      if (finished) throw new ProviderError("timeout", "Provider request timed out.", 504);
      if (!addresses.length || addresses.some(a => !isPublicAddress(a.address)))
        throw new ProviderError("private_endpoint", "Endpoint resolves to a restricted network. Local connectors are not available yet.");
      const chosen = addresses[0];
      return new Promise<unknown>((resolve, reject) => {
        const payload = body === undefined ? undefined : JSON.stringify(body);
        const req = request(url, {
          method: payload === undefined ? "GET" : "POST", agent: false,
          family: chosen.family,
          headers: { ...headers, Accept: "application/json", "Accept-Encoding": "identity", ...(payload ? { "Content-Type": "application/json" } : {}) },
          // Pin the checked DNS result; retain the original hostname for TLS and Host.
          lookup: (_hostname, _options, cb) => cb(null, chosen.address, chosen.family),
        }, res => {
          const status = res.statusCode || 502;
          if (status < 200 || status >= 300) {
            res.resume();
            reject(new ProviderError("upstream_rejected", status === 401 || status === 403 ? "Provider rejected the credential or its permissions." : status === 429 ? "Provider rate limit reached. Try again later." : "Provider returned an unsuccessful response.", status === 429 ? 429 : 502));
            return;
          }
          const chunks: Buffer[] = []; let bytes = 0;
          res.on("data", chunk => {
            bytes += chunk.length;
            if (bytes > 8 * 1024 * 1024) { req.destroy(); reject(new ProviderError("response_too_large", "Provider response exceeds the size limit.", 502)); }
            else chunks.push(Buffer.from(chunk));
          });
          res.on("error", () => reject(new ProviderError("network_error", "Provider response was interrupted.", 502)));
          res.on("end", () => {
            try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
            catch { reject(new ProviderError("invalid_response", "Provider returned invalid JSON.", 502)); }
          });
        });
        cancel = () => req.destroy();
        req.on("error", () => reject(new ProviderError("network_error", "Could not securely connect to the provider.", 502)));
        req.end(payload);
      });
    })()]);
  } finally { finished = true; clearTimeout(timer); cancel?.(); }
}
