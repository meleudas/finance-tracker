import { DB_CONSTANTS } from "./constants";

export interface PaginationOptions {
  skip: number;
  take: number;
}

export const getPaginationOptions = (page = 1, limit = 20): PaginationOptions => {
  const intPage = Math.floor(Math.max(1, page));
  const intLimit = Math.floor(Math.max(1, limit));
  const take = Math.min(intLimit, DB_CONSTANTS.MAX_PAGE_SIZE);
  const skip = (intPage - 1) * take;
  return { skip, take };
};

export const getStartOfMonth = (date: Date = new Date()): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const getEndOfMonth = (date: Date = new Date()): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};

export const getFormattedDate = (date: Date = new Date()): string => {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
