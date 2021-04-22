@echo off

echo Now get raw data (only data)...
set NODE_DLRAW=false
set NODE_DLIMG=false
cd .\AigisLoader\
node .\index.js
pause
