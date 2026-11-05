-- CreateTable
CREATE TABLE "TelegramMensaje" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "messageId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "dia" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramMensaje_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TelegramMensaje_chatId_createdAt_idx" ON "TelegramMensaje"("chatId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramMensaje_chatId_messageId_key" ON "TelegramMensaje"("chatId", "messageId");
