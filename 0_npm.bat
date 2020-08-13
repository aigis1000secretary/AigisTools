@echo off

cd .\LocalProxy
echo LocalProxy: npm install
start npm install
cd ..

cd .\AigisLoader
echo AigisChecker: npm install
start npm install
cd ..

pause