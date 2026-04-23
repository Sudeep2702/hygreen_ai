import { createFileRoute } from "@tanstack/react-router";
import { DemandPage } from "@/components/dashboard/DemandPage";

export const Route = createFileRoute("/demand")({
  component: DemandPage,
});
