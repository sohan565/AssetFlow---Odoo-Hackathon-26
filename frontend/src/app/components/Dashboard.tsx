import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Boxes,
  Calendar,
  CheckCircle2,
  Layers,
  Package,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { BentoCard, StatusPill } from "./BentoCard";
import { allocation, assetValueTrend, bookingActivity, CHART } from "../data";
import { NavKey } from "../data";
import { isManagerial, useApp } from "../context/AppContext";

const activityIcon: Record<string, JSX.Element> = {
  wrench: <Wrench className="size-4" />,
  package: <Package className="size-4" />,
  check: <CheckCircle2 className="size-4" />,
};

const notifTone = { alert: "red", warning: "amber", success: "green" } as const;

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-[#0c1017]/95 backdrop-blur px-3 py-2 text-xs shadow-xl">
      <div className="text-muted-foreground mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span
            className="size-2 rounded-full"
            style={{ background: p.color || p.fill }}
          />
          <span className="capitalize text-muted-foreground">{p.name}:</span>
          <span className="font-[var(--font-mono)]">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function Dashboard({ onNavigate }: { onNavigate?: (n: NavKey) => void }) {
  const {
    role,
    currentUser,
    assets,
    allocations,
    bookings,
    tickets,
    notifications,
    assetName,
    employeeName,
  } = useApp();

  const totalValue = useMemo(
    () => assets.reduce((sum, a) => sum + a.purchaseValue, 0),
    [assets],
  );

  const overdue = allocations.filter((a) => a.status === "Overdue");

  const kpis = [
    {
      key: "inventory",
      label: "Total Inventory",
      value: String(assets.length),
      sub: "Total tracked assets in organization",
      accent: CHART.blue,
      icon: <Boxes className="size-5" />,
    },
    {
      key: "available",
      label: "Available Units",
      value: String(assets.filter((a) => a.status === "Available").length),
      sub: "Assets ready for immediate allocation",
      accent: CHART.green,
      icon: <Layers className="size-5" />,
    },
    {
      key: "bookings",
      label: "Active Bookings",
      value: String(bookings.filter((b) => b.status === "Approved").length),
      sub: "Approved shared resource bookings",
      accent: CHART.purple,
      icon: <Calendar className="size-5" />,
    },
    {
      key: "overdue",
      label: "Action Required",
      value: String(overdue.length),
      sub: "Overdue returns needing attention",
      accent: CHART.red,
      icon: <TriangleAlert className="size-5" />,
    },
  ];

  const activities = useMemo(() => {
    const items: {
      id: string;
      title: string;
      detail: string;
      tone: "green" | "purple" | "blue";
      icon: string;
    }[] = [];
    tickets.slice(0, 2).forEach((t) =>
      items.push({
        id: `act-${t.id}`,
        title: `Maintenance • ${t.status}`,
        detail: `${assetName(t.assetId)} — ${t.issue}`,
        tone: t.status === "Resolved" ? "green" : "blue",
        icon: "wrench",
      }),
    );
    bookings.slice(0, 1).forEach((b) =>
      items.push({
        id: `act-${b.id}`,
        title: `Booking ${b.status}`,
        detail: `${assetName(b.assetId)} for ${employeeName(b.requestedBy)}`,
        tone: "purple",
        icon: "check",
      }),
    );
    return items;
  }, [tickets, bookings, assetName, employeeName]);

  const inventoryStatus = assets.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="tracking-tight">Console Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {currentUser.name}. Viewing system metrics for{" "}
          <span className="text-emerald-300">{role}</span>.
        </p>
      </div>

      {/* Top: total value + booking activity summary */}
      <div className="grid gap-6 lg:grid-cols-3">
        <BentoCard glow className="lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-muted-foreground text-sm">
                Total Assets Value
              </div>
              <div className="mt-1 font-[var(--font-display)] text-[clamp(2rem,5vw,3rem)] font-extrabold tracking-tight">
                ${totalValue.toLocaleString()}
              </div>
              <div className="mt-1 text-sm text-emerald-300">
                +12.4% <span className="text-muted-foreground">vs last month</span>
              </div>
            </div>
            <StatusPill tone="green">Live</StatusPill>
          </div>
          <div className="h-56 -mx-2 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={assetValueTrend}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="dash-gArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.green} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={CHART.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="m"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#8b95a9", fontSize: 11 }}
                />
                <YAxis hide domain={["dataMin - 0.3", "dataMax + 0.2"]} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  key="area-prev"
                  type="monotone"
                  dataKey="prev"
                  name="Prev"
                  stroke={CHART.purple}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="transparent"
                />
                <Area
                  key="area-v"
                  type="monotone"
                  dataKey="v"
                  name="Value ($M)"
                  stroke={CHART.green}
                  strokeWidth={2.5}
                  fill="url(#dash-gArea)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

        <BentoCard title="Alert Center" icon={<AlertTriangle className="size-4" />}>
          <div className="space-y-3">
            {notifications.slice(0, 4).map((n) => (
              <div
                key={n.id}
                className="rounded-xl border border-border bg-white/[0.02] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm">{n.title}</span>
                  <StatusPill tone={notifTone[n.type]}>{n.type}</StatusPill>
                </div>
                <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {n.message}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground/70">
                  {n.timestamp}
                </div>
              </div>
            ))}
          </div>
        </BentoCard>
      </div>

      {/* KPI row */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <BentoCard key={k.key}>
            <div className="flex items-start justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {k.label}
              </div>
              <span
                className="grid place-items-center size-9 rounded-xl"
                style={{
                  color: k.accent,
                  background: `color-mix(in srgb, ${k.accent} 14%, transparent)`,
                }}
              >
                {k.icon}
              </span>
            </div>
            <div className="mt-3 font-[var(--font-display)] text-4xl font-extrabold tracking-tight">
              {k.value}
            </div>
            <div className="mt-1.5 text-xs text-muted-foreground">{k.sub}</div>
          </BentoCard>
        ))}
      </div>

      {/* Booking activity */}
      <BentoCard
        title="Booking Activity"
        icon={<Calendar className="size-4" />}
        action={
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full" style={{ background: CHART.green }} />
              Created
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full" style={{ background: CHART.purple }} />
              Closed
            </span>
          </div>
        }
      >
        <div className="h-64 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bookingActivity} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="m"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#8b95a9", fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#8b95a9", fontSize: 11 }}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar key="ba-created" dataKey="created" name="Created" barSize={12} radius={[6, 6, 0, 0]} fill={CHART.green} />
              <Bar key="ba-closed" dataKey="closed" name="Closed" barSize={12} radius={[6, 6, 0, 0]} fill={CHART.purple} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </BentoCard>

      {/* Allocation + inventory + activities */}
      <div className="grid gap-6 lg:grid-cols-3">
        <BentoCard title="Asset Allocation">
          <div className="flex items-center gap-4">
            <div className="relative size-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    key="alloc-pie"
                    data={allocation}
                    dataKey="value"
                    innerRadius={52}
                    outerRadius={74}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {allocation.map((a) => (
                      <Cell key={a.name} fill={a.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <div className="text-center">
                  <div className="font-[var(--font-display)] text-xl font-extrabold">
                    100%
                  </div>
                  <div className="text-[10px] text-muted-foreground">allocated</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2.5 flex-1">
              {allocation.map((a) => (
                <div key={a.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ background: a.color }} />
                    <span className="text-muted-foreground">{a.name}</span>
                  </span>
                  <span className="font-[var(--font-mono)]">{a.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </BentoCard>

        <BentoCard title="Inventory Status" icon={<Boxes className="size-4" />}>
          <div className="space-y-3">
            {inventoryStatus.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-white/[0.02] px-3 py-2.5"
              >
                <span className="grid place-items-center size-9 rounded-lg bg-white/5 text-muted-foreground">
                  <Package className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.category}</div>
                </div>
                {item.status === "Available" ? (
                  <StatusPill tone="green">Available</StatusPill>
                ) : item.status === "Maintenance" ? (
                  <StatusPill tone="amber">Maintenance</StatusPill>
                ) : (
                  <StatusPill tone="purple">{item.status}</StatusPill>
                )}
              </div>
            ))}
          </div>
        </BentoCard>

        <BentoCard title="Recent Activities" icon={<CheckCircle2 className="size-4" />}>
          <div className="space-y-4">
            {activities.map((a) => (
              <div key={a.id} className="flex gap-3">
                <span
                  className="grid place-items-center size-9 rounded-xl shrink-0"
                  style={{
                    color:
                      a.tone === "green"
                        ? CHART.green
                        : a.tone === "purple"
                        ? CHART.purple
                        : CHART.blue,
                    background: `color-mix(in srgb, ${
                      a.tone === "green"
                        ? CHART.green
                        : a.tone === "purple"
                        ? CHART.purple
                        : CHART.blue
                    } 14%, transparent)`,
                  }}
                >
                  {activityIcon[a.icon]}
                </span>
                <div className="min-w-0">
                  <div className="text-sm">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{a.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>
      </div>

      {/* Overdue returns — Admin & Asset Manager only */}
      {isManagerial(role) && (
        <BentoCard
          title="Critical Overdue Returns"
          icon={<AlertTriangle className="size-4 text-rose-300" />}
          action={<StatusPill tone="red">{overdue.length} Alerts</StatusPill>}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 font-normal">Asset Info</th>
                  <th className="pb-3 font-normal">Holder</th>
                  <th className="pb-3 font-normal">Allocated</th>
                  <th className="pb-3 font-normal">Expected Return</th>
                  <th className="pb-3 font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {overdue.map((o) => (
                  <tr key={o.id}>
                    <td className="py-3">
                      <div>{assetName(o.assetId)}</div>
                      <div className="text-xs text-muted-foreground font-[var(--font-mono)]">
                        {o.assetId}
                      </div>
                    </td>
                    <td className="py-3">{employeeName(o.employeeId)}</td>
                    <td className="py-3 text-muted-foreground font-[var(--font-mono)]">
                      {o.allocatedDate}
                    </td>
                    <td className="py-3 text-rose-300 font-[var(--font-mono)]">
                      {o.expectedReturnDate}
                    </td>
                    <td className="py-3">
                      <StatusPill tone="red">Overdue</StatusPill>
                    </td>
                  </tr>
                ))}
                {overdue.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">
                      No overdue returns. Everything is on track.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {onNavigate && (
            <div className="mt-4">
              <button
                onClick={() => onNavigate("assets")}
                className="text-sm text-emerald-300 hover:text-emerald-200"
              >
                Go to Asset Directory →
              </button>
            </div>
          )}
        </BentoCard>
      )}
    </div>
  );
}
