import { useState } from "react";
import { CalendarPlus, Car, Clock, DoorOpen, Package } from "lucide-react";
import { BentoCard, StatusPill } from "./BentoCard";
import { Field, GhostButton, inputClass, Modal, PrimaryButton } from "./Modal";
import { isManagerial, useApp } from "../context/AppContext";
import { BookingStatus } from "../types";

const catIcon: Record<string, JSX.Element> = {
  Vehicles: <Car className="size-4" />,
  Facilities: <DoorOpen className="size-4" />,
};

const bookingTone: Record<BookingStatus, "green" | "amber" | "red"> = {
  Approved: "green",
  Pending: "amber",
  Rejected: "red",
};

// Shared resources = bookable categories.
const SHARED = ["Vehicles", "Facilities", "Hardware"];

export function ResourceBooking() {
  const {
    role,
    assets,
    bookings,
    currentUser,
    addBooking,
    setBookingStatus,
    assetName,
    employeeName,
  } = useApp();

  const [open, setOpen] = useState(false);
  const bookable = assets.filter(
    (a) => SHARED.includes(a.category) && a.status !== "Retired",
  );
  const [form, setForm] = useState({
    assetId: bookable[0]?.id ?? "",
    startDate: "",
    endDate: "",
  });

  const manager = isManagerial(role);
  // Employees only see their own bookings; managers see everything.
  const visibleBookings = manager
    ? bookings
    : bookings.filter((b) => b.requestedBy === currentUser.id);

  const submit = () => {
    if (!form.assetId || !form.startDate || !form.endDate) return;
    addBooking({
      assetId: form.assetId,
      requestedBy: currentUser.id,
      startDate: form.startDate,
      endDate: form.endDate,
    });
    setForm({ assetId: bookable[0]?.id ?? "", startDate: "", endDate: "" });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="tracking-tight">Resource Booking Planner</h1>
          <p className="text-muted-foreground mt-1">
            Reserve shared corporate resources — vehicles, rooms, and devices.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-purple-100 font-[var(--font-display)] font-semibold border border-purple-400/40 bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
        >
          <CalendarPlus className="size-4" /> Book a Resource
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BentoCard title="Available Units">
          <div className="space-y-3">
            {bookable.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-white/[0.02] px-3 py-3"
              >
                <span className="grid place-items-center size-10 rounded-xl bg-white/5 text-muted-foreground">
                  {catIcon[u.category] ?? <Package className="size-4" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.category}</div>
                </div>
                {u.status === "Available" ? (
                  <StatusPill tone="green">Available</StatusPill>
                ) : u.status === "Maintenance" ? (
                  <StatusPill tone="amber">Maintenance</StatusPill>
                ) : (
                  <StatusPill tone="purple">{u.status}</StatusPill>
                )}
              </div>
            ))}
          </div>
        </BentoCard>

        <BentoCard
          title={manager ? "Corporate Booking Schedule" : "My Bookings"}
          action={<StatusPill tone="blue">{visibleBookings.length} Bookings</StatusPill>}
        >
          <div className="space-y-3">
            {visibleBookings.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-border bg-white/[0.02] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-[var(--font-display)] font-semibold">
                    {assetName(b.assetId)}
                  </div>
                  <StatusPill tone={bookingTone[b.status]}>{b.status}</StatusPill>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5" /> {b.startDate} → {b.endDate}
                  </span>
                  <span>By {employeeName(b.requestedBy)}</span>
                </div>
                {manager && b.status === "Pending" && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => setBookingStatus(b.id, "Approved")}
                      className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-200 hover:bg-emerald-400/15 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setBookingStatus(b.id, "Rejected")}
                      className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-xs text-rose-200 hover:bg-rose-400/15 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
            {visibleBookings.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No bookings yet. Reserve a shared resource to get started.
              </div>
            )}
          </div>
        </BentoCard>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Book a Resource"
        subtitle="Reserve a shared asset. Overlapping windows are auto-rejected."
        footer={
          <>
            <GhostButton onClick={() => setOpen(false)}>Cancel</GhostButton>
            <PrimaryButton onClick={submit}>
              <CalendarPlus className="size-4" /> Submit Request
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Resource">
            <select
              className={inputClass}
              value={form.assetId}
              onChange={(e) => setForm({ ...form, assetId: e.target.value })}
            >
              {bookable.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#10141d]">
                  {u.name} ({u.category})
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start">
              <input
                type="datetime-local"
                className={inputClass}
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </Field>
            <Field label="End">
              <input
                type="datetime-local"
                className={inputClass}
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </Field>
          </div>
          <div className="text-xs text-muted-foreground">
            Requesting as{" "}
            <span className="text-foreground">{currentUser.name}</span> ({role}).
          </div>
        </div>
      </Modal>
    </div>
  );
}
