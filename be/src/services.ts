/* eslint-disable n/no-unpublished-import */
import { Prisma } from "./generated/prisma/client.js";

import { prisma } from "./config/prisma.js";
import { AppError } from "./errors.js";
import { doesRecurrenceApply, getFirstDayOfMonth } from "./months.js";

type AccountInput = {
  name: string;
  description: string;
};

type RecurringCostConfigurationInput = {
  accountId: string;
  amount: number;
  outflowType: string;
  description: string;
  recurrenceInterval: number;
  recurrenceUnit: "MONTH" | "YEAR";
  startingMonthYear: string;
};

type IncomeEntryInput = {
  accountId: string;
  amount: number;
  source: string;
  description: string;
};

type CostEntryInput = {
  accountId: string;
  amount: number;
  outflowType: string;
  description: string;
  paymentDate: string;
};

const monthlyRecordInclude = {
  incomeEntries: {
    include: {
      account: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  },
  recurringCostInstances: {
    include: {
      account: true,
      recurringCostConfiguration: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  },
  otherCostEntries: {
    include: {
      account: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  },
} satisfies Prisma.MonthlyRecordInclude;

type MonthlyRecordWithEntries = Prisma.MonthlyRecordGetPayload<{
  include: typeof monthlyRecordInclude;
}>;

const serializeDate = (date: Date) => date.toISOString().slice(0, 10);

const serializeAccount = (account: {
  id: string;
  name: string;
  description: string | null;
  deletedAt: Date | null;
}) => ({
  id: account.id,
  name: account.name,
  description: account.description ?? "",
  deletedAt: account.deletedAt?.toISOString() ?? null,
});

const ensureAccount = async (userId: string, accountId: string) => {
  const account = await prisma.account.findFirst({
    where: {
      id: accountId,
      userId,
      deletedAt: null,
    },
  });

  if (!account) {
    throw new AppError("Account was not found for this user.", 404);
  }

  return account;
};

const ensureMonthlyRecord = async (userId: string, monthlyRecordId: string) => {
  const monthlyRecord = await prisma.monthlyRecord.findFirst({
    where: {
      id: monthlyRecordId,
      userId,
    },
  });

  if (!monthlyRecord) {
    throw new AppError("Monthly record was not found for this user.", 404);
  }

  return monthlyRecord;
};

const buildSummary = (monthlyRecord: MonthlyRecordWithEntries) => {
  const accountTotals = new Map<
    string,
    { accountId: string; accountName: string; inflow: number; outflow: number }
  >();

  const getAccountTotal = (account: { id: string; name: string }) => {
    const existingTotal = accountTotals.get(account.id);

    if (existingTotal) {
      return existingTotal;
    }

    const newTotal = {
      accountId: account.id,
      accountName: account.name,
      inflow: 0,
      outflow: 0,
    };
    accountTotals.set(account.id, newTotal);
    return newTotal;
  };

  const totalIncome = monthlyRecord.incomeEntries.reduce((total, entry) => {
    const amount = Number(entry.amount);
    getAccountTotal(entry.account).inflow += amount;
    return total + amount;
  }, 0);

  const totalRecurringCost = monthlyRecord.recurringCostInstances.reduce((total, entry) => {
    const amount = Number(entry.amount);
    getAccountTotal(entry.account).outflow += amount;
    return total + amount;
  }, 0);

  const totalOtherCost = monthlyRecord.otherCostEntries.reduce((total, entry) => {
    const amount = Number(entry.amount);
    getAccountTotal(entry.account).outflow += amount;
    return total + amount;
  }, 0);

  return {
    totalIncome,
    totalRecurringCost,
    totalOtherCost,
    netSavings: totalIncome - totalRecurringCost - totalOtherCost,
    accountTotals: Array.from(accountTotals.values()).sort((left, right) =>
      left.accountName.localeCompare(right.accountName),
    ),
  };
};

const serializeMonthlyRecord = (monthlyRecord: MonthlyRecordWithEntries) => ({
  id: monthlyRecord.id,
  monthYear: monthlyRecord.monthYear,
  incomeEntries: monthlyRecord.incomeEntries.map((entry) => ({
    id: entry.id,
    amount: Number(entry.amount),
    source: entry.source,
    description: entry.description,
    account: serializeAccount(entry.account),
  })),
  recurringCostInstances: monthlyRecord.recurringCostInstances.map((entry) => ({
    id: entry.id,
    amount: Number(entry.amount),
    outflowType: entry.outflowType,
    description: entry.description,
    paymentDate: serializeDate(entry.paymentDate),
    account: serializeAccount(entry.account),
    origin: entry.recurringCostConfiguration
      ? {
          id: entry.recurringCostConfiguration.id,
          description: entry.recurringCostConfiguration.description,
          deletedAt: entry.recurringCostConfiguration.deletedAt?.toISOString() ?? null,
        }
      : null,
  })),
  otherCostEntries: monthlyRecord.otherCostEntries.map((entry) => ({
    id: entry.id,
    amount: Number(entry.amount),
    outflowType: entry.outflowType,
    description: entry.description,
    paymentDate: serializeDate(entry.paymentDate),
    account: serializeAccount(entry.account),
  })),
  summary: buildSummary(monthlyRecord),
});

const getMonthlyRecordById = async (id: string) => {
  const monthlyRecord = await prisma.monthlyRecord.findUnique({
    where: { id },
    include: monthlyRecordInclude,
  });

  if (!monthlyRecord) {
    throw new AppError("Monthly record was not found.", 404);
  }

  return serializeMonthlyRecord(monthlyRecord);
};

const listAccounts = async (userId: string) => {
  const accounts = await prisma.account.findMany({
    where: { userId },
    orderBy: [{ deletedAt: "asc" }, { name: "asc" }],
  });

  return accounts.map(serializeAccount);
};

const createAccount = async (userId: string, input: AccountInput) => {
  const account = await prisma.account.create({
    data: {
      userId,
      name: input.name,
      description: input.description || null,
    },
  });

  return serializeAccount(account);
};

const updateAccount = async (userId: string, id: string, input: AccountInput) => {
  await ensureAccount(userId, id);

  const account = await prisma.account.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description || null,
    },
  });

  return serializeAccount(account);
};

