import { createFileRoute } from "@tanstack/react-router";
import { FleetTrackerPage } from "@/components/dashboard/FleetTrackerPage";

export const Route = createFileRoute("/fleet")({
  component: FleetTrackerPage,
});
