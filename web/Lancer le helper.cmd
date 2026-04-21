@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Demarrage du serveur (accessible aussi sur le telephone en WiFi)...
echo.
echo  Sur le telephone, ouvre : http://TON_IP:8080  (voir IPv4 ci-dessous)
ipconfig | findstr /i "IPv4"
echo.
start "Serveur Warhammer Helper" /D "%~dp0" cmd /k "python -m http.server 8080"
timeout /t 2 /nobreak >nul
start "" "http://localhost:8080/"
echo Navigateur ouvert sur ce PC (localhost).
echo Garde la fenetre du serveur ouverte. Sur le telephone : meme WiFi, URL avec l'IP ci-dessus.
echo.
pause
