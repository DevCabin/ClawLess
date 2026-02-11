# Clawless Implementation Plan

This document provides step-by-step instructions for building Clawless. Each phase builds on the previous one and can be completed independently.

---

## Overview

**Total Timeline**: 8 weeks (for reference, adjust based on resources)

**Approach**: 
- Bottom-up (infrastructure first)
- Working software at each phase
- Tests alongside features
- Documentation as you go

---

## Phase 0: Foundation (Week 1)

**Goal**: Set up project structure, tooling, and basic infrastructure.

### Tasks

#### 0.1 Project Initialization
```bash
mkdir clawless && cd clawless
npm init -y
git init
```

#### 0.2 Dependencies
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@anthropic-ai/sdk": "^0.17.0",
    "better-sqlite3": "^9.2.2",
    "zod": "^3.22.4",
    "node-cron": "^3.0.3",
    "octokit": "^3.1.2",
    "@slack/web-api": "^6.10.0",
    "dotenv": "^16.3.1",
    "yaml": "^2.3.4"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "@types/better-sqlite3": "^7.6.8",
    "typescript": "^5.3.0",
    "tsx": "^4.7.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.1.0",
    "tailwindcss": "^3.4.0",
    "eslint": "^8.56.0",
    "prettier": "^3.1.0"
  }
}
```

#### 0.3 TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### 0.4 Directory Structure
```
clawless/
├── src/
│   ├── runtime/
│   │   ├── engine.ts           # Workflow execution
│   │   ├── scheduler.ts        # Cron/triggers
│   │   ├── state.ts            # SQLite state manager
│   │   └── memory.ts           # In-memory context
│   ├── intelligence/
│   │   ├── router.ts           # Model routing
│   │   ├── complexity.ts       # Complexity analyzer
│   │   ├── quality.ts          # Quality validator
│   │   └── providers/
│   │       ├── base.ts
│   │       ├── claude.ts
│   │       ├── ollama.ts
│   │       └── fallback.ts
│   ├── tools/
│   │   ├── base.ts             # Tool interface
│   │   ├── registry.ts         # Tool registry
│   │   ├── github.ts
│   │   ├── slack.ts
│   │   ├── email.ts
│   │   └── http.ts
│   ├── compiler/
│   │   ├── parser.ts           # Intent extraction
│   │   ├── generator.ts        # Workflow generation
│   │   └── validator.ts        # Schema validation
│   ├── web/
│   │   ├── app/
│   │   │   ├── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── setup/
│   │   │   ├── workflows/
│   │   │   ├── executions/
│   │   │   ├── chat/
│   │   │   └── api/
│   │   └── components/
│   └── shared/
│       ├── types.ts            # Core types
│       ├── schemas.ts          # Zod schemas
│       └── utils.ts
├── workflows/                  # User workflows (gitignored except examples)
├── data/
│   └── state.db               # SQLite database
├── tools/
│   └── custom/                # User custom tools
├── prompts/
│   └── workflow-compiler.md   # Chat compiler prompt
├── examples/
│   └── workflows/
│       ├── pr-reviewer.json
│       └── dependency-updater.json
├── .env.example
├── config.yml.example
├── package.json
├── tsconfig.json
└── README.md
```

Create all directories and empty files.

#### 0.5 Core Types
```typescript
// src/shared/types.ts

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
  params: Record<string, any>;
  condition?: string;
}

export interface AgentStep {
  id: string;
  type: 'agent';
  agentTask: TaskType;
  prompt: string;
  tools?: string[];
  outputSchema?: any;
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
  triggerData?: any;
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
  output?: any;
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
  tools?: any[];
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
```

#### 0.6 Database Schema
```sql
-- data/schema.sql

CREATE TABLE IF NOT EXISTS executions (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at DATETIME NOT NULL,
  completed_at DATETIME,
  trigger_type TEXT NOT NULL,
  trigger_data TEXT,
  cost REAL DEFAULT 0,
  error TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS step_executions (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at DATETIME NOT NULL,
  completed_at DATETIME,
  model_used TEXT,
  tokens_input INTEGER,
  tokens_output INTEGER,
  cost REAL DEFAULT 0,
  output TEXT,
  error TEXT,
  logs TEXT,
  FOREIGN KEY (execution_id) REFERENCES executions(id)
);

CREATE TABLE IF NOT EXISTS cost_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  model TEXT NOT NULL,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  cost REAL DEFAULT 0,
  execution_count INTEGER DEFAULT 0,
  UNIQUE(date, model)
);

CREATE INDEX IF NOT EXISTS idx_executions_workflow ON executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_started ON executions(started_at);
CREATE INDEX IF NOT EXISTS idx_step_executions_execution ON step_executions(execution_id);
CREATE INDEX IF NOT EXISTS idx_cost_tracking_date ON cost_tracking(date);
```

#### 0.7 Example Configuration Files
```yaml
# config.yml.example

intelligence:
  routing: auto
  
  ollama:
    enabled: true
    url: http://localhost:11434
    model: qwen2.5:7b
    fallback_to_claude: true
    timeout_ms: 5000
  
  claude:
    model: claude-sonnet-4.5
    max_tokens: 4096
    temperature: 0.7
  
  cost_controls:
    max_per_execution: 0.10
    max_per_day: 2.00
    alert_at: 1.50

tools:
  github:
    token: ${GITHUB_TOKEN}
  
  slack:
    token: ${SLACK_TOKEN}
    default_channel: "#alerts"

runtime:
  check_interval_seconds: 30
  max_concurrent_workflows: 5
  log_level: info
```

```bash
# .env.example

ANTHROPIC_API_KEY=your-key-here
GITHUB_TOKEN=your-token-here
SLACK_TOKEN=your-token-here
```

**Deliverable**: Project structure with all directories, base types, and configuration templates.

---

## Phase 1: Runtime Engine (Week 2)

**Goal**: Build the core workflow execution engine.

### 1.1 State Manager

**File**: `src/runtime/state.ts`

**Implementation**:
```typescript
import Database from 'better-sqlite3';
import { Execution, StepExecution } from '@/shared/types';
import fs from 'fs';
import path from 'path';

export class StateManager {
  private db: Database.Database;

  constructor(dbPath: string = './data/state.db') {
    // Ensure data directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.initialize();
  }

  private initialize() {
    const schema = fs.readFileSync('./data/schema.sql', 'utf-8');
    this.db.exec(schema);
  }

