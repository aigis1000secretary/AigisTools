@echo off

echo Now get raw data (only data)...
set NODE_DLRAW=false
set NODE_DLIMG=false
node .\AigisLoader\index.js
pause