@echo off

cd .\LocalProxy
echo LocalProxy: npm install
npm install
npm update
cd ..

cd .\AigisLoader
echo AigisChecker: npm install
npm install
npm update
cd ..

md AigisTools

pause