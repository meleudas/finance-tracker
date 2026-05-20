import request from 'supertest';
import express from 'express';
import { BudgetController } from '../../../src/controllers/BudgetController';
import type { BudgetService } from '../../../src/services/impl/BudgetService';
import { validate } from '../../../src/middleware/validate';
import { CreateBudgetSchema, UpdateBudgetLimitSchema } from '../../../src/validators/budget.validator';
import { AppError } from '../../../src/utils/errors/AppError';

describe('BudgetController (Integration)', () => {
  let app: express.Application;
  let mockService: jest.Mocked<BudgetService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockService = {
      createBudget: jest.fn(),
      updateBudgetLimit: jest.fn(),
      deleteBudget: jest.fn(),
      getBudgetsProgress: jest.fn(),
    } as unknown as jest.Mocked<BudgetService>;

    const controller = new BudgetController(mockService);
    app = express();
    app.use(express.json());

    app.use('/api/v1/budgets', (req, _, next) => {
      req.user = { id: 'user_test_123' };
      next();
    });

    app.post('/api/v1/budgets', validate(CreateBudgetSchema), controller.createBudget);
    app.put('/api/v1/budgets/:id/limit', validate(UpdateBudgetLimitSchema), controller.updateBudgetLimit);
    app.delete('/api/v1/budgets/:id', controller.deleteBudget);
    app.get('/api/v1/budgets/progress', controller.getBudgetsProgress);

    app.use((err: Error | AppError, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const isAppError = err instanceof AppError;
      const statusCode = isAppError ? err.statusCode : 500;
      const errorCode = isAppError ? err.code : 'INTERNAL_ERROR'; 
      const message = isAppError ? err.message : 'Internal server error';
      
      res.status(statusCode).json({ error: { code: errorCode, message } });
    });
  });

  describe('POST /api/v1/budgets', () => {
    it('should create budget and return 201', async () => {
      const mockBudget = { id: 'bud_1', userId: 'user_test_123', name: 'Test' };
      mockService.createBudget.mockResolvedValue(mockBudget as any);

      const res = await request(app)
        .post('/api/v1/budgets')
        .send({
          accountId: '550e8400-e29b-41d4-a716-446655440000',
          currencyId: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Test Budget',
          periodStart: '2026-05-01',
          periodEnd: '2026-05-31',
          limitAmount: 1000,
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('bud_1');
    });

    it('should return 400 when validation fails', async () => {
      const res = await request(app).post('/api/v1/budgets').send({});
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockService.createBudget).not.toHaveBeenCalled();
    });
  });
});