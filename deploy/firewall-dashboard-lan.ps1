# Restricts the RSP Dashboard to the office LAN and keeps MySQL local.
# Run once in PowerShell as Administrator:
#   powershell -ExecutionPolicy Bypass -File deploy\firewall-dashboard-lan.ps1

$ErrorActionPreference = 'Stop'

# Remove earlier copies so the script can be re-run safely
Get-NetFirewallRule -DisplayName 'RSP Dashboard*', 'RSP Block*' -ErrorAction SilentlyContinue | Remove-NetFirewallRule

# Dashboard: allow inbound TCP 3000 only from the local subnet (office LAN)
New-NetFirewallRule -DisplayName 'RSP Dashboard (LAN only)' `
    -Direction Inbound -Protocol TCP -LocalPort 3000 `
    -RemoteAddress LocalSubnet -Action Allow -Profile Any | Out-Null

# Portal: never accept direct connections; the Cloudflare Tunnel reaches it over loopback
New-NetFirewallRule -DisplayName 'RSP Block Portal Direct' `
    -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Block -Profile Any | Out-Null

# MySQL: never accept connections from other machines
New-NetFirewallRule -DisplayName 'RSP Block MySQL Remote' `
    -Direction Inbound -Protocol TCP -LocalPort 3306 -Action Block -Profile Any | Out-Null

Write-Host 'Firewall rules created:' -ForegroundColor Green
Get-NetFirewallRule -DisplayName 'RSP Dashboard*', 'RSP Block*' | Format-Table DisplayName, Action, Enabled

Write-Host ''
Write-Host 'Also set this in MySQL my.ini under [mysqld], then restart the MySQL service:' -ForegroundColor Yellow
Write-Host '    bind-address = 127.0.0.1'
Write-Host 'If Windows earlier created broad "Node.js" allow rules (from the first-run prompt),' -ForegroundColor Yellow
Write-Host 'remove them in "Windows Defender Firewall with Advanced Security" > Inbound Rules,'
Write-Host 'otherwise they can still allow port 3000 from outside the LAN.'
Write-Host 'Make sure the Wi-Fi/Ethernet network profile is "Private" in Windows Settings,' -ForegroundColor Yellow
Write-Host 'and never connect the office PC directly to the internet without a router.'
