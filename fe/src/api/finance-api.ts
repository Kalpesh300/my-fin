import { apiClient } from "@/lib/api-client";
import type {
  Account,
  AccountPayload,
  CostEntryPayload,
  IncomeEntryPayload,
  MonthlyRecord,
  RecurringCostConfiguration,
  RecurringCostPayload,
} from "@/types/finance";

const listAccounts = async () => {
  const response = await apiClient.get<Account[]>("/api/accounts");
  return response.data;
};

const createAccount = async (payload: AccountPayload) => {
  const response = await apiClient.post<Account>("/api/accounts", payload);
  return response.data;
};

const updateAccount = async (id: string, payload: AccountPayload) => {
  const response = await apiClient.put<Account>(`/api/accounts/${id}`, payload);
  return response.data;
};

const deleteAccount = async (id: string) => {
  const response = await apiClient.delete<Account>(`/api/accounts/${id}`);
  return response.data;
};

const listRecurringCosts = async () => {
  const response =
    await apiClient.get<RecurringCostConfiguration[]>("/api/recurring-costs");
  return response.data;
};

const createRecurringCost = async (payload: RecurringCostPayload) => {
  const response = await apiClient.post<RecurringCostConfiguration>(
    "/api/recurring-costs",
    payload,
  );
  return response.data;
};

const updateRecurringCost = async (id: string, payload: RecurringCostPayload) => {
  const response = await apiClient.put<RecurringCostConfiguration>(
    `/api/recurring-costs/${id}`,
    payload,
  );
  return response.data;
};

const deleteRecurringCost = async (id: string) => {
  const response = await apiClient.delete<RecurringCostConfiguration>(
    `/api/recurring-costs/${id}`,
  );
  return response.data;
};

const fetchMonthlyRecord = async (monthYear: string) => {
  const response = await apiClient.get<MonthlyRecord>("/api/monthly-records", {
    params: { monthYear },
  });
  return response.data;
};

const createMonthlyRecord = async (monthYear: string) => {
  const response = await apiClient.post<MonthlyRecord>("/api/monthly-records", {
    monthYear,
  });
  return response.data;
};

const deleteMonthlyRecord = async (id: string) => {
  await apiClient.delete(`/api/monthly-records/${id}`);
};

const createIncomeEntry = async (monthlyRecordId: string, payload: IncomeEntryPayload) => {
  const response = await apiClient.post<MonthlyRecord>(
    `/api/monthly-records/${monthlyRecordId}/income-entries`,
    payload,
  );
  return response.data;
};

const updateIncomeEntry = async (id: string, payload: IncomeEntryPayload) => {
  const response = await apiClient.put<MonthlyRecord>(`/api/income-entries/${id}`, payload);
  return response.data;
};

const deleteIncomeEntry = async (id: string) => {
  const response = await apiClient.delete<MonthlyRecord>(`/api/income-entries/${id}`);
  return response.data;
};

const updateRecurringCostInstance = async (id: string, payload: CostEntryPayload) => {
  const response = await apiClient.put<MonthlyRecord>(
    `/api/recurring-cost-instances/${id}`,
    payload,
  );
  return response.data;
};

const deleteRecurringCostInstance = async (id: string) => {
  const response = await apiClient.delete<MonthlyRecord>(
    `/api/recurring-cost-instances/${id}`,
  );
  return response.data;
};

const createOtherCostEntry = async (monthlyRecordId: string, payload: CostEntryPayload) => {
  const response = await apiClient.post<MonthlyRecord>(
    `/api/monthly-records/${monthlyRecordId}/other-cost-entries`,
    payload,
  );
  return response.data;
};

const updateOtherCostEntry = async (id: string, payload: CostEntryPayload) => {
  const response = await apiClient.put<MonthlyRecord>(
    `/api/other-cost-entries/${id}`,
    payload,
  );
  return response.data;
};

const deleteOtherCostEntry = async (id: string) => {
  const response = await apiClient.delete<MonthlyRecord>(`/api/other-cost-entries/${id}`);
  return response.data;
};

export {
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
};
