import { createFileRoute } from "@tanstack/react-router";
import { TransportPage } from "@/components/dashboard/TransportPage";

export const Route = createFileRoute("/transport")({
  component: TransportPage,
});
