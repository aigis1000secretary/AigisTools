@echo off

echo Now copying icon files
xcopy .\AigisTools\out\files\ico_00.aar .\AigisChecker\Resources\ico_00.aar /Y /S /I
xcopy .\AigisTools\out\files\PlayerUnitTable.aar .\AigisChecker\Resources\PlayerUnitTable.aar /Y /S /I
copy .\AigisTools\out\files\cards.txt .\AigisChecker\Resources\cards.txt /Y
pause