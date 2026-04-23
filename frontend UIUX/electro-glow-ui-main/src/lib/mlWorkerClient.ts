import type {
  DemandDataRow,
  DemandForecastPoint,
  ModelOutput,
  ProductionDataRow,
  ProductionRiskPoint,
  TransportDataRow,
  TransportRecommendation,
} from "@/types/operations";

type WorkerTaskMap = {
  demandForecast: {
    payload: { rows: DemandDataRow[] };
    response: ModelOutput<DemandForecastPoint[]>;
  };
  productionScore: {
    payload: { rows: ProductionDataRow[] };
    response: ModelOutput<ProductionRiskPoint[]>;
  };
  transportOptimize: {
    payload: { rows: TransportDataRow[] };
    response: ModelOutput<TransportRecommendation[]>;
  };
};

type WorkerRequest<T extends keyof WorkerTaskMap> = {
  id: string;
  task: T;
  payload: WorkerTaskMap[T]["payload"];
};

type WorkerResponse<T extends keyof WorkerTaskMap> = {
  id: string;
  task: T;
  data?: WorkerTaskMap[T]["response"];
  error?: string;
};

let worker: Worker | null = null;
const pending = new Map<string, { resolve: (value: unknown) => void; reject: (reason?: unknown) => void }>();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL("../workers/mlWorker.ts", import.meta.url), { type: "module" });

    worker.onmessage = (event: MessageEvent<WorkerResponse<keyof WorkerTaskMap>>) => {
      const { id, data, error } = event.data;
      const pendingCall = pending.get(id);
      if (!pendingCall) {
        return;
      }

      pending.delete(id);
      if (error) {
        pendingCall.reject(new Error(error));
        return;
      }
      pendingCall.resolve(data);
    };

    worker.onerror = (event) => {
      pending.forEach(({ reject }) => reject(new Error(event.message)));
      pending.clear();
    };
  }

  return worker;
}

export function runMLTask<T extends keyof WorkerTaskMap>(
  task: T,
  payload: WorkerTaskMap[T]["payload"],
): Promise<WorkerTaskMap[T]["response"]> {
  return new Promise((resolve, reject) => {
    const id = `${task}-${crypto.randomUUID()}`;
    pending.set(id, { resolve, reject });

    const request: WorkerRequest<T> = { id, task, payload };
    getWorker().postMessage(request);
  });
}
