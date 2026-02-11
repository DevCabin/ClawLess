export interface Workflow {
  id: string;
  name: string;
  description?: string;
  trigger: Trigger;
  steps: Step[];
  errorHandling?: ErrorHandling;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Trigger =
  | { type: 'cron'; schedule: string; timezone?: string }
  | { type: 'webhook'; event: string; source: string }
  | { type: 'manual' };

export type Step = ToolStep | AgentStep;

export interface ToolStep {
  id: string;
  type: 'tool';
  tool: string;
  params: Record<string, unknown>;
  condition?: string;
}

export interface AgentStep {
  id: string;
  type: 'agent';
  agentTask: TaskType;
  prompt: string;
  tools?: string[];
  outputSchema?: unknown;
  condition?: string;
}

export type TaskType =
  | 'extraction'
  | 'classification'
  | 'planning'
  | 'code_review'
  | 'security_analysis'
  | 'workflow_compilation'
  | 'error_recovery';

export interface ErrorHandling {
  retry?: {
    maxAttempts: number;
    backoff: 'linear' | 'exponential';
  };
  notify?: string[];
}

export interface Execution {
  id: string;
  workflowId: string;
  status: 'running' | 'success' | 'failed' | 'partial';
  startedAt: Date;
  completedAt?: Date;
  triggerType: string;
  triggerData?: unknown;
  cost: number;
  error?: string;
  steps: StepExecution[];
}

export interface StepExecution {
  id: string;
  stepId: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  startedAt: Date;
  completedAt?: Date;
  modelUsed?: 'ollama' | 'claude' | null;
  tokensInput?: number;
  tokensOutput?: number;
  cost?: number;
  output?: unknown;
  error?: string;
  logs: string[];
}

export interface ComplexityScore {
  score: number;
  reasoning: string;
  factors: {
    taskType: number;
    contextSize: number;
    ambiguity: number;
    reasoning: number;
    toolCount: number;
  };
  recommendedModel: 'none' | 'ollama' | 'claude';
}

export interface AgentTask {
  type: TaskType;
  prompt: string;
  context?: string;
  tools?: unknown[];
  expectsJSON?: boolean;
  requiredFields?: string[];
  minLength?: number;
  isRetry?: boolean;
}

export interface AgentResponse {
  content: string;
  modelUsed: 'ollama' | 'claude';
  tokensInput: number;
  tokensOutput: number;
  cost: number;
}
