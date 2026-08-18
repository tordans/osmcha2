import { useState } from "react";
import { useAuthStore } from "../stores/authStore.ts";

interface TokenImportProps {
  compact?: boolean;
}

export function TokenImport({ compact = false }: TokenImportProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const token = value.trim();
    if (!token) return;
    useAuthStore.getState().setToken(token);
    setValue("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={
        compact
          ? "flex-parent flex-parent--center-cross"
          : "flex-parent flex-parent--column flex-parent--center-cross"
      }
    >
      {!compact && (
        <p className="txt-s align-center mb6 px12">
          Paste an API token from{" "}
          <a
            href="https://osmcha.org"
            className="link"
            target="_blank"
            rel="noreferrer"
          >
            osmcha.org
          </a>
          . OSM sign-in works only on localhost.
        </p>
      )}
      <div className="flex-parent flex-parent--center-cross">
        <input
          type="password"
          name="osmcha-api-token"
          className="input wmax180"
          placeholder="API token"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="OSMCha API token"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="btn btn--s border border--1 round transition ml6 border--darken5 border--darken25-on-hover bg-darken10 bg-darken5-on-hover color-gray"
        >
          Save
        </button>
      </div>
    </form>
  );
}
