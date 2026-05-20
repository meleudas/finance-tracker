import { Router } from 'express';
import { CategoryController } from '../../controllers/CategoryController';
import { CategoryService } from '../../services/impl/CategoryService';
import { CategoryRepository } from '../../repositories/impl/CategoryRepository';
import { authenticateJWT } from '../../middleware/amdms';
import { validate } from '../../middleware/validate';
import { CreateCategorySchema, UpdateCategorySchema } from '../../validators/category.validator';

const router = Router();

const categoryRepo = new CategoryRepository();
const categoryService = new CategoryService(categoryRepo);
const categoryCtrl = new CategoryController(categoryService);

router.post('/', authenticateJWT, validate(CreateCategorySchema), categoryCtrl.createCategory);
router.get('/', authenticateJWT, categoryCtrl.getCategoryTree);
router.get('/:id', authenticateJWT, categoryCtrl.getCategoryById);
router.put('/:id', authenticateJWT, validate(UpdateCategorySchema), categoryCtrl.updateCategory);
router.delete('/:id', authenticateJWT, categoryCtrl.deleteCategory);

export default router;