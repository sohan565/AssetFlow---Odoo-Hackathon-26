import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Dashboard } from "./components/Dashboard";
import { AssetDirectory } from "./components/AssetDirectory";
import { ResourceBooking } from "./components/ResourceBooking";
import { MaintenanceHub } from "./components/MaintenanceHub";
import { AuditingWorkspace } from "./components/AuditingWorkspace";
import { OrganizationSetup } from "./components/OrganizationSetup";
import { ReportsAnalytics } from "./components/ReportsAnalytics";
import { LoginScreen } from "./components/LoginScreen";
import { NavKey } from "./data";
import { AppProvider, canAccess, useApp } from "./context/AppContext";

function Workspace() {
  const { role, activeSession } = useApp();
  const [nav, setNav] = useState<NavKey>("dashboard");

  // If the active role loses access to the current page, fall back to dashboard.
  useEffect(() => {
    if (!canAccess(role, nav)) setNav("dashboard");
  }, [role, nav]);

  if (!activeSession) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen w-full text-foreground">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Header active={nav} onNavigate={setNav} />
        <main>
          {nav === "dashboard" && <Dashboard onNavigate={setNav} />}
          {nav === "assets" && <AssetDirectory />}
          {nav === "booking" && <ResourceBooking />}
          {nav === "maintenance" && <MaintenanceHub />}
          {nav === "auditing" && canAccess(role, "auditing") && <AuditingWorkspace />}
          {nav === "reports" && canAccess(role, "reports") && <ReportsAnalytics />}
          {nav === "organization" && canAccess(role, "organization") && <OrganizationSetup />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Workspace />
    </AppProvider>
  );
}
