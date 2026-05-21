import type { Attachment } from "../generated/prisma/client";
import {
  AttachmentResponseSchema,
  type AttachmentResponseDto,
} from "../dtos/attachment/AttachmentResponse.dto";
import {
  attachmentWithDownloadUrlResponseSchema,
  type AttachmentWithDownloadUrlResponseDto,
} from "../dtos/attachment/AttachmentDownload.dto";
import { toIsoString } from "./prisma-format.utils";

function toAttachmentFields(attachment: Attachment) {
  return {
    id: attachment.id,
    transactionId: attachment.transactionId,
    mimeType: attachment.mimeType,
    originalName: attachment.originalName,
    createdAt: toIsoString(attachment.createdAt),
    updatedAt: toIsoString(attachment.updatedAt),
    deletedAt: attachment.deletedAt ? toIsoString(attachment.deletedAt) : null,
    isDeleted: attachment.isDeleted,
  };
}

export function toAttachmentResponse(attachment: Attachment): AttachmentResponseDto {
  return AttachmentResponseSchema.parse(toAttachmentFields(attachment));
}

export function toAttachmentWithDownloadUrl(
  attachment: Attachment,
  downloadUrl: string,
  expiresInSeconds: number,
): AttachmentWithDownloadUrlResponseDto {
  return attachmentWithDownloadUrlResponseSchema.parse({
    ...toAttachmentFields(attachment),
    downloadUrl,
    expiresInSeconds,
  });
}
