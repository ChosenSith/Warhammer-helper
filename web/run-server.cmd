@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  Sur ce PC : http://localhost:8080
echo.
echo  Sur ton telephone (meme WiFi que ce PC) : http://ADRESSE_CI_DESSOUS:8080
echo  Adresses IPv4 de ce PC :
ipconfig | findstr /i "IPv4"
echo.
echo  Si le telephone ne charge pas la page : Pare-feu Windows ^> autoriser Python
echo  sur le reseau prive, ou ouvre le port 8080 en entrant.
echo.
echo  Ferme cette fenetre pour arreter le serveur.
echo.
python -m http.server 8080
if errorlevel 1 (
  echo.
  echo  Python introuvable ? Installe Python ou : npx --yes serve -l 8080
  pause
)
