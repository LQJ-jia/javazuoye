$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root "out"
$lib = Join-Path $root "lib\*"

& (Join-Path $PSScriptRoot "build.ps1")

Set-Location $root
java -Dfile.encoding=UTF-8 -cp "$out;$lib" com.luqinspace.AppServer
