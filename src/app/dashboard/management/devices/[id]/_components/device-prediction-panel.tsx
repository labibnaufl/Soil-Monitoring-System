"use client";

import { useEffect, useState } from "react";
import {
  AvailabilityBanner,
  ForecastChart,
  type ForecastPoint,
} from "@/app/dashboard/_components/forecast-chart";

interface PanelData {
  prediction: {
    availability: string;
    message: string;
    forecast_origin?: string | null;
    evaluation_warning?: string | null;
    points: ForecastPoint[];
  };
  error?: string;
}

export function DevicePredictionPanel({ hardwareId }: { hardwareId: string }) {
  const [data, setData] = useState<PanelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ews/predict?deviceId=${encodeURIComponent(hardwareId)}`)
      .then(async (res) => {
        const json = (await res.json()) as PanelData;
        if (cancelled) {
          return;
        }
        setData(res.ok ? json : null);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setData(null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hardwareId]);

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold font-heading text-foreground">
          Prediksi AI — 24 Jam ke Depan
        </h2>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat prediksi…</p>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">
          Prediksi tidak tersedia saat ini (data lama, riwayat kurang, atau
          layanan mati).
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <AvailabilityBanner
            availability={data.prediction.availability}
            message={data.prediction.message}
            forecastOrigin={data.prediction.forecast_origin}
            evaluationWarning={data.prediction.evaluation_warning}
          />
          <ForecastChart
            points={data.prediction.points}
            title="Prakiraan per Jam"
            heightClass="h-48"
          />
        </div>
      )}
    </div>
  );
}
