# Supabase Init Script for Windows
# Usage: ./scripts/supabase-init.ps1 <project-ref> <db-password>

param (
    [string]$ProjectRef,
    [string]$DbPassword
)

if (-not (Get-Command "supabase" -ErrorAction SilentlyContinue)) {
    Write-Error "Supabase CLI is not installed. Run 'scoop install supabase' or 'npm install -g supabase'."
    exit 1
}

if (-not $ProjectRef) {
    $ProjectRef = Read-Host "Enter Supabase Project Reference ID"
}

if (-not $DbPassword) {
    $DbPassword = Read-Host "Enter Supabase DB Password" -AsSecureString
    $DbPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($DbPassword))
}

Write-Host "Linking project..."
supabase link --project-ref $ProjectRef --password $DbPassword

Write-Host "Pushing migrations..."
supabase db push --password $DbPassword

Write-Host "Done! You can now run 'npm run db:seed' to populate data."
