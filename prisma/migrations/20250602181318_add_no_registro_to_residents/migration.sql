/*
  Warnings:

  - A unique constraint covering the columns `[noRegistro]` on the table `Resident` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Resident" ADD COLUMN "noRegistro" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Resident_noRegistro_key" ON "Resident"("noRegistro");
