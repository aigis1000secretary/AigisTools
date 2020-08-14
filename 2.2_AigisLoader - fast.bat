@echo off

echo Now get raw data (fast)...
set NODE_DLRAW=true
set NODE_DLIMG=false
node .\AigisLoader\index.js
pause
