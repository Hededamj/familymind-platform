-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'MODERATOR';

-- AlterTable
ALTER TABLE "DiscussionPost" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "organizationId" UUID,
ADD COLUMN     "roomId" UUID,
ADD COLUMN     "slug" TEXT,
ALTER COLUMN "cohortId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "CommunityRoom" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomPromptQueue" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "roomId" UUID NOT NULL,
    "promptText" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "postedAt" TIMESTAMP(3),
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomPromptQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityRoom_slug_key" ON "CommunityRoom"("slug");

-- CreateIndex
CREATE INDEX "CommunityRoom_isArchived_sortOrder_idx" ON "CommunityRoom"("isArchived", "sortOrder");

-- CreateIndex
CREATE INDEX "RoomPromptQueue_roomId_postedAt_isPaused_idx" ON "RoomPromptQueue"("roomId", "postedAt", "isPaused");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionPost_slug_key" ON "DiscussionPost"("slug");

-- CreateIndex
CREATE INDEX "DiscussionPost_roomId_createdAt_idx" ON "DiscussionPost"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "DiscussionPost_slug_idx" ON "DiscussionPost"("slug");

-- AddForeignKey
ALTER TABLE "DiscussionPost" ADD CONSTRAINT "DiscussionPost_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "CommunityRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomPromptQueue" ADD CONSTRAINT "RoomPromptQueue_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "CommunityRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
