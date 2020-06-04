@echo off

echo Now get raw data...
cd .\AigisTools
del .\out\files\cards.txt
start get_Icondata.bat

pause
cd ..\AigisChecker
node .\index.js
pause