const deleteAccount = async (userId: string, id: string) => {
  await ensureAccount(userId, id);

  const account = await prisma.account.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return serializeAccount(account);
};

const serializeRecurringCostConfiguration = (
  configuration: Prisma.RecurringCostConfigurationGetPayload<{ include: { account: true } }>,
) => ({
  id: configuration.id,
  amount: Number(configuration.amount),
  outflowType: configuration.outflowType,
  description: configuration.description,
  recurrenceInterval: configuration.recurrenceInterval,
  recurrenceUnit: configuration.recurrenceUnit,
  startingMonthYear: configuration.startingMonthYear,
  deletedAt: configuration.deletedAt?.toISOString() ?? null,
  account: serializeAccount(configuration.account),
});

const listRecurringCostConfigurations = async (userId: string) => {
  const configurations = await prisma.recurringCostConfiguration.findMany({
    where: { userId },
    include: { account: true },
    orderBy: [{ deletedAt: "asc" }, { createdAt: "desc" }],
  });

  return configurations.map(serializeRecurringCostConfiguration);
};

const createRecurringCostConfiguration = async (
  userId: string,
  input: RecurringCostConfigurationInput,
) => {
  await ensureAccount(userId, input.accountId);

  const configuration = await prisma.recurringCostConfiguration.create({
    data: {
      userId,
      accountId: input.accountId,
      amount: input.amount,
      outflowType: input.outflowType,
      description: input.description,
      recurrenceInterval: input.recurrenceInterval,
      recurrenceUnit: input.recurrenceUnit,
      startingMonthYear: input.startingMonthYear,
    },
    include: { account: true },
  });

  return serializeRecurringCostConfiguration(configuration);
};

