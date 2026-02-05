import * as esbuild from 'esbuild';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Clean dist directory
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}

// Find all TypeScript files
const entryPoints = await glob('src/**/*.ts', {
  cwd: __dirname,
  absolute: true
});

try {
  await esbuild.build({
    entryPoints,
    outdir: 'dist',
    format: 'esm',
    platform: 'node',
    target: 'node20',
    sourcemap: true,
    outExtension: { '.js': '.js' },
    bundle: false,
    external: [
      'bcrypt',
      'cookie-parser',
      'cors',
      'dotenv',
      'exceljs',
      'express',
      'ioredis',
      'jsonwebtoken',
      'mongoose',
      'multer',
      'uuid'
    ],
  });
  console.log('✅ Build complete!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
