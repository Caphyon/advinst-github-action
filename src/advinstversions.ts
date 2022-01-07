import * as fs from 'fs';
import * as toolCache from '@actions/tool-cache';
import {ConfigIniParser} from 'config-ini-parser';

export async function getLatest(): Promise<string> {
  const versions = await getAll();
  return versions[0];
}

export async function getAll(): Promise<string[]> {
  const versionsFile = await toolCache.downloadTool(
    'https://www.advancedinstaller.com/downloads/updates.ini'
  );

  const ini = new ConfigIniParser();
  ini.parse(fs.readFileSync(versionsFile, 'utf8'));
  const sections = ini.sections();
  if (sections.length === 0) {
    throw new Error('Invalid updated config file');
  }
  const versions: string[] = [];
  for (const section of sections) {
    versions.push(ini.get(section, 'ProductVersion'));
  }
  return versions;
}
