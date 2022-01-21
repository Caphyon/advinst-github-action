import {AdvinstCommands} from '../src/advinstcommands';
import * as utils from '../src/utils';
jest.mock('../src/utils');
const mockUtils: jest.Mocked<typeof utils> = <jest.Mocked<typeof utils>>utils;

import fs from 'fs/promises';
import {format} from 'path';
jest.mock('fs/promises');
const mockFS: jest.Mocked<typeof fs> = <jest.Mocked<typeof fs>>fs;

test('Test getCommandsFile', async () => {
  mockFS.writeFile.mockImplementation(jest.fn());
  mockUtils.getRunnerTempDir.mockReturnValue('fooRunnerTmpDir');
  mockUtils.getVariable.mockReturnValue('fooGitHubRunId');
  const advinstCommands = new AdvinstCommands(['foo1', 'foo2']);
  advinstCommands.add(['bar1', 'bar2']);
  const aicContent = ';aic;\r\nfoo1\r\nfoo2\r\nbar1\r\nbar2';

  const commandsFile = format({
    dir: 'fooRunnerTmpDir',
    ext: '.aic',
    name: 'fooGitHubRunId'
  });

  const result = await advinstCommands.toCommandsFile();
  expect(result).toBe(commandsFile);
  expect(mockFS.writeFile).toHaveBeenCalledWith(commandsFile, aicContent, {
    encoding: 'utf8'
  });
});