  // Executions
  createExecution(execution: Execution): void {
    const stmt = this.db.prepare(`
      INSERT INTO executions (
        id, workflow_id, status, started_at, trigger_type, trigger_data
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      execution.id,
      execution.workflowId,
      execution.status,
      execution.startedAt.toISOString(),
      execution.triggerType,
      JSON.stringify(execution.triggerData || {})
    );
  }

  updateExecution(id: string, updates: Partial<Execution>): void {
    const fields = [];
    const values = [];
    
    if (updates.status) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.completedAt) {
      fields.push('completed_at = ?');
      values.push(updates.completedAt.toISOString());
    }
    if (updates.cost !== undefined) {
      fields.push('cost = ?');
      values.push(updates.cost);
    }
    if (updates.error) {
      fields.push('error = ?');
      values.push(updates.error);
    }
    
    values.push(id);
    
    const stmt = this.db.prepare(`
      UPDATE executions SET ${fields.join(', ')} WHERE id = ?
    `);
    
    stmt.run(...values);
  }

  getExecution(id: string): Execution | null {
    const exec = this.db.prepare('SELECT * FROM executions WHERE id = ?').get(id) as any;
    if (!exec) return null;
    
    const steps = this.db.prepare('SELECT * FROM step_executions WHERE execution_id = ?').all(id) as any[];
    
    return this.hydrateExecution(exec, steps);
  }

  listExecutions(limit = 50, offset = 0): Execution[] {
    const execs = this.db.prepare(`
      SELECT * FROM executions 
      ORDER BY started_at DESC 
      LIMIT ? OFFSET ?
    `).all(limit, offset) as any[];
    
    return execs.map(exec => {
      const steps = this.db.prepare('SELECT * FROM step_executions WHERE execution_id = ?').all(exec.id) as any[];
      return this.hydrateExecution(exec, steps);
    });
  }

  private hydrateExecution(exec: any, steps: any[]): Execution {
    return {
      id: exec.id,
      workflowId: exec.workflow_id,
      status: exec.status,
      startedAt: new Date(exec.started_at),
      completedAt: exec.completed_at ? new Date(exec.completed_at) : undefined,
      triggerType: exec.trigger_type,
      triggerData: JSON.parse(exec.trigger_data || '{}'),
      cost: exec.cost || 0,
      error: exec.error,
      steps: steps.map(s => ({
        id: s.id,
        stepId: s.step_id,
        status: s.status,
        startedAt: new Date(s.started_at),
        completedAt: s.completed_at ? new Date(s.completed_at) : undefined,
        modelUsed: s.model_used,
        tokensInput: s.tokens_input,
        tokensOutput: s.tokens_output,
        cost: s.cost || 0,
        output: s.output ? JSON.parse(s.output) : undefined,
        error: s.error,
        logs: s.logs ? JSON.parse(s.logs) : [],
      })),
    };
  }

  // Step executions
  createStepExecution(executionId: string, step: StepExecution): void {
    const stmt = this.db.prepare(`
      INSERT INTO step_executions (
        id, execution_id, step_id, status, started_at, logs
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      step.id,
      executionId,
      step.stepId,
      step.status,
      step.startedAt.toISOString(),
      JSON.stringify(step.logs)
    );
  }

  updateStepExecution(id: string, updates: Partial<StepExecution>): void {
    const fields = [];
    const values = [];
    
    if (updates.status) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.completedAt) {
      fields.push('completed_at = ?');
      values.push(updates.completedAt.toISOString());
    }
    if (updates.modelUsed) {
      fields.push('model_used = ?');
      values.push(updates.modelUsed);
    }
    if (updates.tokensInput !== undefined) {
      fields.push('tokens_input = ?');
      values.push(updates.tokensInput);
    }
    if (updates.tokensOutput !== undefined) {
      fields.push('tokens_output = ?');
      values.push(updates.tokensOutput);
    }
    if (updates.cost !== undefined) {
      fields.push('cost = ?');
      values.push(updates.cost);
    }
    if (updates.output) {
      fields.push('output = ?');
      values.push(JSON.stringify(updates.output));
    }
    if (updates.error) {
      fields.push('error = ?');
      values.push(updates.error);
    }
    if (updates.logs) {
      fields.push('logs = ?');
      values.push(JSON.stringify(updates.logs));
    }
    
    values.push(id);
    
    const stmt = this.db.prepare(`
      UPDATE step_executions SET ${fields.join(', ')} WHERE id = ?
    `);
    
    stmt.run(...values);
  }

  // Cost tracking
  recordCost(model: string, tokensInput: number, tokensOutput: number, cost: number): void {
    const today = new Date().toISOString().split('T')[0];
    
    const stmt = this.db.prepare(`
      INSERT INTO cost_tracking (date, model, tokens_input, tokens_output, cost, execution_count)
      VALUES (?, ?, ?, ?, ?, 1)
      ON CONFLICT(date, model) DO UPDATE SET
        tokens_input = tokens_input + ?,
        tokens_output = tokens_output + ?,
        cost = cost + ?,
        execution_count = execution_count + 1
    `);
    
    stmt.run(today, model, tokensInput, tokensOutput, cost, tokensInput, tokensOutput, cost);
  }

  getStats(): {
    todayExecutions: number;
    todaySuccessRate: number;
    monthCost: number;
    ollamaPercentage: number;
  } {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date();
    monthStart.setDate(1);
    
    const todayStats = this.db.prepare(`
      SELECT COUNT(*) as total, SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success
      FROM executions
      WHERE DATE(started_at) = ?
    `).get(today) as any;
    
    const monthCost = this.db.prepare(`
      SELECT SUM(cost) as total FROM cost_tracking WHERE date >= ?
    `).get(monthStart.toISOString().split('T')[0]) as any;
    
    const modelStats = this.db.prepare(`
      SELECT model_used, COUNT(*) as count
      FROM step_executions
      WHERE DATE(started_at) = ? AND model_used IS NOT NULL
      GROUP BY model_used
    `).all(today) as any[];
    
    const ollamaCount = modelStats.find(s => s.model_used === 'ollama')?.count || 0;
    const totalLLM = modelStats.reduce((sum, s) => sum + s.count, 0);
    
    return {
      todayExecutions: todayStats?.total || 0,
      todaySuccessRate: todayStats?.total ? (todayStats.success / todayStats.total) * 100 : 0,
      monthCost: monthCost?.total || 0,
      ollamaPercentage: totalLLM ? (ollamaCount / totalLLM) * 100 : 0,
    };
  }

