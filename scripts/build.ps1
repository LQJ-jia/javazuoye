$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root "out"

if (Test-Path $out) {
    Remove-Item $out -Recurse -Force
}

New-Item -ItemType Directory -Force $out | Out-Null

$sources = Get-ChildItem -Path (Join-Path $root "src\main\java") -Recurse -Filter *.java |
    ForEach-Object { $_.FullName }

$javac = "javac"
if (-not (Get-Command $javac -ErrorAction SilentlyContinue)) {
    $commonJavac = @(
        "C:\Program Files\Java\latest\bin\javac.exe",
        "C:\Program Files\Java\jdk1.8.0_481\bin\javac.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1

    if ($commonJavac) {
        $javac = $commonJavac
    }
}

if (-not (Test-Path $javac) -and -not (Get-Command $javac -ErrorAction SilentlyContinue)) {
    throw "javac was not found. Please install JDK 8 or later and add the JDK bin directory to PATH."
}

& $javac -encoding UTF-8 -d $out $sources

Write-Host "Build finished: $out"
