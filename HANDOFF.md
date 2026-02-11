# Clawless: Coding Agent Handoff Document

**To the next coding agent (Cursor, Aider, GPT Engineer, etc.):**

This document contains everything you need to build Clawless from scratch. Read this first, then reference the other documents as needed.

---

## What You're Building

**Clawless** is an open-source personal agent runtime that:
- Executes workflows automatically (cron, webhooks, manual)
- Routes tasks between local AI (Ollama - free) and cloud AI (Claude - paid)
- Saves 60%+ on AI costs through smart routing
- Provides a web UI for management
- Compiles natural language into workflows

**Think**: Open-source OpenClaw alternative with hybrid intelligence.

---

## Quick Start: What to Do First

### Step 1: Read These Files (10 minutes)

1. **PRD.md** - Understand what we're building and why
2. **ARCHITECTURE.md** - Understand how it all fits together
3. **IMPLEMENTATION_PLAN.md** - Your step-by-step build guide
4. **.cursorrules** - Coding standards and patterns

### Step 2: Set Up Project (5 minutes)

```bash
mkdir clawless && cd clawless
git init
npm init -y
```

Copy the `package.json` from Phase 0 in IMPLEMENTATION_PLAN.md and install:

```bash
npm install
```

### Step 3: Follow Implementation Plan (8 weeks)

Start with **Phase 0: Foundation** in IMPLEMENTATION_PLAN.md and work through each phase sequentially.

Each phase has:
- Clear goal
- Specific tasks
- Code examples
- Deliverable

---

## Project Structure You'll Create

```
clawless/
├── src/
│   ├── runtime/              # Workflow execution
│   │   ├── engine.ts         # ⭐ Core execution engine
│   │   ├── scheduler.ts      # Cron & webhooks
│   │   ├── state.ts          # SQLite persistence
│   │   └── memory.ts         # In-memory context
│   ├── intelligence/         # ⭐⭐ THE KEY DIFFERENTIATOR
│   │   ├── router.ts         # Smart Ollama/Claude routing
│   │   ├── complexity.ts     # Complexity analyzer
│   │   ├── quality.ts        # Quality validator
│   │   └── providers/
│   │       ├── claude.ts
│   │       ├── ollama.ts
│   │       └── base.ts
│   ├── tools/                # External integrations
│   │   ├── github.ts         # GitHub API
│   │   ├── slack.ts          # Slack API
│   │   ├── registry.ts       # Tool registry
│   │   └── base.ts           # Tool interface
│   ├── compiler/             # Chat → Workflow
│   │   ├── parser.ts
│   │   ├── generator.ts
│   │   └── validator.ts
│   ├── web/                  # Next.js UI
│   │   ├── app/
│   │   │   ├── page.tsx      # Dashboard
│   │   │   ├── setup/        # Setup wizard
│   │   │   ├── workflows/    # Workflow manager
│   │   │   ├── executions/   # Execution logs
│   │   │   ├── chat/         # Chat interface
│   │   │   └── api/          # API routes
│   │   └── components/
│   └── shared/
│       ├── types.ts          # ⭐ Start here
│       ├── schemas.ts        # Zod schemas
│       └── utils.ts
├── workflows/                # User workflows (JSON files)
├── data/
│   ├── schema.sql           # Database schema
│   └── state.db             # SQLite database
├── examples/
│   └── workflows/
│       ├── pr-reviewer.json
│       └── dependency-updater.json
├── .env
├── config.yml
└── package.json
```

---

## The Most Important Components

### 1. Intelligence Router (THE DIFFERENTIATOR) ⭐⭐⭐

**Priority**: HIGHEST  
**Complexity**: MEDIUM  
**Reference**: SPEC_INTELLIGENCE_ROUTER.md

This is what makes Clawless unique. It:
- Analyzes task complexity (0-10 scale)
- Routes simple tasks to Ollama (free)
- Routes complex tasks to Claude (paid)
- Validates Ollama quality
- Falls back to Claude if needed

**Key files to build**:
1. `src/intelligence/complexity.ts` - Scores tasks
2. `src/intelligence/quality.ts` - Validates outputs
3. `src/intelligence/providers/ollama.ts` - Ollama integration
4. `src/intelligence/providers/claude.ts` - Claude integration
5. `src/intelligence/router.ts` - Main routing logic

**Success criteria**:
- 60%+ of requests handled by Ollama
- < 2% false negatives (Ollama fails but not caught)
- Full cost tracking

