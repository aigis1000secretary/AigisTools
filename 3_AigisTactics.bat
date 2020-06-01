@echo off

echo Now get raw data...
cd .\AigisTools
del .\out\files\missions.txt
start get_Mission.bat

cd ..\AigisTactics
node .\index.js
pause
