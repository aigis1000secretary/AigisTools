@echo off

cd .\LocalProxy
echo LocalProxy: npm install
start npm install
cd ..

cd .\AigisChecker
echo AigisChecker: npm install
start npm install
cd ..

pause