"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, X } from "lucide-react";

export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: React.ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="modal-inner">
        <header>
          <h2>{title}</h2>
          <button
            className="icon-button ghost"
            onClick={close}
            aria-label="Close dialog"
          >
            <X />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}

export function SurfaceHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="surface-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="surface-header-actions">{children}</div>
    </header>
  );
}

export function NextStep({
  title,
  detail,
  action,
  onClick,
  disabled = false,
}: {
  title: string;
  detail: string;
  action: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <footer className="next-step">
      <div>
        <span className="eyebrow">Up next</span>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
      <button className="button primary" onClick={onClick} disabled={disabled}>
        {action}
        <ArrowRight />
      </button>
    </footer>
  );
}
