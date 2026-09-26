"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("Logout failed");
      router.replace("/");
      router.refresh();
    } catch {
      setError("Could not log out. Please try again.");
      setBusy(false);
    }
  }
  return (
    <div>
      <button
        className="rounded-lg border border-[#74243d] px-5 py-3 text-sm font-semibold text-[#74243d]"
        type="button"
        onClick={logout}
        disabled={busy}
      >
        {busy ? "Logging out…" : "Log out"}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
