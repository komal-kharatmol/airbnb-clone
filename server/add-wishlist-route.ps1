$p = "client/src/App.jsx"
$s = Get-Content $p -Raw

if ($s -notmatch "pages/Wishlists") {
    $s = $s -replace "(import HostDashboard from [^\r\n]+;)", "`$1`r`nimport Wishlists from './pages/Wishlists';"
}
if ($s -notmatch 'path="/wishlists"') {
    $s = $s -replace '(<Routes>\s*)', "`$1`r`n          <Route path=""/wishlists"" element={<Wishlists />} />`r`n"
}
Set-Content $p $s
Write-Host "Wishlist route added."
