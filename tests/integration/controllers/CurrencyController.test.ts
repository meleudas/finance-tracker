import request from 'supertest';
import express from 'express';
import { CurrencyController } from '../../../src/controllers/CurrencyController';
import type { CurrencyService } from '../../../src/services/impl/CurrencyService';
import { NotFoundError } from '../../../src/utils/errors/СlientErrors';

describe('CurrencyController', () => {
  let app: express.Application;
  let mockService: jest.Mocked<CurrencyService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockService = {
      getAllCurrencies: jest.fn(),
      getCurrencyByCode: jest.fn(),
      getCurrencyById: jest.fn(),
    } as unknown as jest.Mocked<CurrencyService>;

    const controller = new CurrencyController(mockService);
    app = express();
    app.use(express.json());

    // 💵 Валюти — публічний довідник, auth не потрібен
    app.get('/api/v1/currencies', controller.getAllCurrencies);
    app.get('/api/v1/currencies/code/:code', controller.getCurrencyByCode);
    app.get('/api/v1/currencies/:id', controller.getCurrencyById);

    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      res.status(err.statusCode || 500).json({ error: { code: err.errorCode || 'INTERNAL', message: err.message } });
    });
  });

  describe('GET /api/v1/currencies', () => {
    it('should return list of currencies', async () => {
      mockService.getAllCurrencies.mockResolvedValue([{ code: 'UAH' }, { code: 'USD' }] as any);

      const res = await request(app).get('/api/v1/currencies');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  describe('GET /api/v1/currencies/code/:code', () => {
    it('should return currency by code', async () => {
      mockService.getCurrencyByCode.mockResolvedValue({ code: 'EUR', name: 'Euro' } as any);

      const res = await request(app).get('/api/v1/currencies/code/EUR');

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('EUR');
      expect(mockService.getCurrencyByCode).toHaveBeenCalledWith('EUR');
    });

    it('should forward 404 from service', async () => {
      mockService.getCurrencyByCode.mockRejectedValue(new NotFoundError('Currency is not found'));

      const res = await request(app).get('/api/v1/currencies/code/XXX');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/currencies/:id', () => {
    it('should return currency by UUID', async () => {
      mockService.getCurrencyById.mockResolvedValue({ id: 'uuid_1' } as any);

      const res = await request(app).get('/api/v1/currencies/uuid_1');

      expect(res.status).toBe(200);
      expect(mockService.getCurrencyById).toHaveBeenCalledWith('uuid_1');
    });
  });
});