### 2. Workflow Engine

**Priority**: HIGH  
**Complexity**: MEDIUM  
**Reference**: ARCHITECTURE.md, Phase 1 in IMPLEMENTATION_PLAN.md

Executes workflow steps sequentially:
- Tool calls (GitHub, Slack, etc.)
- Agent calls (via Intelligence Router)
- Variable interpolation (`{{step.output}}`)
- Error handling & retries

**Key files to build**:
1. `src/runtime/state.ts` - SQLite persistence
2. `src/runtime/engine.ts` - Execution logic
3. `src/runtime/scheduler.ts` - Cron triggers

### 3. Chat-to-Workflow Compiler

**Priority**: MEDIUM  
**Complexity**: LOW (uses Claude to do heavy lifting)  
**Reference**: Phase 5 in IMPLEMENTATION_PLAN.md

Converts natural language into workflow JSON:
- User: "Review my PRs for security issues"
- System: Asks clarifying questions
- System: Generates workflow JSON
- User: Activates it

**Key files to build**:
1. `src/compiler/generator.ts` - Uses Claude to compile
2. `src/web/app/chat/page.tsx` - Chat UI
3. `src/web/app/api/chat/route.ts` - SSE streaming

### 4. Web UI

**Priority**: MEDIUM  
**Complexity**: LOW (standard Next.js)  
**Reference**: Phase 6-7 in IMPLEMENTATION_PLAN.md

Dashboard, workflow viewer, execution logs:
- Dashboard: stats, recent executions
- Workflows: list, edit, create
- Executions: detailed logs with costs
- Chat: create workflows via conversation
- Setup: first-run wizard

---

## Build Order (Critical!)

**DO NOT skip phases or build out of order.**

1. **Phase 0: Foundation** (Week 1)
   - Create project structure
   - Define types (`src/shared/types.ts`)
   - Set up database schema
   - Install dependencies

2. **Phase 1: Runtime Engine** (Week 2)
   - Build state manager (SQLite)
   - Build basic execution engine
   - Create tool system framework

3. **Phase 2: Intelligence Router** ⭐ (Week 3)
   - Build complexity analyzer
   - Build quality validator
   - Implement Ollama provider
   - Implement Claude provider
   - Wire up router with fallback logic

4. **Phase 3: GitHub Tool** (Week 4)
   - Implement real GitHub integration
   - List PRs, get diffs, create comments

5. **Phase 4: Scheduler** (Week 5)
   - Cron-based triggers
   - Workflow reload on file changes

6. **Phase 5: Chat Compiler** (Week 6)
   - Chat-to-workflow generation
   - API routes for chat

7. **Phase 6: Web UI** (Week 7)
   - Dashboard
   - Workflow viewer
   - Execution logs
   - Chat interface

8. **Phase 7: Setup Wizard** (Week 8)
   - First-run detection
   - API key configuration
   - Tool connection

9. **Phase 8: Polish** (Week 8)
   - Example workflows
   - Documentation
   - Testing
   - Launch prep

---

## Critical Implementation Notes

### TypeScript Types (Start Here!)

Create `src/shared/types.ts` FIRST. Everything else depends on it:

```typescript
export interface Workflow {
  id: string;
  name: string;
  trigger: Trigger;
  steps: Step[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Trigger = 
  | { type: 'cron'; schedule: string }
  | { type: 'webhook'; event: string }
  | { type: 'manual' };

export type Step = ToolStep | AgentStep;

// ... see IMPLEMENTATION_PLAN Phase 0.6 for full types
```

### SQLite Schema

Create `data/schema.sql`:

```sql
-- See IMPLEMENTATION_PLAN Phase 0.6 for full schema
CREATE TABLE executions (...);
CREATE TABLE step_executions (...);
CREATE TABLE cost_tracking (...);
```

### Environment Variables

Create `.env.example`:

```bash
ANTHROPIC_API_KEY=your-key-here
GITHUB_TOKEN=your-token-here
```

### Configuration

Create `config.yml.example`:

```yaml
intelligence:
  routing: auto
  ollama:
    enabled: true
    url: http://localhost:11434
    model: qwen2.5:7b
  # ... see IMPLEMENTATION_PLAN Phase 0.7
```

---

## Testing Strategy

Write tests alongside features:

```typescript
// Example test structure
describe('ComplexityAnalyzer', () => {
  it('should score simple extraction as low complexity', () => {
    const analyzer = new ComplexityAnalyzer();
    const score = analyzer.analyze({
      type: 'extraction',
      prompt: 'Extract repo from URL',
    });
    expect(score.score).toBeLessThan(6);
  });
});
```

