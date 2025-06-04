/*
  Warnings:

  - A unique constraint covering the columns `[NoRegistro]` on the table `Resident` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Resident" ADD COLUMN "NoRegistro" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Resident_NoRegistro_key" ON "Resident"("NoRegistro");
