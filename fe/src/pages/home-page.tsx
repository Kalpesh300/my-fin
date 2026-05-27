/* eslint-disable @typescript-eslint/consistent-type-definitions */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Link, useLocation } from "react-router";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type TableRowConfig = {
  id: string;
  cells: string[];
  onDelete: () => void;
  onEdit: () => void;
};

const currentYear = String(new Date().getFullYear());
const defaultMonthIndex = String(new Date().getMonth());
const formGridClassName = "grid gap-3 md:grid-cols-2 xl:grid-cols-4";

/*************************** Utilities ***************************/

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

const showErrorToast = (error: unknown) => toast.error(getErrorMessage(error));
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

const getAccountOptions = (accounts: Account[]) =>
  getActiveAccounts(accounts).map((account) => ({
    label: account.name,
    value: account.id,
  }));

/*************************** Shared UI ***************************/

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
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-muted-foreground">Personal Finance</p>
          <h1 className="text-2xl font-semibold tracking-tight">Monthly money board</h1>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant={location.pathname === item.href ? "default" : "ghost"}
              render={<Link to={item.href}>{item.label}</Link>}
            />
          ))}
        </nav>
      </div>
    </header>
  );
};

const Page: React.FC<Readonly<{ children: React.ReactNode }>> = ({ children }) => (
  <div className="min-h-screen bg-background">
    <AppShell />
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6">{children}</main>
  </div>
);

