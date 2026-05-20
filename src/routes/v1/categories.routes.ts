import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import {
  CreateCategoryRequestValidator,
  DeleteCategoryRequestValidator,
  GetCategoryRequestValidator,
  ListCategoriesRequestValidator,
  UpdateCategoryRequestValidator,
} from "../../validators/category.validator";
import { categoryController } from "../../container";

const router = Router();

router.get("/", ListCategoriesRequestValidator, asyncHandler(categoryController.list));
router.post("/", CreateCategoryRequestValidator, asyncHandler(categoryController.create));
router.get("/:id", GetCategoryRequestValidator, asyncHandler(categoryController.getById));
router.patch("/:id", UpdateCategoryRequestValidator, asyncHandler(categoryController.update));
router.delete("/:id", DeleteCategoryRequestValidator, asyncHandler(categoryController.remove));

export default router;
