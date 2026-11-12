-- CreateEnum
CREATE TYPE "PeatType" AS ENUM ('FIBRIC', 'HEMIC', 'SAPRIC');

-- AlterTable
ALTER TABLE "stations" ADD COLUMN     "peat_type" "PeatType";
