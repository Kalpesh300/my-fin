/* eslint-disable @typescript-eslint/consistent-type-definitions */

type Account = {
  id: string;
  name: string;
  description: string;
  deletedAt: string | null;
};

type RecurrenceUnit = "MONTH" | "YEAR";

type RecurringCostConfiguration = {
  id: string;
  amount: number;
  outflowType: string;
  description: string;
  recurrenceInterval: number;
  recurrenceUnit: RecurrenceUnit;
  startingMonthYear: string;
  deletedAt: string | null;
  account: Account;
};

type IncomeEntry = {
  id: string;
  amount: number;
  source: string;
  description: string;
  account: Account;
};

type RecurringCostInstance = {
  id: string;
  amount: number;
  outflowType: string;
  description: string;
  paymentDate: string;
  account: Account;
  origin: {
    id: string;
    description: string;
    deletedAt: string | null;
  } | null;
};

type OtherCostEntry = {
  id: string;
  amount: number;
  outflowType: string;
  description: string;
  paymentDate: string;
  account: Account;
};

type AccountTotal = {
  accountId: string;
  accountName: string;
  inflow: number;
  outflow: number;
};

type MonthlyRecord = {
  id: string;
  monthYear: string;
  incomeEntries: IncomeEntry[];
  recurringCostInstances: RecurringCostInstance[];
  otherCostEntries: OtherCostEntry[];
  summary: {
    totalIncome: number;
    totalRecurringCost: number;
    totalOtherCost: number;
    netSavings: number;
    accountTotals: AccountTotal[];
  };
};

type AccountPayload = {
  name: string;
  description: string;
};

type RecurringCostPayload = {
  accountId: string;
  amount: number;
  outflowType: string;
  description: string;
  recurrenceInterval: number;
  recurrenceUnit: RecurrenceUnit;
  startingMonthYear: string;
};

type IncomeEntryPayload = {
  accountId: string;
  amount: number;
  source: string;
  description: string;
};

type CostEntryPayload = {
  accountId: string;
  amount: number;
  outflowType: string;
  description: string;
  paymentDate: string;
};

export type {
  Account,
  AccountPayload,
  CostEntryPayload,
  IncomeEntry,
  IncomeEntryPayload,
  MonthlyRecord,
  OtherCostEntry,
  RecurrenceUnit,
  RecurringCostConfiguration,
  RecurringCostInstance,
  RecurringCostPayload,
};
