"use client";
import { useState } from "react";
import { Check, FileText, Save } from "lucide-react";
import { canReviewArtifact, prdApproved, type ArtifactKind, type BuilderState } from "@/lib/build-context";
import type { Role } from "@/lib/platform";
import styles from "./builder.module.css";

export type ArtifactMutation = { action: "save-artifact"; kind: ArtifactKind; content: string } | { action: "approve-artifact"; kind: ArtifactKind; artifactVersion: number };
export function DeliveryReview({ state, kind, role, busy, aiAvailable, onSave, onDraft }: {
  state: BuilderState; kind: ArtifactKind; role: Role; busy: boolean; aiAvailable: boolean;
  onSave: (mutation: ArtifactMutation) => void; onDraft: () => void;
}) {
  const artifact = state.delivery?.[kind];
  const [content, setContent] = useState(artifact?.content || "");
  const editable = canReviewArtifact(role, kind) && (kind === "prd" || prdApproved(state));
  const dirty = content !== (artifact?.content || "");
  const approved = artifact?.approval?.version === artifact?.version && Boolean(artifact?.approval);
  const stale = kind === "trd" && artifact && artifact.basedOnPrdVersion !== state.delivery?.prd?.version;
  return <div className={styles.deliveryPanel}>
    <header className={styles.codeToolbar}><div><FileText size={17} /><strong>{kind.toUpperCase()}</strong><span>{artifact ? `v${artifact.version}` : "Not drafted"}</span></div><span>{approved ? "Approved" : stale ? "Needs revision" : "Awaiting review"}</span></header>
    <div className={styles.deliveryStatus}>{kind === "prd" ? "PM product requirements" : "Developer technical requirements"}
      {kind === "trd" && !prdApproved(state) && <p>Current PRD approval required.</p>}
      {stale && <p>PRD changed. Revise and save this TRD against the approved PRD.</p>}
      {artifact?.approval && <p>v{artifact.approval.version} approved by {artifact.approval.role} on {new Date(artifact.approval.at).toLocaleString()}</p>}
      {dirty && <p>Unsaved changes. Save before requesting approval.</p>}
    </div>
    <textarea aria-label={`${kind.toUpperCase()} document`} className={styles.documentEditor} value={content} maxLength={30000} readOnly={!editable || busy} placeholder={kind === "prd" ? "Product requirements" : "Technical requirements"} onChange={(event) => setContent(event.target.value)} />
    <footer className={styles.documentActions}>
      <button type="button" disabled={!editable || busy || !aiAvailable || dirty} onClick={onDraft}><FileText size={15} />Draft {kind.toUpperCase()} with AI</button>
      <button type="button" disabled={!editable || busy || content.trim().length < 20 || (!dirty && !stale)} onClick={() => onSave({ action: "save-artifact", kind, content })}><Save size={15} />Save {kind.toUpperCase()}</button>
      <button type="button" disabled={!editable || busy || dirty || !artifact || approved || Boolean(stale)} onClick={() => artifact && onSave({ action: "approve-artifact", kind, artifactVersion: artifact.version })}><Check size={15} />Approve {kind.toUpperCase()}</button>
    </footer>
  </div>;
}
