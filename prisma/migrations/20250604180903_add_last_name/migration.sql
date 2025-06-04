/*
  Warnings:

  - Added the required column `lastName` to the `Resident` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Resident" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "lastPaymentDate" DATETIME,
    "nextPaymentDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Resident" ("address", "cedula", "createdAt", "id", "lastPaymentDate", "name", "nextPaymentDate", "paymentStatus", "phone", "updatedAt") SELECT "address", "cedula", "createdAt", "id", "lastPaymentDate", "name", "nextPaymentDate", "paymentStatus", "phone", "updatedAt" FROM "Resident";
DROP TABLE "Resident";
ALTER TABLE "new_Resident" RENAME TO "Resident";
CREATE UNIQUE INDEX "Resident_cedula_key" ON "Resident"("cedula");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
