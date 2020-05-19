@echo off

start node .\LocalProxy\index.js
echo Set proxy 127.0.0.1:8000
echo Login Aigis or AigisR
pause

echo ...
echo Now copying file lists
xcopy .\LocalProxy\AigisTools .\AigisTools /Y /S /I
pause