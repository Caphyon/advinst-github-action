import assert from 'assert';

export function isWindows(): boolean {
  return process.platform === 'win32';
}

export function getRunnerTempDir(): string {
  const tempDirectory = process.env['RUNNER_TEMP'] || '';
  assert(tempDirectory, 'Expected RUNNER_TEMP to be defined');
  return tempDirectory;
}

export function getVariable(name: string): string {
  const value = process.env[name] || '';
  return value;
}
