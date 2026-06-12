-- CreateEnum
CREATE TYPE "WidgetType" AS ENUM ('MONITORING_OVERVIEW', 'AVAILABILITY_CHART', 'CONFIG_BUTTON', 'REMOTE_COMMAND', 'LOCAL_COMMAND', 'CONSOLE_OUTPUT', 'LOG_STREAM', 'CUSTOM_NOTE');

-- CreateTable
CREATE TABLE "supervision_packs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "widgets" JSONB NOT NULL DEFAULT '[]',
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supervision_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_widgets" (
    "id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "type" "WidgetType" NOT NULL,
    "title" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "layout_x" INTEGER NOT NULL DEFAULT 0,
    "layout_y" INTEGER NOT NULL DEFAULT 0,
    "layout_w" INTEGER NOT NULL DEFAULT 6,
    "layout_h" INTEGER NOT NULL DEFAULT 4,
    "pack_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_widgets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_widgets_service_id_idx" ON "service_widgets"("service_id");

-- AddForeignKey
ALTER TABLE "service_widgets" ADD CONSTRAINT "service_widgets_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
