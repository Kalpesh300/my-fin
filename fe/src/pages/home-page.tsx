/* eslint-disable @typescript-eslint/consistent-type-definitions */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Link, useLocation } from "react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  createAccount,
  createIncomeEntry,
  createMonthlyRecord,
  createOtherCostEntry,
  createRecurringCost,
  deleteAccount,
  deleteIncomeEntry,
  deleteMonthlyRecord,
  deleteOtherCostEntry,
  deleteRecurringCost,
  deleteRecurringCostInstance,
  fetchMonthlyRecord,
  listAccounts,
  listRecurringCosts,
  updateAccount,
  updateIncomeEntry,
  updateOtherCostEntry,
  updateRecurringCost,
  updateRecurringCostInstance,
} from "@/api/finance-api";
import { Button } from "@/components/ui/button";
import {
  MONTH_NAMES,
  formatCurrency,
  getCurrentMonthYear,
  getFirstDateInputForMonthYear,
  getMonthYearFromParts,
} from "@/lib/finance-utils";
import { cn } from "@/lib/utils";
import type {
  Account,
  CostEntryPayload,
  IncomeEntry,
  IncomeEntryPayload,
  MonthlyRecord,
  OtherCostEntry,
  RecurringCostConfiguration,
  RecurringCostInstance,
  RecurringCostPayload,
} from "@/types/finance";

type Toast = {
  kind: "error" | "success";
  message: string;
};

type AccountForm = {
  id: string;
  name: string;
  description: string;
};

type IncomeForm = {
  id: string;
  accountId: string;
  amount: string;
  source: string;
  description: string;
};

type CostForm = {
  id: string;
  accountId: string;
  amount: string;
  outflowType: string;
  description: string;
  paymentDate: string;
};

type RecurringForm = {
  id: string;
  accountId: string;
  amount: string;
  outflowType: string;
  description: string;
  recurrenceInterval: string;
  recurrenceUnit: "MONTH" | "YEAR";
  startingMonthIndex: string;
  startingYear: string;
};

const currentYear = String(new Date().getFullYear());
const defaultMonthIndex = String(new Date().getMonth());
const inputClassName =
  "h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50";
const labelClassName = "grid gap-1 text-sm font-medium text-foreground";

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data.message ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
};

const isNotFoundError = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 404;

const getActiveAccounts = (accounts: Account[]) =>
  accounts.filter((account) => account.deletedAt === null);

const createEmptyIncomeForm = (accountId = ""): IncomeForm => ({
  id: "",
  accountId,
  amount: "",
  source: "",
  description: "",
});

const createEmptyCostForm = (accountId = "", paymentDate = ""): CostForm => ({
  id: "",
  accountId,
  amount: "",
  outflowType: "",
  description: "",
  paymentDate,
});

const createEmptyRecurringForm = (accountId = ""): RecurringForm => ({
  id: "",
  accountId,
  amount: "",
  outflowType: "",
  description: "",
  recurrenceInterval: "1",
  recurrenceUnit: "MONTH",
  startingMonthIndex: defaultMonthIndex,
  startingYear: currentYear,
});

const toIncomePayload = (form: IncomeForm): IncomeEntryPayload => ({
  accountId: form.accountId,
  amount: Number(form.amount),
  source: form.source,
  description: form.description,
});

const toCostPayload = (form: CostForm): CostEntryPayload => ({
  accountId: form.accountId,
  amount: Number(form.amount),
  outflowType: form.outflowType,
  description: form.description,
  paymentDate: form.paymentDate,
});

const toRecurringPayload = (form: RecurringForm): RecurringCostPayload => ({
  accountId: form.accountId,
  amount: Number(form.amount),
  outflowType: form.outflowType,
  description: form.description,
  recurrenceInterval: Number(form.recurrenceInterval),
  recurrenceUnit: form.recurrenceUnit,
  startingMonthYear: getMonthYearFromParts(form.startingMonthIndex, form.startingYear),
});

const matchesSearch = (values: string[], searchTerm: string) =>
  values.some((value) => value.toLowerCase().includes(searchTerm.toLowerCase()));

const AppShell: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { href: "/", label: "Monthly" },
    { href: "/accounts", label: "Accounts" },
    { href: "/recurring-costs", label: "Recurring costs" },
  ];

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Personal Finance</p>
          <h1 className="text-2xl font-semibold tracking-tight">Monthly money board</h1>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-muted",
                location.pathname === item.href && "bg-primary text-primary-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