const updateRecurringCostConfiguration = async (
  userId: string,
  id: string,
  input: RecurringCostConfigurationInput,
) => {
  await ensureAccount(userId, input.accountId);
  const existingConfiguration = await prisma.recurringCostConfiguration.findFirst({
    where: { id, userId, deletedAt: null },
  });

  if (!existingConfiguration) {
    throw new AppError("Recurring cost configuration was not found for this user.", 404);
  }

  const configuration = await prisma.recurringCostConfiguration.update({
    where: { id },
    data: {
      accountId: input.accountId,
      amount: input.amount,
      outflowType: input.outflowType,
      description: input.description,
      recurrenceInterval: input.recurrenceInterval,
      recurrenceUnit: input.recurrenceUnit,
      startingMonthYear: input.startingMonthYear,
    },
    include: { account: true },
  });

  return serializeRecurringCostConfiguration(configuration);
};

const deleteRecurringCostConfiguration = async (userId: string, id: string) => {
  const existingConfiguration = await prisma.recurringCostConfiguration.findFirst({
    where: { id, userId, deletedAt: null },
  });

  if (!existingConfiguration) {
    throw new AppError("Recurring cost configuration was not found for this user.", 404);
  }

  const configuration = await prisma.recurringCostConfiguration.update({
    where: { id },
    data: { deletedAt: new Date() },
    include: { account: true },
  });

  return serializeRecurringCostConfiguration(configuration);
};

const fetchMonthlyRecord = async (userId: string, monthYear: string) => {
  const monthlyRecord = await prisma.monthlyRecord.findUnique({
    where: { userId_monthYear: { userId, monthYear } },
    include: monthlyRecordInclude,
  });

  if (!monthlyRecord) {
    throw new AppError("Monthly record was not found.", 404);
  }

  return serializeMonthlyRecord(monthlyRecord);
};

const createMonthlyRecord = async (userId: string, monthYear: string) => {
  const existingRecord = await prisma.monthlyRecord.findUnique({
    where: { userId_monthYear: { userId, monthYear } },
  });

  if (existingRecord) {
    throw new AppError("Monthly record already exists for this user.", 409);
  }

  const matchingConfigurations = await prisma.recurringCostConfiguration.findMany({
    where: { userId, deletedAt: null },
  });

  const applicableConfigurations = matchingConfigurations.filter((configuration) =>
    doesRecurrenceApply({
      selectedMonthYear: monthYear,
      startingMonthYear: configuration.startingMonthYear,
      recurrenceInterval: configuration.recurrenceInterval,
      recurrenceUnit: configuration.recurrenceUnit,
    }),
  );

  const monthlyRecord = await prisma.monthlyRecord.create({
    data: {
      userId,
      monthYear,
      recurringCostInstances: {
        create: applicableConfigurations.map((configuration) => ({
          recurringCostConfigurationId: configuration.id,
          accountId: configuration.accountId,
          amount: configuration.amount,
          outflowType: configuration.outflowType,
          description: configuration.description,
          paymentDate: getFirstDayOfMonth(monthYear),
        })),
      },
    },
    include: monthlyRecordInclude,
  });

  return serializeMonthlyRecord(monthlyRecord);
};

const deleteMonthlyRecord = async (userId: string, id: string) => {
  await ensureMonthlyRecord(userId, id);
  await prisma.monthlyRecord.delete({ where: { id } });
};

const createIncomeEntry = async (
  userId: string,
  monthlyRecordId: string,
  input: IncomeEntryInput,
) => {
  await ensureMonthlyRecord(userId, monthlyRecordId);
  await ensureAccount(userId, input.accountId);

  await prisma.monthlyIncomeEntry.create({
    data: {
      monthlyRecordId,
      accountId: input.accountId,
      amount: input.amount,
      source: input.source,
      description: input.description,
    },
  });

  return getMonthlyRecordById(monthlyRecordId);
};

const updateIncomeEntry = async (userId: string, id: string, input: IncomeEntryInput) => {
  const existingEntry = await prisma.monthlyIncomeEntry.findFirst({
    where: { id, monthlyRecord: { userId } },
  });

  if (!existingEntry) {
    throw new AppError("Income entry was not found for this user.", 404);
  }

  await ensureAccount(userId, input.accountId);
  await prisma.monthlyIncomeEntry.update({
    where: { id },
    data: {
      accountId: input.accountId,
      amount: input.amount,
      source: input.source,
      description: input.description,
    },
  });

  return getMonthlyRecordById(existingEntry.monthlyRecordId);
};

