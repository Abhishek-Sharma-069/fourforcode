import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const envPath = path.join(rootDir, '.env');
const outPath = path.join(rootDir, 'src', 'app', 'core', 'config', 'api.config.ts');

let backendUrl = '';

if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, 'utf-8');
  const lines = raw.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (key === 'BACKEND_URL' && value) {
      backendUrl = value.replace(/^['"]|['"]$/g, '');
    }
  }
}

if (!backendUrl) {
  throw new Error('BACKEND_URL is required in frontend/.env');
}

const output = `export const API_BASE_URL = '${backendUrl}';\n`;
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, output, 'utf-8');
console.log(`API_BASE_URL synced: ${backendUrl}`);
