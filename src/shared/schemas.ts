import { z } from 'zod';

export const triggerSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('cron'),
    schedule: z.string().min(1),
    timezone: z.string().optional(),
  }),
  z.object({
    type: z.literal('webhook'),
    event: z.string().min(1),
    source: z.string().min(1),
  }),
  z.object({
    type: z.literal('manual'),
  }),
]);

export const toolStepSchema = z.object({
  id: z.string().min(1),
  type: z.literal('tool'),
  tool: z.string().min(1),
  params: z.record(z.unknown()),
  condition: z.string().optional(),
});

export const agentStepSchema = z.object({
  id: z.string().min(1),
  type: z.literal('agent'),
  agentTask: z.enum([
    'extraction',
    'classification',
    'planning',
    'code_review',
    'security_analysis',
    'workflow_compilation',
    'error_recovery',
  ]),
  prompt: z.string().min(1),
  tools: z.array(z.string()).optional(),
  outputSchema: z.unknown().optional(),
  condition: z.string().optional(),
});

export const stepSchema = z.discriminatedUnion('type', [toolStepSchema, agentStepSchema]);

export const workflowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  trigger: triggerSchema,
  steps: z.array(stepSchema),
  errorHandling: z
    .object({
      retry: z
        .object({
          maxAttempts: z.number().int().positive(),
          backoff: z.enum(['linear', 'exponential']),
        })
        .optional(),
      notify: z.array(z.string()).optional(),
    })
    .optional(),
  enabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type WorkflowInput = z.infer<typeof workflowSchema>;

