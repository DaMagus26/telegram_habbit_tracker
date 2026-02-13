import type { ReactNode } from "react";

interface BannerProps {
  children: ReactNode;
  tone?: "warning" | "error" | "info";
  actionLabel?: string;
  onAction?: () => void;
}

export function Banner({ children, tone = "info", actionLabel, onAction }: BannerProps): JSX.Element {
  return (
    <div className={`banner banner--${tone}`} role="status" aria-live="polite">
      <span>{children}</span>
      {actionLabel && onAction ? (
        <button type="button" className="banner__action" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
