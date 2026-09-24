type BrandMarkProps = {
  compact?: boolean;
  context?: string;
};

export function BrandMark({ compact = false, context }: BrandMarkProps) {
  return (
    <span
      className="brand-lockup"
      aria-label={context ? `Kova ${context}` : "Kova"}
    >
      <span className="kova-mark" aria-hidden="true">
        <span />
      </span>
      {compact ? null : <strong>Kova</strong>}
      {context ? <span className="brand-context">{context}</span> : null}
    </span>
  );
}
