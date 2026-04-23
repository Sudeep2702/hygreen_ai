import { useQuery } from "@tanstack/react-query";
import { runMLTask } from "@/lib/mlWorkerClient";
import {
  generateDemandDataset,
  generateProductionDataset,
  generateTransportDataset,
} from "@/lib/syntheticData";

const demandDataset = generateDemandDataset();
const productionDataset = generateProductionDataset();
const transportDataset = generateTransportDataset();

export function useDemandForecast() {
  return useQuery({
    queryKey: ["ml", "demand-forecast"],
    queryFn: () => runMLTask("demandForecast", { rows: demandDataset }),
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}

export function useProductionRisk() {
  return useQuery({
    queryKey: ["ml", "production-risk"],
    queryFn: () => runMLTask("productionScore", { rows: productionDataset }),
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}

export function useTransportOptimization() {
  return useQuery({
    queryKey: ["ml", "transport-opt"],
    queryFn: () => runMLTask("transportOptimize", { rows: transportDataset }),
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}

export function useSyntheticDatasets() {
  return {
    demandDataset,
    productionDataset,
    transportDataset,
  };
}
