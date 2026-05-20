import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import {
  CreateReportJobRequestValidator,
  DownloadReportJobRequestValidator,
  GetFinancialReportRequestValidator,
  GetReportJobRequestValidator,
} from "../../validators/reports.validator";
import { reportController, reportJobController } from "../../container";

const router = Router();

router.get("/", GetFinancialReportRequestValidator, asyncHandler(reportController.getReport));

router.post("/jobs", CreateReportJobRequestValidator, asyncHandler(reportJobController.createJob));
router.get("/jobs/:id", GetReportJobRequestValidator, asyncHandler(reportJobController.getJob));
router.get(
  "/jobs/:id/download",
  DownloadReportJobRequestValidator,
  asyncHandler(reportJobController.downloadPdf),
);

export default router;
