import * as core from '@actions/core';

async function run(): Promise<void> {
  try {
    core.info('Validate input....');

    const aipPath = core.getInput('aip-path');
    if (!aipPath) {
      core.debug(
        'No AIP project path provided. Skipping rest of input validation'
      );
      return;
    }
    const aipBuildName = core.getInput('aip-build-name');
    const aipPackageName = core.getInput('aip-package-name');
    const aipOutputDir = core.getInput('aip-output-dir');

    if (aipPackageName && !aipBuildName) {
      throw new Error(
        'aip-package-name provided but no aip-build-name. Please provide both or neither.'
      );
    }

    if (aipOutputDir && !aipBuildName) {
      throw new Error(
        'aip-output-dir provided but no aip-build-name. Please provide both or neither.'
      );
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run();
