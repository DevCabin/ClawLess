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
