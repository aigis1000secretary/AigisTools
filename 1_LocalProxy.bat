@echo off

taskkill /f /im node.exe /t

cd .\LocalProxy
start node .\index.js