import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Field, GhostButton, inputClass, PrimaryButton } from "./Modal";
import { KeyRound, Mail, User } from "lucide-react";

export function LoginScreen() {
  const { login, signup } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (isLogin) {
      if (!form.email || !form.password) {
        setError("Please enter your email and password.");
        return;
      }
      const ok = await login(form.email, form.password);
      if (!ok) {
        setError("Invalid email credentials or inactive account.");
      }
    } else {
      if (!form.firstName || !form.lastName || !form.email || !form.password) {
        setError("All fields are required.");
        return;
      }
      const ok = await signup(form.firstName, form.lastName, form.email, form.password);
      if (ok) {
        setSuccess("Account created successfully! You can now log in.");
        setIsLogin(true);
        setForm({ ...form, password: "" });
      } else {
        setError("Failed to create account. Email might already be taken.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#05070b] overflow-y-auto py-12 px-4">
      {/* Background gradients */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(60rem 30rem at 40% 10%, rgba(52,211,153,0.12), transparent 70%), radial-gradient(40rem 20rem at 70% 80%, rgba(168,85,247,0.1), transparent 70%)",
        }}
      />

      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-card/45 backdrop-blur-xl p-8 shadow-2xl"
        style={{
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.02), 0 30px 70px -20px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        {/* Title */}
        <div className="text-center mb-8">
          <span
            className="inline-grid place-items-center size-12 rounded-2xl text-[#06231a] mx-auto mb-3"
            style={{
              background: "linear-gradient(135deg, #34d399, #2dd4bf)",
              boxShadow: "0 8px 24px -6px rgba(52,211,153,0.8)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 3 3 20h4l5-10 5 10h4L12 3Z" fill="currentColor" />
            </svg>
          </span>
          <h2 className="font-[var(--font-display)] text-2xl font-extrabold tracking-tight">
            Asset<span className="text-emerald-300">Flow</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1.5">
            Enterprise Asset & Resource Management System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-lg font-bold tracking-tight text-center">
            {isLogin ? "Sign In to Console" : "Register Employee Account"}
          </h3>

          {error && (
            <div className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-3 text-xs text-rose-300 text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-xs text-emerald-300 text-center">
              {success}
            </div>
          )}

          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name">
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 size-4 text-muted-foreground" />
                  <input
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="John"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </Field>
              <Field label="Last Name">
                <input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Doe"
                  className={inputClass}
                />
              </Field>
            </div>
          )}

          <Field label="Work Email">
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 size-4 text-muted-foreground" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@company.com"
                className={`${inputClass} pl-10`}
              />
            </div>
          </Field>

          <Field label="Password">
            <div className="relative flex items-center">
              <KeyRound className="absolute left-3.5 size-4 text-muted-foreground" />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className={`${inputClass} pl-10`}
              />
            </div>
          </Field>

          <div className="pt-2">
            <PrimaryButton type="submit" className="w-full justify-center py-3">
              {isLogin ? "Sign In" : "Register"}
            </PrimaryButton>
          </div>

          <div className="text-center pt-3 text-xs text-muted-foreground">
            {isLogin ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setError("");
                    setSuccess("");
                  }}
                  className="text-emerald-300 hover:underline font-semibold"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setError("");
                    setSuccess("");
                  }}
                  className="text-emerald-300 hover:underline font-semibold"
                >
                  Log in
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
