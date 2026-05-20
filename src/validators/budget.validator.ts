import { z } from 'zod';

export const CreateBudgetSchema = z
  .object({
    accountId: z.string().uuid('Invalid accountId format'),
    currencyId: z.string().uuid('Invalid currencyId format'),
    categoryId: z.string().uuid('Invalid categoryId format').nullable().optional(),
    name: z.string().trim().min(1, 'Budget name is required').max(100, 'Name too long'),
    
    periodStart: z.coerce.date({ message: 'Invalid periodStart date format' }),
    periodEnd: z.coerce.date({ message: 'Invalid periodEnd date format' }),
    
    limitAmount: z.coerce.number({ message: 'Limit amount must be a valid number' })
      .positive('Limit amount must be greater than zero'),
  })
  .refine(
    (data) => data.periodStart < data.periodEnd,
    { message: 'periodStart must be strictly before periodEnd', path: ['periodEnd'] }
  );

export const UpdateBudgetLimitSchema = z.object({
  limitAmount: z.coerce.number({ message: 'Limit amount must be a valid number' })
    .positive('Limit amount must be greater than zero'),
});

export const BudgetProgressQuerySchema = z.object({
  date: z.coerce.date({ message: 'Invalid date format. Use YYYY-MM-DD' }).optional(),
});

export type CreateBudgetInput = z.infer<typeof CreateBudgetSchema>;
export type UpdateBudgetLimitInput = z.infer<typeof UpdateBudgetLimitSchema>;
export type BudgetProgressQuery = z.infer<typeof BudgetProgressQuerySchema>;