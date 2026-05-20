import { z } from 'zod';

export const CreateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Category name is required')
    .max(100, 'Category name is too long'),
    
  kind: z.enum(['INCOME', 'EXPENSE'], {
    message: 'Kind must be either INCOME or EXPENSE',
  }),
  
  parentId: z.string().uuid('Invalid parentId format').nullable().optional(),
});

export const UpdateCategorySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name cannot be empty')
      .max(100, 'Name is too long')
      .optional(),
      
    parentId: z.string().uuid('Invalid parentId format').nullable().optional(),
  })
  .strict();

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;