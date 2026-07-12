import { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";

type BentoCardProps = {
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
  glow?: boolean;
  className?: string;
  children: ReactNode;
};

export function BentoCard({
  title,
  icon,
  action,
  glow = false,
  className = "",
  children,
}: BentoCardProps) {
  return (
    <div
      className={`group relative rounded-[var(--radius)] border border-border bg-card/70 backdrop-blur-xl p-5 sm:p-6 overflow-hidden transition-all duration-300 hover:border-white/15 ${className}`}
      style={{
        boxShadow: glow
          ? "0 0 0 1px rgba(52,211,153,0.15), 0 24px 60px -24px rgba(52,211,153,0.35), inset 0 1px 0 rgba(255,255,255,0.04)"
          : "0 20px 50px -30px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      {glow && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-70"
          style={{
            background:
              "linear-gradient(120deg, rgba(52,211,153,0.10), rgba(168,85,247,0.10) 60%, transparent)",
          }}
        />
      )}
      <div className="relative">
        {(title || action) && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              {icon && (
                <span className="grid place-items-center size-8 rounded-xl bg-white/5 text-foreground/80">
                  {icon}
                </span>
              )}
              {title && <h3 className="tracking-tight">{title}</h3>}
            </div>
            {action ?? (
              <button className="text-muted-foreground/60 hover:text-foreground transition-colors">
                <MoreHorizontal className="size-5" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function StatusPill({
  tone,
  children,
}: {
  tone: "green" | "purple" | "amber" | "blue" | "red" | "muted";
  children: ReactNode;
}) {
  const map: Record<string, string> = {
    green: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
    purple: "bg-purple-400/10 text-purple-300 border-purple-400/20",
    amber: "bg-amber-400/10 text-amber-300 border-amber-400/20",
    blue: "bg-sky-400/10 text-sky-300 border-sky-400/20",
    red: "bg-rose-400/10 text-rose-300 border-rose-400/20",
    muted: "bg-white/5 text-muted-foreground border-white/10",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${map[tone]}`}
    >
      {children}
    </span>
  );
}
