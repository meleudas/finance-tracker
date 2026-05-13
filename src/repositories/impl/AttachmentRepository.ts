import type { Attachment } from "../../generated/prisma/client";
import type {
  IAttachmentRepository,
  AttachmentUpsertParams,
} from "../interfaces/IAttachmentRepository";
import type { RequestOptions } from "../interfaces/IBaseRepository";
import { BaseRepository, type PrismaDelegate } from "./BaseRepository";
import { withAbortSignal } from "../../utils/withAbortSignal";

export class AttachmentRepository
  extends BaseRepository<Attachment>
  implements IAttachmentRepository
{
  protected get delegate(): PrismaDelegate {
    return this.prisma.attachment as unknown as PrismaDelegate;
  }

  async findByTransactionId(
    transactionId: string,
    options?: RequestOptions,
  ): Promise<Attachment[]> {
    return withAbortSignal(
      this.prisma.attachment.findMany({
        where: { transactionId, isDeleted: false },
      }),
      options?.signal,
    );
  }

  async upsert(params: AttachmentUpsertParams, options?: RequestOptions): Promise<Attachment> {
    return withAbortSignal(this.prisma.attachment.upsert(params), options?.signal);
  }
}
