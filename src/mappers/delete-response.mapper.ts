import { deleteResponseSchema, type DeleteResponseDto } from "../dtos/common/DeleteResponse.dto";
import { toIsoString } from "./prisma-format.utils";

export function toDeleteResponse(entity: {
  id: string;
  deletedAt: Date | null;
}): DeleteResponseDto {
  return deleteResponseSchema.parse({
    id: entity.id,
    deletedAt: entity.deletedAt ? toIsoString(entity.deletedAt) : toIsoString(new Date()),
    isDeleted: true,
  });
}