const deleteIncomeEntry = async (userId: string, id: string) => {
  const existingEntry = await prisma.monthlyIncomeEntry.findFirst({
    where: { id, monthlyRecord: { userId } },
  });

  if (!existingEntry) {
    throw new AppError("Income entry was not found for this user.", 404);
  }

  await prisma.monthlyIncomeEntry.delete({ where: { id } });
  return getMonthlyRecordById(existingEntry.monthlyRecordId);
};

const updateRecurringCostInstance = async (userId: string, id: string, input: CostEntryInput) => {
  const existingEntry = await prisma.monthlyRecurringCostInstance.findFirst({
    where: { id, monthlyRecord: { userId } },
  });

  if (!existingEntry) {
    throw new AppError("Recurring cost instance was not found for this user.", 404);
  }

  await ensureAccount(userId, input.accountId);
  await prisma.monthlyRecurringCostInstance.update({
    where: { id },
    data: {
      accountId: input.accountId,
      amount: input.amount,
      outflowType: input.outflowType,
      description: input.description,
      paymentDate: new Date(`${input.paymentDate}T00:00:00.000Z`),
    },
  });

  return getMonthlyRecordById(existingEntry.monthlyRecordId);
};

const deleteRecurringCostInstance = async (userId: string, id: string) => {
  const existingEntry = await prisma.monthlyRecurringCostInstance.findFirst({
    where: { id, monthlyRecord: { userId } },
  });

  if (!existingEntry) {
    throw new AppError("Recurring cost instance was not found for this user.", 404);
  }

  await prisma.monthlyRecurringCostInstance.delete({ where: { id } });
  return getMonthlyRecordById(existingEntry.monthlyRecordId);
};

const createOtherCostEntry = async (
  userId: string,
  monthlyRecordId: string,
  input: CostEntryInput,
) => {
  await ensureMonthlyRecord(userId, monthlyRecordId);
  await ensureAccount(userId, input.accountId);

  await prisma.monthlyOtherCostEntry.create({
    data: {
      monthlyRecordId,
      accountId: input.accountId,
      amount: input.amount,
      outflowType: input.outflowType,
      description: input.description,
      paymentDate: new Date(`${input.paymentDate}T00:00:00.000Z`),
    },
  });

  return getMonthlyRecordById(monthlyRecordId);
};

const updateOtherCostEntry = async (userId: string, id: string, input: CostEntryInput) => {
  const existingEntry = await prisma.monthlyOtherCostEntry.findFirst({
    where: { id, monthlyRecord: { userId } },
  });

  if (!existingEntry) {
    throw new AppError("Other cost entry was not found for this user.", 404);
  }

  await ensureAccount(userId, input.accountId);
  await prisma.monthlyOtherCostEntry.update({
    where: { id },
    data: {
      accountId: input.accountId,
      amount: input.amount,
      outflowType: input.outflowType,
      description: input.description,
      paymentDate: new Date(`${input.paymentDate}T00:00:00.000Z`),
    },
  });

  return getMonthlyRecordById(existingEntry.monthlyRecordId);
};

const deleteOtherCostEntry = async (userId: string, id: string) => {
  const existingEntry = await prisma.monthlyOtherCostEntry.findFirst({
    where: { id, monthlyRecord: { userId } },
  });

  if (!existingEntry) {
    throw new AppError("Other cost entry was not found for this user.", 404);
  }

  await prisma.monthlyOtherCostEntry.delete({ where: { id } });
  return getMonthlyRecordById(existingEntry.monthlyRecordId);
};

export {
  createAccount,
  createIncomeEntry,
  createMonthlyRecord,
  createOtherCostEntry,
  createRecurringCostConfiguration,
  deleteAccount,
  deleteIncomeEntry,
  deleteMonthlyRecord,
  deleteOtherCostEntry,
  deleteRecurringCostConfiguration,
  deleteRecurringCostInstance,
  fetchMonthlyRecord,
  listAccounts,
  listRecurringCostConfigurations,
  updateAccount,
  updateIncomeEntry,
  updateOtherCostEntry,
  updateRecurringCostConfiguration,
  updateRecurringCostInstance,
};
