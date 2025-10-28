param([switch]$DryRun)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path .).Path
Write-Host "Repo root: $root"

# Ensure src exists
$srcRoot = Join-Path $root 'src'
if (!(Test-Path $srcRoot)) { New-Item -ItemType Directory $srcRoot | Out-Null }

# Folders to fold under src
$folders = @('components','hooks','lib','pages','services','store')

foreach ($name in $folders) {
  $from = Join-Path $root $name
  if (!(Test-Path $from)) { continue }

  $to = Join-Path $srcRoot $name
  if (!(Test-Path $to)) { New-Item -ItemType Directory $to | Out-Null }

  Write-Host ">> Moving $name → src/$name"
  Get-ChildItem -Path $from -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($from.Length).TrimStart('\','/')
    $dest = Join-Path $to $rel
    $destDir = Split-Path $dest -Parent
    if (!(Test-Path $destDir)) { New-Item -ItemType Directory $destDir | Out-Null }
    if (Test-Path $dest) {
      # name conflict → keep both (mark as .dupe)
      $dest = [System.IO.Path]::ChangeExtension($dest, ($_.Extension + '.dupe'))
    }
    if (-not $DryRun) { Move-Item $_.FullName $dest -Force }
    Write-Host "   - $rel"
  }
}

# Move App.tsx → src/App.tsx (backup existing)
$rootApp = Join-Path $root 'App.tsx'
$srcApp  = Join-Path $srcRoot 'App.tsx'
if (Test-Path $rootApp) {
  if (Test-Path $srcApp) { Move-Item $srcApp "$srcApp.bak" -Force }
  Move-Item $rootApp $srcApp -Force
  Write-Host ">> Moved App.tsx → src/App.tsx"
}

# If a root AuthCallback.tsx exists, archive it (you already have src/pages/AuthCallback.tsx)
$rootAuth = Join-Path $root 'AuthCallback.tsx'
if (Test-Path $rootAuth) {
  $keep = Join-Path $root '_tidy_keep'
  if (!(Test-Path $keep)) { New-Item -ItemType Directory $keep | Out-Null }
  Move-Item $rootAuth (Join-Path $keep 'AuthCallback.root.tsx') -Force
  Write-Host ">> Archived root AuthCallback.tsx → _tidy_keep"
}

# Remove now-empty top-level folders
foreach ($name in $folders) {
  $maybe = Join-Path $root $name
  if (Test-Path $maybe) {
    if (-not (Get-ChildItem $maybe -Recurse -File)) {
      Remove-Item $maybe -Recurse -Force
      Write-Host ">> Removed empty $name/"
    }
  }
}

# Rewrite imports → '@/...'
Write-Host ">> Rewriting import paths to '@/…'"
$files = Get-ChildItem -Recurse -Include *.ts,*.tsx -File $srcRoot, $root
$patterns = @(
  @{ from='from\s+["'']@/src/'; to='from "@/' },
  @{ from='from\s+["'']\./src/'; to='from "@/' },
  @{ from='from\s+["'']\.\./src/'; to='from "@/' },

  @{ from='from\s+["'']\./components/'; to='from "@/components/' },
  @{ from='from\s+["'']\.\./components/'; to='from "@/components/' },

  @{ from='from\s+["'']\./hooks/'; to='from "@/hooks/' },
  @{ from='from\s+["'']\.\./hooks/'; to='from "@/hooks/' },

  @{ from='from\s+["'']\./lib/'; to='from "@/lib/' },
  @{ from='from\s+["'']\.\./lib/'; to='from "@/lib/' },

  @{ from='from\s+["'']\./pages/'; to='from "@/pages/' },
  @{ from='from\s+["'']\.\./pages/'; to='from "@/pages/' },

  @{ from='from\s+["'']\./services/'; to='from "@/services/' },
  @{ from='from\s+["'']\.\./services/'; to='from "@/services/' },

  @{ from='from\s+["'']\./store/'; to='from "@/store/' },
  @{ from='from\s+["'']\.\./store/'; to='from "@/store/' },

  @{ from='from\s+["'']\./SupabaseClient'; to='from "@/SupabaseClient' },
  @{ from='from\s+["'']\.\./SupabaseClient'; to='from "@/SupabaseClient' }
)

foreach ($f in $files) {
  $text = Get-Content $f.FullName -Raw
  $orig = $text
  foreach ($p in $patterns) { $text = [regex]::Replace($text, $p.from, $p.to) }
  if ($text -ne $orig) {
    Set-Content -Path $f.FullName -Value $text -Encoding UTF8
    Write-Host "   ~ fixed imports: $($f.FullName.Substring($root.Length+1))"
  }
}

# index.tsx: import App from src + css from src
$indexFile = Join-Path $root 'index.tsx'
if (Test-Path $indexFile) {
  $txt = Get-Content $indexFile -Raw
  $txt = $txt -replace "from\s+['""]\.\/App['""]", "from './src/App'"
  $txt = $txt -replace "import\s+['""]\.\/index\.css['""]", "import './src/index.css'"
  Set-Content $indexFile $txt -Encoding UTF8
  Write-Host ">> Re-linked index.tsx → ./src/App & ./src/index.css"
}

Write-Host "✅ Tidy complete. Restart dev server + TS server."
