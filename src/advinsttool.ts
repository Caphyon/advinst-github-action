import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as toolCache from '@actions/tool-cache';

import {existsSync} from 'fs';
import {getRunnerTempDir} from './utils';
import {join} from 'path';
import util from 'util';

export class AdvinstTool {
  private version: string;
  private license: string;
  private enableCom: boolean;

  private static advinstDownloadUrlTemplate =
    'https://www.advancedinstaller.com/downloads/%s/advinst.msi';
  private static advinstExtractCmdTemplate =
    'msiexec /a "%s" TARGETDIR="%s" /qn';
  private static advinstRegisterCmdTemplate = '%s /RegisterCI %s';
  private static advinstStartComCmdTemplate = '%s /REGSERVER';
  private static advinstComPathTemplate = '%s\\bin\\x86\\advancedinstaller.com';
  private static asdvinstMsbuildTagetPathTemplate =
    '%s\\ProgramFilesFolder\\MSBuild\\Caphyon\\Advanced Installer';

  private static advinstCacheToolName = 'advinst';
  private static advinstCacheToolArch = 'x86';

  private static advinstMSBuildTargetsVar = 'AdvancedInstallerMSBuildTargets';
  private static advinstToolRootVar = 'AdvancedInstallerRoot';

  constructor(version: string, license: string, enableCom: boolean) {
    this.version = version;
    this.license = license;
    this.enableCom = enableCom;
  }

  async getPath(): Promise<string> {
    //Check cache first
    core.info(`Checking cache for advinst tool with version: ${this.version}`);
    let toolRoot = toolCache.find(
      AdvinstTool.advinstCacheToolName,
      this.version,
      AdvinstTool.advinstCacheToolArch
    );

    //If not in cache, download and extract
    if (!toolRoot) {
      core.info('Tool not found in cache');
      const setup = await this.download();
      toolRoot = await this.extract(setup);
    } else {
      core.info('Tool found in cache');
    }

    //Register and enable COM
    const toolPath = util.format(AdvinstTool.advinstComPathTemplate, toolRoot);
    if (!existsSync(toolPath)) {
      throw new Error(
        util.format('Expected to find %s, but it was not found.', toolPath)
      );
    }
    await this.register(toolPath);
    await this.registerCom(toolPath);
    this.exportVariables(toolRoot);

    return toolPath;
  }

  private async download(): Promise<string> {
    core.info('Downloading advinst tool');
    const url = util.format(
      AdvinstTool.advinstDownloadUrlTemplate,
      this.version
    );
    return await toolCache.downloadTool(url);
  }

  private async extract(setupPath: string): Promise<string> {
    //Extract to agent temp folder
    core.info('Extracting advinst tool');
    const extractFolder = join(getRunnerTempDir(), 'advinst');
    const cmd = util.format(
      AdvinstTool.advinstExtractCmdTemplate,
      setupPath,
      extractFolder
    );
    const ret = await exec.getExecOutput(cmd);
    if (ret.exitCode !== 0) {
      throw new Error(ret.stdout);
    }
    return await toolCache.cacheDir(
      extractFolder,
      AdvinstTool.advinstCacheToolName,
      this.version,
      AdvinstTool.advinstCacheToolArch
    );
  }

  private async register(toolPath: string): Promise<void> {
    if (this.license) {
      core.info('Registering advinst tool');
      const cmd = util.format(
        AdvinstTool.advinstRegisterCmdTemplate,
        toolPath,
        this.license
      );
      const ret = await exec.getExecOutput(cmd);
      if (ret.exitCode !== 0) {
        throw new Error(ret.stdout);
      }
    }
  }

  private async registerCom(toolPath: string): Promise<void> {
    if (this.enableCom) {
      core.info('Enabling advinst COM interface');
      const cmd = util.format(AdvinstTool.advinstStartComCmdTemplate, toolPath);
      const ret = await exec.getExecOutput(cmd);
      if (ret.exitCode !== 0) {
        throw new Error(ret.stdout);
      }
    }
  }

  private exportVariables(toolRoot: string): void {
    core.exportVariable(AdvinstTool.advinstToolRootVar, toolRoot);
    core.exportVariable(
      AdvinstTool.advinstMSBuildTargetsVar,
      util.format(AdvinstTool.asdvinstMsbuildTagetPathTemplate, toolRoot)
    );
  }
}