  close(): void {
    this.db.close();
  }
}
```

**Tests**: Create `src/runtime/state.test.ts` with basic CRUD tests.

### 1.2 Workflow Loader

**File**: `src/runtime/loader.ts`

```typescript
import fs from 'fs';
import path from 'path';
import { Workflow } from '@/shared/types';

export class WorkflowLoader {
  private workflowDir: string;
  private workflows: Map<string, Workflow> = new Map();

  constructor(workflowDir: string = './workflows') {
    this.workflowDir = workflowDir;
    if (!fs.existsSync(workflowDir)) {
      fs.mkdirSync(workflowDir, { recursive: true });
    }
  }

  loadAll(): Workflow[] {
    this.workflows.clear();
    
    const files = fs.readdirSync(this.workflowDir)
      .filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(
          path.join(this.workflowDir, file),
          'utf-8'
        );
        const workflow = JSON.parse(content) as Workflow;
        this.workflows.set(workflow.id, workflow);
      } catch (error) {
        console.error(`Failed to load workflow ${file}:`, error);
      }
    }
    
    return Array.from(this.workflows.values());
  }

  get(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  save(workflow: Workflow): void {
    const filePath = path.join(this.workflowDir, `${workflow.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(workflow, null, 2));
    this.workflows.set(workflow.id, workflow);
  }

  delete(id: string): void {
    const filePath = path.join(this.workflowDir, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    this.workflows.delete(id);
  }

  watch(callback: () => void): void {
    fs.watch(this.workflowDir, { persistent: false }, () => {
      this.loadAll();
      callback();
    });
  }
}
```

### 1.3 Execution Engine (Basic)

**File**: `src/runtime/engine.ts`

```typescript
import { Workflow, Execution, StepExecution, ToolStep, AgentStep } from '@/shared/types';
import { StateManager } from './state';
import { randomUUID } from 'crypto';

export class WorkflowEngine {
  constructor(
    private state: StateManager,
    private toolRegistry: any, // Will implement in Phase 1.4
    private intelligenceRouter: any // Will implement in Phase 2
  ) {}

  async executeWorkflow(workflow: Workflow, trigger: any): Promise<Execution> {
    const execution: Execution = {
      id: randomUUID(),
      workflowId: workflow.id,
      status: 'running',
      startedAt: new Date(),
      triggerType: trigger.type,
      triggerData: trigger,
      cost: 0,
      steps: [],
    };

    this.state.createExecution(execution);

    try {
      const context = new ExecutionContext(execution.id, workflow.id);

      for (const step of workflow.steps) {
        const stepExec = await this.executeStep(step, context, execution.id);
        execution.steps.push(stepExec);

        if (stepExec.status === 'failed') {
          execution.status = 'failed';
          execution.error = stepExec.error;
          break;
        }

        execution.cost += stepExec.cost || 0;
      }

      if (execution.status === 'running') {
        execution.status = 'success';
      }

      execution.completedAt = new Date();
      this.state.updateExecution(execution.id, {
        status: execution.status,
        completedAt: execution.completedAt,
        cost: execution.cost,
        error: execution.error,
      });

      return execution;
    } catch (error: any) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.completedAt = new Date();

      this.state.updateExecution(execution.id, {
        status: 'failed',
        completedAt: execution.completedAt,
        error: error.message,
      });

      throw error;
    }
  }

  private async executeStep(
    step: ToolStep | AgentStep,
    context: ExecutionContext,
    executionId: string
  ): Promise<StepExecution> {
    const stepExec: StepExecution = {
      id: randomUUID(),
      stepId: step.id,
      status: 'running',
      startedAt: new Date(),
      logs: [],
    };

    this.state.createStepExecution(executionId, stepExec);

    try {
      // Check condition
      if (step.condition) {
        const shouldRun = this.evaluateCondition(step.condition, context);
        if (!shouldRun) {
          stepExec.status = 'skipped';
          stepExec.completedAt = new Date();
          this.state.updateStepExecution(stepExec.id, stepExec);
          return stepExec;
        }
      }

      // Execute based on type
      if (step.type === 'tool') {
        stepExec.output = await this.executeToolStep(step, context);
        stepExec.modelUsed = null;
      } else if (step.type === 'agent') {
        const result = await this.executeAgentStep(step, context);
        stepExec.output = result.output;
        stepExec.modelUsed = result.modelUsed;
        stepExec.tokensInput = result.tokensInput;
        stepExec.tokensOutput = result.tokensOutput;
        stepExec.cost = result.cost;
      }

      stepExec.status = 'success';
      stepExec.completedAt = new Date();

      // Store output in context
      context.setStepOutput(step.id, stepExec.output);

      this.state.updateStepExecution(stepExec.id, stepExec);

      return stepExec;
    } catch (error: any) {
      stepExec.status = 'failed';
      stepExec.error = error.message;
      stepExec.completedAt = new Date();
      stepExec.logs.push(`Error: ${error.message}`);

      this.state.updateStepExecution(stepExec.id, stepExec);

      throw error;
    }
  }

  private async executeToolStep(step: ToolStep, context: ExecutionContext): Promise<any> {
    // Interpolate params
    const params = this.interpolateParams(step.params, context);
    
    // Get tool from registry
    const tool = this.toolRegistry.get(step.tool);
    if (!tool) {
      throw new Error(`Tool not found: ${step.tool}`);
    }

    // Execute
    return await tool.execute(params, { executionId: context.executionId });
  }

  private async executeAgentStep(step: AgentStep, context: ExecutionContext): Promise<any> {
    // Interpolate prompt
    const prompt = this.interpolateString(step.prompt, context);
    
    // Route to appropriate model
    const result = await this.intelligenceRouter.execute({
      type: step.agentTask,
      prompt,
      context: JSON.stringify(context.getAll()),
      tools: step.tools,
      expectsJSON: !!step.outputSchema,
    });

    return {
      output: JSON.parse(result.content),
      modelUsed: result.modelUsed,
      tokensInput: result.tokensInput,
      tokensOutput: result.tokensOutput,
      cost: result.cost,
    };
  }

  private evaluateCondition(condition: string, context: ExecutionContext): boolean {
    // Simple template evaluation: "{{step.check.is_valid}}"
    const value = this.interpolateString(condition, context);
    return value === 'true' || value === true;
  }

  private interpolateString(template: string, context: ExecutionContext): string {
    return template.replace(/\{\{(.+?)\}\}/g, (_, path) => {
      const value = context.getByPath(path.trim());
      return value !== undefined ? String(value) : '';
    });
  }

  private interpolateParams(params: Record<string, any>, context: ExecutionContext): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        result[key] = this.interpolateString(value, context);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }
}

class ExecutionContext {
  private stepOutputs: Map<string, any> = new Map();
  private variables: Map<string, any> = new Map();

  constructor(
    public executionId: string,
    public workflowId: string
  ) {}

  setStepOutput(stepId: string, output: any): void {
    this.stepOutputs.set(stepId, output);
  }

  getStepOutput(stepId: string): any {
    return this.stepOutputs.get(stepId);
  }

  setVariable(key: string, value: any): void {
    this.variables.set(key, value);
  }

  getVariable(key: string): any {
    return this.variables.get(key);
  }

  getByPath(path: string): any {
    // Parse paths like "step.check.is_valid" or "var.repo"
    const parts = path.split('.');
    
    if (parts[0] === 'step' && parts.length >= 2) {
      const stepId = parts[1];
      const output = this.stepOutputs.get(stepId);
      
      if (parts.length === 2) return output;
      
      // Navigate nested path
      let current = output;
      for (let i = 2; i < parts.length; i++) {
        current = current?.[parts[i]];
      }
      return current;
    }
    
    if (parts[0] === 'var' && parts.length === 2) {
      return this.variables.get(parts[1]);
    }
    
    return undefined;
  }

  getAll(): any {
    return {
      steps: Object.fromEntries(this.stepOutputs),
      variables: Object.fromEntries(this.variables),
    };
  }
}
```

### 1.4 Basic Tool System

**File**: `src/tools/base.ts`

```typescript
import { z } from 'zod';

export interface Tool {
  name: string;
  description: string;
  schema: z.ZodSchema;
  execute: (params: any, context: ToolContext) => Promise<any>;
  rateLimit?: RateLimit;
  retry?: RetryConfig;
}

export interface ToolContext {
  executionId: string;
  workflowId?: string;
  auth?: Record<string, string>;
  logger?: Logger;
}

export interface RateLimit {
  calls: number;
  per: 'second' | 'minute' | 'hour';
}

export interface RetryConfig {
  maxAttempts: number;
  backoff: 'linear' | 'exponential';
  initialDelay: number;
}

export interface Logger {
  info(message: string, data?: any): void;
  error(message: string, error?: any): void;
  warn(message: string, data?: any): void;
}

export function tool(definition: Tool): Tool {
  return definition;
}
```

**File**: `src/tools/registry.ts`

```typescript
import { Tool } from './base';

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  list(): Tool[] {
    return Array.from(this.tools.values());
  }
}
```

**File**: `src/tools/github.ts` (stub for now)

```typescript
import { tool } from './base';
import { z } from 'zod';

export const githubListPRs = tool({
  name: 'github.listPRs',
  description: 'List pull requests',
  schema: z.object({
    repo: z.string(),
    state: z.enum(['open', 'closed', 'all']).optional(),
  }),
  execute: async (params, context) => {
    // TODO: Implement in Phase 3
    return { prs: [] };
  },
});
```

**Deliverable**: Basic execution engine that can run workflows (without real tools or LLMs yet).

---

## Phase 2: Intelligence Router (Week 3)

**Goal**: Implement smart model routing between Ollama and Claude.

### 2.1 Provider Interfaces

**File**: `src/intelligence/providers/base.ts`

```typescript
import { AgentTask, AgentResponse } from '@/shared/types';

export interface LLMProvider {
  name: string;
  execute(task: AgentTask, options?: ExecuteOptions): Promise<AgentResponse>;
  isAvailable(): Promise<boolean>;
}

export interface ExecuteOptions {
  temperature?: number;
  timeout?: number;
  maxTokens?: number;
}
```

### 2.2 Claude Provider

**File**: `src/intelligence/providers/claude.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, ExecuteOptions } from './base';
import { AgentTask, AgentResponse } from '@/shared/types';

export class ClaudeProvider implements LLMProvider {
  name = 'claude';
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model = 'claude-sonnet-4-5-20250929') {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async execute(task: AgentTask, options: ExecuteOptions = {}): Promise<AgentResponse> {
    const startTime = Date.now();

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature || 0.7,
      messages: [
        {
          role: 'user',
          content: this.buildPrompt(task),
        },
      ],
    });

    const content = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    const tokensInput = response.usage.input_tokens;
    const tokensOutput = response.usage.output_tokens;
    
    // Claude Sonnet 4.5 pricing: $3/$15 per million tokens
    const cost = (tokensInput * 3 / 1_000_000) + (tokensOutput * 15 / 1_000_000);

    return {
      content,
      modelUsed: 'claude',
      tokensInput,
      tokensOutput,
      cost,
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      return true;
    } catch {
      return false;
    }
  }

  private buildPrompt(task: AgentTask): string {
    let prompt = task.prompt;

    if (task.context) {
      prompt = `Context:\n${task.context}\n\nTask:\n${prompt}`;
    }

    if (task.expectsJSON) {
      prompt += '\n\nRespond with valid JSON only, no other text.';
    }

    return prompt;
  }
}
```

### 2.3 Ollama Provider

**File**: `src/intelligence/providers/ollama.ts`

```typescript
import { LLMProvider, ExecuteOptions } from './base';
import { AgentTask, AgentResponse } from '@/shared/types';

export class OllamaProvider implements LLMProvider {
  name = 'ollama';
  private baseUrl: string;
  private model: string;

  constructor(baseUrl = 'http://localhost:11434', model = 'qwen2.5:7b') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async execute(task: AgentTask, options: ExecuteOptions = {}): Promise<AgentResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeout || 5000);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: this.buildPrompt(task),
          stream: false,
          options: {
            temperature: options.temperature || 0.1,
            num_predict: options.maxTokens || 2048,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        content: data.response,
        modelUsed: 'ollama',
        tokensInput: data.prompt_eval_count || 0,
        tokensOutput: data.eval_count || 0,
        cost: 0, // Ollama is free
      };
    } catch (error: any) {
      clearTimeout(timeout);
      throw new Error(`Ollama execution failed: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private buildPrompt(task: AgentTask): string {
    let prompt = task.prompt;

    if (task.context) {
      prompt = `Context:\n${task.context}\n\nTask:\n${prompt}`;
    }

    if (task.expectsJSON) {
      prompt += '\n\nRespond with valid JSON only. Do not include any preamble or explanation.';
    }

    return prompt;
  }
}
```

### 2.4 Complexity Analyzer

**File**: `src/intelligence/complexity.ts`

```typescript
import { AgentTask, ComplexityScore, TaskType } from '@/shared/types';

export class ComplexityAnalyzer {
  analyze(task: AgentTask): ComplexityScore {
    let score = 0;
    const factors = {
      taskType: 0,
      contextSize: 0,
      ambiguity: 0,
      reasoning: 0,
      toolCount: 0,
    };

    // Task type scoring
    const typeScores: Record<TaskType, number> = {
      'extraction': 2,
      'classification': 1,
      'planning': 4,
      'code_review': 8,
      'security_analysis': 9,
      'workflow_compilation': 7,
      'error_recovery': 5,
    };
    factors.taskType = typeScores[task.type] || 3;
    score += factors.taskType;

    // Context size
    if (task.context) {
      const length = task.context.length;
      if (length > 10000) {
        factors.contextSize = 3;
        score += 3;
      } else if (length > 5000) {
        factors.contextSize = 2;
        score += 2;
      } else if (length > 2000) {
        factors.contextSize = 1;
        score += 1;
      }
    }

    // Ambiguity detection (simple heuristics)
    if (this.detectAmbiguity(task.prompt)) {
      factors.ambiguity = 2;
      score += 2;
    }

    // Reasoning requirements
    if (task.type === 'planning' || task.type === 'error_recovery') {
      factors.reasoning = 3;
      score += 3;
    }

    // Tool count
    if (task.tools && task.tools.length > 3) {
      factors.toolCount = 1;
      score += 1;
    }

    // Retry = more complex
    if (task.isRetry) {
      score += 2;
    }

    const recommendedModel = this.getRecommendedModel(score);

    return {
      score,
      reasoning: this.explainScore(score, factors),
      factors,
      recommendedModel,
    };
  }

  private detectAmbiguity(prompt: string): boolean {
    const ambiguousPatterns = [
      /\b(maybe|might|could|should|probably)\b/i,
      /\?.*\?/,  // Multiple questions
      /\b(or|either)\b/i,
    ];

    return ambiguousPatterns.some(pattern => pattern.test(prompt));
  }

  private getRecommendedModel(score: number): 'none' | 'ollama' | 'claude' {
    if (score < 2) return 'none';
    if (score < 7) return 'ollama';
    return 'claude';
  }

  private explainScore(score: number, factors: ComplexityScore['factors']): string {
    const parts = [];
    
    if (factors.taskType > 5) {
      parts.push(`complex task type (${factors.taskType})`);
    }
    if (factors.contextSize > 0) {
      parts.push(`large context (${factors.contextSize})`);
    }
    if (factors.ambiguity > 0) {
      parts.push('ambiguous prompt');
    }
    if (factors.reasoning > 0) {
      parts.push('requires reasoning');
    }

    if (parts.length === 0) {
      return `Simple task (score: ${score})`;
    }

    return `Score ${score}: ${parts.join(', ')}`;
  }
}
```

### 2.5 Quality Validator

**File**: `src/intelligence/quality.ts`

```typescript
import { AgentResponse, AgentTask } from '@/shared/types';

export class QualityValidator {
  validate(response: AgentResponse, task: AgentTask): boolean {
    // JSON validity
    if (task.expectsJSON) {
      try {
        const parsed = JSON.parse(response.content);
        
        // Check required fields
        if (task.requiredFields) {
          const hasAll = task.requiredFields.every(field => field in parsed);
          if (!hasAll) return false;
        }
      } catch {
        return false;
      }
    }

    // Length check
    if (task.minLength && response.content.length < task.minLength) {
      return false;
    }

    // Hallucination detection
    if (this.detectHallucination(response, task)) {
      return false;
    }

    return true;
  }

  private detectHallucination(response: AgentResponse, task: AgentTask): boolean {
    const content = response.content.toLowerCase();

    // Generic placeholders
    if (content.includes('todo') || content.includes('fixme')) {
      return true;
    }

    // Example URLs
    if (content.includes('example.com') || content.includes('placeholder')) {
      return true;
    }

    // Context-based detection
    if (task.context) {
      // Extract entities mentioned in response
      const responseEntities = this.extractEntities(response.content);
      const contextEntities = this.extractEntities(task.context);
      
      // Count how many entities in response are NOT in context
      const hallucinated = responseEntities.filter(e => !contextEntities.includes(e));
      
      // If >50% of entities are hallucinated, fail
      if (hallucinated.length > responseEntities.length * 0.5) {
        return true;
      }
    }

    return false;
  }

  private extractEntities(text: string): string[] {
    // Simple entity extraction (proper nouns, URLs, etc.)
    const entities: string[] = [];
    
    // URLs
    const urlPattern = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlPattern) || [];
    entities.push(...urls);
    
    // Capitalized words (potential proper nouns)
    const wordPattern = /\b[A-Z][a-z]+\b/g;
    const words = text.match(wordPattern) || [];
    entities.push(...words);
    
    return [...new Set(entities)]; // Dedupe
  }
}
```

### 2.6 Intelligence Router

**File**: `src/intelligence/router.ts`

```typescript
import { AgentTask, AgentResponse, ComplexityScore } from '@/shared/types';
import { LLMProvider } from './providers/base';
import { ComplexityAnalyzer } from './complexity';
import { QualityValidator } from './quality';

export class IntelligenceRouter {
  constructor(
    private ollama: LLMProvider,
    private claude: LLMProvider,
    private complexity: ComplexityAnalyzer,
    private quality: QualityValidator,
    private config: RouterConfig
  ) {}

  async execute(task: AgentTask): Promise<AgentResponse> {
    const score = this.complexity.analyze(task);

    console.log(`[Router] Task complexity: ${score.score} - ${score.reasoning}`);

    // Trivial: no LLM needed (deterministic)
    if (score.score < 2) {
      throw new Error('Deterministic tasks should not use LLM router');
    }

    // Simple: Ollama only
    if (score.score < 6) {
      console.log('[Router] Using Ollama');
      return await this.executeWithOllama(task);
    }

    // Moderate: Try Ollama, fallback to Claude
    if (score.score < 8) {
      console.log('[Router] Trying Ollama with Claude fallback');
      
      if (this.config.ollamaFallback) {
        try {
          const result = await this.executeWithOllama(task);
          
          // Validate quality
          if (this.quality.validate(result, task)) {
            console.log('[Router] Ollama result passed quality check');
            return result;
          }
          
          console.log('[Router] Ollama result failed quality check, falling back to Claude');
        } catch (error: any) {
          console.log(`[Router] Ollama failed: ${error.message}, falling back to Claude`);
        }
      }
      
      return await this.executeWithClaude(task);
    }

    // Complex: Claude only
    console.log('[Router] Using Claude (complex task)');
    return await this.executeWithClaude(task);
  }

  private async executeWithOllama(task: AgentTask): Promise<AgentResponse> {
    const available = await this.ollama.isAvailable();
    if (!available) {
      throw new Error('Ollama not available');
    }

    return await this.ollama.execute(task, {
      temperature: 0.1,
      timeout: this.config.ollamaTimeout,
    });
  }

  private async executeWithClaude(task: AgentTask): Promise<AgentResponse> {
    return await this.claude.execute(task);
  }
}

export interface RouterConfig {
  ollamaFallback: boolean;
  ollamaTimeout: number;
  maxCostPerExecution: number;
}
```

**Deliverable**: Fully functional intelligence router with Ollama/Claude fallback.

---

## Phase 3: GitHub Tool (Week 4)

**Goal**: Implement real GitHub integration.

### 3.1 GitHub Tools

**File**: `src/tools/github.ts`

```typescript
import { Octokit } from 'octokit';
import { tool } from './base';
import { z } from 'zod';

export const githubListPRs = tool({
  name: 'github.listPRs',
  description: 'List pull requests',
  schema: z.object({
    repo: z.string().regex(/^[^/]+\/[^/]+$/),
    state: z.enum(['open', 'closed', 'all']).default('open'),
  }),
  execute: async (params, context) => {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const [owner, repoName] = params.repo.split('/');

    const { data } = await octokit.rest.pulls.list({
      owner,
      repo: repoName,
      state: params.state,
    });

    return {
      prs: data.map(pr => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        author: pr.user?.login,
        url: pr.html_url,
        created_at: pr.created_at,
        updated_at: pr.updated_at,
      })),
    };
  },
  rateLimit: { calls: 30, per: 'minute' },
});

