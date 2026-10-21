-- CreateTable
CREATE TABLE "TelegramBotConfig" (
    "id" TEXT NOT NULL,
    "botToken" TEXT NOT NULL DEFAULT '',
    "chatId" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramBotConfig_pkey" PRIMARY KEY ("id")
);
