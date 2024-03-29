@echo off

taskkill /f /im node.exe /t

cd .\AigisTools
git pull
cd ..

cd .\LocalProxy
start node .\index.js