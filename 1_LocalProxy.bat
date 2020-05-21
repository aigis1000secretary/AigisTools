@echo off

cd .\LocalProxy
start node .\index.js
cd..
echo Set proxy 127.0.0.1:8000
echo Login Aigis or AigisR
pause

echo ...
echo Now copying file lists
xcopy .\LocalProxy\AigisTools .\AigisTools /Y /S /I
pause