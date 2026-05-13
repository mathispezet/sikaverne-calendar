-- AlterTable
ALTER TABLE "RecurringRule" ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rhythm" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "rhythmWeekStart" DATE,
ADD COLUMN     "ruleSetId" TEXT,
ADD COLUMN     "ruleSetName" TEXT;

-- CreateIndex
CREATE INDEX "RecurringRule_userId_ruleSetId_idx" ON "RecurringRule"("userId", "ruleSetId");

-- CreateIndex
CREATE INDEX "RecurringRule_userId_priority_idx" ON "RecurringRule"("userId", "priority");
