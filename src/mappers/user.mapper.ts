import type { User } from "../generated/prisma/client";
import type { UserResponse } from "../dtos/users/UserResponse.dto";

export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
