# Intelligence Router Specification

## Overview

The Intelligence Router is the **core differentiator** of Clawless. It automatically routes tasks to the most cost-effective model capable of handling them, achieving 60%+ cost savings while maintaining output quality.

---

## Responsibilities

1. **Assess task complexity** (0-10 scale)
2. **Route to appropriate model** (none, Ollama, or Claude)
3. **Execute with chosen provider**
4. **Validate output quality**
5. **Fallback to Claude** if Ollama fails or produces low-quality output
6. **Track costs and usage**

---

## Component Architecture

```
IntelligenceRouter
├── ComplexityAnalyzer
│   └── analyze(task) → ComplexityScore
├── QualityValidator
│   └── validate(response, task) → boolean
├── Providers
│   ├── OllamaProvider
│   └── ClaudeProvider
└── execute(task) → AgentResponse
```

---

## Data Structures

### Input: AgentTask

```typescript
interface AgentTask {
  type: TaskType;           // What kind of task
  prompt: string;           // The actual prompt
  context?: string;         // Optional context
  tools?: Tool[];           // Tools the agent can use
  expectsJSON?: boolean;    // Should output be JSON?
  requiredFields?: string[]; // Required JSON fields
  minLength?: number;       // Minimum response length
  isRetry?: boolean;        // Is this a retry?
}

type TaskType = 
  | 'extraction'           // Extract data from text
  | 'classification'       // Classify/categorize
  | 'planning'            // Plan next steps
  | 'code_review'         // Review code quality
  | 'security_analysis'   // Security review
  | 'workflow_compilation' // Convert chat to workflow
  | 'error_recovery';     // Debug failures
```

### Output: AgentResponse

```typescript
interface AgentResponse {
  content: string;          // The actual response
  modelUsed: 'ollama' | 'claude'; // Which model was used
  tokensInput: number;      // Input tokens consumed
  tokensOutput: number;     // Output tokens generated
  cost: number;            // Cost in USD
}
```

### Internal: ComplexityScore

```typescript
interface ComplexityScore {
  score: number;           // 0-10
  reasoning: string;       // Human-readable explanation
  factors: {
    taskType: number;      // Contribution from task type
    contextSize: number;   // Contribution from context length
    ambiguity: number;     // Contribution from ambiguity
    reasoning: number;     // Contribution from reasoning needs
    toolCount: number;     // Contribution from tool count
  };
  recommendedModel: 'none' | 'ollama' | 'claude';
}
```

---

## Complexity Scoring Algorithm

### 1. Task Type Scoring

Each task type has a base complexity:

```typescript
const typeScores: Record<TaskType, number> = {
  'extraction': 2,           // Simple: extract email from text
  'classification': 1,        // Trivial: is this urgent? yes/no
  'planning': 4,             // Moderate: plan next 3 steps
  'code_review': 8,          // Complex: review for bugs/style
  'security_analysis': 9,    // Very complex: find vulnerabilities
  'workflow_compilation': 7, // Complex: natural language → structured data
  'error_recovery': 5,       // Moderate: why did this fail?
};
```

**Rationale:**
- Simple extraction/classification can be pattern-matching
- Planning requires some reasoning but bounded
- Code/security review needs deep understanding
- Workflow compilation needs structured thinking

### 2. Context Size Scoring

Larger context = harder to process for small models:

```typescript
if (context.length > 10000) {
  score += 3;
} else if (context.length > 5000) {
  score += 2;
} else if (context.length > 2000) {
  score += 1;
}
```

**Rationale:**
- Small models have limited context windows
- Large context increases chance of hallucination
- Processing time increases with context

### 3. Ambiguity Detection

Ambiguous prompts require reasoning to resolve:

```typescript
const ambiguousPatterns = [
  /\b(maybe|might|could|should|probably)\b/i,
  /\?.*\?/,  // Multiple questions
  /\b(or|either)\b/i,
];

if (ambiguousPatterns.some(pattern => pattern.test(prompt))) {
  score += 2;
}
```

