export const PREVIEW_CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; frame-src 'none'; child-src 'none'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";

export function previewDocument(html: string): string {
  // The trusted policy precedes every byte of generated content; later policies cannot relax it.
  return `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}"><meta name="referrer" content="no-referrer"><meta charset="utf-8"></head><body>${html}</body></html>`;
}

export function validateLocalHtml(html: string): string[] {
  const findings: string[] = [];
  if (!html.trim()) return ["The HTML document is empty."];
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document.title.trim()) findings.push("Document title is missing.");
  if (!document.documentElement.lang) findings.push("Document language is missing.");
  if (!document.querySelector('meta[name="viewport"]')) findings.push("Mobile viewport metadata is missing.");
  if (document.querySelector('script[src], link[rel="stylesheet"], iframe, object, embed')) findings.push("External scripts, styles or embedded pages will be blocked in preview.");
  if ([...document.images].some((image) => !image.hasAttribute("alt"))) findings.push("Some images have no alt attribute.");
  if (document.querySelector('meta[http-equiv="refresh" i]')) findings.push("Remove automatic page redirects.");
  return findings;
}
