import * as core from '@actions/core';

async function run(): Promise<void> {
  try {
    const version = core.getInput('advinst-version');
    core.info(`Advinst version: ${version}`);
    const license = core.getInput('advinst-license');
    core.info(`Advinst license: ${license}`);
    const enable_com = core.getBooleanInput('advinst-license-url');
    core.info(`Advinst license url: ${enable_com}`);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run();
