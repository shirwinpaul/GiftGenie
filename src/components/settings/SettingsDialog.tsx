"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useByokKey, looksLikeGeminiKey } from "@/hooks/useByokKey";

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="⚙️ Settings">
      {/* Remount the form each time so it starts from the saved value. */}
      {open && <ByokForm onDone={onClose} />}
    </Modal>
  );
}

function ByokForm({ onDone }: { onDone: () => void }) {
  const [savedKey, setSavedKey, clearKey] = useByokKey();
  const [draft, setDraft] = useState(savedKey);
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  function save() {
    const value = draft.trim();
    if (value && !looksLikeGeminiKey(value)) {
      setError("That doesn't look like a Gemini API key. Please copy it again from AI Studio.");
      return;
    }
    if (value) setSavedKey(value);
    else clearKey();
    onDone();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-4"
    >
      <section>
        <h3 className="text-lg font-semibold">Your own free Gemini key (optional)</h3>
        <p className="muted mt-1 text-sm">
          If the shared free AI limit is reached, you can use your own free key. It is saved only
          in this browser and sent with each request. It is never stored or logged on our server.
        </p>
      </section>

      <ol className="muted list-decimal space-y-1 pl-5 text-sm">
        <li>
          Open{" "}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-teal-700 underline dark:text-teal-300"
          >
            aistudio.google.com
          </a>{" "}
          and sign in with a Google account.
        </li>
        <li>Click “Get API key” → “Create API key”.</li>
        <li>Copy the key and paste it below, then press Save.</li>
      </ol>

      <div>
        <label htmlFor="byok" className="label">
          Gemini API key
        </label>
        <div className="flex gap-2">
          <input
            id="byok"
            className="input font-mono"
            type={show ? "text" : "password"}
            autoComplete="off"
            spellCheck={false}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            placeholder="Paste your key here"
            aria-invalid={!!error}
            aria-describedby={error ? "byok-error" : undefined}
          />
          <button type="button" className="btn-secondary px-3" onClick={() => setShow((s) => !s)}>
            {show ? "Hide" : "Show"}
          </button>
        </div>
        {error && (
          <p id="byok-error" role="alert" className="mt-1 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        )}
        {savedKey && <p className="mt-2 text-sm text-teal-700 dark:text-teal-300">✅ A personal key is saved.</p>}
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        {savedKey && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              clearKey();
              setDraft("");
            }}
          >
            Remove my key
          </button>
        )}
        <button type="submit" className="btn-primary">
          Save
        </button>
      </div>
    </form>
  );
}
