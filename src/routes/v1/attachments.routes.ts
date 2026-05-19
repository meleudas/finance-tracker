import { Router } from "express";
import { attachmentController } from "../../container";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireUser } from "../../middleware/requireUser";
import { validate } from "../../middleware/validate";
import { handleMulterError, uploadAttachmentMiddleware } from "../../middleware/uploadAttachment";
import {
  DeleteAttachmentRequestValidator,
  GetAttachmentDownloadUrlRequestValidator,
  GetAttachmentRequestValidator,
  ListAttachmentsRequestValidator,
  PresignedUploadUrlRequestValidator,
  UpdateAttachmentRequestValidator,
  UploadAttachmentParamsValidator,
} from "../../validators/attachments.validator";

const router = Router({ mergeParams: true });

router.use(requireUser);

router.get("/", validate(ListAttachmentsRequestValidator), asyncHandler(attachmentController.list));

router.post(
  "/",
  validate(UploadAttachmentParamsValidator),
  uploadAttachmentMiddleware,
  handleMulterError,
  asyncHandler(attachmentController.upload),
);

router.post(
  "/presigned-upload-url",
  validate(PresignedUploadUrlRequestValidator),
  asyncHandler(attachmentController.createPresignedUploadUrl),
);

router.get(
  "/:id/download-url",
  validate(GetAttachmentDownloadUrlRequestValidator),
  asyncHandler(attachmentController.getDownloadUrl),
);

router.get(
  "/:id",
  validate(GetAttachmentRequestValidator),
  asyncHandler(attachmentController.getById),
);

router.patch(
  "/:id",
  validate(UpdateAttachmentRequestValidator),
  asyncHandler(attachmentController.update),
);

router.delete(
  "/:id",
  validate(DeleteAttachmentRequestValidator),
  asyncHandler(attachmentController.remove),
);

export default router;
