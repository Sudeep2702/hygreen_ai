/// <reference lib="webworker" />

import * as tf from "@tensorflow/tfjs";
import type {
  DemandDataRow,
  DemandForecastPoint,
  ModelOutput,
  ProductionDataRow,
  ProductionRiskPoint,
  TransportDataRow,
  TransportRecommendation,
} from "@/types/operations";

type RequestMessage =
  | { id: string; task: "demandForecast"; payload: { rows: DemandDataRow[] } }
  | { id: string; task: "productionScore"; payload: { rows: ProductionDataRow[] } }
  | { id: string; task: "transportOptimize"; payload: { rows: TransportDataRow[] } };

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

async function forecastDemand(rows: DemandDataRow[]): Promise<ModelOutput<DemandForecastPoint[]>> {
  const sampledRows = rows.slice(-2600);

  const featureMatrix = sampledRows.map((r) => [r.lag1, r.lag7, r.rollingAvg7, r.seasonality * 100, r.promotion]);
  const labels = sampledRows.map((r) => r.demand);

  const featuresTensor = tf.tensor2d(featureMatrix);
  const labelsTensor = tf.tensor2d(labels, [labels.length, 1]);

  const minX = featuresTensor.min(0);
  const maxX = featuresTensor.max(0);
  const normalizedX = featuresTensor.sub(minX).div(maxX.sub(minX).add(1e-6));

  const minY = labelsTensor.min();
  const maxY = labelsTensor.max();
  const normalizedY = labelsTensor.sub(minY).div(maxY.sub(minY).add(1e-6));

  const model = tf.sequential({
    layers: [
      tf.layers.dense({ units: 16, activation: "relu", inputShape: [5] }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({ units: 8, activation: "relu" }),
      tf.layers.dense({ units: 1 }),
    ],
  });

  model.compile({ optimizer: tf.train.adam(0.02), loss: "meanSquaredError" });

  await model.fit(normalizedX, normalizedY, {
    epochs: 35,
    batchSize: 64,
    verbose: 0,
    validationSplit: 0.2,
    callbacks: tf.callbacks.earlyStopping({ monitor: "val_loss", patience: 4 }),
  });

  const predictedNorm = model.predict(normalizedX) as tf.Tensor;
  const predicted = predictedNorm.mul(maxY.sub(minY)).add(minY);
  const error = labelsTensor.sub(predicted).abs().mean().dataSync()[0];

  const tail = rows.slice(-7);
  let lag1 = tail[tail.length - 1]?.demand ?? 420;
  let lag7 = tail[0]?.demand ?? lag1;
  let rollingAvg7 = tail.reduce((sum, r) => sum + r.demand, 0) / Math.max(tail.length, 1);

  const forecast: DemandForecastPoint[] = [];

  for (let day = 1; day <= 30; day += 1) {
    const seasonality = 1 + 0.18 * Math.sin((2 * Math.PI * day) / 30);
    const promotion = day % 8 === 0 ? 1 : 0;

    const input = tf.tensor2d([[lag1, lag7, rollingAvg7, seasonality * 100, promotion]]);
    const normInput = input.sub(minX).div(maxX.sub(minX).add(1e-6));
    const normOutput = model.predict(normInput) as tf.Tensor;
    const value = normOutput.mul(maxY.sub(minY)).add(minY).dataSync()[0];

    const uncertainty = error * (0.8 + day / 60);
    const lower = clamp(value - uncertainty, 80, 1200);
    const upper = clamp(value + uncertainty, 100, 1400);

    forecast.push({
      dayAhead: day,
      forecast: value,
      lower,
      upper,
      anomaly: Math.abs(value - rollingAvg7) > error * 2.1,
    });

    lag7 = lag1;
    lag1 = value;
    rollingAvg7 = (rollingAvg7 * 6 + value) / 7;

    input.dispose();
    normInput.dispose();
    normOutput.dispose();
  }

  featuresTensor.dispose();
  labelsTensor.dispose();
  minX.dispose();
  maxX.dispose();
  minY.dispose();
  maxY.dispose();
  normalizedX.dispose();
  normalizedY.dispose();
  predictedNorm.dispose();
  predicted.dispose();
  model.dispose();

  return {
    modelConfidence: clamp(0.95 - error / 500, 0.62, 0.97),
    generatedAt: Date.now(),
    result: forecast,
  };
}

function scoreProduction(rows: ProductionDataRow[]): ModelOutput<ProductionRiskPoint[]> {
  const machineGroups = new Map<string, ProductionDataRow[]>();

  rows.forEach((row) => {
    const bucket = machineGroups.get(row.machineId) ?? [];
    bucket.push(row);
    machineGroups.set(row.machineId, bucket);
  });

  const scores: ProductionRiskPoint[] = [];

  machineGroups.forEach((group, machineId) => {
    const sample = group.slice(-30);
    const avgDowntime = sample.reduce((sum, r) => sum + r.downtimeHours, 0) / sample.length;
    const avgDefect = sample.reduce((sum, r) => sum + r.defectRate, 0) / sample.length;
    const maintenanceHits = sample.reduce((sum, r) => sum + r.maintenanceFlag, 0);
    const avgBaseline = sample.reduce((sum, r) => sum + r.oeeBaseline, 0) / sample.length;

    const riskSignal = avgDowntime * 0.28 + avgDefect * 3.8 + maintenanceHits * 0.08 - avgBaseline * 0.7;
    const failureProbability = clamp(sigmoid(riskSignal - 1.6), 0.03, 0.98);
    const predictedOee = clamp(avgBaseline - failureProbability * 0.3, 0.25, 0.96);
    const confidence = clamp(0.58 + sample.length / 120 - avgDefect * 0.4, 0.5, 0.93);

    scores.push({
      machineId,
      failureProbability,
      predictedOee,
      confidence,
    });
  });

  scores.sort((a, b) => b.failureProbability - a.failureProbability);

  return {
    modelConfidence: 0.84,
    generatedAt: Date.now(),
    result: scores,
  };
}

function optimizeTransport(rows: TransportDataRow[]): ModelOutput<TransportRecommendation[]> {
  const shipmentGroups = new Map<string, TransportDataRow[]>();

  rows.forEach((row) => {
    const options = shipmentGroups.get(row.shipmentId) ?? [];
    options.push(row);
    shipmentGroups.set(row.shipmentId, options);
  });

  const recommendations: TransportRecommendation[] = [];

  shipmentGroups.forEach((options, shipmentId) => {
    let best = options[0];
    let bestScore = -Infinity;

    options.forEach((option) => {
      const score =
        100
        - option.delayRate * 45
        - (option.distanceKm / 2000) * 18
        - option.trafficIndex * 20
        + option.fuelEfficiency * 6;

      if (score > bestScore) {
        bestScore = score;
        best = option;
      }
    });

    const riskScore = clamp(best.delayRate * 70 + best.trafficIndex * 20 + (1 / best.fuelEfficiency) * 10, 5, 100);

    recommendations.push({
      shipmentId,
      sku: best.sku,
      bestRoute: best.routeId,
      recommendedOrigin: best.origin,
      recommendedDestination: best.destination,
      riskScore,
      score: clamp(bestScore, 10, 100),
      confidence: clamp(0.55 + best.fuelEfficiency / 10 - best.delayRate / 2, 0.5, 0.94),
    });
  });

  recommendations.sort((a, b) => b.score - a.score);

  return {
    modelConfidence: 0.79,
    generatedAt: Date.now(),
    result: recommendations,
  };
}

ctx.onmessage = async (event: MessageEvent<RequestMessage>) => {
  const { id, task, payload } = event.data;

  try {
    if (task === "demandForecast") {
      const data = await forecastDemand(payload.rows);
      ctx.postMessage({ id, task, data });
      return;
    }

    if (task === "productionScore") {
      const data = scoreProduction(payload.rows);
      ctx.postMessage({ id, task, data });
      return;
    }

    if (task === "transportOptimize") {
      const data = optimizeTransport(payload.rows);
      ctx.postMessage({ id, task, data });
      return;
    }

    ctx.postMessage({ id, task, error: "Unsupported worker task" });
  } catch (error) {
    ctx.postMessage({
      id,
      task,
      error: error instanceof Error ? error.message : "Worker task failed",
    });
  }
};
