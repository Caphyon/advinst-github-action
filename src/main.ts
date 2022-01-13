import * as core from '@actions/core';
import {AdvinstBuilder} from './advinstbuilder';
import {AdvinstTool} from './advinsttool';
import {getLatest} from './advinstversions';
import {isWindows} from './utils';

async function run(): Promise<void> {
  try {
    if (!isWindows()) {
      throw new Error('This action is only supported on Windows platforms');
    }
    const version = core.getInput('advinst-version') || (await getLatest());
    core.debug(`Advinst version: ${version}`);
    const license = core.getInput('advinst-license');
    core.debug(`Advinst license: ${license}`);
    const enable_com = core.getInput('advinst-enable-automation');
    core.debug(`Advinst enable com: ${enable_com}`);

    core.startGroup('Advanced Installer Tool Deploy');
    const advinstTool = new AdvinstTool(
      version,
      license,
      enable_com === 'true'
    );
    const toolPath = await advinstTool.getPath();
    core.endGroup();

    const aipPath = core.getInput('aip-path');
    if (!aipPath) {
      core.debug('No AIP project path provided. Skipping project build step.');
      return;
    }

    core.startGroup(`${aipPath} project build`);
    const advinstRunner = new AdvinstBuilder(toolPath);
    advinstRunner.setAipPath(aipPath);
    advinstRunner.setAipBuildName(core.getInput('aip-build-name'));
    advinstRunner.setAipPackageName(core.getInput('aip-package-name'));
    advinstRunner.setAipOutputDir(core.getInput('aip-output-dir'));
    advinstRunner.setAipCommands(core.getInput('aip-commands'));
    await advinstRunner.run();
    core.endGroup();
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run();
