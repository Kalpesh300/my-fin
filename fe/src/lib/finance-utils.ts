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

const formatMonthYear = (date: Date) =>
  `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(amount);

const getCurrentMonthYear = () => formatMonthYear(new Date());

const getFirstDateInputForMonthYear = (monthYear: string) => {
  const [monthName, year] = monthYear.split(" ");
  const monthIndex = MONTH_NAMES.findIndex((name) => name === monthName);
  const month = String(monthIndex + 1).padStart(2, "0");
  return `${year}-${month}-01`;
};

const getMonthYearFromParts = (monthIndex: string, year: string) =>
  `${MONTH_NAMES[Number(monthIndex)]} ${year}`;

export {
  MONTH_NAMES,
  formatCurrency,
  formatMonthYear,
  getCurrentMonthYear,
  getFirstDateInputForMonthYear,
  getMonthYearFromParts,
};
