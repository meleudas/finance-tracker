import { Router } from 'express';
import { BudgetController } from '../../controllers/BudgetController';
import { authenticateJWT } from '../../middleware/amdms'; 

const router = Router();
const budgetCtrl = new BudgetController();

router.post('/', authenticateJWT, budgetCtrl.createBudget);
router.get('/progress', authenticateJWT, budgetCtrl.getBudgetsProgress);
router.put('/:id/limit', authenticateJWT, budgetCtrl.updateBudgetLimit);
router.delete('/:id', authenticateJWT, budgetCtrl.deleteBudget);

export default router;