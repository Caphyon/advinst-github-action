import * as utils from '../src/utils';
import {join} from 'path';

const originalEnv = process.env;

describe('Test utils.exists', () => {
  it('file should exist', async () => {
    expect(await utils.exists(join(__dirname, './__data__/updates.ini'))).toBe(
      true
    );
  });

  it('directory should exist', async () => {
    expect(await utils.exists(join(__dirname, './__data__/'))).toBe(true);
  });

  it('path should not exist', async () => {
    expect(await utils.exists(join(__dirname, './__data__/foo'))).toBe(false);
  });
});

describe('Test utils.isWindows ', () => {
  const originalPlatform = process.platform;
  it('should return false', () => {
    Object.defineProperty(process, 'platform', {
      value: 'MockOS'
    });
    expect(utils.isWindows()).toBe(false);
    Object.defineProperty(process, 'platform', {
      value: originalPlatform
    });
  });

  it('should return true', () => {
    Object.defineProperty(process, 'platform', {
      value: 'win32'
    });
    expect(utils.isWindows()).toBe(true);
    Object.defineProperty(process, 'platform', {
      value: originalPlatform
    });
  });
});

describe('Test utils.getRunnerTempDir', () => {
  beforeAll(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      RUNNER_TEMP: 'fooRunnerTmpDir'
    };
  });

  it('should return fooRunnerTmpDir', () => {
    expect(utils.getRunnerTempDir()).toBe('fooRunnerTmpDir');
  });

  it('should return empty', () => {
    delete process.env.RUNNER_TEMP;
    expect(utils.getRunnerTempDir()).toBe('');
  });

  afterAll(() => {
    process.env = originalEnv;
  });
});

describe('Test utils.getVariable', () => {
  beforeAll(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      FOO: 'foo'
    };
  });

  it('should return foo', () => {
    expect(utils.getVariable('FOO')).toBe('foo');
  });

  it('should return empty', () => {
    delete process.env.FOO;
    expect(utils.getVariable('FOO')).toBe('');
  });

  afterAll(() => {
    process.env = originalEnv;
  });
});