export const githubGetPRDiff = tool({
  name: 'github.getPRDiff',
  description: 'Get PR diff',
  schema: z.object({
    repo: z.string().regex(/^[^/]+\/[^/]+$/),
    pr_number: z.number(),
  }),
  execute: async (params, context) => {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const [owner, repoName] = params.repo.split('/');

    const { data } = await octokit.rest.pulls.get({
      owner,
      repo: repoName,
      pull_number: params.pr_number,
      mediaType: { format: 'diff' },
    });

    return {
      diff: data,
      pr_number: params.pr_number,
    };
  },
});

export const githubCreateComment = tool({
  name: 'github.createComment',
  description: 'Create PR comment',
  schema: z.object({
    repo: z.string().regex(/^[^/]+\/[^/]+$/),
    pr_number: z.number(),
    body: z.string(),
  }),
  execute: async (params, context) => {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const [owner, repoName] = params.repo.split('/');

    const { data } = await octokit.rest.issues.createComment({
      owner,
      repo: repoName,
      issue_number: params.pr_number,
      body: params.body,
    });

    return {
      comment_id: data.id,
      url: data.html_url,
    };
  },
});

export const githubCreatePR = tool({
  name: 'github.createPR',
  description: 'Create pull request',
  schema: z.object({
    repo: z.string().regex(/^[^/]+\/[^/]+$/),
    base: z.string(),
    head: z.string(),
    title: z.string(),
    body: z.string().optional(),
  }),
  execute: async (params, context) => {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const [owner, repoName] = params.repo.split('/');

    const { data } = await octokit.rest.pulls.create({
      owner,
      repo: repoName,
      base: params.base,
      head: params.head,
      title: params.title,
      body: params.body || '',
    });

    return {
      pr_number: data.number,
      url: data.html_url,
      state: data.state,
    };
  },
});
```

**File**: `src/tools/index.ts`

```typescript
import { ToolRegistry } from './registry';
import { githubListPRs, githubGetPRDiff, githubCreateComment, githubCreatePR } from './github';

