-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN_LOCATION');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('AKTIF', 'NONAKTIF');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('BEROPERASI', 'MAINTENANCE', 'MATI');

-- CreateEnum
CREATE TYPE "StationStatus" AS ENUM ('AKTIF', 'NONAKTIF');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('SOIL_MOISTURE', 'LOW_BATTERY', 'PEATLAND_LIFESPAN');

-- CreateEnum
CREATE TYPE "AlertPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'PENDING', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('READING', 'AI_INSIGHT');

-- CreateEnum
CREATE TYPE "WaterTableTrend" AS ENUM ('RISING', 'STABLE', 'DECLINING');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "company_name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN_LOCATION',
    "status" "UserStatus" NOT NULL DEFAULT 'AKTIF',
    "station_id" TEXT,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provinsi" TEXT NOT NULL,
    "kabupaten" TEXT NOT NULL,
    "kecamatan" TEXT NOT NULL,
    "desa" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "maps_link" TEXT,
    "image_url" TEXT,
    "status" "StationStatus" NOT NULL DEFAULT 'AKTIF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "station_id" TEXT,
    "status" "DeviceStatus" NOT NULL DEFAULT 'BEROPERASI',
    "sensor_config" JSONB,
    "battery_warning" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "battery_critical" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "sampling_interval" INTEGER NOT NULL DEFAULT 300,
    "pipe_length" DOUBLE PRECISION,
    "remaining_pipe" DOUBLE PRECISION,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "readings" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "unix_time" BIGINT NOT NULL,
    "date_time" TIMESTAMP(3) NOT NULL,
    "raw_water_level" DOUBLE PRECISION,
    "raw_rain_meter" DOUBLE PRECISION,
    "raw_soil_moisture" DOUBLE PRECISION,
    "raw_soil_temperature" DOUBLE PRECISION,
    "raw_soil_conductivity" DOUBLE PRECISION,
    "raw_ph_value" DOUBLE PRECISION,
    "water_level" DOUBLE PRECISION,
    "rain_meter" DOUBLE PRECISION,
    "soil_moisture" DOUBLE PRECISION,
    "soil_temperature" DOUBLE PRECISION,
    "soil_conductivity" DOUBLE PRECISION,
    "ph_value" DOUBLE PRECISION,
    "calibration_version" INTEGER NOT NULL DEFAULT 1,
    "battery" DOUBLE PRECISION,
    "signal_strength" DOUBLE PRECISION,
    "panel_temperature" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "station_id" TEXT NOT NULL,
    "device_id" TEXT,
    "alert_type" "AlertType" NOT NULL,
    "priority" "AlertPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "reading_id" TEXT,
    "ai_insight_id" TEXT,
    "source_type" "SourceType" NOT NULL,
    "message" TEXT,
    "threshold_value" DOUBLE PRECISION,
    "actual_value" DOUBLE PRECISION,
    "resolved_by_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" TEXT NOT NULL,
    "station_id" TEXT NOT NULL,
    "analysis_start" TIMESTAMP(3) NOT NULL,
    "analysis_end" TIMESTAMP(3) NOT NULL,
    "peatland_lifespan_years" DOUBLE PRECISION,
    "soil_health_score" DOUBLE PRECISION,
    "water_table_trend" "WaterTableTrend",
    "risk_assessment" JSONB,
    "recommendations" JSONB,
    "model_version" TEXT,
    "confidence_score" DOUBLE PRECISION,
    "raw_output" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "station_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL,
    "soil_moisture_min" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "soil_moisture_max" DOUBLE PRECISION NOT NULL DEFAULT 80,
    "peatland_lifespan_min" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "calibration_formulas" JSONB NOT NULL,
    "updated_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "devices_device_id_key" ON "devices"("device_id");

-- CreateIndex
CREATE INDEX "readings_device_id_date_time_idx" ON "readings"("device_id", "date_time");

-- CreateIndex
CREATE UNIQUE INDEX "readings_device_id_unix_time_key" ON "readings"("device_id", "unix_time");

-- CreateIndex
CREATE INDEX "alerts_station_id_status_idx" ON "alerts"("station_id", "status");

-- CreateIndex
CREATE INDEX "alerts_device_id_idx" ON "alerts"("device_id");

-- CreateIndex
CREATE INDEX "alerts_alert_type_status_idx" ON "alerts"("alert_type", "status");

-- CreateIndex
CREATE INDEX "alerts_created_at_idx" ON "alerts"("created_at");

-- CreateIndex
CREATE INDEX "ai_insights_station_id_analysis_start_idx" ON "ai_insights"("station_id", "analysis_start");

-- CreateIndex
CREATE INDEX "admin_logs_user_id_created_at_idx" ON "admin_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "admin_logs_station_id_created_at_idx" ON "admin_logs"("station_id", "created_at");

-- CreateIndex
CREATE INDEX "admin_logs_action_idx" ON "admin_logs"("action");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "readings" ADD CONSTRAINT "readings_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_reading_id_fkey" FOREIGN KEY ("reading_id") REFERENCES "readings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_ai_insight_id_fkey" FOREIGN KEY ("ai_insight_id") REFERENCES "ai_insights"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_config" ADD CONSTRAINT "system_config_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