**Examples:**
- "Should I use X or Y?" → ambiguous (+2)
- "Extract the URL" → clear (no penalty)

### 4. Reasoning Requirements

Tasks that require multi-step reasoning:

```typescript
if (task.type === 'planning' || task.type === 'error_recovery') {
  score += 3;
}
```

### 5. Tool Count

More tools = more complexity:

```typescript
if (tools.length > 3) {
  score += 1;
}
```

### 6. Retry Penalty

If this is a retry (Ollama failed before):

```typescript
if (task.isRetry) {
  score += 2;
}
```

### Final Score Calculation

```typescript
let score = 0;

// Task type
score += typeScores[task.type] || 3;

// Context size
score += getContextSizeScore(task.context);

// Ambiguity
if (detectAmbiguity(task.prompt)) score += 2;

// Reasoning
if (requiresReasoning(task.type)) score += 3;

// Tool count
if (task.tools && task.tools.length > 3) score += 1;

// Retry
if (task.isRetry) score += 2;

return score; // 0-15+ range, typically 0-12
```

---

## Model Selection Logic

Based on complexity score:

```typescript
function selectModel(score: number): 'none' | 'ollama' | 'claude' {
  if (score < 2) {
    return 'none';  // Deterministic, no LLM needed
  }
  
  if (score < 7) {
    return 'ollama';  // Ollama can handle this
  }
  
  return 'claude';  // Need Claude's reasoning power
}
```

**Thresholds Rationale:**

- **0-2**: Pattern matching, regex, simple logic
  - Examples: "Is this a valid email?", "Extract repo name from URL"
  
- **3-6**: Ollama's sweet spot
  - Examples: "Summarize this PR in 2 sentences", "Extract fields from email"
  
- **7+**: Claude required
  - Examples: "Review code for security issues", "Convert chat to workflow"

---

## Quality Validation

After Ollama execution, validate output quality:

### 1. JSON Validity

```typescript
if (task.expectsJSON) {
  try {
    const parsed = JSON.parse(response.content);
    
    // Check required fields
    if (task.requiredFields) {
      const hasAll = task.requiredFields.every(field => field in parsed);
      if (!hasAll) return false;
    }
  } catch {
    return false;  // Invalid JSON
  }
}
```

### 2. Length Check

```typescript
if (task.minLength && response.content.length < task.minLength) {
  return false;  // Too short, likely incomplete
}
```

### 3. Hallucination Detection

```typescript
function detectHallucination(response: AgentResponse, task: AgentTask): boolean {
  const content = response.content.toLowerCase();
  
  // Placeholder detection
  if (content.includes('todo') || content.includes('fixme')) {
    return true;
  }
  
  if (content.includes('example.com') || content.includes('placeholder')) {
    return true;
  }
  
  // Entity-based detection
  if (task.context) {
    const responseEntities = extractEntities(response.content);
    const contextEntities = extractEntities(task.context);
    const hallucinated = responseEntities.filter(e => !contextEntities.includes(e));
    
    // If >50% of entities are made up, fail
    if (hallucinated.length > responseEntities.length * 0.5) {
      return true;
    }
  }
  
  return false;
}
```

**Entity Extraction** (simple version):

```typescript
function extractEntities(text: string): string[] {
  const entities: string[] = [];
  
  // URLs
  const urls = text.match(/https?:\/\/[^\s]+/g) || [];
  entities.push(...urls);
  
  // Proper nouns (capitalized words)
  const words = text.match(/\b[A-Z][a-z]+\b/g) || [];
  entities.push(...words);
  
  return [...new Set(entities)];
}
```

---

## Execution Flow

