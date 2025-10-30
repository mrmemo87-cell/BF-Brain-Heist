import React from "react";
import LeaderboardPanel from "@/components/LeaderboardPanel";
import { usePresence } from "@/hooks/usePresence";

export default function LeaderboardPage() {
  usePresence();
  return <LeaderboardPanel />;
}
