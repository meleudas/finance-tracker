import { DB_CONSTANTS } from "../constants/dbConstants";

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
