import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDataAPI } from "@/services/data";

export default function LogoutButton() {
  const api = useDataAPI();
  const qc = useQueryClient();

  async function onLogout() {
    try {
      // Our DataAPI exposes `logout()`
      await api.logout();
    } finally {
      // belt & suspenders: clear any stray Supabase auth tokens
      try {
        for (const k of Object.keys(localStorage)) {
          if (k.startsWith("sb-") && k.includes("auth-token")) {
            localStorage.removeItem(k);
          }
        }
      } catch {
        /* ignore */
      }
      qc.clear();
      window.location.assign("/"); // full reload
    }
  }

  return (
    <button className="rounded-xl px-3 py-2 border text-xs" onClick={onLogout}>
      Logout
    </button>
  );
}
