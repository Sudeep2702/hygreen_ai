import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/dashboard/Dashboard";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Green Hydrogen Smart System — AI Energy Dashboard" },
      { name: "description", content: "Real-time AI-optimized dashboard for green hydrogen production, storage, transport and carbon savings." },
    ],
  }),
});
