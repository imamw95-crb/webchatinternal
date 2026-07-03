# Reverb Auto-Restart Watcher
# Script ini akan menjalankan Reverb dan otomatis restart jika crash.
# Jalankan: powershell -ExecutionPolicy Bypass -File reverb-watch.ps1

$reverbDir = $PSScriptRoot
$logFile = Join-Path $reverbDir "storage\logs\reverb-watch.log"
$restartCount = 0

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Reverb Auto-Restart Watcher" -ForegroundColor Cyan
Write-Host "  Direktori: $reverbDir" -ForegroundColor Cyan
Write-Host "  Log: $logFile" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

while ($true) {
    $restartCount++
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    Write-Host "[$timestamp] Memulai Reverb (percobaan ke-$restartCount)..." -ForegroundColor Yellow
    Add-Content -Path $logFile -Value "[$timestamp] Starting Reverb (attempt #$restartCount)..."
    
    try {
        # Jalankan Reverb dan tunggu sampai selesai (crash/exit)
        $process = Start-Process -FilePath "php" -ArgumentList "artisan reverb:start --debug" -WorkingDirectory $reverbDir -NoNewWindow -PassThru -RedirectStandardOutput "$reverbDir\storage\logs\reverb-output.tmp" -RedirectStandardError "$reverbDir\storage\logs\reverb-error.tmp"
        
        Write-Host "[$timestamp] Reverb berjalan (PID: $($process.Id))" -ForegroundColor Green
        Add-Content -Path $logFile -Value "[$timestamp] Reverb is running (PID: $($process.Id))"
        
        # Tunggu proses selesai
        $process.WaitForExit()
        
        $exitCode = $process.ExitCode
        $crashTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        
        Write-Host "[$crashTime] Reverb berhenti (exit code: $exitCode)" -ForegroundColor Red
        Add-Content -Path $logFile -Value "[$crashTime] Reverb stopped (exit code: $exitCode)"
        
        # Log output jika ada error
        if (Test-Path "$reverbDir\storage\logs\reverb-error.tmp") {
            $errorContent = Get-Content "$reverbDir\storage\logs\reverb-error.tmp" -Tail 10
            if ($errorContent) {
                Write-Host "  Error output:" -ForegroundColor DarkRed
                $errorContent | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkRed }
                Add-Content -Path $logFile -Value "  Error: $errorContent"
            }
        }
    }
    catch {
        $errTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Write-Host "[$errTime] Gagal menjalankan Reverb: $_" -ForegroundColor Red
        Add-Content -Path $logFile -Value "[$errTime] Failed to start Reverb: $_"
    }
    
    # Tunggu 3 detik sebelum restart
    Write-Host "  Restart dalam 3 detik..." -ForegroundColor Gray
    Start-Sleep -Seconds 3
}
