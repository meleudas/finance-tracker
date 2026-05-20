import request from 'supertest';
import express from 'express';
import { CategoryController } from '../../../src/controllers/CategoryController';
import type { CategoryService } from '../../../src/services/impl/CategoryService';
import { ConflictError } from '../../../src/utils/errors/СlientErrors';

describe('CategoryController', () => {
  let app: express.Application;
  let mockService: jest.Mocked<CategoryService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockService = {
      createCategory: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn(),
      getCategoryTree: jest.fn(),
      getCategoryById: jest.fn(),
    } as unknown as jest.Mocked<CategoryService>;

    const controller = new CategoryController(mockService);
    app = express();
    app.use(express.json());

    app.use('/api/v1/categories', (req, _res, next) => {
      req.user = { id: 'user_test_123' };
      next();
    });

    app.post('/api/v1/categories', controller.createCategory);
    app.get('/api/v1/categories', controller.getCategoryTree);
    app.get('/api/v1/categories/:id', controller.getCategoryById);
    app.put('/api/v1/categories/:id', controller.updateCategory);
    app.delete('/api/v1/categories/:id', controller.deleteCategory);

    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      res.status(err.statusCode || 500).json({ error: { code: err.errorCode || 'INTERNAL', message: err.message } });
    });
  });

  describe('POST /api/v1/categories', () => {
    it('should create category and return 201', async () => {
      mockService.createCategory.mockResolvedValue({ id: 'cat_1', name: 'Food' } as any);

      const res = await request(app)
        .post('/api/v1/categories')
        .send({ name: 'Food', kind: 'EXPENSE', parentId: null });

      expect(res.status).toBe(201);
      expect(mockService.createCategory).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user_test_123', name: 'Food', kind: 'EXPENSE' })
      );
    });
  });

  describe('GET /api/v1/categories', () => {
    it('should return category tree', async () => {
      mockService.getCategoryTree.mockResolvedValue([{ id: 'cat_1', children: [] }] as any);

      const res = await request(app).get('/api/v1/categories');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe('GET /api/v1/categories/:id', () => {
    it('should return 200 with category', async () => {
      mockService.getCategoryById.mockResolvedValue({ id: 'cat_1' } as any);

      const res = await request(app).get('/api/v1/categories/cat_1');

      expect(res.status).toBe(200);
    });

    it('should return 404 when service returns null', async () => {
      mockService.getCategoryById.mockResolvedValue(null);

      const res = await request(app).get('/api/v1/categories/cat_missing');

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/categories/:id', () => {
    it('should return 204 on successful deletion', async () => {
      mockService.deleteCategory.mockResolvedValue(undefined);

      const res = await request(app).delete('/api/v1/categories/cat_1');

      expect(res.status).toBe(204);
    });

    it('should forward ConflictError as 409', async () => {
      mockService.deleteCategory.mockRejectedValue(new ConflictError('Has transactions'));

      const res = await request(app).delete('/api/v1/categories/cat_1');

      expect(res.status).toBe(409);
    });
  });
});