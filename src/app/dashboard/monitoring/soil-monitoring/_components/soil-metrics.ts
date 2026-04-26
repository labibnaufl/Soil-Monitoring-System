export const SOIL_METRICS = {
  soilMoisture: {
    key: "soilMoisture",
    label: "Kelembaban Tanah",
    unit: "%",
    color: "#3b82f6", // blue-500
    icon: "Droplets",
    description: "Persentase kelembaban tanah",
    min: 0,
    max: 100,
  },
  soilTemperature: {
    key: "soilTemperature",
    label: "Suhu Tanah",
    unit: "°C",
    color: "#f97316", // orange-500
    icon: "Thermometer",
    description: "Suhu tanah dalam Celsius",
    min: -10,
    max: 60,
  },
  soilConductivity: {
    key: "soilConductivity",
    label: "Konduktivitas",
    unit: "µS/cm",
    color: "#8b5cf6", // violet-500
    icon: "Zap",
    description: "Konduktivitas listrik tanah",
    min: 0,
    max: 2000,
  },
  phValue: {
    key: "phValue",
    label: "pH Tanah",
    unit: "",
    color: "#10b981", // emerald-500
    icon: "Beaker",
    description: "Tingkat keasaman tanah",
    min: 0,
    max: 14,
  },
} as const;

export type SoilMetricKey = keyof typeof SOIL_METRICS;
