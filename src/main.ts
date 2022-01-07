import * as core from '@actions/core';
import {AdvinstTool} from './advinsttool';
import {getLatest} from './advinstversions';

async function run(): Promise<void> {
  try {
    const version = core.getInput('advinst-version') || (await getLatest());
    core.debug(`Advinst version: ${version}`);
    const license = core.getInput('advinst-license');
    core.debug(`Advinst license: ${license}`);
    const enable_com = core.getInput('advinst-enable-com');
    core.debug(`Advinst enable com: ${enable_com}`);
    const advinstTool = new AdvinstTool(
      version,
      license,
      enable_com === 'true'
    );

    const toolPath = await advinstTool.getPath();
    core.debug(`Advinst tool path: ${toolPath}`);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run();
