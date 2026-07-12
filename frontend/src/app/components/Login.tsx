import { useEffect, useState } from "react";

interface LoginProps {
  onLoginSuccess: (idToken: string) => void;
  onBypass: (mockUserEmail: string) => void;
}

export function Login({ onLoginSuccess, onBypass }: LoginProps) {
  const [clientId, setClientId] = useState(() => {
    return localStorage.getItem("assetflow_google_client_id") || "";
  });
  const [showConfig, setShowConfig] = useState(false);

  // Load Google script dynamically
  useEffect(() => {
    const id = "google-jssdk";
    if (document.getElementById(id)) return;
    const fjs = document.getElementsByTagName("script")[0];
    const js = document.createElement("script");
    js.id = id;
    js.src = "https://accounts.google.com/gsi/client";
    js.async = true;
    js.defer = true;
    fjs.parentNode?.insertBefore(js, fjs);
  }, []);

  // Initialize and render Google button when script loads and client ID is present
  useEffect(() => {
    if (!clientId) return;

    localStorage.setItem("assetflow_google_client_id", clientId);

    const initGoogle = () => {
      if (typeof window === "undefined" || !(window as any).google) {
        setTimeout(initGoogle, 100);
        return;
      }

      try {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            onLoginSuccess(response.credential);
          },
        });

        (window as any).google.accounts.id.renderButton(
          document.getElementById("google-signin-button"),
          {
            theme: "dark",
            size: "large",
            width: 280,
            text: "signin_with",
            shape: "pill",
          }
        );
      } catch (err) {
        console.error("Failed to initialize Google Sign-In:", err);
      }
    };

    initGoogle();
  }, [clientId, onLoginSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md px-4">
      <div 
        className="w-full max-w-md rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-8 shadow-2xl"
        style={{
          boxShadow: "0 20px 40px -15px rgba(16, 185, 129, 0.15)",
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <span
            className="grid place-items-center size-14 rounded-2xl text-[#06231a] mb-4"
            style={{
              background: "linear-gradient(135deg, #34d399, #2dd4bf)",
              boxShadow: "0 8px 24px -6px rgba(52,211,153,0.7)",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 3 3 20h4l5-10 5 10h4L12 3Z" fill="currentColor" />
            </svg>
          </span>
          <h2 className="font-[var(--font-display)] text-2xl tracking-tight">
            Welcome to Asset<span className="text-emerald-300">Flow</span>
          </h2>
          <p className="text-sm text-muted-foreground/80 mt-1.5">
            Enterprise Asset & Resource Management System
          </p>
        </div>

        {/* Client ID Configured Section */}
        {clientId ? (
          <div className="flex flex-col items-center justify-center gap-4 mb-6">
            <div id="google-signin-button" className="min-h-[44px]" />
            <button
              onClick={() => setShowConfig(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Change Google Client ID
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-4 rounded-xl border border-dashed border-border bg-white/[0.02] text-center mb-6">
            <p className="text-xs text-muted-foreground">
              To enable Real Google OAuth, you need to configure your Google Client ID.
            </p>
            <button
              onClick={() => setShowConfig(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-semibold hover:bg-emerald-500/20 transition-all"
            >
              Configure Client ID
            </button>
          </div>
        )}

        {/* Config Modal / Form */}
        {showConfig && (
          <div className="mb-6 p-4 rounded-xl border border-border bg-white/[0.02] flex flex-col gap-3">
            <label className="text-xs font-medium text-muted-foreground">
              Enter Google Client ID:
            </label>
            <input
              type="text"
              placeholder="123456-abc.apps.googleusercontent.com"
              value={clientId}
              onChange={(e) => setClientId(e.target.value.trim())}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none placeholder:text-muted-foreground/50"
            />
            <div className="flex justify-between items-center mt-1">
              <a
                href="https://console.cloud.google.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-emerald-300 hover:underline"
              >
                Go to Google Cloud Console ↗
              </a>
              <button
                onClick={() => setShowConfig(false)}
                className="px-3 py-1 rounded bg-white/5 text-[10px] hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-border"></div>
          <span className="flex-shrink mx-4 text-muted-foreground/60 text-xs">Or Developer Bypass</span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        {/* Developer Bypass Profiles */}
        <div className="mt-4 flex flex-col gap-2">
          <div className="text-[10px] text-center text-muted-foreground uppercase tracking-wider mb-1">
            Choose a demo profile to login instantly:
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onBypass("sohan@company.com")}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-border bg-white/[0.02] hover:bg-emerald-400/5 hover:border-emerald-400/20 transition-all group"
            >
              <span className="text-xs font-medium text-foreground group-hover:text-emerald-300">Sohan</span>
              <span className="text-[9px] text-muted-foreground">IT Admin</span>
            </button>
            <button
              onClick={() => onBypass("gautam@company.com")}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-border bg-white/[0.02] hover:bg-emerald-400/5 hover:border-emerald-400/20 transition-all group"
            >
              <span className="text-xs font-medium text-foreground group-hover:text-emerald-300">Gautam</span>
              <span className="text-[9px] text-muted-foreground">Asset Manager</span>
            </button>
            <button
              onClick={() => onBypass("vansh@company.com")}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-border bg-white/[0.02] hover:bg-emerald-400/5 hover:border-emerald-400/20 transition-all group"
            >
              <span className="text-xs font-medium text-foreground group-hover:text-emerald-300">Vansh</span>
              <span className="text-[9px] text-muted-foreground">Dept Head</span>
            </button>
            <button
              onClick={() => onBypass("eve@company.com")}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-border bg-white/[0.02] hover:bg-emerald-400/5 hover:border-emerald-400/20 transition-all group"
            >
              <span className="text-xs font-medium text-foreground group-hover:text-emerald-300">Eve</span>
              <span className="text-[9px] text-muted-foreground">Employee</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
