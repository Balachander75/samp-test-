/**
 * Navneet SAMP ERP Business Year & Season Year System.
 *
 * Business Rules:
 * 1. Business Year runs between October 1 and September 30 (Oct – Sep cycle).
 *    - Oct 1, 2025 to Sep 30, 2026 => Business Year 2025-2026.
 *    - Oct 1, 2026 to Sep 30, 2027 => Business Year 2026-2027.
 *
 * 2. Dynamic Year-by-Year calculation:
 *    Automatically rolls over to the next business year when the calendar enters October.
 *
 * 3. Season Year Calculation:
 *    Based on the active business year start year, the user is offered the current
 *    start year plus the next 2 years (e.g., for BY 2026-2027 => 2026, 2027, 2028).
 */

export interface BusinessYearInfo {
  startYear: number;
  endYear: number;
  businessYearStr: string; // e.g. "2026-2027"
  label: string; // e.g. "FY 2026-2027"
  seasonYearOptions: string[]; // e.g. ["2026", "2027", "2028"]
  businessYearOptions: string[]; // e.g. ["2026-2027", "2025-2026", "2027-2028", "2028-2029"]
}

export function getBusinessYearInfo(dateInput?: Date | string | null): BusinessYearInfo {
  const d = dateInput
    ? (typeof dateInput === "string" ? new Date(dateInput) : dateInput)
    : new Date();

  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const month = validDate.getMonth(); // 0-indexed: Jan=0...Sep=8, Oct=9, Nov=10, Dec=11
  const calYear = validDate.getFullYear();

  // If October or later (month >= 9), business year starts this calendar year.
  // Otherwise, it started last calendar year (calYear - 1).
  const startYear = month >= 9 ? calYear : calYear - 1;
  const endYear = startYear + 1;
  const businessYearStr = `${startYear}-${endYear}`;

  // Season year options: current business year start + 2 future years (e.g. 2026, 2027, 2028)
  const seasonYearOptions = [
    String(startYear),
    String(startYear + 1),
    String(startYear + 2),
  ];

  // Business year select options for programs (current, previous, next 2)
  const businessYearOptions = [
    `${startYear}-${endYear}`,
    `${startYear - 1}-${startYear}`,
    `${startYear + 1}-${startYear + 2}`,
    `${startYear + 2}-${startYear + 3}`,
  ];

  return {
    startYear,
    endYear,
    businessYearStr,
    label: `FY ${businessYearStr}`,
    seasonYearOptions,
    businessYearOptions,
  };
}

export function getCurrentBusinessYear(): string {
  return getBusinessYearInfo().businessYearStr;
}

export function getSeasonYearOptions(): string[] {
  return getBusinessYearInfo().seasonYearOptions;
}

export function getBusinessYearForDate(dateStr?: string | null): string {
  if (!dateStr) return getCurrentBusinessYear();
  return getBusinessYearInfo(dateStr).businessYearStr;
}
