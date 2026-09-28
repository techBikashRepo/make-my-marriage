"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Mode = "signup" | "login" | "forgot" | "reset";

const config = {
  signup: {
    title: "Create your account",
    subtitle: "Start planning together, one step at a time.",
    action: "Create account",
    endpoint: "signup",
  },
  login: {
    title: "Welcome back",
    subtitle: "Sign in to your wedding space.",
    action: "Log in",
    endpoint: "login",
  },
  forgot: {
    title: "Reset your password",
    subtitle:
      "Enter your email and we’ll send a reset link if an account exists.",
    action: "Send reset link",
    endpoint: "forgot-password",
  },
  reset: {
    title: "Choose a new password",
    subtitle: "Use a password of at least 12 characters.",
    action: "Reset password",
    endpoint: "reset-password",
  },
} as const;

type ApiErrorBody = {
  error?: { message?: string; details?: { path?: string; message: string }[] };
};

export function AuthForm({
  mode,
  token,
}: Readonly<{ mode: Mode; token?: string | undefined }>) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const view = config[mode];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (mode === "reset" && !token) {
      setError("This reset link is missing or invalid. Request a new one.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form.entries());
    const body =
      mode === "reset"
        ? { token, newPassword: values.password }
        : mode === "forgot"
          ? { email: values.email }
          : mode === "login"
            ? { email: values.email, password: values.password }
            : {
                name: values.name,
                email: values.email,
                password: values.password,
              };
    setBusy(true);
    try {
      const response = await fetch(`/api/v1/auth/${view.endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "same-origin",
      });
      if (!response.ok) {
        const payload = (await response.json()) as ApiErrorBody;
        setError(
          payload.error?.details?.[0]?.message ??
            payload.error?.message ??
            "Please try again.",
        );
        return;
      }
      if (mode === "forgot" || mode === "reset") {
        setDone(true);
      } else {
        router.replace("/dashboard");
        router.refresh();
      }
    } catch {
      setError("We couldn’t reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div role="status">
        <p className="text-xs font-bold tracking-[0.16em] text-[#a44d68] uppercase">
          Next step
        </p>
        <h2 className="mt-3 font-serif text-3xl text-[#33272c]">
          {mode === "forgot" ? "Check your inbox" : "Password updated"}
        </h2>
        <p className="mt-4 text-sm leading-7 text-[#6f5a62]">
          {mode === "forgot"
            ? "If that email belongs to an account, a reset link is on its way."
            : "Your existing sessions have been signed out. Log in with your new password."}
        </p>
        <Link
          className="mt-8 inline-flex font-semibold text-[#74243d] underline underline-offset-4"
          href="/login"
        >
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="text-xs font-bold tracking-[0.16em] text-[#a44d68] uppercase">
        Make My Marriage
      </p>
      <h2 className="mt-3 font-serif text-3xl text-[#33272c] sm:text-4xl">
        {view.title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#6f5a62]">{view.subtitle}</p>
      <form className="mt-8 space-y-5" onSubmit={submit}>
        {mode === "signup" && (
          <Field
            label="Your name"
            name="name"
            type="text"
            autoComplete="name"
            required
          />
        )}
        {mode !== "reset" && (
          <Field
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        )}
        {(mode === "signup" || mode === "login" || mode === "reset") && (
          <Field
            label={mode === "reset" ? "New password" : "Password"}
            name="password"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            minLength={mode === "login" ? undefined : 12}
            required
          />
        )}
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-[#fff0f1] px-4 py-3 text-sm text-[#8c2036]"
          >
            {error}
          </p>
        )}
        <button
          disabled={busy}
          className="flex min-h-12 w-full items-center justify-center rounded-lg bg-[#74243d] px-6 text-sm font-bold text-white transition-colors hover:bg-[#570c27] disabled:opacity-60"
          type="submit"
        >
          {busy ? "Please wait…" : view.action}
        </button>
      </form>
      <div className="mt-7 space-y-3 text-sm text-[#6f5a62]">
        {mode === "login" && (
          <>
            <p>
              <Link
                className="font-semibold text-[#74243d] underline underline-offset-4"
                href="/forgot-password"
              >
                Forgot your password?
              </Link>
            </p>
            <p>
              New here?{" "}
              <Link
                className="font-semibold text-[#74243d] underline underline-offset-4"
                href="/signup"
              >
                Create an account
              </Link>
            </p>
          </>
        )}
        {mode === "signup" && (
          <p>
            Already have an account?{" "}
            <Link
              className="font-semibold text-[#74243d] underline underline-offset-4"
              href="/login"
            >
              Log in
            </Link>
          </p>
        )}
        {(mode === "forgot" || mode === "reset") && (
          <p>
            <Link
              className="font-semibold text-[#74243d] underline underline-offset-4"
              href="/login"
            >
              Back to log in
            </Link>
          </p>
        )}
      </div>
    </>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
  required,
  minLength,
}: Readonly<{
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  required?: boolean;
  minLength?: number | undefined;
}>) {
  return (
    <label className="block text-sm font-semibold text-[#49363d]">
      {label}
      <input
        className="mt-2 block h-12 w-full rounded-lg border border-[#dfcdd2] bg-[#fffdfd] px-4 text-sm text-[#33272c] outline-none focus:border-[#74243d] focus:ring-2 focus:ring-[#ead4db]"
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
      />
    </label>
  );
}
