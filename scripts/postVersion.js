#!/usr/bin/env node
const exec = require('child_process');
const path = require('path');

(() => {
  const isCI = process.env.CI;
  if (isCI) {
    return;
  }
  const ROOT_dir = path.join(__dirname, '..');
  exec.execSync(`pnpm install --ignore-scripts && git add pnpm-lock.yaml`, {
    cwd: ROOT_dir,
    stdio: 'inherit'
  });
})();
