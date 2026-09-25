"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Cpu, Search } from "lucide-react";
import { Modal } from "@/components/ui";

type Model = {
  id: string;
  name: string;
  provider: string;
  description?: string;
};
export function ModelSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [models, setModels] = useState<Model[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/models", { signal: abort.signal })
      .then((r) => r.json())
      .then((data) => {
        setModels(data.models || []);
        setFailed(!data.live);
      })
      .catch(() => {
        if (!abort.signal.aborted) setFailed(true);
      });
    return () => abort.abort();
  }, []);
  const found = models.find((m) => m.id === value);
  const filtered = models.filter(
    (m) =>
      m.id !== "auto" &&
      (!family || m.provider === family) &&
      `${m.name} ${m.id}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <button
        type="button"
        className="model-trigger"
        onClick={() => setOpen(true)}
        aria-label="Choose model"
        title="Choose model"
      >
        <Cpu size={15} />
        <span>{value === "auto" ? "Auto" : found?.name || value}</span>
        <ChevronDown size={13} />
      </button>
      {open && (
        <Modal title="Choose a model" close={() => setOpen(false)}>
          <div className="model-library">
            <label className="search-field">
              <Search size={16} />
              <input
                autoFocus
                aria-label="Search models"
                placeholder="Search models or providers"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              aria-label="Model family"
              value={family}
              onChange={(e) => setFamily(e.target.value)}
            >
              <option value="">All families</option>
              {Array.from(new Set(models.map((m) => m.provider)))
                .sort()
                .map((p) => (
                  <option key={p}>{p}</option>
                ))}
            </select>
            {failed && (
              <p role="status">
                Live catalog unavailable. Showing cached choices; availability
                is checked before use.
              </p>
            )}
            <button
              className="model-row"
              onClick={() => {
                onChange("auto");
                setOpen(false);
              }}
            >
              <Cpu size={17} />
              <span>
                <strong>Auto</strong>
                <small>Task-aware selection within the connection budget</small>
              </span>
              {value === "auto" && <Check size={16} />}
            </button>
            <div className="model-results">
              {filtered.map((m) => (
                <button
                  className="model-row"
                  key={m.id}
                  onClick={() => {
                    onChange(m.id);
                    setOpen(false);
                  }}
                >
                  <span>
                    <strong>{m.name}</strong>
                    <small>
                      {m.provider} · {m.description}
                    </small>
                  </span>
                  {value === m.id && <Check size={16} />}
                </button>
              ))}
              {!filtered.length && <p>No matching models.</p>}
            </div>
            <p className="muted">
              Catalog availability does not grant access. Your provider
              connection and workspace budget apply.
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
