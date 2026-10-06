// Pure matching logic (no chrome.*, no DOM) so it's unit-testable.
// Globs only (* = anything) — deliberately not full regex in v1.
export function globToRegExp(glob) {
  const escaped = glob.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp('^' + escaped + '$');
}

// config: { rules, enabled }
export function matchRule(config, url, method) {
  if (!config.enabled) return null;
  const upperMethod = (method || 'GET').toUpperCase();
  for (const rule of config.rules) {
    if (!rule || rule.enabled === false) continue;
    if (!rule.urlPattern) continue; // empty pattern must never blanket-match
    const ruleMethod = (rule.method || 'GET').toUpperCase();
    if (ruleMethod !== '*' && ruleMethod !== upperMethod) continue;
    try {
      if (globToRegExp(rule.urlPattern).test(url)) return rule;
    } catch (e) {
      console.warn('[Demeter] skipping rule with invalid pattern:', rule.urlPattern);
    }
  }
  return null;
}
