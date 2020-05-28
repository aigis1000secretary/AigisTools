@ECHO off
SET PATH=%~dp0Utilities\Lua 5.3;%~dp0Utilities\cURL\bin;%~dp0Utilities\GraphicsMagick;%PATH%
SET LUA_PATH=%~dp0Scripts\?.lua
SET LUA_PATH_5_3=%~dp0Scripts\?.lua

lua Scripts\get_file_list.lua

lua Scripts\get_file.lua HarlemEventText0.aar
lua Scripts\get_file.lua HarlemEventText1.aar
lua Scripts\get_file.lua HarlemText.aar
lua Scripts\get_file.lua prev03.aar

pause
exit