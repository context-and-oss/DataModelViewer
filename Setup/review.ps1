param(
    [ValidateRange(1024,65535)][int]$Port = 3001,
    [switch]$Check,
    [switch]$PrepareOnly
)
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$website = Join-Path $repo 'Website'
$sample = Join-Path $PSScriptRoot 'review-sample/Data.ts'
$checksumFile = Join-Path $PSScriptRoot 'review-sample/SHA256SUMS.txt'
if (-not (Test-Path $sample) -or -not (Test-Path $checksumFile)) {
    throw 'The reviewed sample is missing. Use the complete reviewer branch, including Setup/review-sample.'
}
$expectedSample = ((Get-Content $checksumFile | Where-Object { $_ -match '\s+Data\.ts$' }) -split '\s+')[0]
if ($expectedSample -notmatch '^[a-fA-F0-9]{64}$' -or (Get-FileHash $sample -Algorithm SHA256).Hash -ne $expectedSample) {
    throw 'The sample checksum does not match Setup/review-sample/SHA256SUMS.txt.'
}
if ($env:OS -ne 'Windows_NT' -or -not [Environment]::Is64BitOperatingSystem) {
    throw 'This launcher requires 64-bit Windows. See Setup/REVIEW.md for manual setup on other systems.'
}
$local = Join-Path $repo '.review'
$runtime = Join-Path $local 'runtime'
$version = 'v22.23.2'
$nodeDir = Join-Path $runtime "node-$version-win-x64"
$node = Join-Path $nodeDir 'node.exe'
$npm = Join-Path $nodeDir 'node_modules/npm/bin/npm-cli.js'
New-Item -ItemType Directory -Force $local, $runtime | Out-Null
if (-not (Test-Path $node)) {
    $archiveName = "node-$version-win-x64.zip"
    $archive = Join-Path $runtime $archiveName
    $base = "https://nodejs.org/dist/$version"
    Write-Host "Downloading Node $version into .review/runtime..."
    Invoke-WebRequest "$base/$archiveName" -OutFile $archive -UseBasicParsing
    $sums = (Invoke-WebRequest "$base/SHASUMS256.txt" -UseBasicParsing).Content
    $expected = (($sums -split "`n" | Where-Object { $_.Trim().EndsWith($archiveName) }) -split '\s+')[0]
    if ($expected -notmatch '^[a-fA-F0-9]{64}$' -or (Get-FileHash $archive -Algorithm SHA256).Hash -ne $expected) {
        throw 'Node download checksum mismatch.'
    }
    Expand-Archive -LiteralPath $archive -DestinationPath $runtime -Force
}
if ((& $node --version) -ne $version) { throw "Expected Node $version." }
function Invoke-ReviewNpm {
    & $node $npm @args
    if ($LASTEXITCODE -ne 0) { throw "npm failed (exit $LASTEXITCODE)." }
}
$variables = @('PATH','npm_config_cache','NEXT_TELEMETRY_DISABLED','WebsitePassword','WebsiteSessionSecret','AUTH_SECRET','AUTH_TRUST_HOST','ENABLE_ENTRAID_AUTH','DISABLE_PASSWORD_AUTH')
$previous = @{}
foreach ($name in $variables) { $previous[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }
Push-Location $website
try {
    $env:PATH = "$nodeDir;$env:PATH"
    $env:npm_config_cache = Join-Path $local 'npm-cache'
    $env:NEXT_TELEMETRY_DISABLED = '1'
    $sessionPath = Join-Path $local 'session.json'
    if (-not (Test-Path $sessionPath)) {
        $bytes = New-Object byte[] 48
        $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
        try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
        @{ Password = [Guid]::NewGuid().ToString('N').Substring(0,12); Secret = [Convert]::ToBase64String($bytes) } | ConvertTo-Json | Set-Content $sessionPath
    }
    $session = Get-Content $sessionPath -Raw | ConvertFrom-Json
    $env:WebsitePassword = $session.Password
    $env:WebsiteSessionSecret = $session.Secret
    $env:AUTH_SECRET = $session.Secret
    $env:AUTH_TRUST_HOST = 'true'
    $env:ENABLE_ENTRAID_AUTH = 'false'
    $env:DISABLE_PASSWORD_AUTH = 'false'
    New-Item -ItemType Directory -Force 'generated' | Out-Null
    Copy-Item -LiteralPath $sample -Destination 'generated/Data.ts' -Force
    Copy-Item -LiteralPath 'stubs/Introduction.md' -Destination 'generated/Introduction.md' -Force
    $lockHash = (Get-FileHash 'package-lock.json' -Algorithm SHA256).Hash
    $marker = Join-Path $local 'dependencies.sha256'
    if (-not (Test-Path 'node_modules/next/package.json') -or -not (Test-Path $marker) -or (Get-Content $marker -Raw).Trim() -ne $lockHash) {
        Invoke-ReviewNpm ci
        Set-Content $marker $lockHash
    }
    if ($PrepareOnly) { Write-Host 'Reviewer dependencies and sample are ready.'; return }
    if ($Check) {
        Invoke-ReviewNpm run lint
        Invoke-ReviewNpm run build
        return
    }
    Write-Host "Open http://localhost:$Port/metadata after Next reports Ready. The first route can take a minute."
    Write-Host "Local review password: $($session.Password)"
    Write-Host 'Stop this preview with Ctrl+C.'
    $devArguments = @('run', 'dev', '--', '--hostname', '127.0.0.1', '--port', [string]$Port)
    & $node $npm @devArguments
    if ($LASTEXITCODE -ne 0) { throw "Preview failed (exit $LASTEXITCODE)." }
} finally {
    Pop-Location
    foreach ($name in $variables) { [Environment]::SetEnvironmentVariable($name, $previous[$name], 'Process') }
}
