import * as fs from 'fs';
import * as toolCache from '@actions/tool-cache';
import {ConfigIniParser} from 'config-ini-parser';
import {compareVersions} from 'compare-versions';

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

export async function getMinAllowedAdvinstVersion(): Promise<string | null> {
  const RELEASE_INTERVAL_MONTHS = 24;

  const minReleaseDate = new Date();
  minReleaseDate.setMonth(minReleaseDate.getMonth() - RELEASE_INTERVAL_MONTHS);

  const versionsFile = await toolCache.downloadTool(
    'https://www.advancedinstaller.com/downloads/updates.ini'
  );

  const ini = new ConfigIniParser();
  ini.parse(fs.readFileSync(versionsFile, 'utf8'));
  const sections = ini.sections();
  if (sections.length === 0) {
    throw new Error('Invalid updated config file');
  }

  const r = ini.sections().find(s => {
    const [day, month, year] = ini.get(s, 'ReleaseDate').split('/');
    const releaseDate = new Date(`${year}-${month}-${day}`);
    return minReleaseDate > releaseDate;
  });

  if (!r) {
    return null;
  }
  return ini.get(r, 'ProductVersion');
}

export async function versionIsDeprecated(
  version: string
): Promise<[boolean, string | null]> {
  const minAllowedVer = await getMinAllowedAdvinstVersion();
  const isDeprecated: boolean =
    minAllowedVer !== null && compareVersions(version, minAllowedVer) === -1;
  return [isDeprecated, minAllowedVer];
}
