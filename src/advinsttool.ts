import * as exec from '@actions/exec';
import * as toolCache from '@actions/tool-cache';

import assert from 'assert';
import {existsSync} from 'fs';
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

  private static advinstCacheToolName = 'advinst';

  constructor(version: string, license: string, enableCom: boolean) {
    this.version = version;
    this.license = license;
    this.enableCom = enableCom;
  }

  async getPath(): Promise<string> {
    //Check cache first
    let toolRoot = toolCache.find(
      AdvinstTool.advinstCacheToolName,
      this.version
    );

    //If not in cache, download and extract
    if (!toolRoot) {
      const setup = await this.download();
      toolRoot = await this.extract(setup);
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

    return toolPath;
  }

  private async download(): Promise<string> {
    const url = util.format(
      AdvinstTool.advinstDownloadUrlTemplate,
      this.version
    );
    return await toolCache.downloadTool(url);
  }

  private async extract(setupPath: string): Promise<string> {
    //Extract to agent temp folder
    const extractFolder = join(this.getTempFolder(), 'advinst');
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
      this.version
    );
  }

  private async register(toolPath: string): Promise<void> {
    if (this.license) {
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
      const cmd = util.format(AdvinstTool.advinstStartComCmdTemplate, toolPath);
      const ret = await exec.getExecOutput(cmd);
      if (ret.exitCode !== 0) {
        throw new Error(ret.stdout);
      }
    }
  }

  private getTempFolder(): string {
    const tempDirectory = process.env['RUNNER_TEMP'] || '';
    assert(tempDirectory, 'Expected RUNNER_TEMP to be defined');
    return tempDirectory;
  }
}
