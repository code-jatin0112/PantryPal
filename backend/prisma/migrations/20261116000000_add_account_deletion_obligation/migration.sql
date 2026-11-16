-- CreateTable
CREATE TABLE "AccountDeletionObligation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetCollection" TEXT NOT NULL DEFAULT 'ALL',
    "documentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountDeletionObligation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountDeletionObligation_userId_key" ON "AccountDeletionObligation"("userId");

-- CreateIndex
CREATE INDEX "AccountDeletionObligation_status_idx" ON "AccountDeletionObligation"("status");

-- CreateIndex
CREATE INDEX "AccountDeletionObligation_userId_idx" ON "AccountDeletionObligation"("userId");
