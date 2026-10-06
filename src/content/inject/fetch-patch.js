import { matchRule } from '../../shared/matcher.js';
import { state } from './state.js';
import { logRequest } from './logger.js';
import { buildHeaders, delay, resolveUrl } from './utils.js';

export function patchFetch() {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async function (input, init) {
    let url, method;
    try {
      url = resolveUrl(input);
      method = (init && init.method) || (typeof input !== 'string' && input.method) || 'GET';
    } catch (e) {
      return originalFetch(input, init); // can't read the request shape — don't touch it
    }

    let rule = null;
    try {
      rule = matchRule(state, url, method);
    } catch (e) {
      console.warn('[Demeter] rule matching failed, passing request through:', e.message);
    }

    if (rule) {
      try {
        await delay(rule.delayMs);
        const body = rule.body !== undefined ? rule.body : '{}';
        logRequest({ url, method, status: rule.statusCode || 200, mocked: true, body, ruleId: rule.id });
        return new Response(body, { status: rule.statusCode || 200, headers: buildHeaders(rule) });
      } catch (e) {
        console.warn('[Demeter] mock rule failed to apply, falling back to real request:', e.message);
      }
    }

    const res = await originalFetch(input, init);
    // Clone before reading so the page's own body stays unconsumed; don't
    // await the log so real requests never gain latency.
    try {
      res
        .clone()
        .text()
        .then((t) => logRequest({ url, method, status: res.status, mocked: false, body: t.slice(0, 2000) }))
        .catch(() => logRequest({ url, method, status: res.status, mocked: false, body: '' }));
    } catch (e) {
      logRequest({ url, method, status: res.status, mocked: false, body: '' });
    }
    return res;
  };
}
