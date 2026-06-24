param(
  [string]$Path = ".env.local"
)

$resolvedPath = Resolve-Path -LiteralPath $Path -ErrorAction SilentlyContinue
if (-not $resolvedPath) {
  throw "Environment file not found: $Path. Copy .env.example to .env.local and fill the values first."
}

Get-Content -LiteralPath $resolvedPath | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith("#")) {
    return
  }

  $separator = $line.IndexOf("=")
  if ($separator -le 0) {
    return
  }

  $name = $line.Substring(0, $separator).Trim()
  $value = $line.Substring($separator + 1).Trim()

  if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
    $value = $value.Substring(1, $value.Length - 2)
  }

  [Environment]::SetEnvironmentVariable($name, $value, "Process")
}

Write-Host "Loaded Cloudflare environment from $resolvedPath"

