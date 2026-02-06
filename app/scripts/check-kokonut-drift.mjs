#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const srcRoot = path.join(projectRoot, 'src');

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css']);

const forbiddenPatterns = [
  { label: 'legacy topo-card class', regex: /\btopo-card\b/g },
  { label: 'legacy btn-primary class', regex: /\bbtn-primary\b/g },
  { label: 'legacy btn-secondary class', regex: /\bbtn-secondary\b/g },
  { label: 'legacy progress-track class', regex: /\bprogress-track\b/g },
  { label: 'legacy progress-fill class', regex: /\bprogress-fill\b/g },
  {
    label: 'legacy input utility class',
    regex: /className\s*=\s*["'`][^"'`]*\binput\b[^"'`]*["'`]/g,
  },
  {
    label: 'legacy alert-card class',
    regex: /className\s*=\s*["'`][^"'`]*\balert-card\b[^"'`]*["'`]/g,
  },
  {
    label: 'legacy guest-item class',
    regex: /className\s*=\s*["'`][^"'`]*\bguest-item\b[^"'`]*["'`]/g,
  },
  {
    label: 'legacy guest-avatar class',
    regex: /className\s*=\s*["'`][^"'`]*\bguest-avatar\b[^"'`]*["'`]/g,
  },
  {
    label: 'legacy freshness-meter class',
    regex: /className\s*=\s*["'`][^"'`]*\bfreshness-meter\b[^"'`]*["'`]/g,
  },
  {
    label: 'legacy freshness-bar class',
    regex: /className\s*=\s*["'`][^"'`]*\bfreshness-bar\b[^"'`]*["'`]/g,
  },
  {
    label: 'legacy freshness-fill class',
    regex: /className\s*=\s*["'`][^"'`]*\bfreshness-fill\b[^"'`]*["'`]/g,
  },
];

function walkFiles(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') {
        continue;
      }
      walkFiles(fullPath, out);
      continue;
    }

    if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      out.push(fullPath);
    }
  }

  return out;
}

function indexToLine(text, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (text[i] === '\n') {
      line += 1;
    }
  }
  return line;
}

function rel(filePath) {
  return path.relative(projectRoot, filePath);
}

const files = walkFiles(srcRoot);
const violations = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');

  for (const { label, regex } of forbiddenPatterns) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(content)) !== null) {
      violations.push({
        file: rel(file),
        line: indexToLine(content, match.index),
        label,
      });
    }
  }
}

const toastMountCount = files.reduce((count, file) => {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(/<ToastProvider\b/g);
  return count + (matches ? matches.length : 0);
}, 0);

if (toastMountCount !== 1) {
  violations.push({
    file: 'src',
    line: 1,
    label: `expected exactly 1 <ToastProvider> mount, found ${toastMountCount}`,
  });
}

const layoutPath = path.join(srcRoot, 'app', 'layout.tsx');
if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  const metadataMatch = layoutContent.match(
    /export const metadata\s*:[^=]*=\s*\{[\s\S]*?\n\};/
  );
  if (metadataMatch && /themeColor\s*:/.test(metadataMatch[0])) {
    violations.push({
      file: rel(layoutPath),
      line: 1,
      label: 'themeColor should live in viewport export, not metadata export',
    });
  }
}

if (violations.length > 0) {
  console.error('Kokonut drift checks failed:\n');
  for (const violation of violations) {
    console.error(`- ${violation.file}:${violation.line} -> ${violation.label}`);
  }
  process.exit(1);
}

console.log('Kokonut drift checks passed.');
