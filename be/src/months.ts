import { AppError } from "./errors.js";

const MONTH_NAMES = [
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

const monthYearPattern = new RegExp(`^(${MONTH_NAMES.join("|")}) \\d{4}$`);

type MonthYearParts = {
  monthIndex: number;
  year: number;
};

const assertMonthYear = (monthYear: string) => {
  if (!monthYearPattern.test(monthYear)) {
    throw new AppError("Month-year must use Month YYYY format.", 400);
  }
};

const parseMonthYear = (monthYear: string): MonthYearParts => {
  assertMonthYear(monthYear);

  const [monthName, yearText] = monthYear.split(" ");
  const monthIndex = MONTH_NAMES.findIndex((name) => name === monthName);
  const year = Number(yearText);

  if (monthIndex < 0 || !Number.isInteger(year)) {
    throw new AppError("Month-year must use Month YYYY format.", 400);
  }

  return { monthIndex, year };
};

const getFirstDayOfMonth = (monthYear: string) => {
  const { monthIndex, year } = parseMonthYear(monthYear);
  return new Date(Date.UTC(year, monthIndex, 1));
};

const doesRecurrenceApply = ({
  selectedMonthYear,
  startingMonthYear,
  recurrenceInterval,
  recurrenceUnit,
}: {
  selectedMonthYear: string;
  startingMonthYear: string;
  recurrenceInterval: number;
  recurrenceUnit: "MONTH" | "YEAR";
}) => {
  const selected = parseMonthYear(selectedMonthYear);
  const starting = parseMonthYear(startingMonthYear);
  const monthDiff =
    (selected.year - starting.year) * 12 +
    selected.monthIndex -
    starting.monthIndex;

  if (monthDiff < 0) {
    return false;
  }

  if (recurrenceUnit === "MONTH") {
    return monthDiff % recurrenceInterval === 0;
  }

  const yearDiff = selected.year - starting.year;
  return selected.monthIndex === starting.monthIndex && yearDiff % recurrenceInterval === 0;
};

export { MONTH_NAMES, assertMonthYear, doesRecurrenceApply, getFirstDayOfMonth };
