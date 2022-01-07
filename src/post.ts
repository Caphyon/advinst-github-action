import * as core from '@actions/core';
import * as io from '@actions/io';

import {getVariable} from './utils';
import {join} from 'path';

async function run(): Promise<void> {
  try {
    core.info('Clanup....');

    const licenseFile = join(
      getVariable('ProgramData'),
      'Caphyon\\Advanced Installer\\license80.dat'
    );
    core.info(`Removing license file: ${licenseFile}`);
    await io.rmRF(licenseFile);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run();
