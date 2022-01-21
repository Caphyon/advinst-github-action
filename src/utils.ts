import fs from 'fs/promises';

export function isWindows(): boolean {
  return process.platform === 'win32';
}

export function getRunnerTempDir(): string {
  return getVariable('RUNNER_TEMP');
}

export function getVariable(name: string): string {
  const value = process.env[name] || '';
  return value;
}

export async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch (error) {
    return false;
  }
}
