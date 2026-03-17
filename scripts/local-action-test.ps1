param(
  [string]$AdvinstVersion = "",
  [string]$AdvinstLicense = "",
  [ValidateSet("true", "false")]
  [string]$AdvinstEnableAutomation = "false",
  [string]$AipPath = "",
  [string]$AipBuildName = "",
  [string]$AipPackageName = "",
  [string]$AipOutputDir = "",
  [string]$AipCommands = "",
  [switch]$SkipPre,
  [switch]$SkipMain,
  [switch]$SkipPost
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Set-ActionInput {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [Parameter(Mandatory = $true)]
    [AllowEmptyString()]
    [string]$Value
  )

  $envName = "INPUT_" + ($Name.ToUpperInvariant() -replace " ", "_")
  [System.Environment]::SetEnvironmentVariable($envName, $Value)
}

function Invoke-NodeScript {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [Parameter(Mandatory = $true)]
    [string]$Label
  )

  Write-Host ("==> Running {0}: {1}" -f $Label, $Path)
  & node $Path
  if ($LASTEXITCODE -ne 0) {
    throw "{0} failed with exit code {1}" -f $Label, $LASTEXITCODE
  }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$preScript = Join-Path $repoRoot "dist\pre\index.js"
$mainScript = Join-Path $repoRoot "dist\main\index.js"
$postScript = Join-Path $repoRoot "dist\post\index.js"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js was not found in PATH."
}

foreach ($scriptPath in @($preScript, $mainScript, $postScript)) {
  if (-not (Test-Path $scriptPath)) {
    throw "Missing built action file: $scriptPath. Run 'npm run dist' first."
  }
}

$runnerDir = Join-Path $repoRoot ".tmp\local-action-runner"
$toolCacheDir = Join-Path $repoRoot ".tmp\tool-cache"
New-Item -ItemType Directory -Force -Path $runnerDir | Out-Null
New-Item -ItemType Directory -Force -Path $toolCacheDir | Out-Null

$githubEnvFile = Join-Path $runnerDir "env.txt"
$githubPathFile = Join-Path $runnerDir "path.txt"
$githubOutputFile = Join-Path $runnerDir "output.txt"
$githubStateFile = Join-Path $runnerDir "state.txt"

foreach ($f in @($githubEnvFile, $githubPathFile, $githubOutputFile, $githubStateFile)) {
  if (-not (Test-Path $f)) {
    New-Item -ItemType File -Path $f | Out-Null
  }
}

[System.Environment]::SetEnvironmentVariable("GITHUB_ACTIONS", "true")
[System.Environment]::SetEnvironmentVariable("RUNNER_TEMP", $runnerDir)
[System.Environment]::SetEnvironmentVariable("RUNNER_TOOL_CACHE", $toolCacheDir)
[System.Environment]::SetEnvironmentVariable("GITHUB_WORKSPACE", $repoRoot)
[System.Environment]::SetEnvironmentVariable("GITHUB_ENV", $githubEnvFile)
[System.Environment]::SetEnvironmentVariable("GITHUB_PATH", $githubPathFile)
[System.Environment]::SetEnvironmentVariable("GITHUB_OUTPUT", $githubOutputFile)
[System.Environment]::SetEnvironmentVariable("GITHUB_STATE", $githubStateFile)
[System.Environment]::SetEnvironmentVariable("RUNNER_DEBUG", "1")
[System.Environment]::SetEnvironmentVariable("ADVANCEDINSTALLER_INI_URL", "https://dev.advancedinstaller.com/downloads/updates.ini")

Set-ActionInput -Name "advinst-version" -Value $AdvinstVersion
Set-ActionInput -Name "advinst-license" -Value $AdvinstLicense
Set-ActionInput -Name "advinst-enable-automation" -Value $AdvinstEnableAutomation
Set-ActionInput -Name "aip-path" -Value $AipPath
Set-ActionInput -Name "aip-build-name" -Value $AipBuildName
Set-ActionInput -Name "aip-package-name" -Value $AipPackageName
Set-ActionInput -Name "aip-output-dir" -Value $AipOutputDir
Set-ActionInput -Name "aip-commands" -Value $AipCommands

$mainFailed = $false

try {
  if (-not $SkipPre) {
    Invoke-NodeScript -Path $preScript -Label "pre"
  } else {
    Write-Host "==> Skipping pre"
  }

  if (-not $SkipMain) {
    Invoke-NodeScript -Path $mainScript -Label "main"
  } else {
    Write-Host "==> Skipping main"
  }
} catch {
  $mainFailed = $true
  Write-Error $_
} finally {
  if (-not $SkipPost) {
    try {
      Invoke-NodeScript -Path $postScript -Label "post"
    } catch {
      Write-Error $_
      if (-not $mainFailed) {
        throw
      }
    }
  } else {
    Write-Host "==> Skipping post"
  }
}

Write-Host ""
Write-Host "Runner files:"
Write-Host ("  RUNNER_TOOL_CACHE: {0}" -f $toolCacheDir)
Write-Host ("  GITHUB_ENV: {0}" -f $githubEnvFile)
Write-Host ("  GITHUB_PATH: {0}" -f $githubPathFile)
Write-Host ("  GITHUB_OUTPUT: {0}" -f $githubOutputFile)
Write-Host ("  GITHUB_STATE: {0}" -f $githubStateFile)

if ($mainFailed) {
  exit 1
}

Write-Host "Local action run completed successfully."
