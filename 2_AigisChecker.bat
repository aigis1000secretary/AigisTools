@echo off

echo Now get raw data...
cd .\AigisTools
start get_Icondata.bat
pause

cd ..\AigisChecker
node .\index.js
pause
