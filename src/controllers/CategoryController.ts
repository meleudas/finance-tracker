import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/impl/CategoryService';
import type { CreateCategoryDto } from '../dtos/category/CreateCategory.dto';

export class CategoryController {
  private readonly categoryService: CategoryService;

  constructor(categoryService: CategoryService) {
    this.categoryService = categoryService;
  }

  /** POST /api/v1/categories */
  createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) return next({ status: 401, message: 'Unauthorized' });

      const dto: CreateCategoryDto = {
        userId,
        name: String(req.body.name),
        kind: req.body.kind as 'INCOME' | 'EXPENSE',
        parentId: req.body.parentId === undefined 
          ? undefined 
          : (req.body.parentId ? String(req.body.parentId) : null),
      };

      const category = await this.categoryService.createCategory(dto);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  };

  /** GET /api/v1/categories */
  getCategoryTree = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) return next({ status: 401, message: 'Unauthorized' });

      const tree = await this.categoryService.getCategoryTree(userId);
      res.status(200).json(tree);
    } catch (error) {
      next(error);
    }
  };

  /** GET /api/v1/categories/:id */
  getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) return next({ status: 401, message: 'Unauthorized' });

      const category = await this.categoryService.getCategoryById(userId, String(req.params.id));
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      res.status(200).json(category);
    } catch (error) {
      next(error);
    }
  };

  /** PUT /api/v1/categories/:id */
  updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) return next({ status: 401, message: 'Unauthorized' });

      const dto: UpdateCategoryDTO = {
        name: req.body.name !== undefined ? String(req.body.name) : undefined,
        parentId: req.body.parentId === undefined 
          ? undefined 
          : (req.body.parentId ? String(req.body.parentId) : null),
      };

      const updated = await this.categoryService.updateCategory(userId, String(req.params.id), dto);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  };

  /** DELETE /api/v1/categories/:id */
  deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) return next({ status: 401, message: 'Unauthorized' });

      await this.categoryService.deleteCategory(userId, String(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}