const ToastMessage: React.FC<Readonly<{ toast: Toast | null }>> = ({ toast }) => {
  if (!toast) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed right-4 top-4 z-50 rounded-xl border px-4 py-3 text-sm shadow-lg",
        toast.kind === "success"
          ? "border-primary/30 bg-primary text-primary-foreground"
          : "border-destructive/30 bg-card text-destructive",
      )}
      role="status"
    >
      {toast.message}
    </div>
  );
};

const AccountsPanel: React.FC<
  Readonly<{
    accounts: Account[];
    setToast: (toast: Toast) => void;
  }>
> = ({ accounts, setToast }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AccountForm>({ id: "", name: "", description: "" });

  const accountMutationOptions = {
    onError: (error: unknown) => setToast({ kind: "error", message: getErrorMessage(error) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setForm({ id: "", name: "", description: "" });
    },
  };

  const createAccountMutation = useMutation({
    mutationFn: () => createAccount({ name: form.name, description: form.description }),
    ...accountMutationOptions,
    onSuccess: () => {
      accountMutationOptions.onSuccess();
      setToast({ kind: "success", message: "Account saved." });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: () =>
      updateAccount(form.id, { name: form.name, description: form.description }),
    ...accountMutationOptions,
    onSuccess: () => {
      accountMutationOptions.onSuccess();
      setToast({ kind: "success", message: "Account updated." });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onError: (error: unknown) => setToast({ kind: "error", message: getErrorMessage(error) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setToast({ kind: "success", message: "Account soft deleted." });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (form.id) {
      updateAccountMutation.mutate();
      return;
    }

    createAccountMutation.mutate();
  };

  const handleEdit = (account: Account) => {
    setForm({
      id: account.id,
      name: account.name,
      description: account.description,
    });
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Account setup</h2>
        <p className="text-sm text-muted-foreground">
          Create the predefined account list used by income and cost forms.
        </p>
      </div>
      <form className="grid gap-3 md:grid-cols-[1fr_2fr_auto]" onSubmit={handleSubmit}>
        <label className={labelClassName}>
          Name
          <input
            className={inputClassName}
            value={form.name}
            required
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </label>
        <label className={labelClassName}>
          Description
          <input
            className={inputClassName}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </label>
        <div className="flex items-end gap-2">
          <Button type="submit">{form.id ? "Update" : "Add"}</Button>
          {form.id ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setForm({ id: "", name: "", description: "" })}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-2 pr-3 font-medium">Name</th>
              <th className="py-2 pr-3 font-medium">Description</th>
              <th className="py-2 pr-3 font-medium">Status</th>
              <th className="py-2 pr-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id} className="border-b border-border/70">
                <td className="py-3 pr-3 font-medium">{account.name}</td>
                <td className="py-3 pr-3 text-muted-foreground">{account.description || "-"}</td>
                <td className="py-3 pr-3">
                  {account.deletedAt ? "Soft deleted" : "Active"}
                </td>
                <td className="flex gap-2 py-3 pr-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={Boolean(account.deletedAt)}
                    onClick={() => handleEdit(account)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={Boolean(account.deletedAt)}
                    onClick={() => deleteAccountMutation.mutate(account.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            {accounts.length === 0 ? (
              <tr>
                <td className="py-6 text-center text-muted-foreground" colSpan={4}>
                  No accounts yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const RecurringCostsPanel: React.FC<
  Readonly<{
    accounts: Account[];
    configurations: RecurringCostConfiguration[];
    setToast: (toast: Toast) => void;
  }>
> = ({ accounts, configurations, setToast }) => {
  const queryClient = useQueryClient();
  const activeAccounts = getActiveAccounts(accounts);
  const [form, setForm] = useState<RecurringForm>(() =>
    createEmptyRecurringForm(activeAccounts[0]?.id ?? ""),
  );

  const resetForm = () => setForm(createEmptyRecurringForm(activeAccounts[0]?.id ?? ""));

  const createRecurringMutation = useMutation({
    mutationFn: () => createRecurringCost(toRecurringPayload(form)),
    onError: (error: unknown) => setToast({ kind: "error", message: getErrorMessage(error) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recurring-costs"] });
      resetForm();
      setToast({ kind: "success", message: "Recurring cost saved." });
    },
  });

  const updateRecurringMutation = useMutation({
    mutationFn: () => updateRecurringCost(form.id, toRecurringPayload(form)),
    onError: (error: unknown) => setToast({ kind: "error", message: getErrorMessage(error) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recurring-costs"] });
      resetForm();
      setToast({ kind: "success", message: "Recurring cost updated." });
    },
  });

  const deleteRecurringMutation = useMutation({
    mutationFn: (id: string) => deleteRecurringCost(id),
    onError: (error: unknown) => setToast({ kind: "error", message: getErrorMessage(error) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recurring-costs"] });
      setToast({ kind: "success", message: "Recurring cost soft deleted." });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (form.id) {
      updateRecurringMutation.mutate();
      return;
    }

    createRecurringMutation.mutate();
  };

  const handleEdit = (configuration: RecurringCostConfiguration) => {
    const [monthName, year] = configuration.startingMonthYear.split(" ");
    setForm({
      id: configuration.id,
      accountId: configuration.account.id,
      amount: String(configuration.amount),
      outflowType: configuration.outflowType,
      description: configuration.description,
      recurrenceInterval: String(configuration.recurrenceInterval),
      recurrenceUnit: configuration.recurrenceUnit,
      startingMonthIndex: String(MONTH_NAMES.findIndex((name) => name === monthName)),
      startingYear: year,
    });
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Recurring cost setup</h2>
        <p className="text-sm text-muted-foreground">
          Changes affect only future month creation. Auto-created payments use the 1st of
          the month.
        </p>
      </div>
      <form className="grid gap-3 lg:grid-cols-4" onSubmit={handleSubmit}>
        <label className={labelClassName}>
          Account
          <select
            className={inputClassName}
            value={form.accountId}
            required
            onChange={(event) => setForm({ ...form, accountId: event.target.value })}
          >
            <option value="">Select account</option>
            {activeAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClassName}>
          Amount
          <input
            className={inputClassName}
            value={form.amount}
            type="number"
            min="0.01"
            step="0.01"
            required
            onChange={(event) => setForm({ ...form, amount: event.target.value })}
          />
        </label>
        <label className={labelClassName}>
          Outflow type
          <input
            className={inputClassName}
            value={form.outflowType}
            required
            onChange={(event) => setForm({ ...form, outflowType: event.target.value })}
          />
        </label>
        <label className={labelClassName}>
          Description
          <input
            className={inputClassName}
            value={form.description}
            required
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </label>
        <label className={labelClassName}>
          Every
          <input
            className={inputClassName}
            value={form.recurrenceInterval}
            type="number"
            min="1"
            step="1"
            required
            onChange={(event) =>
              setForm({ ...form, recurrenceInterval: event.target.value })
            }
          />
        </label>
        <label className={labelClassName}>
          Unit
          <select
            className={inputClassName}
            value={form.recurrenceUnit}
            onChange={(event) =>
              setForm({ ...form, recurrenceUnit: event.target.value as "MONTH" | "YEAR" })
            }
          >
            <option value="MONTH">Month</option>
            <option value="YEAR">Year</option>
          </select>
        </label>
        <label className={labelClassName}>
          Starting month
          <select
            className={inputClassName}
            value={form.startingMonthIndex}
            onChange={(event) =>
              setForm({ ...form, startingMonthIndex: event.target.value })
            }
          >
            {MONTH_NAMES.map((monthName, index) => (
              <option key={monthName} value={index}>
                {monthName}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClassName}>
          Starting year
          <input
            className={inputClassName}
            value={form.startingYear}
            type="number"
            min="1900"
            required
            onChange={(event) => setForm({ ...form, startingYear: event.target.value })}
          />
        </label>
        <div className="flex gap-2 lg:col-span-4">
          <Button type="submit" disabled={activeAccounts.length === 0}>
            {form.id ? "Update recurring cost" : "Add recurring cost"}
          </Button>
          {form.id ? (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-2 pr-3 font-medium">Description</th>
              <th className="py-2 pr-3 font-medium">Type</th>
              <th className="py-2 pr-3 font-medium">Account</th>
              <th className="py-2 pr-3 font-medium">Amount</th>
              <th className="py-2 pr-3 font-medium">Recurrence</th>
              <th className="py-2 pr-3 font-medium">Status</th>
              <th className="py-2 pr-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {configurations.map((configuration) => (
              <tr key={configuration.id} className="border-b border-border/70">
                <td className="py-3 pr-3 font-medium">{configuration.description}</td>
                <td className="py-3 pr-3">{configuration.outflowType}</td>
                <td className="py-3 pr-3">{configuration.account.name}</td>
                <td className="py-3 pr-3">{formatCurrency(configuration.amount)}</td>
                <td className="py-3 pr-3">
                  Every {configuration.recurrenceInterval}{" "}
                  {configuration.recurrenceUnit.toLowerCase()} from{" "}
                  {configuration.startingMonthYear}
                </td>
                <td className="py-3 pr-3">
                  {configuration.deletedAt ? "Soft deleted" : "Active"}
                </td>
                <td className="flex gap-2 py-3 pr-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={Boolean(configuration.deletedAt)}
                    onClick={() => handleEdit(configuration)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={Boolean(configuration.deletedAt)}
                    onClick={() => deleteRecurringMutation.mutate(configuration.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            {configurations.length === 0 ? (
              <tr>
                <td className="py-6 text-center text-muted-foreground" colSpan={7}>
                  No recurring cost configurations yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const MonthlyEntryTables: React.FC<
  Readonly<{
    monthlyRecord: MonthlyRecord;
    accounts: Account[];
    searchTerm: string;
    setToast: (toast: Toast) => void;
  }>
> = ({ monthlyRecord, accounts, searchTerm, setToast }) => {
  const queryClient = useQueryClient();
  const activeAccounts = getActiveAccounts(accounts);
  const firstAccountId = activeAccounts[0]?.id ?? "";
  const defaultPaymentDate = getFirstDateInputForMonthYear(monthlyRecord.monthYear);
  const [incomeForm, setIncomeForm] = useState<IncomeForm>(() =>
    createEmptyIncomeForm(firstAccountId),
  );
  const [recurringForm, setRecurringForm] = useState<CostForm>(() =>
    createEmptyCostForm(firstAccountId, defaultPaymentDate),
  );
  const [otherCostForm, setOtherCostForm] = useState<CostForm>(() =>
    createEmptyCostForm(firstAccountId, defaultPaymentDate),
  );

  const setMonthlyRecord = (data: MonthlyRecord) => {
    queryClient.setQueryData(["monthly-record", data.monthYear], data);
  };

  const createIncomeMutation = useMutation({
    mutationFn: () => createIncomeEntry(monthlyRecord.id, toIncomePayload(incomeForm)),
    onError: (error: unknown) => setToast({ kind: "error", message: getErrorMessage(error) }),
    onSuccess: (data) => {
      setMonthlyRecord(data);
      setIncomeForm(createEmptyIncomeForm(firstAccountId));
      setToast({ kind: "success", message: "Income entry saved." });
    },
  });

  const updateIncomeMutation = useMutation({
    mutationFn: () => updateIncomeEntry(incomeForm.id, toIncomePayload(incomeForm)),
    onError: (error: unknown) => setToast({ kind: "error", message: getErrorMessage(error) }),
    onSuccess: (data) => {
      setMonthlyRecord(data);
      setIncomeForm(createEmptyIncomeForm(firstAccountId));
      setToast({ kind: "success", message: "Income entry updated." });
    },
  });

  const deleteIncomeMutation = useMutation({
    mutationFn: (id: string) => deleteIncomeEntry(id),
    onError: (error: unknown) => setToast({ kind: "error", message: getErrorMessage(error) }),
    onSuccess: (data) => {
      setMonthlyRecord(data);
      setToast({ kind: "success", message: "Income entry deleted." });
    },
  });

  const updateRecurringMutation = useMutation({
    mutationFn: () => updateRecurringCostInstance(recurringForm.id, toCostPayload(recurringForm)),
    onError: (error: unknown) => setToast({ kind: "error", message: getErrorMessage(error) }),
    onSuccess: (data) => {
      setMonthlyRecord(data);
      setRecurringForm(createEmptyCostForm(firstAccountId, defaultPaymentDate));
      setToast({ kind: "success", message: "Recurring cost instance updated." });
    },
  });

  const deleteRecurringMutation = useMutation({
    mutationFn: (id: string) => deleteRecurringCostInstance(id),
    onError: (error: unknown) => setToast({ kind: "error", message: getErrorMessage(error) }),
    onSuccess: (data) => {
      setMonthlyRecord(data);
      setToast({ kind: "success", message: "Recurring cost instance deleted." });
    },
  });

  const createOtherCostMutation = useMutation({
    mutationFn: () => createOtherCostEntry(monthlyRecord.id, toCostPayload(otherCostForm)),
    onError: (error: unknown) => setToast({ kind: "error", message: getErrorMessage(error) }),
    onSuccess: (data) => {
      setMonthlyRecord(data);
      setOtherCostForm(createEmptyCostForm(firstAccountId, defaultPaymentDate));
      setToast({ kind: "success", message: "Other cost saved." });
    },
  });

  const updateOtherCostMutation = useMutation({
    mutationFn: () => updateOtherCostEntry(otherCostForm.id, toCostPayload(otherCostForm)),
    onError: (error: unknown) => setToast({ kind: "error", message: getErrorMessage(error) }),
    onSuccess: (data) => {
      setMonthlyRecord(data);
      setOtherCostForm(createEmptyCostForm(firstAccountId, defaultPaymentDate));
      setToast({ kind: "success", message: "Other cost updated." });
    },
  });

  const deleteOtherCostMutation = useMutation({
    mutationFn: (id: string) => deleteOtherCostEntry(id),
    onError: (error: unknown) => setToast({ kind: "error", message: getErrorMessage(error) }),
    onSuccess: (data) => {
      setMonthlyRecord(data);
      setToast({ kind: "success", message: "Other cost deleted." });
    },
  });

  const filteredIncomeEntries = monthlyRecord.incomeEntries.filter((entry) =>
    matchesSearch([entry.source, entry.description, entry.account.name], searchTerm),
  );
  const filteredRecurringCostInstances = monthlyRecord.recurringCostInstances.filter((entry) =>
    matchesSearch([entry.outflowType, entry.description, entry.account.name], searchTerm),
  );
  const filteredOtherCostEntries = monthlyRecord.otherCostEntries.filter((entry) =>
    matchesSearch([entry.outflowType, entry.description, entry.account.name], searchTerm),
  );

  const handleIncomeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (incomeForm.id) {
      updateIncomeMutation.mutate();
      return;
    }

    createIncomeMutation.mutate();
  };

  const handleRecurringSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateRecurringMutation.mutate();
  };

  const handleOtherCostSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (otherCostForm.id) {
      updateOtherCostMutation.mutate();
      return;
    }

    createOtherCostMutation.mutate();
  };

  const handleEditIncome = (entry: IncomeEntry) => {
    setIncomeForm({
      id: entry.id,
      accountId: entry.account.id,
      amount: String(entry.amount),
      source: entry.source,
      description: entry.description,
    });
  };

  const handleEditRecurring = (entry: RecurringCostInstance) => {
    setRecurringForm({
      id: entry.id,
      accountId: entry.account.id,
      amount: String(entry.amount),
      outflowType: entry.outflowType,
      description: entry.description,
      paymentDate: entry.paymentDate,
    });
  };

  const handleEditOtherCost = (entry: OtherCostEntry) => {
    setOtherCostForm({
      id: entry.id,
      accountId: entry.account.id,
      amount: String(entry.amount),
      outflowType: entry.outflowType,
      description: entry.description,
      paymentDate: entry.paymentDate,
    });
  };

  const accountOptions = (
    <>
      <option value="">Select account</option>
      {activeAccounts.map((account) => (
        <option key={account.id} value={account.id}>
          {account.name}
        </option>
      ))}
    </>
  );

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Income</h2>
          <p className="text-sm text-muted-foreground">
            Add free-text sources with account-level inflow tracking.
          </p>
        </div>
        <form className="grid gap-3 lg:grid-cols-5" onSubmit={handleIncomeSubmit}>
          <select
            className={inputClassName}
            value={incomeForm.accountId}
            required
            aria-label="Income account"
            onChange={(event) => setIncomeForm({ ...incomeForm, accountId: event.target.value })}
          >
            {accountOptions}
          </select>
          <input
            className={inputClassName}
            value={incomeForm.amount}
            type="number"
            min="0.01"
            step="0.01"
            required
            placeholder="Amount"
            aria-label="Income amount"
            onChange={(event) => setIncomeForm({ ...incomeForm, amount: event.target.value })}
          />
          <input
            className={inputClassName}
            value={incomeForm.source}
            required
            placeholder="Source"
            aria-label="Income source"
            onChange={(event) => setIncomeForm({ ...incomeForm, source: event.target.value })}
          />
          <input
            className={inputClassName}
            value={incomeForm.description}
            required
            placeholder="Description"
            aria-label="Income description"
            onChange={(event) =>
              setIncomeForm({ ...incomeForm, description: event.target.value })
            }
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={activeAccounts.length === 0}>
              {incomeForm.id ? "Update" : "Add"}
            </Button>
            {incomeForm.id ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIncomeForm(createEmptyIncomeForm(firstAccountId))}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
        <EntryTable
          headers={["Source", "Description", "Account", "Amount", "Actions"]}
          emptyMessage="No income entries match this month."
          rows={filteredIncomeEntries.map((entry) => ({
            id: entry.id,
            cells: [
              entry.source,
              entry.description,
              entry.account.name,
              formatCurrency(entry.amount),
            ],
            onDelete: () => deleteIncomeMutation.mutate(entry.id),
            onEdit: () => handleEditIncome(entry),
          }))}
        />
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Recurring costs</h2>
          <p className="text-sm text-muted-foreground">
            Auto-added from setup and editable for this month only.
          </p>
        </div>
        {recurringForm.id ? (
          <form className="mb-4 grid gap-3 lg:grid-cols-6" onSubmit={handleRecurringSubmit}>
            <select
              className={inputClassName}
              value={recurringForm.accountId}
              required
              aria-label="Recurring cost account"
              onChange={(event) =>
                setRecurringForm({ ...recurringForm, accountId: event.target.value })
              }
            >
              {accountOptions}
            </select>
            <input
              className={inputClassName}
              value={recurringForm.amount}
              type="number"
              min="0.01"
              step="0.01"
              required
              aria-label="Recurring cost amount"
              onChange={(event) =>
                setRecurringForm({ ...recurringForm, amount: event.target.value })
              }
            />
            <input
              className={inputClassName}
              value={recurringForm.outflowType}
              required
              aria-label="Recurring cost type"
              onChange={(event) =>
                setRecurringForm({ ...recurringForm, outflowType: event.target.value })
              }
            />
            <input
              className={inputClassName}
              value={recurringForm.description}
              required
              aria-label="Recurring cost description"
              onChange={(event) =>
                setRecurringForm({ ...recurringForm, description: event.target.value })
              }
            />
            <input
              className={inputClassName}
              value={recurringForm.paymentDate}
              type="date"
              required
              aria-label="Recurring cost payment date"
              onChange={(event) =>
                setRecurringForm({ ...recurringForm, paymentDate: event.target.value })
              }
            />
            <div className="flex gap-2">
              <Button type="submit">Save</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setRecurringForm(createEmptyCostForm(firstAccountId, defaultPaymentDate))
                }
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : null}
        <EntryTable
          headers={["Type", "Description", "Account", "Date", "Origin", "Amount", "Actions"]}
          emptyMessage="No recurring costs match this month."
          rows={filteredRecurringCostInstances.map((entry) => ({
            id: entry.id,
            cells: [
              entry.outflowType,
              entry.description,
              entry.account.name,
              entry.paymentDate,
              entry.origin?.description ?? "-",
              formatCurrency(entry.amount),
            ],
            onDelete: () => deleteRecurringMutation.mutate(entry.id),
            onEdit: () => handleEditRecurring(entry),
          }))}
        />
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Other costs</h2>
          <p className="text-sm text-muted-foreground">
            Add adhoc outflows for this month.
          </p>
        </div>
        <form className="grid gap-3 lg:grid-cols-6" onSubmit={handleOtherCostSubmit}>
          <select
            className={inputClassName}
            value={otherCostForm.accountId}
            required
            aria-label="Other cost account"
            onChange={(event) =>
              setOtherCostForm({ ...otherCostForm, accountId: event.target.value })
            }
          >
            {accountOptions}
          </select>
          <input
            className={inputClassName}
            value={otherCostForm.amount}
            type="number"
            min="0.01"
            step="0.01"
            required
            placeholder="Amount"
            aria-label="Other cost amount"
            onChange={(event) =>
              setOtherCostForm({ ...otherCostForm, amount: event.target.value })
            }
          />
          <input
            className={inputClassName}
            value={otherCostForm.outflowType}
            required
            placeholder="Outflow type"
            aria-label="Other cost type"
            onChange={(event) =>
              setOtherCostForm({ ...otherCostForm, outflowType: event.target.value })
            }
          />
          <input
            className={inputClassName}
            value={otherCostForm.description}
            required
            placeholder="Description"
            aria-label="Other cost description"
            onChange={(event) =>
              setOtherCostForm({ ...otherCostForm, description: event.target.value })
            }
          />
          <input
            className={inputClassName}
            value={otherCostForm.paymentDate}
            type="date"
            required
            aria-label="Other cost payment date"
            onChange={(event) =>
              setOtherCostForm({ ...otherCostForm, paymentDate: event.target.value })
            }
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={activeAccounts.length === 0}>
              {otherCostForm.id ? "Update" : "Add"}
            </Button>
            {otherCostForm.id ? (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setOtherCostForm(createEmptyCostForm(firstAccountId, defaultPaymentDate))
                }
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
        <EntryTable
          headers={["Type", "Description", "Account", "Date", "Amount", "Actions"]}
          emptyMessage="No other costs match this month."
          rows={filteredOtherCostEntries.map((entry) => ({
            id: entry.id,
            cells: [
              entry.outflowType,
              entry.description,
              entry.account.name,
              entry.paymentDate,
              formatCurrency(entry.amount),
            ],
            onDelete: () => deleteOtherCostMutation.mutate(entry.id),
            onEdit: () => handleEditOtherCost(entry),
          }))}
        />
      </section>
    </div>
  );
};

const EntryTable: React.FC<
  Readonly<{
    emptyMessage: string;
    headers: string[];
    rows: {
      id: string;
      cells: string[];
      onDelete: () => void;
      onEdit: () => void;
    }[];
  }>
> = ({ emptyMessage, headers, rows }) => (
  <div className="mt-5 overflow-x-auto">
    <table className="w-full min-w-[760px] text-left text-sm">
      <thead className="text-muted-foreground">
        <tr className="border-b border-border">
          {headers.map((header) => (
            <th key={header} className="py-2 pr-3 font-medium">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-border/70">
            {row.cells.map((cell) => (
              <td key={`${row.id}-${cell}`} className="py-3 pr-3">
                {cell}
              </td>
            ))}
            <td className="flex gap-2 py-3 pr-3">
              <Button type="button" variant="outline" size="sm" onClick={row.onEdit}>
                Edit
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={row.onDelete}>
                Delete
              </Button>
            </td>
          </tr>
        ))}
        {rows.length === 0 ? (
          <tr>
            <td className="py-6 text-center text-muted-foreground" colSpan={headers.length}>
              {emptyMessage}
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  </div>
);

const HomePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<Toast | null>(null);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(defaultMonthIndex);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [searchTerm, setSearchTerm] = useState("");
  const selectedMonthYear = getMonthYearFromParts(selectedMonthIndex, selectedYear);

  const accountsQuery = useQuery({ queryFn: listAccounts, queryKey: ["accounts"] });
  const monthlyRecordQuery = useQuery({
    queryFn: () => fetchMonthlyRecord(selectedMonthYear),
    queryKey: ["monthly-record", selectedMonthYear],
  });

  // Hides transient save/error feedback after the user has had time to read it.
  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const createMonthlyMutation = useMutation({
    mutationFn: () => createMonthlyRecord(selectedMonthYear),
    onError: (error: unknown) => setToast({ kind: "error", message: getErrorMessage(error) }),
    onSuccess: (data) => {
      queryClient.setQueryData(["monthly-record", selectedMonthYear], data);
      setToast({ kind: "success", message: `${selectedMonthYear} created.` });
    },
  });

  const deleteMonthlyMutation = useMutation({
    mutationFn: (id: string) => deleteMonthlyRecord(id),
    onError: (error: unknown) => setToast({ kind: "error", message: getErrorMessage(error) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["monthly-record", selectedMonthYear] });
      setToast({ kind: "success", message: `${selectedMonthYear} deleted.` });
    },
  });

  const activeAccounts = getActiveAccounts(accountsQuery.data ?? []);
  const monthlyRecord = monthlyRecordQuery.data;
  const isMissingMonthlyRecord = isNotFoundError(monthlyRecordQuery.error);

  const summaryCards = useMemo(() => {
    if (!monthlyRecord) {
      return [];
    }

    return [
      { label: "Total income", value: formatCurrency(monthlyRecord.summary.totalIncome) },
      {
        label: "Recurring costs",
        value: formatCurrency(monthlyRecord.summary.totalRecurringCost),
      },
      { label: "Other costs", value: formatCurrency(monthlyRecord.summary.totalOtherCost) },
      { label: "Net savings", value: formatCurrency(monthlyRecord.summary.netSavings) },
    ];
  }, [monthlyRecord]);

  return (
    <div className="min-h-screen bg-background">
      <AppShell />
      <ToastMessage toast={toast} />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Defaults to {getCurrentMonthYear()}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight">Monthly</h2>
              <p className="text-sm text-muted-foreground">
                Select any month-year, create it on demand, and manage INR inflows and
                outflows.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[160px_120px_auto]">
              <label className={labelClassName}>
                Month
                <select
                  className={inputClassName}
                  value={selectedMonthIndex}
                  onChange={(event) => setSelectedMonthIndex(event.target.value)}
                >
                  {MONTH_NAMES.map((monthName, index) => (
                    <option key={monthName} value={index}>
                      {monthName}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClassName}>
                Year
                <input
                  className={inputClassName}
                  value={selectedYear}
                  type="number"
                  min="1900"
                  onChange={(event) => setSelectedYear(event.target.value)}
                />
              </label>
              <div className="flex items-end gap-2">
                <Button
                  type="button"
                  onClick={() => createMonthlyMutation.mutate()}
                  disabled={Boolean(monthlyRecord) || createMonthlyMutation.isPending}
                >
                  Add New
                </Button>
                {monthlyRecord ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => deleteMonthlyMutation.mutate(monthlyRecord.id)}
                  >
                    Delete month
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {monthlyRecordQuery.isLoading || accountsQuery.isLoading ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            Loading monthly data...
          </div>
        ) : null}

        {isMissingMonthlyRecord ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <h2 className="text-xl font-semibold">No record for {selectedMonthYear}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Create it to auto-add matching recurring costs and start tracking entries.
            </p>
            <Button
              type="button"
              className="mt-4"
              onClick={() => createMonthlyMutation.mutate()}
            >
              Add New
            </Button>
          </div>
        ) : null}

        {!monthlyRecord && monthlyRecordQuery.error && !isMissingMonthlyRecord ? (
          <div className="rounded-2xl border border-destructive/30 bg-card p-6 text-destructive">
            {getErrorMessage(monthlyRecordQuery.error)}
          </div>
        ) : null}

        {monthlyRecord ? (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              {summaryCards.map((card) => (
                <div key={card.label} className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{card.value}</p>
                </div>
              ))}
            </div>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Account-wise totals</h2>
                  <p className="text-sm text-muted-foreground">
                    Inflows and outflows are shown separately by account.
                  </p>
                </div>
                <input
                  className={cn(inputClassName, "md:w-80")}
                  value={searchTerm}
                  placeholder="Search entries"
                  aria-label="Search monthly entries"
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {monthlyRecord.summary.accountTotals.map((total) => (
                  <div
                    key={total.accountId}
                    className="rounded-xl border border-border bg-background p-4"
                  >
                    <p className="font-medium">{total.accountName}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Inflow: {formatCurrency(total.inflow)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Outflow: {formatCurrency(total.outflow)}
                    </p>
                  </div>
                ))}
                {monthlyRecord.summary.accountTotals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No account activity yet.</p>
                ) : null}
              </div>
            </section>

            {activeAccounts.length === 0 ? (
              <div className="rounded-2xl border border-destructive/30 bg-card p-5 text-sm text-destructive">
                Add at least one active account before creating income or cost entries.
              </div>
            ) : null}

            <MonthlyEntryTables
              key={monthlyRecord.id}
              accounts={accountsQuery.data ?? []}
              monthlyRecord={monthlyRecord}
              searchTerm={searchTerm}
              setToast={setToast}
            />
          </>
        ) : null}
      </main>
    </div>
  );
};

const AccountsPage: React.FC = () => {
  const [toast, setToast] = useState<Toast | null>(null);
  const accountsQuery = useQuery({ queryFn: listAccounts, queryKey: ["accounts"] });

  // Hides account setup feedback after each create, update, or delete action.
  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  return (
    <div className="min-h-screen bg-background">
      <AppShell />
      <ToastMessage toast={toast} />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6">
        {accountsQuery.isLoading ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            Loading accounts...
          </div>
        ) : null}
        <AccountsPanel accounts={accountsQuery.data ?? []} setToast={setToast} />
      </main>
    </div>
  );
};

const RecurringCostsPage: React.FC = () => {
  const [toast, setToast] = useState<Toast | null>(null);
  const accountsQuery = useQuery({ queryFn: listAccounts, queryKey: ["accounts"] });
  const recurringCostsQuery = useQuery({
    queryFn: listRecurringCosts,
    queryKey: ["recurring-costs"],
  });

  // Hides recurring-cost setup feedback after each create, update, or delete action.
  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  return (
    <div className="min-h-screen bg-background">
      <AppShell />
      <ToastMessage toast={toast} />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6">
        {accountsQuery.isLoading || recurringCostsQuery.isLoading ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            Loading recurring costs...
          </div>
        ) : null}
        <RecurringCostsPanel
          accounts={accountsQuery.data ?? []}
          configurations={recurringCostsQuery.data ?? []}
          setToast={setToast}
        />
      </main>
    </div>
  );
};

export { AccountsPage, HomePage, RecurringCostsPage };
