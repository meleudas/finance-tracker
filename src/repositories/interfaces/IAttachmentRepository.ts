import type { Attachment } from "../../generated/prisma/client";
import type { IBaseRepository, RequestOptions } from "./IBaseRepository";

export interface AttachmentUpsertParams {
  where: { id: string };
  create: {
    transactionId: string;
    storageKey: string;
    mimeType: string;
    originalName: string;
  };
  update: {
    storageKey?: string;
    mimeType?: string;
    originalName?: string;
  };
}

export interface IAttachmentRepository extends IBaseRepository<Attachment> {
  findByTransactionId(transactionId: string, options?: RequestOptions): Promise<Attachment[]>;
  upsert(params: AttachmentUpsertParams, options?: RequestOptions): Promise<Attachment>;
}