export function createToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();

  // GitHub tools
  registry.register(githubListPRs);
  registry.register(githubGetPRDiff);
  registry.register(githubCreateComment);
  registry.register(githubCreatePR);

  // Future: Slack, Email, etc.

  return registry;
}
```

**Deliverable**: Working GitHub integration with PR listing, diffing, commenting.

---

## Phase 4: Scheduler (Week 5)

**Goal**: Implement cron-based and webhook-based triggers.

### 4.1 Scheduler

**File**: `src/runtime/scheduler.ts`

```typescript
import cron from 'node-cron';
import { Workflow } from '@/shared/types';
import { WorkflowLoader } from './loader';
import { WorkflowEngine } from './engine';
import { StateManager } from './state';

export class Scheduler {
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();
  private running = false;

  constructor(
    private loader: WorkflowLoader,
    private engine: WorkflowEngine,
    private state: StateManager,
    private intervalSeconds = 30
  ) {}

  start(): void {
    if (this.running) return;
    
    console.log('[Scheduler] Starting...');
    this.running = true;

    // Load workflows and set up cron jobs
    this.reload();

    // Watch for workflow changes
    this.loader.watch(() => {
      console.log('[Scheduler] Workflows changed, reloading...');
      this.reload();
    });

    console.log('[Scheduler] Started');
  }

