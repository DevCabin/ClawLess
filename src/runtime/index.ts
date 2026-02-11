import fs from 'fs';
import path from 'path';

function ensureDataDir(): void {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function bootstrapRuntime(): void {
  ensureDataDir();
  console.log('[Runtime] Clawless runtime bootstrap initialized (Phase 0).');
}

bootstrapRuntime();