```
1. Assess complexity
   ↓
2. Select model based on score
   ↓
3. If 'none': throw error (caller should use deterministic logic)
   ↓
4. If 'ollama':
   a. Check Ollama availability
   b. Execute with Ollama
   c. Validate quality
   d. If valid: return result
   e. If invalid/failed: fallback to Claude
   ↓
5. If 'claude': execute with Claude
   ↓
6. Record cost and usage
   ↓
7. Return result
```

### Code Flow

```typescript
async execute(task: AgentTask): Promise<AgentResponse> {
  // 1. Assess complexity
  const score = this.complexity.analyze(task);
  console.log(`[Router] Complexity: ${score.score} - ${score.reasoning}`);
  
  // 2. Select model
  const model = score.recommendedModel;
  
  // 3. Deterministic tasks shouldn't use LLM
  if (model === 'none') {
    throw new Error('Task is deterministic, should not use LLM router');
  }
  
  // 4. Try Ollama for simple/moderate tasks
  if (model === 'ollama' || score.score < 8) {
    if (this.config.ollamaFallback) {
      try {
        // Check availability
        const available = await this.ollama.isAvailable();
        if (!available) {
          console.log('[Router] Ollama not available, using Claude');
          return await this.claude.execute(task);
        }
        
        // Execute
        const result = await this.ollama.execute(task, {
          temperature: 0.1,
          timeout: this.config.ollamaTimeout,
        });
        
        // Validate
        if (this.quality.validate(result, task)) {
          console.log('[Router] Ollama success');
          this.recordUsage(result);
          return result;
        }
        
        console.log('[Router] Ollama quality check failed, fallback to Claude');
      } catch (error: any) {
        console.log(`[Router] Ollama failed: ${error.message}, fallback to Claude`);
      }
    }
  }
  
  // 5. Use Claude (complex task or Ollama failed)
  console.log('[Router] Using Claude');
  const result = await this.claude.execute(task);
  this.recordUsage(result);
  return result;
}
```

---

## Provider Implementations

### Ollama Provider

```typescript
class OllamaProvider implements LLMProvider {
  name = 'ollama';
  
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
        cost: 0,  // Ollama is free
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

**Key Features:**
- 5s timeout by default (fail fast)
- Low temperature (0.1) for consistency
- Clear prompt formatting
- Availability check

### Claude Provider

```typescript
class ClaudeProvider implements LLMProvider {
  name = 'claude';
  private client: Anthropic;
  
  async execute(task: AgentTask, options: ExecuteOptions = {}): Promise<AgentResponse> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature || 0.7,
      messages: [{
        role: 'user',
        content: this.buildPrompt(task),
      }],
    });
    
    const content = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';
    
    const tokensInput = response.usage.input_tokens;
    const tokensOutput = response.usage.output_tokens;
    
    // Claude Sonnet 4.5: $3/$15 per million tokens
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

**Key Features:**
- Accurate cost tracking
- Standard temperature (0.7)
- Simple prompt format
- Availability check

---

## Cost Tracking

Every execution is tracked:

```typescript
interface CostRecord {
  date: string;          // YYYY-MM-DD
  model: 'ollama' | 'claude';
  tokensInput: number;
  tokensOutput: number;
  cost: number;
  executionCount: number;
}

// Stored in database
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
```

---

## Configuration

```yaml
intelligence:
  routing: auto  # auto | claude-only | ollama-only
  
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
```

---

## Testing Strategy

### Unit Tests

1. **Complexity Analyzer**
   - Simple extraction → low score
   - Code review → high score
   - Large context → increased score
   - Ambiguous prompt → increased score

2. **Quality Validator**
   - Valid JSON → pass
   - Invalid JSON → fail
   - Hallucinated content → fail
   - Short response → fail (if minLength set)

3. **Model Selection**
   - Score 1 → none
   - Score 5 → ollama
   - Score 9 → claude

### Integration Tests

1. **Ollama Success Path**
   - Simple task → Ollama executes → quality validates → returns

