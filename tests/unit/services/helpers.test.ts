import {
  getPaginationOptions,
  getStartOfMonth,
  getEndOfMonth,
  getFormattedDate,
} from "C:/Users/user/finance-tracker/src/utils";
import { DB_CONSTANTS } from "C:/Users/user/finance-tracker/src/utils";

describe("Helpers Logic (Unit)", () => {
  describe("getPaginationOptions", () => {
    it("should calculate skip and take for the first page", () => {
      const result = getPaginationOptions(1, 10);
      expect(result).toEqual({ skip: 0, take: 10 });
    });

    it("should calculate skip correctly for page 3", () => {
      const result = getPaginationOptions(3, 10);
      expect(result.skip).toBe(20);
    });

    it('should clamp "take" to MAX_PAGE_SIZE', () => {
      const result = getPaginationOptions(1, DB_CONSTANTS.MAX_PAGE_SIZE + 100);
      expect(result.take).toBe(DB_CONSTANTS.MAX_PAGE_SIZE);
    });

    it("should use default values if arguments are missing", () => {
      const result = getPaginationOptions();
      expect(result).toEqual({ skip: 0, take: 20 });
    });
  });

  describe("Date Range Helpers", () => {
    const fixedDate = new Date(2026, 4, 15);
    it("getStartOfMonth should return the 1st day of the month", () => {
      const start = getStartOfMonth(fixedDate);
      expect(start.getFullYear()).toBe(2026);
      expect(start.getMonth()).toBe(4);
      expect(start.getDate()).toBe(1);
      expect(start.getHours()).toBe(0);
    });

    it("getEndOfMonth should return the last ms of the last day", () => {
      const end = getEndOfMonth(fixedDate);
      expect(end.getFullYear()).toBe(2026);
      expect(end.getMonth()).toBe(4);
      expect(end.getDate()).toBe(31);
      expect(end.getMilliseconds()).toBe(999);
    });
  });

  describe("getFormattedDate", () => {
    it("should format date as YYYY-MM-DD", () => {
      const date = new Date(2026, 0, 5);
      expect(getFormattedDate(date)).toBe("2026-01-05");
    });

    it("should pad single digit month and day with zeros", () => {
      const date = new Date(2026, 8, 9);
      expect(getFormattedDate(date)).toBe("2026-09-09");
    });

    it("should use current date by default", () => {
      const result = getFormattedDate();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