  stop(): void {
    if (!this.running) return;
    
    console.log('[Scheduler] Stopping...');
    this.running = false;

    // Stop all cron jobs
    for (const [id, job] of this.cronJobs) {
      job.stop();
    }
    this.cronJobs.clear();

    console.log('[Scheduler] Stopped');
  }

  private reload(): void {
    // Stop existing jobs
    for (const [id, job] of this.cronJobs) {
      job.stop();
    }
    this.cronJobs.clear();

    // Load workflows
    const workflows = this.loader.loadAll();

    // Register cron jobs
    for (const workflow of workflows) {
      if (!workflow.enabled) continue;
      
      if (workflow.trigger.type === 'cron') {
        this.registerCronJob(workflow);
      }
    }

    console.log(`[Scheduler] Loaded ${workflows.length} workflows, ${this.cronJobs.size} cron jobs`);
  }

  private registerCronJob(workflow: Workflow): void {
    if (workflow.trigger.type !== 'cron') return;

    const schedule = workflow.trigger.schedule;
    
    // Validate cron expression
    if (!cron.validate(schedule)) {
      console.error(`[Scheduler] Invalid cron expression for workflow ${workflow.id}: ${schedule}`);
      return;
    }

    const job = cron.schedule(schedule, async () => {
      console.log(`[Scheduler] Triggering workflow: ${workflow.name}`);
      
      try {
        await this.engine.executeWorkflow(workflow, {
          type: 'cron',
          time: new Date(),
        });
      } catch (error: any) {
        console.error(`[Scheduler] Workflow execution failed: ${error.message}`);
      }
    });

    this.cronJobs.set(workflow.id, job);
    console.log(`[Scheduler] Registered cron job for ${workflow.name}: ${schedule}`);
  }
}
```

**Deliverable**: Working scheduler that runs workflows on cron schedules.

---

## Phase 5: Chat Interface & Compiler (Week 6)

**Goal**: Build chat-to-workflow compiler and basic web UI.

### 5.1 Workflow Compiler

**File**: `src/compiler/generator.ts`

```typescript
import { Workflow, Step } from '@/shared/types';
import { ClaudeProvider } from '@/intelligence/providers/claude';
import { randomUUID } from 'crypto';

