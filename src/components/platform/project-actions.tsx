"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Archive, ArchiveRestore, LoaderCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui";
import { canEdit, database, isAdmin, saveRecord, type PlatformRecord, type Role } from "@/lib/platform";
import styles from "./project-actions.module.css";

export type ProjectActionsProps = {
  record: PlatformRecord;
  role: Role;
  onSaved: (record: PlatformRecord) => void;
  onDeleted: (id: string) => void;
};

type DialogState = { action: "rename" | "delete"; record: PlatformRecord };

export function ProjectActions({ record, role, onSaved, onDeleted }: ProjectActionsProps) {
  const menuId = useId();
  const fieldId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const locked = useRef(false);
  const firstItem = useRef(0);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [title, setTitle] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const editable = record.kind === "project" && canEdit(role);
  const deletable = editable && isAdmin(role);
  const menuOpen = position !== null;

  useEffect(() => {
    if (!dialog) return;
    const frame = requestAnimationFrame(() => {
      input.current?.focus();
      if (dialog.action === "rename") input.current?.select();
    });
    return () => cancelAnimationFrame(frame);
  }, [dialog]);

  function closeMenu(restoreFocus = true) {
    setPosition(null);
    if (restoreFocus) trigger.current?.focus();
  }

  function openMenu(last = false) {
    if (!editable || locked.current) return;
    const bounds = trigger.current?.getBoundingClientRect();
    if (!bounds) return;
    firstItem.current = last ? -1 : 0;
    setError("");
    const height = deletable ? 148 : 104;
    setPosition({
      left: Math.max(8, Math.min(bounds.right - 208, window.innerWidth - 216)),
      top: bounds.bottom + height + 8 > window.innerHeight
        ? Math.max(8, bounds.top - height - 4)
        : bounds.bottom + 4,
    });
  }

  useEffect(() => {
    if (!menuOpen) return;
    const items = menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
    items?.[firstItem.current < 0 ? items.length - 1 : 0]?.focus({ preventScroll: true });
    function outside(event: PointerEvent) {
      if (!menu.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) {
        setPosition(null);
      }
    }
    function reposition() {
      const bounds = trigger.current?.getBoundingClientRect();
      if (!bounds) return;
      const height = deletable ? 148 : 104;
      setPosition({
        left: Math.max(8, Math.min(bounds.right - 208, window.innerWidth - 216)),
        top: bounds.bottom + height + 8 > window.innerHeight
          ? Math.max(8, bounds.top - height - 4)
          : bounds.bottom + 4,
      });
    }
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [menuOpen, deletable]);

  function openDialog(action: DialogState["action"]) {
    if (!editable || (action === "delete" && !deletable)) return;
    closeMenu();
    setError("");
    setTitle(record.data.title);
    setConfirmation("");
    // Retain the revision shown to the user; a concurrent edit must conflict.
    setDialog({ action, record });
  }

  function closeDialog() {
    if (locked.current) return;
    setDialog(null);
    setError("");
    requestAnimationFrame(() => trigger.current?.focus());
  }

  async function mutate(action: "rename" | "archive" | "delete") {
    if (locked.current || !editable || (action === "delete" && !deletable)) return;
    const current = action === "archive" ? record : dialog?.record;
    if (!current || current.id !== record.id || current.space_id !== record.space_id) return;
    const nextTitle = title.trim();
    if (action === "rename" && (!nextTitle || nextTitle.length > 160)) {
      setError("Enter a project name between 1 and 160 characters.");
      return;
    }
    if (action === "delete" && confirmation !== current.data.title) {
      setError("Type the project name exactly to confirm deletion.");
      return;
    }
    locked.current = true;
    setBusy(true);
    setError("");
    closeMenu();
    try {
      if (action === "delete") {
        const { data, error: deleteError } = await database()
          .from("kova_records")
          .delete()
          .eq("id", current.id)
          .eq("space_id", current.space_id)
          .eq("revision", current.revision)
          .select("id, space_id, revision");
        if (deleteError || !Array.isArray(data) || data.length !== 1 ||
            data[0].id !== current.id || data[0].space_id !== current.space_id ||
            data[0].revision !== current.revision) {
          throw Error("Could not confirm deletion. The project may have changed or your access expired. Refresh before retrying.");
        }
        setDialog(null);
        onDeleted(current.id);
      } else {
        const saved = await saveRecord(current.space_id, "project", {
          ...current.data,
          ...(action === "rename" ? { title: nextTitle } : { archived: !current.data.archived }),
        }, current);
        setDialog(null);
        onSaved(saved);
      }
      requestAnimationFrame(() => trigger.current?.focus());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The request failed. Please try again.");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  return (
    <div className={styles.root} aria-busy={busy} onClick={event => event.stopPropagation()}>
      <button ref={trigger} type="button" className={styles.trigger}
        aria-label={`Project actions for ${record.data.title}`} title="Project actions"
        aria-haspopup="menu" aria-expanded={Boolean(position)} aria-controls={position ? menuId : undefined}
        disabled={!editable || busy} onClick={() => position ? closeMenu() : openMenu()}
        onKeyDown={event => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openMenu(event.key === "ArrowUp");
          }
        }}>
        {busy ? <LoaderCircle className={styles.spin} aria-hidden="true" /> : <MoreHorizontal aria-hidden="true" />}
      </button>
      {error && !dialog && <p className={styles.inlineError} role="alert">{error}</p>}
      {position && createPortal(
        <div ref={menu} id={menuId} role="menu" aria-label="Project actions" className={styles.menu}
          style={position} onClick={event => event.stopPropagation()}
          onKeyDown={event => {
            const items = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') || []);
            const index = items.indexOf(document.activeElement as HTMLButtonElement);
            if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeMenu(); }
            else if (event.key === "Tab") closeMenu();
            else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
              event.preventDefault();
              const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
                : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
              items[next]?.focus({ preventScroll: true });
            }
          }}>
          <button type="button" role="menuitem" tabIndex={-1} onClick={() => openDialog("rename")}><Pencil aria-hidden="true" />Rename</button>
          <button type="button" role="menuitem" tabIndex={-1} onClick={() => void mutate("archive")}>
            {record.data.archived ? <ArchiveRestore aria-hidden="true" /> : <Archive aria-hidden="true" />}
            {record.data.archived ? "Restore" : "Archive"}
          </button>
          {deletable && <button type="button" role="menuitem" tabIndex={-1} className={styles.danger} onClick={() => openDialog("delete")}><Trash2 aria-hidden="true" />Delete</button>}
        </div>, document.body)}
      {dialog && <Modal title={dialog.action === "rename" ? "Rename project" : "Delete project"} close={closeDialog}>
        <form className={styles.form} aria-busy={busy} noValidate onSubmit={event => { event.preventDefault(); void mutate(dialog.action); }}>
          {dialog.action === "delete" && <p className={styles.warning}>This permanently deletes <strong>{dialog.record.data.title}</strong>. Type the project name exactly to confirm.</p>}
          <label htmlFor={fieldId}>{dialog.action === "rename" ? "Project name" : "Confirm project name"}</label>
          <input ref={input} id={fieldId} autoFocus required disabled={busy} autoComplete="off"
            value={dialog.action === "rename" ? title : confirmation}
            aria-invalid={Boolean(error)} aria-describedby={error ? `${fieldId}-error` : undefined}
            onChange={event => { setError(""); if (dialog.action === "rename") setTitle(event.target.value); else setConfirmation(event.target.value); }} />
          {dialog.action === "rename" && <p className={styles.hint}>{title.trim().length}/160 characters</p>}
          {error && <p id={`${fieldId}-error`} className={styles.error} role="alert">{error}</p>}
          <div className={styles.buttons}>
            <button type="button" className={styles.cancel} disabled={busy} onClick={closeDialog}>Cancel</button>
            <button type="submit" className={dialog.action === "delete" ? styles.deleteButton : styles.saveButton}
              disabled={busy || !editable || (dialog.action === "delete" && (!deletable || confirmation !== dialog.record.data.title))}>
              {busy && <LoaderCircle className={styles.spin} aria-hidden="true" />}
              {busy ? dialog.action === "delete" ? "Deleting..." : "Saving..." : dialog.action === "rename" ? "Save name" : "Delete project"}
            </button>
          </div>
        </form>
      </Modal>}
    </div>
  );
}
