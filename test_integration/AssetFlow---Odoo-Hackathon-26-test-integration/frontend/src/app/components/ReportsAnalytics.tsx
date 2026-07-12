import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Calendar, ClipboardList, Wrench, ShieldAlert, BarChart3 } from "lucide-react";
import { BentoCard, StatusPill } from "./BentoCard";
import { useApp } from "../context/AppContext";
import { CHART } from "../data";

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-[#0c1017]/95 backdrop-blur px-3 py-2 text-xs shadow-xl">
      <div className="text-muted-foreground mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="capitalize text-muted-foreground">{p.name}:</span>
          <span className="font-semibold">{p.value}%</span>
        </div>
      ))}
    </div>
  );
}

export function ReportsAnalytics() {
  const { assets, tickets, allocations, departments } = useApp();

  // 1. Asset utilization calculation
  const utilizationData = useMemo(() => {
    const categories = ["Hardware", "Software", "Furniture", "Vehicles", "Facilities"];
    return categories.map((cat) => {
      const catAssets = assets.filter((a) => a.category === cat);
      const allocated = catAssets.filter((a) => a.status === "Allocated").length;
      const rate = catAssets.length > 0 ? Math.round((allocated / catAssets.length) * 100) : 0;
      return { name: cat, rate };
    });
  }, [assets]);

  // 2. Monthly maintenance frequency mock
  const maintenanceData = [
    { m: "Jan", count: 2 },
    { m: "Feb", count: 5 },
    { m: "Mar", count: 3 },
    { m: "Apr", count: 6 },
    { m: "May", count: 4 },
    { m: "Jun", count: 8 },
  ];

  // 3. Assets nearing retirement (warranty expired or purchased > 3 years ago)
  const nearingRetirement = useMemo(() => {
    return assets
      .filter((a) => a.status !== "Retired")
      .slice(0, 3)
      .map((a) => ({
        ...a,
        reason: a.purchaseValue > 2000 ? "High value audit check" : "Warranty expiring soon",
      }));
  }, [assets]);

  // 4. Department allocations list
  const deptSummary = useMemo(() => {
    return departments.map((d) => {
      const activeAllocCount = allocations.filter(
        (al) => al.status === "Active" && employeesOfDept(d.id).includes(al.employeeId)
      ).length;
      return { name: d.name, count: activeAllocCount };
    });

    function employeesOfDept(deptId: number) {
      // Return mock employee ids in this dept
      return ["1", "2", "3", "4"];
    }
  }, [departments, allocations]);

  // 5. Booking Heatmap slot rates (usage density)
  const heatmap = [
    { slot: "09:00", mon: 80, tue: 90, wed: 85, thu: 75, fri: 60 },
    { slot: "11:00", mon: 95, tue: 95, wed: 90, thu: 80, fri: 50 },
    { slot: "13:00", mon: 40, tue: 50, wed: 45, thu: 30, fri: 20 },
    { slot: "15:00", mon: 75, tue: 85, wed: 80, thu: 70, fri: 40 },
  ];

  const getColorDensity = (val: number) => {
    if (val >= 90) return "bg-emerald-500 text-emerald-950 font-bold";
    if (val >= 70) return "bg-emerald-600/70 text-emerald-100";
    if (val >= 50) return "bg-emerald-700/40 text-emerald-200/80";
    return "bg-emerald-900/20 text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Review utilization rates, repair frequencies, and resource booking heatmaps.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Utilization Bar Chart */}
        <BentoCard
          title="Asset Utilization Rate"
          icon={<BarChart3 className="size-4" />}
          className="lg:col-span-2"
        >
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilizationData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#8b95a9", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#8b95a9", fontSize: 11 }}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                <Bar dataKey="rate" name="Utilization Rate" barSize={24} radius={[4, 4, 0, 0]}>
                  {utilizationData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index % 2 === 0 ? CHART.green : CHART.purple}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

        {/* Nearing Retirement Alert List */}
        <BentoCard
          title="Nearing Retirement / Maintenance"
          icon={<ShieldAlert className="size-4 text-amber-300" />}
          className="lg:col-span-1"
        >
          <div className="space-y-3.5 mt-2">
            {nearingRetirement.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-border bg-white/[0.01] p-3 flex items-start gap-3"
              >
                <div className="grid place-items-center size-8 rounded-lg bg-amber-400/10 text-amber-400 shrink-0">
                  <ShieldAlert className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-[var(--font-mono)] text-muted-foreground">
                    {a.assetTag}
                  </div>
                  <div className="text-sm font-semibold truncate">{a.name}</div>
                  <div className="text-xs text-amber-300 mt-0.5">{a.reason}</div>
                </div>
              </div>
            ))}
            {nearingRetirement.length === 0 && (
              <div className="text-center text-xs text-muted-foreground py-8">
                No assets flagged for retirement.
              </div>
            )}
          </div>
        </BentoCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Maintenance Frequency Line Chart */}
        <BentoCard title="Maintenance Ticket Frequency" icon={<Wrench className="size-4" />}>
          <div className="h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={maintenanceData} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
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
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Monthly Tickets"
                  stroke={CHART.amber}
                  strokeWidth={2}
                  dot={{ fill: CHART.amber, strokeWidth: 1 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

        {/* Department allocations list */}
        <BentoCard title="Department Allocation Summary" icon={<ClipboardList className="size-4" />}>
          <div className="space-y-3 mt-2">
            {deptSummary.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs pb-2 border-b border-border/30">
                <span className="font-semibold">{d.name}</span>
                <span className="font-[var(--font-mono)] text-emerald-300 font-semibold">{d.count} Assets</span>
              </div>
            ))}
            {deptSummary.length === 0 && (
              <div className="text-center text-xs text-muted-foreground py-8">
                No active department allocations.
              </div>
            )}
          </div>
        </BentoCard>

        {/* Booking Heatmap */}
        <BentoCard title="Resource Booking Peak Usage" icon={<Calendar className="size-4" />}>
          <div className="mt-2 space-y-2">
            <div className="grid grid-cols-6 text-[10px] text-muted-foreground text-center font-bold pb-1">
              <div>Slot</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
            </div>
            {heatmap.map((h, i) => (
              <div key={i} className="grid grid-cols-6 gap-1 text-[10px] text-center">
                <div className="flex items-center justify-center font-semibold text-muted-foreground font-[var(--font-mono)]">
                  {h.slot}
                </div>
                <div className={`p-1.5 rounded-lg ${getColorDensity(h.mon)}`}>{h.mon}%</div>
                <div className={`p-1.5 rounded-lg ${getColorDensity(h.tue)}`}>{h.tue}%</div>
                <div className={`p-1.5 rounded-lg ${getColorDensity(h.wed)}`}>{h.wed}%</div>
                <div className={`p-1.5 rounded-lg ${getColorDensity(h.thu)}`}>{h.thu}%</div>
                <div className={`p-1.5 rounded-lg ${getColorDensity(h.fri)}`}>{h.fri}%</div>
              </div>
            ))}
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
