"use client";

import { useEffect } from "react";
import { Check, RotateCcw } from "lucide-react";
import { applyTheme, THEMES, useTheme } from "@/lib/theme";

export function ThemeRoot({ children }: { children: React.ReactNode }) {
  const { settings } = useTheme();
  useEffect(() => {
    applyTheme(settings);
  }, [settings]);
  return children;
}

export function ThemePicker() {
  const { settings, tokens, selectPreset, setColor, resetColors } = useTheme();
  return (
    <div className="appearance-editor">
      <div className="theme-preset-grid" role="group" aria-label="Color themes">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            className={`theme-preset ${settings.preset === theme.id ? "is-selected" : ""}`}
            aria-pressed={settings.preset === theme.id}
            aria-label={theme.name}
            onClick={() => selectPreset(theme.id)}
          >
            <span
              className="ide-swatch"
              style={
                {
                  "--sample-canvas": theme.colors.canvas,
                  "--sample-sidebar": theme.colors.surface,
                  "--sample-accent": theme.colors.accent,
                  "--sample-text": theme.colors.text,
                  "--sample-status": theme.status,
                } as React.CSSProperties
              }
            >
              <span className="sample-sidebar">
                <i />
                <i />
                <i />
              </span>
              <span className="sample-code">
                <i />
                <i />
                <i />
                <i />
              </span>
              <span className="sample-status" />
            </span>
            <span className="theme-preset-label">
              <strong>{theme.name}</strong>
              {settings.preset === theme.id && <Check />}
            </span>
            <small>{theme.description}</small>
          </button>
        ))}
      </div>
      <div className="appearance-custom-heading">
        <h3>Make it yours</h3>
        <button
          className="text-button"
          type="button"
          onClick={resetColors}
          disabled={!Object.keys(settings.overrides).length}
        >
          <RotateCcw />
          Reset colors
        </button>
      </div>
      <div className="theme-color-grid">
        {(
          [
            { key: "accent", label: "Accent", token: "accent" },
            { key: "editor", label: "Editor background", token: "editor-bg" },
            { key: "sidebar", label: "Sidebar", token: "sidebar-bg" },
            { key: "status", label: "Status bar", token: "status-bg" },
          ] as const
        ).map(({ key, label, token }) => (
          <label className="theme-color-control" key={key}>
            <input
              type="color"
              aria-label={`${label} color`}
              value={tokens[token]}
              onChange={(e) => setColor(key, e.target.value)}
            />
            <span>
              <strong>{label}</strong>
              <code>{tokens[token].toUpperCase()}</code>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
