param(
  [string]$BackupDir = "../backups",
  [string]$DbUrl = $env:DATABASE_URL
)

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$filename = "landings-backup-$timestamp.sql.gz"
$backupFile = Join-Path $BackupDir $filename

if (-not (Test-Path $BackupDir)) {
  New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

if (-not $DbUrl) {
  $DbUrl = "postgresql://landings:landings@localhost:5432/landings?schema=public"
}

$env:PGPASSWORD = if ($DbUrl -match 'postgresql://([^:]+):([^@]+)@') { $matches[2] }

& pg_dump $DbUrl --clean --if-exists | & gzip -c > $backupFile

Write-Host "Backup creado: $backupFile"

$oldFiles = Get-ChildItem $BackupDir -Filter "*.sql.gz" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) }
foreach ($f in $oldFiles) {
  Remove-Item $f.FullName
  Write-Host "Backup antiguo eliminado: $($f.Name)"
}