Test files go next to source files:
- `src/intelligence/complexity.test.ts`
- `src/runtime/engine.test.ts`

---

## Common Pitfalls to Avoid

### 1. Building UI First
❌ **Don't** start with the web UI  
✅ **Do** build the runtime engine first

The runtime is the core value. UI is just a wrapper.

### 2. Skipping the Router
❌ **Don't** use Claude for everything  
✅ **Do** implement the Intelligence Router properly

This is the differentiator. Get it right.

### 3. Over-Engineering
❌ **Don't** add complex abstractions  
✅ **Do** keep it simple and readable

You're building an MVP, not an enterprise framework.

### 4. Ignoring Error Handling
❌ **Don't** assume everything works  
✅ **Do** handle errors gracefully

Every async function needs try-catch.

### 5. Building Without Types
❌ **Don't** use `any` types  
✅ **Do** define proper TypeScript interfaces

Types catch bugs early.

---

## How to Use This Handoff

### For Cursor AI:
1. Open the project folder
2. Read this document
3. Start with Phase 0 in IMPLEMENTATION_PLAN.md
4. Ask Cursor to implement each task sequentially
5. Reference ARCHITECTURE.md and SPEC files as needed

### For Aider:
```bash
aider --read PRD.md --read ARCHITECTURE.md --read IMPLEMENTATION_PLAN.md
# Then: "Implement Phase 0: Foundation"
```

### For GPT Engineer / Devin:
1. Upload all .md files
2. Point to IMPLEMENTATION_PLAN.md
3. Request: "Implement Phase 0, then Phase 1, etc."

### For Manual Development:
1. Follow IMPLEMENTATION_PLAN.md step by step
2. Reference ARCHITECTURE.md for design decisions
3. Reference .cursorrules for coding standards
4. Reference SPEC files for detailed component specs

---

## File Reference Guide

| File | Purpose | When to Read |
|------|---------|--------------|
| PRD.md | Product vision, features, success metrics | Start (understand WHY) |
| ARCHITECTURE.md | System design, data flow, tech decisions | Start (understand HOW) |
| IMPLEMENTATION_PLAN.md | Step-by-step build guide | Always (your roadmap) |
| .cursorrules | Coding standards, patterns, conventions | During coding |
| SPEC_INTELLIGENCE_ROUTER.md | Detailed router spec | Phase 2 |

---

## Success Checkpoints

After each phase, verify:

✅ **Phase 0**: All files created, types defined, dependencies installed  
✅ **Phase 1**: Workflows can execute (even without real tools/LLMs)  
✅ **Phase 2**: Router correctly routes to Ollama/Claude based on complexity  
✅ **Phase 3**: Can list PRs and get diffs from real GitHub repos  
✅ **Phase 4**: Workflows trigger on cron schedules  
✅ **Phase 5**: Can create workflow via chat  
✅ **Phase 6**: Web UI shows dashboard and logs  
✅ **Phase 7**: Setup wizard configures API keys  
✅ **Phase 8**: Example workflows work end-to-end  

---

## When You Get Stuck

1. **Check IMPLEMENTATION_PLAN.md** for step-by-step guidance
2. **Check ARCHITECTURE.md** for design decisions
3. **Check .cursorrules** for coding patterns
4. **Look at similar code** in the project
5. **Ask for clarification** before guessing

---

## Final Notes

### This is a Working MVP

We're building something users can actually run and use, not a proof-of-concept.

### Quality > Speed

Take time to:
- Write proper types
- Handle errors
- Add tests
- Document code

### The Router is Critical

60% of Clawless's value is smart model routing. Get this right.

### Keep it Simple

No complex abstractions. Readable code > clever code.

---

## Ready to Start?

1. Create project folder
2. Copy `package.json` from IMPLEMENTATION_PLAN Phase 0
3. Run `npm install`
4. Create `src/shared/types.ts` from Phase 0
5. Create database schema from Phase 0
6. Start building! 🚀

**Good luck! You're building something users will love.** 🐾

---

## Questions?

If the coding agent has questions:
- ARCHITECTURE.md answers "how should this work?"
- IMPLEMENTATION_PLAN.md answers "what should I build?"
- .cursorrules answers "how should I code this?"
- SPEC files answer "what are the exact requirements?"

Everything you need is in these documents.

Now go build! 💪
