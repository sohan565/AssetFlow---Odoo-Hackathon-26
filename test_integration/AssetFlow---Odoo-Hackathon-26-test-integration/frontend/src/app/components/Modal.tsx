import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

// Reusable modal styled to match the dark bento aesthetic.
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div
        className="absolute inset-0 bg-[#05070b]/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg rounded-[var(--radius)] border border-border bg-card/90 backdrop-blur-xl p-6 overflow-hidden"
        style={{
          boxShadow:
            "0 0 0 1px rgba(52,211,153,0.12), 0 40px 90px -30px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-60"
          style={{
            background:
              "radial-gradient(40rem 8rem at 20% -40%, rgba(168,85,247,0.18), transparent 70%)",
          }}
        />
        <div className="relative flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="tracking-tight">{title}</h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="grid place-items-center size-9 rounded-xl border border-border bg-white/[0.03] text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="relative">{children}</div>
        {footer && <div className="relative mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

// Shared form primitives so modal forms match the theme.
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-border bg-white/[0.03] px-3 py-2.5 text-sm outline-none focus:border-emerald-400/40 transition-colors";

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-[#06231a] font-[var(--font-display)] font-semibold disabled:opacity-50"
      style={{
        background: "linear-gradient(135deg, #34d399, #2dd4bf)",
        boxShadow: "0 12px 30px -12px rgba(52,211,153,0.7)",
      }}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
    </button>
  );
}
