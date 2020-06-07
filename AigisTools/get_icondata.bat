@ECHO off
SET PATH=%~dp0Utilities\Lua 5.3;%~dp0Utilities\cURL\bin;%~dp0Utilities\GraphicsMagick;%PATH%
SET LUA_PATH=%~dp0Scripts\?.lua
SET LUA_PATH_5_3=%~dp0Scripts\?.lua

lua Scripts\get_file_list.lua

lua Scripts\get_file.lua PlayerUnitTable.aar

lua Scripts\get_file.lua ico_00.aar
lua Scripts\get_file.lua ico_01.aar
lua Scripts\get_file.lua ico_02.aar
lua Scripts\get_file.lua ico_03.aar
lua Scripts\parse_cards.lua > out\files\cards.txt

pause
exit