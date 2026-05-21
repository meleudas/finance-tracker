import type { Request, Response } from "express";
import type { ICategoryService } from "../services/interfaces/ICategoryService";
import { getServiceContext } from "../http/requestContext";
import { sendData } from "../http/response";
import { UnauthorizedError } from "../utils/errors/securityErrors";
import { toCategoryResponse, toCategoryTreeResponse } from "../mappers/category.mapper";
import { toDeleteResponse } from "../mappers/delete-response.mapper";
import type { CreateCategoryDto } from "../dtos/category/CreateCategory.dto";
import type { UpdateCategoryDto } from "../dtos/category/UpdateCategory.dto";

function getUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) {
    throw new UnauthorizedError();
  }
  return userId;
}

export class CategoryController {
  constructor(private readonly categoryService: ICategoryService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const tree = await this.categoryService.getCategoryTree(getUserId(req), getServiceContext(req));
    sendData(res, req, toCategoryTreeResponse(tree));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { params } = req.validated as { params: { id: string } };
    const category = await this.categoryService.getCategoryById(
      getUserId(req),
      params.id,
      getServiceContext(req),
    );
    sendData(res, req, toCategoryResponse(category));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const { body } = req.validated as { body: CreateCategoryDto };
    const category = await this.categoryService.createCategory(
      getUserId(req),
      body,
      getServiceContext(req),
    );
    sendData(res, req, toCategoryResponse(category), 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { params, body } = req.validated as {
      params: { id: string };
      body: UpdateCategoryDto;
    };
    const category = await this.categoryService.updateCategory(
      getUserId(req),
      params.id,
      body,
      getServiceContext(req),
    );
    sendData(res, req, toCategoryResponse(category));
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const { params } = req.validated as { params: { id: string } };
    await this.categoryService.deleteCategory(getUserId(req), params.id, getServiceContext(req));
    sendData(res, req, toDeleteResponse({ id: params.id, deletedAt: new Date() }));
  };
}
