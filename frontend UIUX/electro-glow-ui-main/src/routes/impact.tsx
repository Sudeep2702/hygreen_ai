import { createFileRoute } from "@tanstack/react-router";
import { ImpactPage } from "@/components/dashboard/ImpactPage";

export const Route = createFileRoute("/impact")({
  component: ImpactPage,
});
