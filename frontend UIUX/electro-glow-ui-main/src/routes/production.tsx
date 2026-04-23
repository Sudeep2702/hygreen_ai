import { createFileRoute } from "@tanstack/react-router";
import { ProductionPage } from "@/components/dashboard/ProductionPage";

export const Route = createFileRoute("/production")({
  component: ProductionPage,
});
