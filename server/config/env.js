import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');

const result = dotenv.config({ path: envPath });

if (result.error && process.env.NODE_ENV !== 'test') {
  console.warn(`Warning: Could not load .env from ${envPath}`);
  console.warn('Copy server/.env.example to server/.env and set MONGODB_URI');
}

const required = ['MONGODB_URI', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error('\nMissing required environment variables:', missing.join(', '));
  console.error(`Expected .env file at: ${envPath}`);
  console.error('\nFix:');
  console.error('  1. cd server');
  console.error('  2. copy .env.example .env');
  console.error('  3. Set MONGODB_URI=mongodb://127.0.0.1:27017/quickbill_pos\n');
  process.exit(1);
}
