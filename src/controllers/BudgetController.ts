import { Request, Response, NextFunction } from 'express';
import { BudgetService } from '../services/impl/BudgetService';
import type { CreateBudgetDto } from '../dtos/budget/CreateBudget.dto';

export class BudgetController {
  private readonly budgetService: BudgetService;

  constructor(budgetService?: BudgetService) {
    this.budgetService = budgetService ?? new BudgetService();
  }

  /** POST /api/v1/budgets */
  createBudget = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) return next({ status: 401, message: 'Unauthorized' });

      const dto: CreateBudgetDto = {
        userId,
        accountId: String(req.body.accountId),
        currencyId: String(req.body.currencyId),
        categoryId: req.body.categoryId ? String(req.body.categoryId) : null,
        name: String(req.body.name).trim(),
        periodStart: new Date(req.body.periodStart),
        periodEnd: new Date(req.body.periodEnd),
        limitAmount: Number(req.body.limitAmount),
      };

      if (isNaN(dto.periodStart.getTime()) || isNaN(dto.periodEnd.getTime())) {
        return next({ status: 400, message: 'Invalid date format for periodStart or periodEnd' });
      }

      const budget = await this.budgetService.createBudget(dto);
      res.status(201).json(budget);
    } catch (error) {
      next(error);
    }
  };

  /** PUT /api/v1/budgets/:id/limit */
  updateBudgetLimit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) return next({ status: 401, message: 'Unauthorized' });

      const budgetId = String(req.params.id);
      const dto: UpdateBudgetLimitDTO = { limitAmount: Number(req.body.limitAmount) };

      const updated = await this.budgetService.updateBudgetLimit(userId, budgetId, dto);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  };

  /** DELETE /api/v1/budgets/:id */
  deleteBudget = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) return next({ status: 401, message: 'Unauthorized' });

      await this.budgetService.deleteBudget(userId, String(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  /** GET /api/v1/budgets/progress */
  getBudgetsProgress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) return next({ status: 401, message: 'Unauthorized' });

      const targetDate = req.query.date 
        ? new Date(String(req.query.date)) 
        : new Date();

      if (isNaN(targetDate.getTime())) {
        return next({ status: 400, message: 'Invalid query parameter: date' });
      }

      const progress = await this.budgetService.getBudgetsProgress(userId, targetDate);
      res.status(200).json(progress);
    } catch (error) {
      next(error);
    }
  };
}