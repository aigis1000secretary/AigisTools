@echo off

echo Now get raw data (fast)...
set NODE_DLRAW=true
set NODE_DLIMG=false
cd .\AigisLoader
node .\index.js
pause
