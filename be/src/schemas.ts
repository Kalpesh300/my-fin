import { z } from "zod";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const monthYearSchema = z.string().regex(
  new RegExp(`^(${monthNames.join("|")}) \\d{4}$`),
  "Month-year must use Month YYYY format.",
);

const idParamsSchema = z.object({
  id: z.string().min(1),
});

const monthlyParamsSchema = z.object({
  monthlyRecordId: z.string().min(1),
});

const amountSchema = z.coerce.number().positive().finite();

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format.");

const accountSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional().default(""),
});

const recurringCostConfigurationSchema = z.object({
  accountId: z.string().min(1),
  amount: amountSchema,
  outflowType: z.string().trim().min(1),
  description: z.string().trim().min(1),
  recurrenceInterval: z.coerce.number().int().positive(),
  recurrenceUnit: z.enum(["MONTH", "YEAR"]),
  startingMonthYear: monthYearSchema,
});

const createMonthlyRecordSchema = z.object({
  monthYear: monthYearSchema,
});

const incomeEntrySchema = z.object({
  accountId: z.string().min(1),
  amount: amountSchema,
  source: z.string().trim().min(1),
  description: z.string().trim().min(1),
});

const costEntrySchema = z.object({
  accountId: z.string().min(1),
  amount: amountSchema,
  outflowType: z.string().trim().min(1),
  description: z.string().trim().min(1),
  paymentDate: dateSchema,
});

export {
  accountSchema,
  costEntrySchema,
  createMonthlyRecordSchema,
  idParamsSchema,
  incomeEntrySchema,
  monthlyParamsSchema,
  monthYearSchema,
  recurringCostConfigurationSchema,
};
