// Presentation data for the AssetFlow ERP dashboard (dark bento theme).
// Business/entity data now lives in context/AppContext.tsx.

export const CHART = {
  green: "#34d399",
  purple: "#a855f7",
  teal: "#2dd4bf",
  amber: "#fbbf24",
  blue: "#38bdf8",
  red: "#f87171",
};

export type NavKey =
  | "dashboard"
  | "assets"
  | "booking"
  | "maintenance"
  | "auditing"
  | "reports"
  | "organization";

// Total Assets Value Trend (Area chart, $M).
export const assetValueTrend = [
  { m: "Jan", v: 3.62, prev: 3.4 },
  { m: "Feb", v: 3.78, prev: 3.55 },
  { m: "Mar", v: 3.71, prev: 3.6 },
  { m: "Apr", v: 3.95, prev: 3.72 },
  { m: "May", v: 3.88, prev: 3.8 },
  { m: "Jun", v: 4.02, prev: 3.85 },
  { m: "Jul", v: 3.96, prev: 3.9 },
  { m: "Aug", v: 4.12, prev: 3.95 },
  { m: "Sep", v: 4.05, prev: 4.0 },
  { m: "Oct", v: 4.18, prev: 4.05 },
  { m: "Nov", v: 4.22, prev: 4.1 },
  { m: "Dec", v: 4.29, prev: 4.15 },
];

// Booking Activity (Bar chart: bookings created vs closed).
export const bookingActivity = [
  { m: "Jan", created: 22, closed: 18 },
  { m: "Feb", created: 28, closed: 24 },
  { m: "Mar", created: 19, closed: 21 },
  { m: "Apr", created: 25, closed: 20 },
  { m: "May", created: 31, closed: 27 },
  { m: "Jun", created: 24, closed: 22 },
  { m: "Jul", created: 29, closed: 25 },
  { m: "Aug", created: 33, closed: 30 },
  { m: "Sep", created: 27, closed: 26 },
  { m: "Oct", created: 30, closed: 28 },
  { m: "Nov", created: 26, closed: 24 },
  { m: "Dec", created: 32, closed: 29 },
];

// Asset allocation by category (donut).
export const allocation = [
  { name: "Hardware", value: 40, color: CHART.amber },
  { name: "Vehicles", value: 25, color: CHART.green },
  { name: "Facilities", value: 20, color: CHART.blue },
  { name: "Furniture", value: 15, color: CHART.purple },
];
