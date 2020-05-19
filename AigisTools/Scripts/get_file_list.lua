-- get_file_list.lua
-- v1.0
-- author: lzlis

local file = require("lib/file")
local dl = require("lib/download")

local out = "out\\files"
local working = "working\\"

if not file.dir_exists(out) then
  file.make_dir(out)
end

local h = assert(io.open("files.txt", 'rb'))
local list = assert(h:read('*a'))
assert(h:close())

local files_text = dl.getlist_raw(list)

h = assert(io.open(out .. "\\files.txt", 'wb'))
assert(h:write(files_text))
assert(h:close())