export class WorkflowGenerator {
  constructor(private claude: ClaudeProvider) {}

  async compileFromChat(messages: ChatMessage[]): Promise<Workflow> {
    // Use Claude to convert chat into structured workflow
    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.buildPrompt(messages);

    const response = await this.claude.execute({
      type: 'workflow_compilation',
      prompt: systemPrompt + '\n\n' + userPrompt,
      expectsJSON: true,
      requiredFields: ['name', 'trigger', 'steps'],
    });

    const workflow = JSON.parse(response.content);

    // Add metadata
    workflow.id = workflow.id || randomUUID();
    workflow.enabled = false; // User must activate
    workflow.createdAt = new Date().toISOString();
    workflow.updatedAt = new Date().toISOString();

    return workflow;
  }

  private getSystemPrompt(): string {
    return `You are a workflow compiler for Clawless, a personal agent runtime.

Your job: Convert user conversations into valid workflow JSON.

Available tools:
- github.listPRs: List pull requests
- github.getPRDiff: Get PR diff
- github.createComment: Create PR comment
- github.createPR: Create pull request

Trigger types:
- cron: { type: "cron", schedule: "0 9 * * *" }
- webhook: { type: "webhook", event: "pull_request.opened", source: "github" }
- manual: { type: "manual" }

Step types:
1. tool: Direct API call
2. agent: LLM reasoning (use for analysis, reviews, decisions)

Always:
1. Ask clarifying questions if ambiguous
2. Use sensible defaults
3. Include helpful descriptions
4. Estimate costs in comments
5. Validate against schema

Output ONLY valid JSON matching this schema:
{
  "id": "unique-id",
  "name": "Workflow Name",
  "description": "What it does",
  "trigger": {...},
  "steps": [
    {
      "id": "step-1",
      "type": "tool" | "agent",
      ...
    }
  ],
  "errorHandling": {
    "retry": { "maxAttempts": 3, "backoff": "exponential" },
    "notify": ["ui"]
  },
  "enabled": false
}`;
  }

