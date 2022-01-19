import {AdvinstTool} from '../src/advinsttool';

import * as toolCache from '@actions/tool-cache';
jest.mock('@actions/tool-cache');
const mockToolCache: jest.Mocked<typeof toolCache> = <
  jest.Mocked<typeof toolCache>
>toolCache;

import * as utils from '../src/utils';
jest.mock('../src/utils');
const mockUtils: jest.Mocked<typeof utils> = <jest.Mocked<typeof utils>>utils;

import * as exec from '@actions/exec';
jest.mock('@actions/exec');
const mockExec: jest.Mocked<typeof exec> = <jest.Mocked<typeof exec>>exec;

import * as core from '@actions/core';
jest.mock('@actions/core');
const mockCore: jest.Mocked<typeof core> = <jest.Mocked<typeof core>>core;
mockCore.info.mockImplementation(jest.fn());

describe('Test AdvinstTool.download', () => {
  it('should return empty', async () => {
    mockToolCache.downloadTool.mockResolvedValue('');
    const advinstTool = new AdvinstTool('fooVer', 'fooLicense', false);
    const result = await advinstTool.download();
    expect(toolCache.downloadTool).toHaveBeenCalledWith(
      'https://www.advancedinstaller.com/downloads/fooVer/advinst.msi'
    );
    expect(result).toBe('');
  });

  it('should return downloaded path', async () => {
    mockToolCache.downloadTool.mockResolvedValue('fooToolPath');
    const advinstTool = new AdvinstTool('19.0', 'fooLicense', false);
    const result = await advinstTool.download();
    expect(toolCache.downloadTool).toHaveBeenCalledWith(
      'https://www.advancedinstaller.com/downloads/19.0/advinst.msi'
    );
    expect(result).toBe('fooToolPath');
  });
});

describe('Test AdvinstTool.extract', () => {
  it('should succeed', async () => {
    mockUtils.getRunnerTempDir.mockReturnValue('fooRunnerTmpDir');
    mockExec.getExecOutput.mockResolvedValue({
      exitCode: 0,
      stdout: 'fooStdout',
      stderr: 'fooStderr'
    });
    mockToolCache.cacheDir.mockResolvedValue('fooCacheDir');

    const advinstTool = new AdvinstTool('19.0', 'fooLicense', false);
    const result = await advinstTool.extract('fooSetupPath');
    expect(exec.getExecOutput).toHaveBeenCalledWith(
      'msiexec /a "fooSetupPath" TARGETDIR="fooRunnerTmpDir\\advinst" /qn'
    );
    expect(toolCache.cacheDir).toHaveBeenCalledWith(
      'fooRunnerTmpDir\\advinst',
      'advinst',
      '19.0',
      'x86'
    );
    expect(result).toBe('fooCacheDir');
  });

  it('should fail', async () => {
    mockUtils.getRunnerTempDir.mockReturnValue('fooRunnerTmpDir');
    mockExec.getExecOutput.mockResolvedValue({
      exitCode: 1,
      stdout: 'fooStdout',
      stderr: 'fooStderr'
    });

    const advinstTool = new AdvinstTool('19.0', 'fooLicense', false);
    await expect(advinstTool.extract('fooSetupPath')).rejects.toThrow(
      'fooStdout'
    );
  });
});

describe('Test AdvinstTool.register', () => {
  it('should succeed', async () => {
    mockExec.getExecOutput.mockResolvedValue({
      exitCode: 0,
      stdout: 'fooStdout',
      stderr: 'fooStderr'
    });

    const advinstTool = new AdvinstTool('19.0', 'fooLicense', false);
    await advinstTool.register('fooToolPath');
    expect(exec.getExecOutput).toHaveBeenCalledWith(
      'fooToolPath /RegisterCI fooLicense'
    );
  });

  it('should fail', async () => {
    mockExec.getExecOutput.mockResolvedValue({
      exitCode: 1,
      stdout: 'fooStdout',
      stderr: 'fooStderr'
    });

    const advinstTool = new AdvinstTool('19.0', 'fooLicense', false);
    await expect(advinstTool.register('fooToolPath')).rejects.toThrow(
      'fooStdout'
    );
  });

  it('should be skipped because license is empty', async () => {
    const advinstTool = new AdvinstTool('19.0', '', false);
    await advinstTool.register('fooToolPath');
    expect(exec.getExecOutput).not.toHaveBeenCalled();
  });
});

