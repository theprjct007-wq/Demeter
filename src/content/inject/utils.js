export function buildHeaders(rule) {
  const headers = { 'Content-Type': 'application/json' };
  if (rule.headers && typeof rule.headers === 'object') Object.assign(headers, rule.headers);
  return headers;
}

export function delay(ms) {
  const safeMs = typeof ms === 'number' && ms >= 0 ? ms : 0;
  return new Promise((resolve) => setTimeout(resolve, safeMs));
}

export function resolveUrl(input) {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}
