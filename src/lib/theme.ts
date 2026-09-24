"use client";

import { useMemo, useSyncExternalStore } from "react";

type Colors = Record<string, string>;
export type ThemeOverrides = Partial<
  Record<"accent" | "editor" | "sidebar" | "status", string>
>;
export type ThemeSettings = { preset: string; overrides: ThemeOverrides };

const dark: Colors = {
  canvas: "#141617",
  surface: "#1b1d1f",
  "surface-raised": "#232628",
  "surface-subtle": "#25292b",
  "surface-hover": "#2c3032",
  text: "#eff1ed",
  "text-secondary": "#b3b8b8",
  "text-muted": "#909899",
  border: "#303537",
  "border-strong": "#50585a",
  accent: "#acd4be",
  "accent-ink": "#152a20",
  "accent-subtle": "#253b31",
  blue: "#9bbbcf",
  "blue-subtle": "#25343e",
  success: "#acd4be",
  "success-subtle": "#253b31",
  warning: "#dbb575",
  "warning-subtle": "#3c3325",
  error: "#e5a39e",
  "error-subtle": "#402a2a",
};
const light: Colors = {
  canvas: "#e9edeb",
  surface: "#f6f8f6",
  "surface-raised": "#ffffff",
  "surface-subtle": "#e4e9e6",
  "surface-hover": "#dce3df",
  text: "#202825",
  "text-secondary": "#4f5e57",
  "text-muted": "#637369",
  border: "#ced6d1",
  "border-strong": "#9caea1",
  accent: "#315f49",
  "accent-ink": "#f5faf7",
  "accent-subtle": "#dbe9df",
  blue: "#365f7d",
  "blue-subtle": "#dce7ee",
  success: "#315f49",
  "success-subtle": "#dbe9df",
  warning: "#876028",
  "warning-subtle": "#f1e7d6",
  error: "#a0443e",
  "error-subtle": "#f3dfdc",
};

export const THEMES = [
  {
    id: "graphite",
    name: "Graphite",
    description: "Kova original",
    mode: "dark",
    colors: dark,
    status: "#1b2420",
  },
  {
    id: "silver",
    name: "Silver",
    description: "Kova light",
    mode: "light",
    colors: light,
    status: "#dbe5de",
  },
  {
    id: "code-dark",
    name: "Code Dark",
    description: "VS Code inspired",
    mode: "dark",
    colors: {
      ...dark,
      canvas: "#1e1e1e",
      surface: "#252526",
      "surface-raised": "#2d2d30",
      "surface-subtle": "#333333",
      "surface-hover": "#37373d",
      text: "#d4d4d4",
      "text-secondary": "#bcbcbc",
      "text-muted": "#a0a0a0",
      border: "#3b3b3b",
      "border-strong": "#606060",
      accent: "#78b8e6",
      "accent-subtle": "#263f50",
      blue: "#78b8e6",
    },
    status: "#075d94",
  },
  {
    id: "code-light",
    name: "Code Light",
    description: "VS Code inspired",
    mode: "light",
    colors: {
      ...light,
      canvas: "#ffffff",
      surface: "#f3f3f3",
      "surface-raised": "#ffffff",
      "surface-subtle": "#e8e8e8",
      "surface-hover": "#dedede",
      text: "#333333",
      "text-secondary": "#505050",
      "text-muted": "#666666",
      border: "#dddddd",
      "border-strong": "#aaaaaa",
      accent: "#0067a5",
      "accent-subtle": "#dfedf6",
      blue: "#0067a5",
    },
    status: "#075d94",
  },
  {
    id: "github-dark",
    name: "GitHub Dark",
    description: "GitHub inspired",
    mode: "dark",
    colors: {
      ...dark,
      canvas: "#0d1117",
      surface: "#161b22",
      "surface-raised": "#21262d",
      "surface-subtle": "#21262d",
      "surface-hover": "#292e36",
      text: "#e6edf3",
      "text-secondary": "#b1bac4",
      "text-muted": "#919ba6",
      border: "#30363d",
      "border-strong": "#58616d",
      accent: "#79b8ff",
      "accent-subtle": "#1c3048",
      blue: "#79b8ff",
      success: "#7bc496",
    },
    status: "#161b22",
  },
  {
    id: "github-light",
    name: "GitHub Light",
    description: "GitHub inspired",
    mode: "light",
    colors: {
      ...light,
      canvas: "#ffffff",
      surface: "#f6f8fa",
      "surface-raised": "#ffffff",
      "surface-subtle": "#eaeef2",
      "surface-hover": "#e4e9ef",
      text: "#24292f",
      "text-secondary": "#424a53",
      "text-muted": "#57606a",
      border: "#d0d7de",
      "border-strong": "#8c959f",
      accent: "#0969da",
      "accent-subtle": "#ddf4ff",
      blue: "#0969da",
      success: "#1a7f37",
    },
    status: "#eaeef2",
  },
] as const;

