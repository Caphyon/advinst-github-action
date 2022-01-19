import {AdvinstBuilder} from '../src/advinstbuilder';
import {AdvinstCommands} from '../src/advinstcommands';

import * as exec from '@actions/exec';
jest.mock('@actions/exec');
const mockExec: jest.Mocked<typeof exec> = <jest.Mocked<typeof exec>>exec;

import * as io from '@actions/io';
import {isJsxText} from 'typescript';
jest.mock('@actions/io');
const mockIO: jest.Mocked<typeof io> = <jest.Mocked<typeof io>>io;

describe('Test AdvinstBuilder.run', () => {
  it('should skip because aipPath is empty', async () => {
    const advinstBuilder = new AdvinstBuilder('advinst.exe');
    await advinstBuilder.run();
    expect(exec.getExecOutput).not.toHaveBeenCalled();
  });

  it('should succeed', async () => {
    jest.spyOn(AdvinstCommands.prototype, 'add').mockImplementation(jest.fn());
    jest
      .spyOn(AdvinstCommands.prototype, 'toCommandsFile')
      .mockResolvedValue('fooCommandsFile');
    mockExec.getExecOutput.mockResolvedValue({
      exitCode: 0,
      stdout: 'fooStdout',
      stderr: 'fooStderr'
    });

    const advinstBuilder = new AdvinstBuilder('fooToolPath');
    advinstBuilder.setAipPath('fooAipPath');
    advinstBuilder.setAipBuildName('fooAipBuildName');
    advinstBuilder.setAipPackageName('fooAipPackageName');
    advinstBuilder.setAipOutputDir('fooAipOutputDir');
    advinstBuilder.setAipCommands('fooAipCommands');
    await advinstBuilder.run();

    expect(AdvinstCommands.prototype.add).toHaveBeenCalledTimes(4);
    expect(exec.getExecOutput).toHaveBeenCalledWith(
      'fooToolPath /execute "fooAipPath" "fooCommandsFile"'
    );
    expect(io.rmRF).toHaveBeenCalledWith('fooCommandsFile');
  });

  it('should fail', async () => {
    jest.spyOn(AdvinstCommands.prototype, 'add').mockImplementation(jest.fn());
    jest
      .spyOn(AdvinstCommands.prototype, 'toCommandsFile')
      .mockResolvedValue('fooCommandsFile');
    mockExec.getExecOutput.mockResolvedValue({
      exitCode: 1,
      stdout: 'fooStdout',
      stderr: 'fooStderr'
    });

    const advinstBuilder = new AdvinstBuilder('fooToolPath');
    advinstBuilder.setAipPath('fooAipPath');
    advinstBuilder.setAipBuildName('fooAipBuildName');
    advinstBuilder.setAipPackageName('fooAipPackageName');
    advinstBuilder.setAipOutputDir('fooAipOutputDir');
    advinstBuilder.setAipCommands('fooAipCommands');
    await expect(advinstBuilder.run()).rejects.toThrow('fooStdout');

    expect(AdvinstCommands.prototype.add).toHaveBeenCalledTimes(4);
    expect(exec.getExecOutput).toHaveBeenCalledWith(
      'fooToolPath /execute "fooAipPath" "fooCommandsFile"'
    );
    expect(io.rmRF).toHaveBeenCalledWith('fooCommandsFile');
  });
});
