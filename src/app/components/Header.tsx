import { useState } from "react";
import { Bell, ChevronDown, Search, UserCog } from "lucide-react";
import { NavKey } from "../data";
import { canAccess, ROLES, useApp } from "../context/AppContext";
import { StatusPill } from "./BentoCard";

const NAV: { key: NavKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "assets", label: "Assets" },
  { key: "booking", label: "Resource Booking" },
  { key: "maintenance", label: "Maintenance" },
  { key: "auditing", label: "Auditing" },
  { key: "organization", label: "Organization" },
];

const notifTone = { alert: "red", warning: "amber", success: "green" } as const;

export function Header({
  active,
  onNavigate,
}: {
  active: NavKey;
  onNavigate: (key: NavKey) => void;
}) {
  const { role, setRole, currentUser, notifications, markAllRead } = useApp();
  const [roleOpen, setRoleOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  const visibleNav = NAV.filter((item) => canAccess(role, item.key));
  const unread = notifications.filter((n) => !n.read).length;
  const initials = currentUser.name.split(" ").map((n) => n[0]).join("");

  return (
    <header className="sticky top-0 z-40 mb-6">
      <div className="rounded-[var(--radius)] border border-border bg-card/60 backdrop-blur-xl px-4 sm:px-5 py-3 flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span
            className="grid place-items-center size-9 rounded-xl text-[#06231a]"
            style={{
              background: "linear-gradient(135deg, #34d399, #2dd4bf)",
              boxShadow: "0 8px 20px -8px rgba(52,211,153,0.7)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 3 3 20h4l5-10 5 10h4L12 3Z" fill="currentColor" />
            </svg>
          </span>
          <span className="font-[var(--font-display)] tracking-tight text-[17px]">
            Asset<span className="text-emerald-300">Flow</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="hidden lg:flex items-center gap-1 ml-2 overflow-x-auto">
          {visibleNav.map((item) => {
            const isActive = item.key === active;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`relative px-3.5 py-2 rounded-xl text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute left-3 right-3 -bottom-[6px] h-[2px] rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Search */}
        <div className="hidden md:flex items-center gap-2 rounded-xl border border-border bg-white/[0.03] px-3 py-2 w-56">
          <Search className="size-4 text-muted-foreground" />
          <input
            placeholder="Search assets…"
            className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground/70"
          />
        </div>

        {/* Role Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setRoleOpen((o) => !o);
              setBellOpen(false);
            }}
            className="flex items-center gap-2 rounded-xl border border-border bg-white/[0.03] px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <UserCog className="size-4 text-emerald-300" />
            <span className="hidden sm:inline">{role}</span>
            <ChevronDown className="size-3.5" />
          </button>
          {roleOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-card/95 backdrop-blur-xl p-1.5 shadow-2xl">
              <div className="px-2.5 py-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                Switch role
              </div>
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRole(r);
                    setRoleOpen(false);
                  }}
                  className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors ${
                    role === r
                      ? "bg-emerald-400/10 text-emerald-200"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                  }`}
                >
                  {r}
                  {role === r && <span className="size-2 rounded-full bg-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setBellOpen((o) => !o);
              setRoleOpen(false);
            }}
            className="relative grid place-items-center size-10 rounded-xl border border-border bg-white/[0.03] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bell className="size-5" />
            {unread > 0 && (
              <span className="absolute top-2 right-2 size-2 rounded-full bg-rose-400 ring-2 ring-card" />
            )}
          </button>
          {bellOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card/95 backdrop-blur-xl p-2 shadow-2xl">
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-sm">Notifications</span>
                <button
                  onClick={markAllRead}
                  className="text-xs text-emerald-300 hover:text-emerald-200"
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto space-y-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-lg px-2.5 py-2 ${
                      n.read ? "opacity-60" : "bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm">{n.title}</span>
                      <StatusPill tone={notifTone[n.type]}>{n.type}</StatusPill>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {n.message}
                    </div>
                    <div className="text-[11px] text-muted-foreground/70 mt-0.5">
                      {n.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="hidden sm:block text-right leading-tight">
            <div className="text-sm">{currentUser.name}</div>
            <div className="text-xs text-muted-foreground">{currentUser.role}</div>
          </div>
          <span className="grid place-items-center size-10 rounded-full ring-2 ring-emerald-400/40 bg-white/10 font-[var(--font-display)] text-sm">
            {initials}
          </span>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="lg:hidden flex items-center gap-1 mt-3 overflow-x-auto pb-1">
        {visibleNav.map((item) => {
          const isActive = item.key === active;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition-colors ${
                isActive
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                  : "border-border text-muted-foreground"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
