import { Router } from 'express';
import { CurrencyController } from '../../controllers/CurrencyController';
import { CurrencyService } from '../../services/impl/CurrencyService';
import { validate } from '../../middleware/validate';
import { 
  CurrencyCodeParamSchema, 
  CurrencyIdParamSchema 
} from '../../validators/currency.validator';

const router = Router();

// 🔧 Dependency Injection
const currencyService = new CurrencyService();
const currencyCtrl = new CurrencyController(currencyService);

// 🛣️ Маршрути
// ⚠️ Порядок критичний: специфічніші маршрути мають йти ПЕРЕД узагальненими
// Валюти — публічний довідник, тому auth не потрібен (за архітектурою)

// 1. GET /api/v1/currencies/code/:code — пошук за ISO-кодом (напр., /code/UAH)
router.get(
  '/code/:code',
  validate(CurrencyCodeParamSchema), // ✅ Валідує req.params.code
  currencyCtrl.getCurrencyByCode,
);

// 2. GET /api/v1/currencies/:id — пошук за UUID
router.get(
  '/:id',
  validate(CurrencyIdParamSchema), // ✅ Валідує req.params.id
  currencyCtrl.getCurrencyById,
);

// 3. GET /api/v1/currencies — список всіх валют
router.get('/', currencyCtrl.getAllCurrencies);

export default router;