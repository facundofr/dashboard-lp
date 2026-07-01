param(
  [string]$BackupDir = "../backups",
  [string]$DbPath = "../server/prisma/dev.db"
)

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$filename = "landings-backup-$timestamp.db"
$backupFile = Join-Path $BackupDir $filename

if (-not (Test-Path $BackupDir)) {
  New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

if (Test-Path $DbPath) {
  Copy-Item $DbPath $backupFile
  Write-Host "✅ Backup creado: $backupFile"
} else {
  Write-Host "❌ Base de datos no encontrada: $DbPath"
}

# Limpiar backups viejos (>30 días)
$oldFiles = Get-ChildItem $BackupDir -Filter "*.db" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) }
foreach ($f in $oldFiles) {
  Remove-Item $f.FullName
  Write-Host "🗑️ Backup antiguo eliminado: $($f.Name)"
}
