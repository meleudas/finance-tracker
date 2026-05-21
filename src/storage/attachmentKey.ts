import { randomUUID } from "node:crypto";
import { extname } from "node:path";

/** Object key for attachments: attachments/{userId}/{uuid}{ext} */
export function buildAttachmentStorageKey(userId: string, originalName: string): string {
  const extension = extname(originalName).toLowerCase();
  return `attachments/${userId}/${randomUUID()}${extension}`;
}