  private buildPrompt(messages: ChatMessage[]): string {
    const conversation = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n\n');

    return `Conversation:\n${conversation}\n\nGenerate workflow JSON:`;
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
```

### 5.2 Next.js API Routes

**File**: `src/web/app/api/workflows/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { WorkflowLoader } from '@/runtime/loader';

const loader = new WorkflowLoader();

export async function GET(req: NextRequest) {
  const workflows = loader.loadAll();
  return NextResponse.json({ workflows });
}

export async function POST(req: NextRequest) {
  const workflow = await req.json();
  loader.save(workflow);
  return NextResponse.json({ workflow });
}
```

**File**: `src/web/app/api/executions/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { StateManager } from '@/runtime/state';

const state = new StateManager();

export async function GET(req: NextRequest) {
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');
  
  const executions = state.listExecutions(limit, offset);
  return NextResponse.json({ executions });
}
```

**File**: `src/web/app/api/chat/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { WorkflowGenerator } from '@/compiler/generator';
import { ClaudeProvider } from '@/intelligence/providers/claude';

const claude = new ClaudeProvider(process.env.ANTHROPIC_API_KEY!);
const compiler = new WorkflowGenerator(claude);

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  (async () => {
    try {
      const workflow = await compiler.compileFromChat(messages);
      
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ workflow })}\n\n`)
      );
      
      await writer.close();
    } catch (error: any) {
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
      );
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

**Deliverable**: API endpoints for workflows, executions, and chat compilation.

---

## Phase 6: Web UI (Week 7)

**Goal**: Build dashboard, workflow viewer, and chat interface.

### 6.1 Dashboard

**File**: `src/web/app/page.tsx`

```typescript
import Link from 'next/link';

async function getStats() {
  // Call API or directly use StateManager
  const res = await fetch('http://localhost:3000/api/stats', { cache: 'no-store' });
  return res.json();
}

async function getExecutions() {
  const res = await fetch('http://localhost:3000/api/executions?limit=10', { cache: 'no-store' });
  return res.json();
}

export default async function Dashboard() {
  const stats = await getStats();
  const { executions } = await getExecutions();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Clawless 🐾</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard title="Active Workflows" value={stats.activeWorkflows} />
        <StatCard title="Runs Today" value={stats.todayExecutions} />
        <StatCard title="Cost (Month)" value={`$${stats.monthCost.toFixed(2)}`} />
        <StatCard 
          title="Ollama Savings" 
          value={`${stats.ollamaPercentage.toFixed(0)}%`}
          subtitle="of requests handled locally"
        />
      </div>

      {/* Recent Executions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Executions</h2>
        <div className="space-y-2">
          {executions.map((exec: any) => (
            <Link 
              key={exec.id} 
              href={`/executions/${exec.id}`}
              className="block p-3 hover:bg-gray-50 rounded"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    exec.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  {exec.workflowId}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(exec.startedAt).toLocaleTimeString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="fixed bottom-8 right-8">
        <Link 
          href="/chat"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700"
        >
          + New Workflow
        </Link>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-sm text-gray-500 mb-1">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
    </div>
  );
}
```

### 6.2 Chat Interface

**File**: `src/web/app/chat/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        
        for (const line of lines) {
          const data = JSON.parse(line.slice(6));
          
          if (data.workflow) {
            // Show workflow preview
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `I've created this workflow:\n\n\`\`\`json\n${JSON.stringify(data.workflow, null, 2)}\n\`\`\`\n\nWould you like to activate it?`,
            }]);
            
            // Save workflow
            await fetch('/api/workflows', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data.workflow),
            });
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-4 ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="What would you like to automate?"
            className="flex-1 px-4 py-2 border rounded-lg"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
```

**Deliverable**: Working web UI with dashboard and chat interface.

---

## Phase 7: Setup Wizard (Week 8)

**Goal**: Build first-run setup wizard.

### 7.1 Setup Detection & Wizard

**File**: `src/web/app/setup/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    intelligence: 'hybrid',
    anthropicKey: '',
    githubToken: '',
  });
  const router = useRouter();

  const saveConfig = async () => {
    await fetch('/api/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-2">Welcome to Clawless! 🐾</h1>
        <p className="text-gray-600 mb-8">Let's get you set up in 3 steps.</p>

        {step === 1 && (
          <Step1 config={config} setConfig={setConfig} onNext={() => setStep(2)} />
        )}
        
        {step === 2 && (
          <Step2 config={config} setConfig={setConfig} onNext={() => setStep(3)} onBack={() => setStep(1)} />
        )}
        
        {step === 3 && (
          <Step3 config={config} setConfig={setConfig} onFinish={saveConfig} onBack={() => setStep(2)} />
        )}
      </div>
    </div>
  );
}

function Step1({ config, setConfig, onNext }: any) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Step 1/3: Choose Your Intelligence</h2>
      
      <div className="space-y-4">
        <label className="block border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="intelligence"
            value="hybrid"
            checked={config.intelligence === 'hybrid'}
            onChange={e => setConfig({ ...config, intelligence: e.target.value })}
            className="mr-3"
          />
          <div>
            <div className="font-semibold">Hybrid (Recommended)</div>
            <div className="text-sm text-gray-600">
              Ollama for simple tasks (free) + Claude for complex reasoning
            </div>
          </div>
        </label>

        <label className="block border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="intelligence"
            value="claude"
            checked={config.intelligence === 'claude'}
            onChange={e => setConfig({ ...config, intelligence: e.target.value })}
            className="mr-3"
          />
          <div>
            <div className="font-semibold">Claude Only</div>
            <div className="text-sm text-gray-600">
              Premium quality everywhere (~$2-5/month)
            </div>
          </div>
        </label>

        <label className="block border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="intelligence"
            value="ollama"
            checked={config.intelligence === 'ollama'}
            onChange={e => setConfig({ ...config, intelligence: e.target.value })}
            className="mr-3"
          />
          <div>
            <div className="font-semibold">Ollama Only</div>
            <div className="text-sm text-gray-600">
              100% free, 100% local (reduced capabilities)
            </div>
          </div>
        </label>
      </div>

      <button
        onClick={onNext}
        className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
      >
        Continue
      </button>
    </div>
  );
}

function Step2({ config, setConfig, onNext, onBack }: any) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Step 2/3: API Keys</h2>
      
      {config.intelligence !== 'ollama' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Claude API Key (Anthropic)
          </label>
          <input
            type="password"
            value={config.anthropicKey}
            onChange={e => setConfig({ ...config, anthropicKey: e.target.value })}
            placeholder="sk-ant-..."
            className="w-full px-4 py-2 border rounded-lg"
          />
          <a 
            href="https://console.anthropic.com" 
            target="_blank"
            className="text-sm text-blue-600 hover:underline"
          >
            Get a key at console.anthropic.com
          </a>
        </div>
      )}

      <div className="flex gap-2 mt-6">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function Step3({ config, setConfig, onFinish, onBack }: any) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Step 3/3: Connect Tools</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          GitHub Token
        </label>
        <input
          type="password"
          value={config.githubToken}
          onChange={e => setConfig({ ...config, githubToken: e.target.value })}
          placeholder="ghp_..."
          className="w-full px-4 py-2 border rounded-lg"
        />
        <a 
          href="https://github.com/settings/tokens" 
          target="_blank"
          className="text-sm text-blue-600 hover:underline"
        >
          Generate token at github.com/settings/tokens
        </a>
      </div>

      <div className="flex gap-2 mt-6">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300"
        >
          Back
        </button>
        <button
          onClick={onFinish}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Finish Setup
        </button>
      </div>
    </div>
  );
}
```

**Deliverable**: Complete setup wizard that creates `.env` and `config.yml`.

---

## Phase 8: Polish & Launch (Week 8)

**Goal**: Documentation, examples, testing, and launch.

### 8.1 Example Workflows

Create 3-5 example workflows in `examples/workflows/`:

1. **pr-reviewer.json**: Security review on PR open
2. **dependency-updater.json**: Weekly dependency updates
3. **daily-standup.json**: Daily summary of activity
4. **issue-triager.json**: Auto-label GitHub issues
5. **slack-digest.json**: Weekly Slack highlights

### 8.2 Documentation

- **README.md**: Overview, quick start, features
- **CONTRIBUTING.md**: How to contribute
- **LICENSE**: MIT License
- **docs/**: Detailed guides

### 8.3 CI/CD

**File**: `.github/workflows/test.yml`

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm test
      - run: npm run build
```

### 8.4 Launch Checklist

- [ ] All tests passing
- [ ] Documentation complete
- [ ] Example workflows tested
- [ ] README has demo video/GIF
- [ ] License added
- [ ] Contributing guide
- [ ] GitHub topics added
- [ ] Initial release tag (v1.0.0)
- [ ] HN/Reddit posts drafted

---

## Success Criteria

By the end of Phase 8, you should have:

✅ Working Clawless installation (< 5 min setup)  
✅ Intelligence router saving 60%+ on costs  
✅ Chat-to-workflow compiler  
✅ GitHub integration  
✅ Cron-based scheduling  
✅ Web UI with dashboard  
✅ 5+ example workflows  
✅ Complete documentation  
✅ Ready for public launch  

---

## Next Steps After Launch

- Gather user feedback
- Add more tools (Slack, Email, Linear)
- Build plugin marketplace
- Create video tutorials
- Write blog posts
- Engage with community

---

This implementation plan should give a coding agent clear, actionable steps to build Clawless from scratch. Each phase builds on the previous one and produces working software.