const LoadingCard: React.FC<Readonly<{ label: string }>> = ({ label }) => (
  <Card>
    <CardContent className="flex flex-col gap-3 py-8">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-8 w-full" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

const FinanceSelect: React.FC<
  Readonly<{
    ariaLabel: string;
    onValueChange: (value: string) => void;
    options: SelectOption[];
    placeholder: string;
    value: string;
    disabled?: boolean;
    className?: string;
  }>
> = ({ ariaLabel, className, disabled, onValueChange, options, placeholder, value }) => {
  const items = [{ label: placeholder, value: "" }, ...options];

  return (
    <Select
      items={items}
      value={value}
      onValueChange={(nextValue) => onValueChange(String(nextValue ?? ""))}
      disabled={disabled}
    >
      <SelectTrigger aria-label={ariaLabel} className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={`${ariaLabel}-${item.value || "empty"}`} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

const TextField: React.FC<
  Readonly<{
    label: string;
    onChange: (value: string) => void;
    value: string;
    placeholder?: string;
    required?: boolean;
    type?: string;
    min?: string;
    step?: string;
  }>
> = ({ label, min, onChange, placeholder, required, step, type = "text", value }) => (
  <Field>
    <FieldLabel>{label}</FieldLabel>
    <Input
      aria-label={label}
      min={min}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      required={required}
      step={step}
      type={type}
      value={value}
    />
  </Field>
);

const EntryTable: React.FC<
  Readonly<{
    emptyMessage: string;
    headers: string[];
    rows: TableRowConfig[];
  }>
> = ({ emptyMessage, headers, rows }) => (
  <Table className="min-w-[760px]">
    <TableHeader>
      <TableRow>
        {headers.map((header) => (
          <TableHead key={header}>{header}</TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.map((row) => (
        <TableRow key={row.id}>
          {row.cells.map((cell) => (
            <TableCell key={`${row.id}-${cell}`}>{cell}</TableCell>
          ))}
          <TableCell>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={row.onEdit}>
                Edit
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={row.onDelete}>
                Delete
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))}
      {rows.length === 0 ? (
        <TableRow>
          <TableCell colSpan={headers.length}>
            <Empty className="border-0">
              <EmptyHeader>
                <EmptyTitle>{emptyMessage}</EmptyTitle>
              </EmptyHeader>
            </Empty>
          </TableCell>
        </TableRow>
      ) : null}
    </TableBody>
  </Table>
);

/*************************** Account Setup ***************************/

const AccountsPanel: React.FC<Readonly<{ accounts: Account[] }>> = ({ accounts }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AccountForm>({ id: "", name: "", description: "" });

  const handleSuccess = (message: string) => {
    void queryClient.invalidateQueries({ queryKey: ["accounts"] });
    setForm({ id: "", name: "", description: "" });
    toast.success(message);
  };

  const createAccountMutation = useMutation({
    mutationFn: () => createAccount({ name: form.name, description: form.description }),
    onError: showErrorToast,
    onSuccess: () => handleSuccess("Account saved."),
  });

  const updateAccountMutation = useMutation({
    mutationFn: () =>
      updateAccount(form.id, { name: form.name, description: form.description }),
    onError: showErrorToast,
    onSuccess: () => handleSuccess("Account updated."),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onError: showErrorToast,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Account soft deleted.");
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
    <Card>
      <CardHeader>
        <CardTitle>Account setup</CardTitle>
        <CardDescription>
          Create the predefined account list used by income and cost forms.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <form onSubmit={handleSubmit}>
          <FieldGroup className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
            <TextField
              label="Name"
              required
              value={form.name}
              onChange={(value) => setForm({ ...form, name: value })}
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(value) => setForm({ ...form, description: value })}
            />
            <Field className="justify-end">
              <FieldLabel className="sr-only">Account actions</FieldLabel>
              <div className="flex gap-2">
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
            </Field>
          </FieldGroup>
        </form>
        <Separator />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{account.name}</TableCell>
                <TableCell>{account.description || "-"}</TableCell>
                <TableCell>
                  <Badge variant={account.deletedAt ? "secondary" : "default"}>
                    {account.deletedAt ? "Soft deleted" : "Active"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
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
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Empty className="border-0">
                    <EmptyHeader>
                      <EmptyTitle>No accounts yet.</EmptyTitle>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

/*************************** Recurring Cost Setup ***************************/

const RecurringCostsPanel: React.FC<
  Readonly<{
    accounts: Account[];
    configurations: RecurringCostConfiguration[];
  }>
> = ({ accounts, configurations }) => {
  const queryClient = useQueryClient();
  const accountOptions = getAccountOptions(accounts);
  const [form, setForm] = useState<RecurringForm>(() =>
    createEmptyRecurringForm(accountOptions[0]?.value ?? ""),
  );

  const resetForm = () => setForm(createEmptyRecurringForm(accountOptions[0]?.value ?? ""));

  const handleSuccess = (message: string) => {
    void queryClient.invalidateQueries({ queryKey: ["recurring-costs"] });
    resetForm();
    toast.success(message);
  };

  const createRecurringMutation = useMutation({
    mutationFn: () => createRecurringCost(toRecurringPayload(form)),
    onError: showErrorToast,
    onSuccess: () => handleSuccess("Recurring cost saved."),
  });

  const updateRecurringMutation = useMutation({
    mutationFn: () => updateRecurringCost(form.id, toRecurringPayload(form)),
    onError: showErrorToast,
    onSuccess: () => handleSuccess("Recurring cost updated."),
  });

  const deleteRecurringMutation = useMutation({
    mutationFn: (id: string) => deleteRecurringCost(id),
    onError: showErrorToast,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recurring-costs"] });
      toast.success("Recurring cost soft deleted.");
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
    <Card>
      <CardHeader>
        <CardTitle>Recurring cost setup</CardTitle>
        <CardDescription>
          Changes affect only future month creation. Auto-created payments use the 1st of
          the month.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <form onSubmit={handleSubmit}>
          <FieldGroup className={formGridClassName}>
            <Field>
              <FieldLabel>Account</FieldLabel>
              <FinanceSelect
                ariaLabel="Recurring cost account"
                value={form.accountId}
                options={accountOptions}
                placeholder="Select account"
                onValueChange={(value) => setForm({ ...form, accountId: value })}
              />
            </Field>
            <TextField
              label="Amount"
              min="0.01"
              step="0.01"
              type="number"
              required
              value={form.amount}
              onChange={(value) => setForm({ ...form, amount: value })}
            />
            <TextField
              label="Outflow type"
              required
              value={form.outflowType}
              onChange={(value) => setForm({ ...form, outflowType: value })}
            />
            <TextField
              label="Description"
              required
              value={form.description}
              onChange={(value) => setForm({ ...form, description: value })}
            />
            <TextField
              label="Every"
              min="1"
              step="1"
              type="number"
              required
              value={form.recurrenceInterval}
              onChange={(value) => setForm({ ...form, recurrenceInterval: value })}
            />
            <Field>
              <FieldLabel>Unit</FieldLabel>
              <FinanceSelect
                ariaLabel="Recurring cost unit"
                value={form.recurrenceUnit}
                options={[
                  { label: "Month", value: "MONTH" },
                  { label: "Year", value: "YEAR" },
                ]}
                placeholder="Select unit"
                onValueChange={(value) =>
                  setForm({ ...form, recurrenceUnit: value as "MONTH" | "YEAR" })
                }
              />
            </Field>
            <Field>
              <FieldLabel>Starting month</FieldLabel>
              <FinanceSelect
                ariaLabel="Recurring cost starting month"
                value={form.startingMonthIndex}
                options={MONTH_NAMES.map((monthName, index) => ({
                  label: monthName,
                  value: String(index),
                }))}
                placeholder="Select month"
                onValueChange={(value) => setForm({ ...form, startingMonthIndex: value })}
              />
            </Field>
            <TextField
              label="Starting year"
              min="1900"
              type="number"
              required
              value={form.startingYear}
              onChange={(value) => setForm({ ...form, startingYear: value })}
            />
            <Field className="xl:col-span-4">
              <FieldLabel className="sr-only">Recurring cost actions</FieldLabel>
              <div className="flex gap-2">
                <Button type="submit" disabled={accountOptions.length === 0}>
                  {form.id ? "Update recurring cost" : "Add recurring cost"}
                </Button>
                {form.id ? (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </Field>
          </FieldGroup>
        </form>
        <Separator />
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Recurrence</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configurations.map((configuration) => (
              <TableRow key={configuration.id}>
                <TableCell className="font-medium">{configuration.description}</TableCell>
                <TableCell>{configuration.outflowType}</TableCell>
                <TableCell>{configuration.account.name}</TableCell>
                <TableCell>{formatCurrency(configuration.amount)}</TableCell>
                <TableCell>
                  Every {configuration.recurrenceInterval}{" "}
                  {configuration.recurrenceUnit.toLowerCase()} from{" "}
                  {configuration.startingMonthYear}
                </TableCell>
                <TableCell>
                  <Badge variant={configuration.deletedAt ? "secondary" : "default"}>
                    {configuration.deletedAt ? "Soft deleted" : "Active"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
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
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {configurations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Empty className="border-0">
                    <EmptyHeader>
                      <EmptyTitle>No recurring cost configurations yet.</EmptyTitle>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

/*************************** Monthly Entries ***************************/

const MonthlyEntryTables: React.FC<
  Readonly<{
    monthlyRecord: MonthlyRecord;
    accounts: Account[];
    searchTerm: string;
  }>
> = ({ monthlyRecord, accounts, searchTerm }) => {
  const queryClient = useQueryClient();
  const accountOptions = getAccountOptions(accounts);
  const firstAccountId = accountOptions[0]?.value ?? "";
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
    onError: showErrorToast,
    onSuccess: (data) => {
      setMonthlyRecord(data);
      setIncomeForm(createEmptyIncomeForm(firstAccountId));
      toast.success("Income entry saved.");
    },
  });

  const updateIncomeMutation = useMutation({
    mutationFn: () => updateIncomeEntry(incomeForm.id, toIncomePayload(incomeForm)),
    onError: showErrorToast,
    onSuccess: (data) => {
      setMonthlyRecord(data);
      setIncomeForm(createEmptyIncomeForm(firstAccountId));
      toast.success("Income entry updated.");
    },
  });

  const deleteIncomeMutation = useMutation({
    mutationFn: (id: string) => deleteIncomeEntry(id),
    onError: showErrorToast,
    onSuccess: (data) => {
      setMonthlyRecord(data);
      toast.success("Income entry deleted.");
    },
  });

  const updateRecurringMutation = useMutation({
    mutationFn: () => updateRecurringCostInstance(recurringForm.id, toCostPayload(recurringForm)),
    onError: showErrorToast,
    onSuccess: (data) => {
      setMonthlyRecord(data);
      setRecurringForm(createEmptyCostForm(firstAccountId, defaultPaymentDate));
      toast.success("Recurring cost instance updated.");
    },
  });

  const deleteRecurringMutation = useMutation({
    mutationFn: (id: string) => deleteRecurringCostInstance(id),
    onError: showErrorToast,
    onSuccess: (data) => {
      setMonthlyRecord(data);
      toast.success("Recurring cost instance deleted.");
    },
  });

  const createOtherCostMutation = useMutation({
    mutationFn: () => createOtherCostEntry(monthlyRecord.id, toCostPayload(otherCostForm)),
    onError: showErrorToast,
    onSuccess: (data) => {
      setMonthlyRecord(data);
      setOtherCostForm(createEmptyCostForm(firstAccountId, defaultPaymentDate));
      toast.success("Other cost saved.");
    },
  });

  const updateOtherCostMutation = useMutation({
    mutationFn: () => updateOtherCostEntry(otherCostForm.id, toCostPayload(otherCostForm)),
    onError: showErrorToast,
    onSuccess: (data) => {
      setMonthlyRecord(data);
      setOtherCostForm(createEmptyCostForm(firstAccountId, defaultPaymentDate));
      toast.success("Other cost updated.");
    },
  });

  const deleteOtherCostMutation = useMutation({
    mutationFn: (id: string) => deleteOtherCostEntry(id),
    onError: showErrorToast,
    onSuccess: (data) => {
      setMonthlyRecord(data);
      toast.success("Other cost deleted.");
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

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Income</CardTitle>
          <CardDescription>Add free-text sources with account-level inflow tracking.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <form onSubmit={handleIncomeSubmit}>
            <FieldGroup className={formGridClassName}>
              <Field>
                <FieldLabel>Account</FieldLabel>
                <FinanceSelect
                  ariaLabel="Income account"
                  value={incomeForm.accountId}
                  options={accountOptions}
                  placeholder="Select account"
                  onValueChange={(value) => setIncomeForm({ ...incomeForm, accountId: value })}
                />
              </Field>
              <TextField
                label="Amount"
                min="0.01"
                step="0.01"
                type="number"
                required
                value={incomeForm.amount}
                onChange={(value) => setIncomeForm({ ...incomeForm, amount: value })}
              />
              <TextField
                label="Source"
                required
                value={incomeForm.source}
                onChange={(value) => setIncomeForm({ ...incomeForm, source: value })}
              />
              <TextField
                label="Description"
                required
                value={incomeForm.description}
                onChange={(value) => setIncomeForm({ ...incomeForm, description: value })}
              />
              <Field className="xl:col-span-4">
                <FieldLabel className="sr-only">Income actions</FieldLabel>
                <div className="flex gap-2">
                  <Button type="submit" disabled={accountOptions.length === 0}>
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
              </Field>
            </FieldGroup>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recurring costs</CardTitle>
          <CardDescription>Auto-added from setup and editable for this month only.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {recurringForm.id ? (
            <form onSubmit={handleRecurringSubmit}>
              <FieldGroup className={formGridClassName}>
                <Field>
                  <FieldLabel>Account</FieldLabel>
                  <FinanceSelect
                    ariaLabel="Recurring cost account"
                    value={recurringForm.accountId}
                    options={accountOptions}
                    placeholder="Select account"
                    onValueChange={(value) =>
                      setRecurringForm({ ...recurringForm, accountId: value })
                    }
                  />
                </Field>
                <TextField
                  label="Amount"
                  min="0.01"
                  step="0.01"
                  type="number"
                  required
                  value={recurringForm.amount}
                  onChange={(value) => setRecurringForm({ ...recurringForm, amount: value })}
                />
                <TextField
                  label="Outflow type"
                  required
                  value={recurringForm.outflowType}
                  onChange={(value) => setRecurringForm({ ...recurringForm, outflowType: value })}
                />
                <TextField
                  label="Description"
                  required
                  value={recurringForm.description}
                  onChange={(value) => setRecurringForm({ ...recurringForm, description: value })}
                />
                <TextField
                  label="Payment date"
                  type="date"
                  required
                  value={recurringForm.paymentDate}
                  onChange={(value) => setRecurringForm({ ...recurringForm, paymentDate: value })}
                />
                <Field>
                  <FieldLabel className="sr-only">Recurring cost instance actions</FieldLabel>
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
                </Field>
              </FieldGroup>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Other costs</CardTitle>
          <CardDescription>Add adhoc outflows for this month.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <form onSubmit={handleOtherCostSubmit}>
            <FieldGroup className={formGridClassName}>
              <Field>
                <FieldLabel>Account</FieldLabel>
                <FinanceSelect
                  ariaLabel="Other cost account"
                  value={otherCostForm.accountId}
                  options={accountOptions}
                  placeholder="Select account"
                  onValueChange={(value) =>
                    setOtherCostForm({ ...otherCostForm, accountId: value })
                  }
                />
              </Field>
              <TextField
                label="Amount"
                min="0.01"
                step="0.01"
                type="number"
                required
                value={otherCostForm.amount}
                onChange={(value) => setOtherCostForm({ ...otherCostForm, amount: value })}
              />
              <TextField
                label="Outflow type"
                required
                value={otherCostForm.outflowType}
                onChange={(value) => setOtherCostForm({ ...otherCostForm, outflowType: value })}
              />
              <TextField
                label="Description"
                required
                value={otherCostForm.description}
                onChange={(value) => setOtherCostForm({ ...otherCostForm, description: value })}
              />
              <TextField
                label="Payment date"
                type="date"
                required
                value={otherCostForm.paymentDate}
                onChange={(value) => setOtherCostForm({ ...otherCostForm, paymentDate: value })}
              />
              <Field>
                <FieldLabel className="sr-only">Other cost actions</FieldLabel>
                <div className="flex gap-2">
                  <Button type="submit" disabled={accountOptions.length === 0}>
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
              </Field>
            </FieldGroup>
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
        </CardContent>
      </Card>
    </div>
  );
};

/*************************** Pages ***************************/

const HomePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(defaultMonthIndex);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [searchTerm, setSearchTerm] = useState("");
  const selectedMonthYear = getMonthYearFromParts(selectedMonthIndex, selectedYear);

  const accountsQuery = useQuery({ queryFn: listAccounts, queryKey: ["accounts"] });
  const monthlyRecordQuery = useQuery({
    queryFn: () => fetchMonthlyRecord(selectedMonthYear),
    queryKey: ["monthly-record", selectedMonthYear],
  });

  const createMonthlyMutation = useMutation({
    mutationFn: () => createMonthlyRecord(selectedMonthYear),
    onError: showErrorToast,
    onSuccess: (data) => {
      queryClient.setQueryData(["monthly-record", selectedMonthYear], data);
      toast.success(`${selectedMonthYear} created.`);
    },
  });

  const deleteMonthlyMutation = useMutation({
    mutationFn: (id: string) => deleteMonthlyRecord(id),
    onError: showErrorToast,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["monthly-record", selectedMonthYear] });
      toast.success(`${selectedMonthYear} deleted.`);
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
    <Page>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Monthly</CardTitle>
          <CardDescription>
            Defaults to {getCurrentMonthYear()}. Select any month-year, create it on
            demand, and manage INR inflows and outflows.
          </CardDescription>
          <CardAction className="static col-auto row-auto">
            <FieldGroup className="grid gap-3 sm:grid-cols-[160px_120px_auto]">
              <Field>
                <FieldLabel>Month</FieldLabel>
                <FinanceSelect
                  ariaLabel="Month"
                  value={selectedMonthIndex}
                  options={MONTH_NAMES.map((monthName, index) => ({
                    label: monthName,
                    value: String(index),
                  }))}
                  placeholder="Select month"
                  onValueChange={setSelectedMonthIndex}
                />
              </Field>
              <TextField
                label="Year"
                min="1900"
                type="number"
                value={selectedYear}
                onChange={setSelectedYear}
              />
              <Field className="justify-end">
                <FieldLabel className="sr-only">Monthly actions</FieldLabel>
                <div className="flex gap-2">
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
              </Field>
            </FieldGroup>
          </CardAction>
        </CardHeader>
      </Card>

      {monthlyRecordQuery.isLoading || accountsQuery.isLoading ? (
        <LoadingCard label="Loading monthly data..." />
      ) : null}

      {isMissingMonthlyRecord ? (
        <Empty className="border border-border bg-card">
          <EmptyHeader>
            <EmptyTitle>No record for {selectedMonthYear}</EmptyTitle>
            <EmptyDescription>
              Create it to auto-add matching recurring costs and start tracking entries.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button type="button" onClick={() => createMonthlyMutation.mutate()}>
              Add New
            </Button>
          </EmptyContent>
        </Empty>
      ) : null}

      {!monthlyRecord && monthlyRecordQuery.error && !isMissingMonthlyRecord ? (
        <Alert variant="destructive">
          <AlertTitle>Monthly record failed to load</AlertTitle>
          <AlertDescription>{getErrorMessage(monthlyRecordQuery.error)}</AlertDescription>
        </Alert>
      ) : null}

      {monthlyRecord ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            {summaryCards.map((card) => (
              <Card key={card.label}>
                <CardHeader>
                  <CardDescription>{card.label}</CardDescription>
                  <CardTitle className="text-2xl">{card.value}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Account-wise totals</CardTitle>
              <CardDescription>
                Inflows and outflows are shown separately by account.
              </CardDescription>
              <CardAction className="static col-auto row-auto">
                <Input
                  aria-label="Search monthly entries"
                  className="md:w-80"
                  value={searchTerm}
                  placeholder="Search entries"
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </CardAction>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {monthlyRecord.summary.accountTotals.map((total) => (
                <Card key={total.accountId} size="sm">
                  <CardHeader>
                    <CardTitle>{total.accountName}</CardTitle>
                    <CardDescription>
                      Inflow: {formatCurrency(total.inflow)}
                      <br />
                      Outflow: {formatCurrency(total.outflow)}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
              {monthlyRecord.summary.accountTotals.length === 0 ? (
                <Empty className="border-0 md:col-span-3">
                  <EmptyHeader>
                    <EmptyTitle>No account activity yet.</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              ) : null}
            </CardContent>
          </Card>

          {activeAccounts.length === 0 ? (
            <Alert variant="destructive">
              <AlertTitle>No active accounts</AlertTitle>
              <AlertDescription>
                Add at least one active account before creating income or cost entries.
              </AlertDescription>
            </Alert>
          ) : null}

          <MonthlyEntryTables
            key={monthlyRecord.id}
            accounts={accountsQuery.data ?? []}
            monthlyRecord={monthlyRecord}
            searchTerm={searchTerm}
          />
        </>
      ) : null}
    </Page>
  );
};

const AccountsPage: React.FC = () => {
  const accountsQuery = useQuery({ queryFn: listAccounts, queryKey: ["accounts"] });

  return (
    <Page>
      {accountsQuery.isLoading ? <LoadingCard label="Loading accounts..." /> : null}
      <AccountsPanel accounts={accountsQuery.data ?? []} />
    </Page>
  );
};

const RecurringCostsPage: React.FC = () => {
  const accountsQuery = useQuery({ queryFn: listAccounts, queryKey: ["accounts"] });
  const recurringCostsQuery = useQuery({
    queryFn: listRecurringCosts,
    queryKey: ["recurring-costs"],
  });

  return (
    <Page>
      {accountsQuery.isLoading || recurringCostsQuery.isLoading ? (
        <LoadingCard label="Loading recurring costs..." />
      ) : null}
      <RecurringCostsPanel
        accounts={accountsQuery.data ?? []}
        configurations={recurringCostsQuery.data ?? []}
      />
    </Page>
  );
};

export { AccountsPage, HomePage, RecurringCostsPage };
