-- CreateEnum
CREATE TYPE "RecurrenceUnit" AS ENUM ('MONTH', 'YEAR');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringCostConfiguration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "outflowType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "recurrenceInterval" INTEGER NOT NULL,
    "recurrenceUnit" "RecurrenceUnit" NOT NULL,
    "startingMonthYear" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringCostConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "monthYear" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyIncomeEntry" (
    "id" TEXT NOT NULL,
    "monthlyRecordId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "source" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyIncomeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyRecurringCostInstance" (
    "id" TEXT NOT NULL,
    "monthlyRecordId" TEXT NOT NULL,
    "recurringCostConfigurationId" TEXT,
    "accountId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "outflowType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyRecurringCostInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyOtherCostEntry" (
    "id" TEXT NOT NULL,
    "monthlyRecordId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "outflowType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyOtherCostEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "RecurringCostConfiguration_userId_idx" ON "RecurringCostConfiguration"("userId");

-- CreateIndex
CREATE INDEX "RecurringCostConfiguration_accountId_idx" ON "RecurringCostConfiguration"("accountId");

-- CreateIndex
CREATE INDEX "MonthlyRecord_userId_idx" ON "MonthlyRecord"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyRecord_userId_monthYear_key" ON "MonthlyRecord"("userId", "monthYear");

-- CreateIndex
CREATE INDEX "MonthlyIncomeEntry_monthlyRecordId_idx" ON "MonthlyIncomeEntry"("monthlyRecordId");

-- CreateIndex
CREATE INDEX "MonthlyIncomeEntry_accountId_idx" ON "MonthlyIncomeEntry"("accountId");

-- CreateIndex
CREATE INDEX "MonthlyRecurringCostInstance_monthlyRecordId_idx" ON "MonthlyRecurringCostInstance"("monthlyRecordId");

-- CreateIndex
CREATE INDEX "MonthlyRecurringCostInstance_recurringCostConfigurationId_idx" ON "MonthlyRecurringCostInstance"("recurringCostConfigurationId");

-- CreateIndex
CREATE INDEX "MonthlyRecurringCostInstance_accountId_idx" ON "MonthlyRecurringCostInstance"("accountId");

-- CreateIndex
CREATE INDEX "MonthlyOtherCostEntry_monthlyRecordId_idx" ON "MonthlyOtherCostEntry"("monthlyRecordId");

-- CreateIndex
CREATE INDEX "MonthlyOtherCostEntry_accountId_idx" ON "MonthlyOtherCostEntry"("accountId");

-- AddForeignKey
ALTER TABLE "RecurringCostConfiguration" ADD CONSTRAINT "RecurringCostConfiguration_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyIncomeEntry" ADD CONSTRAINT "MonthlyIncomeEntry_monthlyRecordId_fkey" FOREIGN KEY ("monthlyRecordId") REFERENCES "MonthlyRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyIncomeEntry" ADD CONSTRAINT "MonthlyIncomeEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyRecurringCostInstance" ADD CONSTRAINT "MonthlyRecurringCostInstance_monthlyRecordId_fkey" FOREIGN KEY ("monthlyRecordId") REFERENCES "MonthlyRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyRecurringCostInstance" ADD CONSTRAINT "MonthlyRecurringCostInstance_recurringCostConfigurationId_fkey" FOREIGN KEY ("recurringCostConfigurationId") REFERENCES "RecurringCostConfiguration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyRecurringCostInstance" ADD CONSTRAINT "MonthlyRecurringCostInstance_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyOtherCostEntry" ADD CONSTRAINT "MonthlyOtherCostEntry_monthlyRecordId_fkey" FOREIGN KEY ("monthlyRecordId") REFERENCES "MonthlyRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyOtherCostEntry" ADD CONSTRAINT "MonthlyOtherCostEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
