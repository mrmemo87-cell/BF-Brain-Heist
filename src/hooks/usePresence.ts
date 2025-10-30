import { useEffect } from "react";
import { supa } from "@/SupabaseClient";

export function usePresence() {
  useEffect(() => {
    let timer: any;

    async function ping() {
      if (document.visibilityState !== "visible") return;
      try { await supa.rpc("touch_presence"); } catch {}
    }

    // first touch + interval
    ping();
    timer = setInterval(ping, 25_000);

    // refresh on tab focus
    const onVis = () => setTimeout(ping, 0);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
}
