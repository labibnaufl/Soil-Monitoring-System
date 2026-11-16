-- AlterEnum
ALTER TYPE "AlertType" ADD VALUE 'DEVICE_OFFLINE';

-- CreateTable
CREATE TABLE "rejected_readings" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB,
    "ip" TEXT,

    CONSTRAINT "rejected_readings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rejected_readings_device_id_received_at_idx" ON "rejected_readings"("device_id", "received_at");
