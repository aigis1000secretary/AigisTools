@echo off

echo Now get raw data...
cd .\AigisTools
start get_Mission.bat
pause

cd ..\AigisTactics
node .\index.js
pause
