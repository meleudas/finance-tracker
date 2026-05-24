import {
  getStartOfMonth,
  getEndOfMonth,
  getFormattedDate,
} from "../../src/utils/helpers/dateHelpers";
import { DB_CONSTANTS } from "../../src/utils/constants/dbConstants";
import { getPaginationOptions } from "../../src/utils/helpers/paginationHelper";
import { withAbortSignal } from "../../src/utils/helpers/withAbortSignal";

describe("Helpers Logic (Unit)", () => {
  describe("withAbortSignal - Unit Tests", () => {
    it("має успішно повернути значення промісу, якщо signal не передано", async () => {
      const originalPromise = Promise.resolve("success_data");

      const result = await withAbortSignal(originalPromise);

      expect(result).toBe("success_data");
    });

    it("має успішно виконати проміс, якщо операція завершилась до скасування сигналу", async () => {
      const controller = new AbortController();
      const originalPromise = Promise.resolve(1000);

      const result = await withAbortSignal(originalPromise, controller.signal);

      expect(result).toBe(1000);
    });

    it("має миттєво відхилити проміс із AbortError, якщо сигнал вже був скасований на момент виклику", async () => {
      const controller = new AbortController();
      controller.abort();

      const originalPromise = new Promise((resolve) =>
        setTimeout(() => {
          resolve("late_data");
        }, 50),
      );

      await expect(withAbortSignal(originalPromise, controller.signal)).rejects.toThrow();

      try {
        await withAbortSignal(originalPromise, controller.signal);
      } catch (error: unknown) {
        expect(error).toHaveProperty("name", "AbortError");
      }
    });

    it("має перервати очікування та викинути AbortError, якщо сигнал скасовується під час виконання промісу", async () => {
      const controller = new AbortController();

      const longRunningPromise = new Promise((resolve) =>
        setTimeout(() => {
          resolve("db_data");
        }, 200),
      );

      const wrappedPromise = withAbortSignal(longRunningPromise, controller.signal);

      setTimeout(() => {
        controller.abort();
      }, 50);

      await expect(wrappedPromise).rejects.toThrow();

      try {
        await wrappedPromise;
      } catch (error: unknown) {
        expect(error).toHaveProperty("name", "AbortError");
      }
    });

    it("має коректно прокинути оригінальну помилку, якщо сам проміс завершився невдачею", async () => {
      const controller = new AbortController();
      const dbError = new Error("Connection timeout");
      const failingPromise = Promise.reject(dbError);

      await expect(withAbortSignal(failingPromise, controller.signal)).rejects.toThrow(
        "Connection timeout",
      );
    });

    it("обгортає non-Error rejection у Error", async () => {
      const controller = new AbortController();
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- перевіряємо обгортку non-Error rejection
      await expect(withAbortSignal(Promise.reject("fail"), controller.signal)).rejects.toThrow(
        "fail",
      );
    });
  });

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