describe('Test AdvinstTool.registerCom', () => {
  it('should succeed', async () => {
    mockExec.getExecOutput.mockResolvedValue({
      exitCode: 0,
      stdout: 'fooStdout',
      stderr: 'fooStderr'
    });

    const advinstTool = new AdvinstTool('19.0', '', true);
    await advinstTool.registerCom('fooToolPath');
    expect(exec.getExecOutput).toHaveBeenCalledWith('fooToolPath /REGSERVER');
  });

  it('should fail', async () => {
    mockExec.getExecOutput.mockResolvedValue({
      exitCode: 1,
      stdout: 'fooStdout',
      stderr: 'fooStderr'
    });

    const advinstTool = new AdvinstTool('19.0', '', true);
    await expect(advinstTool.registerCom('fooToolPath')).rejects.toThrow(
      'fooStdout'
    );
  });

  it('should be skipped because registration disabled', async () => {
    const advinstTool = new AdvinstTool('19.0', '', false);
    await advinstTool.registerCom('fooToolPath');
    expect(exec.getExecOutput).not.toHaveBeenCalled();
  });
});

describe('Test AdvinstTool.exportVariables', () => {
  it('should succeed', () => {
    const advinstTool = new AdvinstTool('19.0', '', false);
    advinstTool.exportVariables('fooToolRoot');
    expect(core.exportVariable).toHaveBeenNthCalledWith(
      1,
      'AdvancedInstallerRoot',
      'fooToolRoot'
    );
    expect(core.exportVariable).toHaveBeenNthCalledWith(
      2,
      'AdvancedInstallerMSBuildTargets',
      'fooToolRoot\\ProgramFilesFolder\\MSBuild\\Caphyon\\Advanced Installer'
    );
  });
});

describe('Test AdvinstTool.getPath', () => {
  beforeAll(() => {
    jest
      .spyOn(AdvinstTool.prototype, 'download')
      .mockResolvedValue('fooDownloadedPath');
    jest
      .spyOn(AdvinstTool.prototype, 'extract')
      .mockResolvedValue('fooExtractPath');
    jest.spyOn(AdvinstTool.prototype, 'register').mockImplementation(jest.fn());
    jest
      .spyOn(AdvinstTool.prototype, 'registerCom')
      .mockImplementation(jest.fn());
    jest
      .spyOn(AdvinstTool.prototype, 'exportVariables')
      .mockImplementation(jest.fn());
    mockCore.addPath.mockImplementation(jest.fn());
    mockUtils.exists.mockResolvedValue(true);
  });

  it('should use cached tool path', async () => {
    mockToolCache.find.mockReturnValue('fooToolCachePath');
    const toolPath = 'fooToolCachePath\\bin\\x86\\advancedinstaller.com';

    const advinstTool = new AdvinstTool('19.0', 'fooLicense', false);
    const result = await advinstTool.getPath();
    expect(toolCache.find).toHaveBeenCalledWith('advinst', '19.0', 'x86');
    expect(AdvinstTool.prototype.download).not.toHaveBeenCalled();
    expect(AdvinstTool.prototype.extract).not.toHaveBeenCalled();
    expect(AdvinstTool.prototype.register).toHaveBeenCalled();
    expect(AdvinstTool.prototype.registerCom).toHaveBeenCalled();
    expect(AdvinstTool.prototype.exportVariables).toHaveBeenCalled();
    expect(core.addPath).toHaveBeenCalledWith('fooToolCachePath\\bin\\x86');
    expect(result).toBe(toolPath);
  });

  it('should download tool and cache it', async () => {
    mockToolCache.find.mockReturnValue('');
    const advinstTool = new AdvinstTool('19.0', 'fooLicense', false);
    const result = await advinstTool.getPath();
    expect(toolCache.find).toHaveBeenCalledWith('advinst', '19.0', 'x86');
    expect(AdvinstTool.prototype.download).toHaveBeenCalled();
    expect(AdvinstTool.prototype.extract).toHaveBeenCalled();
    expect(AdvinstTool.prototype.register).toHaveBeenCalled();
    expect(AdvinstTool.prototype.registerCom).toHaveBeenCalled();
    expect(AdvinstTool.prototype.exportVariables).toHaveBeenCalled();
    expect(core.addPath).toHaveBeenCalledWith('fooExtractPath\\bin\\x86');
    expect(result).toBe('fooExtractPath\\bin\\x86\\advancedinstaller.com');
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });
});