const STORAGE_KEY = "kova:appearance:v3";
const EVENT = "kova:appearance-changed";
const DEFAULT = '{"preset":"graphite","overrides":{}}';
const LEGACY_LIGHT = '{"preset":"silver","overrides":{}}';

function subscribe(listener: () => void) {
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}
function getSnapshot() {
  try {
    return (
      localStorage.getItem(STORAGE_KEY) ||
      (localStorage.getItem("kova:theme:v2") === "light"
        ? LEGACY_LIGHT
        : DEFAULT)
    );
  } catch {
    return DEFAULT;
  }
}
function parseSettings(raw: string): ThemeSettings {
  try {
    const parsed = JSON.parse(raw);
    const preset = THEMES.some((theme) => theme.id === parsed.preset)
      ? parsed.preset
      : "graphite";
    const overrides: ThemeOverrides = {};
    for (const key of ["accent", "editor", "sidebar", "status"] as const)
      if (/^#[0-9a-f]{6}$/i.test(parsed.overrides?.[key]))
        overrides[key] = parsed.overrides[key];
    return { preset, overrides };
  } catch {
    return { preset: "graphite", overrides: {} };
  }
}
function rgb(hex: string) {
  return [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
}
function luminance(hex: string) {
  return rgb(hex)
    .map((part) => {
      const c = part / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    })
    .reduce((total, part, i) => total + part * [0.2126, 0.7152, 0.0722][i], 0);
}
export function foreground(background: string) {
  return luminance(background) > 0.179 ? "#15191d" : "#f5f7fa";
}
function mix(a: string, b: string, amount: number) {
  const x = rgb(a),
    y = rgb(b);
  return (
    "#" +
    x
      .map((part, i) =>
        Math.round(part * amount + y[i] * (1 - amount))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

export function themeTokens(settings: ThemeSettings): Record<string, string> {
  const preset =
    THEMES.find((theme) => theme.id === settings.preset) || THEMES[0];
  const colors: Colors = { ...preset.colors };
  const accent = settings.overrides.accent || colors.accent;
  const sidebar = settings.overrides.sidebar || colors.surface;
  const editor = settings.overrides.editor || colors.canvas;
  const status = settings.overrides.status || preset.status;
  return {
    ...colors,
    ink: colors.text,
    accent,
    "accent-ink": foreground(accent),
    "accent-subtle": mix(accent, colors.canvas, 0.16),
    "sidebar-bg": sidebar,
    "sidebar-text": settings.overrides.sidebar
      ? foreground(sidebar)
      : colors.text,
    "sidebar-muted": settings.overrides.sidebar
      ? mix(foreground(sidebar), sidebar, 0.72)
      : colors["text-secondary"],
    "sidebar-border": mix(foreground(sidebar), sidebar, 0.18),
    "editor-bg": editor,
    "editor-text": settings.overrides.editor ? foreground(editor) : colors.text,
    "status-bg": status,
    "status-text": foreground(status),
  };
}
export function applyTheme(settings: ThemeSettings) {
  const preset =
    THEMES.find((theme) => theme.id === settings.preset) || THEMES[0];
  document.documentElement.dataset.theme = preset.mode;
  document.documentElement.dataset.preset = preset.id;
  document.documentElement.style.colorScheme = preset.mode;
  for (const [key, value] of Object.entries(themeTokens(settings)))
    document.documentElement.style.setProperty(`--${key}`, value);
}
function saveTheme(settings: ThemeSettings) {
  const clean = parseSettings(JSON.stringify(settings));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  localStorage.setItem(
    "kova:theme:v2",
    THEMES.find((theme) => theme.id === clean.preset)!.mode,
  );
  applyTheme(clean);
  window.dispatchEvent(new Event(EVENT));
}
export function useTheme() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT);
  const settings = useMemo(() => parseSettings(raw), [raw]);
  const preset =
    THEMES.find((theme) => theme.id === settings.preset) || THEMES[0];
  return {
    settings,
    preset,
    tokens: themeTokens(settings),
    selectPreset: (id: string) => saveTheme({ preset: id, overrides: {} }),
    setColor: (key: keyof ThemeOverrides, value: string) =>
      saveTheme({
        ...settings,
        overrides: { ...settings.overrides, [key]: value },
      }),
    resetColors: () => saveTheme({ ...settings, overrides: {} }),
  };
}
