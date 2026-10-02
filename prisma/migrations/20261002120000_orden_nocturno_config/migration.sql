-- CreateTable
CREATE TABLE "OrdenNocturnoConfig" (
    "id" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdenNocturnoConfig_pkey" PRIMARY KEY ("id")
);
