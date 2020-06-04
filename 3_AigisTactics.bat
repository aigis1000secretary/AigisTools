@echo off

echo Now get raw data...
cd .\AigisTools
start get_Mission.bat

cd ..\AigisTactics
node .\index.js
pause
