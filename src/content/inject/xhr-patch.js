import { matchRule } from '../../shared/matcher.js';
import { state } from './state.js';
import { logRequest } from './logger.js';

export function patchXHR() {
  const OriginalXHR = window.XMLHttpRequest;

  function DemeterXHR() {
    const xhr = new OriginalXHR();
    const original = { open: xhr.open.bind(xhr), send: xhr.send.bind(xhr) };
    let matchedRule = null;
    let requestUrl = '';
    let requestMethod = 'GET';

    xhr.open = function (method, url, ...rest) {
      requestMethod = method;
      requestUrl = url;
      try {
        matchedRule = matchRule(state, url, method);
      } catch (e) {
        console.warn('[Demeter] rule matching failed for XHR, passing through:', e.message);
        matchedRule = null;
      }
      if (matchedRule) return; // no real connection for mocked requests
      return original.open(method, url, ...rest);
    };

    xhr.send = function (...args) {
      if (matchedRule) {
        const rule = matchedRule;
        setTimeout(() => {
          // try/catch must live INSIDE the callback — it can't catch errors
          // thrown from an async timeout by wrapping setTimeout() itself.
          try {
            Object.defineProperty(xhr, 'status', { value: rule.statusCode || 200, configurable: true });
            Object.defineProperty(xhr, 'readyState', { value: 4, configurable: true });
            Object.defineProperty(xhr, 'responseText', { value: rule.body || '{}', configurable: true });
            Object.defineProperty(xhr, 'response', { value: rule.body || '{}', configurable: true });
            logRequest({ url: requestUrl, method: requestMethod, status: rule.statusCode || 200, mocked: true, body: rule.body || '{}', ruleId: rule.id });
            if (typeof xhr.onreadystatechange === 'function') xhr.onreadystatechange();
            xhr.dispatchEvent(new Event('readystatechange'));
            xhr.dispatchEvent(new Event('load'));
            xhr.dispatchEvent(new Event('loadend'));
          } catch (e) {
            console.warn('[Demeter] mock rule failed to apply to XHR:', e.message);
            if (typeof xhr.onerror === 'function') xhr.onerror();
            xhr.dispatchEvent(new Event('error'));
            xhr.dispatchEvent(new Event('loadend'));
          }
        }, rule.delayMs || 0);
        return;
      }

      xhr.addEventListener('load', () => {
        logRequest({
          url: requestUrl,
          method: requestMethod,
          status: xhr.status,
          mocked: false,
          body: (xhr.responseText || '').slice(0, 2000)
        });
      });
      return original.send(...args);
    };

    return xhr;
  }

  window.XMLHttpRequest = DemeterXHR;
}
