import { z } from 'zod';

export const parameterSchema = z.object({
  endpoint: z.string().url('Please enter a valid URL.'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  featureFlag: z.string().min(2, 'Feature flag must be at least 2 characters.'),
  requestId: z.string().min(6, 'Request ID must be at least 6 characters.'),
  notes: z.string().min(10, 'Notes must be at least 10 characters.').max(280, 'Notes cannot exceed 280 characters.'),
  includeHeaders: z.boolean(),
  retryCount: z.coerce.number().int().min(0).max(5),
  timeoutMs: z.coerce.number().int().min(100).max(30000),
});

export type ParameterValues = z.infer<typeof parameterSchema>;
