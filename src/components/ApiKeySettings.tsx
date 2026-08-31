import { useState } from "react";
import { settingsStore } from "../data/settingsStorage";

/** Shared Anthropic API key setting — used by both visit briefing and consent-document translation. */
export default function ApiKeySettings() {
  const [apiKey, setApiKey] = useState(() => settingsStore.getApiKey());
  const [saved, setSaved] = useState(true);

  function save() {
    settingsStore.setApiKey(apiKey.trim());
    setSaved(true);
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 className="text-sm font-medium text-slate-500 mb-3">Anthropic API key</h2>
      <p className="text-xs text-slate-500 mb-3">
        Stored only in this browser's localStorage. Used for both visit briefing and consent-document
        translation — requests go directly from this browser to the Anthropic API, never through a server of ours.
      </p>
      <div className="flex gap-2">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            setSaved(false);
          }}
          placeholder="sk-ant-..."
          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
        />
        <button
          onClick={save}
          disabled={saved}
          className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-40 disabled:hover:bg-teal-600"
        >
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </section>
  );
}
