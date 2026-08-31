/**
 * Anthropic API key, shared across the consent translator and the visit
 * briefing translator — one key for the whole app. Falls back to the old
 * per-tool key (from when the consent translator was a separate prototype)
 * so an already-saved key isn't lost.
 */
const API_KEY_KEY = "lahealth.settings.apiKey";
const LEGACY_CONSENT_API_KEY_KEY = "lahealth.consent.apiKey";

export const settingsStore = {
  getApiKey(): string {
    const current = localStorage.getItem(API_KEY_KEY);
    if (current) return current;
    return localStorage.getItem(LEGACY_CONSENT_API_KEY_KEY) ?? "";
  },

  setApiKey(key: string): void {
    if (key) localStorage.setItem(API_KEY_KEY, key);
    else localStorage.removeItem(API_KEY_KEY);
  },
};
