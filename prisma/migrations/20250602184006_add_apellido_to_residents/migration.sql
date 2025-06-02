-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Resident" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "apellido" TEXT,
    "cedula" TEXT NOT NULL,
    "noRegistro" TEXT,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "lastPaymentDate" DATETIME,
    "nextPaymentDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Resident" ("address", "apellido", "cedula", "createdAt", "id", "lastPaymentDate", "name", "nextPaymentDate", "noRegistro", "paymentStatus", "phone", "updatedAt") SELECT "address", "apellido", "cedula", "createdAt", "id", "lastPaymentDate", "name", "nextPaymentDate", "noRegistro", "paymentStatus", "phone", "updatedAt" FROM "Resident";
DROP TABLE "Resident";
ALTER TABLE "new_Resident" RENAME TO "Resident";
CREATE UNIQUE INDEX "Resident_cedula_key" ON "Resident"("cedula");
CREATE UNIQUE INDEX "Resident_noRegistro_key" ON "Resident"("noRegistro");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
