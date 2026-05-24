Add-Type -AssemblyName System.Drawing

$root = "C:\Users\User\Desktop\projet\lifeos\public"

function New-Icon {
    param([int]$Size, [string]$Name)
    $path = Join-Path $root $Name
    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)

    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Point(0,0)),
        (New-Object System.Drawing.Point($Size, $Size)),
        [System.Drawing.Color]::FromArgb(99,102,241),
        [System.Drawing.Color]::FromArgb(79,70,229)
    )
    $g.SmoothingMode = 'HighQuality'
    $g.FillEllipse($brush, 0, 0, $Size-1, $Size-1)

    $fs = [System.Drawing.Font]::new('Segoe UI', $Size*0.55, [System.Drawing.FontStyle]::Bold)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = 'Center'
    $sf.LineAlignment = 'Center'
    $g.DrawString('L', $fs, [System.Drawing.Brushes]::White, $Size/2, $Size/2, $sf)
    $fs.Dispose()
    $sf.Dispose()
    $brush.Dispose()
    $g.Dispose()
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

New-Icon 256 'icon.png'
New-Icon 192 'pwa-192x192.png'
New-Icon 512 'pwa-512x512.png'

Write-Host 'Done:'
Get-ChildItem (Join-Path $root 'icon.png'), (Join-Path $root 'pwa-*.png') | Select-Object Name, Length
