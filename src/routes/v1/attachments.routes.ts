import { Router } from "express";
import { attachmentController } from "../../container";
import { asyncHandler } from "../../middleware/asyncHandler";
import { handleMulterError, uploadAttachmentMiddleware } from "../../middleware/uploadAttachment";
import {
  ConfirmPresignedUploadRequestValidator,
  DeleteAttachmentRequestValidator,
  GetAttachmentDownloadUrlRequestValidator,
  GetAttachmentRequestValidator,
  ListAttachmentsRequestValidator,
  PresignedUploadUrlRequestValidator,
  UpdateAttachmentRequestValidator,
  UploadAttachmentParamsValidator,
} from "../../validators/attachments.validator";

const router = Router({ mergeParams: true });

router.get("/", ListAttachmentsRequestValidator, asyncHandler(attachmentController.list));

router.post(
  "/presigned-upload-url",
  PresignedUploadUrlRequestValidator,
  asyncHandler(attachmentController.createPresignedUploadUrl),
);

router.post(
  "/confirm",
  ConfirmPresignedUploadRequestValidator,
  asyncHandler(attachmentController.confirmPresignedUpload),
);

router.post(
  "/",
  UploadAttachmentParamsValidator,
  uploadAttachmentMiddleware,
  handleMulterError,
  asyncHandler(attachmentController.upload),
);

router.get(
  "/:id/download-url",
  GetAttachmentDownloadUrlRequestValidator,
  asyncHandler(attachmentController.getDownloadUrl),
);

router.get("/:id", GetAttachmentRequestValidator, asyncHandler(attachmentController.getById));

router.patch("/:id", UpdateAttachmentRequestValidator, asyncHandler(attachmentController.update));

router.delete("/:id", DeleteAttachmentRequestValidator, asyncHandler(attachmentController.remove));

export default router;