2. **Ollama Failure → Claude Fallback**
   - Simple task → Ollama fails → Claude executes → returns

3. **Ollama Quality Fail → Claude Fallback**
   - Simple task → Ollama executes → quality fails → Claude executes → returns

4. **Complex Task Direct to Claude**
   - Complex task → skips Ollama → Claude executes → returns

### Example Test Cases

```typescript
describe('IntelligenceRouter', () => {
  it('should use Ollama for simple extraction', async () => {
    const task: AgentTask = {
      type: 'extraction',
      prompt: 'Extract repo name from: https://github.com/user/repo',
    };
    
    const result = await router.execute(task);
    
    expect(result.modelUsed).toBe('ollama');
    expect(result.cost).toBe(0);
  });
  
  it('should use Claude for code review', async () => {
    const task: AgentTask = {
      type: 'code_review',
      prompt: 'Review this code for security issues',
      context: 'function login(user, pass) { ... }',
    };
    
    const result = await router.execute(task);
    
    expect(result.modelUsed).toBe('claude');
    expect(result.cost).toBeGreaterThan(0);
  });
  
  it('should fallback to Claude on Ollama quality failure', async () => {
    // Mock Ollama to return invalid JSON
    ollamaMock.setResponse('not valid json');
    
    const task: AgentTask = {
      type: 'extraction',
      prompt: 'Extract data',
      expectsJSON: true,
    };
    
    const result = await router.execute(task);
    
    expect(result.modelUsed).toBe('claude');
  });
});
```

---

## Performance Targets

- **Ollama execution**: < 5 seconds
- **Claude execution**: < 10 seconds
- **Complexity analysis**: < 10ms
- **Quality validation**: < 50ms
- **Fallback latency**: < 100ms overhead

---

## Monitoring & Metrics

Track and expose:

1. **Model usage distribution**
   - % of requests handled by Ollama
   - % of requests handled by Claude
   - Fallback rate (Ollama → Claude)

2. **Cost metrics**
   - Daily cost
   - Monthly cost
   - Cost per execution
   - Projected monthly cost

3. **Quality metrics**
   - Ollama success rate
   - Ollama quality failure rate
   - Average complexity score

4. **Performance metrics**
   - Average Ollama execution time
   - Average Claude execution time
   - P95/P99 latencies

---

## Error Scenarios

### Ollama Unavailable
- Behavior: Skip Ollama, use Claude
- Log: "[Router] Ollama not available, using Claude"

### Ollama Timeout
- Behavior: Fallback to Claude
- Log: "[Router] Ollama timeout, fallback to Claude"

### Ollama Quality Fail
- Behavior: Fallback to Claude
- Log: "[Router] Ollama quality check failed, fallback to Claude"

### Claude API Error
- Behavior: Throw error (no fallback)
- Log: "[Router] Claude API error: {message}"

### Both Models Unavailable
- Behavior: Throw error
- Log: "[Router] No available models"

---

## Future Enhancements

1. **Learning from failures**
   - Track which tasks Ollama consistently fails
   - Adjust complexity scoring based on patterns

2. **Custom complexity rules**
   - User-defined complexity overrides
   - Per-workflow model preferences

3. **Cost budgeting**
   - Hard limits on daily/monthly spend
   - Pause executions when limit reached

4. **A/B testing**
   - Run both models for same task
   - Compare outputs
   - Improve quality validation

5. **Multiple local models**
   - Different Ollama models for different tasks
   - Specialized models (code, writing, etc.)

---

## Summary

The Intelligence Router is the **heart of Clawless**. It makes the system:

✅ **Cost-effective**: 60%+ savings by using free Ollama  
✅ **High-quality**: Claude for complex tasks  
✅ **Reliable**: Automatic fallback on failures  
✅ **Transparent**: Full visibility into decisions  

Implementation priority: **HIGH**
Testing priority: **HIGH**
Documentation priority: **HIGH**

This is what makes Clawless unique.
