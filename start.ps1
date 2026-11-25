$portable = Join-Path $env:LOCALAPPDATA "node-portable\node-v26.13.1-win-x64"
if (Test-Path (Join-Path $portable "node.exe")) {
  $env:Path = "$portable;" + $env:Path
}
$env:NODE_OPTIONS = "--use-system-ca"
npm run dev
